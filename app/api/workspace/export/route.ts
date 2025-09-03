import { NextResponse } from "next/server"
import { requireRole } from "@/lib/session"
import { ROLES } from "@/lib/auth/roles"
import { exportWorkspaceData } from "@/lib/backup"
import { createAuditLog } from "@/lib/audit"
import * as XLSX from "xlsx"

export async function GET() {
  const session = await requireRole(ROLES.OWNER) // Only owners can export data
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const workbook = await exportWorkspaceData(session.ws)
    
    // Convert to buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
    
    // Audit log
    await createAuditLog({
      workspaceId: session.ws,
      userId: session.sub,
      action: "UPDATE",
      entity: "WORKSPACE",
      entityId: session.ws,
      metadata: { action: "data_export" }
    })

    // Return file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="workspace-export-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("[Export Error]", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}