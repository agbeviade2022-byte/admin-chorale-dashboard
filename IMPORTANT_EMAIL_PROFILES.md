# ⚠️ IMPORTANT : La colonne `email` n'existe PAS dans `profiles`

## 🔍 Structure de la base de données

### **Table `auth.users` (gérée par Supabase)**
```sql
auth.users
├── id (uuid)
├── email (text)  ← L'email est ICI
├── encrypted_password
├── created_at
└── raw_user_meta_data (jsonb)
```

### **Table `public.profiles` (votre table)**
```sql
public.profiles
├── user_id (uuid) → FOREIGN KEY vers auth.users(id)
├── full_name (text)
├── role (text)
├── statut_validation (text)
├── chorale_id (uuid)
├── telephone (text)
├── created_at (timestamp)
└── updated_at (timestamp)
```

**❌ PAS de colonne `email` dans `profiles` !**

---

## 🎯 Comment récupérer l'email d'un utilisateur

### **❌ INCORRECT (ne fonctionne pas)**
```sql
SELECT 
  p.user_id,
  p.full_name,
  p.email  -- ❌ ERREUR: column p.email does not exist
FROM public.profiles p;
```

### **✅ CORRECT (avec JOIN)**
```sql
SELECT 
  p.user_id,
  p.full_name,
  u.email  -- ✅ Email vient de auth.users
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.user_id;
```

---

## 🔧 Pourquoi cette architecture ?

### **Séparation des responsabilités**

**`auth.users` (Supabase Auth)**
- Gère l'authentification
- Stocke email, mot de passe chiffré
- Géré automatiquement par Supabase
- Ne peut pas être modifié directement

**`public.profiles` (Votre application)**
- Stocke les informations métier
- Nom, rôle, chorale, téléphone
- Vous avez le contrôle total
- Peut être modifié librement

---

## 📊 Exemples de requêtes

### **1. Récupérer tous les utilisateurs avec emails**
```sql
SELECT 
  p.user_id,
  p.full_name,
  u.email,
  p.role,
  p.statut_validation,
  p.chorale_id
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
ORDER BY p.created_at DESC;
```

### **2. Fonction RPC pour le dashboard**
```sql
CREATE OR REPLACE FUNCTION get_all_users_with_emails_debug()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text,
  role text,
  statut_validation text,
  chorale_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name,
    u.email,  -- ← JOIN avec auth.users
    p.role,
    p.statut_validation,
    p.chorale_id
  FROM profiles p
  LEFT JOIN auth.users u ON u.id = p.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **3. Chercher un utilisateur par email**
```sql
SELECT 
  p.user_id,
  p.full_name,
  u.email,
  p.role
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
WHERE u.email = 'user@example.com';
```

---

## 🔧 Trigger de création de profil (CORRIGÉ)

### **❌ INCORRECT (essaie d'insérer email dans profiles)**
```sql
CREATE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    full_name,
    email,  -- ❌ Cette colonne n'existe pas !
    role
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,  -- ❌ Erreur !
    'membre'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### **✅ CORRECT (sans email)**
```sql
CREATE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    full_name,
    role,
    statut_validation
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    'membre',
    'en_attente'
  );
  -- L'email reste dans auth.users
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🎯 Dans votre code Flutter

### **Service d'authentification**
```dart
// L'email est géré par Supabase Auth
final response = await supabase.auth.signUp(
  email: email,  // ← Stocké dans auth.users
  password: password,
);

// Le profil est créé par le trigger
// Sans l'email (il est déjà dans auth.users)
```

### **Récupérer l'email d'un utilisateur**
```dart
// L'email vient de l'objet User de Supabase
final user = supabase.auth.currentUser;
final email = user?.email;  // ← Depuis auth.users

// Le profil vient de la table profiles
final profile = await supabase
  .from('profiles')
  .select()
  .eq('user_id', user!.id)
  .single();

final fullName = profile['full_name'];  // ← Depuis profiles
final role = profile['role'];  // ← Depuis profiles
```

---

## 📋 Scripts corrigés

### **1. diagnostic_signup.sql**
- ✅ Utilise `LEFT JOIN` pour récupérer l'email
- ✅ Ne cherche plus `p.email`

### **2. fix_signup_trigger.sql**
- ✅ N'insère plus l'email dans profiles
- ✅ N'essaie plus d'ajouter la colonne email

---

## 🎯 Résumé

```
┌─────────────────────────────────┐
│       auth.users                │
│  (Géré par Supabase)            │
│                                 │
│  - id                           │
│  - email ← ICI                  │
│  - encrypted_password           │
│  - created_at                   │
└─────────────┬───────────────────┘
              │
              │ FOREIGN KEY
              │
┌─────────────▼───────────────────┐
│     public.profiles             │
│  (Votre application)            │
│                                 │
│  - user_id (FK)                 │
│  - full_name                    │
│  - role                         │
│  - statut_validation            │
│  - chorale_id                   │
│  - telephone                    │
└─────────────────────────────────┘
```

**Règle d'or :**
- ✅ Email → Toujours dans `auth.users`
- ✅ Infos métier → Toujours dans `profiles`
- ✅ Pour récupérer les deux → Utilisez `LEFT JOIN`

---

**✅ LES SCRIPTS SONT MAINTENANT CORRIGÉS !**

**🔄 RÉEXÉCUTEZ `diagnostic_signup.sql` !**

**🔧 PUIS EXÉCUTEZ `fix_signup_trigger.sql` !**

**L'erreur "column p.email does not exist" ne devrait plus apparaître !**
