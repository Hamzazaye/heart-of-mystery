/**
 * Cloudflare Pages Function: GET /api/config
 * Automatically mapped to /api/config when deployed on Cloudflare Pages.
 * Checks if GEMINI_API_KEY is set in Cloudflare Pages -> Settings -> Environment Variables
 * WITHOUT exposing the key to the browser.
 */
export async function onRequestGet(context) {
  const env = context.env || {};
  const hasServerKey = Boolean(
    env.GEMINI_API_KEY && String(env.GEMINI_API_KEY).trim().length > 15
  );

  return new Response(
    JSON.stringify({
      serverManagedKey: hasServerKey,
      defaultModel: env.GEMINI_MODEL || 'gemini-3.8-flash'
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    }
  );
}
