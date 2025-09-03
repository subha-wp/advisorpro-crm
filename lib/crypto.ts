import crypto from "crypto"

const KEY_ENV = process.env.STACK_SECRET_SERVER_KEY || ""
if (!KEY_ENV) {
  console.warn("[v0] STACK_SECRET_SERVER_KEY missing; email credential encryption disabled")
}

function getKey() {
  // Derive a 32-byte key from the secret
  return crypto.createHash("sha256").update(KEY_ENV).digest()
}

export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(12)
    const key = getKey()
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
    const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])
    const tag = cipher.getAuthTag()
    return Buffer.concat([iv, tag, enc]).toString("base64")
  } catch (e) {
    console.error("[v0] encrypt error", e)
    return ""
  }
}

export function decrypt(encBase64: string): string {
  try {
    const raw = Buffer.from(encBase64, "base64")
    const iv = raw.subarray(0, 12)
    const tag = raw.subarray(12, 28)
    const data = raw.subarray(28)
    const key = getKey()
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
    decipher.setAuthTag(tag)
    const dec = Buffer.concat([decipher.update(data), decipher.final()])
    return dec.toString("utf8")
  } catch (e) {
    console.error("[v0] decrypt error", e)
    return ""
  }
}
