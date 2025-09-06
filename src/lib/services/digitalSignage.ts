import { get } from '../utils/api';
import { ENDPOINTS } from '../utils/constants';
import { normalizeUrl } from '../utils/urlNormalizer';

export interface MediaContent {
  filename: string;
  pending: number;
  source: string;
  url: string;
}

export interface TimeInterval {
  beginning: string;
  ending: string;
}

export interface DigitalSignageItem {
  id: number;
  interval: TimeInterval;
  media: MediaContent;
  title: string;
}

export interface DigitalSignageResponse {
  items: DigitalSignageItem[];
  timestamp: string;
}

class DigitalSignageService {
  async getDigitalSignage(): Promise<DigitalSignageResponse> {
    try {
      const response = await get<any[]>(ENDPOINTS.digital_signage);
      console.log('Raw digital signage API response:', response);
      
      // The API returns an array with items and timestamp
      // Filter out the timestamp object to get only the digital signage items
      const items = response.filter(item => item.id !== undefined) as DigitalSignageItem[];
      const metadata = response.find(item => item.timestamp !== undefined);
      
      // Normalize URLs in the items immediately after receiving from API
      const normalizedItems = items.map(item => ({
        ...item,
        media: {
          ...item.media,
          source: normalizeUrl(item.media.source),
          url: normalizeUrl(item.media.url)
        }
      }));
      
      console.log('Filtered digital signage items:', items);
      console.log('Normalized digital signage items:', normalizedItems);
      console.log('Metadata:', metadata);
      
      return {
        items: normalizedItems,
        timestamp: metadata?.timestamp || new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to fetch digital signage:', error);
      throw error;
    }
  }

  filterValidItems(items: DigitalSignageItem[]): DigitalSignageItem[] {
    const currentDate = new Date();
    const currentDateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    return items.filter(item => {
      const beginningDate = new Date(item.interval.beginning);
      const endingDate = new Date(item.interval.ending);
      const current = new Date(currentDateString);
      
      // Check if current date is within the interval
      return current >= beginningDate && current <= endingDate;
    });
  }

  getMediaUrls(items: DigitalSignageItem[]): string[] {
    return items.map(item => {
      // Prefer source (local) over url (S3) for better performance
      return item.media.source || item.media.url || '';
    }).filter(url => url.length > 0);
  }

  getMediaItems(items: DigitalSignageItem[]): Array<{source: string, url: string, filename: string}> {
    return items.map(item => ({
      source: item.media.source || '',
      url: item.media.url || '',
      filename: item.media.filename || ''
    })).filter(item => item.source || item.url);
  }

  isVideoFile(url: string): boolean {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.mkv'];
    const urlLower = url.toLowerCase();
    return videoExtensions.some(ext => urlLower.includes(ext));
  }
}

export const digitalSignageService = new DigitalSignageService();