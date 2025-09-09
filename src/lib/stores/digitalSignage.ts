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
      return index + 1 < urls.length ? index + 1 : 0; // Loop back to start
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
    this.nextVideo();
  },

  async onVideoClick(): Promise<void> {
    // Stop playback and start session before redirecting to products
    this.stopPlayback();
    
    if (typeof window !== 'undefined') {
      try {
        // Import session service dynamically to avoid circular dependencies
        const { sessionService } = await import('../services/session');
        console.log('Video clicked - starting session');
        await sessionService.startSession();
        console.log('Session started from video click, navigating to products');
        window.location.href = '/products';
      } catch (error) {
        console.error('Error starting session from video click:', error);
        // Still redirect even if session fails
        window.location.href = '/products';
      }
    }
  },

  async refreshSignageData(): Promise<void> {
    await this.loadSignageData();
  },

  needsRefresh(): boolean {
    const lastFetch = get(digitalSignageLastFetch);
    if (!lastFetch) return true;
    
    const now = new Date();
    const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds
    
    return (now.getTime() - lastFetch.getTime()) > fifteenMinutes;
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

// Auto-refresh timer (15 minutes)
export const digitalSignageRefreshTimer = readable(null, (set) => {
  const interval = setInterval(() => {
    if (digitalSignageActions.needsRefresh()) {
      digitalSignageActions.refreshSignageData();
    }
  }, 15 * 60 * 1000); // 15 minutes

  return () => clearInterval(interval);
});