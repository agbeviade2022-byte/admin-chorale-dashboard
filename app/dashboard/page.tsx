'use client'

import { useEffect, useState } from 'react'
import { Building2, Users, Music, Activity } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Stats = { chorales: number; users: number; chants: number; activeChorales: number }

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ chorales: 0, users: 0, chants: 0, activeChorales: 0 })

  useEffect(() => {
    const load = async () => {
      const [c1, c2, u, ch] = await Promise.all([
        supabase.from('chorales').select('*', { count: 'exact', head: true }),
        supabase.from('chorales').select('*', { count: 'exact', head: true }).eq('statut', 'actif'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('chants').select('*', { count: 'exact', head: true })
      ])
      setStats({ chorales: c1.count || 0, users: u.count || 0, chants: ch.count || 0, activeChorales: c2.count || 0 })
    }
    load()
  }, [])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Vue d'ensemble</h1>
        <p className="text-gray-600 mt-2">Statistiques globales de votre SaaS</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Chorales</p>
              <p className="text-3xl font-bold mt-2">{stats.chorales}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Building2 size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Chorales actives</p>
              <p className="text-3xl font-bold mt-2">{stats.activeChorales}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Activity size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Utilisateurs</p>
              <p className="text-3xl font-bold mt-2">{stats.users}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Chants</p>
              <p className="text-3xl font-bold mt-2">{stats.chants}</p>
            </div>
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <Music size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Activité récente</h2>
        <p className="text-gray-600">Les dernières actions seront affichées ici</p>
      </div>
    </div>
  )
}
