-- ============================================
-- FIX: Permettre aux admins d'accéder aux profils
-- ============================================

-- Le problème: Les RLS policies bloquent l'accès des admins aux profils

-- ============================================
-- ÉTAPE 1: Vérifier les policies actuelles
-- ============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY cmd, policyname;

-- ============================================
-- ÉTAPE 2: Supprimer les anciennes policies restrictives
-- ============================================

-- Supprimer les policies qui bloquent l'accès
DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "admins_can_select_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_can_update_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "super_admins_can_delete_profiles" ON public.profiles;

-- ============================================
-- ÉTAPE 3: Créer les nouvelles policies pour les admins
-- ============================================

-- Policy SELECT pour les admins et super_admins
CREATE POLICY "admins_can_select_all_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- L'utilisateur peut voir son propre profil
  user_id = auth.uid()
  OR
  -- OU l'utilisateur est admin/super_admin
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND statut_validation = 'valide'
  )
);

-- Policy UPDATE pour les admins et super_admins
CREATE POLICY "admins_can_update_all_profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  -- L'utilisateur peut modifier son propre profil
  user_id = auth.uid()
  OR
  -- OU l'utilisateur est admin/super_admin
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND statut_validation = 'valide'
  )
)
WITH CHECK (
  -- L'utilisateur peut modifier son propre profil
  user_id = auth.uid()
  OR
  -- OU l'utilisateur est admin/super_admin
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND statut_validation = 'valide'
  )
);

-- Policy DELETE pour les super_admins uniquement
CREATE POLICY "super_admins_can_delete_profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND statut_validation = 'valide'
  )
);

-- ============================================
-- ÉTAPE 4: Vérifier les nouvelles policies
-- ============================================

SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY cmd, policyname;

-- ============================================
-- RÉSULTAT ATTENDU
-- ============================================

-- ✅ admins_can_select_all_profiles (SELECT)
-- ✅ admins_can_update_all_profiles (UPDATE)
-- ✅ super_admins_can_delete_profiles (DELETE)
-- ✅ allow_insert_own_profile (INSERT)
-- ✅ allow_service_role_insert (INSERT)

-- ============================================
-- TEST
-- ============================================

-- Tester que l'admin peut lire les profils
-- (Exécuter en tant qu'admin connecté)

/*
SELECT 
  id,
  user_id,
  full_name,
  role,
  statut_validation
FROM public.profiles
LIMIT 5;
*/

-- Devrait retourner tous les profils (pas seulement le sien)
