"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Users, Phone, CreditCard, Hash, Trash2, Edit, FileText, Info, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

type Client = {
  id: string
  name: string
  dob?: string
  panNo?: string
  aadhaarNo?: string
  mobile?: string
  email?: string
  address?: string
  tags: string[]
  deletedAt?: string | null
  clientGroup?: { id: string; name: string }
  relationshipToHead?: string
}

interface ClientCardProps {
  client: Client
  onEdit: (client: Client) => void
  onDelete: (id: string) => void
  onRestore: (id: string) => void
}

// Utility function to format date
const formatDate = (date?: string): string => {
  if (!date) return "N/A"
  
  // Handle specific malformed format like "25T00:00:00.000Z/09/2000"
  const malformedMatch = date.match(/^(\d{2})T00:00:00\.000Z\/(\d{2})\/(\d{4})$/)
  if (malformedMatch) {
    const [, day, month, year] = malformedMatch
    return `${day}/${month}/${year}`
  }
  
  // Fallback for standard YYYY-MM-DD format
  try {
    const [year, month, day] = date.split("-")
    return `${day}/${month}/${year}`
  } catch {
    return date // Return original if parsing fails
  }
}

export const ClientCard: React.FC<ClientCardProps> = ({ client, onEdit, onDelete, onRestore }) => {
  const [showAadhaar, setShowAadhaar] = useState(false)
  const [isDeleteDrawerOpen, setIsDeleteDrawerOpen] = useState(false)
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false)
  console.log(client);
  

  const handleDeleteConfirm = () => {
    onDelete(client.id)
    setIsDeleteDrawerOpen(false)
  }

  return (
    <Card
      className={cn(
        "border-0 rounded-xl overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] w-full max-w-sm",
        client.deletedAt ? "opacity-80 bg-gray-50" : "bg-white"
      )}
      role="region"
      aria-label={`Client card for ${client.name}`}
    >
      <CardHeader className="p-2 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50">
        <div className="flex justify-between items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <h3
                  className="font-semibold text-lg text-gray-900 truncate max-w-[60%]"
                  aria-label={`Client name: ${client.name}`}
                >
                  {client.name}
                </h3>
              </TooltipTrigger>
              <TooltipContent>{client.name}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex ">
            {client.deletedAt ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRestore(client.id)}
                className="rounded-full px-3 py-1 text-xs font-medium border-blue-300 text-blue-600 hover:bg-blue-100 hover:border-blue-400 transition-colors duration-200"
                aria-label={`Restore client ${client.name}`}
              >
                Restore
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(client)}
                className="rounded-full px-3 py-1 text-xs font-medium border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-colors duration-200"
                aria-label={`Edit client ${client.name}`}
              >
                <Edit className="h-3 w-3 mr-1" aria-hidden="true" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2 space-y-3">
        {/* Group, Relationship, and DOB */}
        <div className="flex flex-wrap gap-1.5">
          {client.clientGroup && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 text-xs py-0.5 px-2 bg-blue-100 text-blue-800 rounded-full transition-colors duration-200 hover:bg-blue-200"
              aria-label={`Family group: ${client.clientGroup.name}`}
            >
              <Users className="h-3 w-3" aria-hidden="true" />
              <span className="truncate max-w-[80px]">{client.clientGroup.name}</span>
            </Badge>
          )}
          {client.relationshipToHead && (
            <Badge
              variant="outline"
              className="text-xs py-0.5 px-2 border-gray-300 rounded-full transition-colors duration-200 hover:bg-gray-100"
              aria-label={`Relationship: ${client.relationshipToHead}`}
            >
              {client.relationshipToHead}
            </Badge>
          )}
          {client.dob && (
            <Badge
              variant="outline"
              className="flex items-center gap-1 text-xs py-0.5 px-2 border-gray-300 rounded-full transition-colors duration-200 hover:bg-gray-100"
              aria-label={`DOB: ${formatDate(client.dob)}`}
            >
              <Calendar className="h-3 w-3" aria-hidden="true" />
              {formatDate(client.dob)}
            </Badge>
          )}
        </div>

        {/* Contact Info */}
        <div className="flex flex-col gap-2">
          {client.mobile && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="flex items-center gap-2 p-2 bg-gradient-to-r from-green-50 to-green-100 rounded-lg transition-colors duration-200 hover:bg-green-200"
                    aria-label={`Mobile: ${client.mobile}`}
                  >
                    <div className="p-1 bg-green-500 rounded-md">
                      <Phone className="h-3 w-3 text-white flex-shrink-0" aria-hidden="true" />
                    </div>
                    <span className="text-sm font-medium truncate">{client.mobile}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{client.mobile}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Document Info */}
        <div className="flex flex-col gap-2">
          {client.panNo && (
            <div
              className="flex items-center gap-2 p-2 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg transition-colors duration-200 hover:bg-orange-200"
              aria-label={`PAN: ${client.panNo}`}
            >
              <div className="p-1 bg-orange-500 rounded-md">
                <CreditCard className="h-3 w-3 text-white" aria-hidden="true" />
              </div>
              <span className="text-xs font-mono font-medium">{client.panNo}</span>
            </div>
          )}
          {client.aadhaarNo && (
            <button
              type="button"
              onClick={() => setShowAadhaar(!showAadhaar)}
              className="flex items-center gap-2 p-2 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg w-full text-left transition-colors duration-200 hover:bg-purple-200"
              aria-label={`Aadhaar: ${showAadhaar ? client.aadhaarNo : `****${client.aadhaarNo.slice(-4)}`}`}
            >
              <div className="p-1 bg-purple-500 rounded-md">
                <Hash className="h-3 w-3 text-white" aria-hidden="true" />
              </div>
              <span className="text-xs font-mono font-medium">
                {showAadhaar ? client.aadhaarNo : `****${client.aadhaarNo.slice(-4)}`}
              </span>
            </button>
          )}
        </div>

        {/* Tags */}
        {client.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {client.tags.map((tag, i) => (
              <Badge
                key={i}
                variant="outline"
                className="text-xs px-2 py-0.5 rounded-full border-gray-300 bg-gray-50 transition-colors duration-200 hover:bg-gray-100"
                aria-label={`Tag: ${tag}`}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {!client.deletedAt && (
          <div className="pt-3 border-t border-gray-200 flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => (window.location.href = `/policies?clientId=${client.id}`)}
                className="flex-1 rounded-lg h-9 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all duration-200 shadow-sm hover:shadow-md"
                aria-label={`Add policy for ${client.name}`}
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                Add Policy
              </Button>
              <Drawer open={isDetailsDrawerOpen} onOpenChange={setIsDetailsDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 rounded-lg h-9 text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    aria-label={`View details for ${client.name}`}
                  >
                    <Info className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                    Details
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>{client.name} Details</DrawerTitle>
                    <DrawerDescription>Additional client information</DrawerDescription>
                  </DrawerHeader>
                  <div className="p-4 space-y-3">
                    {client.email && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Email:</span>
                        <span className="text-sm text-gray-900 truncate">{client.email}</span>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Address:</span>
                        <span className="text-sm text-gray-900">{client.address}</span>
                      </div>
                    )}
                  </div>
                  <DrawerFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDetailsDrawerOpen(false)}
                      className="rounded-full px-4 py-2 text-sm"
                    >
                      Close
                    </Button>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            </div>
            <Drawer open={isDeleteDrawerOpen} onOpenChange={setIsDeleteDrawerOpen}>
              <DrawerTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg h-9 text-sm font-medium transition-colors duration-200"
                  aria-label={`Delete client ${client.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                  Delete Client
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Delete {client.name}?</DrawerTitle>
                  <DrawerDescription>
                    This action cannot be undone. Are you sure you want to delete this client?
                  </DrawerDescription>
                </DrawerHeader>
                <DrawerFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteDrawerOpen(false)}
                    className="rounded-full px-4 py-2 text-sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteConfirm}
                    className="rounded-full px-4 py-2 text-sm"
                  >
                    Confirm Delete
                  </Button>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}