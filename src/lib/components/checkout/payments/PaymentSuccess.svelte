<script>
  import ProgressSteps from '$lib/components/ui/ProgressSteps.svelte';

  /**
   * @type {any}
   */
  export let paymentResult = null;

  /**
   * @type {any[]}
   */
  export let deliverySteps = [];

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

<section class="section payment-status active success-state">
  <div class="status-card">
    <div class="status-header">
      <div class="status-icon-container">
        <div class="success-checkmark">
          <div class="checkmark-circle-success"></div>
          <div class="checkmark-icon-success">✓</div>
        </div>
      </div>
      <div class="status-badge success">
        Pagamento Aprovado
      </div>
    </div>
    <h2 class="status-title">Preparando seus produtos</h2>
    <p class="status-message">
      Aguarde enquanto seus produtos são liberados
    </p>

    {#if deliverySteps.length > 0}
      <ProgressSteps steps={deliverySteps} />
    {/if}
  </div>

  {#if paymentResult?.receipt}
    <div class="transaction-details">
      <div class="details-grid">
        <div class="detail-group">
          <span class="detail-label">Número da Transação</span>
          <span class="detail-value">{paymentResult.receipt.transactionId}</span>
        </div>
        <div class="detail-group">
          <span class="detail-label">Data</span>
          <span class="detail-value">{new Date(paymentResult.receipt.timestamp).toLocaleString('pt-BR')}</span>
        </div>
        <div class="detail-group">
          <span class="detail-label">Método de Pagamento</span>
          <span class="detail-value">{paymentResult.receipt.paymentMethod}</span>
        </div>
        <div class="detail-group">
          <span class="detail-label">Valor Total</span>
          <span class="detail-value">{formatPrice(paymentResult.receipt.total)}</span>
        </div>
      </div>
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

  .success-state {
    width: 100%;
    padding: 1.5rem;
    height: fit-content;
    max-height: calc(100vh - 160px);
    overflow-y: auto;
  }

  .success-state .status-card {
    overflow: hidden;
  }

  .status-card {
    background: var(--card, #FFFFFF);
    border-radius: var(--radius-lg, 1.25rem);
    padding: 2rem;
    text-align: center;
    border: 1px solid var(--border, #E2E8F0);
    margin-bottom: 2rem;
  }

  .status-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .status-icon-container {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 64px;
    flex-shrink: 0;
  }

  .success-checkmark {
    width: 80px;
    height: 80px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1 / 1;
  }

  .checkmark-circle-success {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 3px solid var(--success, #10B981);
    background: var(--card, white);
    position: absolute;
    top: 0;
    left: 0;
    animation: circle-scale-success 0.4s ease-out forwards;
    aspect-ratio: 1 / 1;
  }

  .checkmark-icon-success {
    font-size: 3rem;
    color: var(--success, #10B981);
    font-weight: bold;
    z-index: 1;
    position: relative;
    animation: checkmark-appear-success 0.3s ease-out 0.6s forwards;
    opacity: 0;
    transform: scale(0);
  }

  .status-badge.success {
    background: transparent;
    color: var(--success, #10B981);
    font-size: 1.5rem;
    border: none;
    margin: 0;
    font-weight: 600;
    text-align: left;
  }

  .status-title {
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: var(--foreground, #1E293B);
  }

  .status-card .status-message {
    font-size: 1.125rem;
    color: var(--muted-foreground, #64748B);
    margin-bottom: 2rem;
  }

  .transaction-details {
    background: var(--card, #FFFFFF);
    border-radius: var(--radius-lg, 1.25rem);
    padding: 2rem;
    border: 1px solid var(--border, #E2E8F0);
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
  }

  .details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
  }

  .detail-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-label {
    font-size: 0.875rem;
    color: var(--muted-foreground, #64748B);
  }

  .detail-value {
    font-weight: 600;
    color: var(--foreground, #1E293B);
  }

  .payment-status.active {
    display: block;
  }

  @keyframes circle-scale-success {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes checkmark-appear-success {
    0% {
      opacity: 0;
      transform: scale(0) rotate(-45deg);
    }
    50% {
      transform: scale(1.2) rotate(0deg);
    }
    100% {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }
  }

  @media (max-width: 640px) {
    .status-header {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }
    
    .status-badge.success {
      text-align: center;
      font-size: 1.25rem;
    }
    
    .status-icon-container {
      width: 60px;
      height: 60px;
    }
    
    .success-checkmark {
      width: 60px;
      height: 60px;
    }
    
    .checkmark-circle-success {
      width: 60px;
      height: 60px;
    }
    
    .checkmark-icon-success {
      font-size: 2.5rem;
    }
    
    .status-card {
      padding: 1.5rem;
    }
  }
</style>