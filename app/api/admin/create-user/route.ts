import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

const RESEND_API_KEY = process.env.RESEND_API_KEY

// Envoyer un email personnalisé via Resend
async function sendCustomInviteEmail(
  email: string,
  fullName: string,
  choraleName: string | null,
  inviteLink: string
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY non configurée, email non envoyé')
    return false
  }

  const choraleText = choraleName ? `la chorale ${choraleName}` : 'la chorale'
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #7C3AED;">Bienvenue dans ${choraleText} ! 🎵</h2>
      
      <p>Bonjour <strong>${fullName}</strong>,</p>
      
      <p>Vous avez été invité(e) à rejoindre l'application de ${choraleText}.</p>
      
      <p>Cliquez sur le bouton ci-dessous pour créer votre mot de passe et activer votre compte :</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteLink}" 
           style="display: inline-block; background: linear-gradient(to right, #8B5CF6, #EC4899); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          Activer mon compte
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        Ce lien expire dans 24 heures. Si vous n'avez pas demandé cette invitation, ignorez cet email.
      </p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      
      <p style="color: #999; font-size: 12px;">
        — L'équipe de ${choraleText}
      </p>
    </div>
  `

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'Chorale App <onboarding@resend.dev>',
        to: email,
        subject: `Bienvenue dans ${choraleText} ! 🎵`,
        html: htmlContent,
      }),
    })

    if (!response.ok) {
      console.error('Erreur Resend:', await response.text())
      return false
    }
    
    console.log('✅ Email envoyé à', email)
    return true
  } catch (error) {
    console.error('Erreur envoi email:', error)
    return false
  }
}

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

    // 6. Récupérer le nom de la chorale si elle existe
    let choraleName: string | null = null
    if (targetChoraleId) {
      const { data: choraleData } = await supabaseAdmin
        .from('chorales')
        .select('nom')
        .eq('id', targetChoraleId)
        .single()
      choraleName = choraleData?.nom || null
    }

    // 7. Créer l'utilisateur Auth
    let password: string | undefined
    let emailSent = false

    // Toujours créer avec un mot de passe temporaire
    password = generateTemporaryPassword()
    const authResult = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Email confirmé automatiquement
      user_metadata: {
        full_name,
        role: role || 'membre',
      },
    })

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

    // 8. Créer le profil dans la table profiles
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

    // 9. Si invitation demandée, générer un lien de réinitialisation et envoyer l'email
    if (send_invitation) {
      // Générer un lien de réinitialisation de mot de passe
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: email,
      })

      if (!linkError && linkData?.properties?.action_link) {
        // Le action_link contient déjà le token, on le redirige vers notre page
        // Format: https://xxx.supabase.co/auth/v1/verify?token=xxx&type=recovery&redirect_to=...
        // On extrait le token et on construit notre propre lien
        const actionLink = new URL(linkData.properties.action_link)
        const token = actionLink.searchParams.get('token')
        
        if (token) {
          // Construire le lien vers notre page sécurisée
          const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/set-password?token=${token}&type=recovery&email=${encodeURIComponent(email)}`
          
          // Envoyer l'email personnalisé via Resend
          emailSent = await sendCustomInviteEmail(email, full_name, choraleName, inviteLink)
        }
      }
    }

    // 10. Retourner le résultat
    return NextResponse.json({
      success: true,
      message: send_invitation 
        ? (emailSent ? `Invitation envoyée à ${email}` : `Membre créé (email non envoyé - configurez RESEND_API_KEY)`)
        : `Membre créé avec mot de passe temporaire`,
      user_id: newUser.id,
      email: email,
      chorale_name: choraleName,
      temporary_password: send_invitation ? null : password, // Afficher le mdp seulement si pas d'invitation
      send_invitation,
      email_sent: emailSent,
    })

  } catch (error: any) {
    console.error('Erreur API create-user:', error)
    return NextResponse.json({ 
      error: error.message || 'Erreur interne du serveur' 
    }, { status: 500 })
  }
}
