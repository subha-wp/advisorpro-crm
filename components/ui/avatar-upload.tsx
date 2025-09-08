"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { 
  Upload, 
  Camera, 
  Trash2, 
  User,
  AlertTriangle,
  CheckCircle,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  userName?: string
  onAvatarUpdate?: (avatarUrl: string | null) => void
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  showUploadButton?: boolean
  showRemoveButton?: boolean
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12", 
  lg: "h-16 w-16",
  xl: "h-24 w-24"
}

export function AvatarUpload({ 
  currentAvatarUrl, 
  userName, 
  onAvatarUpdate,
  size = "lg",
  className,
  showUploadButton = true,
  showRemoveButton = true
}: AvatarUploadProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)

  function getUserInitials(name?: string) {
    if (!name) return "U"
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Avatar image must be less than 5MB",
        variant: "destructive"
      })
      return
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPEG, PNG, GIF, or WebP image",
        variant: "destructive"
      })
      return
    }

    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      
      if (res.ok) {
        toast({ 
          title: "Avatar updated", 
          description: "Your profile picture has been updated successfully" 
        })
        onAvatarUpdate?.(data.user.avatarUrl)
      } else {
        toast({ 
          title: "Upload failed", 
          description: data.error || "Failed to upload avatar",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("[Avatar Upload Error]", error)
      toast({ 
        title: "Upload failed", 
        description: "Network error. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  async function handleRemoveAvatar() {
    if (!currentAvatarUrl) return
    
    if (!confirm("Remove your profile picture?")) return

    setRemoving(true)
    
    try {
      const res = await fetch("/api/user/avatar", {
        method: "DELETE",
      })

      const data = await res.json()
      
      if (res.ok) {
        toast({ 
          title: "Avatar removed", 
          description: "Your profile picture has been removed" 
        })
        onAvatarUpdate?.(null)
      } else {
        toast({ 
          title: "Error", 
          description: data.error || "Failed to remove avatar",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("[Avatar Remove Error]", error)
      toast({ 
        title: "Error", 
        description: "Network error. Please try again.",
        variant: "destructive"
      })
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-4">
        <div className="relative group">
          <Avatar className={cn(sizeClasses[size], "ring-2 ring-background shadow-lg")}>
            <AvatarImage 
              src={currentAvatarUrl || undefined} 
              alt={`${userName}'s avatar`}
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-semibold">
              {getUserInitials(userName)}
            </AvatarFallback>
          </Avatar>
          
          {/* Upload overlay on hover */}
          {showUploadButton && (
            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                 onClick={() => fileInputRef.current?.click()}>
              <Camera className="h-6 w-6 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div>
            <h4 className="font-medium">{userName || "User"}</h4>
            <p className="text-sm text-muted-foreground">
              {currentAvatarUrl ? "Profile picture active" : "No profile picture"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {showUploadButton && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="gap-2"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? "Uploading..." : currentAvatarUrl ? "Change Avatar" : "Upload Avatar"}
              </Button>
            )}

            {showRemoveButton && currentAvatarUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveAvatar}
                disabled={removing}
                className="gap-2 text-destructive hover:text-destructive"
              >
                {removing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {removing ? "Removing..." : "Remove"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload guidelines */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Recommended: Square images (1:1 ratio) for best results</p>
        <p>• Supported formats: JPEG, PNG, GIF, WebP</p>
        <p>• Maximum file size: 5MB</p>
        <p>• Images are automatically cropped and optimized</p>
      </div>
    </div>
  )
}