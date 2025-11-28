-- ============================================
-- ⚠️ ATTENTION: NE PAS EXÉCUTER CE SCRIPT !
-- ============================================
-- Ce script ne peut PAS être exécuté car d'autres tables dépendent de profiles.id:
-- - user_permissions.user_id → profiles.id
-- - user_permissions.attribue_par → profiles.id
-- - profiles.cree_par → profiles.id
-- - affiliations.membre_id → profiles.id
-- - affiliations.maitre_choeur_id → profiles.id
--
-- Exécuter ce script casserait toutes ces relations !
--
-- ✅ SOLUTION: Utilisez fix_trigger_for_current_structure.sql à la place
--
-- ============================================
-- FIX: Corriger la structure de la table profiles (IMPOSSIBLE)
-- ============================================
-- Problème: La table profiles a une colonne 'id' comme PRIMARY KEY
-- au lieu de 'user_id' qui devrait être la PRIMARY KEY et FOREIGN KEY

-- ATTENTION: Cette migration va modifier la structure de la table
-- Sauvegardez vos données avant d'exécuter !

-- ============================================
-- ÉTAPE 1: Vérifier l'état actuel
-- ============================================

-- Voir les contraintes actuelles
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'profiles';

-- ============================================
-- ÉTAPE 2: Supprimer l'ancienne PRIMARY KEY
-- ============================================

-- Supprimer la contrainte PRIMARY KEY sur 'id'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;

-- Supprimer la colonne 'id' si elle existe
ALTER TABLE public.profiles DROP COLUMN IF EXISTS id;

-- ============================================
-- ÉTAPE 3: Modifier user_id pour être PRIMARY KEY
-- ============================================

-- Rendre user_id NOT NULL
ALTER TABLE public.profiles ALTER COLUMN user_id SET NOT NULL;

-- Ajouter PRIMARY KEY sur user_id
ALTER TABLE public.profiles ADD PRIMARY KEY (user_id);

-- ============================================
-- ÉTAPE 4: Ajouter FOREIGN KEY vers auth.users
-- ============================================

-- Ajouter la contrainte FOREIGN KEY
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- ============================================
-- ÉTAPE 5: Vérifier la nouvelle structure
-- ============================================

-- Voir les contraintes
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'profiles';

-- Voir les colonnes
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================
-- ÉTAPE 6: Nettoyer les profils orphelins
-- ============================================

-- Supprimer les profils sans user_id valide
DELETE FROM public.profiles
WHERE user_id IS NULL
   OR user_id NOT IN (SELECT id FROM auth.users);

-- ============================================
-- ÉTAPE 7: Créer les profils manquants
-- ============================================

-- Pour chaque utilisateur dans auth.users qui n'a pas de profil
INSERT INTO public.profiles (
  user_id,
  full_name,
  role,
  statut_validation,
  created_at,
  updated_at
)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', 'Utilisateur'),
  'membre',
  'en_attente',
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;

-- ============================================
-- RÉSULTAT ATTENDU
-- ============================================

-- La table profiles devrait maintenant avoir:
-- ✅ user_id comme PRIMARY KEY (NOT NULL)
-- ✅ FOREIGN KEY vers auth.users(id) ON DELETE CASCADE
-- ✅ Pas de colonne 'id'
-- ✅ Tous les utilisateurs ont un profil

-- ============================================
-- VÉRIFICATION FINALE
-- ============================================

-- Compter les utilisateurs avec et sans profil
SELECT 
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT p.user_id) as users_with_profile,
  COUNT(DISTINCT u.id) - COUNT(DISTINCT p.user_id) as users_without_profile
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id;

-- Résultat attendu: users_without_profile = 0

-- ============================================
-- IMPORTANT: Après cette migration
-- ============================================

-- 1. Le trigger handle_new_user() fonctionnera correctement
-- 2. Les inscriptions créeront automatiquement un profil
-- 3. La suppression d'un user supprimera aussi son profil (CASCADE)
-- 4. Plus de conflit entre 'id' et 'user_id'

-- ============================================
-- SI VOUS AVEZ DES ERREURS
-- ============================================

-- Erreur: "duplicate key value violates unique constraint"
-- → Il y a des doublons dans user_id
-- Solution: Supprimer les doublons avant d'ajouter la PRIMARY KEY

-- Erreur: "column contains null values"
-- → Il y a des profils avec user_id NULL
-- Solution: Exécutez l'ÉTAPE 6 pour nettoyer

-- Erreur: "foreign key violation"
-- → Il y a des user_id qui n'existent pas dans auth.users
-- Solution: Exécutez l'ÉTAPE 6 pour nettoyer
