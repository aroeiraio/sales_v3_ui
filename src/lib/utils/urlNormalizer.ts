import { MEDIA_BASE_URL, URL_PATTERNS } from './constants';

/**
 * Normalizes URLs to use the correct port and base URL
 */
export function normalizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    console.log('Invalid URL provided:', url);
    return '';
  }

  console.log('Normalizing URL:', url);

  // Handle different URL formats
  if (url.includes(URL_PATTERNS.OLD_PORT)) {
    // Replace any localhost:8051 with localhost:8090
    const normalizedUrl = url.replace(new RegExp(URL_PATTERNS.OLD_PORT, 'g'), URL_PATTERNS.NEW_PORT);
    console.log('Normalized from 8051 to 8090:', normalizedUrl);
    return normalizedUrl;
  }
  
  if (url.startsWith('http://localhost:8051/')) {
    // Replace with correct port if needed
    return url.replace('http://localhost:8051/', `${MEDIA_BASE_URL}/`);
  }
  
  if (url.startsWith(URL_PATTERNS.MEDIA_PATH)) {
    // Convert local media path to HTTP URL
    // /media/videos/video.mp4 -> http://localhost:8090/media/videos/video.mp4
    return `${MEDIA_BASE_URL}${url}`;
  }

  if (url.startsWith('https://') || url.startsWith('http://')) {
    // Already a full URL (S3 or other external)
    return url;
  }

  if (!url.startsWith('http')) {
    // Assume relative URL, add media base
    return `${MEDIA_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  return url;
}

/**
 * Checks if a media path has a file extension
 */
export function hasFileExtension(path: string): boolean {
  if (!path || typeof path !== 'string') {
    return false;
  }
  
  // Check if path ends with a file extension
  const hasExtension = /\.[a-zA-Z0-9]+$/.test(path);
  console.log(`Path "${path}" has extension: ${hasExtension}`);
  return hasExtension;
}

/**
 * Normalizes media paths from visual settings API
 * Handles both directory paths and file paths
 */
export function normalizeMediaPath(path: string): string | null {
  if (!path || typeof path !== 'string') {
    return null;
  }

  // If it's just a directory path without extension, return null
  if (!hasFileExtension(path)) {
    console.log(`Path "${path}" is a directory, not a file`);
    return null;
  }

  // Normalize the URL
  return normalizeUrl(path);
}

/**
 * Processes visual settings to normalize all media URLs
 */
export function processVisualSettings(settings: any): any {
  if (!settings || typeof settings !== 'object') {
    return settings;
  }

  const processed = { ...settings };

  // Process background image
  if (processed.background_image) {
    processed.background_image = normalizeMediaPath(processed.background_image);
  }

  // Process logotype image
  if (processed.logotype_image) {
    processed.logotype_image = normalizeMediaPath(processed.logotype_image);
  }

  return processed;
}

/**
 * Processes digital signage media items to normalize URLs
 */
export function processMediaItems(mediaItems: Array<{source: string, url: string, filename: string}>): Array<{source: string, url: string, filename: string, normalizedUrl: string}> {
  return mediaItems.map(item => ({
    ...item,
    normalizedUrl: normalizeUrl(item.source || item.url)
  }));
}
