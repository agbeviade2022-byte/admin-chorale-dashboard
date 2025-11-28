-- ============================================
-- TEST RÉEL: Simuler une vraie inscription Supabase
-- ============================================

-- Ce script simule EXACTEMENT ce que fait Supabase Auth
-- lors d'une inscription via Flutter

-- ============================================
-- ÉTAPE 1: Vérifier que le trigger existe
-- ============================================

SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_table = 'users'
  AND event_object_schema = 'auth';

-- Résultat attendu: 1 ligne
-- Si 0 ligne → Le trigger n'existe pas sur auth.users !

-- ============================================
-- ÉTAPE 2: Créer un utilisateur test RÉEL
-- ============================================

-- ⚠️ ATTENTION: Ceci va créer un VRAI utilisateur !
-- Utilisez un email unique

DO $$
DECLARE
  new_user_id uuid;
  test_email text := 'test_trigger_' || floor(random() * 10000)::text || '@example.com';
BEGIN
  RAISE NOTICE '🧪 Test: Création d''un utilisateur réel';
  RAISE NOTICE 'Email: %', test_email;
  
  -- Créer l'utilisateur dans auth.users
  -- Le trigger devrait se déclencher automatiquement
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
    crypt('TestPassword123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Test Trigger User"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;
  
  RAISE NOTICE '✅ Utilisateur créé avec id: %', new_user_id;
  
  -- Attendre un peu pour que le trigger s'exécute
  PERFORM pg_sleep(2);
  
  -- Vérifier si le profil a été créé par le trigger
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = new_user_id) THEN
    RAISE NOTICE '✅ ✅ ✅ SUCCÈS: Profil créé automatiquement par le trigger !';
    
    -- Afficher le profil créé
    DECLARE
      profile_id uuid;
      profile_full_name text;
      profile_role text;
      profile_statut text;
    BEGIN
      SELECT id, full_name, role, statut_validation
      INTO profile_id, profile_full_name, profile_role, profile_statut
      FROM public.profiles
      WHERE user_id = new_user_id;
      
      RAISE NOTICE 'Profil créé:';
      RAISE NOTICE '  - id: %', profile_id;
      RAISE NOTICE '  - user_id: %', new_user_id;
      RAISE NOTICE '  - full_name: %', profile_full_name;
      RAISE NOTICE '  - role: %', profile_role;
      RAISE NOTICE '  - statut_validation: %', profile_statut;
    END;
    
  ELSE
    RAISE NOTICE '❌ ❌ ❌ ÉCHEC: Profil NON créé par le trigger !';
    RAISE NOTICE 'Le trigger ne s''est pas déclenché ou a échoué silencieusement';
    
    -- Créer le profil manuellement pour nettoyer
    INSERT INTO public.profiles (
      user_id,
      full_name,
      role,
      statut_validation,
      created_at,
      updated_at
    )
    VALUES (
      new_user_id,
      'Test Trigger User',
      'membre',
      'en_attente',
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '✅ Profil créé manuellement pour nettoyage';
  END IF;
  
  -- Nettoyer (supprimer l'utilisateur test)
  DELETE FROM auth.users WHERE id = new_user_id;
  RAISE NOTICE '✅ Utilisateur test supprimé';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ ERREUR lors du test: %', SQLERRM;
    RAISE NOTICE 'Code erreur: %', SQLSTATE;
END $$;

-- ============================================
-- ÉTAPE 3: Vérifier les logs PostgreSQL
-- ============================================

-- Après avoir exécuté ce script, regardez les messages NOTICE
-- Ils vous diront si le trigger fonctionne ou non

-- ============================================
-- INTERPRÉTATION
-- ============================================

-- Si vous voyez "✅ ✅ ✅ SUCCÈS: Profil créé automatiquement":
-- → Le trigger fonctionne !
-- → Le problème est ailleurs (peut-être dans Supabase Auth lui-même)

-- Si vous voyez "❌ ❌ ❌ ÉCHEC: Profil NON créé":
-- → Le trigger ne se déclenche pas ou échoue silencieusement
-- → Il faut vérifier pourquoi

-- ============================================
-- DIAGNOSTIC SUPPLÉMENTAIRE
-- ============================================

-- Vérifier les triggers sur auth.users
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing,
  action_orientation
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- Vérifier que handle_new_user existe
SELECT 
  proname,
  proconfig
FROM pg_proc
WHERE proname = 'handle_new_user';
