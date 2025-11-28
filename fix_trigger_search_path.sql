-- ============================================
-- FIX: Corriger le search_path du trigger
-- ============================================

-- Le problème: Le trigger ne trouve pas la table profiles
-- Cause probable: Le search_path de la fonction ne contient pas 'public'

-- ============================================
-- ÉTAPE 1: Supprimer l'ancienne fonction
-- ============================================

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ============================================
-- ÉTAPE 2: Créer la fonction avec search_path explicite
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth  -- ✅ IMPORTANT: Définir explicitement le search_path
AS $$
BEGIN
  -- Insérer un nouveau profil pour l'utilisateur
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
-- ÉTAPE 4: Vérifier le search_path de la fonction
-- ============================================

SELECT 
  proname as function_name,
  proconfig as search_path_config
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Résultat attendu: search_path_config contient 'public' et 'auth'

-- ============================================
-- ÉTAPE 5: Tester manuellement
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

-- Après exécution:
-- ✅ Fonction recréée avec search_path = public, auth
-- ✅ Trigger recréé
-- ✅ Test manuel réussi
-- ✅ L'inscription Flutter devrait fonctionner

-- ============================================
-- EXPLICATION
-- ============================================

-- Le problème était que la fonction handle_new_user() n'avait pas
-- de search_path défini explicitement. Quand Supabase Auth appelle
-- le trigger, le search_path peut ne pas contenir 'public', donc
-- la fonction ne trouve pas la table 'profiles'.

-- La solution est d'ajouter "SET search_path = public, auth" à la
-- définition de la fonction. Cela garantit que la fonction cherchera
-- toujours dans les schémas 'public' et 'auth'.
