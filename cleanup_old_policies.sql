-- ============================================
-- NETTOYER LES ANCIENNES POLICIES
-- ============================================

-- Supprimer les anciennes policies qui utilisent "id" au lieu de "user_id"
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "delete_profile_super_admin" ON public.profiles;

-- Vérifier qu'il ne reste que les bonnes policies
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY cmd, policyname;

-- ============================================
-- RÉSULTAT ATTENDU
-- ============================================

-- DELETE:
-- ✅ super_admins_can_delete_profiles

-- INSERT:
-- ✅ allow_insert_profile
-- ✅ allow_service_role_insert

-- SELECT:
-- ✅ admins_can_select_all_profiles

-- UPDATE:
-- ✅ admins_can_update_all_profiles
