-- ============================================
-- DÉSACTIVER LES TRIGGERS DE NOTIFICATION
-- ============================================

-- Ces triggers peuvent causer l'erreur d'inscription
-- On les désactive temporairement pour tester

-- 1. Désactiver trigger_notify_admin_new_signup
ALTER TABLE auth.users DISABLE TRIGGER trigger_notify_admin_new_signup;

-- 2. Désactiver trigger_notify_admin_email_confirmed
ALTER TABLE auth.users DISABLE TRIGGER trigger_notify_admin_email_confirmed;

-- ============================================
-- VÉRIFIER QU'ILS SONT DÉSACTIVÉS
-- ============================================

SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  tgenabled
FROM information_schema.triggers t
JOIN pg_trigger pt ON pt.tgname = t.trigger_name
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- tgenabled devrait être 'D' (Disabled) pour les deux triggers

-- ============================================
-- POUR LES RÉACTIVER PLUS TARD
-- ============================================

-- ALTER TABLE auth.users ENABLE TRIGGER trigger_notify_admin_new_signup;
-- ALTER TABLE auth.users ENABLE TRIGGER trigger_notify_admin_email_confirmed;
