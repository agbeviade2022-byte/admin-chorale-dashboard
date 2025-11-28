-- ============================================
-- RECRÉER LE TRIGGER AVEC LOGS DÉTAILLÉS
-- ============================================
-- Ce script recrée le trigger avec une meilleure gestion d'erreur
-- et des logs pour déboguer

-- 1. Supprimer l'ancien trigger et fonction
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Créer la fonction avec logs détaillés
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_full_name text;
BEGIN
  -- Récupérer le full_name depuis les métadonnées
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  
  -- Log de début
  RAISE NOTICE 'handle_new_user: Début pour user_id=%', NEW.id;
  RAISE NOTICE 'handle_new_user: email=%', NEW.email;
  RAISE NOTICE 'handle_new_user: full_name=%', v_full_name;
  
  -- Insérer le profil
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
    v_full_name,
    'membre',
    'en_attente',
    NOW(),
    NOW()
  );
  
  -- Log de succès
  RAISE NOTICE 'handle_new_user: Profil créé avec succès pour user_id=%', NEW.id;
  
  RETURN NEW;
  
EXCEPTION
  WHEN unique_violation THEN
    -- Le profil existe déjà (peut arriver si le trigger se déclenche 2 fois)
    RAISE WARNING 'handle_new_user: Profil existe déjà pour user_id=%', NEW.id;
    RETURN NEW;
    
  WHEN foreign_key_violation THEN
    -- Problème avec une clé étrangère (ex: chorale_id invalide)
    RAISE WARNING 'handle_new_user: Erreur foreign key pour user_id=%, erreur=%', NEW.id, SQLERRM;
    RETURN NEW;
    
  WHEN not_null_violation THEN
    -- Une colonne NOT NULL n'a pas de valeur
    RAISE WARNING 'handle_new_user: Erreur NOT NULL pour user_id=%, erreur=%', NEW.id, SQLERRM;
    RETURN NEW;
    
  WHEN OTHERS THEN
    -- Toute autre erreur
    RAISE WARNING 'handle_new_user: Erreur inattendue pour user_id=%, erreur=%', NEW.id, SQLERRM;
    RAISE WARNING 'handle_new_user: SQLSTATE=%', SQLSTATE;
    -- Ne pas bloquer l'inscription même en cas d'erreur
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Vérifier que le trigger est créé
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Résultat attendu : 1 ligne

-- ============================================
-- TEST DU TRIGGER
-- ============================================

-- Pour tester, créez un utilisateur test via l'interface Supabase
-- ou via l'app Flutter, puis vérifiez les logs dans Supabase:
-- Dashboard → Logs → Database

-- Vous devriez voir des messages comme:
-- NOTICE: handle_new_user: Début pour user_id=...
-- NOTICE: handle_new_user: email=...
-- NOTICE: handle_new_user: full_name=...
-- NOTICE: handle_new_user: Profil créé avec succès

-- Si vous voyez WARNING au lieu de NOTICE, il y a une erreur
-- Le message WARNING vous dira exactement quel est le problème

-- ============================================
-- VÉRIFIER LES PROFILS CRÉÉS
-- ============================================

SELECT 
  p.user_id,
  p.full_name,
  u.email,
  p.role,
  p.statut_validation,
  p.created_at
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
ORDER BY p.created_at DESC
LIMIT 10;
