"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Download, Eye, Calendar, IndianRupee, User } from "lucide-react"
import { format } from "date-fns"
import { PremiumPaymentModal } from "./premium-payment-modal"

interface PremiumRecord {
  id: string
  client: {
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
  }
  policy: {
    id: string
    policyNumber: string
    insurer: string
    planName?: string
    status: string
    premiumAmount?: number
    premiumMode?: string
  }
  dueDate: string
  premiumAmount: number
  paidAmount?: number
  paymentDate?: string
  status: "UPCOMING" | "OVERDUE" | "PAID" | "UNPAID"
  paymentMode?: string
  receiptNumber?: string
  gracePeriodEnd?: string
}

const filterOptions = [
  { value: "ALL", label: "All Premiums", count: 0 },
  { value: "UPCOMING", label: "Upcoming", count: 0 },
  { value: "OVERDUE", label: "Overdue", count: 0 },
  { value: "PAID", label: "Paid", count: 0 },
  { value: "UNPAID", label: "Unpaid", count: 0 },
]

export function PremiumList() {
  const [premiums, setPremiums] = useState<PremiumRecord[]>([])
  const [summary, setSummary] = useState({
    total: 0,
    upcoming: 0,
    overdue: 0,
    paid: 0,
    unpaid: 0,
    totalAmount: 0,
  })
  const [filteredPremiums, setFilteredPremiums] = useState<PremiumRecord[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [sortBy, setSortBy] = useState("dueDate")
  const [isLoading, setIsLoading] = useState(true)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedPolicyData, setSelectedPolicyData] = useState<
    | {
        id: string
        policyNumber: string
        insurer: string
        planName?: string
        status: string
        nextDueDate?: string
        premiumAmount?: number
        premiumMode?: string
        client: {
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
        }
      }
    | undefined
  >()

  const fetchPremiums = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/premiums")
      if (response.ok) {
        const data = await response.json()
        setPremiums(data.premiums || [])
        setSummary(data.summary || {
          total: 0,
          upcoming: 0,
          overdue: 0,
          paid: 0,
          unpaid: 0,
          totalAmount: 0,
        })
      }
    } catch (error) {
      console.error("Error fetching premiums:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPremiums()
  }, [])

  const handlePaymentSuccess = () => {
    fetchPremiums()
    setIsPaymentModalOpen(false)
    setSelectedPolicyData(undefined)
  }

  const handlePayNow = (premium: PremiumRecord) => {
    const policyData = {
      id: premium.policy.id,
      policyNumber: premium.policy.policyNumber,
      insurer: premium.policy.insurer,
      planName: premium.policy.planName,
      status: premium.policy.status,
      nextDueDate: premium.dueDate,
      premiumAmount: premium.premiumAmount,
      premiumMode: premium.policy.premiumMode,
      client: {
        id: premium.client.id,
        name: premium.client.name,
        mobile: premium.client.mobile,
        panNo: premium.client.panNo,
        aadhaarNo: premium.client.aadhaarNo,
        email: premium.client.email,
        clientGroup: premium.client.clientGroup,
      },
    }
    setSelectedPolicyData(policyData)
    setIsPaymentModalOpen(true)
  }

  useEffect(() => {
    let filtered = premiums

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((premium) => premium.status === statusFilter)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (premium) =>
          premium.client.name.toLowerCase().includes(query) ||
          premium.policy.policyNumber.toLowerCase().includes(query) ||
          premium.policy.insurer.toLowerCase().includes(query) ||
          premium.client.mobile?.includes(query),
      )
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "dueDate":
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        case "clientName":
          return a.client.name.localeCompare(b.client.name)
        case "amount":
          return b.premiumAmount - a.premiumAmount
        default:
          return 0
      }
    })

    setFilteredPremiums(filtered)
  }, [premiums, statusFilter, searchQuery, sortBy])

  const getStatusBadge = (status: string, dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)

    switch (status) {
      case "PAID":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>
      case "OVERDUE":
        return <Badge variant="destructive">Overdue</Badge>
      case "UPCOMING":
        const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        if (daysUntilDue <= 7) {
          return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Due Soon</Badge>
        }
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Upcoming</Badge>
      case "UNPAID":
        return <Badge variant="secondary">Unpaid</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getFilterCounts = () => {
    return {
      ALL: summary.total,
      UPCOMING: summary.upcoming,
      OVERDUE: summary.overdue,
      PAID: summary.paid,
      UNPAID: summary.unpaid,
    }
  }

  const counts = getFilterCounts()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading premiums...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Premiums</p>
                <p className="text-2xl font-bold">{counts.ALL}</p>
              </div>
              <Filter className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-destructive">{counts.OVERDUE}</p>
              </div>
              <Calendar className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold text-blue-600">{counts.UPCOMING}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold text-green-600">{counts.PAID}</p>
              </div>
              <IndianRupee className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Premium Payments</span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardTitle>
          <CardDescription>Manage and track premium payments across all policies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <Button
                key={option.value}
                variant={statusFilter === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(option.value)}
                className="flex items-center space-x-2"
              >
                <span>{option.label}</span>
                <Badge variant="secondary" className="ml-1 text-xs">
                  {counts[option.value as keyof typeof counts]}
                </Badge>
              </Button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by client name, policy number, or insurer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dueDate">Due Date</SelectItem>
                <SelectItem value="clientName">Client Name</SelectItem>
                <SelectItem value="amount">Premium Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Policy</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Details</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPremiums.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchQuery || statusFilter !== "ALL"
                      ? "No premiums found matching your criteria"
                      : "No premium records found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPremiums.map((premium) => (
                  <TableRow key={premium.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{premium.client.name}</span>
                        </div>
                        {premium.client.mobile && (
                          <div className="text-sm text-muted-foreground">{premium.client.mobile}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{premium.policy.policyNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          {premium.policy.insurer}
                          {premium.policy.planName && ` - ${premium.policy.planName}`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(premium.dueDate), "dd MMM yyyy")}</span>
                      </div>
                      {premium.gracePeriodEnd && premium.status === "OVERDUE" && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Grace: {format(new Date(premium.gracePeriodEnd), "dd MMM")}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">₹{premium.premiumAmount.toLocaleString()}</span>
                      </div>
                      {premium.paidAmount && premium.paidAmount !== premium.premiumAmount && (
                        <div className="text-sm text-muted-foreground">
                          Paid: ₹{premium.paidAmount.toLocaleString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(premium.status, premium.dueDate)}</TableCell>
                    <TableCell>
                      {premium.status === "PAID" && premium.paymentDate ? (
                        <div className="space-y-1">
                          <div className="text-sm">Paid: {format(new Date(premium.paymentDate), "dd MMM yyyy")}</div>
                          {premium.paymentMode && (
                            <div className="text-xs text-muted-foreground">{premium.paymentMode}</div>
                          )}
                          {premium.receiptNumber && (
                            <div className="text-xs text-muted-foreground">#{premium.receiptNumber}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {premium.status !== "PAID" && (
                          <Button variant="outline" size="sm" onClick={() => handlePayNow(premium)}>
                            Pay Now
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

  

      <PremiumPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false)
          setSelectedPolicyData(undefined)
        }}
        onPaymentSuccess={handlePaymentSuccess}
        preSelectedPolicy={selectedPolicyData}
      />
    </div>
  )
}
