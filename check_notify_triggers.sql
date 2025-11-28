-- ============================================
-- VÉRIFIER LES TRIGGERS DE NOTIFICATION
-- ============================================

-- 1. Voir le code de notify_admin_new_signup
SELECT pg_get_functiondef(oid) as function_code
FROM pg_proc
WHERE proname = 'notify_admin_new_signup';

-- ============================================

-- 2. Voir le code de notify_admin_email_confirmed
SELECT pg_get_functiondef(oid) as function_code
FROM pg_proc
WHERE proname = 'notify_admin_email_confirmed';

-- ============================================

-- 3. Voir le code de create_profile_on_signup (suspect aussi)
SELECT pg_get_functiondef(oid) as function_code
FROM pg_proc
WHERE proname = 'create_profile_on_signup';

-- ============================================
-- CES TRIGGERS PEUVENT CAUSER L'ERREUR
-- ============================================

-- Si l'une de ces fonctions essaie d'accéder à la table profiles
-- ou fait une opération qui échoue, cela causera l'erreur 500
