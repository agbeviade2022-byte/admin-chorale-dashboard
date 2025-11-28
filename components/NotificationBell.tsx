'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Bell } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: number
  type: string
  titre: string
  message: string
  user_email: string
  user_full_name: string
  lu: boolean
  created_at: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchNotifications() {
    try {
      const { data, error } = await supabase
        .rpc('get_admin_notifications', {
          p_limit: 10,
          p_only_unread: false
        })

      if (error) {
        console.error('Erreur récupération notifications:', error)
        return
      }

      setNotifications(data || [])
      setUnreadCount(data?.filter((n: Notification) => !n.lu).length || 0)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(notificationId: number) {
    try {
      await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId
      })
      
      // Mettre à jour localement
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, lu: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Erreur marquage notification:', error)
    }
  }

  async function markAllAsRead() {
    try {
      await supabase.rpc('mark_all_notifications_read')
      
      // Mettre à jour localement
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })))
      setUnreadCount(0)
      setShowDropdown(false)
    } catch (error) {
      console.error('Erreur marquage toutes notifications:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'email_confirmed':
        return '✅'
      case 'new_signup':
        return '👤'
      default:
        return '📧'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'email_confirmed':
        return 'text-green-600'
      case 'new_signup':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="relative">
      {/* Bell icon with badge */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        title="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Overlay pour fermer le dropdown */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
          
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est lu'}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>
            
            {/* Notifications list */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2">Chargement...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>Aucune notification</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notif.lu ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      markAsRead(notif.id)
                      // Si c'est une notification d'email confirmé, rediriger vers validation
                      if (notif.type === 'email_confirmed') {
                        setShowDropdown(false)
                        window.location.href = '/dashboard/validation'
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`text-2xl ${getNotificationColor(notif.type)}`}>
                        {getNotificationIcon(notif.type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm text-gray-900">
                            {notif.titre}
                          </p>
                          {!notif.lu && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <p className="text-xs text-gray-400">
                            {new Date(notif.created_at).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {notif.user_email && (
                            <>
                              <span className="text-gray-300">•</span>
                              <p className="text-xs text-gray-500 truncate">
                                {notif.user_full_name || notif.user_email}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 text-center">
                <Link 
                  href="/dashboard/validation"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  onClick={() => setShowDropdown(false)}
                >
                  Voir tous les membres en attente →
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
