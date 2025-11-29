import { createServerSupabaseClient } from '@/lib/supabase-server'
import ChoralesClient from './ChoralesClient'

// Server Component - données chargées côté serveur, ZÉRO loading
export default async function ChoralesPage() {
  const supabase = createServerSupabaseClient()
  
  // Charger les chorales côté serveur
  const { data } = await supabase
    .from('chorales')
    .select('*')
    .order('created_at', { ascending: false })

  // Passer les données pré-chargées au Client Component
  return <ChoralesClient initialChorales={data || []} />
}
