'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { X, XCircle, AlertTriangle } from 'lucide-react'

interface RejectMemberModalProps {
  isOpen: boolean
  member: any
  onClose: () => void
  onSuccess: () => void
}

export default function RejectMemberModal({ isOpen, member, onClose, onSuccess }: RejectMemberModalProps) {
  const [commentaire, setCommentaire] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReject() {
    if (!member?.user_id) {
      alert('⚠️ Erreur: ID utilisateur manquant')
      return
    }

    // Confirmation
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir refuser ${member.full_name} ?\n\nCette action est définitive.`
    )

    if (!confirmed) return

    setLoading(true)
    try {
      // Récupérer l'utilisateur connecté
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('Vous devez être connecté pour refuser un membre')
      }

      console.log('Refus:', {
        p_user_id: member.user_id,
        p_validateur_id: user.id,
        p_commentaire: commentaire
      })

      // Appeler la fonction RPC
      const { data, error } = await supabase.rpc('refuser_membre', {
        p_user_id: member.user_id,
        p_validateur_id: user.id,
        p_commentaire: commentaire || 'Refusé via dashboard web'
      })

      if (error) {
        console.error('Erreur RPC:', error)
        throw error
      }

      console.log('Résultat refus:', data)

      // Succès
      alert(`✅ ${member.full_name} a été refusé`)
      onSuccess()
      onClose()
      setCommentaire('') // Reset
    } catch (error: any) {
      console.error('Erreur refus:', error)
      alert(`❌ Erreur lors du refus: ${error.message}`)
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
            <div className="bg-red-100 p-2 rounded-full">
              <XCircle className="text-red-600" size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Refuser le membre</h2>
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-red-800 font-medium">Action irréversible</p>
                  <p className="text-red-700 text-sm mt-1">
                    Le membre ne pourra plus se connecter à l'application.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-gray-600 mb-2">
              Vous êtes sur le point de refuser :
            </p>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="font-semibold text-gray-900 text-lg">{member?.full_name}</p>
              <p className="text-gray-600 text-sm mt-1">{member?.email}</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raison du refus <span className="text-gray-400">(optionnel)</span>
            </label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Ex: Documents incomplets, informations incorrectes..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-2">
              Cette raison sera enregistrée dans l'historique des validations.
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
            onClick={handleReject}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Refus en cours...
              </>
            ) : (
              <>
                <XCircle size={20} />
                Refuser
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
