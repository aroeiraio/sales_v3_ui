<script>
  /**
   * @type {any}
   */
  export let cart = { total: 0 };

  /**
   * @type {string}
   */
  export let selectedPayment = '';

  /**
   * @type {any[]}
   */
  export let displayPaymentMethods = [];

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

  /**
   * Check if payment is PIX
   * @returns {boolean}
   */
  $: isPixPayment = selectedPayment && selectedPayment.includes('MERCADOPAGO') && !selectedPayment.includes('PINPAD');
</script>

<section class="section payment-status active processing-screen">
  <div class="processing-header">
    {#if isPixPayment}
      <div class="status-message">Preparando PIX</div>
      <div class="status-description">Gerando QR Code para pagamento instantâneo</div>
    {:else}
      <div class="status-message">Processando pagamento</div>
    {/if}
  </div>

  <div class="payment-details-card">
    <div class="amount-display-processing">
      {#if isPixPayment}
        <div class="amount-label">Valor do PIX</div>
      {:else}
        <div class="amount-label">Valor sendo processado</div>
      {/if}
      <div class="amount-value">{formatPrice(cart.total)}</div>
    </div>
    
    {#if selectedPayment}
      <div class="payment-method-display">
        <div class="method-label">Método de pagamento</div>
        <div class="method-value">
          {#each displayPaymentMethods as method}
            {#if method.id === selectedPayment}
              <i class="icon-{method.icon}"></i>
              {method.name}
            {/if}
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <div class="processing-steps">
    {#if isPixPayment}
      <h3 class="steps-title">Preparando PIX</h3>
      <div class="step-list">
        <div class="step-item active">
          <div class="step-icon">
            <i class="icon-check"></i>
          </div>
          <div class="step-text">Validando dados</div>
        </div>
        <div class="step-item active">
          <div class="step-icon processing">
            <div class="processing-dot small"></div>
            <div class="processing-dot small"></div>
            <div class="processing-dot small"></div>
          </div>
          <div class="step-text">Gerando QR Code</div>
        </div>
        <div class="step-item pending">
          <div class="step-icon">
            <i class="icon-qr-code"></i>
          </div>
          <div class="step-text">Exibindo PIX</div>
        </div>
      </div>
    {:else}
      <h3 class="steps-title">Etapas do processamento</h3>
      <div class="step-list">
        <div class="step-item active">
          <div class="step-icon">
            <i class="icon-check"></i>
          </div>
          <div class="step-text">Validando dados</div>
        </div>
        <div class="step-item active">
          <div class="step-icon processing">
            <div class="processing-dot small"></div>
            <div class="processing-dot small"></div>
            <div class="processing-dot small"></div>
          </div>
          <div class="step-text">Processando pagamento</div>
        </div>
        <div class="step-item pending">
          <div class="step-icon">
            <i class="icon-package"></i>
          </div>
          <div class="step-text">Liberando produtos</div>
        </div>
      </div>
    {/if}
  </div>

  <div class="processing-footer">
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

  .processing-screen {
    width: 100%;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    height: fit-content;
    max-height: calc(100vh - 160px);
    overflow-y: auto;
  }

  .processing-header {
    text-align: center;
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

  .payment-details-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 2rem;
    text-align: center;
    width: 100%;
    max-width: 500px;
    margin: 0 auto 2rem auto;
  }

  .amount-display-processing {
    margin-bottom: 1.5rem;
  }

  .amount-display-processing .amount-label {
    font-size: 1rem;
    color: var(--muted-foreground);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }

  .amount-display-processing .amount-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--foreground);
    line-height: 1.2;
  }

  .payment-method-display {
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
  }

  .method-label {
    font-size: 0.875rem;
    color: var(--muted-foreground);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .method-value {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--foreground);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
  }

  .processing-steps {
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 2rem;
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
  }

  .steps-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    text-align: center;
    color: var(--foreground);
  }

  .step-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .step-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: var(--radius);
    transition: all 0.3s ease;
  }

  .step-item.active {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.2);
  }

  .step-item.pending {
    background: var(--muted);
    opacity: 0.6;
  }

  .step-item .step-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 18px;
  }

  .step-item.active .step-icon {
    background: var(--success);
    color: white;
  }

  .step-item.pending .step-icon {
    background: var(--border);
    color: var(--muted-foreground);
  }

  .step-icon.processing {
    background: var(--primary);
    display: flex;
    gap: 2px;
  }

  .step-icon.processing .processing-dot.small {
    width: 4px;
    height: 4px;
    background: white;
    border-radius: 50%;
    animation: pulse 1s infinite;
  }

  .step-icon.processing .processing-dot.small:nth-child(2) {
    animation-delay: 0.2s;
  }

  .step-icon.processing .processing-dot.small:nth-child(3) {
    animation-delay: 0.4s;
  }

  .step-text {
    font-size: 1.125rem;
    font-weight: 500;
    color: var(--foreground);
  }


  .processing-footer {
    text-align: center;
    margin-top: 2rem;
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

  @keyframes pulse {
    0%, 100% {
      transform: scale(0.5);
      opacity: 0.5;
    }
    50% {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>