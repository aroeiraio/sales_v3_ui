<script lang="ts">
  import { onMount } from 'svelte';
  import VideoPlayer from '../ui/VideoPlayer.svelte';
  import { visualSettingsService } from '../../services/visualSettings';
  import { errorDialogService } from '../../services/errorDialog';

  let settings: any = null;
  let isLoading = true;

  onMount(async () => {
    try {
      console.log('VideoScreen: Loading visual settings...');
      settings = await visualSettingsService.loadSettings();
      console.log('VideoScreen: Visual settings loaded successfully');
    } catch (error) {
      console.error('VideoScreen: Failed to load visual settings (this should not happen anymore):', error);
      // Visual settings service should handle errors gracefully now
      // Use fallback settings if needed
      settings = visualSettingsService.getDefaultSettings();
    } finally {
      isLoading = false;
    }
  });
</script>

<div 
  class="video-screen" 
  style:background-color={settings?.background_color || 'var(--fallback-bg)'}
>
  {#if isLoading}
    <div class="loading-container">
      <div class="loading-spinner">
        <div class="spinner"></div>
      </div>
      <p>Carregando player de vídeo...</p>
    </div>
  {:else}
    <div class="video-container">
      <VideoPlayer />
    </div>
  {/if}
</div>

<style>
  .video-screen {
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .loading-container {
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

  .video-container {
    width: 100%;
    height: 100%;
    position: relative;
  }

  /* Ensure video player takes full space */
  .video-container :global(.video-player-container) {
    width: 100%;
    height: 100%;
  }
</style>
