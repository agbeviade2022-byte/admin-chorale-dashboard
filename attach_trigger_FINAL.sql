-- ============================================
-- FIX FINAL: Attacher le trigger à auth.users
-- ============================================

-- Ce script va s'assurer que le trigger est correctement attaché

-- ============================================
-- ÉTAPE 1: Supprimer le trigger s'il existe
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================
-- ÉTAPE 2: Vérifier que la fonction existe
-- ============================================

SELECT 
  proname,
  pronamespace::regnamespace as schema,
  proconfig
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Si cette requête retourne 0 ligne, exécutez d'abord fix_trigger_search_path.sql

-- ============================================
-- ÉTAPE 3: Créer le trigger sur auth.users
-- ============================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ÉTAPE 4: Vérifier que le trigger est attaché
-- ============================================

SELECT 
  trigger_name,
  event_object_schema,
  event_object_table,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Résultat attendu:
-- trigger_name: on_auth_user_created
-- event_object_schema: auth
-- event_object_table: users
-- event_manipulation: INSERT
-- action_timing: AFTER
-- action_statement: EXECUTE FUNCTION public.handle_new_user()

-- ============================================
-- ÉTAPE 5: Test rapide
-- ============================================

DO $$
DECLARE
  test_user_id uuid;
  test_email text := 'test_final_' || floor(random() * 10000)::text || '@example.com';
BEGIN
  RAISE NOTICE '🧪 Test final du trigger';
  
  -- Créer un utilisateur
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    test_email,
    crypt('Test123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Test Final"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO test_user_id;
  
  RAISE NOTICE '✅ Utilisateur créé: %', test_user_id;
  
  -- Attendre que le trigger s'exécute
  PERFORM pg_sleep(1);
  
  -- Vérifier le profil
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = test_user_id) THEN
    RAISE NOTICE '🎉 🎉 🎉 SUCCÈS TOTAL ! Le trigger fonctionne !';
  ELSE
    RAISE NOTICE '❌ ÉCHEC: Le trigger ne fonctionne toujours pas';
  END IF;
  
  -- Nettoyer
  DELETE FROM auth.users WHERE id = test_user_id;
  RAISE NOTICE '✅ Test nettoyé';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erreur: %', SQLERRM;
END $$;

-- ============================================
-- RÉSULTAT ATTENDU
-- ============================================

-- Vous devriez voir:
-- ✅ Utilisateur créé: xxx
-- 🎉 🎉 🎉 SUCCÈS TOTAL ! Le trigger fonctionne !
-- ✅ Test nettoyé

-- Si vous voyez ça, testez l'inscription Flutter !
