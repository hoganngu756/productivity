export type PermissionState = NotificationPermission | 'unsupported';

export function notificationPermission(): PermissionState {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
}

export async function requestNotificationPermission(): Promise<PermissionState> {
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

export function showNotification(title: string, body: string): void {
  if (notificationPermission() !== 'granted') return;
  try {
    // A shared tag replaces the previous notification instead of stacking them.
    new Notification(title, { body, tag: 'timer', icon: '/favicon.svg' });
  } catch {
    // Some platforms only allow notifications from a service worker; skip quietly.
  }
}
