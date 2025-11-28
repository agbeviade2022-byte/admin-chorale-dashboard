-- Vérifier si l'utilisateur existe dans auth.users

SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'infinitylivraison@gmail.com';

-- Si aucun résultat, l'utilisateur n'existe pas
-- Si résultat, l'utilisateur existe et on peut continuer
