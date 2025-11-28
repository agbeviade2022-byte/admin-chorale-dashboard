-- ============================================
-- DÉSACTIVER LA CONFIRMATION EMAIL (TEMPORAIRE)
-- ============================================

-- ⚠️ ATTENTION: Ceci désactive la confirmation email
-- Les utilisateurs seront automatiquement confirmés à l'inscription

-- Cette requête ne fonctionne que si vous avez accès à la table auth.config
-- Sinon, il faut le faire dans Supabase Dashboard:
-- Authentication → Settings → Email Auth → Disable "Confirm email"

-- Pour vérifier la configuration actuelle:
SELECT 
  key,
  value
FROM auth.config
WHERE key LIKE '%email%';

-- ============================================
-- ALTERNATIVE: Modifier dans Supabase Dashboard
-- ============================================

-- 1. Allez dans Supabase Dashboard
-- 2. Authentication → Settings
-- 3. Email Auth → Décochez "Confirm email"
-- 4. Save

-- Cela permettra de tester si le problème vient de la confirmation email
