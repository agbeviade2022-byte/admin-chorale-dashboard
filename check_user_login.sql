-- ============================================
-- VÉRIFIER UN UTILISATEUR POUR LA CONNEXION
-- ============================================

-- Remplacez 'email@example.com' par l'email de l'utilisateur

-- 1. Vérifier que l'utilisateur existe dans auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'infinitylivraison@gmail.com';  -- ← Changez l'email ici

-- Résultat attendu:
-- ✅ 1 ligne retournée → L'utilisateur existe
-- ❌ 0 ligne → L'utilisateur n'existe pas

-- ============================================

-- 2. Vérifier le profil de l'utilisateur
SELECT 
  p.id,
  p.user_id,
  p.full_name,
  p.role,
  p.statut_validation,
  p.statut_membre,
  p.chorale_id,
  u.email
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
WHERE u.email = 'infinitylivraison@gmail.com';  -- ← Changez l'email ici

-- Résultat attendu:
-- ✅ statut_validation = 'valide' → Peut se connecter
-- ⚠️ statut_validation = 'en_attente' → Ne peut pas se connecter (bloqué)
-- ❌ statut_validation = 'refuse' → Ne peut pas se connecter (refusé)

-- ============================================

-- 3. Vérifier si l'email est confirmé
SELECT 
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Email non confirmé'
    ELSE '✅ Email confirmé'
  END as statut_email
FROM auth.users
WHERE email = 'infinitylivraison@gmail.com';  -- ← Changez l'email ici

-- ============================================

-- 4. Si l'utilisateur n'existe pas, créer un compte de test
-- (Décommentez pour créer un compte de test)

/*
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
    'test@example.com',  -- ← Email
    crypt('TestPassword123!', gen_salt('bf')),  -- ← Mot de passe
    NOW(),  -- Email confirmé automatiquement
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Test User"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;
  
  -- Créer le profil
  INSERT INTO public.profiles (
    user_id,
    full_name,
    role,
    statut_validation,
    statut_membre,
    created_at,
    updated_at
  )
  VALUES (
    new_user_id,
    'Test User',
    'membre',
    'valide',  -- ← Validé automatiquement
    'actif',
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '✅ Compte créé avec succès';
  RAISE NOTICE 'Email: test@example.com';
  RAISE NOTICE 'Mot de passe: TestPassword123!';
END $$;
*/

-- ============================================
-- DIAGNOSTIC
-- ============================================

-- Si requête #1 retourne 0 ligne:
-- → L'utilisateur n'existe pas
-- → Créer le compte ou vérifier l'email

-- Si requête #2 montre statut_validation = 'en_attente':
-- → L'utilisateur doit être validé par un admin
-- → Aller sur le dashboard et valider

-- Si requête #3 montre email_confirmed_at = NULL:
-- → L'email n'est pas confirmé
-- → Confirmer l'email ou le marquer comme confirmé

-- Si tout est OK mais connexion échoue:
-- → Le mot de passe est incorrect
-- → Réinitialiser le mot de passe
