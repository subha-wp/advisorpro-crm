"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  user?: {
    name?: string | null
    email?: string | null
    avatarUrl?: string | null
  }
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
  showName?: boolean
  showEmail?: boolean
  fallbackClassName?: string
}

const sizeClasses = {
  xs: "h-6 w-6",
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16"
}

const textSizeClasses = {
  xs: "text-xs",
  sm: "text-xs", 
  md: "text-sm",
  lg: "text-sm",
  xl: "text-base"
}

export function UserAvatar({ 
  user, 
  size = "md", 
  className,
  showName = false,
  showEmail = false,
  fallbackClassName
}: UserAvatarProps) {
  function getUserInitials(name?: string | null) {
    if (!name) return "U"
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const avatar = (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage 
        src={user?.avatarUrl || undefined} 
        alt={`${user?.name || "User"}'s avatar`}
        className="object-cover"
      />
      <AvatarFallback className={cn(
        "bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-semibold",
        textSizeClasses[size],
        fallbackClassName
      )}>
        {getUserInitials(user?.name)}
      </AvatarFallback>
    </Avatar>
  )

  if (!showName && !showEmail) {
    return avatar
  }

  return (
    <div className="flex items-center gap-3">
      {avatar}
      {(showName || showEmail) && (
        <div className="min-w-0 flex-1">
          {showName && user?.name && (
            <div className="font-medium truncate">{user.name}</div>
          )}
          {showEmail && user?.email && (
            <div className="text-sm text-muted-foreground truncate">{user.email}</div>
          )}
        </div>
      )}
    </div>
  )
}