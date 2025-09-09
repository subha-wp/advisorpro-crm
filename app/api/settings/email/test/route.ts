import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { sendEmail } from "@/lib/email"
import { apiLimiter } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  const session = await requireRole(ROLES.OWNER) // Only owners can test email
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 5, session.sub) // 5 test emails per minute
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { testEmail } = body
    

    if (!testEmail) {
      return NextResponse.json({ error: "Test email address is required" }, { status: 400 })
    }

    // Send test email
    await sendEmail({
      workspaceId: session.ws,
      to: testEmail,
      subject: "AdvisorPro Email Configuration Test",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Email Configuration Test</h1>
            <p style="color: #6b7280; font-size: 16px;">Your AdvisorPro email setup is working correctly!</p>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 15px;">Test Details</h2>
            <ul style="color: #4b5563; line-height: 1.6;">
              <li><strong>Sent at:</strong> ${new Date().toLocaleString()}</li>
              <li><strong>From workspace:</strong> ${session.ws}</li>
              <li><strong>Test email:</strong> ${testEmail}</li>
              <li><strong>Status:</strong> ✅ Email delivery successful</li>
            </ul>
          </div>
          
          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
            <h3 style="color: #065f46; margin-bottom: 10px;">✅ Configuration Verified</h3>
            <p style="color: #047857; margin: 0;">
              Your Resend email configuration is working properly. You can now send professional emails 
              to clients for reminders, notifications, and account creation confirmations.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 14px;">
              This is an automated test email from AdvisorPro CRM
            </p>
          </div>
        </div>
      `,
      text: `
AdvisorPro Email Configuration Test

Your email setup is working correctly!

Test Details:
- Sent at: ${new Date().toLocaleString()}
- From workspace: ${session.ws}
- Test email: ${testEmail}
- Status: Email delivery successful

✅ Configuration Verified
Your Resend email configuration is working properly. You can now send professional emails to clients.

This is an automated test email from AdvisorPro CRM.
      `
    })

    return NextResponse.json({ 
      ok: true,
      message: "Test email sent successfully",
      sentTo: testEmail,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("[Email Test Error]", error)
    return NextResponse.json({ 
      error: "Failed to send test email",
      details: process.env.NODE_ENV === "development" ? (error as Error).message : "Please check your email configuration"
    }, { status: 500 })
  }
}