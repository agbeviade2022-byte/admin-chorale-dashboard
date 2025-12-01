import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

// Générer un mot de passe temporaire sécurisé
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(request: NextRequest) {
  try {
    // 1. Vérifier l'authentification de l'appelant
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Créer un client avec le token de l'utilisateur pour vérifier ses droits
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    )

    const { data: { user: caller }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !caller) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
    }

    // 2. Vérifier que l'appelant est admin ou super_admin
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, chorale_id')
      .eq('user_id', caller.id)
      .single()

    if (profileError || !callerProfile) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })
    }

    const isAdmin = callerProfile.role === 'admin' || callerProfile.role === 'super_admin'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé: droits admin requis' }, { status: 403 })
    }

    // 3. Récupérer les données du nouveau membre
    const body = await request.json()
    const { email, full_name, telephone, role, chorale_id, send_invitation } = body

    if (!email || !full_name) {
      return NextResponse.json({ error: 'Email et nom requis' }, { status: 400 })
    }

    // 4. Vérifier les droits sur la chorale (admin ne peut créer que dans sa chorale)
    let targetChoraleId = chorale_id
    if (callerProfile.role === 'admin') {
      // Admin: forcer la chorale à être la sienne
      targetChoraleId = callerProfile.chorale_id
      
      // Admin ne peut créer que des membres (pas d'admin ou super_admin)
      if (role && role !== 'membre') {
        return NextResponse.json({ 
          error: 'Un admin ne peut créer que des membres' 
        }, { status: 403 })
      }
    }

    // 5. Vérifier si l'email existe déjà
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const emailExists = existingUsers?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase())
    
    if (emailExists) {
      return NextResponse.json({ 
        error: 'Cet email est déjà utilisé' 
      }, { status: 409 })
    }

    // 6. Créer l'utilisateur Auth
    let password: string | undefined
    let authResult

    if (send_invitation) {
      // Envoyer une invitation par email (l'utilisateur définira son mot de passe)
      authResult = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name,
          role: role || 'membre',
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://votre-app.com'}/auth/set-password`,
      })
    } else {
      // Créer avec un mot de passe temporaire
      password = generateTemporaryPassword()
      authResult = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Confirmer l'email automatiquement
        user_metadata: {
          full_name,
          role: role || 'membre',
        },
      })
    }

    if (authResult.error) {
      console.error('Erreur création auth:', authResult.error)
      return NextResponse.json({ 
        error: `Erreur création compte: ${authResult.error.message}` 
      }, { status: 500 })
    }

    const newUser = authResult.data.user
    if (!newUser) {
      return NextResponse.json({ error: 'Erreur: utilisateur non créé' }, { status: 500 })
    }

    // 7. Créer le profil dans la table profiles
    const { error: profileInsertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: newUser.id,
        email: email.toLowerCase(),
        full_name,
        telephone: telephone || null,
        role: role || 'membre',
        chorale_id: targetChoraleId || null,
        statut_validation: 'valide', // Déjà validé car créé par un admin
        created_at: new Date().toISOString(),
      })

    if (profileInsertError) {
      console.error('Erreur création profil:', profileInsertError)
      // Rollback: supprimer l'utilisateur auth si le profil échoue
      await supabaseAdmin.auth.admin.deleteUser(newUser.id)
      return NextResponse.json({ 
        error: `Erreur création profil: ${profileInsertError.message}` 
      }, { status: 500 })
    }

    // 8. Retourner le résultat
    return NextResponse.json({
      success: true,
      message: send_invitation 
        ? `Invitation envoyée à ${email}` 
        : `Membre créé avec mot de passe temporaire`,
      user_id: newUser.id,
      email: email,
      temporary_password: password || null, // Null si invitation envoyée
      send_invitation,
    })

  } catch (error: any) {
    console.error('Erreur API create-user:', error)
    return NextResponse.json({ 
      error: error.message || 'Erreur interne du serveur' 
    }, { status: 500 })
  }
}
