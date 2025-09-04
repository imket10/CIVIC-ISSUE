import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata'
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date) {
  const now = new Date()
  const target = new Date(date)
  const diff = now.getTime() - target.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 60) {
    return `${minutes}m ago`
  } else if (hours < 24) {
    return `${hours}h ago`
  } else {
    return `${days}d ago`
  }
}

export function calculateSLAStatus(slaDueAt: string | null, status: string) {
  if (!slaDueAt || status === 'resolved' || status === 'rejected') {
    return 'none'
  }
  
  const now = new Date()
  const due = new Date(slaDueAt)
  const diff = due.getTime() - now.getTime()
  const hoursLeft = diff / (1000 * 60 * 60)
  
  if (hoursLeft < 0) {
    return 'overdue'
  } else if (hoursLeft < 4) {
    return 'critical'
  } else if (hoursLeft < 24) {
    return 'warning'
  }
  
  return 'ok'
}

export function generateReportId(): string {
  return Date.now().toString(36).toUpperCase()
}

export function getStatusIcon(status: string) {
  const icons = {
    new: '🆕',
    acknowledged: '✅',
    in_progress: '⏳',
    on_hold: '⏸️',
    resolved: '✅',
    rejected: '❌',
    duplicate: '📋'
  }
  return icons[status as keyof typeof icons] || '📋'
}

export function getLocationString(lat: number, lng: number) {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}