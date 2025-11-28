-- ============================================
-- VÉRIFIER TOUS LES TRIGGERS SUR auth.users
-- ============================================

-- 1. Tous les triggers sur auth.users
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- Si vous voyez des triggers ici, ils peuvent causer le problème

-- ============================================

-- 2. Toutes les fonctions qui contiennent 'profile' ou 'user'
SELECT 
  proname as function_name,
  pronamespace::regnamespace as schema
FROM pg_proc
WHERE proname ILIKE '%profile%'
   OR proname ILIKE '%user%'
ORDER BY proname;

-- ============================================

-- 3. Vérifier les hooks Supabase (webhooks)
SELECT 
  id,
  hook_table_id,
  hook_name,
  type,
  events
FROM supabase_functions.hooks
WHERE hook_table_id IN (
  SELECT id FROM supabase_functions.hook_tables 
  WHERE schema_name = 'auth' AND table_name = 'users'
);

-- Si cette requête échoue, c'est normal (pas de hooks configurés)

-- ============================================

-- 4. Vérifier les RLS policies sur auth.users
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'auth'
  AND tablename = 'users';

-- ============================================
-- DIAGNOSTIC
-- ============================================

-- Si requête #1 montre des triggers:
-- → Il reste des triggers qui causent le problème
-- → Il faut les supprimer

-- Si requête #2 montre des fonctions suspectes:
-- → Vérifier si elles sont appelées par des triggers

-- Si requête #3 montre des hooks:
-- → Les désactiver dans Supabase Dashboard

-- Si requête #4 montre des policies:
-- → Vérifier qu'elles ne bloquent pas l'insertion
