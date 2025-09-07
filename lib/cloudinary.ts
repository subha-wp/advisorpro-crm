import { getPrisma } from "@/lib/db"
import { decrypt } from "@/lib/crypto"

export interface CloudinaryConfig {
  cloudName: string
  apiKey: string
  apiSecret: string
}

export interface UploadResult {
  public_id: string
  secure_url: string
  original_filename: string
  bytes: number
  format: string
  resource_type: string
}

export async function getWorkspaceCloudinary(workspaceId: string): Promise<CloudinaryConfig | null> {
  const prisma = await getPrisma()
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      cloudinaryCloudNameEnc: true,
      cloudinaryApiKeyEnc: true,
      cloudinaryApiSecretEnc: true,
    },
  })
  
  if (!workspace?.cloudinaryCloudNameEnc || !workspace?.cloudinaryApiKeyEnc || !workspace?.cloudinaryApiSecretEnc) {
    return null
  }

  const cloudName = decrypt(workspace.cloudinaryCloudNameEnc)
  const apiKey = decrypt(workspace.cloudinaryApiKeyEnc)
  const apiSecret = decrypt(workspace.cloudinaryApiSecretEnc)

  if (!cloudName || !apiKey || !apiSecret) {
    return null
  }

  return { cloudName, apiKey, apiSecret }
}

export async function uploadToCloudinary(
  workspaceId: string,
  file: File,
  options: {
    folder?: string
    transformation?: string
    resourceType?: 'image' | 'video' | 'raw' | 'auto'
  } = {}
): Promise<UploadResult> {
  const config = await getWorkspaceCloudinary(workspaceId)
  if (!config) {
    throw new Error("Cloudinary not configured for this workspace")
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', 'unsigned_upload') // You'll need to create this in Cloudinary
  
  if (options.folder) {
    formData.append('folder', options.folder)
  }

  const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/${options.resourceType || 'auto'}/upload`

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Upload failed')
  }

  return response.json()
}

export async function deleteFromCloudinary(
  workspaceId: string,
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<void> {
  const config = await getWorkspaceCloudinary(workspaceId)
  if (!config) {
    throw new Error("Cloudinary not configured for this workspace")
  }

  // Generate signature for authenticated deletion
  const timestamp = Math.round(Date.now() / 1000)
  const crypto = require('crypto')
  
  const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${config.apiSecret}`
  const signature = crypto.createHash('sha1').update(stringToSign).digest('hex')

  const deleteUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/destroy`

  const response = await fetch(deleteUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      public_id: publicId,
      timestamp,
      api_key: config.apiKey,
      signature,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Delete failed')
  }
}

export function getCloudinaryUrl(
  publicId: string,
  cloudName: string,
  transformation?: string
): string {
  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`
  
  if (transformation) {
    return `${baseUrl}/${transformation}/${publicId}`
  }
  
  return `${baseUrl}/${publicId}`
}

// Common transformations
export const CLOUDINARY_TRANSFORMATIONS = {
  logo: 'w_200,h_200,c_fit,f_auto,q_auto',
  thumbnail: 'w_150,h_150,c_fill,f_auto,q_auto',
  letterhead: 'w_800,h_1200,c_fit,f_auto,q_auto',
  signature: 'w_300,h_100,c_fit,f_auto,q_auto',
  document: 'w_800,c_fit,f_auto,q_auto',
}