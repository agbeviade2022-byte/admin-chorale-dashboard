'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X } from 'lucide-react'

interface User {
  id: string
  full_name: string
  role: string
  email?: string
  chorale_id?: string
  chorale_nom?: string
}

interface Chorale {
  id: string
  nom: string
}

interface EditUserModalProps {
  isOpen: boolean
  user: User | null
  onClose: () => void
  onSuccess: () => void
}

export default function EditUserModal({ isOpen, user, onClose, onSuccess }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    role: 'user',
    chorale_id: '',
  })
  const [chorales, setChorales] = useState<Chorale[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && user) {
      console.log('🔍 EditUserModal ouvert avec user:', user)
      setFormData({
        full_name: user.full_name || '',
        role: user.role || 'user',
        chorale_id: user.chorale_id || '',
      })
      fetchChorales()
    }
  }, [isOpen, user])

  async function fetchChorales() {
    try {
      const { data, error } = await supabase
        .from('chorales')
        .select('id, nom')
        .order('nom')
      
      if (error) throw error
      setChorales(data || [])
    } catch (err) {
      console.error('Erreur chargement chorales:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('📝 handleSubmit appelé - user:', user, 'formData:', formData)
    
    if (!user) {
      console.error('❌ Pas d\'utilisateur sélectionné')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Validation
      if (!formData.full_name.trim()) {
        throw new Error('Le nom est requis')
      }
      
      console.log('✅ Validation OK, début de la mise à jour...')

      // Vérifier si le rôle a changé
      const roleChanged = user.role !== formData.role
      
      // Si le rôle change vers admin, afficher un message informatif
      if (roleChanged && formData.role === 'admin' && user.role !== 'admin') {
        const confirmChange = window.confirm(
          `⚠️ CHANGEMENT DE RÔLE\n\n` +
          `Vous allez changer "${user.full_name}" de "${user.role}" vers "admin".\n\n` +
          `✅ Impact :\n` +
          `• L'utilisateur apparaîtra dans la page "Permissions"\n` +
          `• Vous pourrez lui attribuer des permissions spécifiques\n` +
          `• Il aura accès au dashboard admin\n\n` +
          `Confirmer ce changement ?`
        )
        
        if (!confirmChange) {
          setLoading(false)
          return
        }
      }
      
      // Si le rôle change de admin vers membre, avertir
      if (roleChanged && user.role === 'admin' && formData.role === 'membre') {
        const confirmChange = window.confirm(
          `⚠️ RETRAIT DES DROITS ADMIN\n\n` +
          `Vous allez retirer les droits admin de "${user.full_name}".\n\n` +
          `❌ Impact :\n` +
          `• L'utilisateur disparaîtra de la page "Permissions"\n` +
          `• Toutes ses permissions admin seront supprimées\n` +
          `• Il n'aura plus accès au dashboard admin\n\n` +
          `Confirmer ce changement ?`
        )
        
        if (!confirmChange) {
          setLoading(false)
          return
        }
        
        // Supprimer toutes les permissions de cet utilisateur
        const userId = (user as any).user_id || user.id
        await supabase
          .from('user_permissions')
          .delete()
          .eq('user_id', userId)
      }

      // Mettre à jour le profil
      const userId = (user as any).user_id || user.id
      console.log('💾 Mise à jour du profil - userId:', userId, 'formData:', formData)
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          role: formData.role,
          chorale_id: formData.chorale_id || null,
        })
        .eq('user_id', userId)

      if (updateError) {
        console.error('❌ Erreur de mise à jour:', updateError)
        throw updateError
      }
      
      console.log('✅ Mise à jour réussie !')

      // Message de succès selon le changement
      if (roleChanged) {
        if (formData.role === 'admin') {
          alert(
            `✅ Rôle modifié avec succès !\n\n` +
            `"${user.full_name}" est maintenant administrateur.\n\n` +
            `👉 Allez dans "Permissions" pour lui attribuer des permissions spécifiques.`
          )
        } else if (formData.role === 'super_admin') {
          alert(
            `✅ Rôle modifié avec succès !\n\n` +
            `"${user.full_name}" est maintenant super administrateur.\n\n` +
            `⚠️ Il a maintenant TOUTES les permissions automatiquement.`
          )
        } else {
          alert(`✅ Rôle modifié avec succès !`)
        }
      }

      // Succès
      console.log('🎉 Appel de onSuccess() et fermeture du modal')
      onSuccess()
      handleClose()
    } catch (err: any) {
      console.error('❌ Erreur attrapée:', err)
      setError(err.message || 'Erreur lors de la modification')
    } finally {
      console.log('🏁 Fin de handleSubmit - loading:', false)
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError('')
    onClose()
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Modifier l'utilisateur</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email (lecture seule) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={user.email || 'N/A'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
          </div>

          {/* Nom complet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom complet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Jean Dupont"
              required
            />
          </div>

          {/* Rôle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rôle <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="user">Utilisateur</option>
              <option value="membre">Membre</option>
              <option value="admin">Administrateur</option>
              <option value="super_admin">Super Administrateur</option>
            </select>
            
            {/* Description détaillée du rôle */}
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              {formData.role === 'super_admin' && (
                <div>
                  <p className="text-sm font-semibold text-red-600 mb-1">🔴 Super Administrateur</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>✅ Toutes les permissions automatiquement</li>
                    <li>✅ Gère les autres administrateurs</li>
                    <li>✅ Accès complet au système</li>
                    <li>⚠️ Ne peut pas être personnalisé dans "Permissions"</li>
                  </ul>
                </div>
              )}
              {formData.role === 'admin' && (
                <div>
                  <p className="text-sm font-semibold text-orange-600 mb-1">🟠 Administrateur</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>✅ Apparaît dans la page "Permissions"</li>
                    <li>✅ Permissions personnalisables</li>
                    <li>✅ Accès au dashboard admin</li>
                    <li>👉 Allez dans "Permissions" pour configurer</li>
                  </ul>
                </div>
              )}
              {formData.role === 'membre' && (
                <div>
                  <p className="text-sm font-semibold text-green-600 mb-1">🟢 Membre</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>✅ Membre d'une chorale</li>
                    <li>✅ Accès aux chants de sa chorale</li>
                    <li>❌ Aucune permission admin</li>
                    <li>❌ N'apparaît pas dans "Permissions"</li>
                  </ul>
                </div>
              )}
              {formData.role === 'user' && (
                <div>
                  <p className="text-sm font-semibold text-blue-600 mb-1">🔵 Utilisateur</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>✅ Utilisateur standard</li>
                    <li>✅ Accès de base à l'application</li>
                    <li>❌ Aucune permission admin</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Chorale */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chorale
            </label>
            <select
              value={formData.chorale_id}
              onChange={(e) => setFormData({ ...formData, chorale_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Aucune chorale</option>
              {chorales.map((chorale) => (
                <option key={chorale.id} value={chorale.id}>
                  {chorale.nom}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.chorale_id ? (
                <span className="text-green-600">
                  ✅ L'utilisateur aura accès aux chants de cette chorale
                </span>
              ) : (
                <span className="text-gray-400">
                  ⚠️ Sans chorale, l'utilisateur n'aura accès à aucun chant
                </span>
              )}
            </p>
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
              type="submit"
              onClick={() => console.log('🖱️ Bouton Enregistrer cliqué')}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Modification...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
