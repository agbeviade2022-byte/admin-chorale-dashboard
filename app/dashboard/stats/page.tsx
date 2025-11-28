'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChart3, TrendingUp, Users, Music, Building2, Activity } from 'lucide-react'

interface Stats {
  totalChorales: number
  totalUsers: number
  totalChants: number
  activeChorales: number
  newUsersThisMonth: number
  newChantsThisMonth: number
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats>({
    totalChorales: 0,
    totalUsers: 0,
    totalChants: 0,
    activeChorales: 0,
    newUsersThisMonth: 0,
    newChantsThisMonth: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      // Récupérer les statistiques en parallèle
      const [choralesResult, usersResult, chantsResult] = await Promise.all([
        supabase.from('chorales').select('*', { count: 'exact' }),
        supabase.from('profiles').select('*', { count: 'exact' }),
        supabase.from('chants').select('*', { count: 'exact' })
      ])

      // Chorales actives - utiliser les données déjà récupérées
      const activeChoralesCount = (choralesResult.data || []).filter(c => c.actif === true).length

      // Nouveaux utilisateurs ce mois
      const firstDayOfMonth = new Date()
      firstDayOfMonth.setDate(1)
      firstDayOfMonth.setHours(0, 0, 0, 0)

      const { count: newUsersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth.toISOString())

      // Nouveaux chants ce mois
      const { count: newChantsCount } = await supabase
        .from('chants')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth.toISOString())

      setStats({
        totalChorales: choralesResult.count || 0,
        totalUsers: usersResult.count || 0,
        totalChants: chantsResult.count || 0,
        activeChorales: activeChoralesCount || 0,
        newUsersThisMonth: newUsersCount || 0,
        newChantsThisMonth: newChantsCount || 0
      })
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 100
    return Math.round(((current - previous) / previous) * 100)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Statistiques</h1>
        <p className="text-gray-600 mt-1">Vue d'ensemble des performances du système</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Chargement des statistiques...</p>
        </div>
      ) : (
        <>
          {/* Statistiques principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-blue-100 text-sm">Total Chorales</p>
                  <p className="text-4xl font-bold mt-2">{stats.totalChorales}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Building2 size={32} />
                </div>
              </div>
              <div className="flex items-center text-sm">
                <TrendingUp size={16} className="mr-1" />
                <span>{stats.activeChorales} actives</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-purple-100 text-sm">Total Utilisateurs</p>
                  <p className="text-4xl font-bold mt-2">{stats.totalUsers}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Users size={32} />
                </div>
              </div>
              <div className="flex items-center text-sm">
                <TrendingUp size={16} className="mr-1" />
                <span>+{stats.newUsersThisMonth} ce mois</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-pink-100 text-sm">Total Chants</p>
                  <p className="text-4xl font-bold mt-2">{stats.totalChants}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Music size={32} />
                </div>
              </div>
              <div className="flex items-center text-sm">
                <TrendingUp size={16} className="mr-1" />
                <span>+{stats.newChantsThisMonth} ce mois</span>
              </div>
            </div>
          </div>

          {/* Statistiques détaillées */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Activité ce mois */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                <Activity className="text-blue-600 mr-2" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Activité ce mois</h2>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <Users className="text-blue-600 mr-3" size={20} />
                    <span className="text-gray-700">Nouveaux utilisateurs</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{stats.newUsersThisMonth}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-pink-50 rounded-lg">
                  <div className="flex items-center">
                    <Music className="text-pink-600 mr-3" size={20} />
                    <span className="text-gray-700">Nouveaux chants</span>
                  </div>
                  <span className="text-2xl font-bold text-pink-600">{stats.newChantsThisMonth}</span>
                </div>
              </div>
            </div>

            {/* Taux d'activité */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                <BarChart3 className="text-purple-600 mr-2" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Taux d'activité</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Chorales actives</span>
                    <span className="font-semibold text-gray-900">
                      {stats.totalChorales > 0 
                        ? Math.round((stats.activeChorales / stats.totalChorales) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${stats.totalChorales > 0 
                          ? (stats.activeChorales / stats.totalChorales) * 100 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Croissance utilisateurs</span>
                    <span className="font-semibold text-green-600">
                      +{stats.newUsersThisMonth}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${stats.totalUsers > 0 
                          ? Math.min((stats.newUsersThisMonth / stats.totalUsers) * 100, 100)
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Résumé */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Résumé global</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-blue-100 text-sm mb-1">Moyenne chants/chorale</p>
                <p className="text-3xl font-bold">
                  {stats.totalChorales > 0 
                    ? Math.round(stats.totalChants / stats.totalChorales)
                    : 0}
                </p>
              </div>
              <div>
                <p className="text-blue-100 text-sm mb-1">Moyenne utilisateurs/chorale</p>
                <p className="text-3xl font-bold">
                  {stats.totalChorales > 0 
                    ? Math.round(stats.totalUsers / stats.totalChorales)
                    : 0}
                </p>
              </div>
              <div>
                <p className="text-blue-100 text-sm mb-1">Taux chorales actives</p>
                <p className="text-3xl font-bold">
                  {stats.totalChorales > 0 
                    ? Math.round((stats.activeChorales / stats.totalChorales) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
