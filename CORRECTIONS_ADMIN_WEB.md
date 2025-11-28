# 🔧 Corrections Admin Web - Compatibilité avec la nouvelle architecture

## ✅ Corrections appliquées

### 1. **Table `membres` → `profiles`**

**Problème :** L'admin web cherchait une table `membres` qui n'existe pas.

**Solution :** Changé `from('membres')` en `from('profiles')` dans `app/dashboard/chorales/page.tsx`

```typescript
// Avant ❌
supabase.from('membres').select('id', { count: 'exact', head: true })

// Après ✅
supabase.from('profiles').select('id', { count: 'exact', head: true })
```

### 2. **Champ `actif` → `statut`**

**Problème :** La nouvelle table `chorales` utilise un champ `statut` ('actif'/'inactif') au lieu d'un booléen `actif`.

**Solution :** Adapté tout le code pour gérer les deux formats (compatibilité)

```typescript
// Vérification compatible avec les deux formats
(chorale.statut === 'actif' || chorale.actif)
```

### 3. **Interface TypeScript mise à jour**

**Avant :**
```typescript
interface Chorale {
  id: string
  nom: string
  description: string
  ville: string
  pays: string
  actif: boolean
  created_at: string
}
```

**Après :**
```typescript
interface Chorale {
  id: string
  nom: string
  slug?: string
  description?: string
  logo_url?: string
  couleur_theme?: string
  email_contact?: string
  telephone?: string
  adresse?: string
  ville?: string
  pays?: string
  site_web?: string
  nombre_membres?: number
  statut?: string
  created_at: string
  updated_at?: string
  nb_membres?: number
  nb_chants?: number
  actif?: boolean  // Rétrocompatibilité
}
```

### 4. **Fonction `handleToggleStatus` mise à jour**

```typescript
const handleToggleStatus = async (chorale: Chorale) => {
  try {
    const newStatut = (chorale.statut === 'actif' || chorale.actif) ? 'inactif' : 'actif'
    const { error } = await supabase
      .from('chorales')
      .update({ statut: newStatut, updated_at: new Date().toISOString() })
      .eq('id', chorale.id)

    if (error) throw error
    fetchChorales()
    alert(`✅ Chorale "${chorale.nom}" ${newStatut === 'actif' ? 'activée' : 'désactivée'} avec succès !`)
  } catch (error) {
    console.error('Erreur:', error)
    alert('❌ Erreur lors de la modification du statut')
  }
}
```

---

## 📋 Fichiers modifiés

- ✅ `app/dashboard/chorales/page.tsx`

---

## 🧪 Tests à effectuer

### 1. Page Chorales
- [ ] La liste des chorales s'affiche correctement
- [ ] Le compteur de membres fonctionne (utilise `profiles`)
- [ ] Le compteur de chants fonctionne
- [ ] Le statut s'affiche correctement (Active/Inactive)
- [ ] Le bouton Activer/Désactiver fonctionne
- [ ] La recherche fonctionne

### 2. Modals
- [ ] Créer une chorale fonctionne
- [ ] Modifier une chorale fonctionne
- [ ] Supprimer une chorale fonctionne

---

## ⚠️ Problèmes restants possibles

### 1. **Modals de création/édition**

Les composants `CreateChoraleModal`, `EditChoraleModal` et `DeleteChoraleModal` doivent aussi être mis à jour pour utiliser les nouveaux champs :

- `slug` (obligatoire)
- `statut` au lieu de `actif`
- Nouveaux champs optionnels : `couleur_theme`, `email_contact`, etc.

### 2. **RLS Policies**

Si les erreurs 500 persistent, vérifiez que les RLS policies sont désactivées ou correctement configurées :

```sql
-- Désactiver temporairement pour tester
ALTER TABLE chorales DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

### 3. **Page Users**

La page `app/dashboard/users/page.tsx` doit probablement aussi être mise à jour pour :
- Utiliser `profiles` au lieu de `membres`
- Afficher le `chorale_id` de chaque utilisateur
- Gérer le nouveau champ `statut_membre`

---

## 🚀 Prochaines étapes

1. **Tester la page Chorales** dans l'admin web
2. **Mettre à jour les modals** si nécessaire
3. **Mettre à jour la page Users** si nécessaire
4. **Configurer les RLS policies** correctement

---

## 📞 Commandes utiles

### Relancer l'admin web
```bash
cd "d:/Projet Flutter/admin-chorale-dashboard"
npm run dev
```

### Vérifier les erreurs dans la console
Ouvrez la console du navigateur (F12) et regardez les erreurs Supabase.

---

**Date :** 19 novembre 2025  
**Auteur :** Cascade AI Assistant
