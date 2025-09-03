import { getPrisma } from "@/lib/db"

export async function getWorkspacePlan(workspaceId: string) {
  const prisma = await getPrisma()
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { plan: true },
  })
  return ws?.plan ?? "FREE"
}

export async function isPremium(workspaceId: string) {
  const plan = await getWorkspacePlan(workspaceId)
  return plan === "PREMIUM"
}
