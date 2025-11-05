"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, FileText, Loader2 } from "lucide-react"
import Link from "next/link"
import { useForm, Controller } from "react-hook-form"
import { useRouter } from "next/navigation"

type Company = {
  id: number
  name: string
}

type ContactPerson = {
  id: number
  companyId: number
  name: string
  email: string
}

export default function ServiceRequestPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([])
  const [filteredContacts, setFilteredContacts] = useState<ContactPerson[]>([])
  const [jobCardNumber, setJobCardNumber] = useState("")
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const { register, handleSubmit, control, watch, reset, formState: { errors, isSubmitting } } = useForm()

  const selectedCompanyId = watch("companyId")

  useEffect(() => {
    async function fetchData() {
      try {
        const [companiesRes, contactsRes, jobCardRes] = await Promise.all([
          fetch('/api/companies?limit=100'),
          fetch('/api/contact-persons?limit=100'),
          fetch('/api/job-card-next')
        ])

        const companiesData = await companiesRes.json()
        const contactsData = await contactsRes.json()
        const jobCardData = await jobCardRes.json()

        setCompanies(companiesData)
        setContactPersons(contactsData)
        setJobCardNumber(jobCardData.nextJobCardNumber)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (selectedCompanyId) {
      const filtered = contactPersons.filter(c => c.companyId === parseInt(selectedCompanyId))
      setFilteredContacts(filtered)
    } else {
      setFilteredContacts([])
    }
  }, [selectedCompanyId, contactPersons])

  const onSubmit = async (data: any) => {
    try {
      const now = new Date().toISOString()
      
      const payload = {
        jobCardNumber,
        companyId: parseInt(data.companyId),
        contactPersonId: data.contactPersonId ? parseInt(data.contactPersonId) : null,
        productName: data.productName,
        productDescription: data.productDescription,
        quantity: data.quantity ? parseInt(data.quantity) : null,
        testType: data.testType,
        specialRequirements: data.specialRequirements,
        status: 'requested',
        requestedDate: now,
        notes: data.notes
      }

      const res = await fetch('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const createdJob = await res.json()
        
        // Create initial status history
        await fetch('/api/status-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceRequestId: createdJob.id,
            status: 'requested',
            notes: 'Service request created',
            changedBy: 'System'
          })
        })

        alert(`Service Request created successfully! Job Card Number: ${jobCardNumber}`)
        reset()
        
        // Fetch new job card number
        const jobCardRes = await fetch('/api/job-card-next')
        const jobCardData = await jobCardRes.json()
        setJobCardNumber(jobCardData.nextJobCardNumber)
        
        router.push('/job-tracking')
      } else {
        const error = await res.json()
        alert(`Failed to create service request: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to submit:', error)
      alert('Failed to create service request')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    )
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
              <h1 className="text-2xl font-bold">Service Request Form (SRF)</h1>
              <p className="text-gray-600 text-sm">Create a new service request for testing</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>New Service Request</CardTitle>
                <CardDescription>Fill in the details for the testing service request</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Job Card Number</p>
                <p className="text-lg font-bold text-blue-600">{jobCardNumber}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Company and Contact Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Company Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="contactPersonId">Contact Person</Label>
                    <Controller
                      name="contactPersonId"
                      control={control}
                      render={({ field }) => (
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!selectedCompanyId || filteredContacts.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={filteredContacts.length === 0 ? "Select company first" : "Select contact person"} />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredContacts.map((contact) => (
                              <SelectItem key={contact.id} value={contact.id.toString()}>
                                {contact.name} ({contact.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Product Details</h3>
                
                <div>
                  <Label htmlFor="productName">Product Name *</Label>
                  <Input 
                    id="productName" 
                    placeholder="Enter product name"
                    {...register('productName', { required: 'Product name is required' })}
                  />
                  {errors.productName && <p className="text-sm text-red-600 mt-1">{errors.productName.message as string}</p>}
                </div>

                <div>
                  <Label htmlFor="productDescription">Product Description</Label>
                  <Textarea 
                    id="productDescription" 
                    placeholder="Detailed description of the product"
                    {...register('productDescription')}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input 
                      id="quantity" 
                      type="number"
                      min="1"
                      placeholder="Number of units"
                      {...register('quantity')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="testType">Test Type</Label>
                    <Input 
                      id="testType" 
                      placeholder="e.g., EMC/EMI Testing"
                      {...register('testType')}
                    />
                  </div>
                </div>
              </div>

              {/* Testing Requirements */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Testing Requirements</h3>
                
                <div>
                  <Label htmlFor="specialRequirements">Special Requirements</Label>
                  <Textarea 
                    id="specialRequirements" 
                    placeholder="Any special testing requirements, standards, or specifications"
                    {...register('specialRequirements')}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Any additional information or comments"
                    {...register('notes')}
                    rows={2}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Create Service Request
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push('/')}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
