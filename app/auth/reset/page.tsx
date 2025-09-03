"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function ResetPasswordPage() {
  return (
    <main className="min-h-svh flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Enter your new password</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Input placeholder="New password" type="password" />
          <Input placeholder="Confirm password" type="password" />
          <Button className="w-full">Update password</Button>
        </CardContent>
      </Card>
    </main>
  )
}
