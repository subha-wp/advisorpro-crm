"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, User, CreditCard, Hash, Users, X, Loader2 } from "lucide-react"
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
      <div className="space-y-3">
        <Label htmlFor="client-search" className="text-base font-medium">
          Search Client
        </Label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="client-search"
            placeholder="Search by name, PAN, Aadhaar, or group..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-12 h-14 text-base rounded-2xl border-2 focus:border-primary transition-all duration-200"
          />
          {isLoading && (
            <Loader2 className="absolute right-12 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
          )}
          {(selectedClient || searchQuery) && !isLoading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 rounded-full hover:bg-muted/80 transition-colors"
              onClick={clearSelection}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {showResults && searchResults.length > 0 && (
        <Card className="absolute z-50 w-full max-h-80 overflow-y-auto shadow-xl border-2 rounded-2xl animate-in slide-in-from-top-2 duration-200">
          <CardContent className="p-0">
            {searchResults.map((client, index) => (
              <div
                key={client.id}
                className={cn(
                  "p-4 hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-b-0 transition-colors duration-150",
                  "active:bg-muted/80 touch-manipulation",
                )}
                onClick={() => handleClientSelect(client)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium text-base truncate">{client.name}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      {client.mobile && (
                        <span className="flex items-center space-x-1 bg-muted/50 px-2 py-1 rounded-lg">
                          <span>📱</span>
                          <span>{client.mobile}</span>
                        </span>
                      )}
                      {client.panNo && (
                        <span className="flex items-center space-x-1 bg-muted/50 px-2 py-1 rounded-lg">
                          <CreditCard className="h-3 w-3" />
                          <span>{client.panNo}</span>
                        </span>
                      )}
                      {client.aadhaarNo && (
                        <span className="flex items-center space-x-1 bg-muted/50 px-2 py-1 rounded-lg">
                          <Hash className="h-3 w-3" />
                          <span>****{client.aadhaarNo.slice(-4)}</span>
                        </span>
                      )}
                    </div>

                    {client.clientGroup && (
                      <div className="flex items-center space-x-2">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="secondary" className="text-xs">
                          {client.clientGroup.name}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
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

      {selectedClient && (
        <Card className="border-2 border-primary/20 bg-primary/5 rounded-2xl animate-in fade-in duration-200">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Selected Client</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  className="rounded-full h-9 px-4 hover:bg-background transition-colors bg-transparent"
                >
                  Change Client
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium text-lg">{selectedClient.name}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {selectedClient.mobile && (
                    <div className="flex items-center space-x-2 p-3 bg-background rounded-xl">
                      <span className="text-muted-foreground font-medium">Mobile:</span>
                      <span>{selectedClient.mobile}</span>
                    </div>
                  )}
                  {selectedClient.email && (
                    <div className="flex items-center space-x-2 p-3 bg-background rounded-xl">
                      <span className="text-muted-foreground font-medium">Email:</span>
                      <span className="truncate">{selectedClient.email}</span>
                    </div>
                  )}
                  {selectedClient.panNo && (
                    <div className="flex items-center space-x-2 p-3 bg-background rounded-xl">
                      <span className="text-muted-foreground font-medium">PAN:</span>
                      <span>{selectedClient.panNo}</span>
                    </div>
                  )}
                  {selectedClient.aadhaarNo && (
                    <div className="flex items-center space-x-2 p-3 bg-background rounded-xl">
                      <span className="text-muted-foreground font-medium">Aadhaar:</span>
                      <span>****{selectedClient.aadhaarNo.slice(-4)}</span>
                    </div>
                  )}
                </div>

                {selectedClient.clientGroup && (
                  <div className="flex items-center space-x-3 p-3 bg-background rounded-xl">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary" className="text-sm">
                      {selectedClient.clientGroup.name}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p>Searching clients...</p>
        </div>
      )}

      {showResults && searchResults.length === 0 && !isLoading && searchQuery.length >= 2 && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No clients found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  )
}
