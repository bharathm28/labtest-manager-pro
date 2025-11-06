"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Pencil, Trash2, ArrowLeft, Search, History, Package, User, MapPin, ArrowUpDown, Calendar } from "lucide-react"
import Link from "next/link"
import { useForm, Controller } from "react-hook-form"
import { format } from "date-fns"
import { toast } from "sonner"

type InventoryItem = {
  id: number
  name: string
  type: string | null
  serialNumber: string | null
  description: string | null
  model: string | null
  category: string | null
  status: string
  currentLocation: string | null
  assignedToEmployeeId: number | null
  assignedDate: string | null
  assignedReason: string | null
  nextCalibration: string | null
  createdAt: string
  updatedAt: string
}

type InventoryLog = {
  id: number
  inventoryId: number
  action: string
  employeeId: number | null
  fromLocation: string | null
  toLocation: string | null
  reason: string | null
  performedBy: string | null
  timestamp: string
  notes: string | null
}

type Employee = {
  id: number
  name: string
  designation: string | null
  employeeCode: string | null
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)
  const [isLogsDialogOpen, setIsLogsDialogOpen] = useState(false)
  
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [itemLogs, setItemLogs] = useState<InventoryLog[]>([])

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm()
  const { register: registerAssign, handleSubmit: handleSubmitAssign, reset: resetAssign, control: controlAssign, formState: { errors: errorsAssign, isSubmitting: isSubmittingAssign } } = useForm()
  const { register: registerReturn, handleSubmit: handleSubmitReturn, reset: resetReturn, formState: { isSubmitting: isSubmittingReturn } } = useForm()

  const fetchInventory = async () => {
    setLoading(true)
    try {
      let url = '/api/inventory?limit=100'
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`
      if (statusFilter !== 'all') url += `&status=${statusFilter}`
      if (activeTab !== 'all') url += `&category=${activeTab}`

      const res = await fetch(url)
      const data = await res.json()
      setInventory(data)
    } catch (error) {
      console.error('Failed to fetch inventory:', error)
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees?limit=100')
      const data = await res.json()
      setEmployees(data)
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    fetchInventory()
  }, [searchTerm, statusFilter, activeTab])

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        assignedToEmployeeId: data.assignedToEmployeeId ? parseInt(data.assignedToEmployeeId) : null
      }

      const url = editingItem 
        ? `/api/inventory?id=${editingItem.id}`
        : '/api/inventory'
      
      const res = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success(editingItem ? 'Item updated' : 'Item created')
        // Create log entry if status changed during edit
        if (editingItem && editingItem.status !== data.status) {
          await fetch('/api/inventory-logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              inventoryId: editingItem.id,
              action: 'status_changed',
              employeeId: data.assignedToEmployeeId ? parseInt(data.assignedToEmployeeId) : null,
              fromLocation: editingItem.currentLocation,
              toLocation: data.currentLocation,
              reason: `Status changed from ${editingItem.status} to ${data.status}`,
              performedBy: 'System',
              notes: `Status updated via edit form: ${editingItem.status} → ${data.status}`
            })
          })
        }

        setIsDialogOpen(false)
        reset()
        setEditingItem(null)
        fetchInventory()
      } else {
        toast.error('Failed to save inventory')
      }
    } catch (error) {
      console.error('Failed to save inventory:', error)
      toast.error('An error occurred')
    }
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    reset({
      ...item,
      assignedToEmployeeId: item.assignedToEmployeeId?.toString() || ""
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) return

    try {
      const res = await fetch(`/api/inventory?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchInventory()
      }
    } catch (error) {
      console.error('Failed to delete inventory:', error)
    }
  }

  const handleAssign = (item: InventoryItem) => {
    setSelectedItem(item)
    resetAssign({
      employeeId: "",
      reason: "",
      location: item.currentLocation || ""
    })
    setIsAssignDialogOpen(true)
  }

  const onSubmitAssign = async (data: any) => {
    if (!selectedItem) return

    try {
      // Update inventory item
      await fetch(`/api/inventory?id=${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'assigned',
          assignedToEmployeeId: parseInt(data.employeeId),
          assignedDate: new Date().toISOString(),
          assignedReason: data.reason,
          currentLocation: data.location
        })
      })

      // Create log entry
      await fetch('/api/inventory-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryId: selectedItem.id,
          action: 'assigned',
          employeeId: parseInt(data.employeeId),
          toLocation: data.location,
          reason: data.reason,
          performedBy: 'System',
          notes: `Assigned to employee`
        })
      })

      setIsAssignDialogOpen(false)
      setSelectedItem(null)
      fetchInventory()
    } catch (error) {
      console.error('Failed to assign inventory:', error)
    }
  }

  const handleReturn = (item: InventoryItem) => {
    setSelectedItem(item)
    resetReturn({
      location: "",
      reason: ""
    })
    setIsReturnDialogOpen(true)
  }

  const onSubmitReturn = async (data: any) => {
    if (!selectedItem) return

    try {
      const oldLocation = selectedItem.currentLocation

      // Update inventory item
      await fetch(`/api/inventory?id=${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'available',
          assignedToEmployeeId: null,
          assignedDate: null,
          assignedReason: null,
          currentLocation: data.location
        })
      })

      // Create log entry
      await fetch('/api/inventory-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryId: selectedItem.id,
          action: 'returned',
          employeeId: selectedItem.assignedToEmployeeId,
          fromLocation: oldLocation,
          toLocation: data.location,
          reason: data.reason,
          performedBy: 'System',
          notes: `Returned from employee`
        })
      })

      setIsReturnDialogOpen(false)
      setSelectedItem(null)
      fetchInventory()
    } catch (error) {
      console.error('Failed to return inventory:', error)
    }
  }

  const handleViewLogs = async (item: InventoryItem) => {
    setSelectedItem(item)
    try {
      const res = await fetch(`/api/inventory-logs?inventoryId=${item.id}&limit=50`)
      const data = await res.json()
      setItemLogs(data)
      setIsLogsDialogOpen(true)
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    }
  }

  const getCategoryBadge = (category: string | null) => {
    if (!category) return <Badge variant="outline">Uncategorized</Badge>
    const variants: Record<string, { className: string, label: string }> = {
      equipment: { className: "bg-purple-100 text-purple-800 border-purple-300", label: "Equipment" },
      consumable: { className: "bg-green-100 text-green-800 border-green-300", label: "Consumable" },
      tool: { className: "bg-blue-100 text-blue-800 border-blue-300", label: "Tool" },
      standard: { className: "bg-yellow-100 text-yellow-800 border-yellow-300", label: "Standard" }
    }
    const config = variants[category] || { className: "bg-gray-100 text-gray-800 border-gray-300", label: category }
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getEmployeeName = (employeeId: number | null) => {
    if (!employeeId) return '-'
    const emp = employees.find(e => e.id === employeeId)
    return emp ? `${emp.name}${emp.employeeCode ? ` (${emp.employeeCode})` : ''}` : 'Unknown'
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      available: { variant: "default", label: "Available" },
      assigned: { variant: "secondary", label: "Assigned" },
      maintenance: { variant: "default", label: "Maintenance" },
      retired: { variant: "destructive", label: "Retired" }
    }
    const config = variants[status] || { variant: "secondary", label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-'
    try {
      return format(new Date(dateStr), 'dd MMM yyyy, hh:mm a')
    } catch {
      return '-'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Inventory Management</h1>
              <p className="text-gray-600 text-sm">Track equipment and consumables</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Laboratory Inventory</CardTitle>
                <CardDescription>Manage equipment assignments and track usage</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingItem(null); reset({}); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                      <DialogTitle>{editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}</DialogTitle>
                      <DialogDescription>
                        {editingItem ? 'Update item information' : 'Enter item details'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="name">Item Name *</Label>
                        <Input 
                          id="name" 
                          {...register('name', { required: 'Name is required' })}
                          placeholder="e.g., Current Clamp Probes"
                        />
                        {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message as string}</p>}
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Controller
                          name="category"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="equipment">Equipment</SelectItem>
                                <SelectItem value="consumable">Consumable</SelectItem>
                                <SelectItem value="tool">Tool</SelectItem>
                                <SelectItem value="standard">Calibration Standard</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div>
                        <Label htmlFor="type">Type</Label>
                        <Input 
                          id="type" 
                          {...register('type')}
                          placeholder="e.g., Consumable, Tool"
                        />
                      </div>
                      <div>
                        <Label htmlFor="model">Model</Label>
                        <Input id="model" {...register('model')} placeholder="Model number" />
                      </div>
                      <div>
                        <Label htmlFor="serialNumber">Serial Number</Label>
                        <Input id="serialNumber" {...register('serialNumber')} placeholder="Unique serial number" />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" {...register('description')} rows={2} placeholder="Item description..." />
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Controller
                          name="status"
                          control={control}
                          defaultValue="available"
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="available">Available</SelectItem>
                                <SelectItem value="assigned">Assigned</SelectItem>
                                <SelectItem value="maintenance">Maintenance</SelectItem>
                                <SelectItem value="retired">Retired</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div>
                        <Label htmlFor="currentLocation">Current Location</Label>
                        <Input id="currentLocation" {...register('currentLocation')} placeholder="e.g., Lab Storage, Calibration Room" />
                      </div>
                      <div>
                        <Label htmlFor="nextCalibration">Next Calibration Date</Label>
                        <Input 
                          id="nextCalibration" 
                          type="datetime-local"
                          {...register('nextCalibration')} 
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : editingItem ? 'Update' : 'Create'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="all">All Items</TabsTrigger>
                <TabsTrigger value="equipment">Equipment</TabsTrigger>
                <TabsTrigger value="consumable">Consumables</TabsTrigger>
                <TabsTrigger value="tool">Tools</TabsTrigger>
                <TabsTrigger value="standard">Standards</TabsTrigger>
              </TabsList>

              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input 
                    placeholder="Search by name, serial number, model, or description..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}>
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  Sort {sortOrder === "asc" ? "A-Z" : "Z-A"}
                </Button>
              </div>

              <TabsContent value={activeTab} className="mt-0">
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : inventory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No inventory items found</div>
                ) : (
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Model</TableHead>
                          <TableHead>Serial Number</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Next Calibration</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventory.sort((a, b) => {
                          const comparison = a.name.localeCompare(b.name)
                          return sortOrder === "asc" ? comparison : -comparison
                        }).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="font-medium">{item.name}</div>
                              {item.description && <div className="text-sm text-gray-500 max-w-xs truncate">{item.description}</div>}
                            </TableCell>
                            <TableCell>{getCategoryBadge(item.category)}</TableCell>
                            <TableCell>{item.model || '-'}</TableCell>
                            <TableCell>
                              {item.serialNumber ? (
                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{item.serialNumber}</span>
                              ) : 'N/A'}
                            </TableCell>
                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                            <TableCell>
                              {item.currentLocation ? (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-gray-400" />
                                  <span className="text-sm">{item.currentLocation}</span>
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              {item.nextCalibration ? (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-gray-400" />
                                  <span className="text-sm">{formatDateTime(item.nextCalibration)}</span>
                                </div>
                              ) : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {item.status === 'available' && (
                                  <Button variant="ghost" size="sm" onClick={() => handleAssign(item)}>
                                    <User className="w-3 h-3 mr-1" />
                                    Assign
                                  </Button>
                                )}
                                {item.status === 'assigned' && (
                                  <Button variant="ghost" size="sm" onClick={() => handleReturn(item)}>
                                    <Package className="w-3 h-3 mr-1" />
                                    Return
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" onClick={() => handleViewLogs(item)}>
                                  <History className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Assign Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="max-w-md">
            <form onSubmit={handleSubmitAssign(onSubmitAssign)}>
              <DialogHeader>
                <DialogTitle>Assign Inventory Item</DialogTitle>
                <DialogDescription>
                  Assign {selectedItem?.name} to an employee
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="employeeId">Employee *</Label>
                  <Controller
                    name="employeeId"
                    control={controlAssign}
                    rules={{ required: 'Employee is required' }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map(emp => (
                            <SelectItem key={emp.id} value={emp.id.toString()}>
                              {emp.name} {emp.employeeCode ? `(${emp.employeeCode})` : ''} - {emp.designation || 'N/A'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errorsAssign.employeeId && <p className="text-sm text-red-600 mt-1">{errorsAssign.employeeId.message as string}</p>}
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" {...registerAssign('location')} placeholder="Where will it be used?" />
                </div>
                <div>
                  <Label htmlFor="reason">Reason for Assignment *</Label>
                  <Textarea 
                    id="reason" 
                    {...registerAssign('reason', { required: 'Reason is required' })} 
                    rows={3}
                    placeholder="Why is this item being assigned?"
                  />
                  {errorsAssign.reason && <p className="text-sm text-red-600 mt-1">{errorsAssign.reason.message as string}</p>}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmittingAssign}>
                  {isSubmittingAssign ? 'Assigning...' : 'Assign'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Return Dialog */}
        <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
          <DialogContent className="max-w-md">
            <form onSubmit={handleSubmitReturn(onSubmitReturn)}>
              <DialogHeader>
                <DialogTitle>Return Inventory Item</DialogTitle>
                <DialogDescription>
                  Return {selectedItem?.name} from {getEmployeeName(selectedItem?.assignedToEmployeeId || null)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="location">Return Location *</Label>
                  <Input 
                    id="location" 
                    {...registerReturn('location', { required: 'Location is required' })} 
                    placeholder="e.g., Storage Room, Lab A"
                  />
                </div>
                <div>
                  <Label htmlFor="reason">Reason for Return</Label>
                  <Textarea 
                    id="reason" 
                    {...registerReturn('reason')} 
                    rows={3}
                    placeholder="Optional notes about the return..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsReturnDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmittingReturn}>
                  {isSubmittingReturn ? 'Returning...' : 'Return'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Logs Dialog */}
        <Dialog open={isLogsDialogOpen} onOpenChange={setIsLogsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Inventory Logs</DialogTitle>
              <DialogDescription>
                Complete activity history for {selectedItem?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {itemLogs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No activity logs found</p>
              ) : (
                itemLogs.map((log) => {
                  // Extract status change information for better display
                  const getActionDisplay = () => {
                    if (log.action === 'status_changed' && log.reason) {
                      // Parse "Status changed from X to Y" to extract statuses
                      const match = log.reason.match(/Status changed from (\w+) to (\w+)/)
                      if (match) {
                        const [, fromStatus, toStatus] = match
                        return `Status Changed: ${fromStatus.charAt(0).toUpperCase() + fromStatus.slice(1)} → ${toStatus.charAt(0).toUpperCase() + toStatus.slice(1)}`
                      }
                      return log.reason
                    }
                    return log.action.replace(/_/g, ' ')
                  }

                  return (
                    <div key={log.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold capitalize">
                            {getActionDisplay()}
                          </p>
                          {log.employeeId && (
                            <p className="text-sm text-gray-600 mt-1">
                              Employee: {getEmployeeName(log.employeeId)}
                            </p>
                          )}
                          {log.fromLocation && (
                            <p className="text-sm text-gray-600">From: {log.fromLocation}</p>
                          )}
                          {log.toLocation && (
                            <p className="text-sm text-gray-600">To: {log.toLocation}</p>
                          )}
                          {log.reason && log.action !== 'status_changed' && (
                            <p className="text-sm text-gray-600 mt-1">Reason: {log.reason}</p>
                          )}
                          {log.notes && (
                            <p className="text-sm text-gray-500 mt-1 italic">{log.notes}</p>
                          )}
                          {log.performedBy && (
                            <p className="text-xs text-gray-500 mt-1">By: {log.performedBy}</p>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 whitespace-nowrap ml-4">{formatDateTime(log.timestamp)}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}