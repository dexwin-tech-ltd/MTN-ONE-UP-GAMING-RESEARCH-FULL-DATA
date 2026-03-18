const encoder = new TextEncoder()

function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4)
  return new Uint8Array([...Buffer.from(padded, "base64")])
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  )
}

export function generateRandomToken(size = 32): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(size)))
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value))
  return Buffer.from(digest).toString("hex")
}

export async function signValue(
  value: string,
  secret: string,
): Promise<string> {
  const key = await importHmacKey(secret)
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value))
  return `${value}.${toBase64Url(new Uint8Array(signature))}`
}

export async function verifySignedValue(
  signedValue: string,
  secret: string,
): Promise<string | null> {
  const lastDotIndex = signedValue.lastIndexOf(".")

  if (lastDotIndex <= 0) {
    return null
  }

  const value = signedValue.slice(0, lastDotIndex)
  const signature = signedValue.slice(lastDotIndex + 1)
  const key = await importHmacKey(secret)
  const signatureBytes = fromBase64Url(signature)
  const isValid = await crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes as unknown as BufferSource,
    encoder.encode(value),
  )

  return isValid ? value : null
}

