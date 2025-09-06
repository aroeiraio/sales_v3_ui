import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { videoPlayerService } from '../videoPlayer';
import { digitalSignageService } from '../digitalSignage';
import { videoErrorHandler } from '../videoErrorHandler';

// Mock dependencies
vi.mock('../digitalSignage');
vi.mock('../videoErrorHandler');

describe('VideoPlayerService', () => {
  let mockVideoElement: HTMLVideoElement;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock video element
    mockVideoElement = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      load: vi.fn(),
      src: '',
      currentTime: 0
    } as any;

    // Mock global fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    videoPlayerService.destroy();
  });

  describe('loadVideos', () => {
    it('should load videos from digital signage successfully', async () => {
      const mockDigitalSignage = {
        items: [
          {
            id: 1,
            interval: { beginning: '2024-01-01', ending: '2024-12-31' },
            media: { 
              url: 'https://imach.s3.amazonaws.com/core-web-application/videos/video1.mp4', 
              source: '/media/videos/video1.mp4', 
              filename: 'video1.mp4', 
              pending: 0 
            },
            title: 'Video 1'
          }
        ],
        timestamp: '2024-01-01T00:00:00Z'
      };

      (digitalSignageService.getDigitalSignage as any).mockResolvedValue(mockDigitalSignage);
      (digitalSignageService.filterValidItems as any).mockReturnValue(mockDigitalSignage.items);
      (digitalSignageService.getMediaItems as any).mockReturnValue([
        { source: '/media/videos/video1.mp4', url: 'https://imach.s3.amazonaws.com/core-web-application/videos/video1.mp4', filename: 'video1.mp4' }
      ]);
      (digitalSignageService.isVideoFile as any).mockReturnValue(true);

      await videoPlayerService.loadVideos();

      let state: any;
      videoPlayerService.subscribe(s => state = s)();

      expect(state.videos).toHaveLength(1);
      expect(state.videos[0].url).toBe('http://localhost:8090/media/videos/video1.mp4');
      expect(state.currentVideo).toEqual(state.videos[0]);
      expect(state.isLoading).toBe(false);
      expect(state.hasError).toBe(false);
    });

    it('should fallback to default videos when digital signage fails', async () => {
      (digitalSignageService.getDigitalSignage as any).mockRejectedValue(new Error('API Error'));

      await videoPlayerService.loadVideos();

      let state: any;
      videoPlayerService.subscribe(s => state = s)();

      expect(state.videos).toHaveLength(2); // Default videos
      expect(state.videos[0].id).toBe('default-1');
      expect(state.isLoading).toBe(false);
      expect(state.hasError).toBe(false);
    });

    it('should handle empty digital signage response', async () => {
      const mockDigitalSignage = {
        items: [],
        timestamp: '2024-01-01T00:00:00Z'
      };

      (digitalSignageService.getDigitalSignage as any).mockResolvedValue(mockDigitalSignage);
      (digitalSignageService.filterValidItems as any).mockReturnValue([]);
      (digitalSignageService.getMediaUrls as any).mockReturnValue([]);

      await videoPlayerService.loadVideos();

      let state: any;
      videoPlayerService.subscribe(s => state = s)();

      expect(state.videos).toHaveLength(2); // Should fallback to default videos
    });
  });

  describe('video navigation', () => {
    beforeEach(async () => {
      // Setup with multiple videos
      const mockDigitalSignage = {
        items: [
          {
            id: 1,
            interval: { beginning: '2024-01-01', ending: '2024-12-31' },
            media: { url: '/media/video1.mp4', source: '', filename: 'video1.mp4', pending: 0 },
            title: 'Video 1'
          },
          {
            id: 2,
            interval: { beginning: '2024-01-01', ending: '2024-12-31' },
            media: { url: '/media/video2.mp4', source: '', filename: 'video2.mp4', pending: 0 },
            title: 'Video 2'
          }
        ],
        timestamp: '2024-01-01T00:00:00Z'
      };

      (digitalSignageService.getDigitalSignage as any).mockResolvedValue(mockDigitalSignage);
      (digitalSignageService.filterValidItems as any).mockReturnValue(mockDigitalSignage.items);
      (digitalSignageService.getMediaUrls as any).mockReturnValue(['/media/video1.mp4', '/media/video2.mp4']);
      (digitalSignageService.isVideoFile as any).mockReturnValue(true);

      await videoPlayerService.loadVideos();
    });

    it('should play next video correctly', async () => {
      videoPlayerService.setVideoElement(mockVideoElement);
      
      await videoPlayerService.playNextVideo();

      let state: any;
      videoPlayerService.subscribe(s => state = s)();

      expect(state.currentVideoIndex).toBe(1);
      expect(state.currentVideo).toEqual(state.videos[1]);
      expect(mockVideoElement.src).toBe('http://localhost:8090/media/video2.mp4');
      expect(mockVideoElement.load).toHaveBeenCalled();
    });

    it('should loop back to first video when at end', async () => {
      videoPlayerService.setVideoElement(mockVideoElement);
      
      // Go to last video
      await videoPlayerService.playNextVideo();
      
      // Go to next (should loop to first)
      await videoPlayerService.playNextVideo();

      let state: any;
      videoPlayerService.subscribe(s => state = s)();

      expect(state.currentVideoIndex).toBe(0);
      expect(state.currentVideo).toEqual(state.videos[0]);
    });

    it('should play previous video correctly', async () => {
      videoPlayerService.setVideoElement(mockVideoElement);
      
      // Go to second video first
      await videoPlayerService.playNextVideo();
      
      // Go back to first
      await videoPlayerService.playPreviousVideo();

      let state: any;
      videoPlayerService.subscribe(s => state = s)();

      expect(state.currentVideoIndex).toBe(0);
      expect(state.currentVideo).toEqual(state.videos[0]);
    });

    it('should loop to last video when going previous from first', async () => {
      videoPlayerService.setVideoElement(mockVideoElement);
      
      await videoPlayerService.playPreviousVideo();

      let state: any;
      videoPlayerService.subscribe(s => state = s)();

      expect(state.currentVideoIndex).toBe(1); // Last video
      expect(state.currentVideo).toEqual(state.videos[1]);
    });
  });

  describe('playback control', () => {
    beforeEach(async () => {
      const mockDigitalSignage = {
        items: [
          {
            id: 1,
            interval: { beginning: '2024-01-01', ending: '2024-12-31' },
            media: { url: '/media/video1.mp4', source: '', filename: 'video1.mp4', pending: 0 },
            title: 'Video 1'
          }
        ],
        timestamp: '2024-01-01T00:00:00Z'
      };

      (digitalSignageService.getDigitalSignage as any).mockResolvedValue(mockDigitalSignage);
      (digitalSignageService.filterValidItems as any).mockReturnValue(mockDigitalSignage.items);
      (digitalSignageService.getMediaUrls as any).mockReturnValue(['/media/video1.mp4']);
      (digitalSignageService.isVideoFile as any).mockReturnValue(true);

      await videoPlayerService.loadVideos();
      videoPlayerService.setVideoElement(mockVideoElement);
    });

    it('should play video successfully', async () => {
      await videoPlayerService.play();

      let state: any;
      videoPlayerService.subscribe(s => state = s)();

      expect(mockVideoElement.play).toHaveBeenCalled();
      expect(state.isPlaying).toBe(true);
      expect(state.hasError).toBe(false);
    });

    it('should pause video', () => {
      videoPlayerService.pause();

      let state: any;
      videoPlayerService.subscribe(s => state = s)();

      expect(mockVideoElement.pause).toHaveBeenCalled();
      expect(state.isPlaying).toBe(false);
    });

    it('should handle play error', async () => {
      const playError = new Error('Play failed');
      mockVideoElement.play = vi.fn().mockRejectedValue(playError);

      await videoPlayerService.play();

      expect(videoErrorHandler.handleVideoError).toHaveBeenCalledWith(
        playError,
        'http://localhost:8090/media/video1.mp4',
        expect.any(Function)
      );
    });
  });

  describe('auto play', () => {
    beforeEach(async () => {
      const mockDigitalSignage = {
        items: [
          {
            id: 1,
            interval: { beginning: '2024-01-01', ending: '2024-12-31' },
            media: { url: '/media/video1.mp4', source: '', filename: 'video1.mp4', pending: 0 },
            title: 'Video 1'
          },
          {
            id: 2,
            interval: { beginning: '2024-01-01', ending: '2024-12-31' },
            media: { url: '/media/video2.mp4', source: '', filename: 'video2.mp4', pending: 0 },
            title: 'Video 2'
          }
        ],
        timestamp: '2024-01-01T00:00:00Z'
      };

      (digitalSignageService.getDigitalSignage as any).mockResolvedValue(mockDigitalSignage);
      (digitalSignageService.filterValidItems as any).mockReturnValue(mockDigitalSignage.items);
      (digitalSignageService.getMediaUrls as any).mockReturnValue(['/media/video1.mp4', '/media/video2.mp4']);
      (digitalSignageService.isVideoFile as any).mockReturnValue(true);

      await videoPlayerService.loadVideos();
      videoPlayerService.setVideoElement(mockVideoElement);
    });

    it('should start auto play', () => {
      vi.useFakeTimers();
      
      videoPlayerService.startAutoPlay();
      
      // Fast forward time
      vi.advanceTimersByTime(30000);
      
      expect(mockVideoElement.load).toHaveBeenCalled();
      
      vi.useRealTimers();
    });

    it('should stop auto play', () => {
      vi.useFakeTimers();
      
      videoPlayerService.startAutoPlay();
      videoPlayerService.stopAutoPlay();
      
      // Fast forward time
      vi.advanceTimersByTime(30000);
      
      // Should not have called load for next video
      expect(mockVideoElement.load).toHaveBeenCalledTimes(0);
      
      vi.useRealTimers();
    });
  });

  describe('URL normalization', () => {
    it('should normalize different URL formats', async () => {
      const mockDigitalSignage = {
        items: [
          {
            id: 1,
            interval: { beginning: '2024-01-01', ending: '2024-12-31' },
            media: { 
              url: 'https://imach.s3.amazonaws.com/core-web-application/videos/video1.mp4', 
              source: '/media/videos/video1.mp4', 
              filename: 'video1.mp4', 
              pending: 0 
            },
            title: 'Video 1'
          },
          {
            id: 2,
            interval: { beginning: '2024-01-01', ending: '2024-12-31' },
            media: { 
              url: 'https://imach.s3.amazonaws.com/core-web-application/videos/video2.mp4', 
              source: '/media/videos/video2.mp4', 
              filename: 'video2.mp4', 
              pending: 0 
            },
            title: 'Video 2'
          },
          {
            id: 3,
            interval: { beginning: '2024-01-01', ending: '2024-12-31' },
            media: { 
              url: 'https://imach.s3.amazonaws.com/core-web-application/videos/video3.mp4', 
              source: '/media/videos/video3.mp4', 
              filename: 'video3.mp4', 
              pending: 0 
            },
            title: 'Video 3'
          }
        ],
        timestamp: '2024-01-01T00:00:00Z'
      };

      (digitalSignageService.getDigitalSignage as any).mockResolvedValue(mockDigitalSignage);
      (digitalSignageService.filterValidItems as any).mockReturnValue(mockDigitalSignage.items);
      (digitalSignageService.getMediaItems as any).mockReturnValue([
        { source: '/media/videos/video1.mp4', url: 'https://imach.s3.amazonaws.com/core-web-application/videos/video1.mp4', filename: 'video1.mp4' },
        { source: '/media/videos/video2.mp4', url: 'https://imach.s3.amazonaws.com/core-web-application/videos/video2.mp4', filename: 'video2.mp4' },
        { source: '/media/videos/video3.mp4', url: 'https://imach.s3.amazonaws.com/core-web-application/videos/video3.mp4', filename: 'video3.mp4' }
      ]);
      (digitalSignageService.isVideoFile as any).mockReturnValue(true);

      await videoPlayerService.loadVideos();

      let state: any;
      videoPlayerService.subscribe(s => state = s)();

      expect(state.videos[0].url).toBe('http://localhost:8090/media/videos/video1.mp4');
      expect(state.videos[1].url).toBe('http://localhost:8090/media/videos/video2.mp4');
      expect(state.videos[2].url).toBe('http://localhost:8090/media/videos/video3.mp4');
    });
  });

  describe('error handling', () => {
    it('should handle video element errors', async () => {
      const mockDigitalSignage = {
        items: [
          {
            id: 1,
            interval: { beginning: '2024-01-01', ending: '2024-12-31' },
            media: { url: '/media/video1.mp4', source: '', filename: 'video1.mp4', pending: 0 },
            title: 'Video 1'
          }
        ],
        timestamp: '2024-01-01T00:00:00Z'
      };

      (digitalSignageService.getDigitalSignage as any).mockResolvedValue(mockDigitalSignage);
      (digitalSignageService.filterValidItems as any).mockReturnValue(mockDigitalSignage.items);
      (digitalSignageService.getMediaUrls as any).mockReturnValue(['/media/video1.mp4']);
      (digitalSignageService.isVideoFile as any).mockReturnValue(true);

      await videoPlayerService.loadVideos();
      videoPlayerService.setVideoElement(mockVideoElement);

      // Simulate video error event
      const errorEvent = new ErrorEvent('error', { message: 'Video load failed' });
      const addEventListenerCall = mockVideoElement.addEventListener.mock.calls.find(
        call => call[0] === 'error'
      );
      
      if (addEventListenerCall) {
        addEventListenerCall[1](errorEvent);
      }

      expect(videoErrorHandler.handleVideoError).toHaveBeenCalledWith(
        errorEvent,
        'http://localhost:8090/media/video1.mp4',
        expect.any(Function)
      );
    });
  });

  describe('utility methods', () => {
    beforeEach(async () => {
      const mockDigitalSignage = {
        items: [
          {
            id: 1,
            interval: { beginning: '2024-01-01', ending: '2024-12-31' },
            media: { url: '/media/video1.mp4', source: '', filename: 'video1.mp4', pending: 0 },
            title: 'Video 1'
          },
          {
            id: 2,
            interval: { beginning: '2024-01-01', ending: '2024-12-31' },
            media: { url: '/media/video2.mp4', source: '', filename: 'video2.mp4', pending: 0 },
            title: 'Video 2'
          }
        ],
        timestamp: '2024-01-01T00:00:00Z'
      };

      (digitalSignageService.getDigitalSignage as any).mockResolvedValue(mockDigitalSignage);
      (digitalSignageService.filterValidItems as any).mockReturnValue(mockDigitalSignage.items);
      (digitalSignageService.getMediaUrls as any).mockReturnValue(['/media/video1.mp4', '/media/video2.mp4']);
      (digitalSignageService.isVideoFile as any).mockReturnValue(true);

      await videoPlayerService.loadVideos();
    });

    it('should return current video', () => {
      const currentVideo = videoPlayerService.getCurrentVideo();
      expect(currentVideo).toBeDefined();
      expect(currentVideo?.id).toBe('video-0');
    });

    it('should return video count', () => {
      const count = videoPlayerService.getVideoCount();
      expect(count).toBe(2);
    });

    it('should return playing state', () => {
      const isPlaying = videoPlayerService.isPlaying();
      expect(typeof isPlaying).toBe('boolean');
    });

    it('should return error state', () => {
      const hasError = videoPlayerService.hasError();
      expect(typeof hasError).toBe('boolean');
    });
  });
});
