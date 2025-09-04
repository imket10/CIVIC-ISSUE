'use client'

import { useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  MapPin, 
  Camera, 
  Bell, 
  Search, 
  TrendingUp,
  Users,
  Clock,
  CheckCircle
} from 'lucide-react'
import Button from '../components/ui/button'

export default function HomePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user && profile) {
        // Redirect based on role
        if (profile.role === 'citizen') {
          router.push('/citizen')
        } else if (['admin', 'supervisor', 'worker', 'auditor'].includes(profile.role)) {
          router.push('/admin')
        }
      }
    }
  }, [user, profile, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (user && profile) {
    return null // Will redirect above
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Civic Platform</h1>
                <p className="text-sm text-gray-600">Report & Track Issues</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link href="/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6 text-balance">
              Make Your City
              <span className="text-blue-600"> Better</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 text-balance">
              Report civic issues, track their progress, and collaborate with your local government 
              to build a better community for everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto">
                  <Camera className="mr-2 h-5 w-5" />
                  Report an Issue
                </Button>
              </Link>
              <Link href="/public/reports">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <Search className="mr-2 h-5 w-5" />
                  View Reports
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple, fast, and effective civic engagement
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
                <Camera className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Report Issues</h3>
              <p className="text-gray-600">
                Take photos, add location, and describe civic issues in your area with just a few taps.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Track Progress</h3>
              <p className="text-gray-600">
                Get real-time updates on your reports and see when issues are being addressed.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-200 transition-colors">
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">See Results</h3>
              <p className="text-gray-600">
                Watch your community improve as issues get resolved and infrastructure gets better.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Making a Difference</h2>
            <p className="text-xl text-blue-100">
              Join thousands of citizens working to improve their communities
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">5,847</div>
              <div className="text-blue-100">Issues Reported</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">4,231</div>
              <div className="text-blue-100">Issues Resolved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">1,293</div>
              <div className="text-blue-100">Active Citizens</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">72h</div>
              <div className="text-blue-100">Avg Resolution</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Start reporting issues in your area and help build a better community.
          </p>
          <Link href="/auth/register">
            <Button size="lg">
              Join Civic Platform
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">Civic Platform</span>
            </div>
            <div className="text-gray-400">
              © 2025 Civic Platform. Making cities better, together.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}