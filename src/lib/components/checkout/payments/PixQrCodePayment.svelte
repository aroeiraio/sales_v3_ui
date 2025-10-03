<script>
  import { onMount, onDestroy } from 'svelte';
  import { MEDIA_BASE_URL } from '../../../utils/constants';

  /**
   * @type {any}
   */
  export let paymentResult = null;

  /**
   * @type {any}
   */
  export let cart = { total: 0 };

  /**
   * @type {number}
   */
  export let initialCountdown = 60;

  /**
   * @type {() => void}
   */
  export let onShowInstructions;

  /**
   * @type {() => void}
   */
  export let onCancel;

  /**
   * @type {() => void}
   */
  export let onTimeout;

  // Internal countdown state - this will be reactive
  let countdownTimer = 60;
  let countdownInterval = null;

  // Start countdown when component mounts
  onMount(() => {
    countdownTimer = initialCountdown || 60;
    startCountdown();
  });

  // Cleanup interval when component is destroyed
  onDestroy(() => {
    clearCountdown();
  });


  function startCountdown() {
    clearCountdown(); // Clear any existing interval
    
    countdownInterval = setInterval(() => {
      // Force reactivity by using function update
      countdownTimer = Math.max(0, countdownTimer - 1);
      
      if (countdownTimer <= 0) {
        clearCountdown();
        if (onTimeout) {
          onTimeout();
        }
      }
    }, 1000);
  }

  function clearCountdown() {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }

  /**
   * Format price for display
   * @param {number} price
   * @returns {string}
   */
  function formatPrice(price) {
    if (typeof price !== 'number' || isNaN(price)) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  }
</script>

<section class="section payment-status active qr-code-screen">
  <div class="qr-header">
    <div class="status-message">Escaneie o QR Code</div>
    <div class="status-description">Use seu celular para escanear o código PIX</div>
  </div>

  <div class="qr-main-container">
    <div class="qr-code-display">
      {#if paymentResult?.qrcode_source}
        <img 
          src="{MEDIA_BASE_URL}{paymentResult.qrcode_source}" 
          alt="QR Code PIX" 
          class="qr-code-image"
        />
      {:else}
        <div class="qr-code-placeholder">
          <div class="loader-spinner qr-spinner"></div>
          <div class="loading-text">Carregando QR Code...</div>
        </div>
      {/if}
    </div>
    
    <div class="amount-timer-row">
      <div class="payment-amount-qr">
        <div class="amount-label">Valor do PIX</div>
        <div class="amount-value">{formatPrice(cart.total)}</div>
      </div>
      
      <div class="countdown-container">
        <div class="countdown-circle">
          <svg class="countdown-svg" width="60" height="60">
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
              stroke="var(--primary)" 
              stroke-width="4" 
              fill="none"
              class="countdown-progress"
              stroke-dasharray="157"
              stroke-dashoffset={157 - (countdownTimer / 60) * 157}
            />
          </svg>
          <div class="countdown-text">{countdownTimer}s</div>
        </div>
      </div>
    </div>
  </div>

  <div class="qr-footer">
    <p class="qr-status">
      <i class="icon-info"></i>
      Complete o pagamento antes que o tempo expire
    </p>
    
    <button class="instructions-button" onclick={onShowInstructions}>
      Como pagar
    </button>
    
    <button class="cart-style-cancel-button" onclick={onCancel}>
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

  /* QR Code Screen Styles */
  .qr-code-screen {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    text-align: center;
    height: fit-content;
    max-height: calc(100vh - 160px);
    overflow-y: auto;
    box-shadow: var(--shadow-lg);
  }

  .qr-header {
    margin-bottom: 0;
    width: 100%;
  }

  .status-message {
    font-size: 2rem;
    font-weight: 700;
    color: var(--foreground);
    margin-bottom: 0.75rem;
    line-height: 1.2;
  }

  .status-description {
    font-size: 1.125rem;
    color: var(--muted-foreground);
    line-height: 1.4;
  }

  .qr-main-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    margin: 0;
  }

  .amount-timer-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 2rem;
    background: var(--background);
    padding: 1.5rem;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
  }

  .qr-code-display {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 280px;
    width: 280px;
    margin: 0 auto;
    background: var(--background);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    box-shadow: var(--shadow-md);
  }

  .qr-code-image {
    max-width: 100%;
    max-height: 100%;
    border-radius: var(--radius);
    background: white;
    padding: 0.5rem;
  }

  .qr-code-placeholder {
    width: 100%;
    height: 100%;
    border: 2px dashed var(--border);
    border-radius: var(--radius);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--muted);
    gap: 1rem;
  }

  .qr-spinner {
    width: 80px;
    height: 80px;
    border: 6px solid var(--border);
    border-top: 6px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loading-text {
    color: var(--muted-foreground);
    font-size: 1rem;
    font-weight: 500;
  }

  .payment-amount-qr {
    background: var(--card);
    border: 2px solid var(--primary);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    flex: 1;
    min-width: 0;
    box-shadow: var(--shadow-sm);
  }

  .payment-amount-qr .amount-label {
    font-size: 1rem;
    color: var(--muted-foreground);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }

  .payment-amount-qr .amount-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--primary);
  }

  .instructions-button {
    background: var(--primary);
    color: var(--primary-foreground);
    border: none;
    min-width: 250px;
    min-height: 48px;
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius);
    font-weight: 600;
    font-size: 1.125rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .instructions-button:hover {
    background: var(--primary);
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .qr-footer {
    margin-top: 0;
    margin-bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1rem;
  }

  .countdown-container {
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;
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
    color: var(--primary);
  }

  .qr-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 1rem;
    color: var(--primary);
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: rgba(0, 129, 167, 0.1);
    border-radius: var(--radius);
    font-weight: 500;
  }

  .cart-style-cancel-button {
    background: transparent;
    color: #64748b;
    border: 2px solid var(--border);
    min-width: 250px;
    min-height: 48px;
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius);
    font-weight: 600;
    font-size: 1.125rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
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

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>