import { NextResponse } from 'next/server';

// Cache fetched data in memory for 24 h to avoid hammering external APIs.
// Keyed by ticker symbol or synthetic key like 'BTC-MERGED'.
const CACHE = new Map<string, { data: Record<string, number>; ts: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://finance.yahoo.com/',
};

// asset key → Yahoo Finance ticker
const TICKERS: Record<string, string> = {
  us:   'SPY',
  intl: 'EFA',
  bond: 'AGG',
  reit: 'VNQ',
  gold: 'GLD',
  tips: 'TIP',
  btc:  'BTC-USD',
};

/**
 * Fetch monthly adjusted-close prices from Yahoo Finance v8 chart API.
 * Returns { 'YYYY-MM': adjClose } — one entry per month (last trading day of month).
 */
async function fetchMonthlyCloses(ticker: string): Promise<Record<string, number>> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1mo&range=max&includeAdjustedClose=true`;
  const res = await fetch(url, { headers: YF_HEADERS, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Yahoo Finance ${ticker}: HTTP ${res.status}`);

  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(`Yahoo Finance ${ticker}: no result`);

  const timestamps: number[] = result.timestamps ?? result.timestamp ?? [];
  // Prefer adjclose (total-return) over raw close
  const closes: number[] =
    result.indicators?.adjclose?.[0]?.adjclose ??
    result.indicators?.quote?.[0]?.close ??
    [];

  const monthMap: Record<string, number> = {};
  for (let i = 0; i < timestamps.length; i++) {
    const c = closes[i];
    if (c == null || isNaN(c) || c <= 0) continue;
    const d = new Date(timestamps[i] * 1000);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    // Keep only the last entry per month (timestamps should already be monthly)
    monthMap[key] = c;
  }
  return monthMap;
}

/**
 * Convert month-end close prices to month-over-month decimal returns.
 * Returns { 'YYYY-MM': return } where return is e.g. 0.0312 for +3.12%
 */
function closesToReturns(closes: Record<string, number>): Record<string, number> {
  const keys = Object.keys(closes).sort();
  const returns: Record<string, number> = {};
  for (let i = 1; i < keys.length; i++) {
    const prev = closes[keys[i - 1]];
    const curr = closes[keys[i]];
    if (prev > 0) {
      returns[keys[i]] = parseFloat((curr / prev - 1).toFixed(6));
    }
  }
  return returns;
}

/**
 * Fetch and cache monthly returns for a single ticker.
 */
async function getMonthlyReturns(assetKey: string): Promise<{ data: Record<string, number>; error?: string }> {
  const ticker = TICKERS[assetKey];
  const cached = CACHE.get(ticker);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return { data: cached.data };
  }

  try {
    const closes = await fetchMonthlyCloses(ticker);
    const returns = closesToReturns(closes);
    CACHE.set(ticker, { data: returns, ts: Date.now() });
    return { data: returns };
  } catch (e: unknown) {
    // Return stale cache if available
    if (cached) return { data: cached.data, error: String(e) };
    return { data: {}, error: String(e) };
  }
}

/**
 * Fetch BTC price history from CoinGecko (free, no key).
 * Returns { 'YYYY-MM': monthEndPrice } back to July 2010.
 */
async function fetchCoinGeckoBTCMonthly(): Promise<Record<string, number>> {
  const url = 'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=max';
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`CoinGecko BTC: HTTP ${res.status}`);

  const json = await res.json();
  const prices: [number, number][] = json?.prices ?? [];

  // Group by YYYY-MM, keep the last (most recent = month-end) price per month.
  const monthMap: Record<string, number> = {};
  for (const [ts, price] of prices) {
    if (!price || isNaN(price) || price <= 0) continue;
    const d = new Date(ts);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    monthMap[key] = price;
  }
  return monthMap;
}

/**
 * Fetch BTC monthly returns by merging CoinGecko (2010–2014) with Yahoo (2014–present).
 * CoinGecko fills the pre-Yahoo gap so we get real monthly data back to July 2010.
 */
async function getBTCMergedReturns(): Promise<{ data: Record<string, number>; error?: string }> {
  const cacheKey = 'BTC-MERGED';
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return { data: cached.data };

  const [yahooResult, cgResult] = await Promise.allSettled([
    fetchMonthlyCloses('BTC-USD'),
    fetchCoinGeckoBTCMonthly(),
  ]);

  const yahooCloses = yahooResult.status === 'fulfilled' ? yahooResult.value : {};
  const cgCloses    = cgResult.status    === 'fulfilled' ? cgResult.value    : {};

  // Merge closes: CoinGecko fills months before Yahoo's first available month.
  // Yahoo takes priority where both sources have data.
  const yahooFirstMonth = Object.keys(yahooCloses).sort()[0] ?? '9999-99';
  const mergedCloses: Record<string, number> = {};
  for (const [k, v] of Object.entries(cgCloses)) {
    if (k < yahooFirstMonth) mergedCloses[k] = v;
  }
  // Include one CoinGecko month before Yahoo starts so the seam return is computable.
  const cgMonthBeforeYahoo = Object.keys(cgCloses).sort().filter(k => k < yahooFirstMonth).at(-1);
  if (cgMonthBeforeYahoo) mergedCloses[cgMonthBeforeYahoo] = cgCloses[cgMonthBeforeYahoo];
  for (const [k, v] of Object.entries(yahooCloses)) mergedCloses[k] = v;

  const returns = closesToReturns(mergedCloses);
  const errors: string[] = [];
  if (yahooResult.status === 'rejected') errors.push(`Yahoo: ${yahooResult.reason}`);
  if (cgResult.status    === 'rejected') errors.push(`CoinGecko: ${cgResult.reason}`);

  CACHE.set(cacheKey, { data: returns, ts: Date.now() });
  return { data: returns, error: errors.length ? errors.join('; ') : undefined };
}

export const dynamic = 'force-dynamic';

export async function GET() {
  // Fetch all assets in parallel; BTC uses merged Yahoo + CoinGecko source.
  const entries = await Promise.all(
    Object.keys(TICKERS).map(async (key) => {
      const { data, error } = key === 'btc'
        ? await getBTCMergedReturns()
        : await getMonthlyReturns(key);
      return [key, data, error] as [string, Record<string, number>, string | undefined];
    })
  );

  const payload: Record<string, Record<string, number>> = {};
  const errors: Record<string, string> = {};

  for (const [key, data, error] of entries) {
    payload[key] = data;
    if (error) errors[key] = error;
  }

  return NextResponse.json(
    { data: payload, errors: Object.keys(errors).length ? errors : undefined, updatedAt: new Date().toISOString() },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
  );
}
