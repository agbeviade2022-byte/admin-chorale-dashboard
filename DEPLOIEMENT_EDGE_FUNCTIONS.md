# 🚀 Déploiement des Edge Functions Supabase

## Prérequis

### 1. Installer Supabase CLI

**Windows (PowerShell) :**
```powershell
scoop install supabase
```

**Ou avec npm :**
```bash
npm install -g supabase
```

### 2. Se connecter à Supabase

```bash
supabase login
```

Cela ouvrira votre navigateur pour vous authentifier.

---

## 📦 Étapes de déploiement

### Étape 1 : Créer la table OTP dans Supabase

```bash
# Exécuter le script SQL dans Supabase Dashboard
# Ou via CLI :
supabase db push
```

**Ou manuellement :**
1. Supabase Dashboard
2. SQL Editor
3. Coller le contenu de `create_otp_table.sql`
4. Run

---

### Étape 2 : Lier votre projet

```bash
# Dans le dossier admin-chorale-dashboard
cd "d:\Projet Flutter\admin-chorale-dashboard"

# Lier au projet Supabase
supabase link --project-ref milzcdtfblwhblstwuzh
```

---

### Étape 3 : Déployer les fonctions

```bash
# Déployer send-otp
supabase functions deploy send-otp

# Déployer verify-otp
supabase functions deploy verify-otp
```

---

### Étape 4 : Configurer les variables d'environnement

```bash
# Définir RESEND_API_KEY (optionnel, pour l'envoi d'emails)
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx

# Les autres variables sont automatiquement disponibles :
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
```

---

## 🔑 Obtenir une clé Resend (optionnel)

Si vous voulez utiliser Resend pour envoyer des emails personnalisés :

1. Allez sur https://resend.com
2. Créez un compte gratuit (100 emails/jour)
3. Créez une API Key
4. Ajoutez-la aux secrets Supabase

**Alternative :** Utilisez l'email Supabase natif (déjà configuré).

---

## ✅ Vérifier le déploiement

### 1. Lister les fonctions

```bash
supabase functions list
```

**Résultat attendu :**
```
send-otp    deployed
verify-otp  deployed
```

### 2. Tester send-otp

```bash
curl -X POST \
  'https://milzcdtfblwhblstwuzh.supabase.co/functions/v1/send-otp' \
  -H "Authorization: Bearer VOTRE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "type": "recovery"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Code OTP envoyé par email"
}
```

### 3. Vérifier les logs

```bash
# Logs en temps réel
supabase functions logs send-otp --tail

# Ou dans le Dashboard
# Dashboard → Edge Functions → send-otp → Logs
```

---

## 🔧 Dépannage

### Erreur : "Function not found"

```bash
# Redéployer
supabase functions deploy send-otp --no-verify-jwt
```

### Erreur : "Permission denied"

```bash
# Vérifier que vous êtes bien connecté
supabase status

# Se reconnecter si nécessaire
supabase login
```

### Erreur : "Table otp_codes does not exist"

```bash
# Exécuter create_otp_table.sql dans Supabase Dashboard
```

---

## 📊 Monitoring

### Dashboard Supabase

1. Edge Functions → send-otp
2. Onglet "Invocations" : Voir le nombre d'appels
3. Onglet "Logs" : Voir les erreurs

### Logs en temps réel

```bash
# Terminal 1 : Logs send-otp
supabase functions logs send-otp --tail

# Terminal 2 : Logs verify-otp
supabase functions logs verify-otp --tail
```

---

## 🎯 Tester depuis Flutter

Une fois déployé, l'app Flutter utilisera automatiquement les Edge Functions.

```dart
// Cela appellera :
// https://milzcdtfblwhblstwuzh.supabase.co/functions/v1/send-otp
await Supabase.instance.client.functions.invoke('send-otp', ...)
```

---

## 💰 Coûts

**Supabase Edge Functions :**
- Plan gratuit : 500,000 invocations/mois
- Largement suffisant pour votre app

**Resend (optionnel) :**
- Plan gratuit : 100 emails/jour
- Plan Pro : $20/mois pour 50,000 emails

---

## 🔄 Mise à jour

Pour mettre à jour une fonction :

```bash
# Modifier le fichier index.ts
# Puis redéployer
supabase functions deploy send-otp
```

---

## 📝 Checklist de déploiement

- [ ] Supabase CLI installé
- [ ] Connecté avec `supabase login`
- [ ] Projet lié avec `supabase link`
- [ ] Table `otp_codes` créée
- [ ] Fonction `send-otp` déployée
- [ ] Fonction `verify-otp` déployée
- [ ] Variables d'environnement configurées (optionnel)
- [ ] Test avec curl réussi
- [ ] Test depuis Flutter réussi

---

## 🎉 Résultat final

Après déploiement, votre app :

1. ✅ Envoie des codes OTP à 6 chiffres
2. ✅ Stocke les codes dans la base de données
3. ✅ Vérifie les codes côté serveur
4. ✅ Gère l'expiration automatique
5. ✅ Empêche la réutilisation des codes
6. ✅ Fonctionne sans magic links

---

**🚀 DÉPLOYEZ MAINTENANT !**

```bash
cd "d:\Projet Flutter\admin-chorale-dashboard"
supabase link --project-ref milzcdtfblwhblstwuzh
supabase functions deploy send-otp
supabase functions deploy verify-otp
```
