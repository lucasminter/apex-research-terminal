import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ─── Types ────────────────────────────────────────────────────────────────────
interface RegimeResult {
  regime: 1 | 2 | 3 | 4;
  confidence: number;
  growthScore: number;
  inflationScore: number;
  indicators: {
    cpiYoY: number | null;
    gdpGrowth: number | null;
    topHeadlines: string[];
  };
  updatedAt: string;
  error?: string;
}

// ─── In-memory cache (1 hour) ─────────────────────────────────────────────────
let cache: { data: RegimeResult; ts: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000;

// ─── Keyword lists ────────────────────────────────────────────────────────────
const GROWTH_POS = ['expansion', 'hiring', 'gdp beat', 'strong growth', 'economy grows',
  'jobs added', 'job gains', 'recovery', 'bull market', 'rally', 'spending rises', 'consumer confidence'];
const GROWTH_NEG = ['recession', 'layoffs', 'contraction', 'slowdown', 'gdp miss',
  'downturn', 'job cuts', 'bear market', 'crash', 'unemployment rises', 'default'];
const INFLATION_POS = ['inflation', 'cpi', 'rate hike', 'prices surge', 'price rise',
  'fed raises', 'hot inflation', 'hawkish', 'tighten', 'cost of living', 'tariff'];
const INFLATION_NEG = ['deflation', 'rate cut', 'disinflation', 'prices fall', 'fed cuts',
  'dovish', 'easing', 'cooling inflation', 'below target'];

const RSS_FEEDS = [
  'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC&region=US&lang=en-US',
  'https://feeds.reuters.com/reuters/businessNews',
  'https://www.cnbc.com/id/20910258/device/rss/rss.html',
  'https://feeds.marketwatch.com/marketwatch/topstories/',
];

const FRED_UA = 'Mozilla/5.0 (compatible; ApexResearchBot/1.0)';

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function fetchFredCSV(seriesId: string): Promise<number[]> {
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': FRED_UA, 'Accept': 'text/csv,*/*' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`FRED ${seriesId}: HTTP ${res.status}`);
  const text = await res.text();
  return text.trim().split('\n').slice(1)
    .map(l => parseFloat(l.split(',')[1]))
    .filter(n => !isNaN(n));
}

async function fetchRSSHeadlines(url: string): Promise<string[]> {
  const res = await fetch(url, {
    headers: { 'User-Agent': FRED_UA, 'Accept': 'application/rss+xml,text/xml,*/*' },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) return [];
  const text = await res.text();
  const titles: string[] = [];
  const re = /<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const t = m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    if (t.length > 12 && !t.includes('<?xml') && !t.toLowerCase().includes('rss')) {
      titles.push(t);
    }
  }
  return titles.slice(0, 20);
}

function scoreKeywords(headlines: string[], pos: string[], neg: string[]): number {
  const text = headlines.join(' ').toLowerCase();
  let score = 0;
  pos.forEach(w => { score += (text.split(w).length - 1) * 0.15; });
  neg.forEach(w => { score -= (text.split(w).length - 1) * 0.15; });
  return Math.max(-1, Math.min(1, score));
}

// ─── Route ────────────────────────────────────────────────────────────────────
export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const [cpiResult, gdpResult, ...rssResults] = await Promise.allSettled([
      fetchFredCSV('CPIAUCSL'),
      fetchFredCSV('A191RL1Q225SBEA'),
      ...RSS_FEEDS.map(fetchRSSHeadlines),
    ]);

    // CPI YoY
    let cpiYoY: number | null = null;
    let inflationHard = 0;
    if (cpiResult.status === 'fulfilled' && cpiResult.value.length >= 13) {
      const v = cpiResult.value;
      cpiYoY = parseFloat((((v.at(-1)! - v.at(-13)!) / v.at(-13)!) * 100).toFixed(2));
      inflationHard = cpiYoY > 3.5 ? 0.7 : cpiYoY > 2.5 ? 0.3 : cpiYoY < 1.5 ? -0.6 : -0.1;
    }

    // GDP QoQ annualised
    let gdpGrowth: number | null = null;
    let growthHard = 0;
    if (gdpResult.status === 'fulfilled' && gdpResult.value.length > 0) {
      gdpGrowth = gdpResult.value.at(-1)!;
      growthHard = gdpGrowth > 3 ? 0.7 : gdpGrowth > 1 ? 0.3 : gdpGrowth < 0 ? -0.6 : -0.1;
    }

    // News sentiment
    const allHeadlines: string[] = [];
    for (const r of rssResults) {
      if (r.status === 'fulfilled') allHeadlines.push(...r.value);
    }

    const newsGrowth = scoreKeywords(allHeadlines, GROWTH_POS, GROWTH_NEG);
    const newsInflation = scoreKeywords(allHeadlines, INFLATION_POS, INFLATION_NEG);

    // Weighted composite (hard 60% + news 40%)
    const growthScore = parseFloat((growthHard * 0.6 + newsGrowth * 0.4).toFixed(3));
    const inflationScore = parseFloat((inflationHard * 0.6 + newsInflation * 0.4).toFixed(3));

    // Regime
    let regime: 1 | 2 | 3 | 4;
    if (growthScore >= 0 && inflationScore >= 0) regime = 3;      // Goldilocks
    else if (growthScore < 0 && inflationScore >= 0) regime = 1;  // Stagflation
    else if (growthScore < 0 && inflationScore < 0) regime = 4;   // Def. Bust
    else regime = 2;                                               // Inflation Bust

    // Confidence: magnitude of both signals combined
    const confidence = Math.round(Math.min(100, (Math.abs(growthScore) + Math.abs(inflationScore)) * 55));

    // Top relevant headlines
    const allWords = [...GROWTH_POS, ...GROWTH_NEG, ...INFLATION_POS, ...INFLATION_NEG];
    const topHeadlines = allHeadlines
      .filter(h => allWords.some(w => h.toLowerCase().includes(w)))
      .slice(0, 5);

    const result: RegimeResult = {
      regime, confidence, growthScore, inflationScore,
      indicators: { cpiYoY, gdpGrowth, topHeadlines },
      updatedAt: new Date().toISOString(),
    };

    cache = { data: result, ts: Date.now() };
    return NextResponse.json(result);

  } catch (e: any) {
    return NextResponse.json({
      regime: 3 as const, confidence: 0,
      growthScore: 0, inflationScore: 0,
      indicators: { cpiYoY: null, gdpGrowth: null, topHeadlines: [] },
      updatedAt: new Date().toISOString(),
      error: e?.message ?? String(e),
    });
  }
}
