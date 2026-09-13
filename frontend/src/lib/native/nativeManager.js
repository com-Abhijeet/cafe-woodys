import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Network } from '@capacitor/network';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { processBackAction } from './backHandler';

export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

// 1. Initialize Essential & Polish Native Plugins
export async function initNativeAppListeners(onResync) {
  if (!isNativeApp()) return;

  try {
    // Hide Splash Screen after app load
    await SplashScreen.hide().catch(() => {});

    // Ensure Status Bar DOES NOT overlay WebView (leaves top status bar safe space for Android clock/battery)
    await StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
    await StatusBar.setBackgroundColor({ color: '#6B3F2A' }).catch(() => {});
    await StatusBar.setStyle({ style: Style.Dark }).catch(() => {});

    // Keyboard resize behavior
    await Keyboard.setResizeMode({ mode: KeyboardResize.Body }).catch(() => {});

    // Android Hardware Back Button / Swipe Back Gesture Handling
    App.addListener('backButton', ({ canGoBack }) => {
      // 1. Check if any active modal/workspace registered in back stack
      const handled = processBackAction();
      if (handled) {
        return;
      }

      // 2. Otherwise navigate browser history if available
      if (canGoBack && window.history.length > 1) {
        window.history.back();
      } else {
        // Prevent accidental app quits unless at root view with no open modals
        console.log('App root back action reached');
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
