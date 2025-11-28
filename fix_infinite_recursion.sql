-- ============================================
-- FIX: Récursion infinie dans les RLS policies
-- ============================================

-- Problème: Les policies vérifient "EXISTS (SELECT FROM profiles)"
-- ce qui déclenche à nouveau la policy → récursion infinie

-- Solution: Créer une fonction helper qui utilise SECURITY DEFINER
-- pour contourner les RLS policies

-- ============================================
-- ÉTAPE 1: Créer une fonction helper
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin_or_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND statut_validation = 'valide'
  );
END;
$$;

-- ============================================
-- ÉTAPE 2: Supprimer les policies problématiques
-- ============================================

DROP POLICY IF EXISTS "admins_can_select_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_can_update_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "super_admins_can_delete_profiles" ON public.profiles;

-- ============================================
-- ÉTAPE 3: Créer les nouvelles policies SANS récursion
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
  -- OU l'utilisateur est admin/super_admin (utilise la fonction helper)
  is_admin_or_super_admin()
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
  -- OU l'utilisateur est admin/super_admin (utilise la fonction helper)
  is_admin_or_super_admin()
)
WITH CHECK (
  -- L'utilisateur peut modifier son propre profil
  user_id = auth.uid()
  OR
  -- OU l'utilisateur est admin/super_admin (utilise la fonction helper)
  is_admin_or_super_admin()
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
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY cmd, policyname;

-- ============================================
-- RÉSULTAT ATTENDU
-- ============================================

-- ✅ Fonction is_admin_or_super_admin() créée avec SECURITY DEFINER
-- ✅ Policies recréées sans récursion
-- ✅ Plus d'erreur "infinite recursion"

-- ============================================
-- EXPLICATION
-- ============================================

-- La fonction is_admin_or_super_admin() utilise SECURITY DEFINER
-- ce qui signifie qu'elle s'exécute avec les privilèges du propriétaire
-- de la fonction (postgres), et non de l'utilisateur qui l'appelle.
-- Cela contourne les RLS policies et évite la récursion.
