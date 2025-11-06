"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, ArrowLeft, Search, Eye, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useForm, Controller } from "react-hook-form"
import { toast } from "sonner"

type TestBed = {
  id: number
  name: string
  description: string | null
  location: string | null
  status: string
  createdAt: string
  currentTask?: {
    id: number
    jobCardNumber: string
    serviceRequestId: number
    assignedEmployeeId: number | null
    scheduledStartDate: string | null
    scheduledEndDate: string | null
    actualStartDate: string | null
    priority: string
  } | null
  queueCount?: number
}

type TestBedTask = {
  id: number
  serviceRequestId: number
  testbedId: number
  assignedEmployeeId: number | null
  status: string
  priority: string
  scheduledStartDate: string | null
  scheduledEndDate: string | null
  actualStartDate: string | null
  actualEndDate: string | null
  queuePosition: number
  notes: string | null
  createdAt: string
  updatedAt: string
  jobCardNumber: string
}

export default function TestBedsPage() {
  const [testBeds, setTestBeds] = useState<TestBed[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTestBed, setEditingTestBed] = useState<TestBed | null>(null)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [selectedTestBed, setSelectedTestBed] = useState<TestBed | null>(null)
  const [currentTask, setCurrentTask] = useState<TestBedTask | null>(null)
  const [queuedTasks, setQueuedTasks] = useState<TestBedTask[]>([])
  const [loadingStatus, setLoadingStatus] = useState(false)

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm()

  const fetchTestBeds = async () => {
    setLoading(true)
    try {
      const url = searchTerm 
        ? `/api/test-beds?search=${encodeURIComponent(searchTerm)}&limit=100`
        : '/api/test-beds?limit=100'
      const res = await fetch(url)
      const data = await res.json()
      
      // Fetch additional data for each test bed
      const enrichedData = await Promise.all(
        data.map(async (testBed: TestBed) => {
          let currentTask = null
          let queueCount = 0
          
          // Fetch current task if in_use
          if (testBed.status === 'in_use') {
            try {
              const taskRes = await fetch(`/api/test-beds/${testBed.id}/current-task`)
              if (taskRes.ok) {
                currentTask = await taskRes.json()
              }
            } catch (err) {
              console.error('Failed to fetch current task:', err)
            }
          }
          
          // Fetch queue count
          try {
            const queueRes = await fetch(`/api/test-beds/${testBed.id}/queue`)
            if (queueRes.ok) {
              const queue = await queueRes.json()
              queueCount = queue.length
            }
          } catch (err) {
            console.error('Failed to fetch queue:', err)
          }
          
          return {
            ...testBed,
            currentTask,
            queueCount
          }
        })
      )
      
      setTestBeds(enrichedData)
    } catch (error) {
      console.error('Failed to fetch test beds:', error)
      toast.error('Failed to load test beds')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTestBeds()
  }, [searchTerm])

  const onSubmit = async (data: any) => {
    try {
      const url = editingTestBed 
        ? `/api/test-beds?id=${editingTestBed.id}`
        : '/api/test-beds'
      
      const res = await fetch(url, {
        method: editingTestBed ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (res.ok) {
        toast.success(editingTestBed ? 'Test bed updated' : 'Test bed created')
        setIsDialogOpen(false)
        reset()
        setEditingTestBed(null)
        fetchTestBeds()
      } else {
        toast.error('Failed to save test bed')
      }
    } catch (error) {
      console.error('Failed to save test bed:', error)
      toast.error('An error occurred')
    }
  }

  const handleEdit = (testBed: TestBed) => {
    setEditingTestBed(testBed)
    reset(testBed)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    // Use custom dialog instead of browser confirm
    const confirmed = window.confirm('Are you sure you want to delete this test bed?')
    if (!confirmed) return

    try {
      const res = await fetch(`/api/test-beds?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Test bed deleted')
        fetchTestBeds()
      } else {
        toast.error('Failed to delete test bed')
      }
    } catch (error) {
      console.error('Failed to delete test bed:', error)
      toast.error('An error occurred')
    }
  }

  const handleViewStatus = async (testBed: TestBed) => {
    setSelectedTestBed(testBed)
    setStatusDialogOpen(true)
    setLoadingStatus(true)
    setCurrentTask(null)
    setQueuedTasks([])
    
    try {
      // Fetch current task
      if (testBed.status === 'in_use') {
        const taskRes = await fetch(`/api/test-beds/${testBed.id}/current-task`)
        if (taskRes.ok) {
          const task = await taskRes.json()
          setCurrentTask(task)
        }
      }
      
      // Fetch queued tasks
      const queueRes = await fetch(`/api/test-beds/${testBed.id}/queue`)
      if (queueRes.ok) {
        const queue = await queueRes.json()
        setQueuedTasks(queue)
      }
    } catch (error) {
      console.error('Failed to fetch status:', error)
      toast.error('Failed to load status details')
    } finally {
      setLoadingStatus(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive", label: string }> = {
      available: { variant: "default", label: "Available" },
      in_use: { variant: "secondary", label: "In Use" },
      maintenance: { variant: "destructive", label: "Maintenance" }
    }
    const config = variants[status] || { variant: "default", label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { className: string, label: string }> = {
      urgent: { className: "bg-red-100 text-red-800 border-red-300", label: "Urgent" },
      high: { className: "bg-orange-100 text-orange-800 border-orange-300", label: "High" },
      normal: { className: "bg-blue-100 text-blue-800 border-blue-300", label: "Normal" },
      low: { className: "bg-gray-100 text-gray-800 border-gray-300", label: "Low" }
    }
    const config = variants[priority] || variants.normal
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
              <h1 className="text-2xl font-bold">Test Beds</h1>
              <p className="text-gray-600 text-sm">Manage testing equipment and test beds</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Test Beds</CardTitle>
                <CardDescription>View and manage all testing equipment</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingTestBed(null); reset({ status: 'available' }); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Test Bed
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                      <DialogTitle>{editingTestBed ? 'Edit Test Bed' : 'Add New Test Bed'}</DialogTitle>
                      <DialogDescription>
                        {editingTestBed ? 'Update test bed information' : 'Enter test bed details'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="name">Test Bed Name *</Label>
                        <Input 
                          id="name" 
                          {...register('name', { required: 'Name is required' })}
                        />
                        {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message as string}</p>}
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" {...register('description')} />
                      </div>
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input id="location" {...register('location')} />
                      </div>
                      <div>
                        <Label htmlFor="status">Status *</Label>
                        <Controller
                          name="status"
                          control={control}
                          defaultValue="available"
                          rules={{ required: 'Status is required' }}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="available">Available</SelectItem>
                                <SelectItem value="in_use">In Use</SelectItem>
                                <SelectItem value="maintenance">Maintenance</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.status && <p className="text-sm text-red-600 mt-1">{errors.status.message as string}</p>}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : editingTestBed ? 'Update' : 'Create'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="Search test beds..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : testBeds.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No test beds found</div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Current Task</TableHead>
                      <TableHead>Queue</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testBeds.map((testBed) => (
                      <TableRow key={testBed.id}>
                        <TableCell className="font-medium">{testBed.name}</TableCell>
                        <TableCell className="max-w-xs truncate">{testBed.description || '-'}</TableCell>
                        <TableCell>{testBed.location || '-'}</TableCell>
                        <TableCell>{getStatusBadge(testBed.status)}</TableCell>
                        <TableCell>
                          {testBed.status === 'in_use' && testBed.currentTask ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium text-blue-600">
                                {testBed.currentTask.jobCardNumber}
                              </span>
                              {testBed.currentTask.priority && (
                                <div>{getPriorityBadge(testBed.currentTask.priority)}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {testBed.queueCount && testBed.queueCount > 0 ? (
                            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3" />
                              {testBed.queueCount} queued
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleViewStatus(testBed)}
                              title="View Status"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(testBed)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(testBed.id)}>
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
          </CardContent>
        </Card>
      </main>

      {/* Status Details Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Test Bed Status - {selectedTestBed?.name}</DialogTitle>
            <DialogDescription>
              Current task and queue details
            </DialogDescription>
          </DialogHeader>
          
          {loadingStatus ? (
            <div className="text-center py-8 text-gray-500">Loading status...</div>
          ) : (
            <div className="space-y-6">
              {/* Current Task Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Current Task
                </h3>
                {currentTask ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-500">Job Card Number</Label>
                          <p className="font-semibold text-blue-600">{currentTask.jobCardNumber}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500">Priority</Label>
                          <div className="mt-1">{getPriorityBadge(currentTask.priority)}</div>
                        </div>
                        <div>
                          <Label className="text-gray-500">Scheduled Start</Label>
                          <p className="text-sm">{formatDateTime(currentTask.scheduledStartDate)}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500">Actual Start</Label>
                          <p className="text-sm">{formatDateTime(currentTask.actualStartDate)}</p>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-gray-500 flex items-center gap-1">
                            <Clock className="w-4 h-4 text-blue-600" />
                            Expected Completion
                          </Label>
                          <p className="text-lg font-bold text-blue-700 mt-1">
                            {formatDateTime(currentTask.scheduledEndDate)}
                          </p>
                        </div>
                        <div>
                          <Label className="text-gray-500">Status</Label>
                          <Badge className="mt-1">In Progress</Badge>
                        </div>
                      </div>
                      {currentTask.notes && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <Label className="text-gray-600 font-semibold">Progress Notes</Label>
                          <p className="text-sm mt-1">{currentTask.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-6 text-gray-500 border rounded-lg bg-gray-50">
                    No task currently in progress
                  </div>
                )}
              </div>

              {/* Queue Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Task Queue ({queuedTasks.length})
                </h3>
                {queuedTasks.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Position</TableHead>
                          <TableHead>Job Card</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Scheduled Start</TableHead>
                          <TableHead>Expected Completion</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {queuedTasks.map((task, index) => (
                          <TableRow key={task.id}>
                            <TableCell className="font-semibold">#{index + 1}</TableCell>
                            <TableCell className="font-medium text-blue-600">{task.jobCardNumber}</TableCell>
                            <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                            <TableCell className="text-sm">{formatDateTime(task.scheduledStartDate)}</TableCell>
                            <TableCell className="text-sm font-semibold">{formatDateTime(task.scheduledEndDate)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 border rounded-lg bg-gray-50">
                    No tasks in queue
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}