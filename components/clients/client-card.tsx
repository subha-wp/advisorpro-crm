"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Users, Phone, Mail, CreditCard, Hash, Trash2, Edit, FileText } from "lucide-react"
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

export const ClientCard: React.FC<ClientCardProps> = ({ client, onEdit, onDelete, onRestore }) => {
  const [showAadhaar, setShowAadhaar] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  const handleDeleteClick = () => {
    setIsDeleteConfirmOpen(true)
  }

  const confirmDelete = () => {
    onDelete(client.id)
    setIsDeleteConfirmOpen(false)
  }

  return (
    <Card
      className={cn(
        " border-0 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl",
        client.deletedAt ? "opacity-70 bg-gray-100" : "bg-white"
      )}
      role="region"
      aria-label={`Client card for ${client.name}`}
    >
      <CardHeader className="p-4 bg-gradient-to-r from-green-50 to-indigo-50">
        <div className="flex justify-between items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <h3
                  className="font-semibold text-lg text-gray-800 truncate max-w-[70%]"
                  aria-label={`Client name: ${client.name}`}
                >
                  {client.name}
                </h3>
              </TooltipTrigger>
              <TooltipContent>{client.name}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex gap-2">
            {client.deletedAt ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRestore(client.id)}
                className="rounded-full px-4 py-1 text-xs font-medium border-blue-300 text-blue-600 hover:bg-blue-100 transition-colors duration-200"
                aria-label={`Restore client ${client.name}`}
              >
                Restore
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(client)}
                className="rounded-full px-4 py-1 text-xs font-medium border-gray-300 hover:bg-gray-100 transition-colors duration-200"
                aria-label={`Edit client ${client.name}`}
              >
                <Edit className="h-3 w-3 mr-1" aria-hidden="true" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Group and Relationship */}
          <div className="flex flex-wrap gap-2">
            {client.clientGroup && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 text-xs py-1 px-2 bg-blue-100 text-blue-800 rounded-full"
                aria-label={`Family group: ${client.clientGroup.name}`}
              >
                <Users className="h-3 w-3" aria-hidden="true" />
                <span className="truncate max-w-[100px]">{client.clientGroup.name}</span>
              </Badge>
            )}
            {client.relationshipToHead && (
              <Badge
                variant="outline"
                className="text-xs py-1 px-2 border-gray-300 rounded-full"
                aria-label={`Relationship: ${client.relationshipToHead}`}
              >
                {client.relationshipToHead}
              </Badge>
            )}
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {client.mobile && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg transition-colors duration-200 hover:bg-gray-100"
                      aria-label={`Mobile: ${client.mobile}`}
                    >
                      <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" aria-hidden="true" />
                      <span className="text-sm font-medium truncate">{client.mobile}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{client.mobile}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {client.email && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg transition-colors duration-200 hover:bg-gray-100"
                      aria-label={`Email: ${client.email}`}
                    >
                      <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" aria-hidden="true" />
                      <span className="text-sm font-medium truncate">{client.email}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{client.email}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Document Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {client.panNo && (
              <div
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                aria-label={`PAN: ${client.panNo}`}
              >
                <CreditCard className="h-3 w-3 text-gray-500" aria-hidden="true" />
                <span className="text-xs font-mono">{client.panNo}</span>
              </div>
            )}
            {client.aadhaarNo && (
              <button
                type="button"
                onClick={() => setShowAadhaar(!showAadhaar)}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg w-full text-left hover:bg-gray-100 transition-colors duration-200"
                aria-label={`Aadhaar: ${showAadhaar ? client.aadhaarNo : `****${client.aadhaarNo.slice(-4)}`}`}
              >
                <Hash className="h-3 w-3 text-gray-500" aria-hidden="true" />
                <span className="text-xs font-mono">
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
                  className="text-xs px-2 py-1 rounded-full border-gray-300"
                  aria-label={`Tag: ${tag}`}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Bottom Action Buttons */}
          {!client.deletedAt && (
            <div className="pt-4 border-t border-gray-200 space-y-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => (window.location.href = `/policies?clientId=${client.id}`)}
                className="w-full rounded-lg h-10 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                aria-label={`Add policy for ${client.name}`}
              >
                <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                Add Policy
              </Button>
              <div className="relative">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDeleteClick}
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg h-10 text-sm font-medium transition-colors duration-200"
                  aria-label={`Delete client ${client.name}`}
                >
                  <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                  Delete Client
                </Button>
                {isDeleteConfirmOpen && (
                  <div className="absolute inset-0 bg-white/95 flex items-center justify-center rounded-lg z-10 border shadow-lg">
                    <div className="text-center space-y-3 p-4">
                      <p className="text-sm font-medium text-gray-800">Delete {client.name}?</p>
                      <p className="text-xs text-gray-600">This action cannot be undone.</p>
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsDeleteConfirmOpen(false)}
                          className="rounded-full px-4 py-1 text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={confirmDelete}
                          className="rounded-full px-4 py-1 text-xs"
                        >
                          Confirm Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}