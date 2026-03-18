import type { APIRoute } from 'astro';
import { clearSessionCookie } from '../../../lib/auth/session-cookie';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  clearSessionCookie(cookies);
  return redirect('/signed-out');
};
