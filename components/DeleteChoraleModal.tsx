'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { X, AlertTriangle } from 'lucide-react'
import type { Chorale } from '@/types/chorale'

interface DeleteChoraleModalProps {
  isOpen: boolean
  chorale: Chorale | null
  onClose: () => void
  onSuccess: () => void
}

export default function DeleteChoraleModal({ isOpen, chorale, onClose, onSuccess }: DeleteChoraleModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmText, setConfirmText] = useState('')

  const handleDelete = async () => {
    if (!chorale) return

    // Vérification du texte de confirmation
    if (confirmText !== 'SUPPRIMER') {
      setError('Veuillez taper "SUPPRIMER" pour confirmer')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Supprimer la chorale
      const { error: deleteError } = await supabase
        .from('chorales')
        .delete()
        .eq('id', chorale.id)

      if (deleteError) throw deleteError

      // Succès
      alert(`✅ Chorale "${chorale.nom}" supprimée avec succès !`)
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

  if (!isOpen || !chorale) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-red-200 bg-red-50">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="text-red-600" size={24} />
            <h2 className="text-2xl font-bold text-red-600">Supprimer la chorale</h2>
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
              Toutes les données associées à cette chorale seront supprimées définitivement (membres, chants, etc.).
            </p>
          </div>

          {/* Chorale info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Chorale à supprimer :</p>
            <p className="font-semibold text-gray-900">{chorale.nom}</p>
            {chorale.ville && <p className="text-sm text-gray-600">{chorale.ville}, {chorale.pays}</p>}
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
              onClick={handleDelete}
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
