import { FamilyGroupsTable } from '@/components/clients/family-groups-table'
import React from 'react'

export default function page() {
  return (
     <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-balance">Insurance Client Management</h1>
        <p className="text-muted-foreground mt-2">Manage your clients and family groups efficiently</p>
      </div>

      <FamilyGroupsTable />
   
    </div>
  )
}
