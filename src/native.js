// Thin layer over Capacitor so the same code runs on the web and in the iOS/Android apps.
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { StatusBar } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

// Public web address of the game. Share links always point here (the app itself runs from a local origin).
export const SITE_URL = 'https://hooked.hafermason.workers.dev';
export const siteOrigin = () => (isNative || !/^https?:/.test(location.origin) ? SITE_URL : location.origin);

// kind: 'light' | 'medium' | 'heavy' | 'success' | 'error'
export function haptic(kind = 'light') {
  try {
    if (isNative) {
      if (kind === 'success') Haptics.notification({ type: NotificationType.Success });
      else if (kind === 'error') Haptics.notification({ type: NotificationType.Error });
      else Haptics.impact({ style: kind === 'heavy' ? ImpactStyle.Heavy : kind === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light });
    } else if (navigator.vibrate) {
      navigator.vibrate({ light: 15, medium: 30, heavy: 70, success: [25, 40, 25], error: [60, 40, 60] }[kind] || 15);
    }
  } catch (e) {}
}

// Returns 'shared' | 'cancelled' | 'unavailable'
export async function nativeShare({ title, text, url }) {
  if (!isNative) return 'unavailable';
  try { await Share.share({ title, text, url, dialogTitle: title }); return 'shared'; }
  catch (e) { return /cancel/i.test(String(e && e.message)) ? 'cancelled' : 'unavailable'; }
}

export async function initNative({ onBack } = {}) {
  if (!isNative) return;
  try { await StatusBar.hide(); } catch (e) {}
  try { await SplashScreen.hide({ fadeOutDuration: 250 }); } catch (e) {}
  App.addListener('backButton', () => { if (!onBack || !onBack()) App.exitApp(); });
}
