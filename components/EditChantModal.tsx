'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Music, User, Building2, Globe, Clock } from 'lucide-react'

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

interface Chorale {
  id: string
  nom: string
}

interface EditChantModalProps {
  chant: Chant
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function EditChantModal({ chant, isOpen, onClose, onSuccess }: EditChantModalProps) {
  const [formData, setFormData] = useState({
    titre: chant.titre || '',
    compositeur: chant.compositeur || '',
    paroles: chant.paroles || '',
    audio_url: chant.audio_url || '',
    duree: chant.duree || 0,
    langue: chant.langue || '',
    categorie: chant.categorie || '',
    pupitre: chant.pupitre || '',
    chorale_id: chant.chorale_id || ''
  })
  
  const [chorales, setChorales] = useState<Chorale[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchChorales()
      // Réinitialiser le formulaire avec les données du chant
      setFormData({
        titre: chant.titre || '',
        compositeur: chant.compositeur || '',
        paroles: chant.paroles || '',
        audio_url: chant.audio_url || '',
        duree: chant.duree || 0,
        langue: chant.langue || '',
        categorie: chant.categorie || '',
        pupitre: chant.pupitre || '',
        chorale_id: chant.chorale_id || ''
      })
      setError(null)
    }
  }, [isOpen, chant])

  async function fetchChorales() {
    try {
      const { data, error } = await supabase
        .from('chorales')
        .select('id, nom')
        .order('nom')

      if (error) throw error
      setChorales(data || [])
    } catch (err: any) {
      console.error('Erreur chargement chorales:', err)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validation
      if (!formData.titre.trim()) {
        throw new Error('Le titre est requis')
      }

      if (!formData.chorale_id) {
        throw new Error('Veuillez sélectionner une chorale')
      }

      // Préparer les données à mettre à jour (ULTRA-MINIMAL)
      const updateData: any = {
        titre: formData.titre.trim(),
        chorale_id: formData.chorale_id
      }

      console.log('📝 Données à mettre à jour:', updateData)
      console.log('⚠️ Compositeur ignoré car colonne n\'existe pas')

      // Mettre à jour le chant
      const { error: updateError } = await supabase
        .from('chants')
        .update(updateData)
        .eq('id', chant.id)

      if (updateError) throw updateError

      // Succès
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Erreur modification:', err)
      setError(err.message || 'Erreur lors de la modification')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
              <Music className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Modifier le chant</h2>
              <p className="text-sm text-gray-600">{chant.titre}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre *
            </label>
            <input
              type="text"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Chorale */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="inline mr-1" size={16} />
              Chorale *
            </label>
            <select
              value={formData.chorale_id}
              onChange={(e) => setFormData({ ...formData, chorale_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Sélectionner une chorale</option>
              {chorales.map((chorale) => (
                <option key={chorale.id} value={chorale.id}>
                  {chorale.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Note importante */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800 font-medium mb-2">
              ⚠️ Modification très limitée
            </p>
            <p className="text-sm text-yellow-700">
              Seuls le <strong>titre</strong> et la <strong>chorale</strong> peuvent être modifiés depuis le dashboard.
              Tous les autres champs (compositeur, pupitre, catégorie, langue, durée, paroles, audio) sont gérés via l'application mobile Flutter.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
