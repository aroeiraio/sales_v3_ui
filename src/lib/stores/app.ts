import { writable, derived } from 'svelte/store';
import type { VisualSettings } from '../services/visualSettings';

// Application state store
export const appState = writable({
  isLoading: false,
  isOnline: true,
  currentTime: new Date(),
  lastSyncTime: null as Date | null,
  error: null as string | null
});

// Visual settings store
export const visualSettings = writable<VisualSettings | null>(null);

// App status derived stores
export const isLoading = derived(appState, ($appState) => $appState.isLoading);
export const isOnline = derived(appState, ($appState) => $appState.isOnline);
export const currentTime = derived(appState, ($appState) => $appState.currentTime);
export const hasError = derived(appState, ($appState) => $appState.error !== null);

// Visual settings derived stores
export const backgroundColor = derived(visualSettings, ($settings) => 
  $settings?.background_color || '#fdfcdcff'
);

export const backgroundImage = derived(visualSettings, ($settings) => 
  $settings?.background_image || ''
);

export const fontColor = derived(visualSettings, ($settings) => 
  $settings?.font_color || '#2C3E50'
);

export const logotypeImage = derived(visualSettings, ($settings) => 
  $settings?.logotype_image || ''
);

// App actions
export const appActions = {
  setLoading: (loading: boolean) => {
    appState.update($state => ({ ...$state, isLoading: loading }));
  },

  setOnlineStatus: (online: boolean) => {
    appState.update($state => ({ ...$state, isOnline: online }));
  },

  updateTime: (time: Date = new Date()) => {
    appState.update($state => ({ ...$state, currentTime: time }));
  },

  setError: (error: string | null) => {
    appState.update($state => ({ ...$state, error }));
  },

  clearError: () => {
    appState.update($state => ({ ...$state, error: null }));
  },

  updateLastSyncTime: (time: Date = new Date()) => {
    appState.update($state => ({ ...$state, lastSyncTime: time }));
  },

  setVisualSettings: (settings: VisualSettings | null) => {
    visualSettings.set(settings);
  }
};

// Auto-update current time every second
if (typeof window !== 'undefined') {
  setInterval(() => {
    appActions.updateTime();
  }, 1000);

  // Listen for online/offline events
  window.addEventListener('online', () => appActions.setOnlineStatus(true));
  window.addEventListener('offline', () => appActions.setOnlineStatus(false));
}