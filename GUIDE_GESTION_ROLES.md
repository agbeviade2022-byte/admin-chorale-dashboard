# 🎯 GUIDE : Gestion des Rôles et Permissions

## 📊 FLUX COMPLET

```
1. Page "Utilisateurs"
   ↓
2. Cliquez sur "Modifier" pour un membre
   ↓
3. Changez le rôle de "membre" vers "admin"
   ↓
4. Message de confirmation s'affiche
   ↓
5. Enregistrez
   ↓
6. Message de succès : "Allez dans Permissions"
   ↓
7. Page "Permissions"
   ↓
8. L'utilisateur apparaît avec une nouvelle colonne
   ↓
9. Cliquez sur les boutons pour attribuer des permissions
   ↓
10. L'admin a maintenant des permissions spécifiques
```

---

## 🔧 COMMENT CHANGER UN MEMBRE EN ADMIN

### **Étape 1 : Aller dans "Utilisateurs"**

```
Dashboard → Utilisateurs
```

### **Étape 2 : Trouver le membre**

```
Liste des utilisateurs :
┌────────────────────────────────────────────┐
│  Himra                                     │
│  ofcoursekd@gmail.com                      │
│  membre  ← Rôle actuel                     │
│  [Voir] [Modifier] [Supprimer]            │
└────────────────────────────────────────────┘
```

### **Étape 3 : Cliquer sur "Modifier"**

Un modal s'ouvre :

```
┌─────────────────────────────────────────┐
│  Modifier l'utilisateur                 │
├─────────────────────────────────────────┤
│  Email: ofcoursekd@gmail.com (lecture)  │
│  Nom: Himra                             │
│  Rôle: [membre ▼]                       │
│                                         │
│  🟢 Membre                              │
│  ✅ Membre d'une chorale                │
│  ✅ Accès aux chants de sa chorale      │
│  ❌ Aucune permission admin             │
│  ❌ N'apparaît pas dans "Permissions"   │
└─────────────────────────────────────────┘
```

### **Étape 4 : Changer le rôle**

```
Rôle: [admin ▼]  ← Sélectionnez "Administrateur"

🟠 Administrateur
✅ Apparaît dans la page "Permissions"
✅ Permissions personnalisables
✅ Accès au dashboard admin
👉 Allez dans "Permissions" pour configurer
```

### **Étape 5 : Confirmer**

Message de confirmation :

```
⚠️ CHANGEMENT DE RÔLE

Vous allez changer "Himra" de "membre" vers "admin".

✅ Impact :
• L'utilisateur apparaîtra dans la page "Permissions"
• Vous pourrez lui attribuer des permissions spécifiques
• Il aura accès au dashboard admin

Confirmer ce changement ?
[Annuler] [OK]
```

### **Étape 6 : Enregistrer**

Cliquez sur **"Enregistrer"**

Message de succès :

```
✅ Rôle modifié avec succès !

"Himra" est maintenant administrateur.

👉 Allez dans "Permissions" pour lui attribuer des permissions spécifiques.
[OK]
```

---

## 🎨 ÉTAPE 7 : Configurer les Permissions

### **Aller dans "Permissions"**

```
Dashboard → Permissions
```

### **Résultat : Nouvelle colonne apparaît**

```
Page Permissions :
┌────────────────────────────────────────────────────────┐
│  MODULE          │ AGREVIADE │ DAVID │ HIMRA          │
│                  │ SUPER_ADM │ SUPER │ ADMIN          │
├──────────────────┼───────────┼───────┼────────────────┤
│  Ajouter Chants  │     ✅    │  ✅   │  🔘 ← Cliquable│
│  Voir Membres    │     ✅    │  ✅   │  🔘            │
│  Gérer Chorales  │     ✅    │  ✅   │  🔘            │
└────────────────────────────────────────────────────────┘
```

### **Attribuer des permissions**

Cliquez sur les boutons gris (🔘) pour activer :

```
1. Clic sur "Ajouter Chants" pour Himra
   🔘 → ✅
   
2. Clic sur "Voir Membres" pour Himra
   🔘 → ✅
   
3. Laisser "Gérer Chorales" désactivé
   🔘 (reste gris)
```

**Résultat :**

```
HIMRA (admin) peut maintenant :
✅ Ajouter des chants
✅ Voir les membres
❌ Gérer les chorales (pas activé)
```

---

## 🔄 SCÉNARIOS COURANTS

### **Scénario 1 : Promouvoir un membre en admin**

```
membre → admin
✅ Apparaît dans "Permissions"
✅ Peut avoir des permissions spécifiques
✅ Accès au dashboard
```

### **Scénario 2 : Rétrograder un admin en membre**

```
admin → membre
❌ Disparaît de "Permissions"
❌ Perd toutes ses permissions admin
❌ Perd l'accès au dashboard
⚠️ Message de confirmation obligatoire
```

### **Scénario 3 : Promouvoir en super admin**

```
admin → super_admin
✅ Toutes les permissions automatiquement
⚠️ Ne peut plus être personnalisé
⚠️ Utilisez avec précaution
```

---

## 📋 TABLEAU DES RÔLES

| Rôle | Apparaît dans Permissions | Permissions personnalisables | Accès dashboard |
|------|---------------------------|------------------------------|-----------------|
| 🔴 **super_admin** | ✅ (non cliquable) | ❌ (toutes auto) | ✅ Complet |
| 🟠 **admin** | ✅ (cliquable) | ✅ Oui | ✅ Selon permissions |
| 🟢 **membre** | ❌ Non | ❌ Non | ❌ Non |
| 🔵 **user** | ❌ Non | ❌ Non | ❌ Non |

---

## 💡 BONNES PRATIQUES

### **1. Hiérarchie recommandée**

```
🔴 1 Super Admin (vous)
   └─ Gère tout le système
   
🟠 2-3 Admins
   └─ Gèrent des aspects spécifiques
   
🟢 Tous les autres = Membres
   └─ Utilisent l'application
```

### **2. Attribution des permissions**

**Pour un admin "Gestion des Chants" :**
```
✅ Ajouter des chants
✅ Modifier des chants
✅ Supprimer des chants
❌ Voir les membres
❌ Gérer les chorales
```

**Pour un admin "Gestion des Membres" :**
```
❌ Ajouter des chants
✅ Voir les membres
✅ Valider les membres
✅ Gérer les chorales
❌ Supprimer des chants
```

### **3. Sécurité**

- ✅ Gardez au moins 1 super admin
- ✅ Ne donnez que les permissions nécessaires
- ✅ Révisez régulièrement les permissions
- ✅ Retirez les permissions des anciens admins

---

## 🆘 DÉPANNAGE

### **Le membre n'apparaît pas dans "Permissions"**

**Cause :** Le rôle n'est pas "admin"

**Solution :**
1. Vérifiez le rôle dans "Utilisateurs"
2. Changez en "admin"
3. Rafraîchissez la page "Permissions"

---

### **Les boutons ne sont pas cliquables**

**Cause :** L'utilisateur est "super_admin"

**Solution :** C'est normal, les super admins ont toutes les permissions automatiquement

---

### **L'utilisateur ne voit pas le dashboard**

**Cause :** Pas de permissions attribuées

**Solution :**
1. Allez dans "Permissions"
2. Attribuez au moins une permission
3. L'utilisateur peut maintenant se connecter au dashboard

---

## 📊 EXEMPLE COMPLET

### **Situation initiale :**

```
Utilisateurs :
- AGREVIADE (super_admin)
- DAVID KODJO (super_admin)
- Himra (membre)  ← À promouvoir
- Lebron13 (membre)
```

### **Objectif :**

Faire de Himra un admin qui peut :
- Ajouter des chants
- Voir les membres
- Mais PAS gérer les chorales

### **Actions :**

**1. Page "Utilisateurs"**
```
Himra → Modifier → Rôle: admin → Enregistrer
```

**2. Page "Permissions"**
```
Himra apparaît avec une nouvelle colonne
Cliquez sur :
  - Ajouter Chants : 🔘 → ✅
  - Voir Membres : 🔘 → ✅
  - Gérer Chorales : 🔘 (laisser désactivé)
```

**3. Résultat**
```
Himra (admin) :
✅ Peut ajouter des chants
✅ Peut voir les membres
❌ Ne peut pas gérer les chorales
✅ A accès au dashboard
```

---

## 🎯 RÉSUMÉ

**Pour changer un membre en admin :**

1. ✅ **Utilisateurs** → Modifier → Rôle: admin
2. ✅ Confirmer le changement
3. ✅ **Permissions** → Attribuer les permissions
4. ✅ L'admin peut maintenant se connecter

**Impact :**
- ✅ Apparaît dans "Permissions"
- ✅ Permissions personnalisables
- ✅ Accès au dashboard selon permissions

---

**Date de création :** 2025-11-21  
**Version :** 1.0  
**Auteur :** Cascade AI
