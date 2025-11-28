-- ============================================
-- TEST: Vérifier la fonction handle_new_user()
-- ============================================

-- 1. Vérifier si la fonction existe
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';

-- Résultat attendu : 1 ligne avec la définition de la fonction
-- Si 0 ligne → La fonction n'existe pas (PROBLÈME !)

-- ============================================

-- 2. Voir le code complet de la fonction
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'handle_new_user';

-- ============================================

-- 3. Vérifier la structure de la table profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Colonnes attendues :
-- - user_id (uuid, NOT NULL)
-- - full_name (text)
-- - role (text)
-- - statut_validation (text)
-- - chorale_id (uuid, nullable)
-- - telephone (text, nullable)
-- - created_at (timestamp)
-- - updated_at (timestamp)

-- ============================================

-- 4. Tester manuellement la création d'un profil
-- (Simuler ce que fait le trigger)
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
BEGIN
  -- Essayer d'insérer un profil comme le ferait le trigger
  INSERT INTO public.profiles (
    user_id,
    full_name,
    role,
    statut_validation,
    created_at,
    updated_at
  )
  VALUES (
    test_user_id,
    'Test User',
    'membre',
    'en_attente',
    NOW(),
    NOW()
  );
  
  RAISE NOTICE 'Test réussi ! Profil créé avec user_id: %', test_user_id;
  
  -- Nettoyer le test
  DELETE FROM public.profiles WHERE user_id = test_user_id;
  RAISE NOTICE 'Profil de test supprimé';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERREUR lors du test: %', SQLERRM;
END $$;

-- Si vous voyez "Test réussi !" → La structure est OK
-- Si vous voyez "ERREUR" → Il y a un problème avec la table

-- ============================================

-- 5. Vérifier les utilisateurs récents sans profil
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.raw_user_meta_data->>'full_name' as full_name_metadata,
  p.user_id as has_profile
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE u.created_at > NOW() - INTERVAL '1 day'
ORDER BY u.created_at DESC;

-- Si has_profile est NULL → Le trigger n'a pas créé le profil
-- Cela signifie que le trigger ne fonctionne pas ou a une erreur

-- ============================================

-- 6. Vérifier les logs d'erreurs PostgreSQL
-- NOTE: Cette requête est désactivée car pg_stat_statements n'est pas accessible
-- Les logs sont disponibles dans Supabase Dashboard → Logs → Database

-- SELECT 
--   log_time,
--   message
-- FROM pg_stat_statements
-- WHERE query LIKE '%handle_new_user%'
-- ORDER BY log_time DESC
-- LIMIT 10;

-- Pour voir les logs, allez sur:
-- https://supabase.com/dashboard → Votre projet → Logs → Database
-- Cherchez "handle_new_user" dans les logs

-- ============================================
-- INTERPRÉTATION
-- ============================================

-- SCÉNARIO 1: Fonction n'existe pas
-- Requête #1 retourne 0 ligne
-- → Exécutez fix_signup_trigger.sql

-- SCÉNARIO 2: Fonction existe mais a une erreur
-- Requête #4 montre "ERREUR"
-- → Il y a un problème avec la structure de la table
-- → Vérifiez les colonnes manquantes

-- SCÉNARIO 3: Trigger ne se déclenche pas
-- Requête #5 montre des utilisateurs sans profil
-- → Le trigger existe mais ne fonctionne pas
-- → Recréez le trigger avec fix_signup_trigger.sql

-- SCÉNARIO 4: Tout fonctionne
-- Requête #4 montre "Test réussi !"
-- Requête #5 ne montre aucun utilisateur sans profil
-- → Le problème est ailleurs (peut-être dans l'app Flutter)
