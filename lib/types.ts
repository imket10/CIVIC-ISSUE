export interface Department {
  id: number
  name: string
  email: string | null
  sla_hours: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  role: 'citizen' | 'admin' | 'supervisor' | 'worker' | 'auditor'
  email: string | null
  phone: string | null
  password_hash: string | null
  display_name: string | null
  avatar_url: string | null
  department_id: number | null
  created_at: string
  updated_at: string
  last_login_at: string | null
  active: boolean
  department?: Department
}

export interface Category {
  id: number
  name: string
  department_id: number | null
  priority_base: number
  sla_hours: number | null
  icon: string | null
  color: string
  active: boolean
  created_at: string
  department?: Department
}

export interface Report {
  id: number
  citizen_id: string
  source: string
  category_id: number | null
  subcategory: string | null
  title: string
  description: string
  status: 'new' | 'acknowledged' | 'in_progress' | 'on_hold' | 'resolved' | 'rejected' | 'duplicate'
  location: {
    type: 'Point'
    coordinates: [number, number]
  } | null
  address: string | null
  ward: string | null
  created_at: string
  updated_at: string
  priority_score: number
  department_id: number | null
  assignee_id: string | null
  sla_due_at: string | null
  closed_at: string | null
  tags: string[]
  duplicate_of: number | null
  device_info: any
  meta: any
  urgent: boolean
  citizen?: User
  category?: Category
  department?: Department
  assignee?: User
  media?: Media[]
  comments?: Comment[]
}

export interface Media {
  id: number
  report_id: number
  type: 'image' | 'video' | 'audio'
  file_name: string
  file_path: string
  file_size: number | null
  mime_type: string | null
  width: number | null
  height: number | null
  duration_ms: number | null
  created_at: string
  sha1: string | null
  thumb_path: string | null
}

export interface Comment {
  id: number
  report_id: number
  author_id: string
  body: string
  visibility: 'public' | 'internal'
  created_at: string
  updated_at: string
  author?: User
}

export interface ActivityLog {
  id: number
  report_id: number | null
  actor_id: string | null
  action: string
  from_value: string | null
  to_value: string | null
  payload: any
  created_at: string
  actor?: User
}

export interface Location {
  lat: number
  lng: number
  accuracy?: number
}

export interface CreateReportData {
  title: string
  description: string
  categoryId: number
  subcategory?: string
  location: Location
  address?: string
  ward?: string
  urgent?: boolean
  tags?: string[]
  media?: File[]
}

export interface UpdateReportData {
  status?: Report['status']
  assigneeId?: string
  departmentId?: number
  tags?: string[]
  note?: string
  duplicateOf?: number
}

export const StatusColors = {
  new: 'bg-blue-100 text-blue-800',
  acknowledged: 'bg-yellow-100 text-yellow-800', 
  in_progress: 'bg-orange-100 text-orange-800',
  on_hold: 'bg-gray-100 text-gray-800',
  resolved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  duplicate: 'bg-purple-100 text-purple-800'
} as const

export const PriorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
} as const

export function getPriorityLevel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}