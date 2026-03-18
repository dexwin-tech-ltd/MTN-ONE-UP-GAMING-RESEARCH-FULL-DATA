import type { APIRoute } from 'astro';
import { getAuthConfig } from '../../../lib/auth/config';
import { hashMagicLinkVerifier, parseMagicLinkToken } from '../../../lib/auth/magic-links';
import { createSessionCookieValue, setSessionCookie } from '../../../lib/auth/session-cookie';
import { consumeMagicLink } from '../../../lib/db/magic-links';

export const POST: APIRoute = async ({ request, cookies, locals, redirect }) => {
  const formData = await request.formData();
  const token = String(formData.get('token') ?? '');
  const now = Math.floor(Date.now() / 1000);

  if (!token) {
    return redirect('/verify?status=missing-token', 303);
  }

  const parts = parseMagicLinkToken(token);

  if (!parts) {
    return redirect('/verify?status=invalid', 303);
  }

  const authConfig = getAuthConfig(locals, { requestUrl: request.url });

  try {
    const result = await consumeMagicLink(
      locals,
      parts.selector,
      await hashMagicLinkVerifier(parts.verifier),
      now,
    );

    if (result.status === 'already-used') {
      return redirect('/verify?status=used', 303);
    }

    if (result.status === 'expired') {
      return redirect('/verify?status=expired', 303);
    }

    if (result.status === 'not-found' || !result.email) {
      return redirect('/verify?status=invalid', 303);
    }

    const sessionValue = await createSessionCookieValue(result.email, authConfig.sessionSecret, now);
    setSessionCookie(cookies, sessionValue, new URL(request.url).protocol === 'https:');

    return redirect('/dashboard', 303);
  } catch {
    return redirect('/verify?status=error', 303);
  }
};
