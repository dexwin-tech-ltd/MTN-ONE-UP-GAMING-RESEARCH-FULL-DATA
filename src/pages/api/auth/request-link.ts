import type { APIRoute } from 'astro';
import { getAuthConfig } from '../../../lib/auth/config';
import { sendMagicLinkEmail } from '../../../lib/auth/email-provider';
import { isAllowedEmailDomain, normalizeEmailAddress } from '../../../lib/auth/email';
import { createMagicLinkParts, hashMagicLinkVerifier, MAGIC_LINK_MAX_AGE_SECONDS } from '../../../lib/auth/magic-links';
import { createMagicLink } from '../../../lib/db/magic-links';
import { enforceRateLimit } from '../../../lib/db/rate-limit';

export const POST: APIRoute = async ({ request, locals }) => {
  const formData = await request.formData();
  const email = normalizeEmailAddress(String(formData.get('email') ?? ''));
  const now = Math.floor(Date.now() / 1000);

  if (!email) {
    return new Response('Email is required.', { status: 400 });
  }

  const authConfig = getAuthConfig(locals, { requestUrl: request.url });

  try {
    const ipAddress = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'unknown';
    const emailAllowed = await enforceRateLimit(locals, {
      key: email,
      bucket: 'email',
      limit: 5,
      windowSeconds: 60 * 10,
      now,
    });
    const ipAllowed = await enforceRateLimit(locals, {
      key: ipAddress,
      bucket: 'ip',
      limit: 20,
      windowSeconds: 60 * 10,
      now,
    });

    if (!emailAllowed || !ipAllowed) {
      return Response.redirect(new URL('/auth?status=rate-limited', request.url), 303);
    }
  } catch {
    return Response.redirect(new URL('/auth?status=error', request.url), 303);
  }

  if (!isAllowedEmailDomain(email)) {
    return Response.redirect(new URL('/auth?status=domain-error', request.url), 303);
  }

  try {
    const { selector, verifier, token } = createMagicLinkParts();
    await createMagicLink(locals, {
      selector,
      verifierHash: await hashMagicLinkVerifier(verifier),
      email,
      expiresAt: now + MAGIC_LINK_MAX_AGE_SECONDS,
      createdAt: now,
      requestIp: request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    const baseUrl = authConfig.publicBaseUrl ?? new URL(request.url).origin;
    const magicLinkUrl = `${baseUrl}/verify?token=${encodeURIComponent(token)}`;

    await sendMagicLinkEmail({
      apiKey: authConfig.resendApiKey,
      from: authConfig.emailFrom,
      to: email,
      magicLinkUrl,
    });
  } catch {
    return Response.redirect(new URL('/auth?status=error', request.url), 303);
  }

  return Response.redirect(new URL('/auth?status=check-email', request.url), 303);
};
