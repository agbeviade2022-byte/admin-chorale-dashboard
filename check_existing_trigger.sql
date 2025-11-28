-- ============================================
-- VÉRIFIER LE TRIGGER EXISTANT
-- ============================================
-- Si l'inscription fonctionnait avant, il y a peut-être un trigger
-- qui existe mais qui a une erreur

-- 1. Voir le trigger actuel
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================

-- 2. Voir le CODE COMPLET de la fonction actuelle
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'handle_new_user';

-- ============================================

-- 3. Voir TOUTES les fonctions qui pourraient gérer les nouveaux users
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_name LIKE '%user%'
    OR routine_name LIKE '%profile%'
    OR routine_name LIKE '%signup%'
  )
ORDER BY routine_name;

-- ============================================

-- 4. Voir TOUS les triggers sur auth.users
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- ============================================

-- 5. Tester manuellement l'insertion dans profiles
-- (pour voir quelle colonne pose problème)
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
BEGIN
  RAISE NOTICE '🧪 Test 1: Insertion minimale';
  
  -- Test avec seulement user_id
  INSERT INTO public.profiles (user_id)
  VALUES (test_user_id);
  
  RAISE NOTICE '✅ Test 1 réussi: user_id seul fonctionne';
  
  DELETE FROM public.profiles WHERE user_id = test_user_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Test 1 échoué: %', SQLERRM;
END $$;

-- ============================================

DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
BEGIN
  RAISE NOTICE '🧪 Test 2: Insertion avec full_name';
  
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (test_user_id, 'Test User');
  
  RAISE NOTICE '✅ Test 2 réussi: user_id + full_name fonctionne';
  
  DELETE FROM public.profiles WHERE user_id = test_user_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Test 2 échoué: %', SQLERRM;
END $$;

-- ============================================

DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
BEGIN
  RAISE NOTICE '🧪 Test 3: Insertion complète (comme le trigger)';
  
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
    'Test User',
    'membre',
    'en_attente',
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '✅ Test 3 réussi: insertion complète fonctionne';
  
  DELETE FROM public.profiles WHERE user_id = test_user_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Test 3 échoué: %', SQLERRM;
    RAISE NOTICE 'Code erreur: %', SQLSTATE;
END $$;

-- ============================================
-- INTERPRÉTATION
-- ============================================

-- Si le trigger existe (requête #1):
-- → Regardez le code dans requête #2
-- → Il y a peut-être une erreur dans le code

-- Si aucun trigger n'existe:
-- → C'est bizarre si ça fonctionnait avant
-- → Peut-être supprimé lors de la maintenance ?

-- Si les tests échouent:
-- → Le message d'erreur vous dira quelle colonne pose problème
-- → Peut-être une contrainte NOT NULL ou CHECK

-- Si les tests réussissent mais l'inscription échoue:
-- → Le problème vient du trigger lui-même
-- → Peut-être une erreur dans la logique
