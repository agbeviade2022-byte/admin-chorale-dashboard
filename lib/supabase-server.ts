import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Ignore - called from Server Component
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Ignore - called from Server Component
          }
        },
      },
    }
  )
}

// Récupérer l'utilisateur et le profil côté serveur
export async function getServerUser() {
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { user: null, profile: null }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()
  
  return { user, profile }
}

// Récupérer les stats du dashboard côté serveur
export async function getDashboardStats() {
  const supabase = createServerSupabaseClient()
  
  const [choralesRes, usersRes, chantsRes] = await Promise.all([
    supabase.from('chorales').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('chants').select('id', { count: 'exact', head: true }),
  ])
  
  return {
    totalChorales: choralesRes.count || 0,
    totalUsers: usersRes.count || 0,
    totalChants: chantsRes.count || 0,
  }
}

// Récupérer les utilisateurs côté serveur
export async function getUsers(limit = 100) {
  const supabase = createServerSupabaseClient()
  
  // Essayer la vue optimisée d'abord
  const { data, error } = await supabase
    .from('users_with_emails')
    .select('*')
    .limit(limit)
  
  if (error) {
    // Fallback sur profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    return profiles || []
  }
  
  return data || []
}

// Récupérer les chorales côté serveur
export async function getChorales() {
  const supabase = createServerSupabaseClient()
  
  const { data } = await supabase
    .from('chorales')
    .select('*')
    .order('created_at', { ascending: false })
  
  return data || []
}

// Récupérer les chants côté serveur
export async function getChants() {
  const supabase = createServerSupabaseClient()
  
  const { data } = await supabase
    .from('chants')
    .select('*, chorales(nom)')
    .order('created_at', { ascending: false })
  
  return data || []
}
