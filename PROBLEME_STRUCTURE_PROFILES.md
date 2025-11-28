# ❌ PROBLÈME MAJEUR : Structure incorrecte de la table `profiles`

## 🔍 Problème identifié

Votre table `profiles` a une structure incorrecte :

```sql
profiles
├── id (uuid, PRIMARY KEY) ← ❌ PROBLÈME !
└── user_id (uuid, nullable) ← Devrait être la PRIMARY KEY !
```

---

## ❌ Structure actuelle (incorrecte)

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),  -- ❌ Mauvais
  user_id uuid,                                     -- ❌ Devrait être PRIMARY KEY
  full_name text,
  role text,
  ...
);
```

**Problèmes :**
1. ❌ `id` est la PRIMARY KEY au lieu de `user_id`
2. ❌ `user_id` est nullable (peut être NULL)
3. ❌ Pas de FOREIGN KEY vers `auth.users`
4. ❌ Un utilisateur peut avoir plusieurs profils (car `user_id` n'est pas unique)
5. ❌ Des profils peuvent exister sans `user_id` (orphelins)

---

## ✅ Structure correcte (attendue)

```sql
CREATE TABLE profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text,
  ...
);
```

**Avantages :**
1. ✅ `user_id` est la PRIMARY KEY (unique, NOT NULL)
2. ✅ FOREIGN KEY vers `auth.users` (intégrité référentielle)
3. ✅ Un utilisateur = un seul profil
4. ✅ Suppression en cascade (si user supprimé → profil supprimé)
5. ✅ Pas de profils orphelins possibles

---

## 🎯 Impact sur le trigger

### **Trigger actuel (ne fonctionne pas bien)**

```sql
CREATE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (user_id, full_name, role, ...)
  VALUES (NEW.id, ...);  -- ← Insère dans user_id
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Ce qui se passe :**
1. PostgreSQL génère automatiquement un `id` (uuid_generate_v4())
2. Le trigger insère `NEW.id` dans `user_id`
3. Résultat : `id` ≠ `user_id` (deux UUIDs différents !)

**Exemple :**
```
id: 123e4567-e89b-12d3-a456-426614174000  ← Généré par PostgreSQL
user_id: 987fcdeb-51a2-43f7-8b9c-123456789abc  ← ID de auth.users
```

---

## 📊 Comparaison

| Aspect | Structure actuelle ❌ | Structure correcte ✅ |
|--------|----------------------|----------------------|
| PRIMARY KEY | `id` | `user_id` |
| FOREIGN KEY | Aucune | `user_id` → `auth.users(id)` |
| user_id nullable | Oui | Non (NOT NULL) |
| Profils multiples | Possible | Impossible |
| Profils orphelins | Possible | Impossible |
| Suppression cascade | Non | Oui |

---

## 🔧 Solutions

### **Solution A : Fix temporaire** (rapide, 2 minutes)

Adapter le trigger pour fonctionner avec la structure actuelle.

**Fichier :** `fix_trigger_for_current_structure.sql`

**Avantages :**
- ✅ Rapide à exécuter
- ✅ Pas de modification de structure
- ✅ L'inscription fonctionnera

**Inconvénients :**
- ❌ Structure toujours incorrecte
- ❌ `id` et `user_id` différents
- ❌ Pas de FOREIGN KEY
- ❌ Risque de profils orphelins

---

### **Solution B : Fix complet** (recommandé, 5 minutes)

Corriger la structure de la table.

**Fichier :** `fix_profiles_structure.sql`

**Avantages :**
- ✅ Structure correcte
- ✅ `user_id` comme PRIMARY KEY
- ✅ FOREIGN KEY vers `auth.users`
- ✅ Intégrité référentielle
- ✅ Suppression en cascade

**Inconvénients :**
- ⚠️ Modifie la structure de la table
- ⚠️ Supprime la colonne `id`
- ⚠️ Peut nécessiter des ajustements dans le code

---

## 📋 Procédure recommandée

### **Option 1 : Fix rapide (temporaire)**

```
1. Exécutez fix_trigger_for_current_structure.sql
2. Testez l'inscription dans l'app Flutter
3. Ça devrait fonctionner
4. Planifiez la migration complète plus tard
```

---

### **Option 2 : Fix complet (recommandé)**

```
1. Sauvegardez vos données (export Supabase)
2. Exécutez fix_profiles_structure.sql
3. Vérifiez que tous les utilisateurs ont un profil
4. Exécutez fix_signup_trigger.sql (trigger standard)
5. Testez l'inscription
```

---

## 🧪 Vérification après fix

### **Vérifier la structure**

```sql
SELECT 
  column_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('id', 'user_id');
```

**Résultat attendu (après fix complet) :**
```
column_name | is_nullable | column_default
user_id     | NO          | null
```

**Pas de colonne `id` !**

---

### **Vérifier les contraintes**

```sql
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'profiles';
```

**Résultat attendu :**
```
profiles_pkey              | PRIMARY KEY (sur user_id)
profiles_user_id_fkey      | FOREIGN KEY (vers auth.users)
```

---

### **Vérifier les profils**

```sql
SELECT 
  COUNT(*) as total_users,
  COUNT(p.user_id) as users_with_profile
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id;
```

**Résultat attendu :**
```
total_users = users_with_profile
```

---

## 🎯 Recommandation

### **Pour débloquer rapidement :**
```
→ Exécutez fix_trigger_for_current_structure.sql
```

### **Pour une solution pérenne :**
```
→ Exécutez fix_profiles_structure.sql
```

---

## 📁 Fichiers créés

1. **fix_trigger_for_current_structure.sql**
   - Adapte le trigger à la structure actuelle
   - Solution temporaire
   - Rapide (2 min)

2. **fix_profiles_structure.sql**
   - Corrige la structure de la table
   - Solution complète
   - Recommandé (5 min)

---

## ⚠️ IMPORTANT

**La structure actuelle avec `id` comme PRIMARY KEY n'est pas standard pour une table de profils utilisateur.**

**Dans 99% des applications, `profiles.user_id` devrait être :**
- ✅ PRIMARY KEY
- ✅ FOREIGN KEY vers `auth.users(id)`
- ✅ NOT NULL
- ✅ UNIQUE (garanti par PRIMARY KEY)

**La colonne `id` séparée crée de la confusion et des problèmes d'intégrité.**

---

**🎯 CHOISISSEZ UNE SOLUTION :**

**Option A (rapide) :** `fix_trigger_for_current_structure.sql`
**Option B (recommandée) :** `fix_profiles_structure.sql`

**📸 ENVOYEZ-MOI LE RÉSULTAT APRÈS EXÉCUTION !**
