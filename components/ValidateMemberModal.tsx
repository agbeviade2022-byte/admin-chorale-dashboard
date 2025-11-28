'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, CheckCircle, AlertCircle } from 'lucide-react'

interface Chorale {
  id: string
  nom: string
  description?: string
}

interface ValidateMemberModalProps {
  isOpen: boolean
  member: any
  onClose: () => void
  onSuccess: () => void
}

export default function ValidateMemberModal({ isOpen, member, onClose, onSuccess }: ValidateMemberModalProps) {
  const [chorales, setChorales] = useState<Chorale[]>([])
  const [selectedChoraleId, setSelectedChoraleId] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingChorales, setLoadingChorales] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchChorales()
      setSelectedChoraleId('') // Reset selection
    }
  }, [isOpen])

  async function fetchChorales() {
    setLoadingChorales(true)
    try {
      const { data, error } = await supabase
        .from('chorales')
        .select('id, nom, description')
        .order('nom')

      if (error) throw error
      setChorales(data || [])
    } catch (error: any) {
      console.error('Erreur chargement chorales:', error)
      alert(`Erreur: ${error.message}`)
    } finally {
      setLoadingChorales(false)
    }
  }

  async function handleValidate() {
    // Validation des champs
    if (!selectedChoraleId) {
      alert('⚠️ Veuillez sélectionner une chorale')
      return
    }

    if (!member?.user_id) {
      console.error('❌ Membre invalide:', member)
      alert('⚠️ Erreur: ID utilisateur manquant. Ce profil est invalide.')
      return
    }

    setLoading(true)
    try {
      // Récupérer l'utilisateur connecté
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('Vous devez être connecté pour valider un membre')
      }

      // Vérifier que le membre n'est pas déjà validé
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('statut_validation, chorale_id')
        .eq('user_id', member.user_id)
        .single()

      if (checkError) {
        console.error('Erreur vérification profil:', checkError)
        throw new Error('Impossible de vérifier le statut du membre')
      }

      if (existingProfile?.statut_validation === 'valide') {
        throw new Error('Ce membre est déjà validé')
      }

      console.log('✅ Validation en cours:', {
        p_user_id: member.user_id,
        p_chorale_id: selectedChoraleId,
        p_validateur_id: user.id,
        membre: member.full_name
      })

      // Appeler la fonction RPC
      const { data, error } = await supabase.rpc('valider_membre', {
        p_user_id: member.user_id,
        p_chorale_id: selectedChoraleId,
        p_validateur_id: user.id,
        p_commentaire: 'Validé via dashboard web'
      })

      if (error) {
        console.error('❌ Erreur RPC:', error)
        throw error
      }

      console.log('✅ Résultat validation:', data)

      // Succès
      alert(`✅ ${member.full_name} a été validé avec succès !`)
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('❌ Erreur validation:', error)
      alert(`❌ Erreur lors de la validation: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-full">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Valider le membre</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              Vous êtes sur le point de valider :
            </p>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="font-semibold text-gray-900 text-lg">{member?.full_name}</p>
              <p className="text-gray-600 text-sm mt-1">{member?.email}</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chorale à assigner <span className="text-red-500">*</span>
            </label>
            {loadingChorales ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Chargement des chorales...</span>
              </div>
            ) : chorales.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-yellow-800 font-medium">Aucune chorale disponible</p>
                    <p className="text-yellow-700 text-sm mt-1">
                      Veuillez créer une chorale avant de valider des membres.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <select
                value={selectedChoraleId}
                onChange={(e) => setSelectedChoraleId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">-- Sélectionner une chorale --</option>
                {chorales.map((chorale) => (
                  <option key={chorale.id} value={chorale.id}>
                    {chorale.nom}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> Une fois validé, le membre pourra se connecter et accéder aux chants de la chorale assignée.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleValidate}
            disabled={loading || !selectedChoraleId || chorales.length === 0}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Validation...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Valider
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
