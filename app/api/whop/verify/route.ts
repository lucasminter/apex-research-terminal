import { NextResponse } from 'next/server';
import { whopsdk } from '@/lib/whop';

// Server-only debug endpoint to verify a Whop user token.
// POST or GET with header `x-whop-user-token: <token>` (or Authorization).

export async function GET(req: Request) {
  return verify(req);
}

export async function POST(req: Request) {
  return verify(req);
}

async function verify(req: Request) {
  const token = req.headers.get('x-whop-user-token') ?? req.headers.get('authorization');
  if (!token) return NextResponse.json({ error: 'no token provided' }, { status: 400 });

  try {
    const verified = await whopsdk.verifyUserToken(token as any);
    return NextResponse.json({ ok: true, verified });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message ?? err) }, { status: 401 });
  }
}
