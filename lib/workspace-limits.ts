import { getPrisma } from "@/lib/db"
import { getWorkspacePlan } from "@/lib/plan"

export const PLAN_LIMITS = {
  FREE: {
    maxUsers: 4, // Owner + 2 employees
    maxClients: 5000,
    maxPolicies: 50000,
    maxTemplates: 5,
    automations: false,
    bulkOperations: false,
    advancedReports: false,
    apiAccess: false,
  },
  PREMIUM: {
    maxUsers: 50,
    maxClients: 10000,
    maxPolicies: 100000,
    maxTemplates: 100,
    automations: true,
    bulkOperations: true,
    advancedReports: true,
    apiAccess: true,
  },
  PENDING: {
    maxUsers: 3,
    maxClients: 100,
    maxPolicies: 500,
    maxTemplates: 5,
    automations: false,
    bulkOperations: false,
    advancedReports: false,
    apiAccess: false,
  },
} as const

export async function getWorkspaceLimits(workspaceId: string) {
  const plan = await getWorkspacePlan(workspaceId)
  return PLAN_LIMITS[plan]
}

export async function checkUserLimit(workspaceId: string) {
  const limits = await getWorkspaceLimits(workspaceId)
  const prisma = await getPrisma()
  
  const userCount = await prisma.membership.count({
    where: { workspaceId }
  })
  
  return {
    current: userCount,
    max: limits.maxUsers,
    canAdd: userCount < limits.maxUsers,
    remaining: Math.max(0, limits.maxUsers - userCount)
  }
}

export async function checkClientLimit(workspaceId: string) {
  const limits = await getWorkspaceLimits(workspaceId)
  const prisma = await getPrisma()
  
  const clientCount = await prisma.client.count({
    where: { workspaceId, deletedAt: null }
  })
  
  return {
    current: clientCount,
    max: limits.maxClients,
    canAdd: clientCount < limits.maxClients,
    remaining: Math.max(0, limits.maxClients - clientCount)
  }
}

export async function checkPolicyLimit(workspaceId: string) {
  const limits = await getWorkspaceLimits(workspaceId)
  const prisma = await getPrisma()
  
  const policyCount = await prisma.policy.count({
    where: { 
      client: { workspaceId }
    }
  })
  
  return {
    current: policyCount,
    max: limits.maxPolicies,
    canAdd: policyCount < limits.maxPolicies,
    remaining: Math.max(0, limits.maxPolicies - policyCount)
  }
}