
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, Search, Users, CreditCard } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface Client {
  id: string
  name: string
  mobile?: string
  email?: string
  panNo?: string
  clientGroup?: {
    id: string
    name: string
    clients: Array<{
      id: string
      name: string
      relationshipToHead?: string
      panNo?: string
      mobile?: string
      email?: string
    }>
  }
}

interface ClientSearchSelectProps {
  selectedClientId: string
  onClientSelect: (client: Client) => void
  className?: string
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`)
  }
  return response.json()
}

export function ClientSearchSelect({ selectedClientId, onClientSelect, className }: ClientSearchSelectProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // Fetch search results
  const search = useCallback(async () => {
    if (searchQuery.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const [clientsData, groupsData] = await Promise.all([
        fetcher(`/api/clients?q=${encodeURIComponent(searchQuery)}&pageSize=20`),
        fetcher(`/api/client-groups?q=${encodeURIComponent(searchQuery)}&pageSize=10`),
      ])

      // Combine clients and group members
      const clients = (clientsData.items || []).map((client: any) => ({
        id: client.id,
        name: client.name,
        mobile: client.mobile,
        email: client.email,
        panNo: client.panNo,
        clientGroup: client.clientGroup
          ? {
              id: client.clientGroup.id,
              name: client.clientGroup.name,
              clients: client.clientGroup.clients || [],
            }
          : undefined,
      }))

      const groupClients = (groupsData.items || []).flatMap((group: any) =>
        group.clients.map((member: any) => ({
          id: member.id,
          name: member.name,
          mobile: member.mobile,
          email: member.email,
          panNo: member.panNo,
          clientGroup: {
            id: group.id,
            name: group.name,
            clients: group.clients || [],
          },
        }))
      )

      // Merge and deduplicate
      const uniqueResults = [
        ...clients,
        ...groupClients.filter((gc: Client) => !clients.some((c: Client) => c.id === gc.id)),
      ]

      setResults(uniqueResults)
    } catch (error) {
      console.error("Search error:", error)
      toast({
        title: "Error",
        description: "Failed to fetch search results. Please try again.",
        variant: "destructive",
      })
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [searchQuery, toast])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      search()
    }, 300)
    return () => clearTimeout(debounceTimer)
  }, [search])

  // Load selected client details
  useEffect(() => {
    if (selectedClientId) {
      const loadClient = async () => {
        setLoading(true)
        try {
          const data = await fetcher(`/api/clients/${selectedClientId}`)
          setSelectedClient({
            id: data.item.id,
            name: data.item.name,
            mobile: data.item.mobile,
            email: data.item.email,
            panNo: data.item.panNo,
            clientGroup: data.item.clientGroup
              ? {
                  id: data.item.clientGroup.id,
                  name: data.item.clientGroup.name,
                  clients: data.item.clientGroup.clients || [],
                }
              : undefined,
          })
        } catch (error) {
          console.error("Failed to load client:", error)
          toast({
            title: "Error",
            description: "Failed to load client details.",
            variant: "destructive",
          })
          setSelectedClient(null)
        } finally {
          setLoading(false)
        }
      }
      loadClient()
    } else {
      setSelectedClient(null)
    }
  }, [selectedClientId, toast])

  const handleClientSelect = useCallback((client: Client) => {
    setSelectedClient(client)
    onClientSelect(client)
    setOpen(false)
    setSearchQuery("")
  }, [onClientSelect])

  const getUserInitials = useCallback((name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }, [])

  return (
    <div className={cn("space-y-4", className)}>
      <label className="text-sm font-medium">Policy Holder *</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-10 px-3 justify-between"
            disabled={loading}
          >
            {selectedClient ? (
              <div className="flex items-center gap-2 truncate">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getUserInitials(selectedClient.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{selectedClient.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Search className="h-4 w-4" />
                Search clients...
              </div>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-2">
          <input
            type="text"
            placeholder="Search by name, PAN, or mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="mt-2 max-h-[300px] overflow-y-auto border rounded-md">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                Searching...
              </div>
            ) : searchQuery.length < 2 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search
              </div>
            ) : results.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No clients found
              </div>
            ) : (
              <ul>
                {results.map((client) => (
                  <li
                    key={client.id}
                    onClick={() => handleClientSelect(client)}
                    className="flex items-center gap-2 p-2 hover:bg-primary/5 cursor-pointer"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getUserInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{client.name}</span>
                        {client.clientGroup && (
                          <span className="text-xs text-muted-foreground">
                            ({client.clientGroup.name})
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {[
                          client.mobile,
                          client.panNo && `PAN: ${client.panNo}`,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "h-4 w-4",
                        selectedClientId === client.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected Client Details */}
     {selectedClient && (
  <div className="bg-card rounded-xl border border-primary/10 shadow-sm p-4 space-y-3">
    {/* Top section: avatar + name */}
    <div className="flex items-center gap-3">
      <Avatar className="h-12 w-12 shrink-0">
        <AvatarFallback className="bg-primary/20 text-primary font-semibold text-base">
          {getUserInitials(selectedClient.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <h4 className="font-semibold text-base">{selectedClient.name}</h4>
        {selectedClient.clientGroup && (
          <div className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1">
            <Users className="h-3 w-3" />
            {selectedClient.clientGroup.name}
          </div>
        )}
      </div>
    </div>

    {/* Contact info */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
      {selectedClient.mobile && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">📱</span>
          <span className="font-mono">{selectedClient.mobile}</span>
        </div>
      )}
      {selectedClient.email && (
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-muted-foreground">✉️</span>
          <span className="truncate font-mono text-xs">{selectedClient.email}</span>
        </div>
      )}
      {selectedClient.panNo && (
        <div className="flex items-center gap-2">
          <CreditCard className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">PAN:</span>
          <span className="font-mono">{selectedClient.panNo}</span>
        </div>
      )}
    </div>

    {/* Family members */}
    {selectedClient.clientGroup && selectedClient.clientGroup.clients.length > 1 && (
      <div className="pt-3 border-t">
        <div className="text-xs text-muted-foreground mb-2">
          Other family members ({selectedClient.clientGroup.clients.length - 1}):
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {selectedClient.clientGroup.clients
            .filter((member) => member.id !== selectedClient.id)
            .map((member) => (
              <Button
                key={member.id}
                variant="outline"
                size="sm"
                className="px-3 py-1 rounded-full text-xs whitespace-nowrap"
                onClick={() => {
                  const memberClient = {
                    id: member.id,
                    name: member.name,
                    mobile: member.mobile,
                    email: member.email,
                    panNo: member.panNo,
                    clientGroup: selectedClient.clientGroup,
                  } as Client
                  handleClientSelect(memberClient)
                }}
              >
                {member.name}
                {member.relationshipToHead && ` (${member.relationshipToHead})`}
              </Button>
            ))}
          {selectedClient.clientGroup.clients.length > 4 && (
            <span className="text-xs text-muted-foreground self-center">
              +{selectedClient.clientGroup.clients.length - 4} more
            </span>
          )}
        </div>
      </div>
    )}
  </div>
)}

    </div>
  )
}
