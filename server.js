const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

/**
 * Load environment variables from .env file if present (Zero-dependency loader)
 * So the developer can store GEMINI_API_KEY in .env on the server without exposing it to the browser.
 */
function loadDotEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  try {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (key && !process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch (err) {
    console.warn('Warning: Could not parse .env file:', err.message);
  }
}

loadDotEnv();

// Persistent HTTPS agent with keep-alive for much faster consecutive API requests
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 25,
  keepAliveMsecs: 30000
});

// Simple per-IP rate limiter to protect your server API key quota when hosted publicly
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQ = Number(process.env.RATE_LIMIT_PER_MINUTE) || 35;
const ipRequestMap = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const record = ipRequestMap.get(ip);
  if (!record || now - record.start > RATE_LIMIT_WINDOW_MS) {
    ipRequestMap.set(ip, { start: now, count: 1 });
    return false;
  }
  record.count += 1;
  return record.count > RATE_LIMIT_MAX_REQ;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

// Block sensitive server files from ever being downloaded via the static file handler
const BLOCKED_FILES = new Set([
  'server.js',
  'package.json',
  'package-lock.json',
  '.env',
  '.env.local',
  '.env.example',
  '.gitignore',
  'vercel.json'
]);

const server = http.createServer((req, res) => {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-goog-api-key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Public Status Endpoint (/api/config) — Tells frontend if a server-side key is configured
  //    NEVER returns or exposes the actual API key string!
  if (req.method === 'GET' && req.url.startsWith('/api/config')) {
    const hasServerKey = Boolean(
      process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 15
    );
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(
      JSON.stringify({
        serverManagedKey: hasServerKey,
        defaultModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash'
      })
    );
    return;
  }

  // 2. Secure Proxy for Google AI Studio API (/api/interactions)
  //    Injects process.env.GEMINI_API_KEY on the server side so the key is NEVER in client code or DevTools!
  if (req.method === 'POST' && req.url.startsWith('/api/interactions')) {
    const clientIp =
      (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown';

    if (isRateLimited(clientIp)) {
      res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(
        JSON.stringify({
          error: {
            code: 'rate_limit_exceeded',
            message: 'تم تجاوز الحد المسموح من الطلبات في الدقيقة. يرجى الانتظار لحظات.'
          }
        })
      );
      return;
    }

    const urlObj = new URL(req.url, `http://localhost:${PORT}`);
    // Priority: Client-supplied BYOK key (if player explicitly entered their own) -> Server Protected Key (.env)
    const clientKey = (urlObj.searchParams.get('key') || req.headers['x-goog-api-key'] || '').trim();
    const serverKey = (process.env.GEMINI_API_KEY || '').trim();
    const effectiveApiKey =
      clientKey && clientKey !== 'SERVER_MANAGED' ? clientKey : serverKey;

    if (!effectiveApiKey) {
      res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(
        JSON.stringify({
          error: {
            code: 'authentication',
            message: 'لم يتم إعداد مفتاح GEMINI_API_KEY في الخادم أو في إعدادات المتصفح.'
          }
        })
      );
      return;
    }

    const chunks = [];
    let totalBytes = 0;
    const MAX_BODY_BYTES = 28 * 1024; // 28KB max payload protection
    const ALLOWED_MODELS = new Set([
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
      'gemini-3.8-flash-lite-tts',
      'gemini-4-argon'
    ]);

    req.on('data', chunk => {
      totalBytes += chunk.length;
      if (totalBytes <= MAX_BODY_BYTES) {
        chunks.push(chunk);
      }
    });

    req.on('end', () => {
      if (totalBytes > MAX_BODY_BYTES) {
        res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: { code: 'invalid_request', message: 'Payload too large (max 28KB)' } }));
        return;
      }

      let bodyBuffer = Buffer.concat(chunks);
      try {
        const parsed = JSON.parse(bodyBuffer.toString('utf8'));
        const reqModel = String(parsed.model || 'gemini-3.5-flash-lite').trim();
        if (!ALLOWED_MODELS.has(reqModel)) {
          parsed.model = 'gemini-3.5-flash-lite';
        }
        if (typeof parsed.input === 'string' && parsed.input.length > 4800) {
          parsed.input = parsed.input.slice(0, 4800);
        }
        bodyBuffer = Buffer.from(JSON.stringify(parsed), 'utf8');
      } catch (_) {}

      const proxyReq = https.request(
        {
          hostname: 'generativelanguage.googleapis.com',
          port: 443,
          path: `/v1beta/interactions?key=${encodeURIComponent(effectiveApiKey)}`,
          method: 'POST',
          agent: httpsAgent,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': bodyBuffer.length
          }
        },
        proxyRes => {
          res.writeHead(proxyRes.statusCode || 200, {
            'Content-Type': proxyRes.headers['content-type'] || 'application/json',
            'Access-Control-Allow-Origin': allowedOrigin
          });
          proxyRes.pipe(res);
        }
      );

      proxyReq.on('error', err => {
        res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: { code: 'network_error', message: err.message } }));
      });

      proxyReq.write(bodyBuffer);
      proxyReq.end();
    });
    return;
  }

  // 3. Serve Static Frontend Files (with strict protection against sensitive files)
  const safeUrl = decodeURIComponent(req.url.split('?')[0]);
  const relPath = safeUrl === '/' ? 'index.html' : safeUrl.replace(/^\/+/, '');
  const normalizedRel = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const baseName = path.basename(normalizedRel);

  // Block dotfiles (.env, .git), server.js, api folder, functions folder, node_modules, etc.
  if (
    baseName.startsWith('.') ||
    BLOCKED_FILES.has(baseName) ||
    normalizedRel.startsWith('api' + path.sep) ||
    normalizedRel.startsWith('api/') ||
    normalizedRel.startsWith('functions' + path.sep) ||
    normalizedRel.startsWith('functions/') ||
    normalizedRel.startsWith('node_modules')
  ) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden: Access to server configuration files is denied.');
    return;
  }

  let filePath = path.join(ROOT, normalizedRel);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
  } catch (_) {}

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(content);
  });
});

server.listen(PORT, () => {
  const hasServerKey = Boolean(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 15
  );
  console.log(`=====================================================`);
  console.log(`متاهة الظلال — الخادم الآمن يعمل الآن على الرابط:`);
  console.log(`http://localhost:${PORT}`);
  console.log(
    `حالة مفتاح الخادم (GEMINI_API_KEY): ${
      hasServerKey ? 'محمي ومفعل على الخادم 🔒' : 'غير مضاف في .env (يعتمد على مفتاح المتصفح أو المحاكاة)'
    }`
  );
  console.log(`=====================================================`);
});
