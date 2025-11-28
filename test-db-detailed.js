// Test détaillé de la base de données
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://milzcdtfblwhblstwuzh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pbHpjZHRmYmx3aGJsc3R3dXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTIwNjQsImV4cCI6MjA3ODY4ODA2NH0.HRYmU5hWySL51sD45d16bIRusknirhrdlYNoccxIEKc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDetailed() {
  console.log('🔍 Test détaillé de la base de données\n')

  // Test avec la fonction RPC
  console.log('📊 Données via RPC get_all_users_with_emails_debug:')
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('get_all_users_with_emails_debug')
  
  if (rpcError) {
    console.error('❌ Erreur RPC:', rpcError.message)
  } else {
    console.log(`✅ ${rpcData.length} utilisateurs trouvés:\n`)
    rpcData.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name || 'Sans nom'}`)
      console.log(`   Email: ${user.email || 'N/A'}`)
      console.log(`   Rôle: ${user.role || 'N/A'}`)
      console.log(`   User ID: ${user.user_id || user.id || 'N/A'}`)
      console.log(`   Statut: ${user.statut_validation || 'N/A'}`)
      console.log(`   Chorale: ${user.chorale_nom || 'Aucune'}`)
      console.log()
    })
  }

  // Chercher les admins
  console.log('🔐 Admins disponibles pour connexion:')
  if (rpcData) {
    const admins = rpcData.filter(u => u.role === 'admin' || u.role === 'super_admin')
    if (admins.length === 0) {
      console.log('❌ AUCUN ADMIN TROUVÉ!')
      console.log('⚠️  Vous devez créer un compte admin dans Supabase\n')
    } else {
      admins.forEach(admin => {
        const canLogin = !admin.statut_validation || admin.statut_validation === 'valide'
        const emoji = canLogin ? '✅' : '❌'
        console.log(`${emoji} ${admin.full_name} (${admin.email})`)
        console.log(`   Rôle: ${admin.role}`)
        console.log(`   Statut: ${admin.statut_validation || 'valide'}`)
        console.log(`   Peut se connecter: ${canLogin ? 'OUI' : 'NON'}`)
        console.log()
      })
    }
  }

  // Test de connexion avec un admin
  console.log('═══════════════════════════════════════')
  console.log('💡 POUR VOUS CONNECTER:')
  console.log('═══════════════════════════════════════')
  if (rpcData && rpcData.length > 0) {
    const validAdmins = rpcData.filter(u => 
      (u.role === 'admin' || u.role === 'super_admin') &&
      (!u.statut_validation || u.statut_validation === 'valide')
    )
    
    if (validAdmins.length > 0) {
      console.log('✅ Utilisez un de ces comptes admin:')
      validAdmins.forEach(admin => {
        console.log(`   📧 Email: ${admin.email}`)
        console.log(`   👤 Nom: ${admin.full_name}`)
        console.log(`   🔑 Rôle: ${admin.role}`)
        console.log()
      })
    } else {
      console.log('❌ Aucun admin valide trouvé!')
      console.log('\n📝 Actions requises dans Supabase SQL Editor:')
      console.log('\n-- 1. Créer un utilisateur admin')
      console.log('-- Allez dans Authentication > Users > Add User')
      console.log('-- Ou exécutez ce SQL:')
      console.log(`
-- Mettre à jour un utilisateur existant en admin
UPDATE profiles 
SET role = 'super_admin', 
    statut_validation = 'valide'
WHERE user_id = 'VOTRE_USER_ID';

-- Ou créer un nouveau profil admin
INSERT INTO profiles (user_id, full_name, role, statut_validation)
VALUES ('VOTRE_USER_ID', 'Admin Principal', 'super_admin', 'valide');
`)
    }
  } else {
    console.log('❌ Aucun utilisateur dans la base!')
    console.log('\n📝 Créez un utilisateur dans Supabase:')
    console.log('1. Allez dans Authentication > Users')
    console.log('2. Cliquez sur "Add User"')
    console.log('3. Entrez email et password')
    console.log('4. Puis exécutez ce SQL:')
    console.log(`
INSERT INTO profiles (user_id, full_name, role, statut_validation)
VALUES ('VOTRE_USER_ID', 'Admin Principal', 'super_admin', 'valide');
`)
  }
}

testDetailed()
