-- ============================================
-- VÉRIFIER LES COMPTES ADMIN
-- ============================================

-- 1. Lister tous les admins et super_admins
SELECT 
  p.id,
  p.user_id,
  p.full_name,
  u.email,
  p.role,
  p.statut_validation,
  p.statut_membre,
  p.created_at
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
WHERE p.role IN ('admin', 'super_admin')
ORDER BY p.created_at DESC;

-- ============================================

-- 2. Vérifier les comptes validés
SELECT 
  p.full_name,
  u.email,
  p.role,
  p.statut_validation
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
WHERE p.role IN ('admin', 'super_admin')
  AND p.statut_validation = 'valide'
ORDER BY p.created_at DESC;

-- ============================================

-- 3. Compter les admins par statut
SELECT 
  role,
  statut_validation,
  COUNT(*) as count
FROM public.profiles
WHERE role IN ('admin', 'super_admin')
GROUP BY role, statut_validation
ORDER BY role, statut_validation;

-- ============================================
-- DIAGNOSTIC
-- ============================================

-- Si requête #1 retourne 0 ligne:
-- → Aucun compte admin n'existe
-- → Il faut créer un compte admin

-- Si requête #2 retourne 0 ligne:
-- → Aucun admin validé
-- → Il faut valider un compte admin

-- Si requête #3 montre des admins 'en_attente':
-- → Il faut les valider manuellement
