import { NextRequest, NextResponse } from 'next/server';
import { checkCredentials, createSession, SESSION_COOKIE } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    if (!checkCredentials(username, password)) {
      return NextResponse.json({ error: 'שם משתמש או סיסמה שגויים' }, { status: 401 });
    }
    const token = await createSession();
    const res = NextResponse.json({ success: true });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24h
      path: '/',
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
