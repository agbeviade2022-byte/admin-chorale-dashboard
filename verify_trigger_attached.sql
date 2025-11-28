-- ============================================
-- VÉRIFIER: Le trigger est-il attaché à auth.users ?
-- ============================================

-- 1. Vérifier tous les triggers sur auth.users
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing,
  action_orientation
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- Résultat attendu: Vous devez voir "on_auth_user_created"
-- Si vous ne le voyez PAS → Le trigger n'est pas attaché !

-- ============================================

-- 2. Vérifier la définition exacte du trigger
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgfoid::regproc as function_name,
  tgenabled as enabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- Résultat attendu:
-- trigger_name: on_auth_user_created
-- table_name: auth.users
-- function_name: handle_new_user
-- enabled: O (pour "Origin", signifie activé)

-- ============================================

-- 3. Vérifier que la fonction existe
SELECT 
  proname,
  pronamespace::regnamespace as schema,
  proconfig
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Résultat attendu:
-- proname: handle_new_user
-- schema: public
-- proconfig: {search_path=public, auth}

-- ============================================
-- DIAGNOSTIC
-- ============================================

-- Si requête #1 ne montre PAS "on_auth_user_created":
-- → Le trigger n'est PAS attaché à auth.users
-- → Il faut le créer

-- Si requête #2 montre table_name ≠ "auth.users":
-- → Le trigger est attaché à la mauvaise table
-- → Il faut le recréer

-- Si requête #2 montre enabled = 'D' (Disabled):
-- → Le trigger est désactivé
-- → Il faut l'activer
