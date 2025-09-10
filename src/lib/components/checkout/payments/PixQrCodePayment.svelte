<script>
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
  export let countdownTimer = 60;

  /**
   * @type {() => void}
   */
  export let onShowInstructions;

  /**
   * @type {() => void}
   */
  export let onCancel;

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
          src="http://localhost:8090{paymentResult.qrcode_source}" 
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
    
    <div class="payment-amount-qr">
      <div class="amount-label">Valor do PIX</div>
      <div class="amount-value">{formatPrice(cart.total)}</div>
    </div>
  </div>

  <div class="qr-instructions">
    <button class="instructions-button" onclick={onShowInstructions}>
      Como pagar
    </button>
  </div>

  <div class="qr-footer">
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
    <p class="qr-status">
      <i class="icon-info"></i>
      Complete o pagamento antes que o tempo expire
    </p>
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
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
    height: fit-content;
    max-height: calc(100vh - 160px);
    overflow-y: auto;
  }

  .qr-header {
    margin-bottom: 1rem;
  }

  .status-message {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--foreground);
    margin-bottom: 0.5rem;
  }

  .status-description {
    font-size: 1.125rem;
    color: var(--muted-foreground);
  }

  .qr-main-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    margin: 2rem 0;
  }

  .qr-code-display {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 280px;
    width: 280px;
    margin: 0 auto;
  }

  .qr-code-image {
    max-width: 280px;
    max-height: 280px;
    border: 4px solid var(--primary);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    background: white;
    padding: 1rem;
  }

  .qr-code-placeholder {
    width: 280px;
    height: 280px;
    border: 4px dashed var(--border);
    border-radius: var(--radius-lg);
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
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
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
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary);
  }

  .qr-instructions {
    margin: 1rem 0;
    text-align: center;
  }

  .instructions-button {
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

  .instructions-button:hover {
    background: var(--primary);
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .qr-footer {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
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

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>