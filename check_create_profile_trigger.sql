-- ============================================
-- VÉRIFIER SI create_profile_on_signup EST ATTACHÉ
-- ============================================

-- Chercher tous les triggers qui utilisent cette fonction
SELECT 
  t.tgname as trigger_name,
  t.tgrelid::regclass as table_name,
  t.tgenabled as enabled,
  p.proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE p.proname = 'create_profile_on_signup';

-- Si cette requête retourne des lignes, la fonction est attachée à un trigger
-- Si 0 ligne, la fonction existe mais n'est pas utilisée
