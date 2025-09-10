import { getPrisma } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(ROLES.ANY)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const prisma = await getPrisma()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const offset = (page - 1) * limit

    const currentDate = new Date()

    // Build where conditions for policies with nextDueDate
    const whereConditions: any = {
      status: "ACTIVE",
      nextDueDate: { not: null },
      client: {
        workspaceId: session.ws
      }
    }

    // Add date range filter if provided
    if (startDate && endDate) {
      whereConditions.nextDueDate = {
        ...whereConditions.nextDueDate,
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    } else if (startDate) {
      whereConditions.nextDueDate = {
        ...whereConditions.nextDueDate,
        gte: new Date(startDate),
      }
    } else if (endDate) {
      whereConditions.nextDueDate = {
        ...whereConditions.nextDueDate,
        lte: new Date(endDate),
      }
    }

    // Add search filter
    if (search) {
      whereConditions.OR = [
        {
          policyNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          client: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          insurer: {
            contains: search,
            mode: "insensitive",
          },
        },
      ]
    }

    // Add status filter
    if (status && status !== "ALL") {
      switch (status) {
        case "UPCOMING":
          whereConditions.nextDueDate = {
            ...whereConditions.nextDueDate,
            gte: currentDate,
            lte: new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
          }
          break
        case "OVERDUE":
          whereConditions.nextDueDate = {
            ...whereConditions.nextDueDate,
            lt: currentDate,
          }
          break
        case "PAID":
          // For paid status, we need to check if there's a recent payment
          whereConditions.premiumPayments = {
            some: {
              paymentDate: {
                gte: new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
              }
            }
          }
          break
        case "UNPAID":
          whereConditions.nextDueDate = {
            ...whereConditions.nextDueDate,
            gte: new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000), // More than 30 days away
          }
          break
      }
    }

    // Fetch policies with premium information
    const [policies, totalCount] = await Promise.all([
      prisma.policy.findMany({
        where: whereConditions,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              mobile: true,
              email: true,
            },
          },
          premiumPayments: {
            orderBy: {
              paymentDate: "desc",
            },
            take: 1,
          },
        },
        orderBy: {
          nextDueDate: "asc",
        },
        skip: offset,
        take: limit,
      }),
      prisma.policy.count({
        where: whereConditions,
      }),
    ])

    // Transform data to match frontend expectations
    const premiums = policies.map((policy) => {
      const latestPayment = policy.premiumPayments[0]
      const dueDate = new Date(policy.nextDueDate!)
      const gracePeriodEnd = new Date(dueDate)
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 30) // 30 days grace period

      let premiumStatus: string
      if (latestPayment && latestPayment.paymentDate >= dueDate) {
        premiumStatus = "PAID"
      } else if (dueDate < currentDate) {
        premiumStatus = "OVERDUE"
      } else if (dueDate <= new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000)) {
        premiumStatus = "UPCOMING"
      } else {
        premiumStatus = "UNPAID"
      }

      return {
        id: policy.id,
        client: {
          id: policy.client.id,
          name: policy.client.name,
          mobile: policy.client.mobile,
          email: policy.client.email,
        },
        policy: {
          id: policy.id,
          policyNumber: policy.policyNumber,
          insurer: policy.insurer,
          planName: policy.planName,
          premiumMode: policy.premiumMode,
          status: policy.status,
        },
        scheduleId: `policy_${policy.id}`, // Generate a schedule ID for compatibility
        installmentNumber: 1,
        dueDate: policy.nextDueDate!.toISOString(),
        premiumAmount: policy.premiumAmount || 0,
        status: premiumStatus,
        gracePeriodEnd: gracePeriodEnd.toISOString(),
        ...(latestPayment && {
          paidAmount: latestPayment.amountPaid,
          paymentDate: latestPayment.paymentDate.toISOString(),
          paymentMode: latestPayment.paymentMode,
          receiptNumber: latestPayment.receiptNumber,
        }),
      }
    })

    // Calculate summary statistics for all active policies in workspace
    const allActivePolicies = await prisma.policy.findMany({
      where: {
        status: "ACTIVE",
        nextDueDate: { not: null },
        client: { workspaceId: session.ws }
      },
      include: {
        premiumPayments: {
          orderBy: { paymentDate: "desc" },
          take: 1,
        }
      }
    })

    const summary = {
      total: allActivePolicies.length,
      upcoming: 0,
      overdue: 0,
      paid: 0,
      unpaid: 0,
      totalAmount: 0,
    }

    // Process summary statistics
    for (const policy of allActivePolicies) {
      const dueDate = new Date(policy.nextDueDate!)
      const latestPayment = policy.premiumPayments[0]
      const amount = Number(policy.premiumAmount || 0)
      
      summary.totalAmount += amount

      if (latestPayment && latestPayment.paymentDate >= dueDate) {
        summary.paid++
      } else if (dueDate < currentDate) {
        summary.overdue++
      } else if (dueDate <= new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000)) {
        summary.upcoming++
      } else {
        summary.unpaid++
      }
    }

    return NextResponse.json({
      premiums,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary,
    })
  } catch (error) {
    console.error("Error fetching premiums:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch premiums",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}