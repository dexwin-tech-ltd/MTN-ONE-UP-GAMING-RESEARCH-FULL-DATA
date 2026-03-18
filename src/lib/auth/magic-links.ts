import { generateRandomToken, sha256Hex } from "./crypto"

export const MAGIC_LINK_MAX_AGE_SECONDS = 60 * 60 * 24

export interface MagicLinkParts {
  selector: string
  verifier: string
  token: string
}

export function createMagicLinkParts(): MagicLinkParts {
  const selector = generateRandomToken(12)
  const verifier = generateRandomToken(32)

  return {
    selector,
    verifier,
    token: `${selector}.${verifier}`,
  }
}

export async function hashMagicLinkVerifier(verifier: string): Promise<string> {
  return sha256Hex(verifier)
}

export function parseMagicLinkToken(token: string): MagicLinkParts | null {
  const [selector, verifier] = token.split(".")

  if (!selector || !verifier) {
    return null
  }

  return {
    selector,
    verifier,
    token,
  }
}

