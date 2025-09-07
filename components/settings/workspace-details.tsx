"use client"

import useSWR from "swr"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  FileText, 
  CreditCard,
  Upload,
  Image,
  Trash2,
  ExternalLink,
  CheckCircle,
  AlertTriangle
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function WorkspaceDetails() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { data: detailsData, isLoading: detailsLoading, mutate: mutateDetails } = useSWR("/api/workspace/details", fetcher)
  const { data: cloudinaryData, mutate: mutateCloudinary } = useSWR("/api/workspace/cloudinary", fetcher)
  const { data: assetsData, mutate: mutateAssets } = useSWR("/api/workspace/assets", fetcher)
  
  const details = detailsData?.details
  const cloudinaryConfigured = cloudinaryData?.isConfigured
  const assets = assetsData?.items ?? []

  const [form, setForm] = useState({
    officeEmail: "",
    officePhone: "",
    officeAddressFull: "",
    websiteUrl: "",
    businessRegistration: "",
    gstNumber: "",
    panNumber: "",
  })

  const [cloudinaryForm, setCloudinaryForm] = useState({
    cloudName: "",
    apiKey: "",
    apiSecret: "",
  })

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Update forms when data loads
  useEffect(() => {
    if (details) {
      setForm({
        officeEmail: details.officeEmail || "",
        officePhone: details.officePhone || "",
        officeAddressFull: details.officeAddressFull || "",
        websiteUrl: details.websiteUrl || "",
        businessRegistration: details.businessRegistration || "",
        gstNumber: details.gstNumber || "",
        panNumber: details.panNumber || "",
      })
    }
  }, [details])

  useEffect(() => {
    if (cloudinaryData) {
      setCloudinaryForm(prev => ({
        ...prev,
        cloudName: cloudinaryData.cloudName || "",
      }))
    }
  }, [cloudinaryData])

  async function onSaveDetails(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    
    try {
      const res = await fetch("/api/workspace/details", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      
      if (res.ok) {
        toast({ 
          title: "Details saved", 
          description: "Workspace details have been updated successfully" 
        })
        mutateDetails()
      } else {
        const data = await res.json()
        toast({ 
          title: "Error", 
          description: data.error || "Failed to save workspace details",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Network error. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  async function onSaveCloudinary(e: React.FormEvent) {
    e.preventDefault()
    if (!cloudinaryForm.cloudName || !cloudinaryForm.apiKey || !cloudinaryForm.apiSecret) {
      toast({
        title: "Error",
        description: "All Cloudinary fields are required",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    
    try {
      const res = await fetch("/api/workspace/cloudinary", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cloudinaryForm),
      })
      
      if (res.ok) {
        toast({ 
          title: "Cloudinary configured", 
          description: "File upload service has been configured successfully" 
        })
        mutateCloudinary()
        setCloudinaryForm(prev => ({ ...prev, apiKey: "", apiSecret: "" })) // Clear sensitive fields
      } else {
        const data = await res.json()
        toast({ 
          title: "Error", 
          description: data.error || "Failed to configure Cloudinary",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Network error. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleFileUpload(assetType: string) {
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
    input.accept = assetType === 'logo' ? 'image/*' : 'image/*,application/pdf'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setUploading(true)
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('assetType', assetType)
        formData.append('folder', 'workspace-assets')

        const res = await fetch("/api/workspace/upload", {
          method: "POST",
          body: formData,
        })

        if (res.ok) {
          const data = await res.json()
          toast({ 
            title: "File uploaded", 
            description: `${file.name} has been uploaded successfully` 
          })
          mutateAssets()
          mutateDetails() // Refresh details if logo was uploaded
        } else {
          const data = await res.json()
          toast({ 
            title: "Upload failed", 
            description: data.error || "Failed to upload file",
            variant: "destructive"
          })
        }
      } catch (error) {
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

      if (res.ok) {
        toast({ 
          title: "Asset deleted", 
          description: `${fileName} has been deleted` 
        })
        mutateAssets()
        mutateDetails() // Refresh details if logo was deleted
      } else {
        const data = await res.json()
        toast({ 
          title: "Error", 
          description: data.error || "Failed to delete asset",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Network error. Please try again.",
        variant: "destructive"
      })
    }
  }

  if (detailsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cloudinary Configuration */}
      <Card data-cloudinary-config>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            File Upload Configuration
          </CardTitle>
          <CardDescription>
            Configure your Cloudinary account to enable file uploads for logos and documents.{" "}
            <a 
              href="https://cloudinary.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              Get your credentials from Cloudinary
              <ExternalLink className="h-3 w-3" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cloudinaryConfigured ? (
            <Alert className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between text-white">
                <span>
                  Cloudinary is configured for cloud: <strong>{cloudinaryData?.cloudName}</strong>
                </span>
                <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                  Ready for uploads
                </Badge>
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={onSaveCloudinary} className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Quick Setup Guide:</p>
                    <ol className="text-sm space-y-1 ml-4 list-decimal">
                      <li>Sign up at <a href="https://cloudinary.com" target="_blank" className="text-primary hover:underline">cloudinary.com</a></li>
                      <li>Go to Dashboard → Settings → API Keys</li>
                      <li>Copy Cloud Name from your dashboard URL</li>
                      <li>Copy API Key and API Secret</li>
                      <li>Paste them below and click Configure</li>
                    </ol>
                  </div>
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cloudName">Cloud Name *</Label>
                  <Input
                    id="cloudName"
                    value={cloudinaryForm.cloudName}
                    onChange={(e) => setCloudinaryForm(f => ({ ...f, cloudName: e.target.value }))}
                    placeholder="your-cloud-name"
                    className="font-mono"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    From your dashboard URL: cloudinary.com/console/c/<strong>YOUR_CLOUD_NAME</strong>
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="apiKey">API Key *</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={cloudinaryForm.apiKey}
                    onChange={(e) => setCloudinaryForm(f => ({ ...f, apiKey: e.target.value }))}
                    placeholder="123456789012345"
                    className="font-mono"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    15-digit number from API Keys section
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="apiSecret">API Secret *</Label>
                  <Input
                    id="apiSecret"
                    type="password"
                    value={cloudinaryForm.apiSecret}
                    onChange={(e) => setCloudinaryForm(f => ({ ...f, apiSecret: e.target.value }))}
                    placeholder="abcdefghijklmnopqrstuvwxyz"
                    className="font-mono"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Secret key from API Keys section (keep confidential)
                  </p>
                </div>
              </div>
              
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? "Configuring..." : "Configure Cloudinary"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Office Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Office Details
          </CardTitle>
          <CardDescription>
            Configure your office contact information and business details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSaveDetails} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="officeEmail" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Office Email
                </Label>
                <Input
                  id="officeEmail"
                  type="email"
                  value={form.officeEmail}
                  onChange={(e) => setForm(f => ({ ...f, officeEmail: e.target.value }))}
                  placeholder="office@yourcompany.com"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="officePhone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Office Phone
                </Label>
                <Input
                  id="officePhone"
                  value={form.officePhone}
                  onChange={(e) => setForm(f => ({ ...f, officePhone: e.target.value }))}
                  placeholder="+91 11 1234 5678"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="officeAddress" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Complete Office Address
              </Label>
              <Textarea
                id="officeAddress"
                value={form.officeAddressFull}
                onChange={(e) => setForm(f => ({ ...f, officeAddressFull: e.target.value }))}
                placeholder="Complete office address with pincode..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="websiteUrl" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website URL
                </Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  value={form.websiteUrl}
                  onChange={(e) => setForm(f => ({ ...f, websiteUrl: e.target.value }))}
                  placeholder="https://yourcompany.com"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="businessRegistration" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Business Registration
                </Label>
                <Input
                  id="businessRegistration"
                  value={form.businessRegistration}
                  onChange={(e) => setForm(f => ({ ...f, businessRegistration: e.target.value }))}
                  placeholder="Company registration number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="gstNumber" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  GST Number
                </Label>
                <Input
                  id="gstNumber"
                  value={form.gstNumber}
                  onChange={(e) => setForm(f => ({ ...f, gstNumber: e.target.value.toUpperCase() }))}
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={15}
                />
                <p className="text-xs text-muted-foreground">Format: 22AAAAA0000A1Z5</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="panNumber" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  PAN Number
                </Label>
                <Input
                  id="panNumber"
                  value={form.panNumber}
                  onChange={(e) => setForm(f => ({ ...f, panNumber: e.target.value.toUpperCase() }))}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground">Format: ABCDE1234F</p>
              </div>
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Office Details"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Logo and Assets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Workspace Assets
          </CardTitle>
          <CardDescription>
            Upload and manage your workspace logo, letterhead, and other documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!cloudinaryConfigured ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>Configure Cloudinary settings above to enable file uploads</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Scroll to Cloudinary section
                      const cloudinarySection = document.querySelector('[data-cloudinary-config]')
                      cloudinarySection?.scrollIntoView({ behavior: 'smooth' })
                    }}
                  >
                    Configure Now
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {/* Upload Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleFileUpload("logo")}
                  disabled={uploading}
                  className="h-20 flex-col gap-2"
                >
                  <Image className="h-6 w-6" />
                  <span className="text-sm">Upload Logo</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleFileUpload("letterhead")}
                  disabled={uploading}
                  className="h-20 flex-col gap-2"
                >
                  <FileText className="h-6 w-6" />
                  <span className="text-sm">Letterhead</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleFileUpload("signature")}
                  disabled={uploading}
                  className="h-20 flex-col gap-2"
                >
                  <FileText className="h-6 w-6" />
                  <span className="text-sm">Signature</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleFileUpload("certificate")}
                  disabled={uploading}
                  className="h-20 flex-col gap-2"
                >
                  <CreditCard className="h-6 w-6" />
                  <span className="text-sm">Certificate</span>
                </Button>
              </div>

              {uploading && (
                <Alert>
                  <Upload className="h-4 w-4 animate-pulse" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>Uploading file...</span>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Current Assets */}
              {assets.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">Current Assets</h4>
                  <div className="grid gap-4">
                    {assets.map((asset: any) => (
                      <div key={asset.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          {asset.assetType === 'logo' && asset.fileUrl && (
                            <img 
                              src={asset.fileUrl} 
                              alt="Logo" 
                              className="w-12 h-12 object-contain rounded border"
                            />
                          )}
                          <div>
                            <div className="font-medium">{asset.fileName}</div>
                            <div className="text-sm text-muted-foreground">
                              <Badge variant="outline" className="text-xs mr-2">
                                {asset.assetType.toUpperCase()}
                              </Badge>
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
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Logo Display */}
      {details?.logoUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Workspace Logo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <img 
                src={details.logoUrl} 
                alt="Workspace Logo" 
                className="w-24 h-24 object-contain rounded-lg border bg-white"
              />
              <div>
                <p className="font-medium">Logo is active</p>
                <p className="text-sm text-muted-foreground">
                  This logo will appear on reports and documents
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => window.open(details.logoUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Full Size
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}