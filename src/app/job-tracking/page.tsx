"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Search, Eye, Edit, History, Loader2, Calendar, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useForm, Controller } from "react-hook-form"
import { format } from "date-fns"
import { useSearchParams } from "next/navigation"

type ServiceRequest = {
  id: number
  jobCardNumber: string
  companyId: number
  contactPersonId: number | null
  productName: string
  productDescription: string | null
  quantity: number | null
  testType: string | null
  specialRequirements: string | null
  status: string
  requestedDate: string | null
  agreedDate: string | null
  materialReceivedDate: string | null
  testingStartDate: string | null
  testingEndDate: string | null
  completionDate: string | null
  assignedEmployeeId: number | null
  assignedTestbedId: number | null
  dcNumber: string | null
  dcVerified: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

type StatusHistory = {
  id: number
  status: string
  notes: string | null
  changedBy: string | null
  changedAt: string
}

export default function JobTrackingPage() {
  const searchParams = useSearchParams()
  const [jobs, setJobs] = useState<ServiceRequest[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [testBeds, setTestBeds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState(searchParams?.get("status") || "all")
  
  const [selectedJob, setSelectedJob] = useState<ServiceRequest | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([])

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm()

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "requested", label: "Requested" },
    { value: "replied", label: "Replied" },
    { value: "srf_filled", label: "SRF Filled" },
    { value: "agreed", label: "Agreed" },
    { value: "material_received", label: "Material Received" },
    { value: "testing", label: "Testing" },
    { value: "completed", label: "Completed" },
    { value: "reported", label: "Reported" }
  ]

  const fetchJobs = async () => {
    setLoading(true)
    try {
      let url = '/api/service-requests?limit=100'
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`
      if (statusFilter !== 'all') url += `&status=${statusFilter}`

      const res = await fetch(url)
      const data = await res.json()
      setJobs(data)
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchResources = async () => {
    try {
      const [companiesRes, employeesRes, testBedsRes] = await Promise.all([
        fetch('/api/companies?limit=100'),
        fetch('/api/employees?limit=100'),
        fetch('/api/test-beds?limit=100')
      ])

      setCompanies(await companiesRes.json())
      setEmployees(await employeesRes.json())
      setTestBeds(await testBedsRes.json())
    } catch (error) {
      console.error('Failed to fetch resources:', error)
    }
  }

  useEffect(() => {
    fetchResources()
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [searchTerm, statusFilter])

  const handleViewJob = (job: ServiceRequest) => {
    setSelectedJob(job)
    setIsViewDialogOpen(true)
  }

  const handleEditJob = (job: ServiceRequest) => {
    setSelectedJob(job)
    reset({
      ...job,
      companyId: job.companyId?.toString(),
      assignedEmployeeId: job.assignedEmployeeId?.toString() || "",
      assignedTestbedId: job.assignedTestbedId?.toString() || "",
      requestedDate: job.requestedDate ? format(new Date(job.requestedDate), "yyyy-MM-dd'T'HH:mm") : "",
      agreedDate: job.agreedDate ? format(new Date(job.agreedDate), "yyyy-MM-dd'T'HH:mm") : "",
      materialReceivedDate: job.materialReceivedDate ? format(new Date(job.materialReceivedDate), "yyyy-MM-dd'T'HH:mm") : "",
      testingStartDate: job.testingStartDate ? format(new Date(job.testingStartDate), "yyyy-MM-dd'T'HH:mm") : "",
      testingEndDate: job.testingEndDate ? format(new Date(job.testingEndDate), "yyyy-MM-dd'T'HH:mm") : "",
      completionDate: job.completionDate ? format(new Date(job.completionDate), "yyyy-MM-dd'T'HH:mm") : ""
    })
    setIsEditDialogOpen(true)
  }

  const handleViewHistory = async (job: ServiceRequest) => {
    setSelectedJob(job)
    try {
      const res = await fetch(`/api/service-requests/${job.id}/history`)
      const data = await res.json()
      setStatusHistory(data)
      setIsHistoryDialogOpen(true)
    } catch (error) {
      console.error('Failed to fetch history:', error)
    }
  }

  const onSubmitEdit = async (data: any) => {
    if (!selectedJob) return

    try {
      const payload = {
        ...data,
        companyId: parseInt(data.companyId),
        assignedEmployeeId: data.assignedEmployeeId ? parseInt(data.assignedEmployeeId) : null,
        assignedTestbedId: data.assignedTestbedId ? parseInt(data.assignedTestbedId) : null,
        quantity: data.quantity ? parseInt(data.quantity) : null,
        dcVerified: Boolean(data.dcVerified)
      }

      // Convert date strings to ISO format
      const dateFields = ['requestedDate', 'agreedDate', 'materialReceivedDate', 'testingStartDate', 'testingEndDate', 'completionDate']
      dateFields.forEach(field => {
        if (payload[field]) {
          payload[field] = new Date(payload[field]).toISOString()
        } else {
          payload[field] = null
        }
      })

      const res = await fetch(`/api/service-requests?id=${selectedJob.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        // If status changed, create history entry
        if (data.status !== selectedJob.status) {
          await fetch('/api/status-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              serviceRequestId: selectedJob.id,
              status: data.status,
              notes: `Status updated from ${selectedJob.status} to ${data.status}`,
              changedBy: 'System'
            })
          })
        }

        setIsEditDialogOpen(false)
        setSelectedJob(null)
        fetchJobs()
      }
    } catch (error) {
      console.error('Failed to update job:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any, label: string }> = {
      requested: { variant: "secondary", label: "Requested" },
      replied: { variant: "default", label: "Replied" },
      srf_filled: { variant: "default", label: "SRF Filled" },
      agreed: { variant: "default", label: "Agreed" },
      material_received: { variant: "default", label: "Material Received" },
      testing: { variant: "default", label: "Testing" },
      completed: { variant: "default", label: "Completed" },
      reported: { variant: "default", label: "Reported" }
    }
    const config = variants[status] || { variant: "secondary", label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getCompanyName = (companyId: number) => {
    return companies.find(c => c.id === companyId)?.name || 'Unknown'
  }

  const getEmployeeName = (employeeId: number | null) => {
    if (!employeeId) return '-'
    return employees.find(e => e.id === employeeId)?.name || 'Unknown'
  }

  const getTestBedName = (testBedId: number | null) => {
    if (!testBedId) return '-'
    return testBeds.find(t => t.id === testBedId)?.name || 'Unknown'
  }

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-'
    try {
      return format(new Date(dateStr), 'dd MMM yyyy, hh:mm a')
    } catch {
      return '-'
    }
  }

  const getExpectedCompletion = (job: ServiceRequest) => {
    // For jobs in testing status, show expected completion
    if (job.status === 'testing' && job.testingEndDate) {
      return formatDateTime(job.testingEndDate)
    }
    return '-'
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
              <h1 className="text-2xl font-bold">Job Tracking</h1>
              <p className="text-gray-600 text-sm">Track and manage all service requests</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>All Service Requests</CardTitle>
            <CardDescription>View and manage testing job requests</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="Search by job card number or product name..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Jobs Table */}
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500 mx-auto" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No jobs found</div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Card #</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Test Bed</TableHead>
                      <TableHead>Expected Completion</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-mono text-sm">{job.jobCardNumber}</TableCell>
                        <TableCell>{getCompanyName(job.companyId)}</TableCell>
                        <TableCell className="max-w-xs truncate">{job.productName}</TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell>{getEmployeeName(job.assignedEmployeeId)}</TableCell>
                        <TableCell>
                          {job.assignedTestbedId ? (
                            <div className="flex items-center gap-2">
                              <span>{getTestBedName(job.assignedTestbedId)}</span>
                              {job.status === 'testing' && (
                                <Badge variant="secondary" className="text-xs">
                                  In Progress
                                </Badge>
                              )}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {getExpectedCompletion(job) !== '-' ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="w-3 h-3 text-blue-500" />
                              <span>{getExpectedCompletion(job)}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleViewJob(job)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEditJob(job)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleViewHistory(job)}>
                              <History className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Job Details</DialogTitle>
              <DialogDescription>Complete information about the service request</DialogDescription>
            </DialogHeader>
            {selectedJob && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Job Card Number</Label>
                    <p className="font-mono">{selectedJob.jobCardNumber}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedJob.status)}</div>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-600">Company</Label>
                  <p>{getCompanyName(selectedJob.companyId)}</p>
                </div>

                <div>
                  <Label className="text-gray-600">Product Name</Label>
                  <p>{selectedJob.productName}</p>
                </div>

                {selectedJob.productDescription && (
                  <div>
                    <Label className="text-gray-600">Product Description</Label>
                    <p>{selectedJob.productDescription}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Quantity</Label>
                    <p>{selectedJob.quantity || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Test Type</Label>
                    <p>{selectedJob.testType || '-'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Assigned Employee</Label>
                    <p>{getEmployeeName(selectedJob.assignedEmployeeId)}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Assigned Test Bed</Label>
                    <p>{getTestBedName(selectedJob.assignedTestbedId)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">DC Number</Label>
                    <p>{selectedJob.dcNumber || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">DC Verified</Label>
                    <p>{selectedJob.dcVerified ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Timeline</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Requested:</span>
                      <span>{formatDateTime(selectedJob.requestedDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Agreed:</span>
                      <span>{formatDateTime(selectedJob.agreedDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Material Received:</span>
                      <span>{formatDateTime(selectedJob.materialReceivedDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Testing Start:</span>
                      <span>{formatDateTime(selectedJob.testingStartDate)}</span>
                    </div>
                    {selectedJob.status === 'testing' && selectedJob.testingEndDate && (
                      <div className="flex justify-between items-center bg-blue-50 p-2 rounded">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Clock className="w-4 h-4 text-blue-600" />
                          Expected Completion:
                        </span>
                        <span className="font-semibold text-blue-700">{formatDateTime(selectedJob.testingEndDate)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Testing End:</span>
                      <span>{formatDateTime(selectedJob.testingEndDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed:</span>
                      <span>{formatDateTime(selectedJob.completionDate)}</span>
                    </div>
                  </div>
                </div>

                {selectedJob.notes && (
                  <div>
                    <Label className="text-gray-600">Notes</Label>
                    <p className="text-sm">{selectedJob.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmitEdit)}>
              <DialogHeader>
                <DialogTitle>Edit Job Details</DialogTitle>
                <DialogDescription>Update service request information and tracking</DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="basic" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="assignment">Assignment</TabsTrigger>
                  <TabsTrigger value="tracking">Tracking</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="productName">Product Name *</Label>
                    <Input {...register('productName', { required: 'Required' })} />
                  </div>
                  <div>
                    <Label htmlFor="productDescription">Product Description</Label>
                    <Textarea {...register('productDescription')} rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input type="number" {...register('quantity')} />
                    </div>
                    <div>
                      <Label htmlFor="testType">Test Type</Label>
                      <Input {...register('testType')} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="specialRequirements">Special Requirements</Label>
                    <Textarea {...register('specialRequirements')} rows={2} />
                  </div>
                </TabsContent>

                <TabsContent value="assignment" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Controller
                      name="status"
                      control={control}
                      rules={{ required: 'Status is required' }}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.filter(s => s.value !== 'all').map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div>
                    <Label htmlFor="assignedEmployeeId">Assigned Employee</Label>
                    <Controller
                      name="assignedEmployeeId"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {employees.map(emp => (
                              <SelectItem key={emp.id} value={emp.id.toString()}>
                                {emp.name} - {emp.designation || 'N/A'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div>
                    <Label htmlFor="assignedTestbedId">Assigned Test Bed</Label>
                    <Controller
                      name="assignedTestbedId"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select test bed" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {testBeds.map(tb => (
                              <SelectItem key={tb.id} value={tb.id.toString()}>
                                {tb.name} ({tb.status})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dcNumber">DC Number</Label>
                      <Input {...register('dcNumber')} />
                    </div>
                    <div className="flex items-center space-x-2 mt-6">
                      <input type="checkbox" {...register('dcVerified')} className="w-4 h-4" />
                      <Label htmlFor="dcVerified">DC Verified</Label>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="tracking" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="requestedDate">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Requested Date & Time
                    </Label>
                    <Input type="datetime-local" {...register('requestedDate')} />
                  </div>
                  <div>
                    <Label htmlFor="agreedDate">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Agreed Date & Time
                    </Label>
                    <Input type="datetime-local" {...register('agreedDate')} />
                  </div>
                  <div>
                    <Label htmlFor="materialReceivedDate">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Material Received Date & Time
                    </Label>
                    <Input type="datetime-local" {...register('materialReceivedDate')} />
                  </div>
                  <div>
                    <Label htmlFor="testingStartDate">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Testing Start Date & Time
                    </Label>
                    <Input type="datetime-local" {...register('testingStartDate')} />
                  </div>
                  <div>
                    <Label htmlFor="testingEndDate">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Testing End Date & Time
                    </Label>
                    <Input type="datetime-local" {...register('testingEndDate')} />
                  </div>
                  <div>
                    <Label htmlFor="completionDate">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Completion Date & Time
                    </Label>
                    <Input type="datetime-local" {...register('completionDate')} />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea {...register('notes')} rows={2} />
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* History Dialog */}
        <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Status History</DialogTitle>
              <DialogDescription>
                Job Card: {selectedJob?.jobCardNumber}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {statusHistory.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No history available</p>
              ) : (
                statusHistory.map((entry) => (
                  <div key={entry.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{entry.status.replace(/_/g, ' ').toUpperCase()}</p>
                        {entry.notes && <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>}
                        {entry.changedBy && (
                          <p className="text-xs text-gray-500 mt-1">Changed by: {entry.changedBy}</p>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{formatDateTime(entry.changedAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}