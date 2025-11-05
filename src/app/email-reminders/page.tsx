"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Mail, Send, Loader2, X } from "lucide-react"
import Link from "next/link"
import { useForm, Controller } from "react-hook-form"

type ServiceRequest = {
  id: number
  jobCardNumber: string
  companyId: number
  contactPersonId: number | null
  productName: string
  status: string
  assignedEmployeeId: number | null
  createdAt: string
}

export default function EmailRemindersPage() {
  const [jobs, setJobs] = useState<ServiceRequest[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [contactPersons, setContactPersons] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJobs, setSelectedJobs] = useState<number[]>([])
  const [isSending, setIsSending] = useState(false)
  const [ccEmails, setCcEmails] = useState<string[]>([])
  const [ccInput, setCcInput] = useState("")

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      emailType: "status_update",
      subject: "",
      message: ""
    }
  })

  const emailType = watch("emailType")

  const emailTemplates = {
    status_update: {
      subject: "Status Update - Job Card #{jobCardNumber}",
      message: "Dear Customer,\n\nWe would like to inform you about the status update of your testing service request.\n\nJob Card Number: {jobCardNumber}\nProduct: {productName}\nCurrent Status: {status}\n\nFor any queries, please feel free to contact us.\n\nBest regards,\nARTL Testing Laboratory"
    },
    material_request: {
      subject: "Material Dispatch Required - Job Card #{jobCardNumber}",
      message: "Dear Customer,\n\nYour service request has been approved. Please arrange to dispatch the testing materials to our laboratory.\n\nJob Card Number: {jobCardNumber}\nProduct: {productName}\n\nPlease ensure proper packaging and include the DC (Delivery Challan) with the shipment.\n\nBest regards,\nARTL Testing Laboratory"
    },
    testing_completed: {
      subject: "Testing Completed - Job Card #{jobCardNumber}",
      message: "Dear Customer,\n\nWe are pleased to inform you that the testing has been completed for your service request.\n\nJob Card Number: {jobCardNumber}\nProduct: {productName}\n\nThe test report will be sent to you shortly. Your materials are ready for collection.\n\nBest regards,\nARTL Testing Laboratory"
    },
    report_ready: {
      subject: "Test Report Ready - Job Card #{jobCardNumber}",
      message: "Dear Customer,\n\nThe test report for your service request is now ready.\n\nJob Card Number: {jobCardNumber}\nProduct: {productName}\n\nYou can collect the report and materials from our facility during business hours.\n\nBest regards,\nARTL Testing Laboratory"
    },
    follow_up: {
      subject: "Follow-up - Job Card #{jobCardNumber}",
      message: "Dear Customer,\n\nThis is a follow-up regarding your testing service request.\n\nJob Card Number: {jobCardNumber}\nProduct: {productName}\nCurrent Status: {status}\n\nPlease let us know if you need any assistance or have any queries.\n\nBest regards,\nARTL Testing Laboratory"
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const [jobsRes, companiesRes, contactsRes, employeesRes] = await Promise.all([
          fetch('/api/service-requests?limit=100'),
          fetch('/api/companies?limit=100'),
          fetch('/api/contact-persons?limit=100'),
          fetch('/api/employees?limit=100')
        ])

        const jobsData = await jobsRes.json()
        const companiesData = await companiesRes.json()
        const contactsData = await contactsRes.json()
        const employeesData = await employeesRes.json()

        setJobs(jobsData)
        setCompanies(companiesData)
        setContactPersons(contactsData)
        setEmployees(employeesData)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (emailType && emailTemplates[emailType as keyof typeof emailTemplates]) {
      const template = emailTemplates[emailType as keyof typeof emailTemplates]
      setValue("subject", template.subject)
      setValue("message", template.message)
    }
  }, [emailType, setValue])

  // Auto-populate CC with testing team when jobs are selected
  useEffect(() => {
    const testingTeamEmails: string[] = []
    const selectedJobsData = jobs.filter(j => selectedJobs.includes(j.id))
    
    selectedJobsData.forEach(job => {
      if (job.assignedEmployeeId) {
        const employee = employees.find(e => e.id === job.assignedEmployeeId)
        if (employee && employee.email && !testingTeamEmails.includes(employee.email)) {
          testingTeamEmails.push(employee.email)
        }
      }
    })

    setCcEmails(testingTeamEmails)
  }, [selectedJobs, jobs, employees])

  const handleSelectJob = (jobId: number) => {
    setSelectedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    )
  }

  const handleSelectAll = () => {
    if (selectedJobs.length === jobs.length) {
      setSelectedJobs([])
    } else {
      setSelectedJobs(jobs.map(j => j.id))
    }
  }

  const handleAddCc = () => {
    const email = ccInput.trim()
    if (email && email.includes('@') && !ccEmails.includes(email)) {
      setCcEmails([...ccEmails, email])
      setCcInput("")
    }
  }

  const handleRemoveCc = (email: string) => {
    setCcEmails(ccEmails.filter(e => e !== email))
  }

  const getCompanyName = (companyId: number) => {
    return companies.find(c => c.id === companyId)?.name || 'Unknown'
  }

  const getContactEmail = (jobContactId: number | null) => {
    if (!jobContactId) return null
    const contact = contactPersons.find(c => c.id === jobContactId)
    return contact ? contact.email : null
  }

  const getContactName = (jobContactId: number | null) => {
    if (!jobContactId) return 'No Contact'
    const contact = contactPersons.find(c => c.id === jobContactId)
    return contact ? contact.name : 'Unknown Contact'
  }

  const getToRecipients = () => {
    const selectedJobsData = jobs.filter(j => selectedJobs.includes(j.id))
    const toEmails: Array<{email: string, name: string, company: string}> = []
    
    selectedJobsData.forEach(job => {
      const email = getContactEmail(job.contactPersonId)
      if (email) {
        toEmails.push({
          email,
          name: getContactName(job.contactPersonId),
          company: getCompanyName(job.companyId)
        })
      }
    })
    
    return toEmails
  }

  const onSubmit = async (data: any) => {
    if (selectedJobs.length === 0) {
      alert('Please select at least one job to send email')
      return
    }

    setIsSending(true)

    try {
      const toRecipients = getToRecipients()
      
      // Simulate sending emails
      await new Promise(resolve => setTimeout(resolve, 2000))

      alert(`Email reminders sent successfully!
      
Subject: ${data.subject}

To: ${toRecipients.map(r => `${r.name} (${r.email})`).join(', ')}

CC: ${ccEmails.length > 0 ? ccEmails.join(', ') : 'None'}

Recipients: ${selectedJobs.length} job(s)

Note: This is a demo. In production, actual emails would be sent via email service provider (e.g., SendGrid, AWS SES, etc.)`)
      
      setSelectedJobs([])
      setCcEmails([])
    } catch (error) {
      console.error('Failed to send emails:', error)
      alert('Failed to send email reminders')
    } finally {
      setIsSending(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      requested: "secondary",
      replied: "default",
      srf_filled: "default",
      agreed: "default",
      material_received: "default",
      testing: "default",
      completed: "default",
      reported: "default"
    }
    return <Badge variant={variants[status] || "secondary"}>{status.replace(/_/g, ' ')}</Badge>
  }

  const toRecipients = getToRecipients()

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
              <h1 className="text-2xl font-bold">Email Reminders</h1>
              <p className="text-gray-600 text-sm">Send customized email reminders to customers</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Template Section */}
          <Card>
            <CardHeader>
              <CardTitle>Email Template</CardTitle>
              <CardDescription>Choose a template and customize your message</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="emailType">Email Type</Label>
                  <Controller
                    name="emailType"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="status_update">Status Update</SelectItem>
                          <SelectItem value="material_request">Material Dispatch Request</SelectItem>
                          <SelectItem value="testing_completed">Testing Completed</SelectItem>
                          <SelectItem value="report_ready">Report Ready</SelectItem>
                          <SelectItem value="follow_up">Follow-up</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* To Recipients */}
                <div>
                  <Label>To (Primary Recipients)</Label>
                  <div className="mt-2 p-3 border rounded-lg bg-gray-50 min-h-[60px]">
                    {toRecipients.length === 0 ? (
                      <p className="text-sm text-gray-500">Select jobs to see recipients</p>
                    ) : (
                      <div className="space-y-1">
                        {toRecipients.map((recipient, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{recipient.name}</span>
                            <span className="text-gray-600"> ({recipient.email})</span>
                            <span className="text-gray-500 text-xs"> - {recipient.company}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* CC Recipients */}
                <div>
                  <Label>CC (Testing Team & Additional)</Label>
                  <div className="mt-2 space-y-2">
                    {ccEmails.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-blue-50">
                        {ccEmails.map((email, index) => (
                          <div key={index} className="flex items-center gap-1 bg-white px-2 py-1 rounded border text-sm">
                            <span>{email}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCc(email)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        value={ccInput}
                        onChange={(e) => setCcInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddCc()
                          }
                        }}
                        placeholder="Add CC email address..."
                        type="email"
                      />
                      <Button type="button" variant="outline" onClick={handleAddCc}>
                        Add
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Testing team members are automatically added to CC. You can add or remove as needed.
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input 
                    id="subject"
                    {...register('subject', { required: 'Subject is required' })}
                  />
                  {errors.subject && <p className="text-sm text-red-600 mt-1">{errors.subject.message as string}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    Use placeholders: {"{jobCardNumber}"}, {"{productName}"}, {"{status}"}
                  </p>
                </div>

                <div>
                  <Label htmlFor="message">Email Message</Label>
                  <Textarea 
                    id="message"
                    {...register('message', { required: 'Message is required' })}
                    rows={8}
                  />
                  {errors.message && <p className="text-sm text-red-600 mt-1">{errors.message.message as string}</p>}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900">Email Summary</p>
                      <p className="text-sm text-blue-700">
                        To: {toRecipients.length} recipient(s)
                      </p>
                      <p className="text-sm text-blue-700">
                        CC: {ccEmails.length} recipient(s)
                      </p>
                      <p className="text-sm text-blue-700">
                        Jobs: {selectedJobs.length} selected
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSending || selectedJobs.length === 0}
                  className="w-full"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Email Reminders
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Job Selection Section */}
          <Card>
            <CardHeader>
              <CardTitle>Select Recipients</CardTitle>
              <CardDescription>Choose which jobs to send reminders for</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-500 mx-auto" />
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No jobs found</div>
              ) : (
                <>
                  <div className="mb-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      {selectedJobs.length === jobs.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                  <div className="border rounded-lg max-h-[600px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Job Card</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jobs.map((job) => (
                          <TableRow key={job.id}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedJobs.includes(job.id)}
                                onChange={() => handleSelectJob(job.id)}
                                className="w-4 h-4 cursor-pointer"
                              />
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {job.jobCardNumber}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{getCompanyName(job.companyId)}</p>
                                <p className="text-xs text-gray-500">{job.productName}</p>
                                <p className="text-xs text-gray-500">
                                  Contact: {getContactName(job.contactPersonId)}
                                </p>
                                {getContactEmail(job.contactPersonId) && (
                                  <p className="text-xs text-blue-600">{getContactEmail(job.contactPersonId)}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(job.status)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}