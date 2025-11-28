'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Building2, Users, Music, Plus, Search } from 'lucide-react'
import CreateChoraleModal from '@/components/CreateChoraleModal'
import EditChoraleModal from '@/components/EditChoraleModal'
import DeleteChoraleModal from '@/components/DeleteChoraleModal'
import type { Chorale } from '@/types/chorale'

export default function ChoralesPage() {
  const [chorales, setChorales] = useState<Chorale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedChorale, setSelectedChorale] = useState<Chorale | null>(null)

  useEffect(() => {
    fetchChorales()
  }, [])

  async function fetchChorales() {
    try {
      const { data, error } = await supabase
        .from('chorales')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Récupérer le nombre de membres et chants pour chaque chorale
      const choralesWithStats = await Promise.all(
        (data || []).map(async (chorale) => {
          const [membresResult, chantsResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('id', { count: 'exact', head: true })
              .eq('chorale_id', chorale.id),
            supabase
              .from('chants')
              .select('id', { count: 'exact', head: true })
          ])

          return {
            ...chorale,
            nb_membres: membresResult.count || 0,
            nb_chants: chantsResult.count || 0
          }
        })
      )

      setChorales(choralesWithStats)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredChorales = chorales.filter(chorale =>
    chorale.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chorale.ville?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateChorale = () => {
    setShowCreateModal(true)
  }

  const handleViewChorale = (chorale: Chorale) => {
    alert(`Détails de la chorale:\n\nNom: ${chorale.nom}\nVille: ${chorale.ville}\nPays: ${chorale.pays}\nMembres: ${chorale.nb_membres}\nChants: ${chorale.nb_chants}\nStatut: ${(chorale.statut === 'actif' || chorale.actif) ? 'Active' : 'Inactive'}`)
  }

  const handleEditChorale = (chorale: Chorale) => {
    setSelectedChorale(chorale)
    setShowEditModal(true)
  }

  const handleToggleStatus = async (chorale: Chorale) => {
    try {
      const newStatut = (chorale.statut === 'actif' || chorale.actif) ? 'inactif' : 'actif'
      const { error } = await supabase
        .from('chorales')
        .update({ statut: newStatut, updated_at: new Date().toISOString() })
        .eq('id', chorale.id)

      if (error) throw error

      // Rafraîchir la liste
      fetchChorales()
      alert(`✅ Chorale "${chorale.nom}" ${newStatut === 'actif' ? 'activée' : 'désactivée'} avec succès !`)
    } catch (error) {
      console.error('Erreur:', error)
      alert('❌ Erreur lors de la modification du statut')
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chorales</h1>
          <p className="text-gray-600 mt-1">Gérer toutes les chorales du système</p>
        </div>
        <button 
          onClick={handleCreateChorale}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition"
        >
          <Plus size={20} />
          Nouvelle chorale
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher une chorale..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total chorales</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{chorales.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Building2 className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Chorales actives</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {chorales.filter(c => c.statut === 'actif' || c.actif).length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Building2 className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total membres</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {chorales.reduce((acc, c) => acc + (c.nb_membres || 0), 0)}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Users className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Liste des chorales */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Chargement...</p>
        </div>
      ) : filteredChorales.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Building2 className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm ? 'Aucune chorale trouvée' : 'Aucune chorale'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm 
              ? 'Essayez avec d\'autres termes de recherche'
              : 'Commencez par créer votre première chorale'
            }
          </p>
          {!searchTerm && (
            <button 
              onClick={handleCreateChorale}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Créer une chorale
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chorale
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Localisation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Membres
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredChorales.map((chorale) => (
                <tr key={chorale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg mr-3">
                        <Building2 className="text-white" size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{chorale.nom}</div>
                        <div className="text-sm text-gray-500">{chorale.description?.substring(0, 50)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{chorale.ville}</div>
                    <div className="text-sm text-gray-500">{chorale.pays}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Users size={16} className="mr-1 text-gray-400" />
                      {chorale.nb_membres || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Music size={16} className="mr-1 text-gray-400" />
                      {chorale.nb_chants || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      (chorale.statut === 'actif' || chorale.actif)
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {(chorale.statut === 'actif' || chorale.actif) ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button 
                      onClick={() => handleViewChorale(chorale)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Voir
                    </button>
                    <button 
                      onClick={() => handleEditChorale(chorale)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Modifier
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(chorale)}
                      className={`${(chorale.statut === 'actif' || chorale.actif) ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'} mr-3`}
                    >
                      {(chorale.statut === 'actif' || chorale.actif) ? 'Désactiver' : 'Activer'}
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedChorale(chorale)
                        setShowDeleteModal(true)
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <CreateChoraleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchChorales}
      />

      <EditChoraleModal
        isOpen={showEditModal}
        chorale={selectedChorale}
        onClose={() => {
          setShowEditModal(false)
          setSelectedChorale(null)
        }}
        onSuccess={fetchChorales}
      />

      <DeleteChoraleModal
        isOpen={showDeleteModal}
        chorale={selectedChorale}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedChorale(null)
        }}
        onSuccess={fetchChorales}
      />
    </div>
  )
}
