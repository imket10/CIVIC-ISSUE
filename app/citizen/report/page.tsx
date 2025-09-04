'use client'

import { useState, useRef } from 'react'
import { useAuth } from '../../../lib/auth'
import { useRouter } from 'next/navigation'
import { useCategories, useGeolocation } from '../../../lib/hooks'
import { supabase } from '../../../lib/supabase'
import { 
  Camera, 
  MapPin, 
  Upload,
  ArrowLeft,
  AlertTriangle,
  X,
  Image as ImageIcon,
  Loader2
} from 'lucide-react'
import Button from '../../../components/ui/button'
import Input from '../../../components/ui/input'
import Textarea from '../../../components/ui/textarea'

export default function ReportIssuePage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const { categories } = useCategories()
  const { location, error: locationError, getCurrentLocation } = useGeolocation()
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    subcategory: '',
    urgent: false,
    tags: [] as string[],
    address: ''
  })
  
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  if (profile?.role !== 'citizen') {
    router.push('/')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedLocation) return

    setLoading(true)
    setError('')

    try {
      // Get current location if not selected
      let reportLocation = selectedLocation
      if (!reportLocation && location) {
        reportLocation = {
          lat: location.coords.latitude,
          lng: location.coords.longitude
        }
      }

      if (!reportLocation) {
        setError('Please set location for the report')
        setLoading(false)
        return
      }

      // Upload files first
      const mediaUrls: string[] = []
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('report-media')
          .upload(fileName, file)

        if (uploadError) throw uploadError
        mediaUrls.push(fileName)
      }

      // Create the report
      const reportData = {
        citizen_id: user.id,
        title: formData.title,
        description: formData.description,
        category_id: parseInt(formData.categoryId),
        subcategory: formData.subcategory || null,
        location: `POINT(${reportLocation.lng} ${reportLocation.lat})`,
        address: formData.address || null,
        urgent: formData.urgent,
        tags: formData.tags,
        status: 'new',
        priority_score: formData.urgent ? 50 : 30,
        meta: {
          device_info: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        }
      }

      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert(reportData)
        .select()
        .single()

      if (reportError) throw reportError

      // Create media records
      if (mediaUrls.length > 0) {
        const mediaRecords = mediaUrls.map(url => ({
          report_id: report.id,
          type: 'image',
          file_name: url.split('/').pop()!,
          file_path: url,
          file_size: selectedFiles[mediaUrls.indexOf(url)]?.size || 0,
          mime_type: selectedFiles[mediaUrls.indexOf(url)]?.type || 'image/jpeg'
        }))

        const { error: mediaError } = await supabase
          .from('media')
          .insert(mediaRecords)

        if (mediaError) throw mediaError
      }

      // Calculate SLA due date
      const category = categories.find(c => c.id === parseInt(formData.categoryId))
      const slaHours = category?.sla_hours || 72
      const slaDueAt = new Date(Date.now() + (slaHours * 60 * 60 * 1000))

      // Update with SLA and route to department
      await supabase
        .from('reports')
        .update({
          sla_due_at: slaDueAt.toISOString(),
          department_id: category?.department_id,
          status: 'acknowledged'
        })
        .eq('id', report.id)

      // Log activity
      await supabase
        .from('activity_log')
        .insert({
          report_id: report.id,
          actor_id: user.id,
          action: 'created',
          payload: { category: category?.name }
        })

      setSuccess(true)
      setTimeout(() => {
        router.push('/citizen')
      }, 2000)

    } catch (err) {
      console.error('Error creating report:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit report')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const maxFiles = 5
    const maxSize = 10 * 1024 * 1024 // 10MB

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError('Please select image files only')
        return false
      }
      if (file.size > maxSize) {
        setError('File size must be less than 10MB')
        return false
      }
      return true
    })

    if (selectedFiles.length + validFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`)
      return
    }

    setSelectedFiles(prev => [...prev, ...validFiles])
    
    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleLocationClick = () => {
    if (!location) {
      getCurrentLocation()
    } else {
      setSelectedLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude
      })
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Report Submitted!</h2>
          <p className="text-gray-600 mb-4">
            Your report has been successfully submitted and will be reviewed by the relevant department.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Report Issue</h1>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Photo Upload */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Photos</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                  <img 
                    src={preview} 
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              
              {selectedFiles.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <ImageIcon size={24} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Add Photo</span>
                </button>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <p className="text-xs text-gray-500">
              Add up to 5 photos (max 10MB each). Photos help resolve issues faster.
            </p>
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Issue Details</h2>
            
            <div className="space-y-4">
              <Input
                label="Issue Title"
                placeholder="Brief description of the issue"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <Textarea
                label="Description"
                placeholder="Provide more details about the issue"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                required
              />

              <Input
                label="Subcategory (Optional)"
                placeholder="e.g., Large pothole, Broken bulb, etc."
                value={formData.subcategory}
                onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
              />
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
            
            <div className="space-y-4">
              <Button
                type="button"
                onClick={handleLocationClick}
                variant="outline"
                className="w-full"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {selectedLocation 
                  ? `Location Set (${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)})`
                  : location 
                    ? 'Use Current Location'
                    : 'Get Location'
                }
              </Button>

              {locationError && (
                <p className="text-sm text-red-600">{locationError}</p>
              )}

              <Input
                label="Address (Optional)"
                placeholder="Street address or landmark"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
          </div>

          {/* Priority & Tags */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Options</h2>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.urgent}
                  onChange={(e) => setFormData(prev => ({ ...prev, urgent: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900">Mark as Urgent</span>
                  <p className="text-sm text-gray-600">
                    Use only for safety hazards or emergencies
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="sticky bottom-0 bg-white border-t p-4 -mx-4">
            <Button
              type="submit"
              loading={loading}
              disabled={!formData.title || !formData.description || !formData.categoryId}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting Report...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Report
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}