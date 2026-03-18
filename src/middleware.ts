import type { MiddlewareHandler } from 'astro';
import { getAuthenticatedEmail } from './lib/auth/session';

export const onRequest: MiddlewareHandler = async (context, next) => {
  const pathname = context.url.pathname;

  if (pathname === '/dashboard') {
    const email = await getAuthenticatedEmail(context.locals, context.cookies, Math.floor(Date.now() / 1000));

    if (!email) {
      return context.redirect('/auth');
    }

    context.locals.authenticatedEmail = email;
  }

  return next();
};
