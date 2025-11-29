-- =====================================================
-- CORRECTION DU TRIGGER QUI BLOQUE LES MODIFICATIONS DE RÔLE
-- =====================================================
-- Ce script corrige l'erreur :
-- "Seul un super admin peut modifier le rôle d'un utilisateur."
-- =====================================================

-- 1. D'abord, identifier et supprimer le trigger existant
-- =====================================================

-- Voir les triggers sur la table profiles
SELECT 
    tgname as trigger_name,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'profiles'
AND NOT t.tgisinternal;

-- 2. Supprimer le trigger problématique (s'il existe)
-- =====================================================
DROP TRIGGER IF EXISTS check_role_update_trigger ON profiles;
DROP TRIGGER IF EXISTS protect_role_changes ON profiles;
DROP TRIGGER IF EXISTS validate_role_update ON profiles;
DROP TRIGGER IF EXISTS before_profile_update ON profiles;

-- 3. Supprimer les fonctions associées (s'il existe)
-- =====================================================
DROP FUNCTION IF EXISTS check_role_update() CASCADE;
DROP FUNCTION IF EXISTS protect_role_changes() CASCADE;
DROP FUNCTION IF EXISTS validate_role_update() CASCADE;
DROP FUNCTION IF EXISTS before_profile_update() CASCADE;

-- 4. Créer une nouvelle fonction de validation CORRIGÉE
-- =====================================================
-- Cette version vérifie correctement si l'utilisateur est super_admin

CREATE OR REPLACE FUNCTION check_role_update_fixed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_role text;
BEGIN
    -- Si le rôle n'a pas changé, on laisse passer
    IF OLD.role = NEW.role THEN
        RETURN NEW;
    END IF;

    -- Récupérer le rôle de l'utilisateur qui fait la modification
    SELECT role INTO current_user_role
    FROM profiles
    WHERE user_id = auth.uid();

    -- Si l'utilisateur est super_admin, il peut tout faire
    IF current_user_role = 'super_admin' THEN
        RETURN NEW;
    END IF;

    -- Si l'utilisateur est admin, il ne peut PAS:
    -- - Créer un super_admin
    -- - Modifier un super_admin
    IF current_user_role = 'admin' THEN
        -- Un admin ne peut pas promouvoir quelqu'un en super_admin
        IF NEW.role = 'super_admin' THEN
            RAISE EXCEPTION 'Seul un super admin peut créer un autre super admin.';
        END IF;
        
        -- Un admin ne peut pas modifier un super_admin
        IF OLD.role = 'super_admin' THEN
            RAISE EXCEPTION 'Seul un super admin peut modifier un autre super admin.';
        END IF;
        
        -- Sinon, un admin peut modifier les autres rôles
        RETURN NEW;
    END IF;

    -- Les autres utilisateurs ne peuvent pas modifier les rôles
    RAISE EXCEPTION 'Vous n''avez pas les droits pour modifier le rôle d''un utilisateur.';
END;
$$;

-- 5. Attacher le nouveau trigger à la table profiles
-- =====================================================
CREATE TRIGGER check_role_update_trigger
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION check_role_update_fixed();

-- 6. Accorder les permissions nécessaires
-- =====================================================
GRANT EXECUTE ON FUNCTION check_role_update_fixed() TO authenticated;

-- 7. Vérification finale
-- =====================================================
SELECT 
    tgname as trigger_name,
    'OK - Trigger correctement installé' as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'profiles'
AND tgname = 'check_role_update_trigger';

-- =====================================================
-- ALTERNATIVE : DÉSACTIVER COMPLÈTEMENT LA VÉRIFICATION
-- =====================================================
-- Si tu veux simplement désactiver cette protection,
-- décommente les lignes ci-dessous :

-- DROP TRIGGER IF EXISTS check_role_update_trigger ON profiles;
-- DROP FUNCTION IF EXISTS check_role_update_fixed() CASCADE;

-- =====================================================
-- RÉSUMÉ DES CORRECTIONS
-- =====================================================
-- ✅ Suppression de l'ancien trigger défectueux
-- ✅ Création d'une nouvelle fonction qui vérifie CORRECTEMENT
--    le rôle de l'utilisateur via auth.uid()
-- ✅ Le super_admin peut maintenant tout modifier
-- ✅ L'admin peut modifier les rôles sauf super_admin
-- =====================================================
