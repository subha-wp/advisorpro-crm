"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLocationTracker } from "@/components/location/location-tracker";
import { MapPin, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("My Workspace");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "requesting" | "granted" | "denied"
  >("idle");

  const { location, requestLocation } = useLocationTracker();

  useEffect(() => {
    const getLocation = async () => {
      setLocationStatus("requesting");
      const loc = await requestLocation();
      setLocationStatus(loc ? "granted" : "denied");
    };
    getLocation();
  }, [requestLocation]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          workspaceName,
          location: location || null,
        }),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        const { error } = await res.json().catch(() => ({ error: "Signup failed" }));
        setError(error);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Create your account
          </h1>
          <p className="text-muted-foreground">
            Start with a free plan. Upgrade anytime.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Sign up</CardTitle>
            <CardDescription>It only takes a minute</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={onSubmit}>
              <Input
                id="name"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                id="phone"
                placeholder="Phone (+91...)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                id="workspace"
                placeholder="Workspace name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                required
              />

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-100 rounded-md">
                  {error}
                </div>
              )}

              {locationStatus === "requesting" && (
                <Alert>
                  <MapPin className="h-4 w-4 animate-pulse" />
                  <AlertDescription>Fetching location…</AlertDescription>
                </Alert>
              )}
              {locationStatus === "denied" && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Location not available. Signup will still work.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            <div className="relative">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-background px-2 text-xs text-muted-foreground">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="text-center text-sm">
              <Link href="/login" prefetch className="text-primary hover:underline">
                Sign in here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
