# 🔔 Installation du système de notifications

## ✅ FICHIERS CRÉÉS

1. ✅ **components/NotificationBell.tsx** - Composant cloche de notification
2. ✅ **components/Sidebar.tsx** - Modifié pour inclure NotificationBell

---

## 🚀 ÉTAPES D'INSTALLATION

### **ÉTAPE 1 : Créer le système SQL**

```bash
# Dans Supabase SQL Editor
# Exécuter le fichier : mini_chorale_audio_player/CREATE_EMAIL_NOTIFICATION_ADMIN.sql
```

Ce script crée :
- ✅ Table `admin_notifications`
- ✅ Triggers sur `auth.users`
- ✅ Fonctions RPC :
  - `get_admin_notifications()`
  - `mark_notification_read()`
  - `mark_all_notifications_read()`

---

### **ÉTAPE 2 : Vérifier les fichiers React**

Les fichiers suivants ont été créés/modifiés :

1. ✅ `components/NotificationBell.tsx` (CRÉÉ)
2. ✅ `components/Sidebar.tsx` (MODIFIÉ)

---

### **ÉTAPE 3 : Tester**

#### **Test 1 : Vérifier que le composant s'affiche**

1. ✅ Démarrer le dashboard : `npm run dev`
2. ✅ Se connecter en tant que super admin
3. ✅ Vérifier que la cloche apparaît dans le sidebar

#### **Test 2 : Créer une notification manuelle**

```sql
-- Dans Supabase SQL Editor
INSERT INTO admin_notifications (type, titre, message, user_id)
VALUES (
  'test',
  'Test de notification',
  'Ceci est un test',
  (SELECT id FROM auth.users LIMIT 1)
);
```

4. ✅ Rafraîchir le dashboard
5. ✅ Vérifier que le badge affiche "1"
6. ✅ Cliquer sur la cloche
7. ✅ Vérifier que la notification s'affiche

#### **Test 3 : Tester avec une vraie inscription**

1. ✅ Créer un nouveau compte dans l'app Flutter
2. ✅ Vérifier qu'une notification "Nouvelle inscription" apparaît
3. ✅ Confirmer l'email (cliquer sur le lien)
4. ✅ Vérifier qu'une notification "Email confirmé" apparaît

---

## 🎨 FONCTIONNALITÉS

### **Badge de notification**
- ✅ Affiche le nombre de notifications non lues
- ✅ Animation pulse pour attirer l'attention
- ✅ Limite à "9+" si plus de 9 notifications

### **Dropdown**
- ✅ Liste des 10 dernières notifications
- ✅ Icônes différentes par type :
  - 👤 Nouvelle inscription
  - ✅ Email confirmé
- ✅ Couleurs différentes par type
- ✅ Fond bleu pour les notifications non lues
- ✅ Point bleu pour indiquer non lu

### **Actions**
- ✅ Cliquer sur une notification → Marquer comme lu
- ✅ Cliquer sur "Email confirmé" → Rediriger vers /dashboard/validation
- ✅ "Tout marquer comme lu" → Marquer toutes les notifications
- ✅ Rafraîchissement automatique toutes les 30 secondes

---

## 🔧 PERSONNALISATION

### **Changer l'intervalle de rafraîchissement**

Dans `NotificationBell.tsx`, ligne 28 :

```typescript
// Rafraîchir toutes les 30 secondes (30000 ms)
const interval = setInterval(fetchNotifications, 30000)

// Pour rafraîchir toutes les 10 secondes :
const interval = setInterval(fetchNotifications, 10000)
```

### **Changer le nombre de notifications affichées**

Dans `NotificationBell.tsx`, ligne 36 :

```typescript
const { data, error } = await supabase
  .rpc('get_admin_notifications', {
    p_limit: 10,  // Changer ici
    p_only_unread: false
  })
```

### **Ajouter un son de notification**

Dans `NotificationBell.tsx`, après la ligne 48 :

```typescript
setUnreadCount(data?.filter((n: Notification) => !n.lu).length || 0)

// Ajouter :
if (data && data.length > 0 && !data[0].lu) {
  // Jouer un son si nouvelle notification
  const audio = new Audio('/notification.mp3')
  audio.play().catch(e => console.log('Impossible de jouer le son'))
}
```

---

## 🚨 DÉPANNAGE

### **Erreur : "get_admin_notifications is not a function"**

**Solution :** Exécutez le script SQL `CREATE_EMAIL_NOTIFICATION_ADMIN.sql`

### **Badge ne s'affiche pas**

**Vérifications :**
1. ✅ Le script SQL a été exécuté
2. ✅ Il y a des notifications dans la table
3. ✅ L'utilisateur connecté est super admin

### **Notifications ne se rafraîchissent pas**

**Vérifications :**
1. ✅ Vérifier la console du navigateur pour les erreurs
2. ✅ Vérifier que les politiques RLS sont correctes
3. ✅ Vérifier que l'utilisateur a le rôle `super_admin`

---

## 📊 STATISTIQUES

Pour voir les statistiques des notifications :

```sql
-- Nombre total de notifications
SELECT COUNT(*) FROM admin_notifications;

-- Notifications non lues
SELECT COUNT(*) FROM admin_notifications WHERE lu = FALSE;

-- Notifications par type
SELECT type, COUNT(*) 
FROM admin_notifications 
GROUP BY type;

-- Dernières notifications
SELECT * FROM admin_notifications 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## ✅ CHECKLIST FINALE

- [ ] Script SQL exécuté (`CREATE_EMAIL_NOTIFICATION_ADMIN.sql`)
- [ ] Fichiers React créés/modifiés
- [ ] Dashboard redémarré (`npm run dev`)
- [ ] Cloche visible dans le sidebar
- [ ] Test avec notification manuelle réussi
- [ ] Test avec vraie inscription réussi
- [ ] Badge affiche le bon nombre
- [ ] Clic sur notification marque comme lu
- [ ] Redirection vers validation fonctionne

---

**Date de création :** 2025-11-21  
**Version :** 1.0
