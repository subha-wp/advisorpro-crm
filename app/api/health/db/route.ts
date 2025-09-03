import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  const url = process.env.DATABASE_URL
  if (!url) return NextResponse.json({ ok: false, error: "No DATABASE_URL" }, { status: 500 })
  const sql = neon(url)
  const [{ now }] = await sql`select now()`
  return NextResponse.json({ ok: true, now })
}
