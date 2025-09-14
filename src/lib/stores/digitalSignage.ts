import { writable, derived, readable, get } from 'svelte/store';
import { digitalSignageService, type DigitalSignageItem } from '../services/digitalSignage';

// Store for digital signage items
export const digitalSignageItems = writable<DigitalSignageItem[]>([]);

// Store for loading state
export const digitalSignageLoading = writable<boolean>(false);

// Store for current video index in playlist
export const currentVideoIndex = writable<number>(0);

// Store for playback state
export const isPlaying = writable<boolean>(false);

// Store for fullscreen state
export const isFullscreen = writable<boolean>(false);

// Store for last fetch timestamp
export const digitalSignageLastFetch = writable<Date | null>(null);

// Store for click debouncing
let isProcessingClick = false;
const CLICK_DEBOUNCE_TIME = 1000; // 1 second

// Derived stores for computed values
export const validItems = derived(
  digitalSignageItems,
  ($items) => digitalSignageService.filterValidItems($items)
);

export const videoUrls = derived(
  validItems,
  ($validItems) => digitalSignageService.getMediaUrls($validItems)
);

export const hasValidVideos = derived(
  videoUrls,
  ($videoUrls) => $videoUrls.length > 0
);

export const currentVideoUrl = derived(
  [videoUrls, currentVideoIndex],
  ([$videoUrls, $currentVideoIndex]) => {
    if ($videoUrls.length === 0) return null;
    return $videoUrls[$currentVideoIndex] || null;
  }
);

export const playlistProgress = derived(
  [videoUrls, currentVideoIndex],
  ([$videoUrls, $currentVideoIndex]) => {
    if ($videoUrls.length === 0) return { current: 0, total: 0, percentage: 0 };
    return {
      current: $currentVideoIndex + 1,
      total: $videoUrls.length,
      percentage: (($currentVideoIndex + 1) / $videoUrls.length) * 100
    };
  }
);

// Actions for digital signage management
export const digitalSignageActions = {
  async loadSignageData(): Promise<void> {
    digitalSignageLoading.set(true);
    try {
      const response = await digitalSignageService.getDigitalSignage();
      digitalSignageItems.set(response.items);
      digitalSignageLastFetch.set(new Date());
      
      // Reset playback state when new data is loaded
      currentVideoIndex.set(0);
      isPlaying.set(false);
    } catch (error) {
      console.error('Failed to load digital signage data:', error);
      digitalSignageItems.set([]);
    } finally {
      digitalSignageLoading.set(false);
    }
  },

  startPlayback(): void {
    isPlaying.set(true);
    isFullscreen.set(true);
  },

  stopPlayback(): void {
    isPlaying.set(false);
    isFullscreen.set(false);
    currentVideoIndex.set(0);
  },

  nextVideo(): void {
    currentVideoIndex.update(index => {
      const urls = digitalSignageService.getMediaUrls(
        digitalSignageService.filterValidItems(get(digitalSignageItems))
      );
      const nextIndex = index + 1 < urls.length ? index + 1 : 0; // Loop back to start
      console.log(`Digital signage: Moving from video ${index} to video ${nextIndex} (total: ${urls.length} videos)`);
      
      return nextIndex;
    });
  },

  previousVideo(): void {
    currentVideoIndex.update(index => {
      const urls = digitalSignageService.getMediaUrls(
        digitalSignageService.filterValidItems(get(digitalSignageItems))
      );
      return index > 0 ? index - 1 : urls.length - 1; // Loop to end
    });
  },

  onVideoEnded(): void {
    console.log('Digital signage: Video ended, moving to next video');
    this.nextVideo();
  },

  async onVideoClick(): Promise<void> {
    console.log('=== VIDEO CLICK HANDLER TRIGGERED ===');
    
    // Debounce multiple rapid clicks
    if (isProcessingClick) {
      console.log('Digital signage: Click already being processed, ignoring duplicate click');
      return;
    }
    
    isProcessingClick = true;
    console.log('Digital signage: Processing video click...');
    
    // Reset debounce flag after timeout
    setTimeout(() => {
      isProcessingClick = false;
      console.log('Digital signage: Click debounce reset');
    }, CLICK_DEBOUNCE_TIME);
    
    // Stop playback first
    console.log('Digital signage: Stopping video playback');
    this.stopPlayback();
    
    if (typeof window !== 'undefined') {
      try {
        console.log('Digital signage: Starting session service...');
        // Import session service dynamically to avoid circular dependencies
        const { sessionService } = await import('../services/session');
        
        console.log('Digital signage: Session service imported, starting session...');
        await sessionService.startSession();
        
        console.log('Digital signage: Session started successfully, navigating to products');
        window.location.href = '/products';
      } catch (error) {
        console.error('Digital signage: CRITICAL ERROR starting session from video click:', error);
        console.error('Digital signage: Error details:', {
          name: error?.name,
          message: error?.message,
          stack: error?.stack
        });
        
        // Add a delay and retry mechanism
        console.log('Digital signage: Attempting fallback navigation after error...');
        try {
          // Try to navigate anyway, but with a small delay to ensure cleanup
          setTimeout(() => {
            console.log('Digital signage: Fallback navigation to products');
            window.location.href = '/products';
          }, 500);
        } catch (fallbackError) {
          console.error('Digital signage: Even fallback navigation failed:', fallbackError);
          // Last resort: reload the page to reset state
          setTimeout(() => {
            console.log('Digital signage: Last resort - reloading page');
            window.location.reload();
          }, 1000);
        }
      }
    } else {
      console.warn('Digital signage: Window object not available, cannot navigate');
    }
  },

  async refreshSignageData(): Promise<void> {
    console.log('Digital signage: Refreshing signage data from API');
    await this.loadSignageData();
  },

  enterFullscreen(element?: HTMLElement): Promise<void> {
    return new Promise((resolve, reject) => {
      const target = element || document.documentElement;
      
      if (target.requestFullscreen) {
        target.requestFullscreen().then(resolve).catch(reject);
      } else if ((target as any).webkitRequestFullscreen) {
        (target as any).webkitRequestFullscreen();
        resolve();
      } else if ((target as any).msRequestFullscreen) {
        (target as any).msRequestFullscreen();
        resolve();
      } else {
        reject(new Error('Fullscreen not supported'));
      }
    });
  },

  exitFullscreen(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(resolve).catch(reject);
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
        resolve();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
        resolve();
      } else {
        reject(new Error('Exit fullscreen not supported'));
      }
    });
  }
};

// Note: Digital signage videos loop continuously. When the last video finishes,
// playback automatically returns to the first video in the playlist.