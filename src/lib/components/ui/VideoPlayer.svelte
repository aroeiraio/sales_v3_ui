<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { videoPlayerService } from '../../services/videoPlayer';
  import { Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-svelte';

  let videoElement: HTMLVideoElement;
  let playerState = $videoPlayerService;
  let isFullscreen = false;
  let showControls = false;
  let controlsTimeout: NodeJS.Timeout | null = null;

  // Watch for video source changes
  $effect(() => {
    if (videoElement && playerState.currentVideo) {
      console.log('Video source changed to:', playerState.currentVideo.url);
      videoElement.src = playerState.currentVideo.url;
      videoElement.load();
    }
  });

  // Auto-hide controls after 3 seconds
  const CONTROLS_TIMEOUT = 3000;

  onMount(async () => {
    try {
      console.log('=== VIDEO PLAYER INITIALIZATION ===');
      await videoPlayerService.loadVideos();
      videoPlayerService.setVideoElement(videoElement);
      
      // For PoS systems, try to start playing immediately
      // Browser flags should allow this
      try {
        await videoPlayerService.play();
        videoPlayerService.startAutoPlay();
        videoPlayerService.isAutoPlayStarted = true;
        console.log('Video player started automatically (PoS mode)');
      } catch (error) {
        console.log('Auto-play blocked, waiting for user interaction:', error);
      }
    } catch (error) {
      console.error('Failed to initialize video player:', error);
    }
  });

  onDestroy(() => {
    videoPlayerService.destroy();
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
  });

  async function handleVideoClick() {
    if (playerState.isPlaying) {
      videoPlayerService.pause();
    } else {
      try {
        await videoPlayerService.play();
        // Start auto-play after first user interaction
        if (!videoPlayerService.isAutoPlayStarted) {
          videoPlayerService.startAutoPlay();
          videoPlayerService.isAutoPlayStarted = true;
        }
      } catch (error) {
        console.error('Failed to play video:', error);
      }
    }
  }

  function handleVideoDoubleClick() {
    toggleFullscreen();
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      videoElement.requestFullscreen();
      isFullscreen = true;
    } else {
      document.exitFullscreen();
      isFullscreen = false;
    }
  }

  function showControlsTemporarily() {
    showControls = true;
    
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    
    controlsTimeout = setTimeout(() => {
      showControls = false;
    }, CONTROLS_TIMEOUT);
  }

  function handleMouseMove() {
    showControlsTemporarily();
  }

  function handleMouseLeave() {
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    showControls = false;
  }

  function handlePlayPause() {
    if (playerState.isPlaying) {
      videoPlayerService.pause();
    } else {
      videoPlayerService.play();
    }
  }

  function handleNextVideo() {
    videoPlayerService.playNextVideo();
  }

  function handlePreviousVideo() {
    videoPlayerService.playPreviousVideo();
  }

  function handleRestart() {
    if (videoElement) {
      videoElement.currentTime = 0;
    }
  }

  // Handle fullscreen change events
  function handleFullscreenChange() {
    isFullscreen = !!document.fullscreenElement;
  }

  onMount(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  });
</script>

<div 
  class="video-player-container"
  class:fullscreen={isFullscreen}
  onmousemove={handleMouseMove}
  onmouseleave={handleMouseLeave}
>
  <div class="video-wrapper">
    <video
      bind:this={videoElement}
      class="video-element"
      preload="metadata"
      muted
      autoplay
      playsinline
      onclick={handleVideoClick}
      ondblclick={handleVideoDoubleClick}
      onloadeddata={() => console.log('Video loaded successfully')}
      onloadstart={() => console.log('Video load started')}
      oncanplay={() => console.log('Video can play')}
      onerror={(e) => console.error('Video error:', e)}
      onsrcchange={() => console.log('Video source changed to:', videoElement?.src)}
    >
      <p>Seu navegador não suporta vídeos HTML5.</p>
    </video>

    <!-- Loading overlay -->
    {#if playerState.isLoading}
      <div class="loading-overlay">
        <div class="loading-spinner">
          <RotateCcw size={32} class="spinning" />
        </div>
        <p>Carregando vídeo...</p>
      </div>
    {/if}

    <!-- Click to play overlay -->
    {#if !playerState.isPlaying && !playerState.isLoading && !playerState.hasError && playerState.currentVideo}
      <div class="click-to-play-overlay">
        <div class="play-button-large">
          <Play size={64} />
        </div>
        <p>Clique para reproduzir</p>
      </div>
    {/if}

    <!-- Error overlay -->
    {#if playerState.hasError}
      <div class="error-overlay">
        <div class="error-content">
          <p>Erro ao carregar vídeo</p>
          <button class="retry-button" onclick={() => videoPlayerService.loadVideos()}>
            Tentar Novamente
          </button>
        </div>
      </div>
    {/if}

    <!-- Controls overlay -->
    {#if showControls || !playerState.isPlaying}
      <div class="controls-overlay">
        <div class="controls-content">
          <!-- Top controls -->
          <div class="top-controls">
            <div class="video-info">
              {#if playerState.currentVideo}
                <h3 class="video-title">{playerState.currentVideo.title}</h3>
                <span class="video-counter">
                  {playerState.currentVideoIndex + 1} / {playerState.videos.length}
                </span>
              {/if}
            </div>
          </div>

          <!-- Center controls -->
          <div class="center-controls">
            <button 
              class="control-button prev-button"
              onclick={handlePreviousVideo}
              title="Vídeo Anterior"
            >
              <SkipBack size={24} />
            </button>

            <button 
              class="control-button play-pause-button"
              onclick={handlePlayPause}
              title={playerState.isPlaying ? 'Pausar' : 'Reproduzir'}
            >
              {#if playerState.isPlaying}
                <Pause size={32} />
              {:else}
                <Play size={32} />
              {/if}
            </button>

            <button 
              class="control-button next-button"
              onclick={handleNextVideo}
              title="Próximo Vídeo"
            >
              <SkipForward size={24} />
            </button>
          </div>

          <!-- Bottom controls -->
          <div class="bottom-controls">
            <button 
              class="control-button restart-button"
              onclick={handleRestart}
              title="Reiniciar"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .video-player-container {
    position: relative;
    width: 100%;
    height: 100%;
    background: #000;
    overflow: hidden;
  }

  .video-player-container.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
  }

  .video-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .video-element {
    width: 100%;
    height: 100%;
    object-fit: cover;
    cursor: pointer;
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    z-index: 10;
  }

  .loading-spinner {
    margin-bottom: 1rem;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .click-to-play-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    z-index: 10;
    cursor: pointer;
  }

  .play-button-large {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    width: 120px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
    transition: all 0.3s ease;
  }

  .play-button-large:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }

  .click-to-play-overlay p {
    font-size: 1.2rem;
    font-weight: 600;
    text-align: center;
  }

  .error-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    z-index: 10;
  }

  .error-content {
    text-align: center;
  }

  .error-content p {
    margin-bottom: 1rem;
    font-size: 1.2rem;
  }

  .retry-button {
    background: var(--primary, #0081a7);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .retry-button:hover {
    background: var(--bittersweet, #e63946);
  }

  .controls-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.3) 0%,
      transparent 20%,
      transparent 80%,
      rgba(0, 0, 0, 0.3) 100%
    );
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    z-index: 5;
    pointer-events: none;
  }

  .controls-content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 1rem;
    pointer-events: auto;
  }

  .top-controls {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .video-info {
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  }

  .video-title {
    font-size: 1.2rem;
    font-weight: 600;
    margin: 0 0 0.25rem 0;
  }

  .video-counter {
    font-size: 0.9rem;
    opacity: 0.8;
  }

  .center-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
  }

  .bottom-controls {
    display: flex;
    justify-content: flex-start;
    align-items: flex-end;
  }

  .control-button {
    background: rgba(0, 0, 0, 0.6);
    color: white;
    border: none;
    border-radius: 50%;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(4px);
  }

  .control-button:hover {
    background: rgba(0, 0, 0, 0.8);
    transform: scale(1.1);
  }

  .play-pause-button {
    width: 64px;
    height: 64px;
    background: rgba(0, 129, 167, 0.8);
  }

  .play-pause-button:hover {
    background: rgba(0, 129, 167, 1);
  }

  .prev-button,
  .next-button {
    width: 48px;
    height: 48px;
  }

  .restart-button {
    width: 40px;
    height: 40px;
  }

  /* Touch-friendly controls for mobile */
  @media (max-width: 768px) {
    .control-button {
      width: 56px;
      height: 56px;
      min-height: 44px;
      min-width: 44px;
    }

    .play-pause-button {
      width: 72px;
      height: 72px;
    }

    .center-controls {
      gap: 3rem;
    }
  }

  /* Hide controls on very small screens to save space */
  @media (max-width: 480px) {
    .video-title {
      font-size: 1rem;
    }

    .video-counter {
      font-size: 0.8rem;
    }
  }
</style>
