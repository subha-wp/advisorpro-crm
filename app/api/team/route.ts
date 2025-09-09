import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { z } from "zod"
import { getPrisma } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { checkUserLimit } from "@/lib/workspace-limits"
import { createAuditLog } from "@/lib/audit"
import { hashPassword } from "@/lib/auth/password"
import { nameSchema, emailSchema, phoneSchema, sanitizeString, sanitizeEmail, sanitizePhone } from "@/lib/validation"
import { apiLimiter } from "@/lib/rate-limit"
import { sendEmail } from "@/lib/email"

import crypto from "node:crypto"
import { generateTeamInviteEmail } from "@/lib/email-templates"

const InviteUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  role: z.enum(["AGENT", "VIEWER"]),
})

const UpdateMemberSchema = z.object({
  role: z.enum(["AGENT", "VIEWER"]),
})

export async function GET(req: NextRequest) {
  const session = await requireRole(ROLES.ANY)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 100, session.sub)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  const prisma = await getPrisma()
  const members = await prisma.membership.findMany({
    where: { workspaceId: session.ws },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true, avatarUrl: true, createdAt: true }
      }
    },
    orderBy: { user: { createdAt: "asc" } }
  })

  const limitCheck = await checkUserLimit(session.ws)

  return NextResponse.json({ 
    items: members,
    limits: limitCheck
  })
}

export async function POST(req: NextRequest) {
  const session = await requireRole(ROLES.OWNER) // Only owners can invite
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Check workspace limits
  const limitCheck = await checkUserLimit(session.ws)
  if (!limitCheck.canAdd) {
    return NextResponse.json({ 
      error: "User limit reached", 
      details: `Maximum ${limitCheck.max} users allowed on your plan. You have ${limitCheck.remaining} slots remaining.`
    }, { status: 402 })
  }

  // Rate limiting
  const rateLimitResult = apiLimiter.check(req, 5, session.sub) // 5 invites per minute
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = InviteUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ 
      error: "Invalid input", 
      details: parsed.error.issues.map(i => i.message)
    }, { status: 400 })
  }

  const rawData = parsed.data
  const data = {
    name: sanitizeString(rawData.name),
    email: sanitizeEmail(rawData.email),
    phone: sanitizePhone(rawData.phone),
    role: rawData.role,
  }

  const prisma = await getPrisma()

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { phone: data.phone }] }
  })

  if (existingUser) {
    // Check if already a member of this workspace
    const existingMembership = await prisma.membership.findFirst({
      where: { userId: existingUser.id, workspaceId: session.ws }
    })
    
    if (existingMembership) {
      return NextResponse.json({ 
        error: "User is already a member of this workspace" 
      }, { status: 409 })
    }

    // Add existing user to workspace
    const membership = await prisma.membership.create({
      data: {
        userId: existingUser.id,
        workspaceId: session.ws,
        role: data.role,
      }
    })

    await createAuditLog({
      workspaceId: session.ws,
      userId: session.sub,
      action: "INVITE_USER",
      entity: "MEMBERSHIP",
      entityId: membership.id,
      after: { 
        userId: existingUser.id, 
        role: data.role,
        userEmail: existingUser.email,
        userName: existingUser.name,
        existingUser: true
      }
    })

    // Send team invite email for existing user
    try {
      const loginUrl = `${req.headers.get('origin') || 'https://advisorpro.com'}/login`
      const workspace = await prisma.workspace.findUnique({
        where: { id: session.ws },
        include: { owner: { select: { name: true } } }
      })
      
      const emailData = generateTeamInviteEmail({
        userName: existingUser.name || 'Team Member',
        workspaceName: workspace?.name || 'Workspace',
        inviterName: workspace?.owner?.name || 'Workspace Owner',
        loginUrl,
        role: data.role,
      })

      await sendEmail({
        workspaceId: session.ws,
        to: existingUser.email,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      })

      console.log(`[Team Invite] Email sent to existing user ${existingUser.email}`)
    } catch (emailError) {
      console.error("[Team Invite] Failed to send email to existing user:", emailError)
    }
    return NextResponse.json({ 
      item: { 
        ...membership, 
        user: { 
          id: existingUser.id, 
          name: existingUser.name, 
          email: existingUser.email, 
          phone: existingUser.phone 
        } 
      } 
    })
  }

  // Create new user with temporary password
  // Generate a more user-friendly temporary password
  const tempPassword = generateTempPassword()
  const passwordHash = await hashPassword(tempPassword)

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash,
    }
  })

  const membership = await prisma.membership.create({
    data: {
      userId: user.id,
      workspaceId: session.ws,
      role: data.role,
    }
  })

  // Audit log
  await createAuditLog({
    workspaceId: session.ws,
    userId: session.sub,
    action: "INVITE_USER",
    entity: "MEMBERSHIP",
    entityId: membership.id,
    after: { userId: user.id, role: data.role, tempPassword: true }
  })

  // Send welcome email with temporary password
  try {
    const loginUrl = `${req.headers.get('origin') || 'https://advisorpro.com'}/login`
    const workspace = await prisma.workspace.findUnique({
      where: { id: session.ws },
      include: { owner: { select: { name: true } } }
    })
    
    const emailData = generateTeamInviteEmail({
      userName: data.name,
      workspaceName: workspace?.name || 'Workspace',
      inviterName: workspace?.owner?.name || 'Workspace Owner',
      loginUrl,
      tempPassword,
      role: data.role,
    })

    await sendEmail({
      workspaceId: session.ws,
      to: data.email,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    })

    console.log(`[Team Invite] Welcome email sent to new user ${data.email}`)
  } catch (emailError) {
    console.error("[Team Invite] Failed to send welcome email:", emailError)
    // Don't fail the invitation if email fails
  }

  return NextResponse.json({ 
    item: { 
      ...membership, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        phone: user.phone,
        avatarUrl: user.avatarUrl
      } 
    },
    emailSent: true,
    message: "Invitation sent via email"
  })
}

// Helper function to generate user-friendly temporary passwords
function generateTempPassword(): string {
  // Generate a password with mix of uppercase, lowercase, and numbers
  // Format: ABC123def (3 uppercase + 3 numbers + 3 lowercase)
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  
  let password = ''
  
  // 3 uppercase letters
  for (let i = 0; i < 3; i++) {
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length))
  }
  
  // 3 numbers
  for (let i = 0; i < 3; i++) {
    password += numbers.charAt(Math.floor(Math.random() * numbers.length))
  }
  
  // 3 lowercase letters
  for (let i = 0; i < 3; i++) {
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length))
  }
  
  return password
}