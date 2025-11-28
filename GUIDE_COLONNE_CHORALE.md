# 🎵 GUIDE : Colonne Chorale dans la page Utilisateurs

## 🎯 OBJECTIF

Afficher à quelle chorale appartient chaque membre dans la page "Utilisateurs".

---

## 📊 AVANT / APRÈS

### **AVANT :**

```
┌────────────────────────────────────────────────────┐
│  UTILISATEUR │ EMAIL │ RÔLE │ INSCRIPTION │ ACTIONS│
├────────────────────────────────────────────────────┤
│  Himra       │ ...   │ membre │ 20/11/2025 │ ...   │
│  Lebron13    │ ...   │ membre │ 20/11/2025 │ ...   │
└────────────────────────────────────────────────────┘
```

### **APRÈS :**

```
┌──────────────────────────────────────────────────────────────┐
│  UTILISATEUR │ EMAIL │ RÔLE │ CHORALE │ INSCRIPTION │ ACTIONS│
├──────────────────────────────────────────────────────────────┤
│  Himra       │ ...   │ membre │ Chorale A │ 20/11/2025 │ ... │
│  Lebron13    │ ...   │ membre │ Chorale B │ 20/11/2025 │ ... │
│  Agbeviade   │ ...   │ admin  │ Aucune    │ 20/11/2025 │ ... │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔧 MODIFICATIONS EFFECTUÉES

### **1. Fonction SQL mise à jour**

**Fichier :** `FIX_USERS_WITH_CHORALE.sql`

```sql
CREATE OR REPLACE FUNCTION get_all_users_with_emails_debug()
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    email TEXT,
    role TEXT,
    telephone TEXT,
    statut_validation TEXT,
    chorale_id UUID,        -- ✅ Ajouté
    chorale_nom TEXT,       -- ✅ Ajouté
    created_at TIMESTAMPTZ
)
```

**Jointure avec la table chorales :**

```sql
LEFT JOIN chorales c ON p.chorale_id = c.id
```

### **2. Interface TypeScript mise à jour**

**Fichier :** `app/dashboard/users/page.tsx`

**Interface :**

```typescript
interface UserProfile {
  id: string
  full_name: string
  role: string
  created_at: string
  email?: string
  chorale_id?: string      // ✅ Ajouté
  chorale_nom?: string     // ✅ Ajouté
}
```

**Colonne ajoutée :**

```tsx
<th>Chorale</th>

<td>
  {user.chorale_nom ? (
    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
      {user.chorale_nom}
    </span>
  ) : (
    <span className="text-xs text-gray-400 italic">Aucune chorale</span>
  )}
</td>
```

**Recherche améliorée :**

```typescript
const filteredUsers = users.filter(user =>
  user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  user.chorale_nom?.toLowerCase().includes(searchTerm.toLowerCase())  // ✅ Ajouté
)
```

---

## 🚀 INSTALLATION

### **ÉTAPE 1 : Exécuter le script SQL**

```bash
# Dans Supabase SQL Editor
# Exécuter FIX_USERS_WITH_CHORALE.sql
```

Ce script va :
1. ✅ Supprimer l'ancienne fonction
2. ✅ Créer la nouvelle fonction avec `chorale_nom`
3. ✅ Tester la fonction

### **ÉTAPE 2 : Rafraîchir le dashboard**

```bash
# Dans le navigateur
F5
```

---

## 📊 RÉSULTAT

### **Page Utilisateurs mise à jour :**

```
┌──────────────────────────────────────────────────────────────────┐
│  Utilisateurs                                                    │
│  Gérer tous les utilisateurs du système                         │
├──────────────────────────────────────────────────────────────────┤
│  [Rechercher un utilisateur...]                                 │
├──────────────────────────────────────────────────────────────────┤
│  Total: 4 │ Admins: 2 │ Membres: 2 │ Utilisateurs: 0           │
├──────────────────────────────────────────────────────────────────┤
│  UTILISATEUR │ EMAIL              │ RÔLE  │ CHORALE  │ ...      │
├──────────────┼────────────────────┼───────┼──────────┼──────────┤
│  Himra       │ ofcoursekd@...     │ membre│ Chorale A│ 20/11/25 │
│  Lebron13    │ agbeviade2022@...  │ membre│ Chorale B│ 20/11/25 │
│  Agbeviade   │ agbeviade2017@...  │ super │ Aucune   │ 20/11/25 │
│  David Kodjo │ kodjodavid2025@... │ super │ Aucune   │ 18/11/25 │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🎨 AFFICHAGE

### **Avec chorale :**

```
┌──────────────┐
│  Chorale A   │  ← Badge bleu
└──────────────┘
```

### **Sans chorale :**

```
Aucune chorale  ← Texte gris italique
```

---

## 🔍 RECHERCHE

Vous pouvez maintenant rechercher par :
- ✅ Nom de l'utilisateur
- ✅ Email
- ✅ Nom de la chorale

**Exemple :**

```
Recherche : "Chorale A"
→ Affiche tous les membres de Chorale A
```

---

## 💡 CAS D'USAGE

### **1. Voir qui est dans quelle chorale**

```
Page Utilisateurs → Colonne "Chorale"
```

### **2. Trouver tous les membres d'une chorale**

```
Recherche : "Chorale A"
→ Himra (membre)
→ Jean Dupont (membre)
```

### **3. Identifier les utilisateurs sans chorale**

```
Colonne "Chorale" : "Aucune chorale"
→ Agbeviade (super_admin) - Normal
→ David Kodjo (super_admin) - Normal
→ Nouveau Membre (membre) - ⚠️ À attribuer
```

---

## 📋 DONNÉES AFFICHÉES

| Utilisateur | Rôle | Chorale | Explication |
|-------------|------|---------|-------------|
| Himra | membre | Chorale A | ✅ Membre validé avec chorale |
| Lebron13 | membre | Chorale B | ✅ Membre validé avec chorale |
| Agbeviade | super_admin | Aucune | ✅ Normal (admin) |
| David Kodjo | super_admin | Aucune | ✅ Normal (admin) |
| Nouveau | membre | Aucune | ⚠️ À attribuer une chorale |

---

## 🔧 PERSONNALISATION

### **Changer la couleur du badge :**

```tsx
// Dans page.tsx
<span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
  {user.chorale_nom}
</span>

// Changer bg-blue-100 et text-blue-800
// Exemples :
// - bg-green-100 text-green-800 (vert)
// - bg-purple-100 text-purple-800 (violet)
// - bg-pink-100 text-pink-800 (rose)
```

### **Ajouter une icône :**

```tsx
import { Music } from 'lucide-react'

<span className="flex items-center gap-1">
  <Music size={14} />
  {user.chorale_nom}
</span>
```

---

## 🆘 DÉPANNAGE

### **La colonne "Chorale" n'apparaît pas**

**Cause :** Fonction SQL pas mise à jour

**Solution :**
1. Exécutez `FIX_USERS_WITH_CHORALE.sql`
2. Rafraîchissez le dashboard (F5)

---

### **"Aucune chorale" pour tous les membres**

**Cause :** Les membres n'ont pas de `chorale_id` dans `profiles`

**Solution :**
1. Allez dans "Validation des membres"
2. Validez les membres en attribuant une chorale
3. Ou exécutez :

```sql
UPDATE profiles
SET chorale_id = (SELECT id FROM chorales LIMIT 1)
WHERE role = 'membre' AND chorale_id IS NULL;
```

---

### **Erreur "chorale_nom is undefined"**

**Cause :** Ancienne fonction SQL encore en cache

**Solution :**
1. Ouvrez la console (F12)
2. Application → Storage → Clear site data
3. Rafraîchissez (F5)

---

## 📊 STATISTIQUES

Vous pouvez maintenant voir :
- ✅ Combien de membres par chorale
- ✅ Quels membres n'ont pas de chorale
- ✅ Répartition des utilisateurs

**Exemple de requête SQL :**

```sql
SELECT 
    COALESCE(c.nom, 'Aucune chorale') as chorale,
    COUNT(*) as nombre_membres
FROM profiles p
LEFT JOIN chorales c ON p.chorale_id = c.id
WHERE p.role = 'membre'
GROUP BY c.nom
ORDER BY nombre_membres DESC;
```

---

## 🎯 RÉSUMÉ

**Modifications :**
1. ✅ Fonction SQL mise à jour avec `chorale_nom`
2. ✅ Interface TypeScript mise à jour
3. ✅ Colonne "Chorale" ajoutée
4. ✅ Recherche par chorale activée
5. ✅ Badge bleu pour les chorales
6. ✅ "Aucune chorale" en gris

**Résultat :**
- ✅ Vous voyez immédiatement qui est dans quelle chorale
- ✅ Recherche par nom de chorale
- ✅ Identification rapide des membres sans chorale

---

**Date de création :** 2025-11-21  
**Version :** 1.0  
**Auteur :** Cascade AI
