import { z } from "zod"

// Common validation schemas
export const phoneSchema = z.string()
  .min(10, "Phone number must be at least 10 digits")
  .max(15, "Phone number must be at most 15 digits")
  .regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format")

export const emailSchema = z.string()
  .email("Invalid email format")
  .max(255, "Email must be at most 255 characters")

export const nameSchema = z.string()
  .min(1, "Name is required")
  .max(100, "Name must be at most 100 characters")
  .regex(/^[a-zA-Z\s\.]+$/, "Name can only contain letters, spaces, and dots")

export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number")

export const workspaceNameSchema = z.string()
  .min(1, "Workspace name is required")
  .max(50, "Workspace name must be at most 50 characters")
  .regex(/^[a-zA-Z0-9\s\-_]+$/, "Workspace name can only contain letters, numbers, spaces, hyphens, and underscores")

export const policyNumberSchema = z.string()
  .min(1, "Policy number is required")
  .max(50, "Policy number must be at most 50 characters")
  .regex(/^[A-Z0-9\-\/]+$/, "Policy number can only contain uppercase letters, numbers, hyphens, and forward slashes")

export const amountSchema = z.number()
  .min(0, "Amount must be positive")
  .max(999999999.99, "Amount is too large")

// Sanitization helpers
export function sanitizeString(input: string): string {
  return input.trim().replace(/\s+/g, ' ')
}

export function sanitizePhone(input: string): string {
  // Ensure phone starts with + and contains only digits and +
  const cleaned = input.replace(/[^\d\+]/g, '')
  if (cleaned.startsWith('+')) {
    return cleaned
  }
  // If no country code, assume India (+91)
  return cleaned.length >= 10 ? `+91${cleaned}` : cleaned
}

export function sanitizeEmail(input: string): string {
  return input.toLowerCase().trim()
}