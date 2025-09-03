"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-svh flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>We&apos;ll send reset instructions</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Input placeholder="Email or Phone" type="text" />
          <Button className="w-full">Send reset link</Button>
        </CardContent>
      </Card>
    </main>
  )
}
