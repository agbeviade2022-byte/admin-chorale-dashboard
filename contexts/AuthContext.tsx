'use client'
import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  user_id: string
  full_name: string
  role: 'super_admin' | 'admin' | 'membre' | 'user'
  email?: string
  chorale_id?: string
  statut_validation?: string
  statut_membre?: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)

  useEffect(() => {
    // Éviter la double initialisation (React StrictMode)
    if (initialized.current) return
    initialized.current = true

    // Timeout de sécurité : max 3 secondes de chargement
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 3000)

    // Vérifier la session rapidement
    checkUser().finally(() => {
      clearTimeout(timeout)
    })

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Ne pas recharger le profil si on vient de faire signIn
        if (event === 'SIGNED_IN' && user && profile) {
          return
        }
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        // Pas de session = pas connecté, fin du chargement
        setLoading(false)
        return
      }

      setUser(session.user)
      
      // Charger le profil en parallèle (ne bloque pas l'affichage)
      loadProfile(session.user.id).finally(() => {
        setLoading(false)
      })
    } catch (error) {
      setLoading(false)
    }
  }

  async function loadProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
      setProfile(null)
    }
  }

  async function signIn(email: string, password: string) {
    try {
      // 1. Authentification avec Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (!data.user) {
        throw new Error('Session invalide après connexion')
      }

      // 2. Récupérer le profil directement (sans RPC)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single()

      if (profileError || !profileData) {
        await supabase.auth.signOut()
        throw new Error('Impossible de récupérer le profil utilisateur')
      }

      // 3. Vérifier que l'utilisateur est admin ou super_admin
      if (profileData.role !== 'admin' && profileData.role !== 'super_admin') {
        await supabase.auth.signOut()
        throw new Error('Accès refusé : vous n\'êtes pas administrateur')
      }

      // 4. Vérifier le statut de validation
      if (profileData.statut_validation === 'refuse') {
        await supabase.auth.signOut()
        throw new Error('Accès refusé : votre compte a été refusé')
      }

      if (profileData.statut_validation === 'en_attente') {
        await supabase.auth.signOut()
        throw new Error('Votre compte est en attente de validation')
      }

      // 5. Tout est OK - mettre à jour l'état
      setUser(data.user)
      setProfile(profileData)

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  async function refreshProfile() {
    if (user) {
      await loadProfile(user.id)
    }
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
