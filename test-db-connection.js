// Script de test de connexion à la base de données Supabase
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://milzcdtfblwhblstwuzh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pbHpjZHRmYmx3aGJsc3R3dXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTIwNjQsImV4cCI6MjA3ODY4ODA2NH0.HRYmU5hWySL51sD45d16bIRusknirhrdlYNoccxIEKc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  console.log('🔍 Test de connexion à Supabase...\n')
  console.log('URL:', supabaseUrl)
  console.log('Key:', supabaseAnonKey.substring(0, 20) + '...\n')

  try {
    // Test 1: Connexion basique
    console.log('📡 Test 1: Connexion basique...')
    const { data: healthCheck, error: healthError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (healthError) {
      console.error('❌ Erreur de connexion:', healthError.message)
      console.error('Code:', healthError.code)
      console.error('Details:', healthError.details)
      return
    }
    console.log('✅ Connexion réussie!\n')

    // Test 2: Compter les profils
    console.log('📊 Test 2: Comptage des profils...')
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('❌ Erreur:', countError.message)
    } else {
      console.log(`✅ Nombre de profils: ${count}\n`)
    }

    // Test 3: Récupérer les profils
    console.log('👥 Test 3: Récupération des profils...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, full_name, role, statut_validation')
      .limit(5)
    
    if (profilesError) {
      console.error('❌ Erreur:', profilesError.message)
    } else {
      console.log(`✅ ${profiles.length} profils récupérés:`)
      profiles.forEach(p => {
        console.log(`  - ${p.full_name} (${p.role}) - Statut: ${p.statut_validation || 'N/A'}`)
      })
      console.log()
    }

    // Test 4: Vérifier les admins
    console.log('🔐 Test 4: Vérification des admins...')
    const { data: admins, error: adminsError } = await supabase
      .from('profiles')
      .select('user_id, full_name, role, statut_validation')
      .in('role', ['admin', 'super_admin'])
    
    if (adminsError) {
      console.error('❌ Erreur:', adminsError.message)
    } else {
      console.log(`✅ ${admins.length} admin(s) trouvé(s):`)
      admins.forEach(a => {
        const status = a.statut_validation || 'valide'
        const emoji = status === 'valide' ? '✅' : status === 'en_attente' ? '⏳' : '❌'
        console.log(`  ${emoji} ${a.full_name} (${a.role}) - Statut: ${status}`)
      })
      console.log()
    }

    // Test 5: Tester la fonction RPC
    console.log('🔧 Test 5: Fonction RPC get_all_users_with_emails_debug...')
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_all_users_with_emails_debug')
    
    if (rpcError) {
      console.error('❌ Fonction RPC non disponible:', rpcError.message)
      console.log('ℹ️  Cela peut être normal si la fonction n\'a pas été créée\n')
    } else {
      console.log(`✅ Fonction RPC fonctionne! ${rpcData.length} utilisateurs avec emails\n`)
    }

    // Test 6: Vérifier la table auth.users (peut échouer selon les permissions)
    console.log('🔑 Test 6: Vérification auth.users...')
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('email')
      .limit(1)
    
    if (authError) {
      console.log('ℹ️  Pas d\'accès direct à auth.users (normal)\n')
    } else {
      console.log('✅ Accès à auth.users disponible\n')
    }

    console.log('═══════════════════════════════════════')
    console.log('✅ TOUS LES TESTS TERMINÉS')
    console.log('═══════════════════════════════════════')

  } catch (error) {
    console.error('❌ Erreur générale:', error.message)
    console.error(error)
  }
}

testConnection()
