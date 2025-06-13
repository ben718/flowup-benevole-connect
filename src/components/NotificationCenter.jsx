import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useAdvanced } from '../hooks/useAdvanced';
import { useNavigate } from 'react-router-dom';

export const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, loading, error, fetchNotifications, markNotificationAsRead } = useAdvanced();
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    
    // Configurer un intervalle pour actualiser les notifications toutes les 5 minutes
    const refreshInterval = setInterval(() => {
      fetchNotifications();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    if (notifications) {
      setUnreadCount(notifications.filter(n => !n.is_read).length);
    }
  }, [notifications]);

  const toggleNotifications = () => {
    setIsOpen(!isOpen);
    
    // Si on ouvre le centre de notifications, actualiser les données
    if (!isOpen) {
      fetchNotifications();
    }
  };
  
  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.is_read) {
        await markNotificationAsRead(notification.id);
      }    
      // Si la notification est liée à une entité, naviguer vers cette entité
      if (notification.related_entity_type && notification.related_entity_id) {
        switch (notification.related_entity_type) {
          case 'mission':
            navigate(`/mission/${notification.related_entity_id}`);
            break;
          case 'association':
            navigate(`/association/${notification.related_entity_id}`);
            break;
          default:
            break;
        }
      }
    } catch (error) {
      console.error("Erreur lors du traitement de la notification:", error);
    } finally {
      setIsOpen(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Il y a quelques minutes';
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="relative">
      <button 
        className="p-2 rounded-full hover:bg-vs-gray-100 transition-colors"
        onClick={toggleNotifications}
      >
        <Bell size={20} className="text-vs-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-vs-error text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 max-h-96 overflow-auto">
          <div className="p-3 border-b border-vs-gray-200">
            <h3 className="font-semibold text-vs-gray-800">Notifications</h3>
          </div>
          
          {loading ? (
            <div className="p-4 text-center text-vs-gray-500">Chargement...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-vs-gray-500">Aucune notification</div>
          ) : (
            <div>
              {notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`p-3 border-b border-vs-gray-200 cursor-pointer hover:bg-vs-gray-50 transition-colors ${notification.is_read ? '' : 'bg-vs-blue-50'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-vs-gray-800">{notification.title}</h4>
                    <span className="text-xs text-vs-gray-500">{formatDate(notification.created_at)}</span>
                  </div>
                  <p className="text-sm text-vs-gray-600 mt-1">{notification.message}</p>
                </div>
              ))}
            </div>
          )}
          
          <div className="p-2 border-t border-vs-gray-200 text-center">
            <button 
              className="text-sm text-vs-blue-primary hover:underline"
              onClick={() => setIsOpen(false)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
