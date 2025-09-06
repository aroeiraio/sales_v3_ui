import { writable } from 'svelte/store';
import { digitalSignageService } from './digitalSignage';
import { errorDialogService } from './errorDialog';
import { videoErrorHandler } from './videoErrorHandler';
import { MEDIA_BASE_URL, VIDEO_CONFIG } from '../utils/constants';
import { normalizeUrl, processMediaItems } from '../utils/urlNormalizer';

export interface VideoItem {
  id: string;
  url: string;
  title: string;
  duration?: number;
  type: 'video' | 'image';
}

export interface VideoPlayerState {
  currentVideoIndex: number;
  videos: VideoItem[];
  isPlaying: boolean;
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  currentVideo?: VideoItem;
}

class VideoPlayerService {
  private state = writable<VideoPlayerState>({
    currentVideoIndex: 0,
    videos: [],
    isPlaying: false,
    isLoading: false,
    hasError: false
  });

  private currentVideoElement: HTMLVideoElement | null = null;
  private playInterval: NodeJS.Timeout | null = null;
  private retryCount = 0;
  private maxRetries = VIDEO_CONFIG.maxRetries;
  public isAutoPlayStarted = false;

  subscribe = this.state.subscribe;

  async loadVideos(): Promise<void> {
    this.updateState({ isLoading: true, hasError: false });

    try {
      // Try to get videos from digital signage API
      const digitalSignage = await digitalSignageService.getDigitalSignage();
      const validItems = digitalSignageService.filterValidItems(digitalSignage.items);
      const mediaUrls = digitalSignageService.getMediaUrls(validItems);

      if (mediaUrls.length === 0) {
        // Fallback to default videos if no digital signage content
        await this.loadDefaultVideos();
        return;
      }

      const mediaItems = digitalSignageService.getMediaItems(validItems);
      console.log('Media items from API:', mediaItems);
      
      const processedMediaItems = processMediaItems(mediaItems);
      console.log('Processed media items:', processedMediaItems);
      
      const videos: VideoItem[] = processedMediaItems.map((item, index) => {
        const sourceUrl = item.source || item.url;
        console.log(`Video ${index}: source="${item.source}", url="${item.url}", normalized="${item.normalizedUrl}"`);
        
        return {
          id: `video-${index}`,
          url: item.normalizedUrl,
          title: validItems[index]?.title || `Video ${index + 1}`,
          type: digitalSignageService.isVideoFile(sourceUrl) ? 'video' : 'image'
        };
      });

      this.updateState({
        videos,
        currentVideo: videos[0],
        isLoading: false,
        hasError: false
      });

      this.retryCount = 0;
    } catch (error) {
      console.error('Failed to load videos from digital signage:', error);
      await this.loadDefaultVideos();
    }
  }

  private async loadDefaultVideos(): Promise<void> {
    try {
      // Fallback videos - you can customize these URLs
      const defaultVideos: VideoItem[] = [
        {
          id: 'default-1',
          url: '/videos/default-1.mp4',
          title: 'Default Video 1',
          type: 'video'
        },
        {
          id: 'default-2',
          url: '/videos/default-2.mp4',
          title: 'Default Video 2',
          type: 'video'
        }
      ];

      this.updateState({
        videos: defaultVideos,
        currentVideo: defaultVideos[0],
        isLoading: false,
        hasError: false
      });

      this.retryCount = 0;
    } catch (error) {
      console.error('Failed to load default videos:', error);
      this.updateState({
        isLoading: false,
        hasError: true,
        errorMessage: 'Não foi possível carregar os vídeos'
      });
    }
  }


  setVideoElement(element: HTMLVideoElement): void {
    this.currentVideoElement = element;
    
    // Configure video element for autoplay (required by Chrome)
    this.currentVideoElement.muted = true;
    this.currentVideoElement.volume = 0;
    this.currentVideoElement.autoplay = true;
    this.currentVideoElement.playsInline = true;
    
    this.setupVideoEventListeners();
  }

  private setupVideoEventListeners(): void {
    if (!this.currentVideoElement) return;

    this.currentVideoElement.addEventListener('ended', () => {
      this.playNextVideo();
    });

    this.currentVideoElement.addEventListener('error', (event) => {
      console.error('Video error:', event);
      const currentState = this.getCurrentState();
      videoErrorHandler.handleVideoError(
        event, 
        currentState.currentVideo?.url,
        () => this.loadCurrentVideo()
      );
    });

    this.currentVideoElement.addEventListener('loadstart', () => {
      this.updateState({ isLoading: true });
    });

    this.currentVideoElement.addEventListener('canplay', () => {
      this.updateState({ isLoading: false, hasError: false });
    });
  }

  async play(): Promise<void> {
    if (!this.currentVideoElement) return;

    try {
      // For PoS systems, ensure video is muted for autoplay
      this.currentVideoElement.muted = true;
      this.currentVideoElement.volume = 0;
      
      await this.currentVideoElement.play();
      this.updateState({ isPlaying: true, hasError: false });
    } catch (error) {
      console.error('Failed to play video:', error);
      const currentState = this.getCurrentState();
      videoErrorHandler.handleVideoError(
        error, 
        currentState.currentVideo?.url,
        () => this.play()
      );
    }
  }

  pause(): void {
    if (!this.currentVideoElement) return;

    this.currentVideoElement.pause();
    this.updateState({ isPlaying: false });
  }

  async playNextVideo(): Promise<void> {
    this.state.update(currentState => {
      const nextIndex = (currentState.currentVideoIndex + 1) % currentState.videos.length;
      const nextVideo = currentState.videos[nextIndex];

      return {
        ...currentState,
        currentVideoIndex: nextIndex,
        currentVideo: nextVideo
      };
    });

    // Wait for the next video to load
    await this.loadCurrentVideo();
  }

  async playPreviousVideo(): Promise<void> {
    this.state.update(currentState => {
      const prevIndex = currentState.currentVideoIndex === 0 
        ? currentState.videos.length - 1 
        : currentState.currentVideoIndex - 1;
      const prevVideo = currentState.videos[prevIndex];

      return {
        ...currentState,
        currentVideoIndex: prevIndex,
        currentVideo: prevVideo
      };
    });

    await this.loadCurrentVideo();
  }

  private async loadCurrentVideo(): Promise<void> {
    if (!this.currentVideoElement) return;

    this.state.update(currentState => {
      const currentVideo = currentState.videos[currentState.currentVideoIndex];
      return {
        ...currentState,
        currentVideo,
        isLoading: true
      };
    });

    // Update video source
    const currentState = this.getCurrentState();
    if (currentState.currentVideo) {
      const normalizedUrl = normalizeUrl(currentState.currentVideo.url);
      console.log('Setting video source:', normalizedUrl);
      
      // Ensure video is muted for autoplay (required by Chrome)
      this.currentVideoElement.muted = true;
      this.currentVideoElement.volume = 0;
      this.currentVideoElement.autoplay = true;
      
      this.currentVideoElement.src = normalizedUrl;
      this.currentVideoElement.load();
    }
  }

  private handleVideoError(): void {
    this.retryCount++;
    
    if (this.retryCount < this.maxRetries) {
      console.log(`Retrying video load (attempt ${this.retryCount}/${this.maxRetries})`);
      setTimeout(() => {
        this.loadCurrentVideo();
      }, VIDEO_CONFIG.retryDelay * this.retryCount); // Exponential backoff
    } else {
      console.error('Max retries reached, skipping to next video');
      this.updateState({
        hasError: true,
        errorMessage: 'Erro ao carregar vídeo',
        isLoading: false
      });

      // Use the video error handler for consistent error handling
      const currentState = this.getCurrentState();
      videoErrorHandler.handleVideoError(
        new Error('Max retries reached'),
        currentState.currentVideo?.url,
        () => this.playNextVideo()
      );
    }
  }

  startAutoPlay(): void {
    this.playInterval = setInterval(() => {
      this.playNextVideo();
    }, VIDEO_CONFIG.autoPlayInterval);
  }

  stopAutoPlay(): void {
    if (this.playInterval) {
      clearInterval(this.playInterval);
      this.playInterval = null;
    }
  }

  private updateState(updates: Partial<VideoPlayerState>): void {
    this.state.update(currentState => ({
      ...currentState,
      ...updates
    }));
  }

  private getCurrentState(): VideoPlayerState {
    let currentState: VideoPlayerState;
    this.state.subscribe(state => {
      currentState = state;
    })();
    return currentState!;
  }

  getCurrentVideo(): VideoItem | undefined {
    return this.getCurrentState().currentVideo;
  }

  getVideoCount(): number {
    return this.getCurrentState().videos.length;
  }

  isPlaying(): boolean {
    return this.getCurrentState().isPlaying;
  }

  hasError(): boolean {
    return this.getCurrentState().hasError;
  }

  destroy(): void {
    this.stopAutoPlay();
    this.currentVideoElement = null;
  }

  // Method for testing - manually set video source
  setVideoSource(url: string): void {
    if (this.currentVideoElement) {
      const normalizedUrl = normalizeUrl(url);
      console.log('Manually setting video source:', normalizedUrl);
      this.currentVideoElement.src = normalizedUrl;
      this.currentVideoElement.load();
    }
  }
}

export const videoPlayerService = new VideoPlayerService();
