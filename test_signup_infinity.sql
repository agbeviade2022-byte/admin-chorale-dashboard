-- ============================================
-- TEST: Inscription manuelle pour infinitylivraison@gmail.com
-- ============================================
-- Ce script simule une inscription complète

-- ============================================
-- ÉTAPE 1: Vérifier si l'utilisateur existe déjà
-- ============================================

SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'infinitylivraison@gmail.com';

-- Si l'utilisateur existe déjà, vous verrez ses infos
-- Sinon, aucun résultat

-- ============================================
-- ÉTAPE 2: Vérifier si un profil existe
-- ============================================

SELECT 
  p.id,
  p.user_id,
  u.email,
  p.full_name,
  p.role,
  p.statut_validation,
  p.created_at
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
WHERE u.email = 'infinitylivraison@gmail.com';

-- Si un profil existe, vous verrez ses infos

-- ============================================
-- ÉTAPE 3: Créer l'utilisateur (si n'existe pas)
-- ============================================

-- ⚠️ ATTENTION: Ceci va créer un VRAI utilisateur !
-- Décommentez uniquement si vous voulez créer l'utilisateur


DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Créer l'utilisateur dans auth.users
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
    'infinitylivraison@gmail.com',
    crypt('MotDePasse123!', gen_salt('bf')), -- ← Changez le mot de passe
    NOW(), -- Email confirmé automatiquement
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Infinity Livraison"}', -- ← Changez le nom
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;
  
  RAISE NOTICE '✅ Utilisateur créé avec id: %', new_user_id;
  
  -- Le trigger devrait créer automatiquement le profil
  -- Attendez 1 seconde puis vérifiez
  
  PERFORM pg_sleep(1);
  
  -- Vérifier si le profil a été créé par le trigger
  IF EXISTS (SELECT 1 FROM profiles WHERE user_id = new_user_id) THEN
    RAISE NOTICE '✅ Profil créé automatiquement par le trigger';
  ELSE
    RAISE NOTICE '❌ Profil NON créé par le trigger - Création manuelle...';
    
    -- Créer le profil manuellement
    INSERT INTO profiles (
      user_id,
      full_name,
      role,
      statut_validation,
      created_at,
      updated_at
    )
    VALUES (
      new_user_id,
      'Infinity Livraison',
      'membre',
      'en_attente',
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '✅ Profil créé manuellement';
  END IF;
  
END $$;

-- ============================================
-- ÉTAPE 4: Vérifier le résultat
-- ============================================

-- Après avoir décommenté et exécuté l'étape 3, exécutez ceci:

SELECT 
  u.id as user_id,
  u.email,
  u.created_at as user_created,
  u.email_confirmed_at,
  p.id as profile_id,
  p.user_id as profile_user_id,
  p.full_name,
  p.role,
  p.statut_validation,
  p.created_at as profile_created
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'infinitylivraison@gmail.com';

-- Résultat attendu:
-- ✅ user_id = UUID de l'utilisateur
-- ✅ email = infinitylivraison@gmail.com
-- ✅ email_confirmed_at = date (email confirmé)
-- ✅ profile_id = UUID du profil (différent de user_id)
-- ✅ profile_user_id = user_id (lien entre profil et utilisateur)
-- ✅ full_name = Infinity Livraison
-- ✅ role = membre
-- ✅ statut_validation = en_attente

-- ============================================
-- ALTERNATIVE: Créer uniquement le profil
-- ============================================

-- Si l'utilisateur existe déjà mais n'a pas de profil:

/*
DO $$
DECLARE
  existing_user_id uuid;
BEGIN
  -- Récupérer l'ID de l'utilisateur existant
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = 'infinitylivraison@gmail.com';
  
  IF existing_user_id IS NULL THEN
    RAISE NOTICE '❌ Utilisateur n''existe pas';
  ELSE
    RAISE NOTICE '✅ Utilisateur trouvé: %', existing_user_id;
    
    -- Vérifier si le profil existe
    IF EXISTS (SELECT 1 FROM profiles WHERE user_id = existing_user_id) THEN
      RAISE NOTICE '⚠️ Profil existe déjà';
    ELSE
      -- Créer le profil
      INSERT INTO profiles (
        user_id,
        full_name,
        role,
        statut_validation,
        created_at,
        updated_at
      )
      VALUES (
        existing_user_id,
        'Infinity Livraison',
        'membre',
        'en_attente',
        NOW(),
        NOW()
      );
      
      RAISE NOTICE '✅ Profil créé pour user_id: %', existing_user_id;
    END IF;
  END IF;
END $$;
*/

-- ============================================
-- INSTRUCTIONS
-- ============================================

-- 1. Exécutez d'abord les ÉTAPES 1 et 2 pour vérifier si l'utilisateur existe

-- 2. Si l'utilisateur N'EXISTE PAS:
--    - Décommentez l'ÉTAPE 3
--    - Changez le mot de passe et le nom si nécessaire
--    - Exécutez

-- 3. Si l'utilisateur EXISTE mais n'a PAS de profil:
--    - Décommentez l'ALTERNATIVE
--    - Exécutez

-- 4. Exécutez l'ÉTAPE 4 pour vérifier le résultat

-- ============================================
-- IMPORTANT
-- ============================================

-- ⚠️ Ce script crée un VRAI utilisateur dans la base de données
-- ⚠️ Utilisez-le uniquement pour les tests
-- ⚠️ Le mot de passe par défaut est: MotDePasse123!
-- ⚠️ Changez-le avant d'exécuter
