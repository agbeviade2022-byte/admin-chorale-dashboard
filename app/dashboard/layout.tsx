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

  // Pendant la vérification d'authentification, afficher un écran de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-gray-700 text-lg">Chargement de votre session...</div>
      </div>
    )
  }

  // Si pas d'utilisateur, afficher un écran de redirection (évite la page blanche)
  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-gray-700 text-lg">Redirection vers la page de connexion...</div>
      </div>
    )
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
