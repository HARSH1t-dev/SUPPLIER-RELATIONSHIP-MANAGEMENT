export const NOTIFICATION_EVENT = 'srm_notifications_updated';

export function getNotifications() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const saved = window.localStorage.getItem('srm_notifications');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}
