"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Users, UserCog, TestTube, FileText, ClipboardList, Mail, BarChart3, Package } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function Dashboard() {
  const [stats, setStats] = useState({
    companies: 0,
    contactPersons: 0,
    employees: 0,
    testBeds: 0,
    activeJobs: 0,
    pendingRequests: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [companiesRes, contactsRes, employeesRes, testBedsRes, jobsRes] = await Promise.all([
          fetch('/api/companies?limit=100'),
          fetch('/api/contact-persons?limit=100'),
          fetch('/api/employees?limit=100'),
          fetch('/api/test-beds?limit=100'),
          fetch('/api/service-requests?limit=100')
        ])

        const companies = await companiesRes.json()
        const contacts = await contactsRes.json()
        const employees = await employeesRes.json()
        const testBeds = await testBedsRes.json()
        const jobs = await jobsRes.json()

        const activeJobs = jobs.filter((j: any) => 
          ['material_received', 'testing'].includes(j.status)
        ).length

        const pendingRequests = jobs.filter((j: any) => 
          j.status === 'requested'
        ).length

        setStats({
          companies: companies.length,
          contactPersons: contacts.length,
          employees: employees.length,
          testBeds: testBeds.length,
          activeJobs,
          pendingRequests
        })
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const menuItems = [
    {
      title: "Companies",
      description: "Manage client companies",
      icon: Building2,
      href: "/companies",
      color: "text-blue-600"
    },
    {
      title: "Contact Persons",
      description: "Manage company contacts",
      icon: Users,
      href: "/contact-persons",
      color: "text-green-600"
    },
    {
      title: "Employees",
      description: "Manage lab employees",
      icon: UserCog,
      href: "/employees",
      color: "text-purple-600"
    },
    {
      title: "Test Beds",
      description: "Manage testing equipment",
      icon: TestTube,
      href: "/test-beds",
      color: "text-orange-600"
    },
    {
      title: "Inventory",
      description: "Track lab equipment & assets",
      icon: Package,
      href: "/inventory",
      color: "text-cyan-600"
    },
    {
      title: "Service Request Form",
      description: "Create new service request",
      icon: FileText,
      href: "/service-request",
      color: "text-red-600"
    },
    {
      title: "Job Tracking",
      description: "Track all service requests",
      icon: ClipboardList,
      href: "/job-tracking",
      color: "text-indigo-600"
    },
    {
      title: "Email Reminders",
      description: "Send status update emails",
      icon: Mail,
      href: "/email-reminders",
      color: "text-pink-600"
    },
    {
      title: "Reports",
      description: "View analytics and reports",
      icon: BarChart3,
      href: "/reports",
      color: "text-teal-600"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ARTL Laboratory Information Management System</h1>
              <p className="text-gray-600 mt-1">Advanced Research & Testing Laboratory</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Companies</CardDescription>
              <CardTitle className="text-2xl">{loading ? "..." : stats.companies}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Contact Persons</CardDescription>
              <CardTitle className="text-2xl">{loading ? "..." : stats.contactPersons}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Employees</CardDescription>
              <CardTitle className="text-2xl">{loading ? "..." : stats.employees}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Test Beds</CardDescription>
              <CardTitle className="text-2xl">{loading ? "..." : stats.testBeds}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Jobs</CardDescription>
              <CardTitle className="text-2xl text-green-600">{loading ? "..." : stats.activeJobs}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Requests</CardDescription>
              <CardTitle className="text-2xl text-orange-600">{loading ? "..." : stats.pendingRequests}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Main Menu */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg bg-gray-100 ${item.color}`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription className="text-sm mt-1">{item.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/service-request">
                  <FileText className="w-4 h-4 mr-2" />
                  New Service Request
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/job-tracking?status=requested">
                  View Pending Requests
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/job-tracking?status=testing">
                  View Active Tests
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/email-reminders">
                  Send Reminders
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}