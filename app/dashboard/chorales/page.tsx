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
      // Récupérer les chorales avec le compte des membres
      const { data, error } = await supabase
        .from('chorales')
        .select('*, profiles(count)')
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        // Transformer pour ajouter nb_membres
        const choralesWithCount = data.map(c => ({
          ...c,
          nb_membres: c.profiles?.[0]?.count || 0
        }))
        setChorales(choralesWithCount)
      }
    }
    
    loadChorales()
  }, [user])

  return <ChoralesClient initialChorales={chorales} />
}
