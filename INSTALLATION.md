# 🚀 Installation du Dashboard Admin

## ✅ Fichiers créés

Tous les fichiers nécessaires ont été créés:

- ✅ `package.json` - Dépendances
- ✅ `tsconfig.json` - Configuration TypeScript
- ✅ `.env.local` - Variables d'environnement
- ✅ `lib/supabase.ts` - Client Supabase
- ✅ `components/Sidebar.tsx` - Menu latéral
- ✅ `app/login/page.tsx` - Page de connexion
- ✅ `app/dashboard/layout.tsx` - Layout du dashboard
- ✅ `app/dashboard/page.tsx` - Dashboard principal

## 📦 Étape 1: Installer les dépendances

```bash
cd "d:\Projet Flutter\admin-chorale-dashboard"
npm install
```

**Cela va installer:**
- Next.js 14
- React 18
- Supabase JS
- Lucide React (icônes)
- Tailwind CSS
- TypeScript

**Durée:** 2-3 minutes

## 🔧 Étape 2: Vérifier la configuration

Le fichier `.env.local` est déjà configuré avec:
- URL Supabase: ✅
- Anon Key: ✅

**Rien à modifier !**

## 🚀 Étape 3: Lancer le serveur de développement

```bash
npm run dev
```

**Résultat attendu:**
```
  ▲ Next.js 14.2.0
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Ready in 2.5s
```

## 🌐 Étape 4: Ouvrir dans le navigateur

Ouvrir: **http://localhost:3000/login**

**Vous devriez voir:**
- 🎵 Page de connexion avec le titre "Admin Dashboard"
- Champs Email et Mot de passe
- Bouton "Se connecter"

## 🔐 Étape 5: Se connecter

**Identifiants:**
- Email: `kodjodavid2025@gmail.com`
- Mot de passe: `votre_mot_de_passe`

**Après connexion:**
- ✅ Redirection vers `/dashboard`
- ✅ Vue d'ensemble avec statistiques
- ✅ Menu latéral avec navigation
- ✅ Cartes affichant: Chorales, Utilisateurs, Chants

## ✅ Vérification

### Dashboard fonctionne si:
- [x] ✅ Page de connexion s'affiche
- [x] ✅ Connexion réussie
- [x] ✅ Dashboard affiche les statistiques
- [x] ✅ Menu latéral fonctionne
- [x] ✅ Déconnexion fonctionne

## 🎨 Personnalisation

### Modifier les couleurs

Éditer `app/dashboard/page.tsx`:

```typescript
// Changer les couleurs des cartes
<div className="p-3 rounded-full bg-blue-100 text-blue-600">
// Remplacer par: bg-red-100 text-red-600
```

### Ajouter des pages

Créer `app/dashboard/chorales/page.tsx`:

```typescript
export default function ChoralesPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Gestion des Chorales</h1>
    </div>
  )
}
```

## 🚀 Déploiement sur Vercel

### 1. Installer Vercel CLI

```bash
npm install -g vercel
```

### 2. Se connecter

```bash
vercel login
```

### 3. Déployer

```bash
vercel
```

Suivre les instructions.

### 4. Configurer les variables d'environnement

Dans Vercel Dashboard:
1. Project Settings
2. Environment Variables
3. Ajouter:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 5. URL finale

Votre dashboard sera accessible sur:
`https://votre-projet.vercel.app`

## 📚 Prochaines étapes

1. **Ajouter des pages:**
   - Gestion des chorales
   - Gestion des utilisateurs
   - Statistiques avancées
   - Logs système

2. **Améliorer le design:**
   - Graphiques (avec Recharts)
   - Tableaux de données
   - Filtres et recherche

3. **Ajouter des fonctionnalités:**
   - Export de données
   - Notifications
   - Gestion des permissions

## 🆘 Problèmes courants

### Erreur: "Cannot find module"

**Solution:**
```bash
rm -rf node_modules
npm install
```

### Erreur: "Port 3000 already in use"

**Solution:**
```bash
# Tuer le processus sur le port 3000
npx kill-port 3000
# Ou utiliser un autre port
npm run dev -- -p 3001
```

### Erreur de connexion Supabase

**Vérifier:**
1. `.env.local` est bien configuré
2. Votre compte admin existe dans Supabase
3. La fonction `is_system_admin()` existe

## ✅ Résumé

Vous avez maintenant:
- ✅ Dashboard web fonctionnel
- ✅ Connexion sécurisée (admin uniquement)
- ✅ Vue d'ensemble avec statistiques en temps réel
- ✅ Menu de navigation
- ✅ Design moderne avec Tailwind CSS

**Prêt à gérer votre SaaS !** 🚀
