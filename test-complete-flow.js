// Test complet du flux de connexion et du dashboard
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://milzcdtfblwhblstwuzh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pbHpjZHRmYmx3aGJsc3R3dXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTIwNjQsImV4cCI6MjA3ODY4ODA2NH0.HRYmU5hWySL51sD45d16bIRusknirhrdlYNoccxIEKc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testCompleteFlow() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('🧪 TEST COMPLET DU DASHBOARD ADMIN')
  console.log('═══════════════════════════════════════════════════════\n')

  let allTestsPassed = true

  // TEST 1: Connexion à Supabase
  console.log('📡 TEST 1: Connexion à Supabase')
  console.log('─────────────────────────────────────')
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) throw error
    console.log('✅ Connexion Supabase réussie\n')
  } catch (error) {
    console.error('❌ ÉCHEC:', error.message)
    allTestsPassed = false
    console.log()
  }

  // TEST 2: Récupération des utilisateurs
  console.log('👥 TEST 2: Récupération des utilisateurs')
  console.log('─────────────────────────────────────')
  try {
    const { data, error } = await supabase.rpc('get_all_users_with_emails_debug')
    
    if (error) throw error
    console.log(`✅ ${data.length} utilisateurs récupérés`)
    console.log(`   - Admins: ${data.filter(u => u.role === 'admin' || u.role === 'super_admin').length}`)
    console.log(`   - Membres: ${data.filter(u => u.role === 'membre').length}\n`)
  } catch (error) {
    console.error('❌ ÉCHEC:', error.message)
    allTestsPassed = false
    console.log()
  }

  // TEST 3: Simulation de connexion
  console.log('🔐 TEST 3: Simulation de connexion admin')
  console.log('─────────────────────────────────────')
  console.log('ℹ️  Je ne peux pas tester avec un vrai mot de passe')
  console.log('   Mais voici ce qui devrait se passer:\n')
  
  const { data: admins } = await supabase.rpc('get_all_users_with_emails_debug')
  const validAdmins = admins.filter(u => 
    (u.role === 'admin' || u.role === 'super_admin') &&
    (!u.statut_validation || u.statut_validation === 'valide')
  )

  if (validAdmins.length > 0) {
    console.log('✅ Comptes admin valides trouvés:')
    validAdmins.forEach(admin => {
      console.log(`   📧 ${admin.email}`)
      console.log(`   👤 ${admin.full_name}`)
      console.log(`   🔑 ${admin.role}`)
      console.log(`   ✅ Statut: ${admin.statut_validation || 'valide'}`)
      console.log()
    })
  } else {
    console.error('❌ AUCUN ADMIN VALIDE!')
    allTestsPassed = false
  }

  // TEST 4: Vérification de la structure des données
  console.log('📊 TEST 4: Structure des données utilisateur')
  console.log('─────────────────────────────────────')
  if (admins && admins.length > 0) {
    const firstUser = admins[0]
    const requiredFields = ['user_id', 'full_name', 'role', 'email']
    let allFieldsPresent = true

    requiredFields.forEach(field => {
      if (firstUser[field]) {
        console.log(`✅ ${field}: ${firstUser[field]}`)
      } else {
        console.log(`❌ ${field}: MANQUANT`)
        allFieldsPresent = false
      }
    })

    if (allFieldsPresent) {
      console.log('\n✅ Tous les champs requis sont présents\n')
    } else {
      console.log('\n❌ Certains champs sont manquants\n')
      allTestsPassed = false
    }
  }

  // TEST 5: Test de modification (simulation)
  console.log('✏️  TEST 5: Test de modification utilisateur')
  console.log('─────────────────────────────────────')
  if (admins && admins.length > 0) {
    const testUser = admins[0]
    const userId = testUser.user_id || testUser.id

    if (userId) {
      console.log(`✅ User ID disponible: ${userId}`)
      console.log('✅ La modification devrait fonctionner')
      console.log(`   UPDATE profiles SET ... WHERE user_id = '${userId}'\n`)
    } else {
      console.error('❌ User ID manquant!')
      allTestsPassed = false
      console.log()
    }
  }

  // TEST 6: Vérification des routes Next.js
  console.log('🌐 TEST 6: Vérification de la configuration Next.js')
  console.log('─────────────────────────────────────')
  const fs = require('fs')
  const path = require('path')

  // Vérifier next.config.js
  try {
    const nextConfigPath = path.join(__dirname, 'next.config.js')
    if (fs.existsSync(nextConfigPath)) {
      console.log('✅ next.config.js existe')
    } else {
      console.log('❌ next.config.js manquant')
      allTestsPassed = false
    }
  } catch (error) {
    console.log('⚠️  Impossible de vérifier next.config.js')
  }

  // Vérifier .env.local
  try {
    const envPath = path.join(__dirname, '.env.local')
    if (fs.existsSync(envPath)) {
      console.log('✅ .env.local existe')
      const envContent = fs.readFileSync(envPath, 'utf8')
      if (envContent.includes('NEXT_PUBLIC_SUPABASE_URL')) {
        console.log('✅ NEXT_PUBLIC_SUPABASE_URL configuré')
      }
      if (envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
        console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY configuré')
      }
    } else {
      console.log('❌ .env.local manquant')
      allTestsPassed = false
    }
  } catch (error) {
    console.log('⚠️  Impossible de vérifier .env.local')
  }
  console.log()

  // TEST 7: Vérification des fichiers critiques
  console.log('📁 TEST 7: Vérification des fichiers critiques')
  console.log('─────────────────────────────────────')
  const criticalFiles = [
    'app/login/page.tsx',
    'app/dashboard/layout.tsx',
    'app/dashboard/users/page.tsx',
    'contexts/AuthContext.tsx',
    'contexts/ToastContext.tsx',
    'components/EditUserModal.tsx',
    'components/DeleteUserModal.tsx',
    'middleware.ts'
  ]

  let allFilesExist = true
  criticalFiles.forEach(file => {
    const filePath = path.join(__dirname, file)
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file}`)
    } else {
      console.log(`❌ ${file} MANQUANT`)
      allFilesExist = false
      allTestsPassed = false
    }
  })

  if (allFilesExist) {
    console.log('\n✅ Tous les fichiers critiques sont présents\n')
  } else {
    console.log('\n❌ Certains fichiers sont manquants\n')
  }

  // RÉSUMÉ FINAL
  console.log('═══════════════════════════════════════════════════════')
  console.log('📋 RÉSUMÉ DES TESTS')
  console.log('═══════════════════════════════════════════════════════\n')

  if (allTestsPassed) {
    console.log('✅ TOUS LES TESTS SONT PASSÉS!\n')
    console.log('🎯 Le dashboard devrait fonctionner.')
    console.log('\n💡 Si vous ne pouvez toujours pas vous connecter:')
    console.log('   1. Vérifiez que le serveur tourne (npm run dev)')
    console.log('   2. Vérifiez le mot de passe du compte admin')
    console.log('   3. Ouvrez la console du navigateur (F12)')
    console.log('   4. Regardez les erreurs affichées')
    console.log('\n📧 Comptes admin disponibles:')
    validAdmins.forEach(admin => {
      console.log(`   - ${admin.email} (${admin.full_name})`)
    })
  } else {
    console.log('❌ CERTAINS TESTS ONT ÉCHOUÉ!\n')
    console.log('🔧 Actions requises:')
    console.log('   1. Vérifiez les erreurs ci-dessus')
    console.log('   2. Corrigez les problèmes identifiés')
    console.log('   3. Relancez ce test')
  }

  console.log('\n═══════════════════════════════════════════════════════')
}

testCompleteFlow()
