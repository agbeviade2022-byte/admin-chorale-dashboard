'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import ChoralesClient from './ChoralesClient'

export default function ChoralesPage() {
  const { user } = useAuth()
  const [chorales, setChorales] = useState<any[]>([])

  useEffect(() => {
    // Attendre d'avoir un user avant de charger
    if (!user) return
    
    const loadChorales = async () => {
      const { data, error } = await supabase
        .from('chorales')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setChorales(data)
      }
    }
    
    loadChorales()
  }, [user])

  return <ChoralesClient initialChorales={chorales} />
}
