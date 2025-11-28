-- ============================================
-- SUPPRIMER LE TRIGGER PROBLÉMATIQUE
-- ============================================

-- 1. Supprimer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Supprimer la fonction
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 3. Vérifier que le trigger est supprimé
SELECT 
  trigger_name,
  event_object_schema,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Résultat attendu: 0 ligne (le trigger n'existe plus)

-- 4. Vérifier que la fonction est supprimée
SELECT 
  proname
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Résultat attendu: 0 ligne (la fonction n'existe plus)

-- ============================================
-- RÉSULTAT
-- ============================================

-- ✅ Trigger supprimé
-- ✅ Fonction supprimée
-- ✅ Plus d'erreur "Database error saving new user"

-- ⚠️ IMPORTANT: Maintenant il faut créer le profil manuellement dans Flutter
-- Voir le fichier enhanced_auth_service.dart modifié
