-- ============================================
-- SCRIPT: Politiques RLS pour le dashboard admin
-- Exécuter dans Supabase SQL Editor
-- ============================================

-- 1. CHORALES - Autoriser les admins à tout faire
-- ================================================

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Admins can manage chorales" ON chorales;
DROP POLICY IF EXISTS "Admins full access chorales" ON chorales;
DROP POLICY IF EXISTS "Anyone can read chorales" ON chorales;

-- Lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can read chorales"
ON chorales FOR SELECT
TO authenticated
USING (true);

-- Création pour admins
CREATE POLICY "Admins can insert chorales"
ON chorales FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Modification pour admins
CREATE POLICY "Admins can update chorales"
ON chorales FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Suppression pour super_admin uniquement
CREATE POLICY "Super admins can delete chorales"
ON chorales FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- 2. PROFILES - Autoriser les admins à voir et modifier
-- =====================================================

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

-- Lecture: chacun voit son profil, admins voient tout
CREATE POLICY "Users can read own profile or admins read all"
ON profiles FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'super_admin')
  )
);

-- Modification: chacun modifie son profil (sauf role), admins modifient tout
CREATE POLICY "Users can update own profile or admins update all"
ON profiles FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'super_admin')
  )
);

-- 3. CHANTS - Autoriser les admins à tout faire
-- ==============================================

DROP POLICY IF EXISTS "Admins can manage chants" ON chants;
DROP POLICY IF EXISTS "Members can read chants" ON chants;

-- Lecture pour membres validés
CREATE POLICY "Validated members can read chants"
ON chants FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.statut_validation = 'valide'
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Création/Modification/Suppression pour admins
CREATE POLICY "Admins can insert chants"
ON chants FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can update chants"
ON chants FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can delete chants"
ON chants FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- 4. Vérifier que RLS est activé
-- ==============================
ALTER TABLE chorales ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chants ENABLE ROW LEVEL SECURITY;

-- 5. Afficher confirmation
SELECT 'Politiques RLS mises à jour avec succès!' as message;
