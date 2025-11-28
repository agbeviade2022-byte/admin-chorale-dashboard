'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { UserCheck, UserX, Clock, Search } from 'lucide-react'
import ValidateMemberModal from '@/components/ValidateMemberModal'
import RejectMemberModal from '@/components/RejectMemberModal'

interface PendingMember {
  user_id: string
  email: string
  full_name: string
  telephone?: string
  created_at: string
  statut_validation: string
  jours_attente: number
}

export default function ValidationPage() {
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showValidateModal, setShowValidateModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<PendingMember | null>(null)

  useEffect(() => {
    fetchPendingMembers()
  }, [])

  async function fetchPendingMembers() {
    try {
      // Utiliser la fonction RPC pour récupérer les membres en attente
      const { data, error } = await supabase.rpc('get_membres_en_attente')

      if (error) {
        console.error('Erreur RPC:', error)
        throw error
      }

      // Filtrer les membres sans user_id (sécurité supplémentaire)
      const validMembers = (data || []).filter((member: PendingMember) => {
        if (!member.user_id) {
          console.warn('⚠️ Membre sans user_id ignoré:', member)
          return false
        }
        return true
      })

      console.log(`✅ ${validMembers.length} membre(s) en attente récupéré(s)`)
      setPendingMembers(validMembers)
    } catch (error: any) {
      console.error('Erreur:', error)
      alert(`Erreur: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = pendingMembers.filter(member =>
    member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Validation des membres</h1>
          <p className="text-gray-600 mt-1">Gérer les demandes d'inscription</p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">En attente</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">
                {pendingMembers.length}
              </p>
            </div>
            <Clock className="text-orange-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Moyenne d'attente</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {pendingMembers.length > 0
                  ? Math.round(pendingMembers.reduce((acc, m) => acc + m.jours_attente, 0) / pendingMembers.length)
                  : 0} j
              </p>
            </div>
            <Clock className="text-blue-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Plus ancien</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {pendingMembers.length > 0
                  ? Math.max(...pendingMembers.map(m => m.jours_attente))
                  : 0} j
              </p>
            </div>
            <Clock className="text-red-600" size={24} />
          </div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher un membre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Liste des membres en attente */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Chargement...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <UserCheck className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600 text-lg font-medium">
            {searchTerm ? 'Aucun résultat' : 'Aucun membre en attente'}
          </p>
          {!searchTerm && (
            <p className="text-gray-500 mt-2">Tous les membres ont été validés</p>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredMembers.map((member) => (
            <div key={member.user_id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-full">
                      <UserCheck className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{member.full_name}</h3>
                      <span className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full mt-1">
                        <Clock size={14} className="mr-1" />
                        {member.jours_attente} jour{member.jours_attente > 1 ? 's' : ''} d'attente
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 ml-14">
                    <p className="text-gray-600 flex items-center">
                      <span className="font-medium mr-2">📧 Email:</span>
                      {member.email}
                    </p>
                    {member.telephone && (
                      <p className="text-gray-600 flex items-center">
                        <span className="font-medium mr-2">📱 Téléphone:</span>
                        {member.telephone}
                      </p>
                    )}
                    <p className="text-gray-500 text-sm flex items-center">
                      <span className="font-medium mr-2">📅 Inscrit le:</span>
                      {new Date(member.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 ml-6">
                  <button
                    onClick={() => {
                      setSelectedMember(member)
                      setShowValidateModal(true)
                    }}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
                  >
                    <UserCheck size={20} />
                    Valider
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMember(member)
                      setShowRejectModal(true)
                    }}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
                  >
                    <UserX size={20} />
                    Refuser
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <ValidateMemberModal
        isOpen={showValidateModal}
        member={selectedMember}
        onClose={() => {
          setShowValidateModal(false)
          setSelectedMember(null)
        }}
        onSuccess={fetchPendingMembers}
      />

      <RejectMemberModal
        isOpen={showRejectModal}
        member={selectedMember}
        onClose={() => {
          setShowRejectModal(false)
          setSelectedMember(null)
        }}
        onSuccess={fetchPendingMembers}
      />
    </div>
  )
}
