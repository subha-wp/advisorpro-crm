// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server"

import { updatePolicyAfterPayment, createPremiumAuditLog } from "@/lib/premium-utils"
import { getPrisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(ROLES.STAFF)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

      const prisma = await getPrisma()
    const body = await request.json()

    const {
      clientId,
      policyId,
      scheduleId,
      paymentDate,
      amountPaid,
      paymentMode,
      receiptNumber,
      chequeNumber,
      bankName,
      transactionId,
      lateFee,
      discount,
      remarks,
    } = body

    // Validate required fields
    if (!clientId || !policyId || !paymentDate || !amountPaid || !paymentMode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const policy = await prisma.policy.findUnique({
      where: { id: policyId },
      include: {
        client: true,
      },
    })

    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 })
    }

    const currentDueDate = policy.nextDueDate || new Date()
    const premiumMode = policy.premiumMode || "YEARLY"
    const expectedPremiumAmount = policy.premiumAmount || 0

    // Determine if this is a full payment
    const totalPaid =
      Number.parseFloat(amountPaid) + (Number.parseFloat(lateFee) || 0) - (Number.parseFloat(discount) || 0)
    const isFullPayment = totalPaid >= expectedPremiumAmount

    // Calculate updated policy dates
    const policyUpdates = updatePolicyAfterPayment({
      currentDueDate,
      premiumMode,
      paymentDate: new Date(paymentDate),
      isFullPayment,
    })

    const result = await prisma.$transaction(async (tx) => {
      // Create payment record
      const paymentRecord = await tx.premiumPayment.create({
        data: {
          workspaceId: session.ws,
          policyId,
          scheduleId,
          paymentDate: new Date(paymentDate),
          amountPaid: Number.parseFloat(amountPaid),
          paymentMode,
          receiptNumber,
          chequeNumber,
          bankName,
          transactionId,
          lateFee: Number.parseFloat(lateFee) || 0,
          discount: Number.parseFloat(discount) || 0,
          remarks,
          processedByUserId: session.sub,
        },
      })

      // Update policy dates if full payment
      if (isFullPayment) {
        await tx.policy.update({
          where: { id: policyId },
          data: {
            nextDueDate: policyUpdates.nextDueDate,
            lastPaidDate: policyUpdates.lastPaidDate,
          },
        })
      }

      // Update premium schedule status if scheduleId provided
      let scheduleUpdate = null
      if (scheduleId && !scheduleId.startsWith('policy_')) {
        scheduleUpdate = await tx.premiumSchedule.update({
          where: { id: scheduleId },
          data: {
            status: isFullPayment ? "PAID" : "PARTIAL",
          },
        })
      }

      // Create audit log for payment
      await tx.auditLog.create({
        data: {
          workspaceId: session.ws,
          userId: session.sub,
          action: "CREATE",
          entity: "PREMIUM_PAYMENT",
          entityId: paymentRecord.id,
          diffJson: {
            after: {
              policyId,
              amount: totalPaid,
              paymentMode,
              isFullPayment,
              receiptNumber,
            }
          }
        }
      })

      // Create audit log for policy update if full payment
      if (isFullPayment) {
        await tx.auditLog.create({
          data: {
            workspaceId: session.ws,
            userId: session.sub,
            action: "UPDATE",
            entity: "POLICY",
            entityId: policyId,
            diffJson: {
              before: { nextDueDate: currentDueDate.toISOString() },
              after: { nextDueDate: policyUpdates.nextDueDate.toISOString() }
            }
          }
        })
      }

      // Note: Premium reminders can be implemented later if needed

      return {
        paymentRecord,
        scheduleUpdate,
      }
    })

    return NextResponse.json({
      success: true,
      payment: result.paymentRecord,
      policyUpdates: {
        nextDueDate: policyUpdates.nextDueDate.toISOString(),
        lastPaidDate: policyUpdates.lastPaidDate.toISOString(),
      },
      scheduleUpdate: result.scheduleUpdate,
      message: isFullPayment
        ? `Premium payment recorded successfully. Next due date updated to ${policyUpdates.nextDueDate.toLocaleDateString()}`
        : "Partial premium payment recorded successfully. Due date remains unchanged.",
    })
  } catch (error) {
    console.error("Error processing premium payment:", error)
    return NextResponse.json(
      {
        error: "Failed to process premium payment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}