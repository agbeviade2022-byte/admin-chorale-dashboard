'use client'
import { useState, useEffect } from 'react'
import { Users, Search, Shield, User, Plus } from 'lucide-react'
import EditUserModal from '@/components/EditUserModal'
import DeleteUserModal from '@/components/DeleteUserModal'
import CreateUserModal from '@/components/CreateUserModal'
import { useRouter } from 'next/navigation'

interface UserProfile {
  id: string
  user_id?: string
  full_name: string
  role: string
  created_at: string
  email?: string
  chorale_id?: string
  chorale_nom?: string
}

interface UsersClientProps {
  initialUsers: UserProfile[]
}

export default function UsersClient({ initialUsers }: UsersClientProps) {
  const [users, setUsers] = useState<UserProfile[]>(initialUsers)
  
  // Mettre à jour quand les props changent
  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])
  const [searchTerm, setSearchTerm] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const router = useRouter()

  const refreshUsers = () => {
    router.refresh() // Rafraîchit les données côté serveur
  }

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.chorale_nom?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleBadge = (role: string) => {
    const styles = {
      admin: 'bg-purple-100 text-purple-800',
      super_admin: 'bg-red-100 text-red-800',
      user: 'bg-blue-100 text-blue-800',
      membre: 'bg-green-100 text-green-800'
    }
    return styles[role as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-gray-600 mt-1">Gérer tous les utilisateurs du système</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium shadow hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un utilisateur
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
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
              <p className="text-gray-600 text-sm">Total utilisateurs</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{users.length}</p>
            </div>
            <Users className="text-blue-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Admins</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {users.filter(u => u.role === 'admin' || u.role === 'super_admin').length}
              </p>
            </div>
            <Shield className="text-purple-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Membres</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {users.filter(u => u.role === 'membre').length}
              </p>
            </div>
            <User className="text-green-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Utilisateurs</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {users.filter(u => u.role === 'user').length}
              </p>
            </div>
            <User className="text-blue-600" size={24} />
          </div>
        </div>
      </div>

      {/* Liste des utilisateurs - PAS DE LOADING, données déjà là */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utilisateur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rôle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chorale
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Inscription
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.user_id || user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-full mr-3">
                      <User className="text-white" size={20} />
                    </div>
                    <div className="text-sm font-medium text-gray-900">{user.full_name || 'Sans nom'}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.chorale_nom ? (
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {user.chorale_nom}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Aucune chorale</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button 
                    onClick={() => {
                      setSelectedUser(user)
                      setShowEditModal(true)
                    }}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Modifier
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedUser(user)
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

      {/* Modals */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={refreshUsers}
      />
      
      <EditUserModal
        isOpen={showEditModal}
        user={selectedUser}
        onClose={() => {
          setShowEditModal(false)
          setSelectedUser(null)
        }}
        onSuccess={refreshUsers}
      />

      <DeleteUserModal
        isOpen={showDeleteModal}
        user={selectedUser}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedUser(null)
        }}
        onSuccess={refreshUsers}
      />
    </div>
  )
}
