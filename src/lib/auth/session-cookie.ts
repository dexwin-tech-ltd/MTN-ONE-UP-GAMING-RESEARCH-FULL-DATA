import type { AstroCookies } from 'astro';
import { SESSION_COOKIE_NAME } from './constants';
import { signValue, verifySignedValue } from './crypto';
import { isAllowedEmailDomain } from './email';

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

interface SessionPayload {
  email: string;
  exp: number;
}

function encodePayload(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function decodePayload(value: string): SessionPayload | null {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSessionCookieValue(email: string, secret: string, now: number): Promise<string> {
  return signValue(
    encodePayload({
      email,
      exp: now + SESSION_MAX_AGE_SECONDS,
    }),
    secret,
  );
}

export async function readSessionCookieValue(cookieValue: string, secret: string, now: number): Promise<string | null> {
  const unsigned = await verifySignedValue(cookieValue, secret);

  if (!unsigned) {
    return null;
  }

  const payload = decodePayload(unsigned);

  if (!payload || payload.exp < now || !isAllowedEmailDomain(payload.email)) {
    return null;
  }

  return payload.email;
}

export function setSessionCookie(cookies: AstroCookies, value: string, secure: boolean): void {
  cookies.set(SESSION_COOKIE_NAME, value, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(cookies: AstroCookies): void {
  cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}
