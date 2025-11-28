import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Vérifier si l'utilisateur est admin système
export async function isSystemAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase.rpc('is_system_admin', {
      check_user_id: user.id
    })

    if (error) {
      console.error('Erreur is_system_admin:', error)
      return false
    }

    return data as boolean
  } catch (error) {
    console.error('Erreur:', error)
    return false
  }
}

// Logger une action admin
export async function logAdminAction(
  action: string,
  tableName?: string,
  recordId?: string,
  details?: any
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.rpc('log_admin_action', {
      p_user_id: user.id,
      p_action: action,
      p_table_name: tableName,
      p_record_id: recordId,
      p_details: details
    })
  } catch (error) {
    console.error('Erreur log:', error)
  }
}
