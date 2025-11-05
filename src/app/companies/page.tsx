"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, ArrowLeft, Search, ArrowUpDown } from "lucide-react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Company = {
  id: number
  name: string
  address: string | null
  phone: string | null
  email: string | null
  remarks: string | null
  createdAt: string
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()

  const fetchCompanies = async () => {
    setLoading(true)
    try {
      const url = searchTerm 
        ? `/api/companies?search=${encodeURIComponent(searchTerm)}&limit=100`
        : '/api/companies?limit=100'
      const res = await fetch(url)
      const data = await res.json()
      setCompanies(data)
    } catch (error) {
      console.error('Failed to fetch companies:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [searchTerm])

  const sortedCompanies = [...companies].sort((a, b) => {
    const comparison = a.name.localeCompare(b.name)
    return sortOrder === "asc" ? comparison : -comparison
  })

  const onSubmit = async (data: any) => {
    try {
      const url = editingCompany 
        ? `/api/companies?id=${editingCompany.id}`
        : '/api/companies'
      
      const res = await fetch(url, {
        method: editingCompany ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (res.ok) {
        setIsDialogOpen(false)
        reset()
        setEditingCompany(null)
        fetchCompanies()
      }
    } catch (error) {
      console.error('Failed to save company:', error)
    }
  }

  const handleEdit = (company: Company) => {
    setEditingCompany(company)
    reset(company)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this company?')) return

    try {
      const res = await fetch(`/api/companies?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchCompanies()
      }
    } catch (error) {
      console.error('Failed to delete company:', error)
    }
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingCompany(null)
    reset({})
  }

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === "asc" ? "desc" : "asc")
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
              <h1 className="text-2xl font-bold">Companies</h1>
              <p className="text-gray-600 text-sm">Manage client companies</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Companies</CardTitle>
                <CardDescription>View and manage all client companies</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingCompany(null); reset({}); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Company
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                      <DialogTitle>{editingCompany ? 'Edit Company' : 'Add New Company'}</DialogTitle>
                      <DialogDescription>
                        {editingCompany ? 'Update company information' : 'Enter company details'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="name">Company Name *</Label>
                        <Input 
                          id="name" 
                          {...register('name', { required: 'Company name is required' })}
                        />
                        {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message as string}</p>}
                      </div>
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" {...register('address')} />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" {...register('phone')} />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" {...register('email')} />
                      </div>
                      <div>
                        <Label htmlFor="remarks">Remarks</Label>
                        <Textarea id="remarks" {...register('remarks')} rows={3} placeholder="Optional remarks or notes..." />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={handleCloseDialog}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : editingCompany ? 'Update' : 'Create'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="Search companies..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={toggleSortOrder}>
                <ArrowUpDown className="w-4 h-4 mr-2" />
                Sort {sortOrder === "asc" ? "A-Z" : "Z-A"}
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : sortedCompanies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No companies found</div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedCompanies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell>{company.address || '-'}</TableCell>
                        <TableCell>{company.phone || '-'}</TableCell>
                        <TableCell>{company.email || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">{company.remarks || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(company)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(company.id)}>
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