import { neon } from "@neondatabase/serverless"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

async function run() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error("[migrate] DATABASE_URL is missing. Add it in Project Settings > Environment Variables.")
    process.exit(1)
  }

  const sql = neon(url)
  const dir = join(process.cwd(), "scripts", "sql")
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b))

  console.log(`[migrate] Running ${files.length} SQL file(s)`)
  for (const file of files) {
    const full = join(dir, file)
    const text = readFileSync(full, "utf8")
    console.log(`[migrate] Applying ${file} ...`)
    await sql(text)
    console.log(`[migrate] Applied ${file}`)
  }
  console.log("[migrate] All migrations applied")
}

run().catch((err) => {
  console.error("[migrate] Error:", err)
  process.exit(1)
})
