import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';

export async function POST(request: Request) {
  const expectedPassword = process.env.DASHBOARD_PASSWORD;
  const sessionSecret = process.env.DASHBOARD_SESSION_SECRET;

  if (!expectedPassword || !sessionSecret) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  let submitted = '';
  try {
    const body = (await request.json()) as { password?: unknown };
    if (typeof body.password === 'string') submitted = body.password;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const submittedBuf = Buffer.from(submitted, 'utf8');
  const expectedBuf = Buffer.from(expectedPassword, 'utf8');

  if (submittedBuf.length !== expectedBuf.length) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  if (!timingSafeEqual(submittedBuf, expectedBuf)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const token = createHmac('sha256', sessionSecret).update('authed').digest('hex');
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: 'rw-auth',
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
