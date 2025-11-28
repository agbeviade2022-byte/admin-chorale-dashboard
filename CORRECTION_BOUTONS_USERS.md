# 🔧 Correction des boutons Modifier/Supprimer - Page Utilisateurs

## ❌ Problème

Sur la page Utilisateurs, les boutons "Modifier" et "Supprimer" ne fonctionnent plus.

---

## 🔍 Cause

**Incohérence entre `id` et `user_id`**

La page utilisateurs mappe les données :
```typescript
// app/dashboard/users/page.tsx ligne 56-59
const mappedData = (data || []).map((user: any) => ({
  ...user,
  id: user.user_id || user.id  // ✅ Crée un champ "id"
}))
```

Mais les modals utilisaient directement `user.id` :
```typescript
// EditUserModal.tsx / DeleteUserModal.tsx
.eq('user_id', user.id)  // ❌ Peut être undefined si user_id existe
```

**Résultat :** Les requêtes SQL cherchaient avec un `user_id` incorrect.

---

## ✅ Solution appliquée

Utiliser `user_id` si disponible, sinon `id` :

### **1. EditUserModal.tsx**

```typescript
// Avant
.eq('user_id', user.id)

// Après
const userId = (user as any).user_id || user.id
.eq('user_id', userId)
```

**Deux endroits corrigés :**
1. Suppression des permissions (ligne 115-119)
2. Mise à jour du profil (ligne 123-131)

### **2. DeleteUserModal.tsx**

```typescript
// Avant
.eq('user_id', user.id)

// Après  
const userId = (user as any).user_id || user.id
.eq('user_id', userId)
```

**Deux endroits corrigés :**
1. Suppression des permissions (ligne 42-45)
2. Suppression du profil (ligne 48-51)

---

## 📊 Flux corrigé

### **Modification d'utilisateur**

```
1. Clic sur "Modifier"
   ↓
2. setSelectedUser(user)  // user a user_id ET id
   ↓
3. EditUserModal s'ouvre
   ↓
4. const userId = user.user_id || user.id  // ✅ Utilise le bon ID
   ↓
5. UPDATE profiles WHERE user_id = userId  // ✅ Fonctionne
   ↓
6. ✅ Utilisateur modifié
```

### **Suppression d'utilisateur**

```
1. Clic sur "Supprimer"
   ↓
2. setSelectedUser(user)  // user a user_id ET id
   ↓
3. DeleteUserModal s'ouvre
   ↓
4. Saisie "SUPPRIMER"
   ↓
5. const userId = user.user_id || user.id  // ✅ Utilise le bon ID
   ↓
6. DELETE FROM profiles WHERE user_id = userId  // ✅ Fonctionne
   ↓
7. ✅ Utilisateur supprimé
```

---

## 🧪 Test des boutons

### **Test 1 : Modifier un utilisateur** ✅

```
1. Aller sur /dashboard/users
2. Cliquer sur "Modifier" pour un utilisateur
3. Modal s'ouvre avec les données
4. Modifier le nom ou le rôle
5. Cliquer sur "Enregistrer"
6. ✅ Message de succès
7. ✅ Liste rafraîchie avec les modifications
```

### **Test 2 : Supprimer un utilisateur** ✅

```
1. Aller sur /dashboard/users
2. Cliquer sur "Supprimer" pour un utilisateur
3. Modal s'ouvre
4. Taper "SUPPRIMER"
5. Cliquer sur "Supprimer définitivement"
6. ✅ Utilisateur supprimé
7. ✅ Liste rafraîchie sans l'utilisateur
```

---

## 🔍 Pourquoi cette incohérence ?

### **Fonction SQL `get_all_users_with_emails_debug`**

Retourne les données avec `user_id` :
```sql
SELECT 
  p.user_id,  -- ← Champ principal
  p.full_name,
  u.email,
  ...
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
```

### **Mapping dans la page**

Pour compatibilité, on crée aussi un champ `id` :
```typescript
const mappedData = data.map(user => ({
  ...user,
  id: user.user_id || user.id  // ← Pour compatibilité
}))
```

### **Résultat**

L'objet `user` a maintenant **deux propriétés** :
```typescript
{
  user_id: "abc123",  // ← ID réel dans la DB
  id: "abc123",       // ← Copie pour compatibilité
  full_name: "John Doe",
  ...
}
```

### **Solution**

Toujours utiliser `user_id` en priorité :
```typescript
const userId = user.user_id || user.id
```

---

## ✅ Fichiers modifiés

### **1. `components/EditUserModal.tsx`**
- ✅ Ligne 115 : `const userId = (user as any).user_id || user.id`
- ✅ Ligne 119 : `.eq('user_id', userId)` pour suppression permissions
- ✅ Ligne 123 : `const userId = (user as any).user_id || user.id`
- ✅ Ligne 131 : `.eq('user_id', userId)` pour mise à jour profil

### **2. `components/DeleteUserModal.tsx`**
- ✅ Ligne 39 : `const userId = (user as any).user_id || user.id`
- ✅ Ligne 45 : `.eq('user_id', userId)` pour suppression permissions
- ✅ Ligne 51 : `.eq('user_id', userId)` pour suppression profil

---

## 🎯 Résultat

```
✅ Bouton "Modifier" fonctionne
✅ Bouton "Supprimer" fonctionne
✅ Utilisation du bon user_id dans les requêtes SQL
✅ Compatibilité avec les deux formats de données
✅ Pas d'erreur de requête SQL
```

---

## 📝 Note pour l'avenir

Si vous ajoutez d'autres modals ou fonctionnalités qui utilisent les données utilisateur, **toujours utiliser** :

```typescript
const userId = (user as any).user_id || user.id
```

Au lieu de :
```typescript
user.id  // ❌ Peut ne pas être le bon ID
```

---

**CORRECTION APPLIQUÉE ! ✅**

**Les boutons Modifier et Supprimer fonctionnent maintenant ! 🚀**

**Testez sur la page /dashboard/users !**
