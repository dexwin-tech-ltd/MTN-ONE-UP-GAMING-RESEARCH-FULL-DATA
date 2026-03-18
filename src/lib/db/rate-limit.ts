import { getDatabase } from "./runtime"

interface RateLimitInput {
  key: string
  bucket: string
  limit: number
  windowSeconds: number
  now: number
}

const inMemoryRateLimitCounts = new Map<string, number>()

export async function enforceRateLimit(
  locals: App.Locals,
  input: RateLimitInput,
): Promise<boolean> {
  let db: ReturnType<typeof getDatabase> | null = null

  try {
    db = getDatabase(locals)
  } catch {
    db = null
  }

  const windowStart = input.now - (input.now % input.windowSeconds)
  const compositeKey = `${input.bucket}:${input.key}:${windowStart}`

  if (!db) {
    const count = inMemoryRateLimitCounts.get(compositeKey) ?? 0

    if (count >= input.limit) {
      return false
    }

    inMemoryRateLimitCounts.set(compositeKey, count + 1)
    return true
  }

  const existing = await db
    .prepare("SELECT count FROM auth_rate_limits WHERE key = ?")
    .bind(compositeKey)
    .first<{ count: number }>()

  if (!existing) {
    await db
      .prepare(
        "INSERT INTO auth_rate_limits (key, bucket, window_start, count) VALUES (?, ?, ?, 1)",
      )
      .bind(compositeKey, input.bucket, windowStart)
      .run()

    return true
  }

  if (existing.count >= input.limit) {
    return false
  }

  await db
    .prepare("UPDATE auth_rate_limits SET count = count + 1 WHERE key = ?")
    .bind(compositeKey)
    .run()

  return true
}

