import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Network } from '@capacitor/network';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

// 1. Initialize Essential & Polish Native Plugins
export async function initNativeAppListeners(onResync) {
  if (!isNativeApp()) return;

  try {
    // Hide Splash Screen after app load
    await SplashScreen.hide().catch(() => {});

    // Set Status Bar to Cafe Woody's Brand Color (#6B3F2A)
    await StatusBar.setBackgroundColor({ color: '#6B3F2A' }).catch(() => {});
    await StatusBar.setStyle({ style: Style.Dark }).catch(() => {});

    // Keyboard resize behavior
    await Keyboard.setResizeMode({ mode: KeyboardResize.Body }).catch(() => {});

    // Android Hardware Back Button Handling
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });

    // App Resume Refresh Handler
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive && typeof onResync === 'function') {
        onResync();
      }
    });

    // Native Network Connectivity Monitoring
    Network.addListener('networkStatusChange', (status) => {
      window.dispatchEvent(new CustomEvent('app:networkChange', { detail: status }));
    });
  } catch (err) {
    console.warn('Native init error:', err?.message || err);
  }
}

// 2. Haptic Feedback Helpers
export async function triggerHapticNotification(type = NotificationType.Success) {
  if (!isNativeApp()) return;
  try {
    await Haptics.notification({ type });
  } catch (err) {
    // ignore on unsupported
  }
}

export async function triggerHapticImpact(style = ImpactStyle.Medium) {
  if (!isNativeApp()) return;
  try {
    await Haptics.impact({ style });
  } catch (err) {
    // ignore
  }
}
