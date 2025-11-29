'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import ChoralesClient from './ChoralesClient'

export default function ChoralesPage() {
  const [chorales, setChorales] = useState<any[]>([])

  useEffect(() => {
    async function loadChorales() {
      const { data } = await supabase
        .from('chorales')
        .select('*')
        .order('created_at', { ascending: false })
      
      setChorales(data || [])
    }
    loadChorales()
  }, [])

  // Affichage IMMÉDIAT - pas de loading
  return <ChoralesClient initialChorales={chorales} />
}
