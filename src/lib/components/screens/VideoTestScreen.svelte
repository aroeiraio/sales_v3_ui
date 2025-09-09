<script lang="ts">
  import { onMount } from 'svelte';
  import VideoPlayer from '../ui/VideoPlayer.svelte';
  import { videoPlayerService } from '../../services/videoPlayer';
  import { digitalSignageService } from '../../services/digitalSignage';
  import { visualSettingsService } from '../../services/visualSettings';

  let settings: any = null;
  let isLoading = true;
  let debugInfo: any = null;
  let showDebug = false;
  let currentVideoUrl = '';
  let videoPlayerState: any = null;

  onMount(async () => {
    try {
      settings = await visualSettingsService.loadSettings();
      
      // Test the actual API call
      const digitalSignage = await digitalSignageService.getDigitalSignage();
      const validItems = digitalSignageService.filterValidItems(digitalSignage.items);
      const mediaItems = digitalSignageService.getMediaItems(validItems);
      
      debugInfo = {
        digitalSignage,
        validItems,
        mediaItems,
        timestamp: new Date().toISOString()
      };
      
      console.log('Digital Signage API Response:', digitalSignage);
      console.log('Valid Items:', validItems);
      console.log('Media Items:', mediaItems);
      
      // Subscribe to video player state
      const unsubscribe = videoPlayerService.subscribe(state => {
        videoPlayerState = state;
        if (state.currentVideo) {
          currentVideoUrl = state.currentVideo.url;
          console.log('Current video URL:', currentVideoUrl);
        }
      });
      
      // Clean up subscription on component destroy
      return () => unsubscribe();
      
    } catch (error) {
      console.error('Failed to load data:', error);
      debugInfo = {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    } finally {
      isLoading = false;
    }
  });

  function toggleDebug() {
    showDebug = !showDebug;
  }

  function reloadVideos() {
    videoPlayerService.loadVideos();
  }

  function testSpecificVideo() {
    // Test with the specific video URL you mentioned
    const testUrl = '/media/videos/simplescreenrecorder-2024-10-23_09.25.29.mp4';
    console.log('Testing specific video URL:', testUrl);
    
    // Use the video player service method
    videoPlayerService.setVideoSource(testUrl);
    
    // Try to play after a short delay
    setTimeout(async () => {
      try {
        await videoPlayerService.play();
        console.log('Video started playing successfully');
      } catch (error) {
        console.error('Play failed:', error);
      }
    }, 1000);
  }
</script>

<div 
  class="video-test-screen" 
  style:background-color={settings?.background_color || 'var(--fallback-bg)'}
>
  <header class="test-header">
    <h1>Video Player Test</h1>
    <div class="test-controls">
      <button class="debug-button" onclick={toggleDebug}>
        {showDebug ? 'Hide' : 'Show'} Debug Info
      </button>
      <button class="reload-button" onclick={reloadVideos}>
        Reload Videos
      </button>
      <button class="test-button" onclick={testSpecificVideo}>
        Test Specific Video
      </button>
    </div>
  </header>

  {#if isLoading}
    <div class="loading-container">
      <div class="loading-spinner">
        <div class="spinner"></div>
      </div>
      <p>Loading video player and testing API...</p>
    </div>
  {:else}
    <div class="video-info">
      <div class="current-video-info">
        <h3>Current Video Information</h3>
        <p><strong>URL:</strong> <code>{currentVideoUrl || 'No video loaded'}</code></p>
        <p><strong>Expected:</strong> <code>http://localhost:8090/media/videos/simplescreenrecorder-2024-10-23_09.25.29.mp4</code></p>
        <p><strong>Status:</strong> 
          <span class:match={currentVideoUrl === 'http://localhost:8090/media/videos/simplescreenrecorder-2024-10-23_09.25.29.mp4'}>
            {currentVideoUrl === 'http://localhost:8090/media/videos/simplescreenrecorder-2024-10-23_09.25.29.mp4' ? '✅ MATCH' : '❌ NO MATCH'}
          </span>
        </p>
      </div>
    </div>
    
    <div class="video-container">
      <VideoPlayer />
    </div>
  {/if}

  {#if showDebug && debugInfo}
    <div class="debug-panel">
      <h3>Debug Information</h3>
      <div class="debug-content">
        <h4>API Response:</h4>
        <pre>{JSON.stringify(debugInfo.digitalSignage, null, 2)}</pre>
        
        <h4>Valid Items:</h4>
        <pre>{JSON.stringify(debugInfo.validItems, null, 2)}</pre>
        
        <h4>Media Items:</h4>
        <pre>{JSON.stringify(debugInfo.mediaItems, null, 2)}</pre>
        
        {#if debugInfo.error}
          <h4>Error:</h4>
          <p class="error-message">{debugInfo.error}</p>
        {/if}
        
        <h4>Timestamp:</h4>
        <p>{debugInfo.timestamp}</p>
      </div>
    </div>
  {/if}
</div>

<style>
  .video-test-screen {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .test-header {
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 100;
  }

  .test-header h1 {
    margin: 0;
    font-size: 1.5rem;
  }

  .test-controls {
    display: flex;
    gap: 1rem;
  }

  .debug-button,
  .reload-button,
  .test-button {
    background: var(--primary, #0081a7);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .test-button {
    background: var(--success, #06d6a0);
  }

  .debug-button:hover,
  .reload-button:hover {
    background: var(--bittersweet, #e63946);
  }

  .test-button:hover {
    background: #04a085;
  }

  .loading-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--text, #2C3E50);
  }

  .loading-spinner {
    margin-bottom: 1rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--border, #e0e0e0);
    border-top: 4px solid var(--primary, #0081a7);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .video-info {
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .current-video-info h3 {
    margin-top: 0;
    color: #00afb5;
  }

  .current-video-info p {
    margin: 0.5rem 0;
  }

  .current-video-info code {
    background: rgba(255, 255, 255, 0.2);
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-family: monospace;
    word-break: break-all;
  }

  .match {
    font-weight: bold;
    color: #06d6a0;
  }

  .match:not(.match) {
    color: #e63946;
  }

  .video-container {
    flex: 1;
    position: relative;
  }

  .debug-panel {
    position: fixed;
    top: 80px;
    right: 20px;
    width: 400px;
    max-height: 70vh;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-y: auto;
    z-index: 1000;
    font-size: 0.8rem;
  }

  .debug-panel h3 {
    margin: 0 0 1rem 0;
    color: var(--primary, #0081a7);
  }

  .debug-panel h4 {
    margin: 1rem 0 0.5rem 0;
    color: var(--secondary, #00afb5);
  }

  .debug-content pre {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.5rem;
    border-radius: 0.25rem;
    overflow-x: auto;
    font-size: 0.7rem;
    line-height: 1.4;
  }

  .error-message {
    color: var(--error, #e63946);
    background: rgba(230, 57, 70, 0.1);
    padding: 0.5rem;
    border-radius: 0.25rem;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .test-header {
      flex-direction: column;
      gap: 1rem;
    }

    .test-controls {
      width: 100%;
      justify-content: center;
    }

    .debug-panel {
      position: fixed;
      top: 120px;
      left: 10px;
      right: 10px;
      width: auto;
      max-height: 60vh;
    }
  }
</style>
