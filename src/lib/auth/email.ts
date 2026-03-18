import { ALLOWED_EMAIL_DOMAINS } from "./constants"

export function normalizeEmailAddress(email: string): string {
  return email.trim().toLowerCase()
}

export function isAllowedEmailDomain(email: string): boolean {
  const normalized = normalizeEmailAddress(email)
  const parts = normalized.split("@")

  if (parts.length !== 2 || !parts[1]) {
    return false
  }

  return ALLOWED_EMAIL_DOMAINS.includes(parts[1])
}

