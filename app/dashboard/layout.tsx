'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import NotificationBell from '@/components/NotificationBell'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      console.log('Dashboard Layout: Non authentifié, redirection vers /login')
      router.push('/login')
    }
  }, [user, loading, router])

  // Pendant la vérification d'authentification, ne rien afficher
  // (évite l'écran intermédiaire "Vérification de l'authentification...")
  if (loading) {
    return null
  }

  // Si pas d'utilisateur, ne rien afficher (redirection en cours)
  if (!user || !profile) {
    return null
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-gray-100 min-h-screen">
        {/* Header avec cloche de notification */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-end px-8 py-4">
            <NotificationBell />
          </div>
        </header>
        
        {/* Contenu principal */}
        <main>
          {children}
        </main>
      </div>
    </div>
  )
}
