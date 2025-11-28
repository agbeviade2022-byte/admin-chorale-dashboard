'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Music, 
  Users, 
  Building2, 
  BarChart3, 
  FileText,
  LogOut,
  UserCheck,
  Shield
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const menuItems = [
  { href: '/dashboard', label: 'Vue d\'ensemble', icon: LayoutDashboard },
  { href: '/dashboard/validation', label: 'Validation des membres', icon: UserCheck },
  { href: '/dashboard/permissions', label: 'Permissions', icon: Shield },
  { href: '/dashboard/chorales', label: 'Chorales', icon: Building2 },
  { href: '/dashboard/users', label: 'Utilisateurs', icon: Users },
  { href: '/dashboard/chants', label: 'Chants', icon: Music },
  { href: '/dashboard/stats', label: 'Statistiques', icon: BarChart3 },
  { href: '/dashboard/logs', label: 'Logs', icon: FileText },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">🎵 Admin Dashboard</h1>
        <p className="text-sm text-gray-400">Chorale SaaS</p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 w-full mt-8"
      >
        <LogOut size={20} />
        <span>Déconnexion</span>
      </button>
    </div>
  )
}
