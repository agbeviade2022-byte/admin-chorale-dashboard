-- ============================================
-- FIX TEMPORAIRE: Adapter le trigger à la structure actuelle
-- ============================================
-- Ce script adapte le trigger pour fonctionner avec la structure
-- actuelle qui a une colonne 'id' comme PRIMARY KEY

-- IMPORTANT: Ceci est une solution temporaire
-- La vraie solution est d'exécuter fix_profiles_structure.sql

-- ============================================

-- 1. Supprimer l'ancien trigger et fonction
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Créer la fonction adaptée à la structure actuelle
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insérer un nouveau profil
  -- La colonne 'id' sera générée automatiquement par uuid_generate_v4()
  -- On insère juste user_id et les autres champs
  INSERT INTO public.profiles (
    user_id,           -- ← Lien vers auth.users
    full_name,
    role,
    statut_validation,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,            -- ← ID de l'utilisateur depuis auth.users
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur'),
    'membre',
    'en_attente',
    NOW(),
    NOW()
  );
  
  RAISE NOTICE 'Profil créé pour user_id: %, id auto-généré', NEW.id;
  
  RETURN NEW;
  
EXCEPTION
  WHEN unique_violation THEN
    RAISE WARNING 'Profil existe déjà pour user_id: %', NEW.id;
    RETURN NEW;
    
  WHEN OTHERS THEN
    RAISE WARNING 'Erreur création profil pour user_id: %, erreur: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Vérifier
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================
-- TEST
-- ============================================

-- Créer les profils manquants pour les utilisateurs existants
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

-- Vérifier le résultat
SELECT 
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT p.user_id) as users_with_profile
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id;

-- ============================================
-- IMPORTANT
-- ============================================

-- Ce trigger fonctionne avec la structure actuelle:
-- - 'id' est généré automatiquement (PRIMARY KEY)
-- - 'user_id' contient l'ID de auth.users
-- 
-- MAIS cette structure n'est pas optimale car:
-- - 'id' et 'user_id' sont différents
-- - Pas de FOREIGN KEY entre profiles.user_id et auth.users.id
-- - Risque de profils orphelins
--
-- Solution recommandée: Exécutez fix_profiles_structure.sql
-- pour corriger la structure de la table
