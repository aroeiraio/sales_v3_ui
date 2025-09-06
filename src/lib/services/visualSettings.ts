import { get } from '../utils/api';
import { ENDPOINTS } from '../utils/constants';
import { processVisualSettings } from '../utils/urlNormalizer';

export interface VisualSettings {
  background_color: string;
  background_image: string;
  font_color: string;
  logotype_image: string;
  logotype_pos_x: string;
  logotype_pos_y: string;
  timestamp: string;
}

class VisualSettingsService {
  private settings: VisualSettings | null = null;
  private fallbackSettings: VisualSettings = {
    background_color: '#fdfcdcff', // Light yellow from reference design
    background_image: '',
    font_color: '#2C3E50', // Dark text from reference design
    logotype_image: '',
    logotype_pos_x: 'center',
    logotype_pos_y: 'center',
    timestamp: new Date().toISOString()
  };

  async loadSettings(): Promise<VisualSettings> {
    try {
      const data = await get<VisualSettings[]>(ENDPOINTS.visual_settings);
      
      console.log('Raw visual settings API response:', data);
      
      if (!data || data.length === 0 || !data[0]) {
        this.settings = this.fallbackSettings;
      } else {
        // Process the settings to normalize media URLs
        const rawSettings = data[0];
        console.log('Raw settings from API:', rawSettings);
        
        const processedSettings = processVisualSettings(rawSettings);
        console.log('Processed settings:', processedSettings);
        
        this.settings = { ...this.fallbackSettings, ...processedSettings };
      }
      
      this.applySettings();
      return this.settings;
    } catch (error) {
      console.warn('Failed to load visual settings, using fallback:', error);
      this.settings = this.fallbackSettings;
      this.applySettings();
      return this.settings;
    }
  }

  private applySettings(): void {
    if (!this.settings || typeof document === 'undefined') return;

    const root = document.documentElement;
    
    if (this.settings.background_image) {
      root.style.setProperty('--dynamic-bg-image', `url(${this.settings.background_image})`);
    } else if (this.settings.background_color) {
      root.style.setProperty('--dynamic-bg-color', this.settings.background_color);
    }
    
    if (this.settings.font_color) {
      root.style.setProperty('--dynamic-font-color', this.settings.font_color);
    }
  }

  getSettings(): VisualSettings | null {
    return this.settings;
  }

  async getVisualSettings(): Promise<{ settings: VisualSettings; timestamp: string }> {
    try {
      const response = await get<any[]>(ENDPOINTS.visual_settings);
      
      console.log('Raw visual settings API response (getVisualSettings):', response);
      
      // The API returns an array with settings and timestamp
      const [settings, metadata] = response;
      
      // Process the settings to normalize media URLs
      const processedSettings = processVisualSettings(settings);
      console.log('Processed settings (getVisualSettings):', processedSettings);
      
      return {
        settings: {
          background_color: processedSettings.background_color || '',
          background_image: processedSettings.background_image || '',
          font_color: processedSettings.font_color || '',
          logotype_image: processedSettings.logotype_image || '',
          logotype_pos_x: processedSettings.logotype_pos_x || '',
          logotype_pos_y: processedSettings.logotype_pos_y || '',
          timestamp: metadata.timestamp
        },
        timestamp: metadata.timestamp
      };
    } catch (error) {
      console.error('Failed to fetch visual settings:', error);
      throw error;
    }
  }

  getDefaultSettings(): VisualSettings {
    return {
      background_color: '#fdfcdcff', // Light yellow from reference design
      background_image: '',
      font_color: '#2C3E50', // Dark text from reference design
      logotype_image: '',
      logotype_pos_x: '',
      logotype_pos_y: '',
      timestamp: new Date().toISOString()
    };
  }

  mergeWithDefaults(settings: VisualSettings): VisualSettings {
    const defaults = this.getDefaultSettings();
    
    return {
      background_color: settings.background_color || defaults.background_color,
      background_image: settings.background_image || defaults.background_image,
      font_color: settings.font_color || defaults.font_color,
      logotype_image: settings.logotype_image || defaults.logotype_image,
      logotype_pos_x: settings.logotype_pos_x || defaults.logotype_pos_x,
      logotype_pos_y: settings.logotype_pos_y || defaults.logotype_pos_y,
      timestamp: settings.timestamp || defaults.timestamp
    };
  }
}

export const visualSettingsService = new VisualSettingsService();