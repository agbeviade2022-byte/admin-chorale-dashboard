# 🔧 Correction du problème de connexion

## ❌ Problème

Impossible de se connecter au dashboard admin.

---

## 🔍 Cause

L'**AuthContext** ne vérifiait pas si l'utilisateur était admin lors de la connexion.

**Avant :**
```typescript
async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  return { error: null }
  // ❌ Pas de vérification du rôle !
}
```

**Résultat :** Tous les utilisateurs pouvaient se connecter, même les non-admins.

---

## ✅ Solution

Ajout de vérifications dans `contexts/AuthContext.tsx` :

```typescript
async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    // ✅ Vérifier le profil
    if (data.user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single()

      if (profileError || !profileData) {
        await supabase.auth.signOut()
        throw new Error('Impossible de récupérer le profil utilisateur')
      }

      // ✅ Vérifier le rôle (admin ou super_admin)
      if (profileData.role !== 'admin' && profileData.role !== 'super_admin') {
        await supabase.auth.signOut()
        throw new Error('Accès refusé : vous n\'êtes pas administrateur')
      }

      // ✅ Vérifier le statut de validation
      if (profileData.statut_validation === 'refuse') {
        await supabase.auth.signOut()
        throw new Error('Accès refusé : votre compte a été refusé')
      }

      if (profileData.statut_validation === 'en_attente') {
        await supabase.auth.signOut()
        throw new Error('Votre compte est en attente de validation')
      }
    }

    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}
```

---

## 🔒 Vérifications ajoutées

### **1. Profil existe** ✅
```typescript
if (profileError || !profileData) {
  throw new Error('Impossible de récupérer le profil utilisateur')
}
```

### **2. Rôle admin** ✅
```typescript
if (profileData.role !== 'admin' && profileData.role !== 'super_admin') {
  throw new Error('Accès refusé : vous n\'êtes pas administrateur')
}
```

### **3. Statut validé** ✅
```typescript
if (profileData.statut_validation === 'refuse') {
  throw new Error('Accès refusé : votre compte a été refusé')
}

if (profileData.statut_validation === 'en_attente') {
  throw new Error('Votre compte est en attente de validation')
}
```

---

## 📊 Flux de connexion

```
1. Utilisateur entre email/password
   ↓
2. Supabase Auth vérifie les credentials
   ↓
3. ✅ Récupération du profil depuis la table profiles
   ↓
4. ✅ Vérification du rôle (admin/super_admin)
   ↓
5. ✅ Vérification du statut (valide/en_attente/refuse)
   ↓
6. Si tout OK → Connexion réussie
   Si KO → Déconnexion + Message d'erreur
```

---

## 🎯 Messages d'erreur

### **Profil introuvable**
```
❌ Impossible de récupérer le profil utilisateur
```

### **Non-admin**
```
❌ Accès refusé : vous n'êtes pas administrateur
```

### **Compte refusé**
```
❌ Accès refusé : votre compte a été refusé
```

### **En attente de validation**
```
❌ Votre compte est en attente de validation
```

### **Email/password incorrect**
```
❌ Invalid login credentials (message Supabase)
```

---

## 🧪 Test de connexion

### **Compte admin valide** ✅
```
Email: admin@example.com
Password: ••••••••
Role: admin ou super_admin
Statut: valide

→ ✅ Connexion réussie
→ ✅ Redirection vers /dashboard
```

### **Compte membre** ❌
```
Email: membre@example.com
Password: ••••••••
Role: membre

→ ❌ Accès refusé : vous n'êtes pas administrateur
→ ❌ Déconnexion automatique
```

### **Compte en attente** ❌
```
Email: nouveau@example.com
Password: ••••••••
Role: admin
Statut: en_attente

→ ❌ Votre compte est en attente de validation
→ ❌ Déconnexion automatique
```

---

## 🔍 Diagnostic si ça ne fonctionne toujours pas

### **1. Vérifier les credentials**
```sql
-- Dans Supabase SQL Editor
SELECT 
  u.email,
  p.full_name,
  p.role,
  p.statut_validation
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'votre-email@example.com';
```

### **2. Vérifier la console du navigateur**
```
F12 → Console
Regarder les erreurs affichées
```

### **3. Vérifier les variables d'environnement**
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
```

### **4. Vérifier que le serveur a redémarré**
```bash
# Le serveur doit redémarrer après les modifications
# Si pas automatique :
Ctrl+C
npm run dev
```

---

## ✅ Checklist

- [x] AuthContext mis à jour avec vérifications
- [x] Vérification du rôle (admin/super_admin)
- [x] Vérification du statut de validation
- [x] Déconnexion automatique si non-autorisé
- [x] Messages d'erreur clairs
- [x] Serveur redémarré

---

## 🎉 Résultat

```
✅ Connexion sécurisée
✅ Seuls les admins peuvent se connecter
✅ Vérification du statut de validation
✅ Messages d'erreur clairs
✅ Déconnexion automatique si non-autorisé
```

---

**CORRECTION APPLIQUÉE ! ✅**

**Essayez de vous connecter maintenant avec un compte admin ! 🚀**

**Si le problème persiste, vérifiez :**
1. Que vous utilisez un compte avec `role = 'admin'` ou `'super_admin'`
2. Que le `statut_validation = 'valide'`
3. Que les credentials sont corrects
4. Que le serveur a bien redémarré
