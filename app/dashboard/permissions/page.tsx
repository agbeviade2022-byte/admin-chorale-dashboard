'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Shield, User, CheckCircle, XCircle, Search } from 'lucide-react'

interface Permission {
  id: string
  code: string
  nom: string
  description: string
  categorie: string
  created_at: string
}

interface UserWithPermissions {
  id: string
  full_name: string
  email: string
  role: string
  permissions: string[]
}

export default function PermissionsPage() {
  const [modules, setModules] = useState<Permission[]>([])
  const [users, setUsers] = useState<UserWithPermissions[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      // Récupérer les modules de permissions
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules_permissions')
        .select('*')
        .order('categorie', { ascending: true })
        .order('nom', { ascending: true })

      if (modulesError) throw modulesError

      // Récupérer les utilisateurs avec leurs permissions
      const { data: usersData, error: usersError } = await supabase
        .rpc('get_all_users_with_emails_debug')

      if (usersError) {
        console.warn('Erreur utilisateurs:', usersError)
      }

      // Récupérer les permissions de chaque utilisateur
      // Filtrer les utilisateurs sans user_id
      const validUsers = (usersData || []).filter((user: any) => user.user_id != null)
      
      const usersWithPerms = await Promise.all(
        validUsers.map(async (user: any) => {
          const { data: permsData } = await supabase
            .from('user_permissions')
            .select('module_code')
            .eq('user_id', user.user_id)

          return {
            id: user.user_id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            permissions: permsData?.map((p: any) => p.module_code) || []
          }
        })
      )

      setModules(modulesData || [])
      setUsers(usersWithPerms)
    } catch (error: any) {
      console.error('Erreur:', error)
      // Erreur affichée dans la console uniquement
    } finally {
      setLoading(false)
    }
  }

  async function togglePermission(userId: string, moduleCode: string, hasPermission: boolean) {
    try {
      console.log('🔍 Toggle permission:', { userId, moduleCode, hasPermission })
      
      // Vérifier que l'utilisateur existe dans profiles
      const { data: profileCheck, error: checkError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .eq('user_id', userId)
        .single()
      
      if (checkError || !profileCheck) {
        console.error('❌ Utilisateur introuvable dans profiles:', userId)
        console.error('Erreur détaillée:', checkError)
        throw new Error(`Utilisateur ${userId} introuvable dans la base de données`)
      }
      
      console.log('✅ Utilisateur trouvé:', profileCheck.full_name)
      console.log('✅ user_id vérifié:', profileCheck.user_id)
      
      if (hasPermission) {
        // Révoquer la permission
        console.log('🗑️ Tentative de révocation...')
        const { error } = await supabase
          .from('user_permissions')
          .delete()
          .eq('user_id', userId)
          .eq('module_code', moduleCode)

        if (error) {
          console.error('❌ Erreur lors de la révocation:', error)
          throw error
        }
        console.log('✅ Permission révoquée')
      } else {
        // Attribuer la permission
        console.log('➕ Tentative d\'attribution...')
        console.log('Données à insérer:', { user_id: userId, module_code: moduleCode })
        
        // Vérifier si la permission existe déjà
        const { data: existingPerm, error: checkPermError } = await supabase
          .from('user_permissions')
          .select('*')
          .eq('user_id', userId)
          .eq('module_code', moduleCode)
          .maybeSingle()
        
        if (checkPermError) {
          console.error('❌ Erreur lors de la vérification:', checkPermError)
        }
        
        if (existingPerm) {
          console.log('⚠️ Permission déjà existante, pas besoin de l\'ajouter')
          fetchData()
          return
        }
        
        const { error, data: insertedData } = await supabase
          .from('user_permissions')
          .insert({
            user_id: userId,
            module_code: moduleCode
          })
          .select()

        if (error) {
          console.error('❌ Erreur lors de l\'insertion:', error)
          console.error('Code erreur:', error.code)
          console.error('Message:', error.message)
          console.error('Détails:', error.details)
          throw error
        }
        console.log('✅ Permission attribuée:', insertedData)
      }

      // Rafraîchir les données
      fetchData()
    } catch (error: any) {
      console.error('❌ Erreur complète:', error)
      // Afficher l'erreur à l'utilisateur
      if (error.message) {
        alert(`Erreur: ${error.message}\n\nConsultez la console pour plus de détails (F12)`)
      }
    }
  }

  const categories = ['all', ...Array.from(new Set(modules.map(m => m.categorie)))]
  const filteredModules = modules.filter(m => 
    (selectedCategory === 'all' || m.categorie === selectedCategory) &&
    (m.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
     m.code.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Gestion des Chants': 'bg-blue-100 text-blue-800',
      'Gestion des Membres': 'bg-green-100 text-green-800',
      'Gestion des Chorales': 'bg-purple-100 text-purple-800',
      'Administration': 'bg-red-100 text-red-800',
      'Statistiques': 'bg-yellow-100 text-yellow-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Modules de Permissions</h1>
        <p className="text-gray-600 mt-1">Gérer les permissions des utilisateurs</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Modules</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{modules.length}</p>
            </div>
            <Shield className="text-blue-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Catégories</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{categories.length - 1}</p>
            </div>
            <Shield className="text-purple-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Utilisateurs</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{users.length}</p>
            </div>
            <User className="text-green-600" size={24} />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher un module..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? 'Toutes' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des modules */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Module
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                {users.filter(u => u.role !== 'membre').map(user => (
                  <th key={user.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex flex-col items-center">
                      <span className="font-semibold">{user.full_name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full mt-1 ${
                        user.role === 'super_admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'admin' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredModules.map((module) => (
                <tr key={module.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{module.nom}</div>
                      <div className="text-xs text-gray-500">{module.code}</div>
                      <div className="text-xs text-gray-400 mt-1">{module.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(module.categorie)}`}>
                      {module.categorie}
                    </span>
                  </td>
                  {users.filter(u => u.role !== 'membre').map(user => {
                    const hasPermission = user.permissions.includes(module.code)
                    const isSuperAdmin = user.role === 'super_admin'
                    
                    return (
                      <td key={user.id} className="px-6 py-4 text-center">
                        {isSuperAdmin ? (
                          <CheckCircle className="inline text-green-600" size={24} />
                        ) : (
                          <button
                            onClick={() => togglePermission(user.id, module.code, hasPermission)}
                            className={`p-2 rounded-lg transition-colors ${
                              hasPermission
                                ? 'bg-green-100 hover:bg-green-200'
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            {hasPermission ? (
                              <CheckCircle className="text-green-600" size={20} />
                            ) : (
                              <XCircle className="text-gray-400" size={20} />
                            )}
                          </button>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Légende */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Légende</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <CheckCircle className="inline text-green-600" size={16} /> = Permission active</li>
          <li>• <XCircle className="inline text-gray-400" size={16} /> = Permission inactive (cliquez pour activer)</li>
          <li>• Les Super Admins ont automatiquement toutes les permissions</li>
        </ul>
      </div>
    </div>
  )
}
