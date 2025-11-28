# 🔍 Prochaines étapes de débogage

## ✅ Ce qui fonctionne déjà

D'après vos captures d'écran :

1. **Trigger existe** ✅
   ```
   trigger_name: on_auth_user_created
   event: INSERT on users
   action: EXECUTE FUNCTION handle_new_user()
   ```

2. **Permissions RLS OK** ✅
   ```
   - delete_profile_super_admin
   - select_own_profile
   - update_own_profile
   ```

---

## 🤔 Pourquoi l'inscription échoue encore ?

Même si le trigger existe, il peut avoir une **erreur silencieuse** qui empêche la création du profil.

---

## 🎯 3 scripts de diagnostic créés

### **1. test_trigger_function.sql** 🧪
**Ce qu'il fait :**
- Vérifie si la fonction `handle_new_user()` existe
- Affiche le code de la fonction
- Teste manuellement la création d'un profil
- Trouve les utilisateurs sans profil

**Exécutez ce script en premier !**

---

### **2. verify_profiles_structure.sql** 📊
**Ce qu'il fait :**
- Affiche toutes les colonnes de la table `profiles`
- Ajoute automatiquement les colonnes manquantes
- Vérifie que la structure est correcte

**Exécutez si le test #1 montre une erreur de colonne**

---

### **3. recreate_trigger_with_logs.sql** 🔧
**Ce qu'il fait :**
- Recrée le trigger avec des logs détaillés
- Affiche des messages NOTICE pour chaque étape
- Capture toutes les erreurs possibles
- Ne bloque jamais l'inscription

**Exécutez pour avoir des logs détaillés lors de l'inscription**

---

## 📋 Procédure recommandée

### **Étape 1 : Test de la fonction**

1. Allez sur **Supabase SQL Editor**
2. Copiez le contenu de **`test_trigger_function.sql`**
3. Cliquez **Run**

**Résultats possibles :**

#### **Scénario A : "Test réussi !"**
```
NOTICE: Test réussi ! Profil créé avec user_id: ...
NOTICE: Profil de test supprimé
```
→ La structure est OK, passez à l'étape 2

#### **Scénario B : "ERREUR lors du test"**
```
NOTICE: ERREUR lors du test: column "xxx" does not exist
```
→ Il manque une colonne, exécutez `verify_profiles_structure.sql`

#### **Scénario C : Fonction n'existe pas**
```
Requête #1 retourne 0 ligne
```
→ Exécutez `fix_signup_trigger.sql`

---

### **Étape 2 : Vérifier les utilisateurs sans profil**

Dans les résultats de `test_trigger_function.sql`, regardez la **requête #5** :

```sql
SELECT u.id, u.email, p.user_id as has_profile
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.created_at > NOW() - INTERVAL '1 day'
```

**Si `has_profile` est NULL pour certains utilisateurs :**
→ Le trigger ne fonctionne pas, passez à l'étape 3

**Si tous les utilisateurs ont un profil :**
→ Le trigger fonctionne, le problème est ailleurs

---

### **Étape 3 : Recréer le trigger avec logs**

1. Copiez le contenu de **`recreate_trigger_with_logs.sql`**
2. Cliquez **Run**
3. Le trigger est maintenant recréé avec des logs détaillés

---

### **Étape 4 : Tester l'inscription avec logs**

1. Allez dans votre **app Flutter**
2. Essayez de créer un nouveau compte
3. Retournez sur **Supabase Dashboard**
4. Allez dans **Logs** → **Database**
5. Cherchez les messages `handle_new_user`

**Logs attendus si ça fonctionne :**
```
NOTICE: handle_new_user: Début pour user_id=xxx
NOTICE: handle_new_user: email=test@example.com
NOTICE: handle_new_user: full_name=Test User
NOTICE: handle_new_user: Profil créé avec succès
```

**Logs si erreur :**
```
WARNING: handle_new_user: Erreur NOT NULL pour user_id=xxx
WARNING: handle_new_user: erreur=null value in column "xxx"
```
→ Le message vous dira exactement quel est le problème

---

## 🔍 Erreurs possibles et solutions

### **Erreur 1 : "column does not exist"**
```
WARNING: column "statut_validation" does not exist
```

**Solution :**
```sql
ALTER TABLE public.profiles 
ADD COLUMN statut_validation TEXT DEFAULT 'en_attente';
```

---

### **Erreur 2 : "null value in column violates not-null constraint"**
```
WARNING: null value in column "user_id" violates not-null constraint
```

**Solution :**
La colonne `user_id` doit accepter NULL temporairement, ou le trigger a un problème.

---

### **Erreur 3 : "duplicate key value violates unique constraint"**
```
WARNING: Profil existe déjà pour user_id=xxx
```

**Solution :**
C'est normal, le trigger a déjà créé le profil. Pas de problème.

---

### **Erreur 4 : Aucun log n'apparaît**
```
Aucun message dans les logs
```

**Solution :**
Le trigger ne se déclenche pas du tout. Vérifiez :
1. Que le trigger existe (requête #1 de test_trigger_function.sql)
2. Que l'utilisateur est bien créé dans `auth.users`

---

## 📊 Checklist de débogage

- [ ] Exécuter `test_trigger_function.sql`
- [ ] Vérifier que la fonction existe
- [ ] Vérifier que le test manuel fonctionne
- [ ] Vérifier les utilisateurs sans profil
- [ ] Si problème de colonne → Exécuter `verify_profiles_structure.sql`
- [ ] Exécuter `recreate_trigger_with_logs.sql`
- [ ] Tester l'inscription dans l'app Flutter
- [ ] Vérifier les logs dans Supabase Dashboard → Logs → Database
- [ ] Analyser les messages NOTICE/WARNING

---

## 🎯 Résumé des fichiers

| Fichier | Utilité | Quand l'utiliser |
|---------|---------|------------------|
| `test_trigger_function.sql` | Diagnostic complet | En premier |
| `verify_profiles_structure.sql` | Vérifier/corriger colonnes | Si erreur de colonne |
| `recreate_trigger_with_logs.sql` | Trigger avec logs | Pour déboguer |
| `fix_signup_trigger.sql` | Créer trigger basique | Si trigger manquant |

---

## 📸 Ce que j'ai besoin de voir

Après avoir exécuté `test_trigger_function.sql`, envoyez-moi :

1. **Résultat de la requête #1** (fonction existe ?)
2. **Résultat de la requête #4** (test manuel)
3. **Résultat de la requête #5** (utilisateurs sans profil)

Après avoir testé l'inscription avec `recreate_trigger_with_logs.sql` :

4. **Capture d'écran des logs Supabase** (Dashboard → Logs → Database)
5. **Message d'erreur dans l'app Flutter** (si erreur)

---

**🧪 EXÉCUTEZ `test_trigger_function.sql` MAINTENANT !**

**📸 ENVOYEZ-MOI LES RÉSULTATS !**

**Je pourrai alors identifier exactement le problème !**
