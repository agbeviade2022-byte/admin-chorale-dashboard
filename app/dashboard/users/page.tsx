'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import UsersClient from './UsersClient'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    async function loadUsers() {
      const { data, error } = await supabase
        .from('users_with_emails')
        .select('*')
        .limit(100)
      
      if (!error && data) {
        setUsers(data)
      } else {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
        
        setUsers(profiles || [])
      }
    }
    loadUsers()
  }, [])

  // Affichage IMMÉDIAT - pas de loading
  return <UsersClient initialUsers={users} />
}
