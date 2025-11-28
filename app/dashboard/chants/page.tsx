'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Music, Search, Building2, User } from 'lucide-react'
import EditChantModal from '@/components/EditChantModal'

interface Chant {
  id: string
  titre: string
  compositeur: string
  paroles: string
  audio_url: string
  duree: number
  langue: string
  categorie: string
  pupitre: string
  chorale_id: string
  created_at: string
  chorale_nom?: string
}

export default function ChantsPage() {
  const [chants, setChants] = useState<Chant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedChant, setSelectedChant] = useState<Chant | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    fetchChants()
  }, [])

  async function fetchChants() {
    try {
      // Toujours utiliser 2 requêtes (simple et fiable)
      const { data: chantsData, error: chantsError } = await supabase
        .from('chants')
        .select('*')
        .order('created_at', { ascending: false })

      if (chantsError) throw chantsError

      // Récupérer toutes les chorales
      const { data: choralesData } = await supabase
        .from('chorales')
        .select('id, nom')

      // Créer un map pour accès rapide
      const choralesMap = new Map(
        (choralesData || []).map((c: any) => [c.id, c.nom])
      )

      // Formater les données
      const chantsWithChorale = (chantsData || []).map((chant: any) => ({
        ...chant,
        chorale_nom: choralesMap.get(chant.chorale_id) || 'Sans chorale'
      }))

      setChants(chantsWithChorale)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredChants = chants.filter(chant =>
    chant.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chant.compositeur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chant.chorale_nom?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  function handleEcouter(chant: Chant) {
    if (chant.audio_url) {
      // Ouvrir l'audio dans un nouvel onglet
      window.open(chant.audio_url, '_blank')
    } else {
      alert('Aucun fichier audio disponible pour ce chant')
    }
  }

  function handleModifier(chant: Chant) {
    setSelectedChant(chant)
    setShowEditModal(true)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chants</h1>
          <p className="text-gray-600 mt-1">Gérer tous les chants du système</p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher un chant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total chants</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{chants.length}</p>
            </div>
            <Music className="text-blue-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Soprano</p>
              <p className="text-3xl font-bold text-pink-600 mt-1">
                {chants.filter(c => c.pupitre === 'soprano').length}
              </p>
            </div>
            <User className="text-pink-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Alto</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {chants.filter(c => c.pupitre === 'alto').length}
              </p>
            </div>
            <User className="text-purple-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Ténor/Basse</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {chants.filter(c => c.pupitre === 'tenor' || c.pupitre === 'basse').length}
              </p>
            </div>
            <User className="text-blue-600" size={24} />
          </div>
        </div>
      </div>

      {/* Liste des chants */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Chargement...</p>
        </div>
      ) : filteredChants.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Music className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm ? 'Aucun chant trouvé' : 'Aucun chant'}
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? 'Essayez avec d\'autres termes de recherche'
              : 'Les chants seront ajoutés via l\'application mobile'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chorale
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pupitre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredChants.map((chant) => (
                <tr key={chant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg mr-3">
                        <Music className="text-white" size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{chant.titre}</div>
                        <div className="text-sm text-gray-500">{chant.categorie}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Building2 size={16} className="mr-1 text-gray-400" />
                      {chant.chorale_nom}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      chant.pupitre === 'soprano' ? 'bg-pink-100 text-pink-800' :
                      chant.pupitre === 'alto' ? 'bg-purple-100 text-purple-800' :
                      chant.pupitre === 'tenor' ? 'bg-blue-100 text-blue-800' :
                      chant.pupitre === 'basse' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {chant.pupitre || 'Tous'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {chant.duree ? formatDuration(chant.duree) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button 
                      onClick={() => handleEcouter(chant)}
                      className="text-blue-600 hover:text-blue-900 mr-3 font-medium"
                    >
                      Écouter
                    </button>
                    <button 
                      onClick={() => handleModifier(chant)}
                      className="text-gray-600 hover:text-gray-900 font-medium"
                    >
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de modification */}
      {selectedChant && (
        <EditChantModal
          chant={selectedChant}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedChant(null)
          }}
          onSuccess={() => {
            fetchChants() // Recharger les chants
          }}
        />
      )}
    </div>
  )
}
