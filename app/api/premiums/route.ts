import { getPrisma } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"


export async function GET(request: NextRequest) {
  try {
      const prisma = await getPrisma()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    const currentDate = new Date()

    // Build where conditions based on filters
    const whereConditions: any = {
      policy: {
        status: "ACTIVE",
      },
    }

    // Add search filter
    if (search) {
      whereConditions.OR = [
        {
          policy: {
            policyNumber: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          policy: {
            client: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
        {
          policy: {
            insurer: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ]
    }

    // Add status filter
    if (status) {
      switch (status) {
        case "UPCOMING":
          whereConditions.dueDate = {
            gte: currentDate,
            lte: new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
          }
          whereConditions.status = "PENDING"
          break
        case "OVERDUE":
          whereConditions.dueDate = {
            lt: currentDate,
          }
          whereConditions.status = "PENDING"
          break
        case "PAID":
          whereConditions.status = "PAID"
          break
        case "UNPAID":
          whereConditions.status = "PENDING"
          break
      }
    }

    // Fetch premium schedules with related data
    const [premiumSchedules, totalCount] = await Promise.all([
      prisma.premiumSchedule.findMany({
        where: whereConditions,
        include: {
          policy: {
            include: {
              client: {
                select: {
                  id: true,
                  name: true,
                  mobile: true,
                  email: true,
                },
              },
            },
          },
          payments: {
            orderBy: {
              paymentDate: "desc",
            },
            take: 1,
          },
        },
        orderBy: {
          dueDate: "asc",
        },
        skip: offset,
        take: limit,
      }),
      prisma.premiumSchedule.count({
        where: whereConditions,
      }),
    ])

    // Transform data to match frontend expectations
    const premiums = premiumSchedules.map((schedule) => {
      const latestPayment = schedule.payments[0]
      const gracePeriodEnd = new Date(schedule.dueDate)
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 30) // 30 days grace period

      let status: string
      if (schedule.status === "PAID") {
        status = "PAID"
      } else if (schedule.dueDate < currentDate) {
        status = "OVERDUE"
      } else if (schedule.dueDate <= new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000)) {
        status = "UPCOMING"
      } else {
        status = "UNPAID"
      }

      return {
        id: schedule.id,
        client: {
          id: schedule.policy.client.id,
          name: schedule.policy.client.name,
          mobile: schedule.policy.client.mobile,
          email: schedule.policy.client.email,
        },
        policy: {
          id: schedule.policy.id,
          policyNumber: schedule.policy.policyNumber,
          insurer: schedule.policy.insurer,
          planName: schedule.policy.planName,
          premiumMode: schedule.policy.premiumMode,
          status: schedule.policy.status,
        },
        scheduleId: schedule.id,
        installmentNumber: schedule.installmentNumber,
        dueDate: schedule.dueDate.toISOString(),
        premiumAmount: schedule.premiumAmount,
        status,
        gracePeriodEnd: gracePeriodEnd.toISOString(),
        ...(latestPayment && {
          paidAmount: latestPayment.amountPaid,
          paymentDate: latestPayment.paymentDate.toISOString(),
          paymentMode: latestPayment.paymentMode,
          receiptNumber: latestPayment.receiptNumber,
        }),
      }
    })

    // Calculate summary statistics
    const summaryStats = await prisma.premiumSchedule.groupBy({
      by: ["status"],
      where: {
        policy: {
          status: "ACTIVE",
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        premiumAmount: true,
      },
    })

    const summary = {
      total: totalCount,
      upcoming: 0,
      overdue: 0,
      paid: 0,
      unpaid: 0,
      totalAmount: 0,
    }

    // Process summary statistics
    for (const stat of summaryStats) {
      summary.totalAmount += Number(stat._sum.premiumAmount || 0)

      if (stat.status === "PAID") {
        summary.paid += stat._count.id
      } else {
        // For pending schedules, we need to check dates
        const pendingSchedules = await prisma.premiumSchedule.findMany({
          where: {
            status: "PENDING",
            policy: {
              status: "ACTIVE",
            },
          },
          select: {
            dueDate: true,
          },
        })

        for (const schedule of pendingSchedules) {
          if (schedule.dueDate < currentDate) {
            summary.overdue++
          } else if (schedule.dueDate <= new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000)) {
            summary.upcoming++
          } else {
            summary.unpaid++
          }
        }
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
