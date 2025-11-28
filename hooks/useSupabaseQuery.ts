'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface UseSupabaseQueryOptions {
  table: string
  select?: string
  filters?: Record<string, any>
  orderBy?: { column: string; ascending?: boolean }
  limit?: number
}

interface UseSupabaseQueryResult<T> {
  data: T[] | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useSupabaseQuery<T = any>(
  options: UseSupabaseQueryOptions
): UseSupabaseQueryResult<T> {
  const [data, setData] = useState<T[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from(options.table)
        .select(options.select || '*')

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true,
        })
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit)
      }

      const { data: result, error: queryError } = await query

      if (queryError) throw queryError

      setData(result as T[])
    } catch (err) {
      setError(err as Error)
      console.error('useSupabaseQuery error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [JSON.stringify(options)])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  }
}
