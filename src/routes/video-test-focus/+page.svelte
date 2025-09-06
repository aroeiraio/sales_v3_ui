<script lang="ts">
  import { onMount } from 'svelte';
  import VideoPlayer from '$lib/components/ui/VideoPlayer.svelte';
  import { videoPlayerService } from '$lib/services/videoPlayer';
  import { digitalSignageService } from '$lib/services/digitalSignage';

  let isLoading = true;
  let debugInfo: any = null;
  let currentVideoUrl = '';
  let videoPlayerState: any = null;

  onMount(async () => {
    try {
      // Load digital signage data
      const digitalSignage = await digitalSignageService.getDigitalSignage();
      const validItems = digitalSignageService.filterValidItems(digitalSignage.items);
      const mediaItems = digitalSignageService.getMediaItems(validItems);
      
      debugInfo = {
        digitalSignage,
        validItems,
        mediaItems,
        timestamp: new Date().toISOString()
      };
      
      console.log('=== DIGITAL SIGNAGE TEST ===');
      console.log('Raw API Response:', digitalSignage);
      console.log('Valid Items:', validItems);
      console.log('Media Items:', mediaItems);
      
      // Subscribe to video player state to track current video
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

  function reloadVideos() {
    console.log('Reloading videos...');
    videoPlayerService.loadVideos();
  }

  function testSpecificVideo() {
    // Test with the specific video URL you mentioned
    const testUrl = 'http://localhost:8090/media/videos/simplescreenrecorder-2024-10-23_09.25.29.mp4';
    console.log('Testing specific video URL:', testUrl);
    
    // You can manually set the video source for testing
    const videoElement = document.querySelector('video');
    if (videoElement) {
      videoElement.src = testUrl;
      videoElement.load();
      videoElement.play().catch(e => console.error('Play failed:', e));
    }
  }
</script>

<div class="video-test-focus">
  <header class="test-header">
    <h1>Video Player Focus Test</h1>
    <div class="test-controls">
      <button class="reload-button" on:click={reloadVideos}>
        Reload Videos
      </button>
      <button class="test-button" on:click={testSpecificVideo}>
        Test Specific Video
      </button>
    </div>
  </header>

  {#if isLoading}
    <div class="loading-container">
      <div class="loading-spinner">
        <div class="spinner"></div>
      </div>
      <p>Loading video player and API data...</p>
    </div>
  {:else}
    <div class="content">
      <!-- Current Video Info -->
      <section class="video-info-section">
        <h2>Current Video Information</h2>
        <div class="video-info">
          <div class="info-item">
            <strong>Current Video URL:</strong>
            <span class="video-url">{currentVideoUrl || 'No video loaded'}</span>
          </div>
          <div class="info-item">
            <strong>Expected URL:</strong>
            <span class="expected-url">http://localhost:8090/media/videos/simplescreenrecorder-2024-10-23_09.25.29.mp4</span>
          </div>
          <div class="info-item">
            <strong>URL Match:</strong>
            <span class:match={currentVideoUrl === 'http://localhost:8090/media/videos/simplescreenrecorder-2024-10-23_09.25.29.mp4'}>
              {currentVideoUrl === 'http://localhost:8090/media/videos/simplescreenrecorder-2024-10-23_09.25.29.mp4' ? '✅ MATCH' : '❌ NO MATCH'}
            </span>
          </div>
        </div>
      </section>

      <!-- Video Player -->
      <section class="video-section">
        <h2>Video Player</h2>
        <div class="video-container">
          <VideoPlayer />
        </div>
      </section>

      <!-- API Data -->
      <section class="api-section">
        <h2>API Data</h2>
        <div class="api-data">
          {#if debugInfo?.digitalSignage?.items?.length > 0}
            <div class="api-item">
              <h3>Digital Signage Items:</h3>
              {#each debugInfo.digitalSignage.items as item}
                <div class="signage-item">
                  <h4>{item.title}</h4>
                  <p><strong>Source:</strong> {item.media.source}</p>
                  <p><strong>URL:</strong> {item.media.url}</p>
                  <p><strong>Filename:</strong> {item.media.filename}</p>
                  <p><strong>Interval:</strong> {item.interval.beginning} to {item.interval.ending}</p>
                </div>
              {/each}
            </div>
          {/if}

          {#if debugInfo?.mediaItems?.length > 0}
            <div class="api-item">
              <h3>Processed Media Items:</h3>
              {#each debugInfo.mediaItems as item, index}
                <div class="media-item">
                  <h4>Item {index + 1}</h4>
                  <p><strong>Source:</strong> {item.source}</p>
                  <p><strong>URL:</strong> {item.url}</p>
                  <p><strong>Filename:</strong> {item.filename}</p>
                  {#if item.normalizedUrl}
                    <p><strong>Normalized URL:</strong> {item.normalizedUrl}</p>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </section>

      <!-- Video Player State -->
      <section class="state-section">
        <h2>Video Player State</h2>
        <div class="state-info">
          {#if videoPlayerState}
            <div class="state-item">
              <strong>Current Video Index:</strong> {videoPlayerState.currentVideoIndex}
            </div>
            <div class="state-item">
              <strong>Total Videos:</strong> {videoPlayerState.videos.length}
            </div>
            <div class="state-item">
              <strong>Is Playing:</strong> {videoPlayerState.isPlaying ? 'Yes' : 'No'}
            </div>
            <div class="state-item">
              <strong>Is Loading:</strong> {videoPlayerState.isLoading ? 'Yes' : 'No'}
            </div>
            <div class="state-item">
              <strong>Has Error:</strong> {videoPlayerState.hasError ? 'Yes' : 'No'}
            </div>
            {#if videoPlayerState.currentVideo}
              <div class="state-item">
                <strong>Current Video Title:</strong> {videoPlayerState.currentVideo.title}
              </div>
            {/if}
          {/if}
        </div>
      </section>
    </div>
  {/if}
</div>

<style>
  .video-test-focus {
    min-height: 100vh;
    background: #f5f5f5;
    font-family: Arial, sans-serif;
  }

  .test-header {
    background: #333;
    color: white;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .test-header h1 {
    margin: 0;
  }

  .test-controls {
    display: flex;
    gap: 1rem;
  }

  .reload-button,
  .test-button {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    cursor: pointer;
  }

  .reload-button:hover,
  .test-button:hover {
    background: #0056b3;
  }

  .test-button {
    background: #28a745;
  }

  .test-button:hover {
    background: #1e7e34;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 50vh;
  }

  .loading-spinner {
    margin-bottom: 1rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .content {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .video-info-section,
  .video-section,
  .api-section,
  .state-section {
    background: white;
    margin-bottom: 2rem;
    padding: 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .video-info-section h2,
  .video-section h2,
  .api-section h2,
  .state-section h2 {
    margin-top: 0;
    color: #333;
    border-bottom: 2px solid #007bff;
    padding-bottom: 0.5rem;
  }

  .video-info {
    display: grid;
    gap: 1rem;
  }

  .info-item {
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 0.25rem;
    border-left: 4px solid #007bff;
  }

  .info-item strong {
    display: block;
    margin-bottom: 0.5rem;
    color: #333;
  }

  .video-url,
  .expected-url {
    font-family: monospace;
    background: #e9ecef;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    word-break: break-all;
  }

  .match {
    font-weight: bold;
    color: #28a745;
  }

  .match:not(.match) {
    color: #dc3545;
  }

  .video-container {
    height: 400px;
    border: 2px solid #ddd;
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .api-data {
    display: grid;
    gap: 1rem;
  }

  .api-item {
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 0.25rem;
    border-left: 4px solid #28a745;
  }

  .api-item h3 {
    margin-top: 0;
    color: #333;
  }

  .signage-item,
  .media-item {
    margin: 1rem 0;
    padding: 1rem;
    background: white;
    border-radius: 0.25rem;
    border: 1px solid #dee2e6;
  }

  .signage-item h4,
  .media-item h4 {
    margin-top: 0;
    color: #495057;
  }

  .signage-item p,
  .media-item p {
    margin: 0.25rem 0;
    font-size: 0.9rem;
  }

  .state-info {
    display: grid;
    gap: 1rem;
  }

  .state-item {
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 0.25rem;
    border-left: 4px solid #ffc107;
  }

  .state-item strong {
    display: block;
    margin-bottom: 0.5rem;
    color: #333;
  }

  @media (max-width: 768px) {
    .test-header {
      flex-direction: column;
      gap: 1rem;
    }

    .test-controls {
      width: 100%;
      justify-content: center;
    }

    .content {
      padding: 1rem;
    }
  }
</style>
