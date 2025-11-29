import Sidebar from '@/components/Sidebar'
import NotificationBell from '@/components/NotificationBell'

// Server Component Layout - Auth vérifiée par middleware, pas de loading
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Le middleware garantit que seuls les utilisateurs authentifiés arrivent ici
  // Pas besoin de vérification côté client = ZÉRO loading
  
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
