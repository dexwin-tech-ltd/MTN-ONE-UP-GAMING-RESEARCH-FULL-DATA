import type { AstroCookies } from "astro"
import { getAuthConfig } from "./config"
import { SESSION_COOKIE_NAME } from "./constants"
import { readSessionCookieValue } from "./session-cookie"

export function hasSessionCookie(cookies: AstroCookies): boolean {
  return Boolean(cookies.get(SESSION_COOKIE_NAME)?.value)
}

export async function getAuthenticatedEmail(
  locals: App.Locals,
  cookies: AstroCookies,
  now: number,
): Promise<string | null> {
  const cookieValue = cookies.get(SESSION_COOKIE_NAME)?.value

  if (!cookieValue) {
    return null
  }

  const authConfig = getAuthConfig(locals)
  return readSessionCookieValue(cookieValue, authConfig.sessionSecret, now)
}

