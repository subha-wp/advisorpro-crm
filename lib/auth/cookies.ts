import { cookies } from "next/headers"
import type { NextResponse } from "next/server"

export const ACCESS_COOKIE = "ap_access"
export const REFRESH_COOKIE = "ap_refresh"

export function setAuthCookies(access: string, refresh: string) {
  const c = cookies()
  const isProd = process.env.NODE_ENV === "production"
  c.set(ACCESS_COOKIE, access, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  })
  c.set(REFRESH_COOKIE, refresh, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  })
}

export function clearAuthCookies() {
  const c = cookies()
  c.set(ACCESS_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 })
  c.set(REFRESH_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 })
}

export function attachAuthCookies(res: NextResponse, access: string, refresh: string) {
  const isProd = process.env.NODE_ENV === "production"
  res.cookies.set(ACCESS_COOKIE, access, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  })
  res.cookies.set(REFRESH_COOKIE, refresh, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  })
  return res
}
