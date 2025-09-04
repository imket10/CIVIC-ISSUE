'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/auth'
import { useRouter } from 'next/navigation'
import { useReports } from '../../lib/hooks'
import Link from 'next/link'
import { 
  Plus, 
  MapPin, 
  Bell, 
  User, 
  Filter,
  Search,
  Camera,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react'
import Button from '../../components/ui/button'
import { StatusColors, formatRelativeTime, getStatusIcon } from '../../lib/utils'

export default function CitizenDashboard() {
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const { reports, loading: reportsLoading, refetch } = useReports(user?.id, profile?.role)
  
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== 'citizen')) {
      router.push('/')
    }
  }, [user, profile, authLoading, router])

  if (authLoading || reportsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || profile?.role !== 'citizen') {
    return null
  }

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true
    if (filter === 'active') return !['resolved', 'rejected'].includes(report.status)
    if (filter === 'resolved') return report.status === 'resolved'
    return report.status === filter
  })

  const stats = {
    total: reports.length,
    new: reports.filter(r => r.status === 'new').length,
    inProgress: reports.filter(r => ['acknowledged', 'in_progress'].includes(r.status)).length,
    resolved: reports.filter(r => r.status === 'resolved').length
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Welcome back, {profile.display_name?.split(' ')[0]}
              </h1>
              <p className="text-sm text-gray-600">Track your civic reports</p>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Bell size={20} className="text-gray-600" />
              </button>
              <button 
                onClick={() => signOut()}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Settings size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 max-w-4xl mx-auto">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Camera className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-orange-600">{stats.inProgress}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New</p>
                <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/citizen/report">
              <div className="bg-blue-600 rounded-xl p-6 text-white hover:bg-blue-700 transition-colors group">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold mb-2">Report New Issue</h3>
                    <p className="text-blue-100">Take a photo and report a civic issue</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <Plus className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/citizen/map">
              <div className="bg-green-600 rounded-xl p-6 text-white hover:bg-green-700 transition-colors group">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold mb-2">View Map</h3>
                    <p className="text-green-100">See all reports in your area</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <MapPin className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Your Reports</h2>
              <div className="flex space-x-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Reports</option>
                  <option value="active">Active</option>
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
          </div>

          <div className="divide-y">
            {filteredReports.length === 0 ? (
              <div className="p-8 text-center">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No reports yet</h3>
                <p className="text-gray-600 mb-4">Start by reporting your first civic issue</p>
                <Link href="/citizen/report">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Report Issue
                  </Button>
                </Link>
              </div>
            ) : (
              filteredReports.map((report) => (
                <Link
                  key={report.id}
                  href={`/citizen/reports/${report.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{report.category?.icon || '📋'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {report.title}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${StatusColors[report.status]}`}>
                          {getStatusIcon(report.status)} {report.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {report.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{report.category?.name}</span>
                        <span>{formatRelativeTime(report.created_at)}</span>
                        {report.address && <span className="truncate">{report.address}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <Link
        href="/citizen/report"
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-blue-700 transition-colors z-50"
      >
        <Plus size={24} />
      </Link>
    </div>
  )
}