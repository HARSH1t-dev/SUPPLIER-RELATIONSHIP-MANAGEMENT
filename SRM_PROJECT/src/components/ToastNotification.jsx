import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, FileText, ShoppingCart, Star, AlertTriangle, CheckCircle, Info, FileCheck, MessageSquare, ArrowRightLeft, X } from 'lucide-react';

const iconMap = {
  Bell,
  FileText,
  ShoppingCart,
  Star,
  AlertTriangle,
  CheckCircle,
  Info,
  FileCheck,
  MessageSquare,
  ArrowRightLeft
};

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const knownIdsRef = useRef(new Set());
  const isInitializedRef = useRef(false);

  const getNotificationsFromStorage = () => {
    try {
      const saved = localStorage.getItem('srm_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(Boolean);
        }
      }
    } catch (err) {
      console.warn('Failed to parse notifications in ToastContainer:', err);
    }
    return [];
  };

  const syncNotifications = () => {
    const currentList = getNotificationsFromStorage();
    
    if (!isInitializedRef.current) {
      // First mount: just populate known IDs
      const initialIds = new Set(currentList.map(n => n.id));
      knownIdsRef.current = initialIds;
      isInitializedRef.current = true;
      return;
    }

    // Subsequent updates: check for new unread notifications
    const newToasts = [];
    currentList.forEach(notif => {
      if (notif && !knownIdsRef.current.has(notif.id)) {
        knownIdsRef.current.add(notif.id);
        const isRead = notif.read || notif.is_read;
        if (!isRead) {
          newToasts.push(notif);
        }
      }
    });

    if (newToasts.length > 0) {
      setToasts(prev => [...prev, ...newToasts]);
    }
  };

  useEffect(() => {
    // Initial sync to set baseline of known IDs
    syncNotifications();

    const handleStorageChange = (e) => {
      if (e.key === 'srm_notifications' || !e.key) {
        syncNotifications();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('srm_notifications_updated', syncNotifications);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('srm_notifications_updated', syncNotifications);
    };
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleToastClick = (toast) => {
    const isAdmin = location.pathname.startsWith('/admin') || window.location.hash.startsWith('#/admin');
    const notificationsLink = isAdmin ? '/admin/notifications' : '/supplier/notifications';
    
    // Mark as read in local storage
    try {
      const currentList = getNotificationsFromStorage();
      const updated = currentList.map(n => n.id === toast.id ? { ...n, read: true, is_read: true } : n);
      localStorage.setItem('srm_notifications', JSON.stringify(updated));
      window.dispatchEvent(new Event('srm_notifications_updated'));
    } catch (err) {
      console.warn('Failed to mark toast as read on click:', err);
    }

    removeToast(toast.id);
    navigate(notificationsLink);
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => {
          const rawIcon = toast.icon || toast.iconName;
          let IconComponent = Bell;
          if (typeof rawIcon === 'string') {
            IconComponent = iconMap[rawIcon] || Bell;
          } else if (rawIcon && (typeof rawIcon === 'function' || (typeof rawIcon === 'object' && rawIcon.$$typeof))) {
            IconComponent = rawIcon;
          }
          
          const iconColor = toast.iconColor || 'text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-950/20';
          const type = toast.type || 'System';
          const body = toast.body || toast.description || '';

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9, transition: { duration: 0.2 } }}
              className="pointer-events-auto w-full relative rounded-2xl bg-white/90 dark:bg-slate-900/95 backdrop-blur-md border border-slate-250/50 dark:border-slate-800/80 p-4 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.08)] dark:shadow-[0_15px_35px_-5px_rgba(0,0,0,0.35)] flex gap-3 cursor-pointer group hover:border-brand-500/50 dark:hover:border-brand-500/40 transition-colors duration-200"
              onClick={() => handleToastClick(toast)}
            >
              {/* Icon Container */}
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${iconColor}`}>
                <IconComponent className="h-5 w-5" />
              </div>

              {/* Content Area */}
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug truncate">
                  {toast.title}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">
                  {body}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    {type}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {toast.time || 'Just now'}
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:text-slate-550 dark:hover:text-slate-300 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors pointer-events-auto"
                aria-label="Dismiss toast"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Auto dismissal timer helper */}
              <ToastTimer duration={5000} onDismiss={() => removeToast(toast.id)} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function ToastTimer({ duration, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return null;
}
