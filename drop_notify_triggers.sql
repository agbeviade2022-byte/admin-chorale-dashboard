-- ============================================
-- SUPPRIMER LES TRIGGERS DE NOTIFICATION
-- ============================================

-- On ne peut pas les désactiver (pas propriétaire de auth.users)
-- Donc on les supprime complètement

-- 1. Supprimer trigger_notify_admin_new_signup
DROP TRIGGER IF EXISTS trigger_notify_admin_new_signup ON auth.users;

-- 2. Supprimer trigger_notify_admin_email_confirmed
DROP TRIGGER IF EXISTS trigger_notify_admin_email_confirmed ON auth.users;

-- 3. Supprimer les fonctions associées (optionnel)
DROP FUNCTION IF EXISTS public.notify_admin_new_signup() CASCADE;
DROP FUNCTION IF EXISTS public.notify_admin_email_confirmed() CASCADE;

-- ============================================
-- VÉRIFIER QU'ILS SONT SUPPRIMÉS
-- ============================================

SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- Résultat attendu: 0 ligne (tous les triggers supprimés)

-- ============================================
-- VÉRIFIER LES FONCTIONS
-- ============================================

SELECT 
  proname as function_name
FROM pg_proc
WHERE proname IN ('notify_admin_new_signup', 'notify_admin_email_confirmed');

-- Résultat attendu: 0 ligne (fonctions supprimées)
