//@ts-nocheck
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyJWT, type AccessPayload } from "@/lib/auth/jwt"
import { signAccessToken } from "@/lib/auth/jwt"
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/cookies"

const publicPaths = ["/login", "/signup", "/auth/login", "/auth/signup", "/auth/forgot", "/auth/reset"]
const apiPublicPaths = ["/api/auth/login", "/api/auth/signup", "/api/auth/refresh", "/api/health"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path)) || 
      apiPublicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Check for access token
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value

  if (!accessToken) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  try {
    const payload = await verifyJWT<AccessPayload>(accessToken)
    if (payload.type !== "access") {
      throw new Error("Invalid token type")
    }

    // Verify the user still has access to this workspace
    if (pathname.startsWith("/api/")) {
      // For API routes, we'll let the individual route handlers verify workspace access
      // This prevents middleware from making too many DB calls
    }
    // Check if token is close to expiry (within 5 minutes)
    const now = Math.floor(Date.now() / 1000)
    const timeUntilExpiry = payload.exp! - now
    
    // If token expires in less than 5 minutes, try to refresh it
    if (timeUntilExpiry < 300) { // 5 minutes
      if (refreshToken) {
        // For API requests, let client handle refresh
        if (pathname.startsWith("/api/")) {
          const response = NextResponse.next()
          response.headers.set("x-user-id", payload.sub)
          response.headers.set("x-workspace-id", payload.ws)
          response.headers.set("x-user-role", payload.role)
          response.headers.set("x-token-refresh-needed", "true")
          return response
        }
      }
    }

    // Add user info to headers for API routes
    const response = NextResponse.next()
    response.headers.set("x-user-id", payload.sub)
    response.headers.set("x-workspace-id", payload.ws)
    response.headers.set("x-user-role", payload.role)
    
    return response
  } catch (error) {
    // Token expired or invalid, try to refresh if we have refresh token
    if (refreshToken && pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 })
    }
    
    if (refreshToken) {
      // For web requests, redirect to refresh endpoint which will handle the redirect
      if (!pathname.startsWith("/api/")) {
        return NextResponse.redirect(new URL("/api/auth/refresh", request.url))
      }
      // For API requests, return 401 to let client handle refresh
      return NextResponse.json({ error: "Token expired" }, { status: 401 })
    }

    // No valid tokens, redirect to login
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}