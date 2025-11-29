'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import ChoralesClient from './ChoralesClient'

export default function ChoralesPage() {
  const [chorales, setChorales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadChorales() {
      const { data } = await supabase
        .from('chorales')
        .select('*')
        .order('created_at', { ascending: false })
      
      setChorales(data || [])
      setLoading(false)
    }
    loadChorales()
  }, [])

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return <ChoralesClient initialChorales={chorales} />
}
