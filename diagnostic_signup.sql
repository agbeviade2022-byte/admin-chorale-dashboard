-- ============================================
-- DIAGNOSTIC: Problème d'inscription
-- ============================================
-- Ce script vérifie pourquoi l'inscription échoue

-- 1. Vérifier si le trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Résultat attendu : 1 ligne
-- Si 0 ligne → Le trigger n'existe pas (PROBLÈME !)

-- ============================================

-- 2. Vérifier si la fonction existe
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';

-- Résultat attendu : 1 ligne
-- Si 0 ligne → La fonction n'existe pas (PROBLÈME !)

-- ============================================

-- 3. Vérifier la structure de la table profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Colonnes attendues :
-- - user_id (uuid, NOT NULL)
-- - full_name (text)
-- - email (text)
-- - role (text)
-- - statut_validation (text)
-- - chorale_id (uuid, nullable)
-- - created_at (timestamp)
-- - updated_at (timestamp)

-- ============================================

-- 4. Vérifier les contraintes de la table profiles
SELECT
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'profiles';

-- Contraintes attendues :
-- - PRIMARY KEY sur user_id
-- - FOREIGN KEY vers auth.users

-- ============================================

-- 5. Vérifier les permissions sur la table profiles
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'profiles';

-- Permissions attendues :
-- - authenticated: SELECT, INSERT, UPDATE, DELETE

-- ============================================

-- 6. Vérifier les utilisateurs récents dans auth.users
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- ============================================

-- 7. Vérifier les profils correspondants (avec emails depuis auth.users)
SELECT 
  p.user_id,
  p.full_name,
  u.email,  -- ← Email vient de auth.users, pas de profiles
  p.role,
  p.statut_validation,
  p.created_at
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
ORDER BY p.created_at DESC
LIMIT 5;

-- ============================================

-- 8. Trouver les utilisateurs sans profil (PROBLÈME !)
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.raw_user_meta_data->>'full_name' as full_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL
ORDER BY u.created_at DESC;

-- Si des utilisateurs apparaissent ici → Le trigger ne fonctionne pas !

-- ============================================

-- 9. Vérifier les RLS policies sur profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- ============================================
-- INTERPRÉTATION DES RÉSULTATS
-- ============================================

-- PROBLÈME 1: Trigger manquant
-- Si requête #1 retourne 0 ligne
-- → Exécutez fix_signup_trigger.sql

-- PROBLÈME 2: Fonction manquante
-- Si requête #2 retourne 0 ligne
-- → Exécutez fix_signup_trigger.sql

-- PROBLÈME 3: Colonnes manquantes
-- Si requête #3 ne montre pas email, role ou statut_validation
-- → Exécutez fix_signup_trigger.sql

-- PROBLÈME 4: Utilisateurs sans profil
-- Si requête #8 retourne des lignes
-- → Le trigger ne fonctionne pas
-- → Exécutez fix_signup_trigger.sql
-- → Puis créez manuellement les profils manquants

-- PROBLÈME 5: Permissions manquantes
-- Si requête #5 ne montre pas 'authenticated'
-- → Exécutez fix_signup_trigger.sql

-- ============================================
-- COMMENT EXÉCUTER CE SCRIPT
-- ============================================
-- 1. Allez sur https://supabase.com/dashboard
-- 2. Sélectionnez votre projet
-- 3. SQL Editor
-- 4. Copiez-collez ce script
-- 5. Cliquez sur "Run"
-- 6. Analysez les résultats
-- 7. Si problème détecté → Exécutez fix_signup_trigger.sql
