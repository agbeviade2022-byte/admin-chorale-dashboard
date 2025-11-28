-- Récupérer le dernier code OTP généré pour cet email

SELECT 
  code,
  email,
  created_at,
  expires_at,
  used
FROM public.otp_codes
WHERE email = 'agbeviade2017@gmail.com'
  AND used = false
  AND expires_at > now()
ORDER BY created_at DESC
LIMIT 1;

-- Le code affiché est celui à entrer dans l'app
