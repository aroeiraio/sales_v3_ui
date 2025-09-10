<script>
  /**
   * @type {'failed' | 'retry'}
   */
  export let paymentState = 'failed';

  /**
   * @type {number}
   */
  export let retryCount = 0;

  /**
   * @type {number}
   */
  export let maxRetries = 3;

  /**
   * @type {() => void}
   */
  export let onRetry;

  /**
   * @type {() => void}
   */
  export let onCancel;

  /**
   * @type {() => void}
   */
  export let onReturn;
</script>

<section class="section payment-status active error-state">
  <div class="error-content-center">
    <div class="error-icon-animated">
      <div class="error-pulse"></div>
      <div class="error-circle">
        <span class="error-icon-text">❌</span>
      </div>
    </div>
    <div class="status-message error">Pagamento Recusado</div>
    <div class="status-description">
      Seu pagamento foi recusado. Verifique os dados do cartão ou tente outro método de pagamento.
    </div>
  </div>
  
  {#if paymentState === 'retry' && retryCount < maxRetries}
    <div class="retry-options">
      <button class="cart-style-checkout-button" onclick={onRetry}>
        Tentar Novamente
      </button>
      <button class="cart-style-cancel-button" onclick={onCancel}>
        Cancelar
      </button>
    </div>
  {:else}
    <div class="final-options">
      <button class="return-button" onclick={onReturn}>
        Voltar ao Início
      </button>
      <p class="retry-exceeded">Limite de tentativas excedido. Tente novamente mais tarde.</p>
    </div>
  {/if}
</section>

<style>
  .section {
    background: var(--card);
    border-radius: var(--radius-lg);
    padding: 2rem;
    border: 1px solid var(--border);
  }

  .error-state {
    width: 100%;
    padding: 1.5rem;
    height: fit-content;
    max-height: calc(100vh - 160px);
    overflow-y: auto;
  }

  .error-content-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  .error-icon-animated {
    position: relative;
    width: 120px;
    height: 120px;
    margin: 0 auto 2rem auto;
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
    color: var(--destructive);
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

  .status-message.error {
    color: var(--destructive);
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    text-align: center;
  }

  .status-description {
    font-size: 1.125rem;
    color: var(--muted-foreground);
    margin-bottom: 2rem;
    line-height: 1.6;
    text-align: center;
  }

  .retry-options {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin: 2rem auto 0;
    max-width: 400px;
    width: 100%;
  }

  .final-options {
    text-align: center;
    margin-top: 1.5rem;
  }

  .retry-exceeded {
    color: var(--muted-foreground);
    font-size: 0.875rem;
    margin-top: 1rem;
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

  .return-button {
    margin-top: 1.5rem;
    background: var(--secondary);
    color: var(--secondary-foreground);
    border: 2px solid var(--border);
    border-radius: var(--radius);
    padding: 0.75rem 1.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .return-button:hover {
    background: var(--muted);
    transform: translateY(-1px);
  }

  .payment-status.active {
    display: block;
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
</style>