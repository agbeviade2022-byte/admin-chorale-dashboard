-- ============================================
-- FIX FINAL: Corriger la fonction handle_new_user()
-- ============================================
-- Problème identifié: La fonction essaie d'insérer dans une colonne 'email'
-- qui n'existe pas dans la table profiles

-- ============================================
-- ÉTAPE 1: Supprimer l'ancienne fonction
-- ============================================

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ============================================
-- ÉTAPE 2: Créer la fonction CORRIGÉE
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insérer un nouveau profil pour l'utilisateur
  -- NOTE: La colonne 'email' n'existe PAS dans profiles (elle est dans auth.users)
  -- NOTE: La colonne 'id' sera générée automatiquement par uuid_generate_v4()
  
  INSERT INTO public.profiles (
    user_id,
    full_name,
    role,
    statut_validation,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur'),
    'membre',
    'en_attente',
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
-- ÉTAPE 5: Créer les profils manquants
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
-- ÉTAPE 6: Vérifier le résultat
-- ============================================

SELECT 
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT p.user_id) as users_with_profile,
  COUNT(DISTINCT u.id) - COUNT(DISTINCT p.user_id) as users_without_profile
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id;

-- Résultat attendu: users_without_profile = 0

-- ============================================
-- ÉTAPE 7: Tester manuellement
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
-- ✅ Fonction handle_new_user() recréée SANS colonne email
-- ✅ Trigger on_auth_user_created recréé
-- ✅ Tous les utilisateurs ont un profil
-- ✅ Test manuel réussi
-- ✅ L'inscription dans l'app Flutter devrait fonctionner

-- ============================================
-- COMMENT TESTER
-- ============================================

-- 1. Exécutez ce script dans Supabase SQL Editor
-- 2. Vérifiez qu'il n'y a pas d'erreur
-- 3. Allez dans l'app Flutter
-- 4. Essayez de créer un nouveau compte
-- 5. L'inscription devrait fonctionner ✅

-- Pour voir les logs du trigger:
-- Supabase Dashboard → Logs → Database
-- Cherchez "Profil créé pour user_id"
