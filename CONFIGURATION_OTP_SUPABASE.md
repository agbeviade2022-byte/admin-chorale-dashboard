# Configuration OTP Supabase

## Problème
Supabase envoie un lien magique au lieu d'un code OTP à 6 chiffres.

## Solution

### 1. Activer les codes OTP dans Supabase Dashboard

1. Allez sur **Supabase Dashboard**
2. Sélectionnez votre projet
3. Allez dans **Authentication** → **Providers**
4. Cliquez sur **Email**
5. Activez **"Enable Email OTP"**
6. Désactivez **"Enable Email Magic Link"** (optionnel)
7. Cliquez sur **Save**

### 2. Configuration des templates d'email

1. Allez dans **Authentication** → **Email Templates**
2. Sélectionnez **"Magic Link"**
3. Vérifiez que le template contient `{{ .Token }}` pour afficher le code
4. Ou créez un template personnalisé :

```html
<h2>Votre code de vérification</h2>
<p>Utilisez ce code pour réinitialiser votre mot de passe :</p>
<h1 style="font-size: 32px; letter-spacing: 5px;">{{ .Token }}</h1>
<p>Ce code expire dans 10 minutes.</p>
```

### 3. Vérifier les paramètres d'authentification

Dans **Authentication** → **Settings** :
- **OTP Expiry** : 3600 secondes (1 heure) ou moins
- **Enable Email Confirmations** : Activé

### 4. Alternative : Utiliser l'API directement

Si la configuration Dashboard ne fonctionne pas, vous pouvez forcer l'envoi d'un OTP via l'API :

```dart
await Supabase.instance.client.auth.signInWithOtp(
  email: email,
  shouldCreateUser: false, // Important pour reset password
  emailRedirectTo: null,   // Pas de redirection
);
```

## Vérification

Après configuration, vous devriez recevoir un email avec :
- ✅ Un code à 6 chiffres (ex: 123456)
- ❌ PAS un lien cliquable

## Notes importantes

- Les codes OTP sont plus sécurisés que les magic links pour mobile
- Les magic links nécessitent deep linking configuré
- Les codes OTP fonctionnent sur tous les appareils
