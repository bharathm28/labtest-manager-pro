"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Pie, PieChart, Cell } from "recharts"

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    requested: 0,
    replied: 0,
    srfFilled: 0,
    agreed: 0,
    materialReceived: 0,
    testing: 0,
    completed: 0,
    reported: 0
  })
  const [jobs, setJobs] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const [jobsRes, companiesRes] = await Promise.all([
          fetch('/api/service-requests?limit=100'),
          fetch('/api/companies?limit=100')
        ])

        const jobsData = await jobsRes.json()
        const companiesData = await companiesRes.json()

        setJobs(jobsData)
        setCompanies(companiesData)

        // Calculate statistics
        const statusCounts = {
          total: jobsData.length,
          requested: 0,
          replied: 0,
          srfFilled: 0,
          agreed: 0,
          materialReceived: 0,
          testing: 0,
          completed: 0,
          reported: 0
        }

        jobsData.forEach((job: any) => {
          switch (job.status) {
            case 'requested':
              statusCounts.requested++
              break
            case 'replied':
              statusCounts.replied++
              break
            case 'srf_filled':
              statusCounts.srfFilled++
              break
            case 'agreed':
              statusCounts.agreed++
              break
            case 'material_received':
              statusCounts.materialReceived++
              break
            case 'testing':
              statusCounts.testing++
              break
            case 'completed':
              statusCounts.completed++
              break
            case 'reported':
              statusCounts.reported++
              break
          }
        })

        setStats(statusCounts)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const statusChartData = [
    { name: 'Requested', value: stats.requested, color: '#94a3b8' },
    { name: 'Replied', value: stats.replied, color: '#60a5fa' },
    { name: 'SRF Filled', value: stats.srfFilled, color: '#a78bfa' },
    { name: 'Agreed', value: stats.agreed, color: '#34d399' },
    { name: 'Material Received', value: stats.materialReceived, color: '#fbbf24' },
    { name: 'Testing', value: stats.testing, color: '#f87171' },
    { name: 'Completed', value: stats.completed, color: '#10b981' },
    { name: 'Reported', value: stats.reported, color: '#6366f1' }
  ].filter(item => item.value > 0)

  const workflowData = [
    { stage: 'Requested', count: stats.requested },
    { stage: 'Replied', count: stats.replied },
    { stage: 'SRF Filled', count: stats.srfFilled },
    { stage: 'Agreed', count: stats.agreed },
    { stage: 'Material Received', count: stats.materialReceived },
    { stage: 'Testing', count: stats.testing },
    { stage: 'Completed', count: stats.completed },
    { stage: 'Reported', count: stats.reported }
  ]

  const companyJobCounts = companies.map(company => {
    const jobCount = jobs.filter(job => job.companyId === company.id).length
    return {
      name: company.name.length > 20 ? company.name.substring(0, 20) + '...' : company.name,
      jobs: jobCount
    }
  }).filter(item => item.jobs > 0).sort((a, b) => b.jobs - a.jobs).slice(0, 10)

  const activeJobsCount = stats.materialReceived + stats.testing
  const completionRate = stats.total > 0 ? ((stats.completed + stats.reported) / stats.total * 100).toFixed(1) : 0
  const pendingCount = stats.requested + stats.replied + stats.srfFilled

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
              <h1 className="text-2xl font-bold">Reports & Analytics</h1>
              <p className="text-gray-600 text-sm">View laboratory performance metrics and statistics</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Total Jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-xs text-gray-600 mt-1">All service requests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Active Jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{activeJobsCount}</div>
              <p className="text-xs text-gray-600 mt-1">Currently in testing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Completion Rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{completionRate}%</div>
              <p className="text-xs text-gray-600 mt-1">{stats.completed + stats.reported} jobs completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Pending
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{pendingCount}</div>
              <p className="text-xs text-gray-600 mt-1">Awaiting action</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Workflow Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow Progress</CardTitle>
              <CardDescription>Jobs by workflow stage</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={workflowData}>
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
              <CardDescription>Current job status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Companies */}
        <Card>
          <CardHeader>
            <CardTitle>Top Companies by Job Volume</CardTitle>
            <CardDescription>Companies with most service requests</CardDescription>
          </CardHeader>
          <CardContent>
            {companyJobCounts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={companyJobCounts} layout="vertical">
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={150}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar dataKey="jobs" fill="#10b981" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Breakdown Table */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Detailed Status Breakdown</CardTitle>
            <CardDescription>Complete overview of all job statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Requested</span>
                    <span className="text-2xl font-bold">{stats.requested}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gray-500 h-2 rounded-full" 
                      style={{ width: `${stats.total > 0 ? (stats.requested / stats.total * 100) : 0}%` }}
                    />
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Replied</span>
                    <span className="text-2xl font-bold">{stats.replied}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${stats.total > 0 ? (stats.replied / stats.total * 100) : 0}%` }}
                    />
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">SRF Filled</span>
                    <span className="text-2xl font-bold">{stats.srfFilled}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{ width: `${stats.total > 0 ? (stats.srfFilled / stats.total * 100) : 0}%` }}
                    />
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Agreed</span>
                    <span className="text-2xl font-bold">{stats.agreed}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${stats.total > 0 ? (stats.agreed / stats.total * 100) : 0}%` }}
                    />
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Material Received</span>
                    <span className="text-2xl font-bold">{stats.materialReceived}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${stats.total > 0 ? (stats.materialReceived / stats.total * 100) : 0}%` }}
                    />
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Testing</span>
                    <span className="text-2xl font-bold">{stats.testing}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${stats.total > 0 ? (stats.testing / stats.total * 100) : 0}%` }}
                    />
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Completed</span>
                    <span className="text-2xl font-bold">{stats.completed}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${stats.total > 0 ? (stats.completed / stats.total * 100) : 0}%` }}
                    />
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Reported</span>
                    <span className="text-2xl font-bold">{stats.reported}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full" 
                      style={{ width: `${stats.total > 0 ? (stats.reported / stats.total * 100) : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
