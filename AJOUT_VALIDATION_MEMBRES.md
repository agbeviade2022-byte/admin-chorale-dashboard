# 🔧 AJOUT: Validation des membres dans le dashboard web

## 🎯 OBJECTIF

Ajouter la fonctionnalité de **validation des membres** dans le dashboard web admin pour que les super admins et admins puissent:
- ✅ Voir les membres en attente de validation
- ✅ Valider un membre et lui attribuer une chorale
- ✅ Refuser un membre
- ✅ Voir l'historique des validations

---

## 📊 ÉTAT ACTUEL

### **Page existante:** `/dashboard/users`

**Fonctionnalités actuelles:**
- ✅ Liste de tous les utilisateurs
- ✅ Recherche par nom/email
- ✅ Statistiques (total, admins, membres)
- ✅ Modifier le rôle d'un utilisateur
- ✅ Supprimer un utilisateur

**Manquant:**
- ❌ Affichage du `statut_validation`
- ❌ Filtrage par statut (en_attente, valide, refuse)
- ❌ Bouton "Valider" avec attribution de chorale
- ❌ Bouton "Refuser" avec commentaire
- ❌ Vue dédiée aux membres en attente

---

## 🚀 SOLUTION PROPOSÉE

### **Option 1: Ajouter une nouvelle page** ⭐ RECOMMANDÉ

Créer une page dédiée: `/dashboard/validation`

**Avantages:**
- ✅ Interface claire et dédiée
- ✅ Ne modifie pas la page users existante
- ✅ Meilleure UX pour les admins

---

### **Option 2: Modifier la page users existante**

Ajouter des onglets dans `/dashboard/users`:
- Tous les utilisateurs
- En attente de validation
- Validés
- Refusés

---

## 📋 FONCTIONNALITÉS À IMPLÉMENTER

### **1. Nouvelle page: `/dashboard/validation`**

**Fichier à créer:** `app/dashboard/validation/page.tsx`

**Contenu:**
```tsx
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
      const { data, error } = await supabase
        .from('membres_en_attente')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPendingMembers(data || [])
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
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Liste des membres en attente */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <UserCheck className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">Aucun membre en attente</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredMembers.map((member) => (
            <div key={member.user_id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{member.full_name}</h3>
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                      {member.jours_attente} jour(s)
                    </span>
                  </div>
                  <p className="text-gray-600 mb-1">📧 {member.email}</p>
                  {member.telephone && (
                    <p className="text-gray-600 mb-1">📱 {member.telephone}</p>
                  )}
                  <p className="text-gray-500 text-sm">
                    Inscrit le {new Date(member.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedMember(member)
                      setShowValidateModal(true)
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <UserCheck size={20} />
                    Valider
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMember(member)
                      setShowRejectModal(true)
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
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
```

---

### **2. Modal de validation**

**Fichier à créer:** `components/ValidateMemberModal.tsx`

```tsx
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X } from 'lucide-react'

interface Chorale {
  id: string
  nom: string
}

export default function ValidateMemberModal({ isOpen, member, onClose, onSuccess }: any) {
  const [chorales, setChorales] = useState<Chorale[]>([])
  const [selectedChoraleId, setSelectedChoraleId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchChorales()
    }
  }, [isOpen])

  async function fetchChorales() {
    const { data } = await supabase
      .from('chorales')
      .select('id, nom')
      .order('nom')
    setChorales(data || [])
  }

  async function handleValidate() {
    if (!selectedChoraleId) {
      alert('Veuillez sélectionner une chorale')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase.rpc('valider_membre', {
        p_user_id: member.user_id,
        p_chorale_id: selectedChoraleId,
        p_validateur_id: user?.id,
        p_commentaire: 'Validé via dashboard web'
      })

      if (error) throw error

      alert('✅ Membre validé avec succès')
      onSuccess()
      onClose()
    } catch (error: any) {
      alert(`Erreur: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Valider le membre</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          Valider <strong>{member?.full_name}</strong> et l'assigner à une chorale :
        </p>

        <select
          value={selectedChoraleId}
          onChange={(e) => setSelectedChoraleId(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4"
        >
          <option value="">Sélectionner une chorale</option>
          {chorales.map((chorale) => (
            <option key={chorale.id} value={chorale.id}>
              {chorale.nom}
            </option>
          ))}
        </select>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleValidate}
            disabled={loading || !selectedChoraleId}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Validation...' : 'Valider'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

### **3. Modal de refus**

**Fichier à créer:** `components/RejectMemberModal.tsx`

```tsx
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { X } from 'lucide-react'

export default function RejectMemberModal({ isOpen, member, onClose, onSuccess }: any) {
  const [commentaire, setCommentaire] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReject() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase.rpc('refuser_membre', {
        p_user_id: member.user_id,
        p_validateur_id: user?.id,
        p_commentaire: commentaire || 'Refusé via dashboard web'
      })

      if (error) throw error

      alert('✅ Membre refusé')
      onSuccess()
      onClose()
    } catch (error: any) {
      alert(`Erreur: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Refuser le membre</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          Êtes-vous sûr de vouloir refuser <strong>{member?.full_name}</strong> ?
        </p>

        <textarea
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          placeholder="Raison du refus (optionnel)"
          className="w-full p-3 border border-gray-300 rounded-lg mb-4"
          rows={3}
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Refus...' : 'Refuser'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

### **4. Ajouter le lien dans la navigation**

**Fichier à modifier:** `app/dashboard/layout.tsx` ou le composant de navigation

```tsx
<Link href="/dashboard/validation" className="...">
  <UserCheck size={20} />
  Validation des membres
</Link>
```

---

## 📋 CHECKLIST D'IMPLÉMENTATION

### **Backend (Supabase)**
- [x] Vue `membres_en_attente` existe
- [x] Fonction `valider_membre()` existe
- [x] Fonction `refuser_membre()` existe
- [ ] Fonction `valider_membre()` corrigée (exécuter `fix_valider_membre_function.sql`)

### **Frontend (Dashboard Web)**
- [ ] Créer `app/dashboard/validation/page.tsx`
- [ ] Créer `components/ValidateMemberModal.tsx`
- [ ] Créer `components/RejectMemberModal.tsx`
- [ ] Ajouter le lien dans la navigation
- [ ] Tester la validation
- [ ] Tester le refus

---

## 🚀 DÉPLOIEMENT

### **Étape 1: Corriger les fonctions SQL**
```sql
-- Exécuter fix_valider_membre_function.sql sur Supabase
```

### **Étape 2: Créer les fichiers**
1. Créer la page de validation
2. Créer les modals
3. Ajouter la navigation

### **Étape 3: Tester**
```bash
npm run dev
# Ouvrir http://localhost:3000/dashboard/validation
```

---

## 🎯 RÉSULTAT ATTENDU

**URL:** `http://localhost:3000/dashboard/validation`

**Fonctionnalités:**
- ✅ Liste des membres en attente
- ✅ Recherche par nom/email
- ✅ Badge avec nombre de jours d'attente
- ✅ Bouton "Valider" avec sélection de chorale
- ✅ Bouton "Refuser" avec commentaire
- ✅ Refresh automatique après action

---

**Date:** 20 novembre 2025
**Statut:** 📋 Spécifications prêtes
**Temps estimé:** 1-2 heures
