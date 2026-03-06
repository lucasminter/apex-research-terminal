import { NextResponse } from 'next/server';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://finance.yahoo.com/',
};

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbols = searchParams.get('symbols');
  const q = searchParams.get('q');

  try {
    if (q) {
      const url = 'https://query1.finance.yahoo.com/v1/finance/search?q=' + encodeURIComponent(q) + '&quotesCount=8&newsCount=0&enableFuzzyQuery=false';
      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(5000) });
      if (!res.ok) return NextResponse.json({ quotes: [], error: res.status });
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (symbols) {
      const url = 'https://query2.finance.yahoo.com/v7/finance/quote?symbols=' + encodeURIComponent(symbols);
      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(5000) });
      if (!res.ok) return NextResponse.json({ quoteResponse: { result: [] }, error: res.status });
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Provide symbols or q parameter' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e), quotes: [], quoteResponse: { result: [] } }, { status: 500 });
  }
}
