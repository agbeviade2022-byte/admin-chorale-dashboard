'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import UsersClient from './UsersClient'

export default function UsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    // Attendre d'avoir un user avant de charger
    if (!user) return
    
    const loadUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, chorales(nom)')
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        // Transformer pour ajouter chorale_nom
        const usersWithChorale = data.map(u => ({
          ...u,
          chorale_nom: u.chorales?.nom || null
        }))
        setUsers(usersWithChorale)
      }
    }
    
    loadUsers()
  }, [user])

  return <UsersClient initialUsers={users} />
}
