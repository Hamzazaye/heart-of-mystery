/**
 * Cloudflare Pages Function: POST /api/interactions
 * Hardened Edge Proxy for "قلب الغموض" (Heart of Mystery):
 * - Injects context.env.GEMINI_API_KEY at the Cloudflare Edge so the API key is NEVER exposed in client code.
 * - Enforces strict model allowlisting, payload size caps (28KB), and per-IP rate limiting to prevent open-proxy abuse.
 */

const ALLOWED_MODELS = new Set([
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.8-flash-lite-tts',
  'gemini-3.8-flash-tts',
  'gemini-3.1-flash-tts-preview',
  'gemini-2.5-flash-preview-tts',
  'gemini-2.5-pro-preview-tts',
  'gemini-4-argon'
]);

const MAX_PAYLOAD_BYTES = 28 * 1024;
const edgeRateMap = new Map();

function checkEdgeRateLimit(ip) {
  const now = Date.now();
  const rec = edgeRateMap.get(ip);
  if (!rec || now - rec.start > 60000) {
    edgeRateMap.set(ip, { start: now, count: 1 });
    return false;
  }
  rec.count += 1;
  return rec.count > 28;
}

export async function onRequestOptions(context) {
  const allowedOrigin = context.env?.ALLOWED_ORIGIN || '*';
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-goog-api-key'
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const allowedOrigin = env?.ALLOWED_ORIGIN || '*';

  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    'unknown';

  if (checkEdgeRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'rate_limit_exceeded',
          message: 'تم تجاوز الحد المسموح من الطلبات في الدقيقة. يرجى الانتظار لحظات.'
        }
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': allowedOrigin
        }
      }
    );
  }

  // Key is read strictly from Cloudflare Encrypted Secret Environment (context.env.GEMINI_API_KEY)
  const effectiveApiKey = String(env?.GEMINI_API_KEY || '').trim();

  if (!effectiveApiKey) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'authentication',
          message: 'لم يتم إعداد GEMINI_API_KEY في متغيرات بيئة الخادم الآمنة (Cloudflare Secret).'
        }
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': allowedOrigin
        }
      }
    );
  }

  try {
    const bodyText = await request.text();
    if (bodyText.length > MAX_PAYLOAD_BYTES) {
      return new Response(
        JSON.stringify({
          error: { code: 'invalid_request', message: 'حجم الطلب يتجاوز الحد المسموح (28KB).' }
        }),
        {
          status: 413,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': allowedOrigin
          }
        }
      );
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(bodyText);
    } catch (_) {
      return new Response(
        JSON.stringify({ error: { code: 'invalid_request', message: 'صيغة JSON غير صالحة.' } }),
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    // 1. Model Allowlist Enforcement
    const requestedModel = String(parsedBody.model || 'gemini-3.5-flash-lite').trim();
    if (!ALLOWED_MODELS.has(requestedModel)) {
      parsedBody.model = 'gemini-3.5-flash-lite';
    }

    // 2. Input Length & Anti-Open-Proxy Guard when using Server Key
    if (typeof parsedBody.input === 'string' && parsedBody.input.length > 4800) {
      parsedBody.input = parsedBody.input.slice(0, 4800);
    }
    const inputText = typeof parsedBody.input === 'string' ? parsedBody.input : '';

    const isTtsRequest =
      requestedModel.includes('tts') ||
      parsedBody?.response_format?.type === 'audio' ||
      Array.isArray(parsedBody.response_modalities);
    if (!isTtsRequest) {
      const sysInst = String(parsedBody.system_instruction || '');
      if (!sysInst.includes('قلب الغموض') && inputText !== 'قل: متصل') {
        parsedBody.system_instruction =
          'أنت الروائي الرسمي للعبة التحقيق الجنائي التفاعلية "قلب الغموض". التزم حصريا ببيانات القضية المقفلة (Case Bible) ولا تخرج عن سياق التحقيق البوليسي.';
      }
    }

    const sanitizedBody = JSON.stringify(parsedBody);

    // 3. Cloudflare Global Edge Cache for TTS Requests (Zero Quota Consumption on Repeated Audio!)
    let edgeCache = null;
    let edgeCacheReq = null;
    if (isTtsRequest && typeof caches !== 'undefined' && caches.default && crypto?.subtle) {
      try {
        edgeCache = caches.default;
        const hashBuf = await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(sanitizedBody)
        );
        const hashHex = Array.from(new Uint8Array(hashBuf))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        edgeCacheReq = new Request(
          `https://tts-edge-cache.labyrinth-of-shadows.internal/v1/${hashHex}`,
          { method: 'GET' }
        );
        const cachedHit = await edgeCache.match(edgeCacheReq);
        if (cachedHit) {
          const hitText = await cachedHit.text();
          return new Response(hitText, {
            status: 200,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Access-Control-Allow-Origin': allowedOrigin,
              'X-Edge-TTS-Cache': 'HIT'
            }
          });
        }
      } catch (_) {}
    }

    const upstreamRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/interactions?key=${encodeURIComponent(effectiveApiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: sanitizedBody
      }
    );

    const responseText = await upstreamRes.text();

    if (isTtsRequest && upstreamRes.ok && edgeCache && edgeCacheReq && responseText.includes('"audio"')) {
      try {
        const toCache = new Response(responseText, {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=2592000, s-maxage=2592000'
          }
        });
        if (typeof context.waitUntil === 'function') {
          context.waitUntil(edgeCache.put(edgeCacheReq, toCache));
        } else {
          await edgeCache.put(edgeCacheReq, toCache);
        }
      } catch (_) {}
    }

    return new Response(responseText, {
      status: upstreamRes.status,
      headers: {
        'Content-Type': upstreamRes.headers.get('content-type') || 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': allowedOrigin,
        'X-Edge-TTS-Cache': isTtsRequest ? 'MISS' : 'BYPASS'
      }
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'network_error',
          message: err.message || 'Cloudflare Edge upstream error'
        }
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': allowedOrigin
        }
      }
    );
  }
}
