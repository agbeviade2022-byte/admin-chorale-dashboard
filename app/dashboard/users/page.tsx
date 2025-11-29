'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import UsersClient from './UsersClient'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUsers() {
      // Essayer la vue optimisée d'abord
      const { data, error } = await supabase
        .from('users_with_emails')
        .select('*')
        .limit(100)
      
      if (!error && data) {
        setUsers(data)
      } else {
        // Fallback sur profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
        
        setUsers(profiles || [])
      }
      setLoading(false)
    }
    loadUsers()
  }, [])

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return <UsersClient initialUsers={users} />
}
