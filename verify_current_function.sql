-- ============================================
-- VÉRIFIER: La fonction actuelle est-elle correcte ?
-- ============================================

-- Voir le code COMPLET de la fonction handle_new_user
SELECT pg_get_functiondef(oid) as function_code
FROM pg_proc
WHERE proname = 'handle_new_user';

-- ============================================
-- CE QU'IL FAUT VÉRIFIER:
-- ============================================

-- ✅ La fonction doit insérer dans "user_id" (pas "id")
-- ✅ La fonction doit insérer dans "full_name"
-- ✅ La fonction doit insérer "membre" dans "role" (pas "user")
-- ✅ La fonction doit insérer "en_attente" dans "statut_validation"

-- ❌ Si la fonction insère dans "id" → ERREUR
-- ❌ Si la fonction insère "user" dans "role" → ERREUR
-- ❌ Si la fonction n'insère pas "full_name" → ERREUR

-- ============================================
-- RÉSULTAT ATTENDU (fonction correcte):
-- ============================================

/*
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,              -- ✅ FOREIGN KEY vers auth.users.id
    full_name,            -- ✅ Nom complet
    role,                 -- ✅ Rôle
    statut_validation,    -- ✅ Statut
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,               -- ✅ ID de l'utilisateur
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur'),
    'membre',             -- ✅ Rôle par défaut
    'en_attente',         -- ✅ Statut par défaut
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$;
*/
