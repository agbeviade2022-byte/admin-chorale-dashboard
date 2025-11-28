'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, AlertTriangle } from 'lucide-react'

interface User {
  id: string
  full_name: string
  email?: string
  role: string
}

interface DeleteUserModalProps {
  isOpen: boolean
  user: User | null
  onClose: () => void
  onSuccess: () => void
}

export default function DeleteUserModal({ isOpen, user, onClose, onSuccess }: DeleteUserModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmText, setConfirmText] = useState('')

  useEffect(() => {
    if (isOpen && user) {
      console.log('🗑️ DeleteUserModal ouvert avec user:', user)
      setConfirmText('')
      setError('')
    }
  }, [isOpen, user])

  const handleDelete = async () => {
    console.log('🗑️ handleDelete appelé - user:', user, 'confirmText:', confirmText)

    if (!user) {
      console.error('❌ Pas d\'utilisateur sélectionné')
      return
    }

    // Vérification du texte de confirmation
    if (confirmText !== 'SUPPRIMER') {
      setError('Veuillez taper "SUPPRIMER" pour confirmer')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Utiliser user_id si disponible, sinon id
      const userId = (user as any).user_id || user.id
      
      // 1. Supprimer les permissions de l'utilisateur
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userId)

      // 2. Supprimer le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId)

      if (profileError) throw profileError

      // 3. Supprimer l'utilisateur auth (via RPC si disponible)
      // Note: La suppression dans auth.users nécessite des permissions spéciales
      // Pour l'instant, on supprime juste le profil
      // L'utilisateur ne pourra plus se connecter car son profil n'existe plus

      // Succès - pas de pop-up
      onSuccess()
      handleClose()
    } catch (err: any) {
      console.error('Erreur:', err)
      setError(err.message || 'Erreur lors de la suppression')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setConfirmText('')
    setError('')
    onClose()
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-red-200 bg-red-50">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="text-red-600" size={24} />
            <h2 className="text-2xl font-bold text-red-600">Supprimer l'utilisateur</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Warning */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-semibold mb-2">
              ⚠️ Attention : Cette action est irréversible !
            </p>
            <p className="text-sm text-red-700">
              Toutes les données associées à cet utilisateur seront supprimées définitivement.
            </p>
          </div>

          {/* User info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Utilisateur à supprimer :</p>
            <p className="font-semibold text-gray-900">{user.full_name}</p>
            <p className="text-sm text-gray-600">{user.email}</p>
            <p className="text-xs text-gray-500 mt-1">Rôle : {user.role}</p>
          </div>

          {/* Confirmation input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pour confirmer, tapez <span className="font-bold text-red-600">SUPPRIMER</span>
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="SUPPRIMER"
              autoComplete="off"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => {
                console.log('🖱️ Bouton Supprimer cliqué')
                handleDelete()
              }}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              disabled={loading || confirmText !== 'SUPPRIMER'}
            >
              {loading ? 'Suppression...' : 'Supprimer définitivement'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
