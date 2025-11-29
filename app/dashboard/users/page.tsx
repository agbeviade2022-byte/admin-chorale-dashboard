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
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setUsers(data)
      }
    }
    
    loadUsers()
  }, [user])

  return <UsersClient initialUsers={users} />
}
