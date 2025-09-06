// Application constants
export const API_BASE_URL = 'http://localhost:8090/interface';
export const MEDIA_BASE_URL = 'http://localhost:8090'; // Base URL for media files
export const LOCAL_MEDIA_PATH = '/data/Projects/Inobag/sales_v3/build'; // Local build path for media files

// URL normalization patterns
export const URL_PATTERNS = {
  // Patterns to replace in API responses
  OLD_PORT: 'localhost:8051',
  NEW_PORT: 'localhost:8090',
  // Media path patterns
  MEDIA_PATH: '/media/',
  CUSTOMER_PATH: '/media/customer/'
} as const;

export const SESSION_TIMEOUT = 60000; // 60 seconds

export const COLORS = {
  primary: '#0081a7',
  secondary: '#00afb5',
  background: '#fdfcdc',
  text: '#2C3E50',
  error: '#e63946',
  warning: '#f77f00',
  success: '#06d6a0'
} as const;

export const ENDPOINTS = {
  visual_settings: '/visual_settings',
  digital_signage: '/digital_signage',
  session: '/session',
  categories: '/categories',
  products: '/products',
  cart: '/cart',
  payment: '/payment',
  media: '/media' // Media endpoint
} as const;

// Video player configuration
export const VIDEO_CONFIG = {
  autoplay: true,
  muted: true,
  loop: false, // We handle looping in the service
  preload: 'metadata',
  controls: false, // Hidden controls
  playsinline: true,
  autoPlayInterval: 30000, // 30 seconds between videos
  maxRetries: 3,
  retryDelay: 1000 // Base delay for retries
} as const;