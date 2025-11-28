-- ============================================
-- VÉRIFIER: La table profiles existe-t-elle ?
-- ============================================

-- 1. Vérifier si la table profiles existe
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename = 'profiles';

-- Résultat attendu: 1 ligne avec schemaname = 'public'
-- Si 0 ligne → La table n'existe pas !
-- Si schemaname ≠ 'public' → La table est dans le mauvais schéma

-- ============================================

-- 2. Vérifier les colonnes de la table profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Résultat attendu: Liste des colonnes (id, user_id, full_name, role, etc.)
-- Si 0 ligne → La table n'existe pas dans public

-- ============================================

-- 3. Vérifier toutes les tables dans le schéma public
SELECT 
  tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Cherchez "profiles" dans la liste

-- ============================================

-- 4. Vérifier si la table existe dans un autre schéma
SELECT 
  schemaname,
  tablename
FROM pg_tables
WHERE tablename LIKE '%profile%'
ORDER BY schemaname, tablename;

-- Peut-être que la table s'appelle différemment ou est dans un autre schéma

-- ============================================

-- 5. Vérifier les permissions sur la table profiles
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'profiles';

-- Vérifiez que 'postgres' et 'service_role' ont les permissions

-- ============================================
-- DIAGNOSTIC
-- ============================================

-- Si la requête #1 retourne 0 ligne:
-- → La table profiles n'existe PAS !
-- → Il faut la créer

-- Si la requête #1 retourne schemaname ≠ 'public':
-- → La table existe mais dans le mauvais schéma
-- → Il faut modifier le trigger pour pointer vers le bon schéma

-- Si la requête #1 retourne schemaname = 'public':
-- → La table existe
-- → Le problème est probablement les permissions
-- → Vérifiez la requête #5
