-- ============================================
-- TABLE POUR STOCKER LES CODES OTP
-- ============================================

-- Créer la table otp_codes
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  code text NOT NULL,
  type text NOT NULL DEFAULT 'recovery', -- 'recovery', 'signup', 'email_change'
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  
  -- Index pour améliorer les performances
  CONSTRAINT otp_codes_email_code_key UNIQUE (email, code)
);

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON public.otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_id ON public.otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON public.otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_codes_used ON public.otp_codes(used);

-- Activer RLS
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Policy : Seul le service role peut accéder
CREATE POLICY "Service role only" ON public.otp_codes
  FOR ALL
  USING (auth.role() = 'service_role');

-- Fonction pour nettoyer les codes expirés (à exécuter périodiquement)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.otp_codes
  WHERE expires_at < now() - interval '1 day';
END;
$$;

-- Créer un trigger pour nettoyer automatiquement (optionnel)
-- Note: Nécessite l'extension pg_cron
-- SELECT cron.schedule('cleanup-otp', '0 * * * *', 'SELECT public.cleanup_expired_otp_codes()');

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Vérifier que la table existe
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'otp_codes';

-- Vérifier les colonnes
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'otp_codes'
ORDER BY ordinal_position;

-- ============================================
-- RÉSULTAT ATTENDU
-- ============================================

-- ✅ Table otp_codes créée
-- ✅ Index créés
-- ✅ RLS activé
-- ✅ Policy service_role créée
-- ✅ Fonction de nettoyage créée
