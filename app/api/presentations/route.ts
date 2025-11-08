import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { createAuditLog } from "@/lib/audit"
import puppeteer from "puppeteer"

// This generator will be implemented next
import { generatePresentationHTML } from "@/lib/reports/presentation-generator"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    // Expecting payload with selected client, selectedPolicies, customSections, images, and presentationTitle
    const htmlContent = await generatePresentationHTML({
      workspaceId: session.ws,
      userId: session.sub,
      payload: body,
    })

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
    })
    try {
      const page = await browser.newPage()
      await page.setBypassCSP(true)
      // Block all external network requests (CDNs, images) to avoid timeouts in server env
      await page.setRequestInterception(true)
      page.on("request", (req) => {
        const url = req.url()
        if (url.startsWith("http://") || url.startsWith("https://")) {
          return req.abort()
        }
        return req.continue()
      })
      await page.setContent(htmlContent, { waitUntil: "domcontentloaded", timeout: 45000 })
      await page.emulateMediaType("screen")
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
      })

      const title = (body?.presentationTitle || "presentation").toString().replace(/[^a-zA-Z0-9]/g, "-")
      const fileName = `${title}-${new Date().toISOString().split("T")[0]}.pdf`

      // Minimal audit trail
      await createAuditLog({
        workspaceId: session.ws,
        userId: session.sub,
        action: "CREATE",
        entity: "PRESENTATION",
        entityId: title,
        metadata: { type: "presentation_pdf", policies: body?.selectedPolicies?.length || 0 },
      })

      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Cache-Control": "no-store",
        },
      })
    } finally {
      await browser.close()
    }
  } catch (error: any) {
    console.error("[Presentation Error]", error)
    return NextResponse.json({ error: "Failed to generate presentation", details: process.env.NODE_ENV === "development" ? error?.message : undefined }, { status: 500 })
  }
}


