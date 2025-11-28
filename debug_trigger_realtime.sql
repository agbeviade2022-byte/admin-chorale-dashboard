-- ============================================
-- DEBUG: Voir exactement ce qui se passe lors de l'inscription
-- ============================================

-- 1. Vérifier que le trigger existe et est actif
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================

-- 2. Voir le code EXACT de la fonction actuelle
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'handle_new_user';

-- ============================================

-- 3. Vérifier TOUTES les contraintes sur la table profiles
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass;

-- ============================================

-- 4. Vérifier les colonnes NOT NULL
SELECT 
  column_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND is_nullable = 'NO';

-- Colonnes NOT NULL peuvent bloquer l'insertion si pas de valeur par défaut

-- ============================================

-- 5. Vérifier les CHECK constraints
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as check_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND contype = 'c';

-- ============================================

-- 6. Tester l'insertion EXACTEMENT comme le trigger
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  test_email text := 'test@example.com';
  test_full_name text := 'Test User';
BEGIN
  RAISE NOTICE '🧪 Simulation du trigger avec user_id: %', test_user_id;
  
  -- Simuler exactement ce que fait le trigger
  INSERT INTO public.profiles (
    user_id,
    full_name,
    role,
    statut_validation,
    created_at,
    updated_at
  )
  VALUES (
    test_user_id,
    COALESCE(test_full_name, 'Utilisateur'),
    'membre',
    'en_attente',
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '✅ Test réussi: Profil créé avec user_id: %', test_user_id;
  
  -- Nettoyer
  DELETE FROM public.profiles WHERE user_id = test_user_id;
  RAISE NOTICE '✅ Profil de test supprimé';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ ERREUR: %', SQLERRM;
    RAISE NOTICE 'Code erreur: %', SQLSTATE;
    RAISE NOTICE 'Détails: %', SQLERRM;
END $$;

-- ============================================

-- 7. Vérifier les RLS policies qui pourraient bloquer
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

-- 8. Vérifier si RLS est activé sur profiles
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'profiles';

-- Si rowsecurity = true, les RLS policies peuvent bloquer

-- ============================================

-- 9. Vérifier les permissions sur la table
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND grantee IN ('authenticated', 'anon', 'service_role');

-- ============================================

-- 10. Voir les derniers utilisateurs créés dans auth.users
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 3;

-- ============================================

-- 11. Voir si ces utilisateurs ont un profil
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as user_created,
  p.user_id as has_profile,
  p.created_at as profile_created
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
ORDER BY u.created_at DESC
LIMIT 3;

-- Si has_profile est NULL → Le trigger ne s'est pas exécuté

-- ============================================
-- INTERPRÉTATION
-- ============================================

-- PROBLÈME 1: Contrainte NOT NULL sans valeur par défaut
-- Requête #4 montre des colonnes NOT NULL
-- → Le trigger doit fournir une valeur pour chaque colonne NOT NULL

-- PROBLÈME 2: CHECK constraint qui échoue
-- Requête #5 montre des contraintes CHECK
-- → Les valeurs insérées doivent respecter ces contraintes

-- PROBLÈME 3: RLS policy qui bloque
-- Requête #7 montre les policies
-- → Une policy peut bloquer l'insertion même si le trigger s'exécute

-- PROBLÈME 4: Trigger ne s'exécute pas
-- Requête #11 montre des utilisateurs sans profil
-- → Le trigger existe mais ne se déclenche pas

-- PROBLÈME 5: Permissions manquantes
-- Requête #9 montre les permissions
-- → Le trigger a besoin de permissions pour insérer
