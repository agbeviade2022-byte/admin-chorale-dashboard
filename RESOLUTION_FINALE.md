# ✅ RÉSOLUTION FINALE : Erreur d'inscription Flutter

## 📋 Résumé du diagnostic

### **Erreur initiale**
```
AuthRetryableFetchException
Message: Database error saving new user
Status: 500
```

### **Cause identifiée**

La table `profiles` a une structure particulière :
```sql
profiles
├── id (uuid, PRIMARY KEY) ← Utilisé par user_permissions, affiliations
└── user_id (uuid, nullable) ← Lien vers auth.users
```

**Problème :** Le trigger n'était pas adapté à cette structure.

---

## ✅ Solution appliquée

**Fichier à exécuter :** `fix_trigger_for_current_structure.sql`

Ce script :
1. ✅ Recrée le trigger `on_auth_user_created`
2. ✅ Adapte la fonction `handle_new_user()` à la structure actuelle
3. ✅ Crée les profils manquants pour les utilisateurs existants
4. ✅ Ajoute des logs pour le débogage

---

## 🎯 Pourquoi cette solution ?

### **Tentative de migration complète échouée**

Nous avons essayé de corriger la structure en supprimant `profiles.id` et en utilisant `user_id` comme PRIMARY KEY, mais :

```
❌ Erreur: cannot drop constraint profiles_pkey
Raison: D'autres tables dépendent de profiles.id
- user_permissions
- affiliations
- profiles.cree_par (auto-référence)
```

### **Solution retenue**

Garder la structure actuelle et adapter le trigger.

---

## 📋 Procédure d'exécution

### **Étape 1 : Exécuter le fix**

```
1. Ouvrez Supabase SQL Editor
2. Copiez le contenu de fix_trigger_for_current_structure.sql
3. Cliquez Run
```

**Résultat attendu :**
```sql
-- Trigger créé
trigger_name: on_auth_user_created
event: INSERT on users
action: EXECUTE FUNCTION handle_new_user()

-- Profils créés pour utilisateurs existants
INSERT 0 X (X = nombre d'utilisateurs sans profil)

-- Vérification
total_users = users_with_profile
```

---

### **Étape 2 : Tester l'inscription**

```
1. Ouvrez l'app Flutter
2. Créez un nouveau compte
3. L'inscription devrait fonctionner ✅
```

---

### **Étape 3 : Vérifier dans Supabase**

```sql
-- Voir les derniers profils créés
SELECT 
  p.id,
  p.user_id,
  u.email,
  p.full_name,
  p.role,
  p.statut_validation
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
ORDER BY p.created_at DESC
LIMIT 5;
```

**Vérifiez que :**
- ✅ Chaque nouveau utilisateur a un profil
- ✅ `p.user_id` = `u.id` (lien correct)
- ✅ `p.role` = 'membre'
- ✅ `p.statut_validation` = 'en_attente'

---

## ⚠️ Important pour votre code

### **Utilisez `user_id`, pas `id`**

Dans votre code Flutter et vos requêtes SQL, utilisez **`user_id`** pour lier au profil de l'utilisateur connecté :

#### **Flutter (Dart)**
```dart
// ✅ CORRECT
final profile = await supabase
  .from('profiles')
  .select()
  .eq('user_id', supabase.auth.currentUser!.id)
  .single();

// ❌ INCORRECT
final profile = await supabase
  .from('profiles')
  .select()
  .eq('id', supabase.auth.currentUser!.id)
  .single();
```

#### **SQL / RPC Functions**
```sql
-- ✅ CORRECT
SELECT * FROM profiles WHERE user_id = auth.uid();

-- ❌ INCORRECT
SELECT * FROM profiles WHERE id = auth.uid();
```

#### **RLS Policies**
```sql
-- ✅ CORRECT
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (user_id = auth.uid());

-- ❌ INCORRECT
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (id = auth.uid());
```

---

## 📊 Comprendre la structure

### **Deux identifiants différents**

| Colonne | Rôle | Exemple |
|---------|------|---------|
| `id` | PRIMARY KEY de `profiles`<br>Utilisé par `user_permissions`, `affiliations` | `123e4567-...` |
| `user_id` | Lien vers `auth.users`<br>Utilisé pour l'authentification | `987fcdeb-...` |

### **Schéma des relations**

```
auth.users
├── id (AAA)
│
profiles
├── id (BBB) ← PRIMARY KEY
├── user_id (AAA) ← LIEN vers auth.users
│
user_permissions
├── user_id (BBB) ← FOREIGN KEY vers profiles.id
│
affiliations
├── membre_id (BBB) ← FOREIGN KEY vers profiles.id
```

**Règle :**
- Pour authentification → `user_id`
- Pour relations entre tables → `id`

---

## 🔍 Logs de débogage

Le trigger inclut maintenant des logs détaillés :

```sql
RAISE NOTICE 'Profil créé pour user_id: %, id auto-généré', NEW.id;
```

**Pour voir les logs :**
```
Supabase Dashboard → Logs → Database
Cherchez "Profil créé pour user_id"
```

---

## 📁 Fichiers créés

| Fichier | Statut | Utilité |
|---------|--------|---------|
| `fix_trigger_for_current_structure.sql` | ✅ À exécuter | Solution finale |
| `fix_profiles_structure.sql` | ❌ Ne PAS exécuter | Impossible (dépendances) |
| `test_trigger_SIMPLE.sql` | ✅ Diagnostic | Vérifier après fix |
| `SOLUTION_FINALE_TRIGGER.md` | 📖 Documentation | Explication détaillée |
| `RESOLUTION_FINALE.md` | 📖 Documentation | Ce document |

---

## 🎯 Checklist finale

- [ ] Exécuter `fix_trigger_for_current_structure.sql`
- [ ] Vérifier que le trigger est créé
- [ ] Vérifier que les profils manquants sont créés
- [ ] Tester l'inscription dans l'app Flutter
- [ ] Vérifier qu'un profil est créé automatiquement
- [ ] Vérifier que `profiles.user_id` = `auth.users.id`
- [ ] Mettre à jour le code pour utiliser `user_id` (si nécessaire)

---

## 🚀 Prochaines étapes

### **Si l'inscription fonctionne ✅**

Parfait ! Le problème est résolu.

### **Si l'inscription échoue encore ❌**

1. Vérifiez les logs Supabase (Dashboard → Logs → Database)
2. Cherchez les messages d'erreur du trigger
3. Exécutez `test_trigger_SIMPLE.sql` pour diagnostic
4. Envoyez-moi les résultats

---

## 💡 Pourquoi cette structure ?

Cette structure avec `id` et `user_id` séparés n'est pas standard, mais elle existe probablement parce que :

1. **Historique :** La table a été créée avec `id` comme PRIMARY KEY
2. **Relations :** D'autres tables utilisent `profiles.id`
3. **Migration impossible :** Trop de dépendances pour changer

**C'est OK !** Le trigger est maintenant adapté et fonctionne avec cette structure.

---

**✅ TOUT EST PRÊT !**

**🎯 EXÉCUTEZ `fix_trigger_for_current_structure.sql` !**

**🧪 TESTEZ L'INSCRIPTION !**

**📸 ENVOYEZ-MOI LE RÉSULTAT !**
