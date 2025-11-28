# 🔐 GUIDE : Sécurité et Gestion des Chorales

## 🎯 OBJECTIF

Mettre en place un système de sécurité complet où chaque membre n'a accès qu'aux données de sa chorale.

---

## 📊 ARCHITECTURE DE SÉCURITÉ

```
┌─────────────────────────────────────────────────────┐
│  UTILISATEUR (auth.users)                           │
│  └─ user_id (UUID)                                  │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│  PROFILE (profiles)                                 │
│  ├─ user_id → auth.users.id                         │
│  ├─ chorale_id → chorales.id  ← LIEN CLÉ          │
│  ├─ role (super_admin, admin, membre)               │
│  └─ statut_validation (valide, en_attente, refuse)  │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│  CHORALE (chorales)                                 │
│  ├─ id (UUID)                                       │
│  └─ nom (TEXT)                                      │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│  CHANTS (chants)                                    │
│  ├─ id (UUID)                                       │
│  ├─ chorale_id → chorales.id  ← LIEN CLÉ          │
│  ├─ titre (TEXT)                                    │
│  └─ ...                                             │
└─────────────────────────────────────────────────────┘
```

---

## 🔒 RÈGLES DE SÉCURITÉ (RLS)

### **1. MEMBRES**

```
✅ Peuvent voir :
   - Leur propre profil
   - Les chants de LEUR chorale uniquement
   
❌ Ne peuvent PAS :
   - Voir les profils des autres
   - Voir les chants d'autres chorales
   - Modifier leur chorale_id
   - Modifier leur rôle
```

### **2. ADMINS**

```
✅ Peuvent voir :
   - Tous les profils de LEUR chorale
   - Tous les chants de LEUR chorale
   
✅ Peuvent modifier :
   - Les chants de LEUR chorale
   - Les profils de LEUR chorale (sauf rôle)
   
❌ Ne peuvent PAS :
   - Voir/modifier d'autres chorales
   - Changer les rôles
```

### **3. SUPER ADMINS**

```
✅ Peuvent TOUT faire :
   - Voir tous les profils
   - Voir tous les chants
   - Modifier tous les profils
   - Changer les rôles
   - Attribuer les chorales
   - Créer/modifier/supprimer des chorales
```

---

## 🚀 INSTALLATION

### **ÉTAPE 1 : Auditer la sécurité actuelle**

```sql
-- Dans Supabase SQL Editor
-- Exécuter AUDIT_SECURITE_CHORALE.sql
```

Ce script va :
- ✅ Vérifier les relations entre tables
- ✅ Lister les politiques RLS existantes
- ✅ Identifier les failles de sécurité
- ✅ Compter les membres sans chorale

### **ÉTAPE 2 : Mettre en place la sécurité**

```sql
-- Dans Supabase SQL Editor
-- Exécuter SECURITE_COMPLETE_CHORALE.sql
```

Ce script va :
1. ✅ Supprimer les anciennes politiques RLS
2. ✅ Activer RLS sur toutes les tables
3. ✅ Créer les politiques pour `profiles`
4. ✅ Créer les politiques pour `chants`
5. ✅ Créer les politiques pour `chorales`
6. ✅ Créer des fonctions de vérification

### **ÉTAPE 3 : Rafraîchir le dashboard**

```bash
# Dans le navigateur
F5
```

---

## 🎨 MODIFIER LA CHORALE D'UN MEMBRE

### **Dans le Dashboard :**

```
1. Utilisateurs → Cliquez sur "Modifier"
   ↓
2. Modal s'ouvre avec les champs :
   - Nom
   - Email (lecture seule)
   - Rôle
   - Chorale ← NOUVEAU !
   ↓
3. Sélectionnez une chorale dans le dropdown
   ↓
4. Message : "✅ L'utilisateur aura accès aux chants de cette chorale"
   ↓
5. Enregistrez
   ↓
6. Le membre a maintenant accès aux chants de cette chorale
```

---

## 📊 EXEMPLE CONCRET

### **Situation :**

```
Chorales :
- Chorale A (id: uuid-1)
- Chorale B (id: uuid-2)

Membres :
- Jean (membre, Chorale A)
- Marie (membre, Chorale B)
- Admin (admin, Chorale A)
- Super Admin (super_admin, null)

Chants :
- Chant 1 (Chorale A)
- Chant 2 (Chorale A)
- Chant 3 (Chorale B)
```

### **Accès :**

```
Jean (membre, Chorale A) peut voir :
✅ Chant 1
✅ Chant 2
❌ Chant 3 (autre chorale)

Marie (membre, Chorale B) peut voir :
❌ Chant 1 (autre chorale)
❌ Chant 2 (autre chorale)
✅ Chant 3

Admin (admin, Chorale A) peut voir :
✅ Chant 1
✅ Chant 2
✅ Chant 3 (admin voit tout)

Super Admin peut voir :
✅ Tous les chants
```

---

## 🔍 TESTER LA SÉCURITÉ

### **Test 1 : Membre ne voit que sa chorale**

```sql
-- Se connecter en tant que membre de Chorale A
SELECT * FROM chants;

-- Résultat attendu :
-- Seulement les chants de Chorale A
```

### **Test 2 : Membre ne peut pas changer de chorale**

```sql
-- Se connecter en tant que membre
UPDATE profiles
SET chorale_id = 'autre-chorale-id'
WHERE user_id = auth.uid();

-- Résultat attendu :
-- ❌ Erreur : Policy violation
```

### **Test 3 : Admin peut gérer sa chorale**

```sql
-- Se connecter en tant qu'admin de Chorale A
SELECT * FROM chants WHERE chorale_id = 'chorale-a-id';

-- Résultat attendu :
-- ✅ Tous les chants de Chorale A
```

---

## 🛡️ POLITIQUES RLS CRÉÉES

### **PROFILES**

| Politique | Rôle | Action | Description |
|-----------|------|--------|-------------|
| `users_select_own_profile` | Tous | SELECT | Voir son propre profil |
| `users_update_own_profile` | Tous | UPDATE | Modifier son profil (pas chorale/rôle) |
| `super_admins_select_all_profiles` | Super Admin | SELECT | Voir tous les profils |
| `super_admins_update_all_profiles` | Super Admin | UPDATE | Modifier tous les profils |
| `admins_select_chorale_profiles` | Admin | SELECT | Voir profils de sa chorale |

### **CHANTS**

| Politique | Rôle | Action | Description |
|-----------|------|--------|-------------|
| `members_select_own_chorale_chants` | Membre | SELECT | Voir chants de sa chorale |
| `admins_insert_chants` | Admin | INSERT | Ajouter des chants |
| `admins_update_chorale_chants` | Admin | UPDATE | Modifier chants de sa chorale |
| `super_admins_delete_chants` | Super Admin | DELETE | Supprimer n'importe quel chant |

### **CHORALES**

| Politique | Rôle | Action | Description |
|-----------|------|--------|-------------|
| `everyone_select_chorales` | Tous | SELECT | Voir toutes les chorales |
| `super_admins_update_chorales` | Super Admin | UPDATE | Modifier les chorales |
| `super_admins_insert_chorales` | Super Admin | INSERT | Créer des chorales |
| `super_admins_delete_chorales` | Super Admin | DELETE | Supprimer des chorales |

---

## 🔧 FONCTIONS UTILES

### **Vérifier l'accès à une chorale**

```sql
SELECT user_has_access_to_chorale(
    'user-uuid',
    'chorale-uuid'
);

-- Retourne : true ou false
```

### **Obtenir la chorale d'un utilisateur**

```sql
SELECT get_user_chorale_id('user-uuid');

-- Retourne : UUID de la chorale ou NULL
```

---

## 📋 CHECKLIST DE SÉCURITÉ

- [ ] ✅ RLS activé sur `profiles`
- [ ] ✅ RLS activé sur `chants`
- [ ] ✅ RLS activé sur `chorales`
- [ ] ✅ Politiques pour membres créées
- [ ] ✅ Politiques pour admins créées
- [ ] ✅ Politiques pour super admins créées
- [ ] ✅ Membres ne peuvent voir que leur chorale
- [ ] ✅ Membres ne peuvent pas changer de chorale
- [ ] ✅ Admins peuvent gérer leur chorale
- [ ] ✅ Super admins ont accès à tout

---

## 🆘 DÉPANNAGE

### **Un membre voit les chants d'autres chorales**

**Cause :** RLS pas activé ou politique incorrecte

**Solution :**
```sql
-- Vérifier RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'chants';

-- Si rowsecurity = false
ALTER TABLE chants ENABLE ROW LEVEL SECURITY;
```

---

### **Un admin ne peut pas modifier les chants**

**Cause :** Politique trop restrictive

**Solution :**
```sql
-- Vérifier les politiques
SELECT * FROM pg_policies WHERE tablename = 'chants';

-- Réexécuter SECURITE_COMPLETE_CHORALE.sql
```

---

### **Un membre ne peut pas voir les chants**

**Cause :** Pas de chorale attribuée ou statut_validation != 'valide'

**Solution :**
```sql
-- Vérifier le profil
SELECT user_id, chorale_id, statut_validation
FROM profiles
WHERE user_id = 'user-uuid';

-- Attribuer une chorale
UPDATE profiles
SET chorale_id = 'chorale-uuid',
    statut_validation = 'valide'
WHERE user_id = 'user-uuid';
```

---

## 🎯 RÉSUMÉ

**Sécurité mise en place :**
1. ✅ RLS activé sur toutes les tables
2. ✅ Membres isolés par chorale
3. ✅ Admins limités à leur chorale
4. ✅ Super admins ont accès complet
5. ✅ Modification de chorale dans le dashboard
6. ✅ Fonctions de vérification

**Flux de sécurité :**
```
Utilisateur → Profile → Chorale → Chants
     ↓           ↓          ↓         ↓
  user_id   chorale_id    id    chorale_id
                ↓                     ↓
            MÊME UUID = ACCÈS AUTORISÉ
```

---

**Date de création :** 2025-11-21  
**Version :** 1.0  
**Auteur :** Cascade AI
