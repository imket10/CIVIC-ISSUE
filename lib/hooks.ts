'use client'

import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { Report, Category, Department, User } from './types'

export function useReports(userId?: string, role?: string) {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReports()
  }, [userId, role])

  const fetchReports = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('reports')
        .select(`
          *,
          citizen:users!reports_citizen_id_fkey(*),
          category:categories(*),
          department:departments(*),
          assignee:users!reports_assignee_id_fkey(*),
          media(*),
          comments:comments(*, author:users(*))
        `)
        .order('created_at', { ascending: false })

      // Apply role-based filtering
      if (role === 'citizen' && userId) {
        query = query.eq('citizen_id', userId)
      } else if (role === 'worker' && userId) {
        query = query.eq('assignee_id', userId)
      }

      const { data, error } = await query

      if (error) throw error
      setReports(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const createReport = async (reportData: any) => {
    const { data, error } = await supabase
      .from('reports')
      .insert(reportData)
      .select()
      .single()

    if (error) throw error
    
    await fetchReports()
    return data
  }

  const updateReport = async (id: number, updates: any) => {
    const { data, error } = await supabase
      .from('reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    
    await fetchReports()
    return data
  }

  return {
    reports,
    loading,
    error,
    refetch: fetchReports,
    createReport,
    updateReport
  }
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*, department:departments(*)')
        .eq('active', true)
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  return { categories, loading, refetch: fetchCategories }
}

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('active', true)
        .order('name')

      if (error) throw error
      setDepartments(data || [])
    } catch (error) {
      console.error('Error fetching departments:', error)
    } finally {
      setLoading(false)
    }
  }

  return { departments, loading, refetch: fetchDepartments }
}

export function useGeolocation() {
  const [location, setLocation] = useState<GeolocationPosition | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.')
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position)
        setLoading(false)
      },
      (error) => {
        setError(error.message)
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  return {
    location,
    error,
    loading,
    getCurrentLocation
  }
}

export function useRealtime(table: string, callback: (payload: any) => void) {
  useEffect(() => {
    const subscription = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        callback
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [table, callback])
}