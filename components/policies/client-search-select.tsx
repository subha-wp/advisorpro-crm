"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, Search, User, Users, CreditCard, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Client {
  id: string
  name: string
  mobile?: string
  email?: string
  panNo?: string
  aadhaarNo?: string
  clientGroup?: {
    id: string
    name: string
    clients: Array<{
      id: string
      name: string
      relationshipToHead?: string
      panNo?: string
    }>
  }
  relationshipToHead?: string
}

interface ClientSearchSelectProps {
  selectedClientId: string
  onClientSelect: (client: Client) => void
  className?: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function ClientSearchSelect({ selectedClientId, onClientSelect, className }: ClientSearchSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // Search clients and groups
  useEffect(() => {
    const searchClients = async () => {
      if (searchQuery.length < 2) {
        setClients([])
        setGroups([])
        return
      }

      setLoading(true)
      try {
        // Search clients by name, PAN, mobile
        const clientsRes = await fetch(`/api/clients?q=${encodeURIComponent(searchQuery)}&pageSize=20`)
        const clientsData = await clientsRes.json()
        
        // Search groups by name
        const groupsRes = await fetch(`/api/client-groups?q=${encodeURIComponent(searchQuery)}&pageSize=10`)
        const groupsData = await groupsRes.json()
        
        setClients(clientsData.items || [])
        setGroups(groupsData.items || [])
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchClients, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  // Load selected client details
  useEffect(() => {
    if (selectedClientId) {
      const loadClient = async () => {
        try {
          const res = await fetch(`/api/clients/${selectedClientId}`)
          if (res.ok) {
            const data = await res.json()
            setSelectedClient(data.item)
          }
        } catch (error) {
          console.error("Failed to load client:", error)
        }
      }
      loadClient()
    } else {
      setSelectedClient(null)
    }
  }, [selectedClientId])

  function handleClientSelect(client: Client) {
    setSelectedClient(client)
    onClientSelect(client)
    setOpen(false)
    setSearchQuery("")
  }

  function getUserInitials(name: string) {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid gap-2">
        <Label>Policy Holder *</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="justify-between h-auto min-h-[2.5rem] p-3"
            >
              {selectedClient ? (
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getUserInitials(selectedClient.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <div className="font-medium">{selectedClient.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {selectedClient.mobile || selectedClient.email || "No contact info"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Search className="h-4 w-4" />
                  Search by name, PAN, or group...
                </div>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Search clients by name, PAN, mobile, or group name..." 
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList className="max-h-[300px]">
                <CommandEmpty>
                  {loading ? "Searching..." : searchQuery.length < 2 ? "Type at least 2 characters to search" : "No clients found"}
                </CommandEmpty>
                
                {/* Individual Clients */}
                {clients.length > 0 && (
                  <CommandGroup heading="Individual Clients">
                    {clients.map((client) => (
                      <CommandItem
                        key={client.id}
                        value={client.id}
                        onSelect={() => handleClientSelect(client)}
                        className="flex items-center gap-3 p-3"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getUserInitials(client.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{client.name}</span>
                            {client.clientGroup && (
                              <Badge variant="secondary" className="text-xs">
                                <Users className="h-3 w-3 mr-1" />
                                {client.clientGroup.name}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {[
                              client.mobile,
                              client.panNo && `PAN: ${client.panNo}`,
                              client.relationshipToHead && `${client.relationshipToHead}`
                            ].filter(Boolean).join(" • ")}
                          </div>
                        </div>
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            selectedClientId === client.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Family Groups */}
                {groups.length > 0 && (
                  <CommandGroup heading="Family Groups">
                    {groups.map((group) => (
                      <div key={group.id} className="p-2">
                        <div className="flex items-center gap-2 p-2 text-sm font-medium text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {group.name} ({group.clients.length} members)
                        </div>
                        <div className="ml-6 space-y-1">
                          {group.clients.map((member: any) => (
                            <CommandItem
                              key={member.id}
                              value={member.id}
                              onSelect={() => {
                                // Find full client data
                                const fullClient = clients.find(c => c.id === member.id) || {
                                  ...member,
                                  clientGroup: group
                                }
                                handleClientSelect(fullClient as Client)
                              }}
                              className="flex items-center gap-3 p-2 ml-2"
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                                  {getUserInitials(member.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{member.name}</span>
                                  {member.relationshipToHead && (
                                    <Badge variant="outline" className="text-xs">
                                      {member.relationshipToHead}
                                    </Badge>
                                  )}
                                </div>
                                {member.panNo && (
                                  <div className="text-xs text-muted-foreground">
                                    PAN: {member.panNo}
                                  </div>
                                )}
                              </div>
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  selectedClientId === member.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected Client Details */}
      {selectedClient && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                  {getUserInitials(selectedClient.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{selectedClient.name}</h4>
                  {selectedClient.clientGroup && (
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {selectedClient.clientGroup.name}
                    </Badge>
                  )}
                  {selectedClient.relationshipToHead && (
                    <Badge variant="outline" className="text-xs">
                      {selectedClient.relationshipToHead}
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedClient.mobile && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Mobile:</span>
                      <span className="font-mono">{selectedClient.mobile}</span>
                    </div>
                  )}
                  {selectedClient.email && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-mono text-xs">{selectedClient.email}</span>
                    </div>
                  )}
                  {selectedClient.panNo && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">PAN:</span>
                      <span className="font-mono">{selectedClient.panNo}</span>
                    </div>
                  )}
                  {selectedClient.aadhaarNo && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Aadhaar:</span>
                      <span className="font-mono">{selectedClient.aadhaarNo}</span>
                    </div>
                  )}
                </div>

                {/* Family Group Members */}
                {selectedClient.clientGroup && selectedClient.clientGroup.clients.length > 1 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-xs text-muted-foreground mb-2">
                      Other family members ({selectedClient.clientGroup.clients.length - 1}):
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedClient.clientGroup.clients
                        .filter(member => member.id !== selectedClient.id)
                        .slice(0, 3)
                        .map((member) => (
                          <Button
                            key={member.id}
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => {
                              // Switch to family member
                              const memberClient = {
                                ...member,
                                clientGroup: selectedClient.clientGroup
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}