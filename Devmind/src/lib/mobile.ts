import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { Preferences } from '@capacitor/preferences';
import { Device } from '@capacitor/device';

/**
 * Initialize Capacitor plugins on app start
 */
export async function initCapacitor() {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  // Set status bar style
  try {
    await StatusBar.setStyle({
      style: Style.Dark,
    });
    await StatusBar.setBackgroundColor({
      color: '#0a0a0b',
    });
  } catch (e) {
    console.log('StatusBar not available:', e);
  }

  // Hide keyboard on scroll
  try {
    await Keyboard.setScroll({
      isDisabled: false,
    });
  } catch (e) {
    console.log('Keyboard not available:', e);
  }

  // Listen for app state changes
  try {
    await App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed:', isActive);
    });
  } catch (e) {
    console.log('App listener not available:', e);
  }

  // Handle deep links
  try {
    await App.addListener('deepLink', ({ url }) => {
      console.log('Deep link received:', url);
      // Handle the deep link URL
      handleDeepLink(url);
    });
  } catch (e) {
    console.log('Deep link listener not available:', e);
  }
}

/**
 * Handle deep links from Capacitor
 */
function handleDeepLink(url: string) {
  // Parse the URL and navigate
  // Example: devmind://agents/123 -> /app/agents/123
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;

    // Map deep link paths to app routes
    if (path.startsWith('/agents/')) {
      const agentId = path.split('/agents/')[1];
      window.location.href = `/app/agents/${agentId}`;
    } else if (path.startsWith('/settings')) {
      window.location.href = '/app/settings';
    } else if (path.startsWith('/billing')) {
      window.location.href = '/app/billing';
    }
  } catch (e) {
    console.log('Failed to parse deep link:', e);
  }
}

/**
 * Get device info
 */
export async function getDeviceInfo() {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  try {
    const info = await Device.getInfo();
    return info;
  } catch (e) {
    console.log('Device info not available:', e);
    return null;
  }
}

/**
 * Store data in native preferences
 */
export async function setStorage(key: string, value: string) {
  if (!Capacitor.isNativePlatform()) {
    localStorage.setItem(key, value);
    return;
  }

  try {
    await Preferences.set({ key, value });
  } catch (e) {
    console.log('Preferences not available:', e);
  }
}

/**
 * Get data from native preferences
 */
export async function getStorage(key: string): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) {
    return localStorage.getItem(key);
  }

  try {
    const result = await Preferences.get({ key });
    return result.value;
  } catch (e) {
    console.log('Preferences not available:', e);
    return null;
  }
}
