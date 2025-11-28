-- ============================================
-- FIX: Ajouter une RLS Policy pour INSERT
-- ============================================
-- Problème: Pas de policy INSERT sur la table profiles
-- Le trigger ne peut pas insérer car RLS bloque

-- ============================================
-- ÉTAPE 1: Vérifier si RLS est activé
-- ============================================

SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'profiles';

-- Si rowsecurity = true, RLS est activé

-- ============================================
-- ÉTAPE 2: Voir les policies actuelles
-- ============================================

SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- ============================================
-- ÉTAPE 3: Ajouter une policy pour INSERT
-- ============================================

-- Policy pour permettre l'insertion lors de l'inscription
-- Le trigger s'exécute avec SECURITY DEFINER, donc il a les droits
-- Mais on ajoute aussi une policy pour permettre aux users de s'inscrire

CREATE POLICY "allow_insert_own_profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Cette policy permet à un utilisateur authentifié d'insérer
-- son propre profil (user_id = auth.uid())

-- ============================================
-- ÉTAPE 4: Ajouter une policy pour le trigger
-- ============================================

-- Le trigger s'exécute APRÈS la création de l'utilisateur
-- À ce moment, l'utilisateur est déjà authentifié
-- Mais pour être sûr, on ajoute aussi une policy pour service_role

CREATE POLICY "allow_service_role_insert"
ON public.profiles
FOR INSERT
TO service_role
WITH CHECK (true);

-- Cette policy permet au service_role (utilisé par les triggers)
-- d'insérer n'importe quel profil

-- ============================================
-- ÉTAPE 5: Vérifier les nouvelles policies
-- ============================================

SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- Résultat attendu:
-- DELETE: delete_profile_super_admin
-- INSERT: allow_insert_own_profile (authenticated)
-- INSERT: allow_service_role_insert (service_role)
-- SELECT: select_own_profile
-- UPDATE: update_own_profile

-- ============================================
-- ÉTAPE 6: Tester l'insertion
-- ============================================

DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
BEGIN
  RAISE NOTICE '🧪 Test: Insertion avec les nouvelles policies';
  
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
    RAISE NOTICE 'Code erreur: %', SQLSTATE;
END $$;

-- ============================================
-- ALTERNATIVE: Désactiver RLS temporairement
-- ============================================

-- Si vous voulez désactiver RLS pour tester:
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Puis réactiver après:
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RÉSULTAT ATTENDU
-- ============================================

-- Après exécution:
-- ✅ Policy INSERT ajoutée pour authenticated
-- ✅ Policy INSERT ajoutée pour service_role
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
