import { getPrisma } from "@/lib/db"
import { decrypt } from "@/lib/crypto"

export interface CloudinaryConfig {
  cloudName: string
  apiKey: string
  apiSecret: string
}

export const CLOUDINARY_TRANSFORMATIONS = {
  logo: "c_fit,h_200,w_200,f_auto,q_auto",
  letterhead: "c_fit,h_800,w_600,f_auto,q_auto",
  signature: "c_fit,h_150,w_400,f_auto,q_auto",
  certificate: "c_fit,h_600,w_800,f_auto,q_auto",
  avatar: "c_fill,g_face,h_200,w_200,f_auto,q_auto",
  avatar_small: "c_fill,g_face,h_64,w_64,f_auto,q_auto",
  avatar_large: "c_fill,g_face,h_400,w_400,f_auto,q_auto",
  other: "c_fit,h_600,w_800,f_auto,q_auto",
} as const

/**
 * Get decrypted Cloudinary configuration for a workspace
 */
export async function getWorkspaceCloudinary(workspaceId: string): Promise<CloudinaryConfig | null> {
  try {
    const prisma = await getPrisma()

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        cloudinaryCloudNameEnc: true,
        cloudinaryApiKeyEnc: true,
        cloudinaryApiSecretEnc: true,
      },
    })

    if (
      !workspace ||
      !workspace.cloudinaryCloudNameEnc ||
      !workspace.cloudinaryApiKeyEnc ||
      !workspace.cloudinaryApiSecretEnc
    ) {
      return null
    }

    // Decrypt the stored credentials
    const cloudName = decrypt(workspace.cloudinaryCloudNameEnc)
    const apiKey = decrypt(workspace.cloudinaryApiKeyEnc)
    const apiSecret = decrypt(workspace.cloudinaryApiSecretEnc)

    if (!cloudName || !apiKey || !apiSecret) {
      console.error("[Cloudinary] Failed to decrypt credentials")
      return null
    }

    return {
      cloudName,
      apiKey,
      apiSecret,
    }
  } catch (error) {
    console.error("[Cloudinary] Error getting workspace config:", error)
    return null
  }
}

/**
 * Generate Cloudinary signature for authenticated uploads
 */
export function generateCloudinarySignature(params: Record<string, string | number>, apiSecret: string): string {
  const crypto = require("crypto")

  // Sort parameters alphabetically (required by Cloudinary)
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&")

  // Create signature
  const signature = crypto
    .createHash("sha1")
    .update(sortedParams + apiSecret)
    .digest("hex")

  return signature
}

/**
 * Delete asset from Cloudinary
 */
export async function deleteFromCloudinary(workspaceId: string, publicId: string): Promise<boolean> {
  try {
    const config = await getWorkspaceCloudinary(workspaceId)
    if (!config) {
      throw new Error("Cloudinary not configured")
    }

    const timestamp = Math.round(Date.now() / 1000)
    const signatureParams = {
      public_id: publicId,
      timestamp: timestamp,
    }
    
    const signature = generateCloudinarySignature(signatureParams, config.apiSecret)
    
    const deleteFormData = new FormData()
    deleteFormData.append("public_id", publicId)
    deleteFormData.append("api_key", config.apiKey)
    deleteFormData.append("timestamp", timestamp.toString())
    deleteFormData.append("signature", signature)

    const deleteUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`
    const response = await fetch(deleteUrl, {
      method: "POST",
      body: deleteFormData,
    })

    return response.ok
  } catch (error) {
    console.error("[Cloudinary Delete Error]", error)
    return false
  }
}