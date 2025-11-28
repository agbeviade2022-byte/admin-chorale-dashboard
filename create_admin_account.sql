-- ============================================
-- CRÉER OU VALIDER UN COMPTE ADMIN
-- ============================================

-- Option 1: Promouvoir un utilisateur existant en super_admin
-- Remplacez 'email@example.com' par l'email de l'utilisateur

UPDATE public.profiles
SET 
  role = 'super_admin',
  statut_validation = 'valide',
  statut_membre = 'actif',
  updated_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'kodjodavid2025@gmail.com'
);

-- Vérifier que la mise à jour a fonctionné
SELECT 
  p.full_name,
  u.email,
  p.role,
  p.statut_validation,
  p.statut_membre
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
WHERE u.email = 'kodjodavid2025@gmail.com';

-- ============================================

-- Option 2: Créer un nouveau compte admin complet
-- ⚠️ ATTENTION: Ceci crée un VRAI compte

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
    'admin@chorale.com',  -- ← Changez l'email
    crypt('AdminPassword123!', gen_salt('bf')),  -- ← Changez le mot de passe
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Super Admin"}',  -- ← Changez le nom
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
    'Super Admin',  -- ← Changez le nom
    'super_admin',
    'valide',
    'actif',
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '✅ Compte admin créé avec succès';
  RAISE NOTICE 'Email: admin@chorale.com';
  RAISE NOTICE 'Mot de passe: AdminPassword123!';
  RAISE NOTICE 'User ID: %', new_user_id;
END $$;
*/
