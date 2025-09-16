<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  // Get failure type from URL params or default to 'failed'
  $: failureType = $page.url.searchParams.get('type') || 'failed';
  $: retryCount = parseInt($page.url.searchParams.get('retryCount') || '0');
  $: maxRetries = 3;

  // Auto-redirect timeout variables
  let autoRedirectTimer = 30;
  let autoRedirectInterval: NodeJS.Timeout | null = null;
  let isUserInteracting = false;

  onMount(() => {
    // Start timeout for both retry and failed states
    startAutoRedirectCountdown();
  });

  onDestroy(() => {
    clearAutoRedirectCountdown();
  });

  function startAutoRedirectCountdown() {
    autoRedirectTimer = 30;
    autoRedirectInterval = setInterval(() => {
      autoRedirectTimer--;
      
      if (autoRedirectTimer <= 0) {
        clearAutoRedirectCountdown();
        // Auto-redirect to start screen (home page)
        goto('/');
      }
    }, 1000);
  }

  function clearAutoRedirectCountdown() {
    if (autoRedirectInterval) {
      clearInterval(autoRedirectInterval);
      autoRedirectInterval = null;
    }
  }

  function handleUserAction(callback: () => void) {
    // Stop auto-redirect when user takes action
    clearAutoRedirectCountdown();
    isUserInteracting = true;
    callback();
  }

  function retry() {
    handleUserAction(() => {
      goto('/payment/method-selection');
    });
  }

  function cancel() {
    handleUserAction(() => {
      goto('/');
    });
  }

  function getTitle(): string {
    switch (failureType) {
      case 'retry':
        return 'Pagamento Recusado';
      case 'failed':
      default:
        return 'Falha no Pagamento';
    }
  }

  function getDescription(): string {
    switch (failureType) {
      case 'retry':
        return 'Seu pagamento foi recusado. Verifique os dados do cartão ou tente outro método de pagamento.';
      case 'failed':
      default:
        return 'Ocorreu um erro durante o processamento do pagamento. Tente novamente ou escolha outro método.';
    }
  }
</script>

<svelte:head>
  <title>{getTitle()} - InoBag Sales</title>
</svelte:head>

<div class="failed-page">
  <div class="failed-container">
    <div class="error-animation">
      <div class="error-icon-animated">
        <div class="error-pulse"></div>
        <div class="error-circle">
          <span class="error-icon-text">❌</span>
        </div>
      </div>
    </div>

    <div class="error-content">
      <h1 class="error-title">{getTitle()}</h1>
      <p class="error-description">{getDescription()}</p>
      
      {#if !isUserInteracting && autoRedirectInterval}
        <div class="auto-redirect-info">
          <div class="countdown-container">
            <div class="countdown-circle">
              <svg class="countdown-svg" width="60" height="60" viewBox="0 0 60 60">
                <circle 
                  cx="30" 
                  cy="30" 
                  r="25" 
                  stroke="var(--border)" 
                  stroke-width="4" 
                  fill="none"
                />
                <circle 
                  cx="30" 
                  cy="30" 
                  r="25" 
                  stroke="var(--destructive)" 
                  stroke-width="4" 
                  fill="none"
                  stroke-dasharray="157.08"
                  stroke-dashoffset={(1 - autoRedirectTimer / 30) * 157.08}
                  class="countdown-progress"
                />
              </svg>
              <div class="countdown-text">{autoRedirectTimer}</div>
            </div>
          </div>
          <p class="auto-redirect-message">
            Retornando à tela inicial automaticamente em <strong>{autoRedirectTimer}s</strong>
          </p>
        </div>
      {/if}
    </div>
    
    <div class="error-actions">
      {#if failureType === 'retry' && retryCount < maxRetries}
        <button class="primary-button" on:click={retry}>
          Tentar Novamente
        </button>
        <button class="secondary-button" on:click={cancel}>
          Cancelar
        </button>
        
        {#if retryCount > 0}
          <p class="retry-info">
            Tentativa {retryCount + 1} de {maxRetries}
          </p>
        {/if}
      {:else if failureType === 'retry' && retryCount >= maxRetries}
        <div class="retry-exceeded">
          <p class="exceeded-message">Limite de tentativas excedido.</p>
          <p class="exceeded-subtitle">Tente novamente mais tarde ou escolha outro método de pagamento.</p>
          
          <button class="return-button" on:click={() => handleUserAction(() => goto('/'))}>
            Voltar ao Início
          </button>
        </div>
      {:else}
        <!-- General failure case -->
        <button class="primary-button" on:click={retry}>
          Tentar Novamente
        </button>
        <button class="secondary-button" on:click={cancel}>
          Voltar ao Início
        </button>
      {/if}
    </div>
  </div>
</div>

<style>
  .failed-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 80vh;
    padding: 2rem;
  }

  .failed-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    max-width: 600px;
    width: 100%;
    gap: 2rem;
  }

  .error-animation {
    margin-bottom: 1rem;
  }

  .error-icon-animated {
    position: relative;
    width: 120px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .error-circle {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(239, 68, 68, 0.1);
    border: 3px solid var(--destructive);
    border-radius: 50%;
    z-index: 2;
    animation: error-shake 1.5s ease-in-out infinite;
  }

  .error-icon-text {
    font-size: 48px;
    animation: error-bounce 2s ease-in-out infinite;
    z-index: 3;
    position: relative;
    display: block;
    line-height: 1;
  }

  .error-pulse {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100px;
    height: 100px;
    border: 2px solid var(--destructive);
    border-radius: 50%;
    opacity: 0;
    z-index: 1;
    animation: error-pulse 2s ease-out infinite;
  }

  .error-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    width: 100%;
  }

  .error-title {
    font-size: 2.25rem;
    font-weight: 700;
    color: var(--destructive);
    margin: 0;
  }

  .error-description {
    font-size: 1.25rem;
    color: var(--muted-foreground);
    margin: 0;
    line-height: 1.6;
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
  }

  .auto-redirect-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    margin: 1.5rem 0;
    padding: 1rem;
    background: var(--muted);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    max-width: 300px;
    margin-left: auto;
    margin-right: auto;
  }

  .countdown-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .countdown-circle {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .countdown-svg {
    transform: rotate(-90deg);
  }

  .countdown-progress {
    transition: stroke-dashoffset 1s linear;
  }

  .countdown-text {
    position: absolute;
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--destructive);
  }

  .auto-redirect-message {
    font-size: 0.875rem;
    color: var(--muted-foreground);
    text-align: center;
    margin: 0;
    line-height: 1.4;
  }

  .auto-redirect-message strong {
    color: var(--destructive);
    font-weight: 700;
  }

  .error-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    width: 100%;
    max-width: 400px;
  }

  .primary-button {
    background: var(--primary);
    color: var(--primary-foreground);
    border: none;
    min-width: 250px;
    min-height: 48px;
    padding: 1rem 2rem;
    border-radius: var(--radius);
    font-weight: 600;
    font-size: 1.125rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .primary-button:hover {
    opacity: 0.9;
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
  }

  .secondary-button {
    background: transparent;
    color: var(--muted-foreground);
    border: 2px solid var(--border);
    min-width: 250px;
    min-height: 48px;
    padding: 1rem 2rem;
    border-radius: var(--radius);
    font-weight: 600;
    font-size: 1.125rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .secondary-button:hover {
    background: var(--muted);
    border-color: var(--muted-foreground);
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
  }

  .retry-info {
    color: var(--muted-foreground);
    font-size: 0.875rem;
    margin: 0;
    font-style: italic;
  }

  .retry-exceeded {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    text-align: center;
  }

  .exceeded-message {
    color: var(--destructive);
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0;
  }

  .exceeded-subtitle {
    color: var(--muted-foreground);
    margin: 0;
    line-height: 1.5;
  }

  .return-button {
    background: var(--secondary);
    color: var(--secondary-foreground);
    border: 2px solid var(--border);
    border-radius: var(--radius);
    min-height: 48px;
    min-width: 250px;
    padding: 1rem 2rem;
    font-weight: 600;
    font-size: 1.125rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .return-button:hover {
    background: var(--muted);
    transform: translateY(-1px);
  }

  @keyframes error-shake {
    0%, 100% {
      transform: translate(-50%, -50%) translateX(0);
    }
    10%, 30%, 50%, 70%, 90% {
      transform: translate(-50%, -50%) translateX(-2px);
    }
    20%, 40%, 60%, 80% {
      transform: translate(-50%, -50%) translateX(2px);
    }
  }

  @keyframes error-bounce {
    0%, 100% {
      transform: scale(1);
    }
    25% {
      transform: scale(1.1);
    }
    50% {
      transform: scale(1.05);
    }
    75% {
      transform: scale(1.1);
    }
  }

  @keyframes error-pulse {
    0% {
      opacity: 0.8;
      transform: translate(-50%, -50%) scale(1);
    }
    50% {
      opacity: 0.4;
      transform: translate(-50%, -50%) scale(1.3);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(1.6);
    }
  }

  @media (max-width: 640px) {
    .error-title {
      font-size: 1.75rem;
    }
    
    .error-description {
      font-size: 1.125rem;
    }
    
    .error-icon-animated {
      width: 100px;
      height: 100px;
    }
    
    .error-circle {
      width: 80px;
      height: 80px;
    }
    
    .error-icon-text {
      font-size: 40px;
    }
    
    .error-pulse {
      width: 80px;
      height: 80px;
    }
    
    .primary-button,
    .secondary-button {
      min-width: 250px;
    }
    
    .auto-redirect-info {
      padding: 0.75rem;
    }
  }
</style>