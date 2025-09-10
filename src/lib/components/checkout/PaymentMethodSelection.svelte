<script>
  import { goto } from '$app/navigation';
  import { QrCode, CreditCard, Landmark } from 'lucide-svelte';

  // Icon mapping for payment methods
  const iconComponents = {
    'qr-code': QrCode,
    'credit-card': CreditCard,
    'landmark': Landmark
  };
  
  /**
   * @type {any[]}
   */
  export let availablePaymentMethods = [];

  /**
   * @type {any[]}
   */
  export let displayPaymentMethods = [];

  /**
   * @type {string}
   */
  export let selectedPayment = '';

  /**
   * @type {boolean}
   */
  export let isProcessing = false;

  /**
   * @type {(methodId: string) => void}
   */
  export let onSelectPayment;

  /**
   * @type {() => void}
   */
  export let onSimulateProcessingPayment;

  /**
   * @type {() => void}
   */
  export let onSimulatePixProcessing;

  /**
   * @type {() => void}
   */
  export let onSimulateQRCodeScreen;

  /**
   * @type {() => void}
   */
  export let onSimulateTimeoutScreen;

  /**
   * @type {() => void}
   */
  export let onSimulateSuccessPayment;

  /**
   * @type {() => void}
   */
  export let onSimulateRefusedPayment;
</script>

<section class="section">
  <h2 class="section-title">Escolha a forma de pagamento</h2>
  <div class="payment-methods">
    {#each displayPaymentMethods as method}
      <button 
        class="payment-method"
        class:selected={selectedPayment === method.id}
        onclick={() => onSelectPayment(method.id)}
        disabled={isProcessing}
      >
        <div class="payment-icon">
          {#if iconComponents[method.icon]}
            <svelte:component this={iconComponents[method.icon]} size={32} />
          {:else}
            <CreditCard size={32} />
          {/if}
        </div>
        <div class="payment-method-info">
          <div class="payment-method-name">{method.name}</div>
          <div class="payment-method-description">{method.description}</div>
        </div>
      </button>
    {/each}
  </div>
  
  {#if availablePaymentMethods.length === 0}
    <div class="no-payment-methods">
      <p>Carregando métodos de pagamento...</p>
    </div>
  {/if}

  <!-- Debug buttons for testing payment states -->
  <div class="debug-section">
    <h3 class="debug-title">🧪 Debug - Testar Estados</h3>
    <div class="debug-buttons">
      <button class="debug-button processing" onclick={onSimulateProcessingPayment}>
        ⏳ Processando (Cartão)
      </button>
      <button class="debug-button pix-processing" onclick={onSimulatePixProcessing}>
        🔄 Preparando PIX
      </button>
      <button class="debug-button qr-code" onclick={onSimulateQRCodeScreen}>
        📊 Escaneie QR Code
      </button>
      <button class="debug-button timeout" onclick={onSimulateTimeoutScreen}>
        ⏰ Timeout PIX
      </button>
      <button class="debug-button success" onclick={onSimulateSuccessPayment}>
        ✅ Simular Aprovado
      </button>
      <button class="debug-button refused" onclick={onSimulateRefusedPayment}>
        ❌ Simular Recusado
      </button>
      <button class="debug-button end" onclick={() => goto('/end')}>
        🏁 Ver Tela Final
      </button>
    </div>
  </div>
</section>

<style>
  .section {
    background: var(--card);
    border-radius: var(--radius-lg);
    padding: 2rem;
    border: 1px solid var(--border);
  }

  .section-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 2rem;
    text-align: center;
    color: var(--foreground);
  }

  .payment-methods {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    max-width: 600px;
    margin: 0 auto;
  }

  .payment-method {
    background: var(--background);
    border: 2px solid var(--border);
    border-radius: var(--radius);
    padding: 2rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    width: 100%;
    max-width: 500px;
    min-height: 100px;
    font-size: 1.4rem;
    text-align: center;
  }

  .payment-method:hover {
    border-color: var(--primary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
  }

  .payment-method.selected {
    border-color: var(--primary);
    background: var(--primary);
    color: var(--primary-foreground);
  }

  .payment-method:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .payment-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 1rem;
    color: var(--foreground);
    flex-shrink: 0;
  }

  .payment-method.selected .payment-icon {
    color: var(--primary-foreground);
  }

  .payment-method-info {
    flex: 1;
    text-align: center;
  }

  .payment-method-name {
    font-weight: 600;
    margin-bottom: 0.25rem;
    font-size: 1.4rem;
  }

  .payment-method-description {
    color: var(--muted-foreground);
    font-size: 1rem;
  }

  .no-payment-methods {
    text-align: center;
    padding: 2rem;
    color: var(--muted-foreground);
  }

  .debug-section {
    margin-top: 2rem;
    padding: 1rem;
    background: rgba(255, 193, 7, 0.1);
    border: 2px dashed #ffc107;
    border-radius: var(--radius, 0.5rem);
    display: block; /* Show debug section for testing */
  }

  .debug-title {
    font-size: 1rem;
    font-weight: 600;
    color: #856404;
    margin-bottom: 1rem;
    text-align: center;
  }

  .debug-buttons {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .debug-button {
    padding: 0.75rem 1rem;
    border-radius: var(--radius, 0.5rem);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    font-size: 0.875rem;
  }

  .debug-button.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  .debug-button.success:hover {
    background: #c3e6cb;
    transform: translateY(-1px);
  }

  .debug-button.refused {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  .debug-button.refused:hover {
    background: #f5c6cb;
    transform: translateY(-1px);
  }

  .debug-button.processing {
    background: #fff3cd;
    color: #856404;
    border: 1px solid #ffeaa7;
  }

  .debug-button.processing:hover {
    background: #ffeaa7;
    transform: translateY(-1px);
  }

  .debug-button.pix-processing {
    background: #f3e5f5;
    color: #4a148c;
    border: 1px solid #e1bee7;
  }

  .debug-button.pix-processing:hover {
    background: #e1bee7;
    transform: translateY(-1px);
  }

  .debug-button.qr-code {
    background: #e8f5e8;
    color: #2e7d32;
    border: 1px solid #c8e6c9;
  }

  .debug-button.qr-code:hover {
    background: #c8e6c9;
    transform: translateY(-1px);
  }

  .debug-button.timeout {
    background: #fff3e0;
    color: #ef6c00;
    border: 1px solid #ffcc02;
  }

  .debug-button.timeout:hover {
    background: #ffcc02;
    transform: translateY(-1px);
  }

  .debug-button.end {
    background: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
  }

  .debug-button.end:hover {
    background: #bee5eb;
    transform: translateY(-1px);
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .payment-methods {
      grid-template-columns: 1fr;
    }

    .payment-method {
      padding: 1rem;
    }
  }
</style>