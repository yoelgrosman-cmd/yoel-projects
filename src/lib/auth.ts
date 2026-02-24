import { cookies } from 'next/headers';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'bilubikes2024';
const SESSION_COOKIE = 'bilu_admin_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'bilu-bikes-secret-2024';

export function checkCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export async function createSession(): Promise<string> {
  const token = Buffer.from(`${SESSION_SECRET}:${Date.now()}`).toString('base64');
  return token;
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session?.value) return false;
  try {
    const decoded = Buffer.from(session.value, 'base64').toString('utf-8');
    return decoded.startsWith(SESSION_SECRET);
  } catch {
    return false;
  }
}

export { SESSION_COOKIE };
