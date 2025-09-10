<script>
  import { ArrowLeft } from 'lucide-svelte';

  /**
   * @type {boolean}
   */
  export let showBackButton = true;

  /**
   * @type {boolean}
   */
  export let isProcessing = false;

  /**
   * @type {() => void}
   */
  export let onBack;

  /**
   * @type {string}
   */
  export let title = 'Pagamento';

  /**
   * @type {string}
   */
  export let currentTime = '';
</script>

<header class="header">
  <div class="header-main">
    {#if showBackButton}
      <button class="back-button" onclick={onBack} disabled={isProcessing}>
        <ArrowLeft size={24} />
      </button>
    {:else}
      <div class="back-spacer"></div>
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
  }

  .header-main {
    padding: 1.5rem 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .back-spacer {
    width: 44px;
    height: 44px;
  }

  .back-button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: var(--primary-foreground);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    width: 44px;
    height: 44px;
    border-radius: 0.5rem;
    backdrop-filter: blur(8px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .back-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateX(-3px) translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .back-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
    width: 44px;
    text-align: center;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .header-main {
      padding: 1rem;
    }

    .back-button,
    .back-spacer {
      width: 40px;
      height: 40px;
    }

    .page-title {
      font-size: 1.25rem;
    }

    .time {
      font-size: 0.75rem;
      width: 40px;
    }
  }
</style>