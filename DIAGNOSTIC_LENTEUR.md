# 🐌 Diagnostic de lenteur du dashboard

## 🔍 Causes identifiées

### **1. Requêtes SQL lentes**

#### **Page Dashboard (`/dashboard`)**
- 4 requêtes COUNT séparées au chargement
- Pas de cache
- Se recharge à chaque visite

#### **Page Users (`/dashboard/users`)**
- Appelle `get_all_users_with_emails_debug()`
- JOIN avec `auth.users` pour récupérer les emails
- Peut être très lent avec beaucoup d'utilisateurs

### **2. Pas de pagination**
- Toutes les données chargées en une fois
- Pas de limite sur le nombre de résultats

### **3. Pas de cache**
- Chaque page recharge toutes les données
- Pas de mise en cache côté client

### **4. Triggers supprimés récemment**
- Les triggers de notification ont été supprimés
- Cela peut avoir affecté d'autres fonctions

---

## ✅ Solutions

### **Solution 1 : Optimiser les requêtes COUNT**
Créer une vue matérialisée pour les statistiques

### **Solution 2 : Ajouter la pagination**
Limiter à 50 utilisateurs par page

### **Solution 3 : Ajouter du cache**
Utiliser React Query ou SWR

### **Solution 4 : Optimiser get_all_users_with_emails_debug**
Ajouter des index sur les colonnes utilisées

---

## 🎯 Actions immédiates

1. Vérifier les index sur les tables
2. Optimiser la fonction `get_all_users_with_emails_debug`
3. Ajouter la pagination
4. Ajouter du cache
