// Edge Function pour envoyer des codes OTP personnalisés
// Déployée sur Supabase Edge Functions (Deno runtime)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OTPRequest {
  email: string
  type?: 'recovery' | 'signup'
}

serve(async (req) => {
  // Gérer les requêtes OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Récupérer les variables d'environnement
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY') // Optionnel

    // Créer le client Supabase avec service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parser la requête
    const { email, type = 'recovery' }: OTPRequest = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email requis' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Vérifier que l'utilisateur existe (nouvelle API)
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()
    const user = users?.find(u => u.email === email)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur non trouvé' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Générer un code OTP à 6 chiffres
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Stocker le code OTP dans la base de données avec expiration
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    const { error: insertError } = await supabase
      .from('otp_codes')
      .insert({
        user_id: user.id,
        email: email,
        code: otpCode,
        type: type,
        expires_at: expiresAt.toISOString(),
        used: false,
      })

    if (insertError) {
      console.error('Erreur insertion OTP:', insertError)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la génération du code' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Envoyer l'email avec le code OTP
    if (resendApiKey) {
      // Option 1 : Utiliser Resend (service d'emailing)
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Mini Chorale <noreply@votredomaine.com>',
          to: email,
          subject: 'Code de vérification',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1E3A5F;">Code de vérification</h2>
              <p>Utilisez ce code pour réinitialiser votre mot de passe :</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <h1 style="font-size: 32px; letter-spacing: 5px; color: #1E3A5F; margin: 0;">${otpCode}</h1>
              </div>
              <p style="color: #666;">Ce code expire dans 10 minutes.</p>
              <p style="color: #999; font-size: 12px;">Si vous n'avez pas demandé ce code, ignorez cet email.</p>
            </div>
          `,
        }),
      })

      if (!emailResponse.ok) {
        console.error('Erreur envoi email:', await emailResponse.text())
      }
    } else {
      // Option 2 : Utiliser l'email Supabase natif (fallback)
      // Note: Cela enverra quand même via le provider configuré
      await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Code OTP envoyé par email',
        // Ne jamais retourner le code en production !
        // code: otpCode, // Pour debug uniquement
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erreur:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
