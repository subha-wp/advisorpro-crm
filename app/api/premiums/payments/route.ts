import { type NextRequest, NextResponse } from "next/server"

import { updatePolicyAfterPayment, createPremiumAuditLog } from "@/lib/premium-utils"
import { getPrisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
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
          workspaceId: policy.client.workspaceId,
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
          processedByUserId: "user_1", // TODO: Get from auth context
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
      if (scheduleId) {
        scheduleUpdate = await tx.premiumSchedule.update({
          where: { id: scheduleId },
          data: {
            status: isFullPayment ? "PAID" : "PARTIAL",
          },
        })
      }

      // Create audit logs
      const auditLogs = await Promise.all([
        tx.auditLog.create({
          data: createPremiumAuditLog("PREMIUM_PAYMENT_RECORDED", {
            workspaceId: policy.client.workspaceId,
            policyId,
            paymentId: paymentRecord.id,
            amount: totalPaid,
            paymentMode,
            isFullPayment,
          }),
        }),
        ...(isFullPayment
          ? [
              tx.auditLog.create({
                data: createPremiumAuditLog("POLICY_DUE_DATE_UPDATED", {
                  workspaceId: policy.client.workspaceId,
                  policyId,
                  previousDueDate: currentDueDate.toISOString(),
                  newDueDate: policyUpdates.nextDueDate.toISOString(),
                  premiumMode,
                  paymentId: paymentRecord.id,
                }),
              }),
            ]
          : []),
      ])

      // Create reminder schedule for next premium if full payment
      let reminderSchedule = null
      if (isFullPayment) {
        const nextDueDate = policyUpdates.nextDueDate
        const reminders = [
          {
            reminderType: "ADVANCE_30" as const,
            scheduledDate: new Date(nextDueDate.getTime() - 30 * 24 * 60 * 60 * 1000),
            workspaceId: policy.client.workspaceId,
            policyId,
            status: "PENDING" as const,
          },
          {
            reminderType: "ADVANCE_7" as const,
            scheduledDate: new Date(nextDueDate.getTime() - 7 * 24 * 60 * 60 * 1000),
            workspaceId: policy.client.workspaceId,
            policyId,
            status: "PENDING" as const,
          },
          {
            reminderType: "DUE_DATE" as const,
            scheduledDate: nextDueDate,
            workspaceId: policy.client.workspaceId,
            policyId,
            status: "PENDING" as const,
          },
        ]

        await tx.premiumReminder.createMany({
          data: reminders,
        })

        reminderSchedule = {
          policyId,
          nextDueDate: nextDueDate.toISOString(),
          reminders: reminders.length,
        }
      }

      return {
        paymentRecord,
        scheduleUpdate,
        auditLogs,
        reminderSchedule,
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
      reminderSchedule: result.reminderSchedule,
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
