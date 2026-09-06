'use client';

import { FormEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Blocks,
  BookOpen,
  CandlestickChart,
  Cloud,
  CloudOff,
  Database,
  FolderOpen,
  FolderPlus,
  Globe2,
  GripVertical,
  ImagePlus,
  Landmark,
  LoaderCircle,
  MessagesSquare,
  Network,
  Newspaper,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  WalletCards,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Category = string;
type SiteCategory = string;

type Site = {
  id: string;
  name: string;
  url: string;
  description: string;
  category: SiteCategory;
  mark: string;
  tone: string;
  logo?: string;
  featured?: boolean;
  custom?: boolean;
};

type SyncedState = {
  customSites: Site[];
  categories: SiteCategory[];
  categoryOverrides: Record<string, SiteCategory>;
  deletedDefaultSiteIds: string[];
  siteOrders: Record<string, string[]>;
};

type SyncStatus = 'loading' | 'syncing' | 'synced' | 'offline';

const defaultSiteCategories = ['交易平台', '行情数据', '链上分析', '项目数据', '新闻研究', '钱包工具', '美股研究', '社区链接', '学习资料'];
const categoryIcons: Record<string, typeof Globe2> = {
  全部: Globe2,
  交易平台: CandlestickChart,
  行情数据: BarChart3,
  链上分析: Blocks,
  项目数据: Network,
  新闻研究: Newspaper,
  钱包工具: WalletCards,
  美股研究: Landmark,
  社区链接: MessagesSquare,
  学习资料: BookOpen,
  未分类: FolderOpen,
};
const customTones = [
  'from-[#84cc16] to-[#bef264]',
  'from-[#22d3ee] to-[#818cf8]',
  'from-[#f472b6] to-[#fb923c]',
  'from-[#a78bfa] to-[#60a5fa]',
];

const defaultSites: Site[] = [
  { id: 'tradingview', name: 'TradingView', url: 'https://www.tradingview.com/', description: '图表、技术指标与多市场交易观点', category: '行情数据', mark: 'TV', tone: 'from-[#2563eb] to-[#60a5fa]', featured: true },
  { id: 'coinmarketcap', name: 'CoinMarketCap', url: 'https://coinmarketcap.com/', description: '加密资产价格、排名与市场总览', category: '行情数据', mark: 'CM', tone: 'from-[#2753ff] to-[#7c92ff]' },
  { id: 'coingecko', name: 'CoinGecko', url: 'https://www.coingecko.com/', description: '币种行情、交易所和分类数据', category: '行情数据', mark: 'CG', tone: 'from-[#65a30d] to-[#a3e635]' },
  { id: 'binance', name: 'Binance', url: 'https://www.binance.com/', description: '现货、合约与数字资产服务入口', category: '交易平台', mark: 'BN', tone: 'from-[#f59e0b] to-[#fde047]', featured: true },
  { id: 'defillama', name: 'DefiLlama', url: 'https://defillama.com/', description: 'DeFi TVL、协议收入与资金流数据', category: '链上分析', mark: 'DL', tone: 'from-[#06b6d4] to-[#67e8f9]', featured: true },
  { id: 'dune', name: 'Dune', url: 'https://dune.com/', description: '社区驱动的链上数据看板与查询', category: '链上分析', mark: 'DU', tone: 'from-[#fb7185] to-[#fdba74]' },
  { id: 'arkham', name: 'Arkham', url: 'https://intel.arkm.com/', description: '地址画像、实体追踪与链上情报', category: '链上分析', mark: 'AK', tone: 'from-[#7c3aed] to-[#c084fc]' },
  { id: 'etherscan', name: 'Etherscan', url: 'https://etherscan.io/', description: '以太坊交易、地址和合约浏览器', category: '链上分析', mark: 'ES', tone: 'from-[#0f766e] to-[#2dd4bf]' },
  { id: 'cryptopanic', name: 'CryptoPanic', url: 'https://cryptopanic.com/', description: '聚合加密新闻与市场情绪线索', category: '新闻研究', mark: 'CP', tone: 'from-[#dc2626] to-[#fb7185]' },
  { id: 'coindesk', name: 'CoinDesk', url: 'https://www.coindesk.com/', description: '行业新闻、市场报道与深度分析', category: '新闻研究', mark: 'CD', tone: 'from-[#1d4ed8] to-[#818cf8]' },
  { id: 'rabby', name: 'Rabby Wallet', url: 'https://rabby.io/', description: '面向多链 DeFi 用户的浏览器钱包', category: '钱包工具', mark: 'RW', tone: 'from-[#4f46e5] to-[#a78bfa]' },
  { id: 'binance-academy', name: 'Binance Academy', url: 'https://academy.binance.com/', description: '区块链、交易和安全基础知识', category: '学习资料', mark: 'BA', tone: 'from-[#ca8a04] to-[#facc15]' },
  { id: 'okx', name: 'OKX 欧易', url: 'https://www.okx.com/', description: '交易、钱包、Web3 与行情服务入口', category: '交易平台', mark: 'OK', tone: 'from-[#e2e8f0] to-[#94a3b8]' },
  { id: 'bybit', name: 'Bybit', url: 'https://www.bybit.com/', description: '现货、合约、理财和 Web3 服务平台', category: '交易平台', mark: 'BY', tone: 'from-[#f59e0b] to-[#fbbf24]' },
  { id: 'bitget', name: 'Bitget', url: 'https://www.bitget.com/', description: '现货、合约、跟单与钱包服务平台', category: '交易平台', mark: 'BG', tone: 'from-[#06b6d4] to-[#67e8f9]' },
  { id: 'gateio', name: 'Gate.io', url: 'https://www.gate.io/', description: '覆盖多币种现货与衍生品的交易平台', category: '交易平台', mark: 'GT', tone: 'from-[#16a34a] to-[#86efac]' },
  { id: 'coinbase', name: 'Coinbase', url: 'https://www.coinbase.com/', description: '面向主流数字资产的合规交易服务', category: '交易平台', mark: 'CB', tone: 'from-[#1d4ed8] to-[#60a5fa]' },
  { id: 'coinglass', name: 'Coinglass', url: 'https://www.coinglass.com/', description: '持仓、资金费率、爆仓与 ETF 数据', category: '行情数据', mark: 'CL', tone: 'from-[#2563eb] to-[#22d3ee]' },
  { id: 'aicoin', name: 'AICoin', url: 'https://www.aicoin.com/', description: '中文行情、币种走势与市场信息工具', category: '行情数据', mark: 'AI', tone: 'from-[#4f46e5] to-[#22d3ee]' },
  { id: 'blockbeats', name: '律动 BlockBeats', url: 'https://www.theblockbeats.info/', description: 'Web3 新闻、投融资动态与市场热点', category: '新闻研究', mark: 'BB', tone: 'from-[#0f172a] to-[#64748b]' },
  { id: 'odaily', name: '星球日报 Odaily', url: 'https://www.odaily.news/', description: '中文 Web3 资讯、项目动态与深度内容', category: '新闻研究', mark: 'OD', tone: 'from-[#2563eb] to-[#38bdf8]' },
  { id: 'panews', name: 'PANews', url: 'https://www.panewslab.com/', description: '中文区块链新闻、专栏与研究内容', category: '新闻研究', mark: 'PA', tone: 'from-[#4338ca] to-[#a78bfa]' },
  { id: 'foresight-news', name: 'Foresight News', url: 'https://foresightnews.pro/', description: '行业快讯、深度文章与投融资信息', category: '新闻研究', mark: 'FN', tone: 'from-[#0f766e] to-[#2dd4bf]' },
  { id: 'chaincatcher', name: 'ChainCatcher', url: 'https://www.chaincatcher.com/', description: '项目、政策、投融资与行业观点', category: '新闻研究', mark: 'CC', tone: 'from-[#7c3aed] to-[#c084fc]' },
  { id: 'bscscan', name: 'BscScan', url: 'https://bscscan.com/', description: 'BNB Chain 交易、地址与合约浏览器', category: '链上分析', mark: 'BS', tone: 'from-[#eab308] to-[#fde047]' },
  { id: 'solscan', name: 'Solscan', url: 'https://solscan.io/', description: 'Solana 地址、交易、NFT 与链上数据', category: '链上分析', mark: 'SS', tone: 'from-[#7c3aed] to-[#2dd4bf]' },
  { id: 'debank', name: 'DeBank', url: 'https://debank.com/', description: '多链钱包资产、协议与历史记录看板', category: '链上分析', mark: 'DB', tone: 'from-[#2563eb] to-[#93c5fd]' },
  { id: 'rootdata', name: 'RootData', url: 'https://www.rootdata.com/', description: 'Web3 项目、机构与投融资数据库', category: '项目数据', mark: 'RD', tone: 'from-[#111827] to-[#6b7280]' },
  { id: 'tokenomist', name: 'Token Unlocks', url: 'https://token.unlocks.app/', description: '项目代币解锁时间与释放节奏数据', category: '项目数据', mark: 'TU', tone: 'from-[#0891b2] to-[#67e8f9]' },
  { id: 'cryptorank', name: 'CryptoRank', url: 'https://cryptorank.io/', description: '融资、IDO、空投与市场排名数据', category: '项目数据', mark: 'CR', tone: 'from-[#0369a1] to-[#38bdf8]' },
  { id: 'messari', name: 'Messari', url: 'https://messari.io/', description: '加密项目资料、研究报告与市场指标', category: '项目数据', mark: 'MS', tone: 'from-[#16a34a] to-[#4ade80]' },
  { id: 'metamask', name: 'MetaMask', url: 'https://metamask.io/', description: '管理 EVM 链资产并连接 Web3 应用', category: '钱包工具', mark: 'MM', tone: 'from-[#ea580c] to-[#fb923c]' },
  { id: 'trust-wallet', name: 'Trust Wallet', url: 'https://trustwallet.com/', description: '支持移动端和 DApp 浏览的多链钱包', category: '钱包工具', mark: 'TW', tone: 'from-[#2563eb] to-[#60a5fa]' },
  { id: 'revoke-cash', name: 'Revoke.cash', url: 'https://revoke.cash/', description: '检查并撤销钱包的代币授权', category: '钱包工具', mark: 'RC', tone: 'from-[#dc2626] to-[#fb7185]' },
  { id: 'slowmist', name: 'SlowMist 慢雾', url: 'https://www.slowmist.com/', description: '区块链安全研究、预警与防护服务', category: '钱包工具', mark: 'SM', tone: 'from-[#475569] to-[#94a3b8]' },
  { id: 'investing', name: 'Investing.com', url: 'https://www.investing.com/', description: '股票、指数、外汇、商品与财经日历', category: '美股研究', mark: 'IN', tone: 'from-[#1d4ed8] to-[#64748b]' },
  { id: 'cnbc-markets', name: 'CNBC Markets', url: 'https://www.cnbc.com/markets/', description: '美股、宏观与企业盘中新闻', category: '美股研究', mark: 'CN', tone: 'from-[#2563eb] to-[#a855f7]' },
  { id: 'seeking-alpha', name: 'Seeking Alpha', url: 'https://seekingalpha.com/', description: '美股财报、公司研究与投资观点', category: '美股研究', mark: 'SA', tone: 'from-[#f97316] to-[#facc15]' },
  { id: 'investopedia', name: 'Investopedia', url: 'https://www.investopedia.com/', description: '股票、基金、期权与财务概念百科', category: '美股研究', mark: 'IP', tone: 'from-[#0f766e] to-[#34d399]' },
  { id: 'benzinga', name: 'Benzinga', url: 'https://www.benzinga.com/', description: '日内交易快讯、评级变动与市场异动', category: '美股研究', mark: 'BZ', tone: 'from-[#9333ea] to-[#f472b6]' },
  { id: 'wallstreetcn', name: '华尔街见闻', url: 'https://wallstreetcn.com/', description: '全球市场、宏观、美股与中文快讯', category: '美股研究', mark: '华见', tone: 'from-[#dc2626] to-[#fb7185]' },
  { id: 'jin10', name: '金十数据', url: 'https://www.jin10.com/', description: '财经快讯、宏观数据与交易日历', category: '美股研究', mark: '金十', tone: 'from-[#ca8a04] to-[#fde047]' },
  { id: 'barker-money', name: '理财网站', url: 'https://app.barker.money/campaigns?view=list', description: '理财活动与产品信息入口', category: '项目数据', mark: '理财', tone: 'from-[#059669] to-[#a3e635]' },
  { id: 'bqlsj-x', name: '币圈老司机 X', url: 'https://x.com/Bqlsj2023', description: '原导航站的 X 社区动态入口', category: '社区链接', mark: 'X', tone: 'from-[#111827] to-[#64748b]' },
  { id: 'bqlsj-telegram', name: '币圈老司机 Telegram', url: 'https://t.me/+8v98gQxMP98wZTk9', description: '原导航站的 Telegram 社群入口', category: '社区链接', mark: 'TG', tone: 'from-[#0284c7] to-[#38bdf8]' },
];

const storageKey = 'blockmark-custom-sites-v1';
const categoryStorageKey = 'blockmark-categories-v1';
const categoryOverrideStorageKey = 'blockmark-category-overrides-v1';
const deletedDefaultSitesStorageKey = 'blockmark-deleted-default-sites-v1';
const siteOrderStorageKey = 'blockmark-site-orders-v1';
const syncPendingStorageKey = 'blockmark-sync-pending-v1';

const localBrandLogoIds = new Set([
  'tradingview',
  'coinmarketcap',
  'binance',
  'binance-academy',
  'okx',
  'coinbase',
  'bqlsj-x',
  'bqlsj-telegram',
]);

function officialFavicon(url: string) {
  try {
    return `${new URL(url).origin}/favicon.ico`;
  } catch {
    return '';
  }
}

function automaticLogo(url: string) {
  try {
    const normalized = normalizeUrl(url.trim());
    return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(new URL(normalized).origin)}&sz=128`;
  } catch {
    return '';
  }
}

function SiteLogo({ site }: { site: Site }) {
  const localBrandLogo = localBrandLogoIds.has(site.id);
  const sources = [...new Set([
    localBrandLogo ? `/brand-logos/${site.id}.svg` : '',
    site.logo || '',
    automaticLogo(site.url),
    officialFavicon(site.url),
  ].filter(Boolean))];
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => setSourceIndex(0), [site.id, site.logo, site.url]);
  const source = sources[sourceIndex];

  return (
    <span className="grid size-12 place-items-center rounded-[15px] border border-black/8 bg-white shadow-[0_10px_22px_rgba(0,0,0,.16)] transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_14px_28px_rgba(0,0,0,.22)]">
      {source ? (
        <img
          src={source}
          alt=""
          className={localBrandLogo && sourceIndex === 0 ? 'size-7 object-contain' : 'size-8 object-contain'}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setSourceIndex((index) => index + 1)}
        />
      ) : (
        <span className={`grid size-9 place-items-center rounded-xl bg-gradient-to-br ${site.tone} text-[10px] font-bold tracking-wide text-slate-950`} aria-hidden="true">
          {site.mark}
        </span>
      )}
    </span>
  );
}

function LogoPreview({ url, customSource }: { url: string; customSource: string }) {
  const sources = [...new Set([customSource, automaticLogo(url), officialFavicon(url)].filter(Boolean))];
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => setSourceIndex(0), [customSource, url]);
  const source = sources[sourceIndex];

  return source ? (
    <img src={source} alt="Logo 预览" className="size-8 object-contain" referrerPolicy="no-referrer" onError={() => setSourceIndex((index) => index + 1)} />
  ) : (
    <Globe2 className="size-5 text-slate-400" aria-hidden="true" />
  );
}

function initials(name: string) {
  return name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').slice(0, 2).toUpperCase() || 'NEW';
}

function normalizeUrl(value: string) {
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const parsed = new URL(candidate);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('invalid');
  return parsed.toString();
}

function applySiteOrder(sites: Site[], order: string[]) {
  if (!order.length) return sites;
  const positions = new Map(order.map((id, index) => [id, index]));
  return [...sites].sort((a, b) => {
    const aPosition = positions.get(a.id);
    const bPosition = positions.get(b.id);
    if (aPosition === undefined && bPosition === undefined) return 0;
    if (aPosition === undefined) return 1;
    if (bPosition === undefined) return -1;
    return aPosition - bPosition;
  });
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<Category>('全部');
  const [query, setQuery] = useState('');
  const [customSites, setCustomSites] = useState<Site[]>([]);
  const [deletedDefaultSiteIds, setDeletedDefaultSiteIds] = useState<string[]>([]);
  const [siteCategories, setSiteCategories] = useState<SiteCategory[]>(defaultSiteCategories);
  const [siteCategoryOverrides, setSiteCategoryOverrides] = useState<Record<string, SiteCategory>>({});
  const [siteOrders, setSiteOrders] = useState<Record<string, string[]>>({});
  const [draggingSiteId, setDraggingSiteId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [categoryDraft, setCategoryDraft] = useState('');
  const [notice, setNotice] = useState('');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [localLogoPreview, setLocalLogoPreview] = useState('');
  const [savingSite, setSavingSite] = useState(false);
  const [form, setForm] = useState({ name: '', url: '', description: '', category: '行情数据' as SiteCategory, newCategory: '' });
  const searchRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoObjectUrlRef = useRef('');
  const dragStateRef = useRef<{ id: string; pointerId: number; startX: number; startY: number; activated: boolean } | null>(null);
  const lastDragTargetRef = useRef<string | null>(null);
  const syncedStateRef = useRef<SyncedState>({
    customSites: [],
    categories: defaultSiteCategories,
    categoryOverrides: {},
    deletedDefaultSiteIds: [],
    siteOrders: {},
  });
  const cloudRevisionRef = useRef(0);
  const syncReadyRef = useRef(false);
  const syncDirtyRef = useRef(false);
  const syncInFlightRef = useRef(false);
  const syncQueuedRef = useRef(false);
  const syncTimerRef = useRef<number | null>(null);

  const applySyncedState = (incoming: SyncedState) => {
    const usedCategories = [
      ...incoming.customSites.map((site) => site.category),
      ...defaultSites
        .filter((site) => !incoming.deletedDefaultSiteIds.includes(site.id))
        .map((site) => incoming.categoryOverrides[site.id] || site.category),
    ];
    const next: SyncedState = {
      customSites: incoming.customSites,
      categories: [...new Set([...incoming.categories.filter((name) => name && name !== '全部'), ...usedCategories])],
      categoryOverrides: incoming.categoryOverrides,
      deletedDefaultSiteIds: incoming.deletedDefaultSiteIds,
      siteOrders: incoming.siteOrders,
    };

    syncedStateRef.current = next;
    setCustomSites(next.customSites);
    setSiteCategories(next.categories);
    setSiteCategoryOverrides(next.categoryOverrides);
    setDeletedDefaultSiteIds(next.deletedDefaultSiteIds);
    setSiteOrders(next.siteOrders);
    setActiveCategory((current) => current === '全部' || next.categories.includes(current) ? current : '全部');
    localStorage.setItem(storageKey, JSON.stringify(next.customSites));
    localStorage.setItem(categoryStorageKey, JSON.stringify(next.categories));
    localStorage.setItem(categoryOverrideStorageKey, JSON.stringify(next.categoryOverrides));
    localStorage.setItem(deletedDefaultSitesStorageKey, JSON.stringify(next.deletedDefaultSiteIds));
    localStorage.setItem(siteOrderStorageKey, JSON.stringify(next.siteOrders));
  };

  const readLocalState = (): SyncedState => {
    const parse = <T,>(key: string, fallback: T): T => {
      try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) as T : fallback;
      } catch {
        localStorage.removeItem(key);
        return fallback;
      }
    };
    return {
      customSites: parse<Site[]>(storageKey, []),
      categories: parse<SiteCategory[]>(categoryStorageKey, defaultSiteCategories).filter((name) => name && name !== '全部'),
      categoryOverrides: parse<Record<string, SiteCategory>>(categoryOverrideStorageKey, {}),
      deletedDefaultSiteIds: parse<string[]>(deletedDefaultSitesStorageKey, []),
      siteOrders: parse<Record<string, string[]>>(siteOrderStorageKey, {}),
    };
  };

  const hasMeaningfulLocalState = (state: SyncedState) => state.customSites.length > 0
    || state.deletedDefaultSiteIds.length > 0
    || Object.keys(state.categoryOverrides).length > 0
    || Object.keys(state.siteOrders).length > 0
    || state.categories.length !== defaultSiteCategories.length
    || state.categories.some((category, index) => category !== defaultSiteCategories[index]);

  const fetchCloudState = async () => {
    const response = await fetch('/api/sync', { cache: 'no-store', credentials: 'same-origin' });
    if (!response.ok) throw new Error('sync unavailable');
    return response.json() as Promise<{ state: SyncedState | null; revision: number }>;
  };

  const flushCloudState = async () => {
    if (!syncReadyRef.current) return;
    if (syncInFlightRef.current) {
      syncQueuedRef.current = true;
      return;
    }

    syncInFlightRef.current = true;
    syncQueuedRef.current = false;
    syncDirtyRef.current = false;
    setSyncStatus('syncing');
    const snapshot = syncedStateRef.current;

    try {
      const response = await fetch('/api/sync', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ state: snapshot, baseRevision: cloudRevisionRef.current }),
      });
      const result = await response.json() as { revision?: number; error?: string };
      if (response.status === 409 && typeof result.revision === 'number') {
        cloudRevisionRef.current = result.revision;
        syncDirtyRef.current = true;
        syncQueuedRef.current = true;
      } else if (!response.ok || typeof result.revision !== 'number') {
        throw new Error(result.error || 'sync failed');
      } else {
        cloudRevisionRef.current = result.revision;
        localStorage.removeItem(syncPendingStorageKey);
        setSyncStatus('synced');
      }
    } catch {
      syncDirtyRef.current = true;
      localStorage.setItem(syncPendingStorageKey, '1');
      setSyncStatus('offline');
    } finally {
      syncInFlightRef.current = false;
      if (syncQueuedRef.current) window.setTimeout(flushCloudState, 120);
    }
  };

  const queueCloudPatch = (patch: Partial<SyncedState>) => {
    syncedStateRef.current = { ...syncedStateRef.current, ...patch };
    syncDirtyRef.current = true;
    localStorage.setItem(syncPendingStorageKey, '1');
    if (!syncReadyRef.current) return;
    setSyncStatus('syncing');
    if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    syncTimerRef.current = window.setTimeout(flushCloudState, 450);
  };

  const refreshCloudState = async () => {
    if (!syncReadyRef.current || syncInFlightRef.current) return;
    if (syncDirtyRef.current || localStorage.getItem(syncPendingStorageKey) === '1') {
      await flushCloudState();
      return;
    }
    try {
      const remote = await fetchCloudState();
      if (remote.state && remote.revision > cloudRevisionRef.current) {
        cloudRevisionRef.current = remote.revision;
        applySyncedState(remote.state);
      }
      setSyncStatus('synced');
    } catch {
      setSyncStatus('offline');
    }
  };

  useEffect(() => {
    let cancelled = false;
    const local = readLocalState();
    applySyncedState(local);

    const initializeCloudSync = async () => {
      try {
        const remote = await fetchCloudState();
        if (cancelled) return;
        cloudRevisionRef.current = remote.revision;
        syncReadyRef.current = true;
        const localPending = localStorage.getItem(syncPendingStorageKey) === '1';
        if (localPending || (!remote.state && hasMeaningfulLocalState(local))) {
          syncDirtyRef.current = true;
          localStorage.setItem(syncPendingStorageKey, '1');
          await flushCloudState();
        } else if (remote.state) {
          applySyncedState(remote.state);
          setSyncStatus('synced');
        } else {
          setSyncStatus('synced');
        }
      } catch {
        syncReadyRef.current = true;
        if (hasMeaningfulLocalState(local)) {
          syncDirtyRef.current = true;
          localStorage.setItem(syncPendingStorageKey, '1');
        }
        setSyncStatus('offline');
      }
    };

    void initializeCloudSync();
    const interval = window.setInterval(() => { void refreshCloudState(); }, 12_000);
    const refreshOnFocus = () => { void refreshCloudState(); };
    window.addEventListener('focus', refreshOnFocus);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshOnFocus);
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (event.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  const allSites = useMemo(
    () => [
      ...customSites,
      ...defaultSites
        .filter((site) => !deletedDefaultSiteIds.includes(site.id))
        .map((site) => ({ ...site, category: siteCategoryOverrides[site.id] || site.category })),
    ],
    [customSites, deletedDefaultSiteIds, siteCategoryOverrides],
  );
  const filteredSites = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const categorySites = allSites.filter((site) => activeCategory === '全部' || site.category === activeCategory);
    return applySiteOrder(categorySites, siteOrders[activeCategory] || []).filter((site) =>
      !keyword || `${site.name} ${site.description} ${site.category}`.toLowerCase().includes(keyword),
    );
  }, [activeCategory, allSites, query, siteOrders]);

  const saveCustomSites = (nextSites: Site[]) => {
    setCustomSites(nextSites);
    localStorage.setItem(storageKey, JSON.stringify(nextSites));
    queueCloudPatch({ customSites: nextSites });
  };

  const saveCategories = (nextCategories: SiteCategory[]) => {
    setSiteCategories(nextCategories);
    localStorage.setItem(categoryStorageKey, JSON.stringify(nextCategories));
    queueCloudPatch({ categories: nextCategories });
  };

  const saveCategoryOverrides = (nextOverrides: Record<string, SiteCategory>) => {
    setSiteCategoryOverrides(nextOverrides);
    localStorage.setItem(categoryOverrideStorageKey, JSON.stringify(nextOverrides));
    queueCloudPatch({ categoryOverrides: nextOverrides });
  };

  const saveSiteOrders = (nextOrders: Record<string, string[]>) => {
    setSiteOrders(nextOrders);
    localStorage.setItem(siteOrderStorageKey, JSON.stringify(nextOrders));
    queueCloudPatch({ siteOrders: nextOrders });
  };

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2400);
  };

  const clearSelectedLogo = () => {
    if (logoObjectUrlRef.current) URL.revokeObjectURL(logoObjectUrlRef.current);
    logoObjectUrlRef.current = '';
    setLogoFile(null);
    setLocalLogoPreview('');
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const selectLogoFile = (file?: File) => {
    if (!file) return;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (!allowedTypes.includes(file.type)) {
      setError('请选择 PNG、JPG、WebP、GIF、SVG 或 ICO 图标。');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('图标文件不能超过 2MB。');
      return;
    }
    clearSelectedLogo();
    const previewUrl = URL.createObjectURL(file);
    logoObjectUrlRef.current = previewUrl;
    setLogoFile(file);
    setLocalLogoPreview(previewUrl);
    setError('');
  };

  const addSite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    try {
      const name = form.name.trim();
      const url = normalizeUrl(form.url.trim());
      if (!name) throw new Error('name');
      const category = form.newCategory.trim() || form.category;
      if (!category || category === '全部') throw new Error('category');
      setSavingSite(true);
      let logo = automaticLogo(url);
      if (logoFile) {
        const payload = new FormData();
        payload.append('logo', logoFile);
        const response = await fetch('/api/logos', { method: 'POST', body: payload });
        const result = await response.json() as { url?: string; error?: string };
        if (!response.ok || !result.url) throw new Error(result.error || '图标上传失败，请稍后重试。');
        logo = result.url;
      }
      if (!siteCategories.includes(category)) saveCategories([...siteCategories, category]);
      const next: Site = {
        id: `custom-${Date.now()}`,
        name,
        url,
        description: form.description.trim() || '我的自定义收藏入口',
        category,
        mark: initials(name),
        tone: customTones[customSites.length % customTones.length],
        logo,
        custom: true,
      };
      saveCustomSites([next, ...customSites]);
      saveSiteOrders({
        ...siteOrders,
        全部: [next.id, ...(siteOrders.全部 || []).filter((id) => id !== next.id)],
        [category]: [next.id, ...(siteOrders[category] || []).filter((id) => id !== next.id)],
      });
      setForm({ name: '', url: '', description: '', category, newCategory: '' });
      clearSelectedLogo();
      setDialogOpen(false);
      setActiveCategory('全部');
      showNotice(`已添加 ${name}`);
    } catch (caught) {
      setError(caught instanceof Error && caught.message !== 'name' && caught.message !== 'category' && caught.message !== 'invalid'
        ? caught.message
        : '请填写网站名称和有效的网址。');
    } finally {
      setSavingSite(false);
    }
  };

  const removeSite = (site: Site) => {
    if (!window.confirm(`确定删除“${site.name}”吗？`)) return;
    if (site.custom) {
      saveCustomSites(customSites.filter((item) => item.id !== site.id));
    } else {
      const nextDeletedIds = [...new Set([...deletedDefaultSiteIds, site.id])];
      setDeletedDefaultSiteIds(nextDeletedIds);
      localStorage.setItem(deletedDefaultSitesStorageKey, JSON.stringify(nextDeletedIds));
      queueCloudPatch({ deletedDefaultSiteIds: nextDeletedIds });
    }
    saveSiteOrders(Object.fromEntries(Object.entries(siteOrders).map(([category, ids]) => [category, ids.filter((id) => id !== site.id)])));
    showNotice(`已删除 ${site.name}`);
  };

  const reorderSite = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;
    setSiteOrders((currentOrders) => {
      const categorySites = allSites.filter((site) => activeCategory === '全部' || site.category === activeCategory);
      const ids = applySiteOrder(categorySites, currentOrders[activeCategory] || []).map((site) => site.id);
      const fromIndex = ids.indexOf(draggedId);
      const toIndex = ids.indexOf(targetId);
      if (fromIndex < 0 || toIndex < 0) return currentOrders;
      ids.splice(toIndex, 0, ids.splice(fromIndex, 1)[0]);
      const nextOrders = { ...currentOrders, [activeCategory]: ids };
      localStorage.setItem(siteOrderStorageKey, JSON.stringify(nextOrders));
      queueCloudPatch({ siteOrders: nextOrders });
      return nextOrders;
    });
  };

  const startHandleDrag = (event: ReactPointerEvent<HTMLButtonElement>, siteId: string) => {
    if (event.button !== 0 || query.trim()) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = { id: siteId, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, activated: false };
    lastDragTargetRef.current = null;
  };

  const moveHandleDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    if (!dragState.activated) {
      if (Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY) <= 5) return;
      dragState.activated = true;
      document.body.style.userSelect = 'none';
      setDraggingSiteId(dragState.id);
    }
    event.preventDefault();
    event.stopPropagation();
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-site-id]');
    const targetId = target?.dataset.siteId;
    if (!targetId || targetId === dragState.id) return;
    if (lastDragTargetRef.current === targetId) return;
    lastDragTargetRef.current = targetId;
    reorderSite(dragState.id, targetId);
  };

  const finishHandleDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    document.body.style.userSelect = '';
    dragStateRef.current = null;
    lastDragTargetRef.current = null;
    setDraggingSiteId(null);
  };

  const createCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = categoryDraft.trim();
    setCategoryError('');
    if (!name) return setCategoryError('请输入分类名称。');
    if (name === '全部') return setCategoryError('“全部”是系统分类，请换一个名称。');
    if (siteCategories.includes(name)) return setCategoryError('这个分类已经存在。');
    saveCategories([...siteCategories, name]);
    setForm({ ...form, category: name });
    setCategoryDraft('');
    setCategoryDialogOpen(false);
    setActiveCategory(name);
    showNotice(`已创建分类：${name}`);
  };

  const deleteCategory = (category: SiteCategory) => {
    if (category === '未分类') return;
    const affectedSites = allSites.filter((site) => site.category === category);
    const message = affectedSites.length
      ? `删除“${category}”后，其中 ${affectedSites.length} 个网站会移到“未分类”。确定删除吗？`
      : `确定删除分类“${category}”吗？`;
    if (!window.confirm(message)) return;

    const nextCustomSites = customSites.map((site) => site.category === category ? { ...site, category: '未分类' } : site);
    const nextOverrides = { ...siteCategoryOverrides };
    defaultSites.forEach((site) => {
      if ((siteCategoryOverrides[site.id] || site.category) === category) nextOverrides[site.id] = '未分类';
    });
    const remainingCategories = siteCategories.filter((name) => name !== category);
    const nextCategories = affectedSites.length && !remainingCategories.includes('未分类')
      ? [...remainingCategories, '未分类']
      : remainingCategories;

    saveCustomSites(nextCustomSites);
    saveCategoryOverrides(nextOverrides);
    saveCategories(nextCategories);
    const nextOrders = { ...siteOrders };
    const movedIds = affectedSites.map((site) => site.id);
    delete nextOrders[category];
    if (movedIds.length) nextOrders.未分类 = [...new Set([...(nextOrders.未分类 || []), ...movedIds])];
    saveSiteOrders(nextOrders);
    if (form.category === category) setForm({ ...form, category: nextCategories[0] || '未分类' });
    setActiveCategory('全部');
    showNotice(affectedSites.length ? `已删除分类，${affectedSites.length} 个网站移至未分类` : `已删除分类：${category}`);
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-background/82 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-2 px-3 sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
          <a className="group flex min-w-0 items-center gap-2 sm:gap-3" href="#top" aria-label="链上书签首页">
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_28px_color-mix(in_oklch,var(--primary),transparent_58%)] transition-transform group-hover:-rotate-3 sm:size-9">
              <Activity className="size-[18px]" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold tracking-[0.06em] sm:text-sm sm:tracking-[0.08em]">BLOCKMARK</span>
              <span className="hidden text-[10px] tracking-[0.12em] text-muted-foreground min-[360px]:block sm:tracking-[0.16em]">链上书签</span>
            </span>
          </a>

          <div className="ml-auto hidden items-center gap-5 text-xs text-muted-foreground lg:flex">
            <span><strong className="mr-1.5 text-foreground">{allSites.length}</strong>个站点</span>
            <span><strong className="mr-1.5 text-foreground">{siteCategories.length}</strong>个分类</span>
          </div>

          <div aria-live="polite" title={syncStatus === 'synced' ? '云端数据已同步' : syncStatus === 'offline' ? '暂时离线，恢复网络后会自动同步' : '正在同步云端数据'} className={`ml-auto flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2 text-[10px] lg:ml-0 ${syncStatus === 'offline' ? 'border-amber-400/20 bg-amber-400/8 text-amber-300' : 'border-white/8 bg-white/[0.035] text-muted-foreground'}`}>
            {syncStatus === 'synced' ? <Cloud className="size-3.5 text-primary" aria-hidden="true" /> : syncStatus === 'offline' ? <CloudOff className="size-3.5" aria-hidden="true" /> : <LoaderCircle className="size-3.5 animate-spin text-primary" aria-hidden="true" />}
            <span className="hidden min-[520px]:inline">{syncStatus === 'synced' ? '已同步' : syncStatus === 'offline' ? '待同步' : '同步中'}</span>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (open && !siteCategories.includes(form.category)) setForm({ ...form, category: siteCategories[0] || '未分类' });
            if (!open) clearSelectedLogo();
          }}>
            <DialogTrigger render={<Button className="h-9 w-9 shrink-0 rounded-xl px-0 min-[420px]:w-auto min-[420px]:px-3.5" aria-label="添加新网站" />}>
              <Plus data-icon="inline-start" />
              <span className="hidden min-[420px]:inline">添加网站</span>
            </DialogTrigger>
            <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto border border-white/10 bg-popover p-4 sm:max-w-md sm:p-5">
              <form onSubmit={addSite}>
                <DialogHeader>
                  <DialogTitle className="text-lg">添加收藏网站</DialogTitle>
                  <DialogDescription>输入网址会自动识别站点图标，也可以上传自己喜欢的 Logo。</DialogDescription>
                </DialogHeader>
                <div className="mt-5 grid gap-4">
                  <label className="grid gap-1.5 text-xs font-medium">
                    网站名称
                    <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="例如：Glassnode" className="h-10" autoFocus />
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium">
                    网站网址
                    <Input value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder="https://example.com" className="h-10" inputMode="url" />
                  </label>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-[15px] border border-black/8 bg-white shadow-lg">
                        <LogoPreview url={form.url} customSource={localLogoPreview} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium">{logoFile ? '已选择自定义图标' : automaticLogo(form.url) ? '已自动识别网站图标' : 'Logo 图标'}</p>
                        <p className="mt-1 truncate text-[11px] text-muted-foreground">{logoFile?.name || (automaticLogo(form.url) ? '保存时会使用该网站的官方 favicon' : '输入网站链接后自动显示')}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <input ref={logoInputRef} id="site-logo-upload" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/x-icon,image/vnd.microsoft.icon" className="sr-only" onChange={(event) => selectLogoFile(event.target.files?.[0])} />
                      <label htmlFor="site-logo-upload" className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-background px-3 text-[11px] font-medium transition hover:border-primary/30 hover:text-primary">
                        <ImagePlus className="size-3.5" aria-hidden="true" />选择本地图标
                      </label>
                      {logoFile && <Button type="button" variant="ghost" className="h-8 px-2.5 text-[11px] text-muted-foreground" onClick={clearSelectedLogo}>使用自动图标</Button>}
                      <span className="text-[10px] text-muted-foreground">PNG/JPG/WebP/GIF/SVG/ICO，最大 2MB</span>
                    </div>
                  </div>
                  <label className="grid gap-1.5 text-xs font-medium">
                    一句话说明（可选）
                    <Input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="这个网站主要用来做什么" className="h-10" />
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium">
                    分类（选择已有分类）
                    <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value as SiteCategory })}>
                      <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                      <SelectContent align="start">
                        {siteCategories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium">
                    或创建一个新分类
                    <Input value={form.newCategory} onChange={(event) => setForm({ ...form, newCategory: event.target.value })} placeholder="例如：空投工具" className="h-10" maxLength={20} />
                    <span className="font-normal text-muted-foreground">填写后，新网站会直接放进这个新分类。</span>
                  </label>
                  {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
                </div>
                <DialogFooter className="mt-5">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
                  <Button type="submit" disabled={savingSite}>{savingSite ? '正在保存…' : '保存网站'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div id="top" className="mx-auto grid w-full min-w-0 max-w-[1440px] grid-cols-1 lg:grid-cols-[210px_minmax(0,1fr)]">
        <aside className="min-w-0 border-white/8 px-3 py-3 sm:px-4 sm:py-5 lg:min-h-[calc(100vh-4rem)] lg:border-r lg:px-5 lg:py-8">
          <p className="mb-3 hidden px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground lg:block">Browse by category</p>
          <p className="mb-2 text-xs text-muted-foreground lg:hidden">网站分类 · 左右滑动查看更多</p>
          <nav aria-label="网站分类" className="-mx-3 flex touch-auto flex-nowrap gap-2 overflow-x-auto overscroll-x-contain px-3 pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:-mx-4 sm:px-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
            {(['全部', ...siteCategories] as Category[]).map((name) => {
              const Icon = categoryIcons[name] || FolderOpen;
              const selected = activeCategory === name;
              const count = name === '全部' ? allSites.length : allSites.filter((site) => site.category === name).length;
              return (
                <div key={name} className="group/category flex shrink-0 items-center gap-1 lg:w-full">
                  <button type="button" aria-pressed={selected} onClick={() => setActiveCategory(name)} className={`flex min-w-0 flex-1 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm transition-colors ${selected ? 'bg-primary/12 text-primary ring-1 ring-primary/22' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}>
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{name}</span>
                    <span className="ml-auto hidden min-w-5 text-right text-[11px] opacity-65 lg:block">{count}</span>
                  </button>
                  {name !== '全部' && name !== '未分类' ? (
                    <button type="button" onClick={() => deleteCategory(name)} className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground/45 transition hover:bg-destructive/10 hover:text-destructive lg:opacity-0 lg:group-hover/category:opacity-100" aria-label={`删除分类 ${name}`} title={`删除分类 ${name}`}>
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              );
            })}
          </nav>

          <Dialog open={categoryDialogOpen} onOpenChange={(open) => {
            setCategoryDialogOpen(open);
            if (!open) {
              setCategoryDraft('');
              setCategoryError('');
            }
          }}>
            <DialogTrigger render={<Button variant="ghost" className="mt-2 w-full justify-start rounded-xl text-muted-foreground hover:text-primary" />}>
              <FolderPlus data-icon="inline-start" />
              新建分类
            </DialogTrigger>
            <DialogContent className="border border-white/10 bg-popover p-5 sm:max-w-sm">
              <form onSubmit={createCategory}>
                <DialogHeader>
                  <DialogTitle className="text-lg">新建分类</DialogTitle>
                  <DialogDescription>创建后即可在添加网站时选择。</DialogDescription>
                </DialogHeader>
                <label className="mt-5 grid gap-1.5 text-xs font-medium">
                  分类名称
                  <Input value={categoryDraft} onChange={(event) => setCategoryDraft(event.target.value)} placeholder="例如：空投工具" className="h-10" autoFocus maxLength={20} />
                </label>
                {categoryError && <p role="alert" className="mt-2 text-xs text-destructive">{categoryError}</p>}
                <DialogFooter className="mt-5">
                  <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(false)}>取消</Button>
                  <Button type="submit">创建分类</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <div className="mt-8 hidden rounded-2xl border border-white/8 bg-white/[0.025] p-4 lg:block">
            <ShieldCheck className="mb-3 size-5 text-primary" aria-hidden="true" />
            <p className="text-xs font-medium">先核对，再连接钱包</p>
            <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">收藏夹只保存入口。访问任何交易网站前，请再次核对域名。</p>
          </div>
        </aside>

        <section className="min-w-0 px-3 pb-14 pt-2 sm:px-6 sm:pt-6 lg:px-10 lg:pb-24 lg:pt-8">
          <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-card px-4 py-6 shadow-[0_32px_80px_rgba(0,0,0,.22)] sm:rounded-[28px] sm:px-8 sm:py-9">
            <div className="orb orb-one" aria-hidden="true" />
            <div className="orb orb-two" aria-hidden="true" />
            <div className="absolute inset-y-0 right-0 hidden w-[48%] overflow-hidden lg:block">
              <img src="/og.png" alt="抽象的市场趋势线与链上节点主视觉" className="h-full w-full origin-right scale-[1.68] object-cover object-right opacity-90" />
              <span className="absolute inset-0 bg-gradient-to-r from-card via-card/35 to-transparent" aria-hidden="true" />
            </div>
            <div className="relative max-w-3xl lg:max-w-[58%]">
              <div className="mb-4 flex items-center gap-2 text-xs font-medium text-primary"><Sparkles className="size-4" aria-hidden="true" /><span>你的加密世界，一页直达</span></div>
              <h1 className="max-w-2xl text-balance text-2xl font-semibold leading-[1.1] tracking-[-0.04em] min-[380px]:text-3xl sm:text-5xl">把常用市场入口，<br className="hidden sm:block" />收进一个清醒的页面。</h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-[15px]">行情、交易、链上数据与研究资料，不再散落在浏览器标签里。</p>
              <label className="mt-5 flex max-w-2xl items-center gap-3 rounded-2xl border border-white/10 bg-background/72 p-2 shadow-[0_16px_35px_rgba(0,0,0,.18)] focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/8 sm:mt-7">
                <Search className="ml-2 size-4 text-muted-foreground" aria-hidden="true" />
                <span className="sr-only">搜索网站</span>
                <Input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索网站、用途或分类…" className="h-10 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0" />
                <kbd className="mr-1 hidden rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-muted-foreground sm:block">/</kbd>
              </label>
            </div>
          </div>

          <div className="mb-4 mt-7 flex items-end justify-between gap-3 sm:mb-5 sm:mt-9 sm:gap-4">
            <div><p className="text-xs font-medium text-primary">{activeCategory}</p><h2 className="mt-1 text-xl font-semibold tracking-tight">常用入口</h2></div>
            <div className="text-right text-xs text-muted-foreground">
              <p className="hidden min-[420px]:block">{query.trim() ? '清除搜索后可拖动排序' : '拖动右上角手柄排序'}</p>
              <p className="mt-1 opacity-65">显示 {filteredSites.length} 个结果</p>
            </div>
          </div>

          {filteredSites.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredSites.map((site) => (
                <article
                  key={site.id}
                  data-site-id={site.id}
                  className={`site-card group relative min-h-[152px] overflow-hidden rounded-2xl border bg-card p-4 transition-[transform,opacity,border-color,box-shadow] sm:min-h-[164px] sm:p-5 ${draggingSiteId === site.id ? 'z-10 scale-[.98] border-primary/50 opacity-70 shadow-[0_20px_45px_rgba(0,0,0,.32)]' : 'border-white/8'}`}
                >
                  <a href={site.url} target="_blank" rel="noreferrer" className="absolute inset-0 z-[1]" aria-label={`打开 ${site.name}`} />
                  <div className="pointer-events-none relative z-[2] flex items-start justify-between gap-4">
                    <SiteLogo site={site} />
                    <span className="grid size-8 place-items-center rounded-full border border-white/8 text-muted-foreground transition group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary"><ArrowUpRight className="size-4" aria-hidden="true" /></span>
                  </div>
                  <button
                    type="button"
                    disabled={Boolean(query.trim())}
                    onPointerDown={(event) => startHandleDrag(event, site.id)}
                    onPointerMove={moveHandleDrag}
                    onPointerUp={finishHandleDrag}
                    onPointerCancel={finishHandleDrag}
                    onClick={(event) => { event.preventDefault(); event.stopPropagation(); }}
                    className="absolute right-14 top-4 z-[3] grid size-8 touch-none place-items-center rounded-full text-muted-foreground/55 transition hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30 enabled:cursor-grab enabled:active:cursor-grabbing sm:top-5"
                    aria-label={`拖动 ${site.name} 排序`}
                    title={query.trim() ? '清除搜索后可排序' : '按住并拖动排序'}
                  ><GripVertical className="size-4" aria-hidden="true" /></button>
                  <div className="pointer-events-none relative z-[2] mt-5">
                    <div className="flex items-center gap-2"><h3 className="font-medium tracking-tight">{site.name}</h3>{site.featured && <span className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" aria-label="精选" />}</div>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">{site.description}</p>
                  </div>
                  <button type="button" onClick={() => removeSite(site)} className="absolute bottom-3.5 left-4 z-[3] grid size-7 place-items-center rounded-lg text-muted-foreground/45 opacity-70 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100" aria-label={`删除 ${site.name}`} title={`删除 ${site.name}`}><Trash2 className="size-3.5" /></button>
                  <span className="pointer-events-none absolute bottom-4 right-5 z-[2] text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/60">{site.category}</span>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/12 px-6 py-16 text-center">
              <Database className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />
              <h3 className="mt-4 text-sm font-medium">没有找到匹配的网站</h3>
              <p className="mt-1 text-xs text-muted-foreground">换个关键词，或查看“全部”分类。</p>
            </div>
          )}
        </section>
      </div>

      {notice && <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-primary/20 bg-popover px-4 py-2.5 text-xs shadow-2xl"><span className="mr-2 text-primary">●</span>{notice}</div>}
    </main>
  );
}
