// src/services/NotificationService.ts

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export class NotificationService {
  private static lastNotificationTimes: Map<string, number> = new Map();
  private static readonly DEBOUNCE_MS = 15 * 60 * 1000; // 15 minutos entre notificaciones idénticas

  static getPermissionState(): NotificationPermissionState {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission as NotificationPermissionState;
  }

  static async requestPermission(): Promise<NotificationPermissionState> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      const res = await Notification.requestPermission();
      return res as NotificationPermissionState;
    } catch (e) {
      console.warn('[NotificationService] Error solicitando permisos:', e);
      return 'denied';
    }
  }

  static notify(title: string, options?: NotificationOptions & { debounceKey?: string }): boolean {
    const perm = this.getPermissionState();
    if (perm !== 'granted') return false;

    const debounceKey = options?.debounceKey || title;
    const now = Date.now();
    const lastTime = this.lastNotificationTimes.get(debounceKey);

    if (lastTime && now - lastTime < this.DEBOUNCE_MS) {
      // Evitar notificación repetitiva
      return false;
    }

    try {
      this.lastNotificationTimes.set(debounceKey, now);
      new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        ...options,
      });
      return true;
    } catch (e) {
      console.warn('[NotificationService] Error enviando notificación:', e);
      return false;
    }
  }
}
