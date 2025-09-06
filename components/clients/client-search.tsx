"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, User, CreditCard, Hash, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface Client {
  id: string
  name: string
  mobile?: string
  panNo?: string
  aadhaarNo?: string
  email?: string
  clientGroup?: {
    id: string
    name: string
  }
  policies: {
    id: string
    policyNumber: string
    insurer: string
    planName?: string
    status: string
    nextDueDate?: string
    premiumAmount?: number
  }[]
}

interface ClientSearchProps {
  onClientSelect: (client: Client) => void
  selectedClient?: Client | null
  className?: string
}

export function ClientSearch({ onClientSelect, selectedClient, className }: ClientSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const searchClients = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/clients/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const clients = await response.json()
        setSearchResults(clients)
        setShowResults(true)
      }
    } catch (error) {
      console.error("Error searching clients:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchClients(searchQuery)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, searchClients])

  const handleClientSelect = (client: Client) => {
    onClientSelect(client)
    setShowResults(false)
    setSearchQuery(client.name)
  }

  const clearSelection = () => {
    onClientSelect(null as any)
    setSearchQuery("")
    setSearchResults([])
    setShowResults(false)
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label htmlFor="client-search">Search Client</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="client-search"
            placeholder="Search by name, PAN, Aadhaar, or group code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {selectedClient && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={clearSelection}
            >
              ×
            </Button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {showResults && searchResults.length > 0 && (
        <Card className="absolute z-10 w-full max-h-80 overflow-y-auto">
          <CardContent className="p-0">
            {searchResults.map((client) => (
              <div
                key={client.id}
                className="p-4 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                onClick={() => handleClientSelect(client)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{client.name}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      {client.mobile && (
                        <span className="flex items-center space-x-1">
                          <span>📱</span>
                          <span>{client.mobile}</span>
                        </span>
                      )}
                      {client.panNo && (
                        <span className="flex items-center space-x-1">
                          <CreditCard className="h-3 w-3" />
                          <span>{client.panNo}</span>
                        </span>
                      )}
                      {client.aadhaarNo && (
                        <span className="flex items-center space-x-1">
                          <Hash className="h-3 w-3" />
                          <span>****{client.aadhaarNo.slice(-4)}</span>
                        </span>
                      )}
                    </div>

                    {client.clientGroup && (
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="secondary" className="text-xs">
                          {client.clientGroup.name}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {client.policies.length} {client.policies.length === 1 ? "Policy" : "Policies"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Selected Client Display */}
      {selectedClient && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Selected Client</h3>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Change Client
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedClient.name}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedClient.mobile && (
                    <div>
                      <span className="text-muted-foreground">Mobile:</span>
                      <span className="ml-2">{selectedClient.mobile}</span>
                    </div>
                  )}
                  {selectedClient.email && (
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <span className="ml-2">{selectedClient.email}</span>
                    </div>
                  )}
                  {selectedClient.panNo && (
                    <div>
                      <span className="text-muted-foreground">PAN:</span>
                      <span className="ml-2">{selectedClient.panNo}</span>
                    </div>
                  )}
                  {selectedClient.aadhaarNo && (
                    <div>
                      <span className="text-muted-foreground">Aadhaar:</span>
                      <span className="ml-2">****{selectedClient.aadhaarNo.slice(-4)}</span>
                    </div>
                  )}
                </div>

                {selectedClient.clientGroup && (
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary">{selectedClient.clientGroup.name}</Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && <div className="text-center py-4 text-muted-foreground">Searching clients...</div>}

      {/* No Results */}
      {showResults && searchResults.length === 0 && !isLoading && searchQuery.length >= 2 && (
        <div className="text-center py-4 text-muted-foreground">No clients found matching "{searchQuery}"</div>
      )}
    </div>
  )
}
