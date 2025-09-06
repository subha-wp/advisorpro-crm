import { addMonths, addDays } from "date-fns"

export interface PremiumModeConfig {
  months: number
  label: string
}

export const PREMIUM_MODES: Record<string, PremiumModeConfig> = {
  MONTHLY: { months: 1, label: "Monthly" },
  QUARTERLY: { months: 3, label: "Quarterly" },
  HALF_YEARLY: { months: 6, label: "Half Yearly" },
  YEARLY: { months: 12, label: "Yearly" },
}

/**
 * Calculate the next due date based on current due date and premium mode
 */
export function calculateNextDueDate(currentDueDate: Date, premiumMode: string): Date {
  const config = PREMIUM_MODES[premiumMode]
  if (!config) {
    throw new Error(`Invalid premium mode: ${premiumMode}`)
  }

  return addMonths(currentDueDate, config.months)
}

/**
 * Calculate grace period end date
 */
export function calculateGracePeriodEnd(dueDate: Date, gracePeriodDays = 30): Date {
  return addDays(dueDate, gracePeriodDays)
}

/**
 * Determine payment status based on dates
 */
export function determinePaymentStatus(dueDate: Date, gracePeriodEnd?: Date): "UPCOMING" | "OVERDUE" | "UNPAID" {
  const today = new Date()
  const due = new Date(dueDate)
  const grace = gracePeriodEnd ? new Date(gracePeriodEnd) : null

  if (today < due) {
    return "UPCOMING"
  }

  if (grace && today <= grace) {
    return "UNPAID" // Within grace period
  }

  return "OVERDUE"
}

/**
 * Calculate premium schedule for a policy
 */
export interface PremiumScheduleInput {
  startDate: Date
  premiumAmount: number
  premiumMode: string
  numberOfInstallments: number
  gracePeriodDays?: number
}

export function generatePremiumSchedule(input: PremiumScheduleInput) {
  const { startDate, premiumAmount, premiumMode, numberOfInstallments, gracePeriodDays = 30 } = input

  const config = PREMIUM_MODES[premiumMode]
  if (!config) {
    throw new Error(`Invalid premium mode: ${premiumMode}`)
  }

  const schedules = []
  let currentDate = new Date(startDate)

  for (let i = 1; i <= numberOfInstallments; i++) {
    const gracePeriodEnd = calculateGracePeriodEnd(currentDate, gracePeriodDays)

    schedules.push({
      installmentNumber: i,
      dueDate: new Date(currentDate),
      premiumAmount,
      gracePeriodEnd,
      status: determinePaymentStatus(currentDate, gracePeriodEnd),
    })

    currentDate = addMonths(currentDate, config.months)
  }

  return schedules
}

/**
 * Update policy due dates after payment
 */
export interface PolicyUpdateInput {
  currentDueDate: Date
  premiumMode: string
  paymentDate: Date
  isFullPayment: boolean
}

export function updatePolicyAfterPayment(input: PolicyUpdateInput) {
  const { currentDueDate, premiumMode, paymentDate, isFullPayment } = input

  if (!isFullPayment) {
    // For partial payments, keep the same due date
    return {
      nextDueDate: currentDueDate,
      lastPaidDate: paymentDate,
    }
  }

  // For full payments, calculate next due date
  const nextDueDate = calculateNextDueDate(currentDueDate, premiumMode)

  return {
    nextDueDate,
    lastPaidDate: paymentDate,
  }
}

/**
 * Audit log helper for premium operations
 */
export function createPremiumAuditLog(action: string, details: any) {
  return {
    action,
    timestamp: new Date().toISOString(),
    details,
    source: "premium-automation",
  }
}
