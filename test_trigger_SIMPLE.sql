-- ============================================
-- TEST SIMPLE DU TRIGGER (sans requêtes avancées)
-- ============================================

-- 1. Vérifier si la fonction existe
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';

-- Résultat attendu : 1 ligne
-- Si 0 ligne → La fonction n'existe pas

-- ============================================

-- 2. Vérifier la structure de la table profiles
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Colonnes attendues :
-- - user_id
-- - full_name
-- - role
-- - statut_validation
-- - chorale_id
-- - telephone
-- - created_at
-- - updated_at

-- ============================================

-- 3. TEST MANUEL : Essayer de créer un profil
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
  
  RAISE NOTICE '✅ TEST RÉUSSI ! Profil créé avec user_id: %', test_user_id;
  
  -- Nettoyer le test
  DELETE FROM public.profiles WHERE user_id = test_user_id;
  RAISE NOTICE '✅ Profil de test supprimé';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ ERREUR lors du test: %', SQLERRM;
    RAISE NOTICE 'Code erreur: %', SQLSTATE;
END $$;

-- Si vous voyez "✅ TEST RÉUSSI !" → La structure est OK
-- Si vous voyez "❌ ERREUR" → Il y a un problème

-- ============================================

-- 4. Vérifier les utilisateurs récents SANS profil
SELECT 
  u.id as user_id,
  u.email,
  u.created_at,
  u.raw_user_meta_data->>'full_name' as full_name_metadata,
  CASE 
    WHEN p.user_id IS NULL THEN '❌ PAS DE PROFIL'
    ELSE '✅ A UN PROFIL'
  END as statut_profil
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE u.created_at > NOW() - INTERVAL '7 days'
ORDER BY u.created_at DESC;

-- Si vous voyez "❌ PAS DE PROFIL" → Le trigger ne fonctionne pas
-- Si tous ont "✅ A UN PROFIL" → Le trigger fonctionne

-- ============================================

-- 5. Compter les utilisateurs avec et sans profil
SELECT 
  COUNT(*) as total_users,
  COUNT(p.user_id) as users_with_profile,
  COUNT(*) - COUNT(p.user_id) as users_without_profile
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id;

-- Si users_without_profile > 0 → Il y a un problème

-- ============================================
-- INTERPRÉTATION DES RÉSULTATS
-- ============================================

-- RÉSULTAT REQUÊTE #1:
-- - 0 ligne → Fonction n'existe pas → Exécutez fix_signup_trigger.sql
-- - 1 ligne → Fonction existe → Continuez

-- RÉSULTAT REQUÊTE #2:
-- - Colonnes manquantes → Exécutez verify_profiles_structure.sql
-- - Toutes les colonnes présentes → Continuez

-- RÉSULTAT REQUÊTE #3:
-- - "✅ TEST RÉUSSI !" → Structure OK, le trigger devrait fonctionner
-- - "❌ ERREUR" → Problème avec la table, lisez le message d'erreur

-- RÉSULTAT REQUÊTE #4:
-- - Tous "✅ A UN PROFIL" → Trigger fonctionne
-- - Certains "❌ PAS DE PROFIL" → Trigger ne fonctionne pas

-- RÉSULTAT REQUÊTE #5:
-- - users_without_profile = 0 → Parfait !
-- - users_without_profile > 0 → Problème !

-- ============================================
-- PROCHAINES ÉTAPES
-- ============================================

-- Si la requête #3 montre "✅ TEST RÉUSSI !" mais que des utilisateurs
-- n'ont pas de profil (requête #4), cela signifie que:
-- 1. La structure de la table est OK
-- 2. Mais le trigger ne se déclenche pas correctement
-- 
-- Solution: Exécutez recreate_trigger_with_logs.sql
-- pour recréer le trigger avec des logs détaillés
