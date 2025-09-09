import bcrypt from "bcryptjs"

export async function hashPassword(plain: string) {
  const salt = await bcrypt.genSalt(12) // Increased salt rounds for better security
  return bcrypt.hash(plain, salt)
}

export async function verifyPassword(plain: string, hash: string) {
  // Trim whitespace from password input
  const trimmedPassword = plain.trim()
  return bcrypt.compare(trimmedPassword, hash)
}
