# ❌ Correction : Database error saving new user

## 🔍 Erreur rencontrée

```
AuthRetryableFetchException
Code: unexpected_failure
Message: Database error saving new user
Status: 500
```

**Cause :** Le trigger qui crée automatiquement un profil lors de l'inscription est manquant ou cassé.

---

## 🎯 Solution rapide (5 minutes)

### **Étape 1 : Diagnostic**

1. Allez sur **https://supabase.com/dashboard**
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor** (menu de gauche)
4. Ouvrez le fichier `diagnostic_signup.sql`
5. Copiez tout le contenu
6. Collez dans SQL Editor
7. Cliquez sur **Run**

**Analysez les résultats :**

```sql
-- Si la requête #1 retourne 0 ligne
-- → Le trigger n'existe pas (PROBLÈME !)

-- Si la requête #8 montre des utilisateurs
-- → Des utilisateurs n'ont pas de profil (PROBLÈME !)
```

---

### **Étape 2 : Correction**

1. Restez dans **SQL Editor**
2. Ouvrez le fichier `fix_signup_trigger.sql`
3. Copiez tout le contenu
4. Collez dans SQL Editor
5. Cliquez sur **Run**

**Vous devriez voir :**
```
✅ Trigger créé avec succès
✅ Fonction créée avec succès
✅ Permissions accordées
```

---

### **Étape 3 : Test**

1. Retournez dans votre app Flutter
2. Essayez de créer un nouveau compte
3. L'inscription devrait maintenant fonctionner

---

## 🔍 Qu'est-ce qui s'est passé ?

### **Avant (cassé)**
```
User s'inscrit
    ↓
Supabase crée l'utilisateur dans auth.users
    ↓
❌ Trigger manquant → Pas de profil créé
    ↓
❌ Erreur: Database error saving new user
```

### **Après (corrigé)**
```
User s'inscrit
    ↓
Supabase crée l'utilisateur dans auth.users
    ↓
✅ Trigger déclenché → handle_new_user()
    ↓
✅ Profil créé dans public.profiles
    ↓
✅ Inscription réussie
```

---

## 📋 Ce que fait le trigger

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users  -- ← Après création d'un user
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();  -- ← Appelle cette fonction
```

**La fonction `handle_new_user()` :**
```sql
CREATE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Créer automatiquement un profil
  INSERT INTO public.profiles (
    user_id,
    full_name,
    email,
    role,
    statut_validation
  )
  VALUES (
    NEW.id,  -- ← ID du nouvel utilisateur
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    'membre',  -- ← Rôle par défaut
    'en_attente'  -- ← Statut par défaut
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔧 Pourquoi le trigger a disparu ?

**Causes possibles :**

1. **Maintenance Supabase** (vous avez mentionné une maintenance)
   - Les triggers peuvent être supprimés lors de migrations
   
2. **Migration de base de données**
   - Si vous avez restauré une sauvegarde
   - Les triggers ne sont pas toujours inclus

3. **Modification manuelle**
   - Quelqu'un a peut-être supprimé le trigger par erreur

---

## 🧪 Vérification manuelle

### **Vérifier si le trigger existe**
```sql
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

**Résultat attendu :** 1 ligne
**Si 0 ligne :** Le trigger n'existe pas → Exécutez `fix_signup_trigger.sql`

---

### **Vérifier les utilisateurs sans profil**
```sql
SELECT 
  u.id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;
```

**Si des utilisateurs apparaissent :**
- Le trigger ne fonctionnait pas quand ils se sont inscrits
- Vous devez créer leurs profils manuellement

---

## 🔨 Créer manuellement les profils manquants

Si des utilisateurs n'ont pas de profil :

```sql
-- Pour chaque utilisateur sans profil
INSERT INTO public.profiles (
  user_id,
  full_name,
  email,
  role,
  statut_validation,
  created_at,
  updated_at
)
SELECT 
  u.id,
  u.raw_user_meta_data->>'full_name',
  u.email,
  'membre',
  'en_attente',
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;
```

---

## 📊 Structure complète de la table profiles

```sql
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'membre',
  statut_validation TEXT DEFAULT 'en_attente',
  chorale_id UUID REFERENCES public.chorales(id),
  telephone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎯 Checklist de vérification

Après avoir exécuté `fix_signup_trigger.sql` :

- [ ] Le trigger `on_auth_user_created` existe
- [ ] La fonction `handle_new_user()` existe
- [ ] La table `profiles` a toutes les colonnes nécessaires
- [ ] Les permissions sont accordées à `authenticated`
- [ ] Tous les utilisateurs existants ont un profil
- [ ] L'inscription fonctionne dans l'app Flutter

---

## 🧪 Test complet

### **1. Créer un compte test**
```
Email: test@example.com
Password: Test123!
Nom: Test User
```

### **2. Vérifier que le profil est créé**
```sql
SELECT * FROM public.profiles
WHERE email = 'test@example.com';
```

**Résultat attendu :**
```
user_id: [uuid]
full_name: Test User
email: test@example.com
role: membre
statut_validation: en_attente
```

### **3. Supprimer le compte test**
```sql
-- Supprimer le profil
DELETE FROM public.profiles
WHERE email = 'test@example.com';

-- Supprimer l'utilisateur
DELETE FROM auth.users
WHERE email = 'test@example.com';
```

---

## 📝 Fichiers créés

1. **diagnostic_signup.sql**
   - Diagnostique le problème
   - Vérifie trigger, fonction, table, permissions
   - Trouve les utilisateurs sans profil

2. **fix_signup_trigger.sql**
   - Recrée le trigger
   - Recrée la fonction
   - Ajoute les colonnes manquantes
   - Accorde les permissions

---

## 🚨 Si ça ne fonctionne toujours pas

### **Vérifiez les logs Supabase**

1. Allez sur **https://supabase.com/dashboard**
2. Sélectionnez votre projet
3. **Logs** → **Database**
4. Cherchez les erreurs lors de l'inscription

### **Erreurs possibles**

**Erreur : "column does not exist"**
```
→ Une colonne manque dans la table profiles
→ Exécutez fix_signup_trigger.sql
```

**Erreur : "permission denied"**
```
→ Problème de permissions RLS
→ Vérifiez les policies sur la table profiles
```

**Erreur : "foreign key violation"**
```
→ Problème avec chorale_id
→ Vérifiez que la colonne accepte NULL
```

---

## 💡 Prévention future

Pour éviter que ce problème se reproduise :

### **1. Sauvegarder les triggers**
```sql
-- Exporter tous les triggers
SELECT 
  'CREATE TRIGGER ' || trigger_name || 
  ' ' || action_timing || ' ' || event_manipulation ||
  ' ON ' || event_object_table ||
  ' FOR EACH ROW EXECUTE FUNCTION ' || action_statement || ';'
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

### **2. Versionner les migrations**
- Créez un dossier `supabase/migrations/`
- Sauvegardez tous les scripts SQL
- Utilisez Git pour versionner

### **3. Tester après chaque maintenance**
- Après une maintenance Supabase
- Vérifiez que les triggers existent
- Testez l'inscription

---

**✅ EXÉCUTEZ `fix_signup_trigger.sql` MAINTENANT !**

**🧪 PUIS TESTEZ L'INSCRIPTION DANS L'APP FLUTTER !**

**📸 ENVOYEZ-MOI LE RÉSULTAT SI ÇA NE FONCTIONNE PAS !**
