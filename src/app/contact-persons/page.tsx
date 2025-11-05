"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Pencil, Trash2, ArrowLeft, Search, ArrowUpDown } from "lucide-react"
import Link from "next/link"
import { useForm, Controller } from "react-hook-form"

type ContactPerson = {
  id: number
  companyId: number
  name: string
  designation: string | null
  phone: string | null
  email: string
  createdAt: string
}

type Company = {
  id: number
  name: string
}

export default function ContactPersonsPage() {
  const [contacts, setContacts] = useState<ContactPerson[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "company" | "designation">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<ContactPerson | null>(null)

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm()

  const fetchContacts = async () => {
    setLoading(true)
    try {
      const url = searchTerm 
        ? `/api/contact-persons?search=${encodeURIComponent(searchTerm)}&limit=100`
        : '/api/contact-persons?limit=100'
      const res = await fetch(url)
      const data = await res.json()
      setContacts(data)
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/companies?limit=100')
      const data = await res.json()
      setCompanies(data)
    } catch (error) {
      console.error('Failed to fetch companies:', error)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    fetchContacts()
  }, [searchTerm])

  const getCompanyName = (companyId: number) => {
    return companies.find(c => c.id === companyId)?.name || 'Unknown'
  }

  const sortedContacts = [...contacts].sort((a, b) => {
    let comparison = 0
    if (sortBy === "name") {
      comparison = a.name.localeCompare(b.name)
    } else if (sortBy === "company") {
      const aCompany = getCompanyName(a.companyId)
      const bCompany = getCompanyName(b.companyId)
      comparison = aCompany.localeCompare(bCompany)
    } else if (sortBy === "designation") {
      const aDesig = a.designation || ""
      const bDesig = b.designation || ""
      comparison = aDesig.localeCompare(bDesig)
    }
    return sortOrder === "asc" ? comparison : -comparison
  })

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        companyId: parseInt(data.companyId)
      }

      const url = editingContact 
        ? `/api/contact-persons?id=${editingContact.id}`
        : '/api/contact-persons'
      
      const res = await fetch(url, {
        method: editingContact ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setIsDialogOpen(false)
        reset()
        setEditingContact(null)
        fetchContacts()
      }
    } catch (error) {
      console.error('Failed to save contact:', error)
    }
  }

  const handleEdit = (contact: ContactPerson) => {
    setEditingContact(contact)
    reset({
      ...contact,
      companyId: contact.companyId.toString()
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this contact person?')) return

    try {
      const res = await fetch(`/api/contact-persons?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchContacts()
      }
    } catch (error) {
      console.error('Failed to delete contact:', error)
    }
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
              <h1 className="text-2xl font-bold">Contact Persons</h1>
              <p className="text-gray-600 text-sm">Manage company contact persons</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Contact Persons</CardTitle>
                <CardDescription>View and manage all company contacts</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingContact(null); reset({}); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Contact Person
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                      <DialogTitle>{editingContact ? 'Edit Contact Person' : 'Add New Contact Person'}</DialogTitle>
                      <DialogDescription>
                        {editingContact ? 'Update contact information' : 'Enter contact details'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="companyId">Company *</Label>
                        <Controller
                          name="companyId"
                          control={control}
                          rules={{ required: 'Company is required' }}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select company" />
                              </SelectTrigger>
                              <SelectContent>
                                {companies.map((company) => (
                                  <SelectItem key={company.id} value={company.id.toString()}>
                                    {company.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.companyId && <p className="text-sm text-red-600 mt-1">{errors.companyId.message as string}</p>}
                      </div>
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input 
                          id="name" 
                          {...register('name', { required: 'Name is required' })}
                        />
                        {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message as string}</p>}
                      </div>
                      <div>
                        <Label htmlFor="designation">Designation</Label>
                        <Input id="designation" {...register('designation')} />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" {...register('phone')} />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          {...register('email', { required: 'Email is required' })}
                        />
                        {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message as string}</p>}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : editingContact ? 'Update' : 'Create'}
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
                  placeholder="Search contacts..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={(val: "name" | "company" | "designation") => setSortBy(val)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Sort by Name</SelectItem>
                  <SelectItem value="company">Sort by Company</SelectItem>
                  <SelectItem value="designation">Sort by Designation</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={toggleSortOrder}>
                <ArrowUpDown className="w-4 h-4 mr-2" />
                {sortOrder === "asc" ? "A-Z" : "Z-A"}
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : sortedContacts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No contact persons found</div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedContacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">{contact.name}</TableCell>
                        <TableCell>{getCompanyName(contact.companyId)}</TableCell>
                        <TableCell>{contact.designation || '-'}</TableCell>
                        <TableCell>{contact.phone || '-'}</TableCell>
                        <TableCell>{contact.email}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(contact)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(contact.id)}>
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