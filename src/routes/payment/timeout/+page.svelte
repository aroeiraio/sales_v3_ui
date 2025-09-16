<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';

  // Auto-redirect timeout variables
  let autoRedirectTimer = 30;
  let autoRedirectInterval: NodeJS.Timeout | null = null;
  let isUserInteracting = false;

  onMount(() => {
    // Start 30-second countdown for auto-redirect
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

  function tryAgain() {
    handleUserAction(() => {
      goto('/payment/method-selection');
    });
  }

  function cancel() {
    handleUserAction(() => {
      goto('/');
    });
  }
</script>

<svelte:head>
  <title>Tempo Esgotado - InoBag Sales</title>
</svelte:head>

<div class="timeout-page">
  <div class="timeout-container">
    <div class="timeout-animation">
      <div class="timeout-icon-animated">
        <div class="timeout-pulse"></div>
        <div class="timeout-circle">
          <span class="timeout-icon-text">⏰</span>
        </div>
      </div>
    </div>

    <div class="timeout-content">
      <h1 class="timeout-title">Tempo Esgotado</h1>
      <p class="timeout-description">
        Desculpe, houve uma falha no processamento do seu pagamento.
        O tempo limite foi excedido.
      </p>
      
      {#if !isUserInteracting && autoRedirectInterval}
        <div class="auto-redirect-info">
          <div class="countdown-container">
            <div class="countdown-circle">
              <svg class="countdown-svg" width="80" height="80" viewBox="0 0 80 80">
                <circle 
                  cx="40" 
                  cy="40" 
                  r="35" 
                  stroke="var(--border)" 
                  stroke-width="6" 
                  fill="none"
                />
                <circle 
                  cx="40" 
                  cy="40" 
                  r="35" 
                  stroke="var(--destructive)" 
                  stroke-width="6" 
                  fill="none"
                  stroke-dasharray="219.9"
                  stroke-dashoffset={(1 - autoRedirectTimer / 30) * 219.9}
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

    <div class="timeout-actions">
      <button class="primary-button" on:click={tryAgain}>
        Tentar Novamente
      </button>
      <button class="secondary-button" on:click={cancel}>
        Cancelar
      </button>
    </div>
  </div>
</div>

<style>
  .timeout-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 80vh;
    padding: 2rem;
  }

  .timeout-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    max-width: 600px;
    width: 100%;
    gap: 2rem;
  }

  .timeout-animation {
    margin-bottom: 1rem;
  }

  .timeout-icon-animated {
    position: relative;
    width: 120px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .timeout-circle {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(240, 113, 103, 0.1);
    border: 3px solid var(--destructive);
    border-radius: 50%;
    z-index: 2;
    animation: timeout-shake 1.5s ease-in-out infinite;
  }

  .timeout-icon-text {
    font-size: 48px;
    animation: timeout-tick 2s ease-in-out infinite;
    z-index: 3;
    position: relative;
    display: block;
    line-height: 1;
  }

  .timeout-pulse {
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
    animation: timeout-pulse 2s ease-out infinite;
  }

  .timeout-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    width: 100%;
  }

  .timeout-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--destructive);
    margin: 0;
  }

  .timeout-description {
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
    gap: 1rem;
    margin: 2rem 0;
    padding: 1.5rem;
    background: var(--muted);
    border-radius: var(--radius-lg);
    border: 2px solid var(--border);
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
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--destructive);
  }

  .auto-redirect-message {
    font-size: 1rem;
    color: var(--muted-foreground);
    text-align: center;
    margin: 0;
    line-height: 1.5;
  }

  .auto-redirect-message strong {
    color: var(--destructive);
    font-weight: 700;
  }

  .timeout-actions {
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
    min-width: 300px;
    padding: 1rem 2rem;
    border-radius: var(--radius);
    font-weight: 600;
    font-size: 1rem;
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
    color: #64748b;
    border: 2px solid var(--border);
    min-width: 300px;
    padding: 1rem 2rem;
    border-radius: var(--radius);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .secondary-button:hover {
    background: var(--muted);
    border-color: var(--muted-foreground);
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
  }

  @keyframes timeout-shake {
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

  @keyframes timeout-tick {
    0%, 100% {
      transform: scale(1) rotate(0deg);
    }
    25% {
      transform: scale(1.1) rotate(-5deg);
    }
    50% {
      transform: scale(1.05) rotate(5deg);
    }
    75% {
      transform: scale(1.1) rotate(-3deg);
    }
  }

  @keyframes timeout-pulse {
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
    .timeout-title {
      font-size: 2rem;
    }
    
    .timeout-description {
      font-size: 1.125rem;
    }
    
    .timeout-icon-animated {
      width: 100px;
      height: 100px;
    }
    
    .timeout-circle {
      width: 80px;
      height: 80px;
    }
    
    .timeout-icon-text {
      font-size: 40px;
    }
    
    .timeout-pulse {
      width: 80px;
      height: 80px;
    }
    
    .primary-button,
    .secondary-button {
      min-width: 250px;
    }
    
    .auto-redirect-info {
      padding: 1rem;
    }
  }
</style>