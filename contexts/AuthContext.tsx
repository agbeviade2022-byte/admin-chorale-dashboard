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

    // Vérifier la session immédiatement
    checkUser()

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
        setLoading(false)
        return
      }

      // Mettre à jour user ET charger profil en parallèle
      setUser(session.user)
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, role, email, chorale_id, statut_validation')
        .eq('user_id', session.user.id)
        .single()
      
      if (profileData) {
        setProfile(profileData as UserProfile)
      }
      setLoading(false)
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
      // Timeout de 10 secondes pour éviter les blocages
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connexion trop lente. Veuillez réessayer.')), 10000)
      })

      const authPromise = async () => {
        // 1. Authentification avec Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error
        if (!data.user) throw new Error('Session invalide')

        // 2. Récupérer le profil
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, user_id, full_name, role, email, chorale_id, statut_validation')
          .eq('user_id', data.user.id)
          .single()

        if (profileError || !profileData) {
          await supabase.auth.signOut()
          throw new Error('Profil introuvable')
        }

        // 3. Vérifier le rôle admin
        if (!['admin', 'super_admin'].includes(profileData.role)) {
          await supabase.auth.signOut()
          throw new Error('Accès refusé : vous n\'êtes pas administrateur')
        }

        // 4. Mettre à jour l'état
        setUser(data.user)
        setProfile(profileData as UserProfile)

        return { error: null }
      }

      // Race entre le timeout et l'auth
      return await Promise.race([authPromise(), timeoutPromise]) as { error: null }
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
