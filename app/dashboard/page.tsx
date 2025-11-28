'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Building2, Users, Music, Activity } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    chorales: 0,
    users: 0,
    chants: 0,
    activeChorales: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      // Essayer d'utiliser la vue matérialisée (plus rapide)
      const { data: statsData, error: statsError } = await supabase
        .from('dashboard_stats')
        .select('*')
        .single()

      if (!statsError && statsData) {
        // Utiliser les stats de la vue matérialisée
        setStats({
          chorales: statsData.total_chorales || 0,
          users: statsData.total_users || 0,
          chants: statsData.total_chants || 0,
          activeChorales: statsData.chorales_actives || 0,
        })
      } else {
        // Fallback: requêtes COUNT séparées
        console.warn('Vue matérialisée non disponible, utilisation des COUNT')
        
        const [chorales, activeChorales, users, chants] = await Promise.all([
          supabase.from('chorales').select('*', { count: 'exact', head: true }),
          supabase.from('chorales').select('*', { count: 'exact', head: true }).eq('statut', 'actif'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('chants').select('*', { count: 'exact', head: true })
        ])

        setStats({
          chorales: chorales.count || 0,
          users: users.count || 0,
          chants: chants.count || 0,
          activeChorales: activeChorales.count || 0,
        })
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Chargement...</div>
      </div>
    )
  }

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
