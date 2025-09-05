"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Clock } from "lucide-react"

interface SessionWarningDialogProps {
  open: boolean
  onExtend: () => void
  onLogout: () => void
}

export function SessionWarningDialog({ open, onExtend, onLogout }: SessionWarningDialogProps) {
  const [timeLeft, setTimeLeft] = useState(5 * 60) // 5 minutes in seconds
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (!open) {
      setTimeLeft(5 * 60)
      setProgress(100)
      return
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1
        setProgress((newTime / (5 * 60)) * 100)
        
        if (newTime <= 0) {
          onLogout()
          return 0
        }
        
        return newTime
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [open, onLogout])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Session Expiring Soon
          </DialogTitle>
          <DialogDescription>
            Your session will expire due to inactivity. You'll be automatically logged out in:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-mono font-bold text-amber-600">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Time remaining
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Session timeout progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onLogout} className="w-full sm:w-auto">
            <Clock className="h-4 w-4 mr-2" />
            Logout Now
          </Button>
          <Button onClick={onExtend} className="w-full sm:w-auto">
            Continue Working
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}