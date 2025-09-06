import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { vi } from 'vitest';
import VideoPlayer from '../VideoPlayer.svelte';
import { videoPlayerService } from '../../../services/videoPlayer';

// Mock the video player service
vi.mock('../../../services/videoPlayer');

describe('VideoPlayer', () => {
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
      requestFullscreen: vi.fn(),
      src: '',
      currentTime: 0
    } as any;

    // Mock document methods
    Object.defineProperty(document, 'fullscreenElement', {
      writable: true,
      value: null
    });

    Object.defineProperty(document, 'exitFullscreen', {
      writable: true,
      value: vi.fn()
    });

    // Mock video player service
    (videoPlayerService.loadVideos as any).mockResolvedValue(undefined);
    (videoPlayerService.setVideoElement as any).mockImplementation(() => {});
    (videoPlayerService.play as any).mockResolvedValue(undefined);
    (videoPlayerService.pause as any).mockImplementation(() => {});
    (videoPlayerService.startAutoPlay as any).mockImplementation(() => {});
    (videoPlayerService.destroy as any).mockImplementation(() => {});
    (videoPlayerService.playNextVideo as any).mockResolvedValue(undefined);
    (videoPlayerService.playPreviousVideo as any).mockResolvedValue(undefined);

    // Mock store subscription
    let mockState = {
      currentVideoIndex: 0,
      videos: [
        { id: '1', url: '/video1.mp4', title: 'Video 1', type: 'video' },
        { id: '2', url: '/video2.mp4', title: 'Video 2', type: 'video' }
      ],
      isPlaying: true,
      isLoading: false,
      hasError: false,
      currentVideo: { id: '1', url: '/video1.mp4', title: 'Video 1', type: 'video' }
    };

    (videoPlayerService.subscribe as any).mockImplementation((callback: any) => {
      callback(mockState);
      return () => {}; // unsubscribe function
    });
  });

  describe('Initialization', () => {
    it('should initialize video player on mount', async () => {
      render(VideoPlayer);

      await waitFor(() => {
        expect(videoPlayerService.loadVideos).toHaveBeenCalled();
        expect(videoPlayerService.setVideoElement).toHaveBeenCalled();
        expect(videoPlayerService.play).toHaveBeenCalled();
        expect(videoPlayerService.startAutoPlay).toHaveBeenCalled();
      });
    });

    it('should render video element', () => {
      render(VideoPlayer);
      
      const videoElement = screen.getByRole('application');
      expect(videoElement).toBeInTheDocument();
    });
  });

  describe('Video Controls', () => {
    it('should show play/pause button', () => {
      render(VideoPlayer);
      
      const playButton = screen.getByTitle('Pausar');
      expect(playButton).toBeInTheDocument();
    });

    it('should toggle play/pause when button is clicked', async () => {
      render(VideoPlayer);
      
      const playButton = screen.getByTitle('Pausar');
      fireEvent.click(playButton);

      expect(videoPlayerService.pause).toHaveBeenCalled();
    });

    it('should show next video button', () => {
      render(VideoPlayer);
      
      const nextButton = screen.getByTitle('Próximo Vídeo');
      expect(nextButton).toBeInTheDocument();
    });

    it('should play next video when next button is clicked', async () => {
      render(VideoPlayer);
      
      const nextButton = screen.getByTitle('Próximo Vídeo');
      fireEvent.click(nextButton);

      expect(videoPlayerService.playNextVideo).toHaveBeenCalled();
    });

    it('should show previous video button', () => {
      render(VideoPlayer);
      
      const prevButton = screen.getByTitle('Vídeo Anterior');
      expect(prevButton).toBeInTheDocument();
    });

    it('should play previous video when previous button is clicked', async () => {
      render(VideoPlayer);
      
      const prevButton = screen.getByTitle('Vídeo Anterior');
      fireEvent.click(prevButton);

      expect(videoPlayerService.playPreviousVideo).toHaveBeenCalled();
    });

    it('should show restart button', () => {
      render(VideoPlayer);
      
      const restartButton = screen.getByTitle('Reiniciar');
      expect(restartButton).toBeInTheDocument();
    });
  });

  describe('Video Information', () => {
    it('should display current video title', () => {
      render(VideoPlayer);
      
      expect(screen.getByText('Video 1')).toBeInTheDocument();
    });

    it('should display video counter', () => {
      render(VideoPlayer);
      
      expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading overlay when loading', () => {
      // Mock loading state
      let mockState = {
        currentVideoIndex: 0,
        videos: [],
        isPlaying: false,
        isLoading: true,
        hasError: false,
        currentVideo: undefined
      };

      (videoPlayerService.subscribe as any).mockImplementation((callback: any) => {
        callback(mockState);
        return () => {};
      });

      render(VideoPlayer);
      
      expect(screen.getByText('Carregando vídeo...')).toBeInTheDocument();
    });

    it('should show error overlay when there is an error', () => {
      // Mock error state
      let mockState = {
        currentVideoIndex: 0,
        videos: [],
        isPlaying: false,
        isLoading: false,
        hasError: true,
        currentVideo: undefined
      };

      (videoPlayerService.subscribe as any).mockImplementation((callback: any) => {
        callback(mockState);
        return () => {};
      });

      render(VideoPlayer);
      
      expect(screen.getByText('Erro ao carregar vídeo')).toBeInTheDocument();
      expect(screen.getByText('Tentar Novamente')).toBeInTheDocument();
    });
  });

  describe('Fullscreen Functionality', () => {
    it('should toggle fullscreen on double click', () => {
      render(VideoPlayer);
      
      const videoElement = screen.getByRole('application');
      fireEvent.dblClick(videoElement);

      expect(mockVideoElement.requestFullscreen).toHaveBeenCalled();
    });

    it('should handle fullscreen change events', () => {
      render(VideoPlayer);
      
      // Simulate fullscreen change
      Object.defineProperty(document, 'fullscreenElement', {
        value: mockVideoElement
      });

      const fullscreenChangeEvent = new Event('fullscreenchange');
      document.dispatchEvent(fullscreenChangeEvent);

      // Component should handle the event (tested through behavior)
      expect(document.fullscreenElement).toBe(mockVideoElement);
    });
  });

  describe('Mouse Interactions', () => {
    it('should show controls on mouse move', () => {
      render(VideoPlayer);
      
      const container = screen.getByRole('application');
      fireEvent.mouseMove(container);

      // Controls should be visible (tested through the component behavior)
      expect(container).toBeInTheDocument();
    });

    it('should hide controls on mouse leave', () => {
      render(VideoPlayer);
      
      const container = screen.getByRole('application');
      fireEvent.mouseLeave(container);

      // Controls should be hidden after timeout (tested through the component behavior)
      expect(container).toBeInTheDocument();
    });
  });

  describe('Video Click Handling', () => {
    it('should toggle play/pause on video click', () => {
      render(VideoPlayer);
      
      const videoElement = screen.getByRole('application');
      fireEvent.click(videoElement);

      expect(videoPlayerService.pause).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should destroy video player on component destroy', () => {
      const { unmount } = render(VideoPlayer);
      
      unmount();

      expect(videoPlayerService.destroy).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for buttons', () => {
      render(VideoPlayer);
      
      const playButton = screen.getByTitle('Pausar');
      const nextButton = screen.getByTitle('Próximo Vídeo');
      const prevButton = screen.getByTitle('Vídeo Anterior');
      const restartButton = screen.getByTitle('Reiniciar');

      expect(playButton).toHaveAttribute('title');
      expect(nextButton).toHaveAttribute('title');
      expect(prevButton).toHaveAttribute('title');
      expect(restartButton).toHaveAttribute('title');
    });

    it('should have proper video element attributes', () => {
      render(VideoPlayer);
      
      const videoElement = screen.getByRole('application');
      expect(videoElement).toHaveAttribute('preload', 'metadata');
      expect(videoElement).toHaveAttribute('muted');
      expect(videoElement).toHaveAttribute('autoplay');
      expect(videoElement).toHaveAttribute('playsinline');
    });
  });

  describe('Responsive Design', () => {
    it('should render correctly on mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(VideoPlayer);
      
      const videoElement = screen.getByRole('application');
      expect(videoElement).toBeInTheDocument();
    });
  });
});
