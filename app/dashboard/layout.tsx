'use client'
import { useEffect } from 'react'
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

  useEffect(() => {
    // Rediriger si non connecté et pas de profil caché
    if (!loading && !user && !profile) {
      router.push('/login')
    }
  }, [user, profile, loading, router])

  // Si pas de profil (ni user ni cache) = redirection en cours
  if (!profile && !user && !loading) {
    return null
  }

  // TOUJOURS afficher le contenu immédiatement si on a un profil (même caché)
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-gray-100 min-h-screen">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-end px-8 py-4">
            <NotificationBell />
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  )
}
