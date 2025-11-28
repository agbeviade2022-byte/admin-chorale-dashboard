-- ============================================
-- OPTIMISER LA BASE DE DONNÉES POUR LA PERFORMANCE
-- ============================================

-- 1. Vérifier les index existants sur profiles
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY indexname;

-- ============================================

-- 2. Créer des index manquants (si nécessaire)

-- Index sur user_id (devrait déjà exister via FK)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Index sur role (pour filtrer les admins rapidement)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Index sur statut_validation (pour filtrer les validés)
CREATE INDEX IF NOT EXISTS idx_profiles_statut_validation ON public.profiles(statut_validation);

-- Index sur chorale_id (pour les jointures)
CREATE INDEX IF NOT EXISTS idx_profiles_chorale_id ON public.profiles(chorale_id);

-- Index sur created_at (pour le tri)
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- ============================================

-- 3. Vérifier les index sur chorales
CREATE INDEX IF NOT EXISTS idx_chorales_statut ON public.chorales(statut);

-- ============================================

-- 4. Analyser les tables pour mettre à jour les statistiques
ANALYZE public.profiles;
ANALYZE public.chorales;
ANALYZE public.chants;
ANALYZE auth.users;

-- ============================================

-- 5. Créer une vue matérialisée pour les statistiques du dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS public.dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM public.chorales) as total_chorales,
    (SELECT COUNT(*) FROM public.chorales WHERE statut = 'actif') as chorales_actives,
    (SELECT COUNT(*) FROM public.profiles) as total_users,
    (SELECT COUNT(*) FROM public.chants) as total_chants,
    NOW() as last_updated;

-- Index sur la vue matérialisée
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_stats_last_updated 
ON public.dashboard_stats(last_updated);

-- Fonction pour rafraîchir les stats
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.dashboard_stats;
END;
$$;

-- ============================================

-- 6. Optimiser get_all_users_with_emails_debug
-- Créer une vue pour améliorer les performances

CREATE OR REPLACE VIEW public.users_with_emails AS
SELECT 
    p.id,
    p.user_id,
    p.full_name,
    p.role,
    p.statut_validation,
    p.statut_membre,
    p.chorale_id,
    p.created_at,
    p.updated_at,
    u.email,
    c.nom as chorale_nom
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
LEFT JOIN public.chorales c ON c.id = p.chorale_id
ORDER BY p.created_at DESC;

-- ============================================

-- 7. Vérifier la taille des tables
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;

-- ============================================
-- RÉSULTAT ATTENDU
-- ============================================

-- ✅ Index créés sur les colonnes fréquemment utilisées
-- ✅ Vue matérialisée pour les stats du dashboard
-- ✅ Vue optimisée pour les utilisateurs avec emails
-- ✅ Tables analysées pour de meilleures performances

-- ============================================
-- UTILISATION
-- ============================================

-- Dans le code Next.js, remplacer:
-- supabase.rpc('get_all_users_with_emails_debug')
-- Par:
-- supabase.from('users_with_emails').select('*')

-- Pour les stats du dashboard:
-- supabase.from('dashboard_stats').select('*').single()

-- Rafraîchir les stats (à faire périodiquement):
-- supabase.rpc('refresh_dashboard_stats')
