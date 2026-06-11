import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, FileText, ShoppingCart, Star, AlertTriangle, CheckCircle, Info, FileCheck, MessageSquare, ArrowRightLeft, X } from 'lucide-react';
import { getNotifications, markRead, NOTIFICATION_EVENT } from '../utils/notificationStore.js';

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

function getSessionRole() {
  try {
    const user = JSON.parse(sessionStorage.getItem('srm_user') || '{}');
    return user?.role || 'admin';
  } catch {
    return 'admin';
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const knownIdsRef = useRef(new Set());
  const isInitializedRef = useRef(false);

  const syncNotifications = () => {
    const role = getSessionRole();
    const currentList = getNotifications(role);

    if (!isInitializedRef.current) {
      // First mount: just populate known IDs — don't pop old toasts
      knownIdsRef.current = new Set(currentList.map(n => n.id));
      isInitializedRef.current = true;
      return;
    }

    // Subsequent updates: only show truly new unread notifications
    const newToasts = [];
    currentList.forEach(notif => {
      if (notif && !knownIdsRef.current.has(notif.id)) {
        knownIdsRef.current.add(notif.id);
        if (!notif.read && !notif.is_read) {
          newToasts.push(notif);
        }
      }
    });

    if (newToasts.length > 0) {
      setToasts(prev => [...prev, ...newToasts]);
    }
  };

  useEffect(() => {
    syncNotifications();

    const handleStorageChange = (e) => {
      const role = getSessionRole();
      const watchKey = role === 'admin' ? 'srm_notifications_admin' : 'srm_notifications_supplier';
      if (e.key === watchKey || !e.key) {
        syncNotifications();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(NOTIFICATION_EVENT, syncNotifications);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(NOTIFICATION_EVENT, syncNotifications);
    };
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleToastClick = (toast) => {
    const isAdmin = location.pathname.startsWith('/admin') || window.location.hash.startsWith('#/admin');
    const notificationsLink = isAdmin ? '/admin/notifications' : '/supplier/notifications';
    markRead(toast.id);
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
              initial={{ opacity: 0, y: 15, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.85, x: 30, transition: { duration: 0.18 } }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="pointer-events-auto w-full relative rounded-2xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/20 dark:border-slate-800/60 p-4 shadow-[0_12px_40px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_-4px_rgba(0,0,0,0.4)] flex gap-3 cursor-pointer group hover:border-brand-500/60 dark:hover:border-brand-500/50 transition-all duration-200 overflow-hidden"
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
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:text-slate-550 dark:hover:text-slate-300 p-1 rounded-md hover:bg-slate-100/50 dark:hover:bg-slate-800/80 transition-colors pointer-events-auto"
                aria-label="Dismiss toast"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Auto dismissal timer */}
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

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-150/40 dark:bg-slate-800/30 overflow-hidden">
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 dark:from-brand-400 dark:to-indigo-400"
      />
    </div>
  );
}

