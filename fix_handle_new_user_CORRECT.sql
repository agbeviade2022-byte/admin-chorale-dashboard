-- ============================================
-- FIX FINAL CORRECT: Corriger la fonction handle_new_user()
-- ============================================
-- Problème identifié: La fonction insère dans "id" au lieu de "user_id"
-- La colonne "id" est la PRIMARY KEY auto-générée
-- La colonne "user_id" est la FOREIGN KEY vers auth.users

-- ============================================
-- ÉTAPE 1: Supprimer l'ancienne fonction
-- ============================================

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ============================================
-- ÉTAPE 2: Créer la fonction CORRECTE
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insérer un nouveau profil pour l'utilisateur
  -- IMPORTANT: 
  -- - "id" est la PRIMARY KEY auto-générée (uuid_generate_v4())
  -- - "user_id" est la FOREIGN KEY vers auth.users.id
  -- - NEW.id contient l'ID de l'utilisateur dans auth.users
  
  INSERT INTO public.profiles (
    user_id,              -- ✅ FOREIGN KEY vers auth.users.id
    full_name,            -- ✅ Nom complet de l'utilisateur
    role,                 -- ✅ Rôle par défaut
    statut_validation,    -- ✅ Statut de validation
    created_at,           -- ✅ Date de création
    updated_at            -- ✅ Date de mise à jour
  )
  VALUES (
    NEW.id,               -- ✅ ID de l'utilisateur dans auth.users
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur'),
    'membre',             -- ✅ Rôle par défaut
    'en_attente',         -- ✅ Statut par défaut
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '✅ Profil créé pour user_id: % (email: %)', NEW.id, NEW.email;
  
  RETURN NEW;
  
EXCEPTION
  WHEN unique_violation THEN
    RAISE WARNING '⚠️ Profil existe déjà pour user_id: %', NEW.id;
    RETURN NEW;
    
  WHEN OTHERS THEN
    RAISE WARNING '❌ Erreur création profil pour user_id: %, erreur: %', NEW.id, SQLERRM;
    RAISE WARNING 'Code erreur: %', SQLSTATE;
    -- Ne pas bloquer l'inscription même en cas d'erreur
    RETURN NEW;
END;
$$;

-- ============================================
-- ÉTAPE 3: Recréer le trigger
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ÉTAPE 4: Vérifier que le trigger est créé
-- ============================================

SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Résultat attendu: 1 ligne

-- ============================================
-- ÉTAPE 5: Vérifier le code de la fonction
-- ============================================

SELECT pg_get_functiondef(oid) as function_code
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Vérifiez que la fonction insère dans "user_id" et non "id"

-- ============================================
-- ÉTAPE 6: Créer les profils manquants
-- ============================================

-- Pour tous les utilisateurs qui n'ont pas de profil
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
);

-- ============================================
-- ÉTAPE 7: Vérifier le résultat
-- ============================================

SELECT 
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT p.user_id) as users_with_profile,
  COUNT(DISTINCT u.id) - COUNT(DISTINCT p.user_id) as users_without_profile
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id;

-- Résultat attendu: users_without_profile = 0

-- ============================================
-- ÉTAPE 8: Tester manuellement
-- ============================================

DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
BEGIN
  RAISE NOTICE '🧪 Test: Insertion comme le trigger';
  
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
  
  RAISE NOTICE '✅ Test réussi: insertion fonctionne';
  
  -- Vérifier le profil créé
  DECLARE
    profile_id uuid;
    profile_user_id uuid;
  BEGIN
    SELECT id, user_id INTO profile_id, profile_user_id
    FROM public.profiles
    WHERE user_id = test_user_id;
    
    RAISE NOTICE 'Profil créé - id: %, user_id: %', profile_id, profile_user_id;
    
    IF profile_id IS NOT NULL AND profile_user_id = test_user_id THEN
      RAISE NOTICE '✅ Structure correcte: id (PK) ≠ user_id (FK)';
    END IF;
  END;
  
  DELETE FROM public.profiles WHERE user_id = test_user_id;
  RAISE NOTICE '✅ Profil de test supprimé';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Test échoué: %', SQLERRM;
END $$;

-- ============================================
-- RÉSULTAT ATTENDU
-- ============================================

-- Après exécution de ce script:
-- ✅ Fonction handle_new_user() recréée avec user_id (pas id)
-- ✅ Trigger on_auth_user_created recréé
-- ✅ Tous les utilisateurs ont un profil
-- ✅ Test manuel réussi
-- ✅ L'inscription dans l'app Flutter devrait fonctionner

-- ============================================
-- EXPLICATION
-- ============================================

-- Structure de la table profiles:
-- - id (PRIMARY KEY, uuid, auto-généré par uuid_generate_v4())
-- - user_id (FOREIGN KEY vers auth.users.id, nullable)
-- - full_name, role, statut_validation, etc.

-- Le trigger doit insérer NEW.id dans user_id, PAS dans id
-- La colonne id sera auto-générée par la base de données

-- ============================================
-- COMMENT TESTER
-- ============================================

-- 1. Exécutez ce script dans Supabase SQL Editor
-- 2. Vérifiez qu'il n'y a pas d'erreur
-- 3. Vérifiez que le test manuel réussit
-- 4. Allez dans l'app Flutter
-- 5. Essayez de créer un nouveau compte
-- 6. L'inscription devrait fonctionner ✅
