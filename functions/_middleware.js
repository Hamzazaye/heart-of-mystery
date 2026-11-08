/**
 * Cloudflare Pages Edge Security Middleware
 * Blocks public access to any non-frontend files (.env, server.js, package.json, wrangler.toml, etc.)
 */
const BLOCKED_PATHS = [
  '/server.js',
  '/package.json',
  '/package-lock.json',
  '/wrangler.toml',
  '/.env',
  '/.gitignore',
  '/.cfignore',
  '/.assetsignore',
  '/design-system'
];

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname.toLowerCase();

  if (
    pathname.startsWith('/.') ||
    BLOCKED_PATHS.some(blocked => pathname === blocked || pathname.startsWith(blocked + '/'))
  ) {
    return new Response('403 Forbidden: Access Denied', {
      status: 403,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }

  return context.next();
}
