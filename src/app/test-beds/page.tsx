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
import { Plus, Pencil, Trash2, ArrowLeft, Search } from "lucide-react"
import Link from "next/link"
import { useForm, Controller } from "react-hook-form"

type TestBed = {
  id: number
  name: string
  description: string | null
  location: string | null
  status: string
  createdAt: string
}

export default function TestBedsPage() {
  const [testBeds, setTestBeds] = useState<TestBed[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTestBed, setEditingTestBed] = useState<TestBed | null>(null)

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm()

  const fetchTestBeds = async () => {
    setLoading(true)
    try {
      const url = searchTerm 
        ? `/api/test-beds?search=${encodeURIComponent(searchTerm)}&limit=100`
        : '/api/test-beds?limit=100'
      const res = await fetch(url)
      const data = await res.json()
      setTestBeds(data)
    } catch (error) {
      console.error('Failed to fetch test beds:', error)
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
        setIsDialogOpen(false)
        reset()
        setEditingTestBed(null)
        fetchTestBeds()
      }
    } catch (error) {
      console.error('Failed to save test bed:', error)
    }
  }

  const handleEdit = (testBed: TestBed) => {
    setEditingTestBed(testBed)
    reset(testBed)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this test bed?')) return

    try {
      const res = await fetch(`/api/test-beds?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchTestBeds()
      }
    } catch (error) {
      console.error('Failed to delete test bed:', error)
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
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
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
    </div>
  )
}
