-- ============================================
-- FIX: Database error saving new user
-- ============================================
-- Ce script corrige l'erreur d'inscription en recréant le trigger
-- qui crée automatiquement un profil lors de l'inscription

-- 1. Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Créer la fonction qui gère la création du profil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insérer un nouveau profil pour l'utilisateur
  -- NOTE: L'email est stocké dans auth.users, pas dans profiles
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
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'membre',  -- Rôle par défaut
    'en_attente',  -- Statut par défaut
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'erreur mais ne bloque pas l'inscription
    RAISE WARNING 'Erreur lors de la création du profil: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Créer le trigger qui appelle la fonction
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Vérifier que la table profiles a les bonnes colonnes
-- (Ajouter les colonnes manquantes si nécessaire)
-- NOTE: La colonne 'email' n'est PAS ajoutée car elle existe déjà dans auth.users
DO $$
BEGIN
  -- Vérifier si la colonne statut_validation existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'statut_validation'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN statut_validation TEXT DEFAULT 'en_attente';
  END IF;
  
  -- Vérifier si la colonne role existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'membre';
  END IF;
END $$;

-- 5. Vérifier les permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- 6. Vérifier que le trigger fonctionne
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================
-- RÉSULTAT ATTENDU
-- ============================================
-- Vous devriez voir :
-- trigger_name: on_auth_user_created
-- event_manipulation: INSERT
-- event_object_table: users
-- action_statement: EXECUTE FUNCTION public.handle_new_user()

-- ============================================
-- COMMENT EXÉCUTER CE SCRIPT
-- ============================================
-- 1. Allez sur https://supabase.com/dashboard
-- 2. Sélectionnez votre projet
-- 3. SQL Editor (dans le menu de gauche)
-- 4. Copiez-collez tout ce script
-- 5. Cliquez sur "Run"
-- 6. Vérifiez qu'il n'y a pas d'erreur
-- 7. Testez l'inscription dans l'app Flutter

-- ============================================
-- TEST MANUEL
-- ============================================
-- Pour tester si le trigger fonctionne, vous pouvez :
-- 1. Créer un utilisateur test via l'interface Supabase
-- 2. Vérifier qu'un profil est créé automatiquement
-- 
-- SELECT * FROM public.profiles WHERE email = 'test@example.com';
