-- ============================================
-- VÉRIFIER LA STRUCTURE DE LA TABLE PROFILES
-- ============================================

-- 1. Voir toutes les colonnes de la table profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================

-- 2. Ajouter les colonnes manquantes si nécessaire
DO $$
BEGIN
  -- Colonne: full_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    RAISE NOTICE 'Colonne full_name ajoutée';
  ELSE
    RAISE NOTICE 'Colonne full_name existe déjà';
  END IF;
  
  -- Colonne: role
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'membre';
    RAISE NOTICE 'Colonne role ajoutée';
  ELSE
    RAISE NOTICE 'Colonne role existe déjà';
  END IF;
  
  -- Colonne: statut_validation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'statut_validation'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN statut_validation TEXT DEFAULT 'en_attente';
    RAISE NOTICE 'Colonne statut_validation ajoutée';
  ELSE
    RAISE NOTICE 'Colonne statut_validation existe déjà';
  END IF;
  
  -- Colonne: created_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Colonne created_at ajoutée';
  ELSE
    RAISE NOTICE 'Colonne created_at existe déjà';
  END IF;
  
  -- Colonne: updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Colonne updated_at ajoutée';
  ELSE
    RAISE NOTICE 'Colonne updated_at existe déjà';
  END IF;
  
END $$;

-- ============================================

-- 3. Vérifier à nouveau la structure
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
-- ✅ user_id (uuid)
-- ✅ full_name (text)
-- ✅ role (text)
-- ✅ statut_validation (text)
-- ✅ chorale_id (uuid, nullable)
-- ✅ telephone (text, nullable)
-- ✅ created_at (timestamptz)
-- ✅ updated_at (timestamptz)
