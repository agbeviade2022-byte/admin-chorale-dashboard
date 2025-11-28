# 📥 Installation manuelle de Supabase CLI

## ❌ Problème
`npm install -g supabase` n'est plus supporté

## ✅ Solution : Installation manuelle

### Étape 1 : Télécharger le binaire

1. Allez sur https://github.com/supabase/cli/releases
2. Trouvez la dernière version (ex: v1.200.3)
3. Téléchargez **`supabase_1.200.3_windows_amd64.tar.gz`**
   (ou la version la plus récente)

### Étape 2 : Extraire le fichier

1. Extrayez le fichier `.tar.gz` (utilisez 7-Zip si nécessaire)
2. Vous obtiendrez un fichier `supabase.exe`

### Étape 3 : Placer dans un dossier

1. Créez le dossier : `C:\supabase`
2. Déplacez `supabase.exe` dans ce dossier

### Étape 4 : Ajouter au PATH

#### Option A : Via l'interface Windows

1. Recherchez "Variables d'environnement" dans Windows
2. Cliquez sur "Modifier les variables d'environnement système"
3. Cliquez sur "Variables d'environnement"
4. Dans "Variables utilisateur", sélectionnez "Path"
5. Cliquez sur "Modifier"
6. Cliquez sur "Nouveau"
7. Ajoutez : `C:\supabase`
8. Cliquez sur "OK" partout

#### Option B : Via PowerShell

```powershell
$env:Path += ";C:\supabase"
[Environment]::SetEnvironmentVariable("Path", $env:Path, "User")
```

### Étape 5 : Vérifier l'installation

**Fermez et rouvrez votre terminal**, puis :

```powershell
supabase --version
```

**Résultat attendu :**
```
1.200.3
```

---

## 🚀 Alternative : Utiliser npx (sans installation)

Si vous ne voulez pas installer globalement, utilisez `npx` :

```bash
# Au lieu de :
supabase login

# Utilisez :
npx supabase@latest login
```

**Avantage :** Pas besoin d'installer  
**Inconvénient :** Plus lent (télécharge à chaque fois)

---

## 📋 Commandes de déploiement avec npx

```bash
cd "d:\Projet Flutter\admin-chorale-dashboard"

# Se connecter
npx supabase@latest login

# Lier le projet
npx supabase@latest link --project-ref milzcdtfblwhblstwuzh

# Déployer les fonctions
npx supabase@latest functions deploy send-otp
npx supabase@latest functions deploy verify-otp
```

---

## ✅ Recommandation

**Pour éviter les complications, utilisez `npx` :**

1. Pas besoin d'installation globale
2. Toujours la dernière version
3. Fonctionne immédiatement

**Commande complète :**

```bash
cd "d:\Projet Flutter\admin-chorale-dashboard"
npx supabase@latest login
npx supabase@latest link --project-ref milzcdtfblwhblstwuzh
npx supabase@latest functions deploy send-otp
npx supabase@latest functions deploy verify-otp
```

---

## 🎯 Prochaines étapes

1. ✅ Utiliser `npx supabase@latest` au lieu de `supabase`
2. ✅ Créer la table OTP (exécuter `create_otp_table.sql`)
3. ✅ Déployer les Edge Functions
4. ✅ Tester l'app Flutter

---

**💡 UTILISEZ NPX POUR ÉVITER LES PROBLÈMES D'INSTALLATION !**
