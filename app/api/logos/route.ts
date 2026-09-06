import { env } from 'cloudflare:workers';

const allowedTypes = new Map([
  ['image/png', 'png'],
  ['image/jpeg', 'jpg'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
  ['image/svg+xml', 'svg'],
  ['image/x-icon', 'ico'],
  ['image/vnd.microsoft.icon', 'ico'],
]);

function logosBucket() {
  return (env as unknown as { LOGOS: R2Bucket }).LOGOS;
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 2.5 * 1024 * 1024) {
    return Response.json({ error: '图标文件不能超过 2MB。' }, { status: 413 });
  }

  const form = await request.formData();
  const logo = form.get('logo');

  if (!(logo instanceof File)) {
    return Response.json({ error: '请选择一个图标文件。' }, { status: 400 });
  }

  const extension = allowedTypes.get(logo.type);
  if (!extension) {
    return Response.json({ error: '不支持这种图片格式。' }, { status: 415 });
  }
  if (logo.size > 2 * 1024 * 1024) {
    return Response.json({ error: '图标文件不能超过 2MB。' }, { status: 413 });
  }

  const key = `${crypto.randomUUID()}.${extension}`;
  await logosBucket().put(key, await logo.arrayBuffer(), {
    httpMetadata: { contentType: logo.type },
    customMetadata: { originalName: logo.name.slice(0, 160) },
  });

  return Response.json({ url: `/api/logos/${key}` }, { status: 201 });
}
