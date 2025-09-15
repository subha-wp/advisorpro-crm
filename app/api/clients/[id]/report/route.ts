// @ts-nocheck
import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { getClientReportData } from "@/lib/reports/client-report"
import { generateClientReportHTML } from "@/lib/reports/pdf-generator"
import { createAuditLog } from "@/lib/audit"
import { apiLimiter } from "@/lib/rate-limit"
import puppeteer from "puppeteer"

export const runtime = "nodejs"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 10, session.sub) // 10 reports per minute
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  try {
    // Get comprehensive client data
    const reportData = await getClientReportData(session.ws, id)
    
    // Generate HTML report
    const htmlContent = generateClientReportHTML(reportData)
    
    // Generate PDF via Puppeteer
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true
    })
    try {
      const page = await browser.newPage()
      await page.setContent(htmlContent, { waitUntil: "networkidle0" })
      await page.emulateMediaType("screen")
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" }
      })

      const fileName = `client-report-${reportData.client.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`

      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Cache-Control": "no-store"
        }
      })
    } finally {
      await browser.close()
    }

    // Create audit log
    await createAuditLog({
      workspaceId: session.ws,
      userId: session.sub,
      action: "CREATE",
      entity: "CLIENT",
      entityId: id,
      metadata: { 
        action: "report_generated",
        reportType: "comprehensive_client_report",
        clientName: reportData.client.name,
        policiesIncluded: reportData.policies.length,
        paymentsIncluded: reportData.premiumPayments.length
      }
    })
  } catch (error) {
    console.error("[Client Report Error]", error)
    return NextResponse.json({ 
      error: "Failed to generate client report",
      details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
    }, { status: 500 })
  }
}