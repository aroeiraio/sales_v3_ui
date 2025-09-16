<script>
  import { onMount, onDestroy } from 'svelte';

  /**
   * @type {() => void}
   */
  export let onClose;

  /**
   * @type {() => void}
   */
  export let onCancel;

  // Auto-redirect timeout variables
  let autoRedirectTimer = 30;
  let autoRedirectInterval = null;
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
        onClose();
      }
    }, 1000);
  }

  function clearAutoRedirectCountdown() {
    if (autoRedirectInterval) {
      clearInterval(autoRedirectInterval);
      autoRedirectInterval = null;
    }
  }

  function handleUserAction(callback) {
    // Stop auto-redirect when user takes action
    clearAutoRedirectCountdown();
    isUserInteracting = true;
    callback();
  }
</script>

<section class="section payment-status active timeout-screen">
  <div class="timeout-content">
    <div class="timeout-icon-animated">
      <div class="timeout-pulse"></div>
      <div class="timeout-circle">
        <span class="timeout-icon-text">⏰</span>
      </div>
    </div>
    <div class="status-message error">Tempo esgotado</div>
    <div class="status-description">
      Desculpe, houve uma falha no processamento do seu pagamento.
      O tempo limite foi excedido.
    </div>
    
    {#if !isUserInteracting}
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
    <button class="cart-style-checkout-button" onclick={() => handleUserAction(onClose)}>
      Tentar Novamente
    </button>
    <button class="cart-style-cancel-button" onclick={() => handleUserAction(onCancel)}>
      Cancelar
    </button>
  </div>
</section>

<style>
  .section {
    background: var(--card);
    border-radius: var(--radius-lg);
    padding: 2rem;
    border: 1px solid var(--border);
  }

  .timeout-screen {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    text-align: center;
    height: fit-content;
    max-height: calc(100vh - 160px);
    justify-content: center;
  }

  .timeout-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  .timeout-icon-animated {
    position: relative;
    width: 120px;
    height: 120px;
    margin: 0 auto 2rem auto;
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
    color: var(--destructive);
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

  .status-message.error {
    color: var(--destructive);
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  .status-description {
    font-size: 1.125rem;
    color: var(--muted-foreground);
    margin-bottom: 2rem;
    line-height: 1.6;
  }

  .timeout-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    max-width: 400px;
    margin: 0 auto;
  }

  .cart-style-checkout-button {
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

  .cart-style-checkout-button:hover {
    background: var(--primary);
    opacity: 0.9;
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
  }

  .cart-style-cancel-button {
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

  .cart-style-cancel-button:hover {
    background: var(--muted);
    border-color: var(--muted-foreground);
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
  }

  .payment-status.active {
    display: block;
  }

  /* Auto-redirect countdown styles */
  .auto-redirect-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-top: 2rem;
    margin-bottom: 2rem;
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

  @keyframes timeout-shake {
    0%, 100% {
      transform: translateX(0);
    }
    10%, 30%, 50%, 70%, 90% {
      transform: translateX(-2px);
    }
    20%, 40%, 60%, 80% {
      transform: translateX(2px);
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
      transform: scale(1);
    }
    50% {
      opacity: 0.4;
      transform: scale(1.3);
    }
    100% {
      opacity: 0;
      transform: scale(1.6);
    }
  }
</style>