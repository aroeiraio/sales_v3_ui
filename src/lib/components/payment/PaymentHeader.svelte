<script lang="ts">
  import { ArrowLeft } from 'lucide-svelte';

  export let title = 'Pagamento';
  export let currentTime = '';
  export let onBack: () => void;
  export let isProcessing = false;
  export let showBackButton = true;
</script>

<header class="header">
  <div class="header-main">
    {#if showBackButton}
      <button class="back-button" on:click={onBack} disabled={isProcessing}>
        <ArrowLeft size={24} />
      </button>
    {:else}
      <div class="back-button-placeholder"></div>
    {/if}
    <h1 class="page-title">{title}</h1>
    <div class="time">{currentTime}</div>
  </div>
</header>

<style>
  .header {
    background: var(--primary);
    color: var(--primary-foreground);
    position: sticky;
    top: 0;
    z-index: 10;
    flex-shrink: 0;
  }

  .header-main {
    padding: 1.5rem 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .back-button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: var(--primary-foreground);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 44px;
    height: 44px;
    border-radius: 0.5rem;
  }

  .back-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
  }

  .back-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .back-button-placeholder {
    width: 44px;
    height: 44px;
  }

  .page-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
    color: var(--primary-foreground);
    text-align: center;
    flex: 1;
  }

  .time {
    font-size: 0.875rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
    min-width: 60px;
    text-align: right;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .header-main {
      padding: 1rem;
    }

    .back-button {
      width: 40px;
      height: 40px;
    }

    .back-button-placeholder {
      width: 40px;
      height: 40px;
    }

    .page-title {
      font-size: 1.25rem;
    }

    .time {
      font-size: 0.75rem;
      min-width: 50px;
    }
  }

  @media (max-width: 480px) {
    .header-main {
      padding-left: 0.75rem;
      padding-right: 0.75rem;
    }
  }

  /* Full HD Portrait (1080x1920) optimizations */
  @media (min-width: 1080px) and (min-height: 1920px) {
    .header-main {
      padding-left: 3rem;
      padding-right: 3rem;
    }
  }
</style>