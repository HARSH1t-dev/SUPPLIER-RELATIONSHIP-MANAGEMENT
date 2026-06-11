export const NOTIFICATION_EVENT = 'srm_notifications_updated';

// Role-specific storage keys
const KEYS = {
  admin: 'srm_notifications_admin',
  supplier: 'srm_notifications_supplier',
};

function getKey(role) {
  return KEYS[role] || KEYS.admin;
}

/** Get the current session user's role */
function getSessionRole() {
  try {
    const user = JSON.parse(sessionStorage.getItem('srm_user') || '{}');
    return user?.role || 'admin';
  } catch {
    return 'admin';
  }
}

/** Read notifications for a specific role (defaults to current session role) */
export function getNotifications(role) {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  const key = getKey(role || getSessionRole());
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? JSON.parse(saved).filter(Boolean) : [];
  } catch {
    return [];
  }
}

/** Save notifications for a specific role */
export function saveNotifications(list, role) {
  const key = getKey(role || getSessionRole());
  try {
    localStorage.setItem(key, JSON.stringify(list));
    window.dispatchEvent(new Event(NOTIFICATION_EVENT));
  } catch {}
}

/**
 * Push a notification to the TARGET role's inbox.
 * i.e. when admin does something → push to 'supplier', and vice versa.
 *
 * @param {object} notif  - notification object (id, title, body, icon, iconColor, type, category)
 * @param {string} targetRole - 'admin' | 'supplier'  (who should RECEIVE it)
 */
export function pushNotification(notif, targetRole) {
  const existing = getNotifications(targetRole);
  const full = {
    id: notif.id ?? Date.now(),
    time: notif.time || 'Just now',
    read: false,
    is_read: false,
    ...notif,
  };
  saveNotifications([full, ...existing], targetRole);
}

/** Mark all notifications as read for the current session user */
export function markAllRead(role) {
  const r = role || getSessionRole();
  const list = getNotifications(r).map((n) => ({ ...n, read: true, is_read: true }));
  saveNotifications(list, r);
}

/** Mark one notification as read */
export function markRead(id, role) {
  const r = role || getSessionRole();
  const list = getNotifications(r).map((n) =>
    n.id === id ? { ...n, read: true, is_read: true } : n
  );
  saveNotifications(list, r);
}

/** Delete one notification */
export function deleteNotification(id, role) {
  const r = role || getSessionRole();
  const list = getNotifications(r).filter((n) => n.id !== id);
  saveNotifications(list, r);
}
