import { createServerSupabaseClient } from '@/lib/supabase-server'
import UsersClient from './UsersClient'

// Server Component - données chargées côté serveur, ZÉRO loading
export default async function UsersPage() {
  const supabase = createServerSupabaseClient()
  
  // Charger les utilisateurs côté serveur
  let users: any[] = []
  
  // Essayer la vue optimisée d'abord
  const { data, error } = await supabase
    .from('users_with_emails')
    .select('*')
    .limit(100)
  
  if (!error && data) {
    users = data
  } else {
    // Fallback sur profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    
    users = profiles || []
  }

  // Passer les données pré-chargées au Client Component
  return <UsersClient initialUsers={users} />
}
