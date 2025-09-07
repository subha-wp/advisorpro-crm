"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  Upload, 
  Image, 
  FileText, 
  Trash2, 
  ExternalLink,
  AlertTriangle,
  CheckCircle
} from "lucide-react"

interface Asset {
  id: string
  assetType: string
  fileName: string
  fileUrl: string
  fileSize?: number
  mimeType?: string
  uploadedByUser?: {
    name: string
    email: string
  }
  createdAt: string
}

interface AssetUploaderProps {
  assets: Asset[]
  cloudinaryConfigured: boolean
  onAssetUploaded: () => void
  onAssetDeleted: () => void
}

const assetTypes = [
  { value: "logo", label: "Company Logo", icon: Image, accept: "image/*" },
  { value: "letterhead", label: "Letterhead", icon: FileText, accept: "image/*,application/pdf" },
  { value: "signature", label: "Digital Signature", icon: FileText, accept: "image/*" },
  { value: "certificate", label: "Certificate", icon: FileText, accept: "image/*,application/pdf" },
  { value: "other", label: "Other Document", icon: FileText, accept: "image/*,application/pdf" },
]

export function AssetUploader({ 
  assets, 
  cloudinaryConfigured, 
  onAssetUploaded, 
  onAssetDeleted 
}: AssetUploaderProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(assetType: string, accept: string) {
    if (!cloudinaryConfigured) {
      toast({
        title: "Cloudinary not configured",
        description: "Please configure Cloudinary settings first",
        variant: "destructive"
      })
      return
    }

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.multiple = false
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "File size must be less than 10MB",
          variant: "destructive"
        })
        return
      }

      // Validate file type more strictly
      const allowedTypes = {
        logo: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        letterhead: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
        signature: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        certificate: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
        other: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
      }
      
      const allowed = allowedTypes[assetType as keyof typeof allowedTypes] || []
      if (!allowed.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `Please select a valid file type for ${assetType}`,
          variant: "destructive"
        })
        return
      }

      setUploading(true)
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('assetType', assetType)

        const res = await fetch("/api/workspace/upload", {
          method: "POST",
          body: formData,
        })

        const data = await res.json()
        
        if (res.ok) {
          toast({ 
            title: "File uploaded", 
            description: `${file.name} has been uploaded successfully` 
          })
          onAssetUploaded()
        } else {
          toast({ 
            title: "Upload failed", 
            description: data.error || "Failed to upload file",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error("[Asset Upload Error]", error)
        toast({ 
          title: "Upload failed", 
          description: "Network error. Please try again.",
          variant: "destructive"
        })
      } finally {
        setUploading(false)
      }
    }
    input.click()
  }

  async function deleteAsset(assetId: string, fileName: string) {
    if (!confirm(`Delete ${fileName}?`)) return

    try {
      const res = await fetch(`/api/workspace/assets/${assetId}`, {
        method: "DELETE",
      })

      const data = await res.json()
      
      if (res.ok) {
        toast({ 
          title: "Asset deleted", 
          description: `${fileName} has been deleted` 
        })
        onAssetDeleted()
      } else {
        toast({ 
          title: "Error", 
          description: data.error || "Failed to delete asset",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("[Asset Delete Error]", error)
      toast({ 
        title: "Error", 
        description: "Network error. Please try again.",
        variant: "destructive"
      })
    }
  }

  function getAssetsByType(type: string) {
    return assets.filter(asset => asset.assetType === type)
  }

  if (!cloudinaryConfigured) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Configure Cloudinary settings to enable file uploads
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Upload Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {assetTypes.map((type) => {
          const Icon = type.icon
          const existingAssets = getAssetsByType(type.value)
          
          return (
            <Button
              key={type.value}
              variant="outline"
              onClick={() => handleFileUpload(type.value, type.accept)}
              disabled={uploading}
              className="h-20 flex-col gap-2 relative"
              title={`Upload ${type.label}`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-sm">{type.label}</span>
              {existingAssets.length > 0 && (
                <Badge variant="default" className="absolute -top-2 -right-2 text-xs">
                  {existingAssets.length}
                </Badge>
              )}
            </Button>
          )
        })}
      </div>

      {uploading && (
        <Alert>
          <Upload className="h-4 w-4 animate-pulse" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>Uploading file... Please wait.</span>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {!uploading && (
        <div className="text-xs text-muted-foreground text-center">
          <p>Supported formats: JPEG, PNG, GIF, WebP (images), PDF (documents)</p>
          <p>Maximum file size: 10MB</p>
        </div>
      )}

      {/* Current Assets by Type */}
      {assetTypes.map((type) => {
        const typeAssets = getAssetsByType(type.value)
        if (typeAssets.length === 0) return null

        const Icon = type.icon

        return (
          <Card key={type.value}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon className="h-5 w-5" />
                {type.label} ({typeAssets.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {typeAssets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {asset.assetType === 'logo' && asset.fileUrl && (
                        <img 
                          src={asset.fileUrl} 
                          alt="Asset preview" 
                          className="w-12 h-12 object-contain rounded border bg-white"
                        />
                      )}
                      <div>
                        <div className="font-medium">{asset.fileName}</div>
                        <div className="text-sm text-muted-foreground">
                          {asset.fileSize && `${Math.round(asset.fileSize / 1024)} KB`}
                          {asset.uploadedByUser && ` • Uploaded by ${asset.uploadedByUser.name}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(asset.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(asset.fileUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteAsset(asset.id, asset.fileName)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}