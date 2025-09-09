<script lang="ts">
  import { onMount } from 'svelte';
  import VideoPlayer from '$lib/components/ui/VideoPlayer.svelte';
  import { visualSettingsService } from '$lib/services/visualSettings';
  import { digitalSignageService } from '$lib/services/digitalSignage';

  let settings: any = null;
  let digitalSignage: any = null;
  let isLoading = true;
  let showDebug = false;

  onMount(async () => {
    try {
      // Load visual settings
      settings = await visualSettingsService.loadSettings();
      console.log('Loaded visual settings:', settings);

      // Load digital signage
      digitalSignage = await digitalSignageService.getDigitalSignage();
      console.log('Loaded digital signage:', digitalSignage);

    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      isLoading = false;
    }
  });

  function toggleDebug() {
    showDebug = !showDebug;
  }
</script>

<div class="media-test-page">
  <header class="test-header">
    <h1>Media Loading Test</h1>
    <button class="debug-button" onclick={toggleDebug}>
      {showDebug ? 'Hide' : 'Show'} Debug Info
    </button>
  </header>

  {#if isLoading}
    <div class="loading-container">
      <div class="loading-spinner">
        <div class="spinner"></div>
      </div>
      <p>Loading media data...</p>
    </div>
  {:else}
    <div class="content">
      <!-- Visual Settings Test -->
      <section class="test-section">
        <h2>Visual Settings Test</h2>
        <div class="settings-display">
          <div class="setting-item">
            <strong>Background Color:</strong> 
            <span style:color={settings?.background_color || '#000'}>
              {settings?.background_color || 'Not set'}
            </span>
          </div>
          
          <div class="setting-item">
            <strong>Background Image:</strong>
            {#if settings?.background_image}
              <div class="image-test">
                <img src={settings.background_image} alt="Background" onerror={() => console.log('Background image failed to load')} />
                <p>URL: {settings.background_image}</p>
              </div>
            {:else}
              <span class="no-image">No image (directory path or not set)</span>
            {/if}
          </div>
          
          <div class="setting-item">
            <strong>Logo Image:</strong>
            {#if settings?.logotype_image}
              <div class="image-test">
                <img src={settings.logotype_image} alt="Logo" onerror={() => console.log('Logo image failed to load')} />
                <p>URL: {settings.logotype_image}</p>
              </div>
            {:else}
              <span class="no-image">No image (directory path or not set)</span>
            {/if}
          </div>
        </div>
      </section>

      <!-- Video Player Test -->
      <section class="test-section">
        <h2>Video Player Test</h2>
        <div class="video-container">
          <VideoPlayer />
        </div>
      </section>

      <!-- Digital Signage Test -->
      <section class="test-section">
        <h2>Digital Signage Test</h2>
        <div class="signage-display">
          {#if digitalSignage?.items?.length > 0}
            <div class="signage-items">
              {#each digitalSignage.items as item}
                <div class="signage-item">
                  <h3>{item.title}</h3>
                  <p><strong>Source:</strong> {item.media.source}</p>
                  <p><strong>URL:</strong> {item.media.url}</p>
                  <p><strong>Filename:</strong> {item.media.filename}</p>
                  <p><strong>Interval:</strong> {item.interval.beginning} to {item.interval.ending}</p>
                </div>
              {/each}
            </div>
          {:else}
            <p>No digital signage items found</p>
          {/if}
        </div>
      </section>
    </div>
  {/if}

  {#if showDebug}
    <div class="debug-panel">
      <h3>Debug Information</h3>
      <div class="debug-content">
        <h4>Visual Settings:</h4>
        <pre>{JSON.stringify(settings, null, 2)}</pre>
        
        <h4>Digital Signage:</h4>
        <pre>{JSON.stringify(digitalSignage, null, 2)}</pre>
      </div>
    </div>
  {/if}
</div>

<style>
  .media-test-page {
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

  .debug-button {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    cursor: pointer;
  }

  .debug-button:hover {
    background: #0056b3;
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

  .test-section {
    background: white;
    margin-bottom: 2rem;
    padding: 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .test-section h2 {
    margin-top: 0;
    color: #333;
    border-bottom: 2px solid #007bff;
    padding-bottom: 0.5rem;
  }

  .settings-display {
    display: grid;
    gap: 1rem;
  }

  .setting-item {
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 0.25rem;
    border-left: 4px solid #007bff;
  }

  .setting-item strong {
    display: block;
    margin-bottom: 0.5rem;
    color: #333;
  }

  .image-test {
    margin-top: 0.5rem;
  }

  .image-test img {
    max-width: 200px;
    max-height: 150px;
    border: 1px solid #ddd;
    border-radius: 0.25rem;
    margin-bottom: 0.5rem;
  }

  .image-test p {
    font-size: 0.8rem;
    color: #666;
    word-break: break-all;
  }

  .no-image {
    color: #666;
    font-style: italic;
  }

  .video-container {
    height: 400px;
    border: 2px solid #ddd;
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .signage-display {
    margin-top: 1rem;
  }

  .signage-items {
    display: grid;
    gap: 1rem;
  }

  .signage-item {
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 0.25rem;
    border-left: 4px solid #28a745;
  }

  .signage-item h3 {
    margin-top: 0;
    color: #333;
  }

  .signage-item p {
    margin: 0.25rem 0;
    font-size: 0.9rem;
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
    color: #007bff;
  }

  .debug-panel h4 {
    margin: 1rem 0 0.5rem 0;
    color: #28a745;
  }

  .debug-content pre {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.5rem;
    border-radius: 0.25rem;
    overflow-x: auto;
    font-size: 0.7rem;
    line-height: 1.4;
  }

  @media (max-width: 768px) {
    .test-header {
      flex-direction: column;
      gap: 1rem;
    }

    .content {
      padding: 1rem;
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
