import { getDatabase } from "./runtime"
import type { MagicLinkRecord } from "./types"

interface CreateMagicLinkInput {
  selector: string
  verifierHash: string
  email: string
  expiresAt: number
  createdAt: number
  requestIp: string | null
  userAgent: string | null
}

interface ConsumeMagicLinkResult {
  status: "consumed" | "already-used" | "expired" | "not-found"
  email?: string
}

const inMemoryMagicLinks = new Map<string, MagicLinkRecord>()

function getInMemoryKey(selector: string, verifierHash: string): string {
  return `${selector}:${verifierHash}`
}

export async function createMagicLink(
  locals: App.Locals,
  input: CreateMagicLinkInput,
): Promise<void> {
  let db: ReturnType<typeof getDatabase> | null = null

  try {
    db = getDatabase(locals)
  } catch {
    db = null
  }

  if (!db) {
    inMemoryMagicLinks.set(getInMemoryKey(input.selector, input.verifierHash), {
      selector: input.selector,
      verifier_hash: input.verifierHash,
      email: input.email,
      expires_at: input.expiresAt,
      consumed_at: null,
      created_at: input.createdAt,
      request_ip: input.requestIp,
      user_agent: input.userAgent,
    })

    return
  }

  await db
    .prepare(
      `INSERT INTO magic_link_tokens (
        selector,
        verifier_hash,
        email,
        expires_at,
        consumed_at,
        created_at,
        request_ip,
        user_agent
      ) VALUES (?, ?, ?, ?, NULL, ?, ?, ?)`,
    )
    .bind(
      input.selector,
      input.verifierHash,
      input.email,
      input.expiresAt,
      input.createdAt,
      input.requestIp,
      input.userAgent,
    )
    .run()
}

export async function consumeMagicLink(
  locals: App.Locals,
  selector: string,
  verifierHash: string,
  now: number,
): Promise<ConsumeMagicLinkResult> {
  let db: ReturnType<typeof getDatabase> | null = null

  try {
    db = getDatabase(locals)
  } catch {
    db = null
  }

  if (!db) {
    const inMemory = inMemoryMagicLinks.get(
      getInMemoryKey(selector, verifierHash),
    )

    if (!inMemory) {
      return { status: "not-found" }
    }

    if (inMemory.consumed_at) {
      return { status: "already-used" }
    }

    if (inMemory.expires_at < now) {
      return { status: "expired" }
    }

    inMemory.consumed_at = now
    return { status: "consumed", email: inMemory.email }
  }

  const consumed = await db
    .prepare(
      `UPDATE magic_link_tokens
       SET consumed_at = ?
       WHERE selector = ?
         AND verifier_hash = ?
         AND consumed_at IS NULL
         AND expires_at >= ?
       RETURNING email`,
    )
    .bind(now, selector, verifierHash, now)
    .first<{ email: string }>()

  if (consumed?.email) {
    return { status: "consumed", email: consumed.email }
  }

  const existing = await db
    .prepare(
      `SELECT email, expires_at, consumed_at
       FROM magic_link_tokens
       WHERE selector = ? AND verifier_hash = ?`,
    )
    .bind(selector, verifierHash)
    .first<Pick<MagicLinkRecord, "email" | "expires_at" | "consumed_at">>()

  if (!existing) {
    return { status: "not-found" }
  }

  if (existing.consumed_at) {
    return { status: "already-used" }
  }

  if (existing.expires_at < now) {
    return { status: "expired" }
  }

  return { status: "not-found" }
}

