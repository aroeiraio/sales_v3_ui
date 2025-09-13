import { writable, derived, readable } from 'svelte/store';
import { visualSettingsService, type VisualSettings } from '../services/visualSettings';

// Store for visual settings
export const visualSettings = writable<VisualSettings | null>(null);

// Store for loading state
export const visualSettingsLoading = writable<boolean>(false);

// Store for last fetch timestamp
export const visualSettingsLastFetch = writable<Date | null>(null);

// Derived stores for computed values
export const hasLogotype = derived(
  visualSettings,
  ($settings) => !!$settings?.logotype_image
);

export const hasBackgroundImage = derived(
  visualSettings,
  ($settings) => !!$settings?.background_image
);

export const hasBackgroundColor = derived(
  visualSettings,
  ($settings) => !!$settings?.background_color
);

export const effectiveBackgroundColor = derived(
  visualSettings,
  ($settings) => {
    if (!$settings) return '#1e1e2e'; // Default dark
    return $settings.background_color || '#1e1e2e';
  }
);

export const effectiveFontColor = derived(
  visualSettings,
  ($settings) => {
    if (!$settings) return '#cdd6f4'; // Default light
    return $settings.font_color || '#cdd6f4';
  }
);

// Actions for visual settings management
export const visualSettingsActions = {
  async loadSettings(): Promise<void> {
    visualSettingsLoading.set(true);
    try {
      const response = await visualSettingsService.getVisualSettings();
      const mergedSettings = visualSettingsService.mergeWithDefaults(response.settings);
      
      visualSettings.set(mergedSettings);
      visualSettingsLastFetch.set(new Date());
      
      // Apply settings to DOM immediately
      this.applySettingsToDOM(mergedSettings);
    } catch (error) {
      console.error('Failed to load visual settings:', error);
      // Use default settings on error
      const defaultSettings = visualSettingsService.getDefaultSettings();
      visualSettings.set(defaultSettings);
      this.applySettingsToDOM(defaultSettings);
    } finally {
      visualSettingsLoading.set(false);
    }
  },

  applySettingsToDOM(settings: VisualSettings): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    
    // Apply background
    if (settings.background_image) {
      root.style.setProperty('--dynamic-bg-image', `url(${settings.background_image})`);
      root.style.removeProperty('--dynamic-bg-color');
    } else if (settings.background_color) {
      root.style.setProperty('--dynamic-bg-color', settings.background_color);
      root.style.removeProperty('--dynamic-bg-image');
    }
    
    // Apply font color
    if (settings.font_color) {
      root.style.setProperty('--dynamic-font-color', settings.font_color);
    }
  },

  async refreshSettings(): Promise<void> {
    await this.loadSettings();
  },

  needsRefresh(): boolean {
    const lastFetch = visualSettingsLastFetch.get();
    if (!lastFetch) return true;
    
    const now = new Date();
    const refreshInterval = 180 * 1000; // 180 seconds (3 minutes) in milliseconds
    
    return (now.getTime() - lastFetch.getTime()) > refreshInterval;
  }
};

// Auto-refresh timer (180 seconds)
export const visualSettingsRefreshTimer = readable(null, (set) => {
  const interval = setInterval(() => {
    if (visualSettingsActions.needsRefresh()) {
      visualSettingsActions.refreshSettings();
    }
  }, 180 * 1000); // 180 seconds (3 minutes)

  return () => clearInterval(interval);
});