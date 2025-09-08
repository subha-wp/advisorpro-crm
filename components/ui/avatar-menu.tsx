// @ts-nocheck
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/ui/user-avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AvatarUpload } from "@/components/ui/avatar-upload"
import { 
  User, 
  Settings, 
  LogOut, 
  Camera,
  Building2,
  Power
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Badge } from "./badge"

interface AvatarMenuProps {
  user?: {
    id?: string
    name?: string | null
    email?: string | null
    avatarUrl?: string | null
  }
  workspace?: {
    name?: string
    plan?: string
  }
  userRole?: string
  onLogout?: () => void
  onAvatarUpdate?: (avatarUrl: string | null) => void
  collapsed?: boolean
}

export function AvatarMenu({ 
  user, 
  workspace, 
  userRole, 
  onLogout, 
  onAvatarUpdate,
  collapsed = false 
}: AvatarMenuProps) {
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false)

  function getRoleColor(role?: string) {
    switch (role) {
      case "OWNER": return "default"
      case "AGENT": return "secondary"
      case "VIEWER": return "outline"
      default: return "outline"
    }
  }

  const menuTrigger = (
    <Button
      variant="ghost"
      className={cn(
        "hover:bg-white/5 rounded-lg group transition-all duration-200",
        collapsed ? "w-full h-10 p-0" : "w-full justify-start h-auto p-3"
      )}
    >
      <div className={cn(
        "flex items-center w-full",
        collapsed ? "justify-center" : "gap-3"
      )}>
        <UserAvatar 
          user={user} 
          size={collapsed ? "sm" : "md"}
          className="ring-2 ring-background shadow-sm"
        />
        {!collapsed && (
          <>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate tracking-tight">
                {user?.name || "Loading..."}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant={getRoleColor(userRole) as any}
                  className="text-xs px-1.5 py-0"
                >
                  {userRole}
                </Badge>
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  {workspace?.plan || "FREE"}
                </Badge>
              </div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Power className="h-6 w-6 text-red-500" />
            </div>
          </>
        )}
      </div>
    </Button>
  )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {menuTrigger}
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          side={collapsed ? "right" : "top"} 
          className="w-56 mb-2 glass-dropdown"
        >
          <div className="px-2 py-1.5">
            <div className="flex items-center gap-3">
              <UserAvatar user={user} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {workspace?.name || "Workspace"}
            </p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setAvatarDialogOpen(true)}>
            <Camera className="h-4 w-4 mr-2" />
            Change Avatar
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile & Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/billing" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Workspace & Billing
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={onLogout}
            className="flex items-center gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Avatar Upload Dialog */}
      <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Update Profile Picture
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <AvatarUpload
              currentAvatarUrl={user?.avatarUrl}
              userName={user?.name}
              onAvatarUpdate={(avatarUrl) => {
                onAvatarUpdate?.(avatarUrl)
                setAvatarDialogOpen(false)
              }}
              size="xl"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}