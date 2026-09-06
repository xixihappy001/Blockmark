import { env } from 'cloudflare:workers';

function logosBucket() {
  return (env as unknown as { LOGOS: R2Bucket }).LOGOS;
}

export async function GET(_request: Request, context: { params: Promise<{ key: string }> }) {
  const { key } = await context.params;
  if (!/^[0-9a-f-]{36}\.(png|jpg|webp|gif|svg|ico)$/.test(key)) {
    return new Response('Not found', { status: 404 });
  }

  const logo = await logosBucket().get(key);
  if (!logo) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  logo.writeHttpMetadata(headers);
  headers.set('etag', logo.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  headers.set('x-content-type-options', 'nosniff');
  if (headers.get('content-type') === 'image/svg+xml') {
    headers.set('content-security-policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  }

  return new Response(logo.body, { headers });
}
