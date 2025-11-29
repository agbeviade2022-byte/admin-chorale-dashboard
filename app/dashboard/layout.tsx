'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import NotificationBell from '@/components/NotificationBell'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // Si on a un user, afficher le contenu immédiatement
    if (user) {
      setShowContent(true)
    }
    
    // Si le chargement est terminé et pas d'utilisateur, rediriger
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Si pas d'utilisateur et pas en chargement, rediriger silencieusement
  if (!loading && !user) {
    return null
  }

  // Afficher le dashboard dès qu'on a un user (même si le profil charge encore)
  if (user || showContent) {
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

  // Chargement très court (max 3s grâce au timeout dans AuthContext)
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}
