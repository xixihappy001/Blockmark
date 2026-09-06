import { getSyncDatabase } from '@/db';

const stateKey = 'owner';
const maxPayloadBytes = 750_000;

type SiteRecord = {
  id: string;
  name: string;
  url: string;
  description: string;
  category: string;
  mark: string;
  tone: string;
  logo?: string;
  featured?: boolean;
  custom?: boolean;
};

type SyncedState = {
  customSites: SiteRecord[];
  categories: string[];
  categoryOverrides: Record<string, string>;
  deletedDefaultSiteIds: string[];
  siteOrders: Record<string, string[]>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function shortString(value: unknown, max = 500) {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

function stringList(value: unknown, limit = 500) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => shortString(item, 160)).filter(Boolean))].slice(0, limit);
}

function sanitizeState(value: unknown): SyncedState | null {
  if (!isRecord(value)) return null;

  const customSites = Array.isArray(value.customSites)
    ? value.customSites.filter(isRecord).slice(0, 1000).map((site) => ({
        id: shortString(site.id, 160),
        name: shortString(site.name, 160),
        url: shortString(site.url, 2000),
        description: shortString(site.description, 500),
        category: shortString(site.category, 160),
        mark: shortString(site.mark, 20),
        tone: shortString(site.tone, 200),
        logo: shortString(site.logo, 3000) || undefined,
        featured: site.featured === true || undefined,
        custom: true,
      })).filter((site) => site.id && site.name && /^https?:\/\//i.test(site.url) && site.category)
    : [];

  const categoryOverrides = isRecord(value.categoryOverrides)
    ? Object.fromEntries(Object.entries(value.categoryOverrides).slice(0, 1000).map(([id, category]) => [shortString(id, 160), shortString(category, 160)]).filter(([id, category]) => id && category))
    : {};
  const siteOrders = isRecord(value.siteOrders)
    ? Object.fromEntries(Object.entries(value.siteOrders).slice(0, 200).map(([category, ids]) => [shortString(category, 160), stringList(ids, 1500)]).filter(([category]) => category))
    : {};

  return {
    customSites,
    categories: stringList(value.categories, 200).filter((category) => category !== '全部'),
    categoryOverrides,
    deletedDefaultSiteIds: stringList(value.deletedDefaultSiteIds, 1000),
    siteOrders,
  };
}

async function readState() {
  const database = await getSyncDatabase();
  return database.prepare('SELECT payload, revision, updated_at AS updatedAt FROM synced_states WHERE key = ?')
    .bind(stateKey)
    .first<{ payload: string; revision: number; updatedAt: string }>();
}

export async function GET() {
  const row = await readState();
  return Response.json(row
    ? { state: JSON.parse(row.payload), revision: row.revision, updatedAt: row.updatedAt }
    : { state: null, revision: 0, updatedAt: null }, {
    headers: { 'cache-control': 'no-store' },
  });
}

export async function PUT(request: Request) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > maxPayloadBytes) return Response.json({ error: '同步内容过大。' }, { status: 413 });

  const body = await request.json().catch(() => null);
  if (!isRecord(body)) return Response.json({ error: '同步内容无效。' }, { status: 400 });
  const state = sanitizeState(body.state);
  const baseRevision = Number.isInteger(body.baseRevision) && Number(body.baseRevision) >= 0 ? Number(body.baseRevision) : 0;
  if (!state) return Response.json({ error: '同步内容无效。' }, { status: 400 });

  const payload = JSON.stringify(state);
  if (new TextEncoder().encode(payload).byteLength > maxPayloadBytes) {
    return Response.json({ error: '同步内容过大。' }, { status: 413 });
  }

  const database = await getSyncDatabase();
  const current = await database.prepare('SELECT payload, revision, updated_at AS updatedAt FROM synced_states WHERE key = ?')
    .bind(stateKey)
    .first<{ payload: string; revision: number; updatedAt: string }>();
  const currentRevision = current?.revision || 0;

  if (baseRevision !== currentRevision) {
    return Response.json({
      error: 'conflict',
      state: current ? JSON.parse(current.payload) : null,
      revision: currentRevision,
      updatedAt: current?.updatedAt || null,
    }, { status: 409 });
  }

  const nextRevision = currentRevision + 1;
  const updatedAt = new Date().toISOString();
  const result = current
    ? await database.prepare('UPDATE synced_states SET payload = ?, revision = ?, updated_at = ? WHERE key = ? AND revision = ?')
        .bind(payload, nextRevision, updatedAt, stateKey, currentRevision).run()
    : await database.prepare('INSERT OR IGNORE INTO synced_states (key, payload, revision, updated_at) VALUES (?, ?, ?, ?)')
        .bind(stateKey, payload, nextRevision, updatedAt).run();

  if ((result.meta.changes || 0) !== 1) {
    const latest = await readState();
    return Response.json({
      error: 'conflict',
      state: latest ? JSON.parse(latest.payload) : null,
      revision: latest?.revision || 0,
      updatedAt: latest?.updatedAt || null,
    }, { status: 409 });
  }

  return Response.json({ revision: nextRevision, updatedAt });
}
