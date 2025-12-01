'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Composant principal (wrapper avec Suspense)
export default function SetPasswordPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SetPasswordContent />
    </Suspense>
  )
}

// Écran de chargement
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        <p className="mt-4 text-white">Chargement...</p>
      </div>
    </div>
  )
}

// Contenu de la page
function SetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)

  useEffect(() => {
    // Vérifier si on a un token valide dans l'URL
    const checkSession = async () => {
      // 1. Vérifier si on a déjà une session active
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setIsValidToken(true)
        return
      }

      // 2. Essayer les query params (depuis notre email personnalisé)
      const token = searchParams.get('token')
      const type = searchParams.get('type')
      const email = searchParams.get('email')
      
      if (token && type === 'recovery' && email) {
        // Vérifier le token de récupération via Supabase
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'recovery',
        })
        
        if (!verifyError) {
          setIsValidToken(true)
          return
        }
      }

      // 3. Essayer le hash de l'URL (ancien format Supabase)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      
      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        
        if (!sessionError) {
          setIsValidToken(true)
          return
        }
      }

      // Aucun token valide trouvé
      setIsValidToken(false)
      setError('Lien invalide ou expiré. Demandez un nouveau lien à votre administrateur.')
    }
    
    checkSession()
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    // Vérification de la complexité
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      setError('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre')
      return
    }

    setIsLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        throw updateError
      }

      setSuccess(true)
      
      // Rediriger après 3 secondes
      setTimeout(() => {
        router.push('/') // Ou vers l'app mobile via deep link
      }, 3000)
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du mot de passe')
    } finally {
      setIsLoading(false)
    }
  }

  // État de chargement initial
  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Vérification du lien...</p>
        </div>
      </div>
    )
  }

  // Token invalide
  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-4">Lien invalide</h1>
          <p className="text-white/80 mb-6">{error}</p>
          <a 
            href="/"
            className="inline-block bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-6 rounded-lg transition-all"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    )
  }

  // Succès
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-white mb-4">Mot de passe créé !</h1>
          <p className="text-white/80 mb-6">
            Votre mot de passe a été défini avec succès. Vous pouvez maintenant vous connecter à l'application.
          </p>
          <p className="text-white/60 text-sm">
            Redirection en cours...
          </p>
        </div>
      </div>
    )
  }

  // Formulaire de création de mot de passe
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎵</div>
          <h1 className="text-2xl font-bold text-white">Bienvenue dans la Chorale !</h1>
          <p className="text-white/70 mt-2">Créez votre mot de passe pour accéder à l'application</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>

          {/* Password requirements */}
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-sm text-white/60 mb-2">Le mot de passe doit contenir :</p>
            <ul className="text-sm space-y-1">
              <li className={`flex items-center gap-2 ${password.length >= 8 ? 'text-green-400' : 'text-white/50'}`}>
                {password.length >= 8 ? '✓' : '○'} Au moins 8 caractères
              </li>
              <li className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? 'text-green-400' : 'text-white/50'}`}>
                {/[A-Z]/.test(password) ? '✓' : '○'} Une majuscule
              </li>
              <li className={`flex items-center gap-2 ${/[a-z]/.test(password) ? 'text-green-400' : 'text-white/50'}`}>
                {/[a-z]/.test(password) ? '✓' : '○'} Une minuscule
              </li>
              <li className={`flex items-center gap-2 ${/\d/.test(password) ? 'text-green-400' : 'text-white/50'}`}>
                {/\d/.test(password) ? '✓' : '○'} Un chiffre
              </li>
            </ul>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Création en cours...
              </span>
            ) : (
              'Créer mon mot de passe'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-white/50 text-sm mt-6">
          🔒 Connexion sécurisée
        </p>
      </div>
    </div>
  )
}
