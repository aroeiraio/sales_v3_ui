<script>
  /**
   * @type {any}
   */
  export let cart = { items: [], total: 0, subtotal: 0, fees: 0, discount: 0 };

  /**
   * @type {string}
   */
  export let title = 'Resumo do Pedido';

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

<section class="section">
  <h2 class="section-title">{title}</h2>
  <div class="summary-items">
    {#each cart.items as item}
      <div class="summary-item">
        <div class="item-info">
          <span class="item-quantity">{item.quantity}x</span>
          <span>{item.name}</span>
        </div>
        <span class="item-price">{formatPrice(item.price * item.quantity)}</span>
      </div>
    {/each}
  </div>

  <div class="summary-totals">
    <div class="summary-row">
      <span>Subtotal</span>
      <span>{formatPrice(cart.subtotal)}</span>
    </div>
    {#if cart.fees && cart.fees > 0}
      <div class="summary-row">
        <span>Taxa de serviço</span>
        <span>{formatPrice(cart.fees)}</span>
      </div>
    {/if}
    {#if cart.discount && cart.discount > 0}
      <div class="summary-row">
        <span>Desconto</span>
        <span>- {formatPrice(cart.discount)}</span>
      </div>
    {/if}
    <div class="summary-row total">
      <span>Total</span>
      <span>{formatPrice(cart.total)}</span>
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
    margin: 0 0 1.5rem 0;
    color: var(--foreground);
  }

  .summary-items {
    margin-bottom: 1.5rem;
  }

  .summary-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border);
  }

  .summary-item:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  .item-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .item-quantity {
    background: var(--muted);
    color: var(--muted-foreground);
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius);
    font-size: 0.875rem;
    font-weight: 500;
  }

  .item-price {
    font-weight: 500;
  }

  .summary-totals {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    color: var(--muted-foreground);
  }

  .summary-row.total {
    font-weight: 700;
    font-size: 1.25rem;
    margin-top: 0.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
    color: var(--foreground);
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .summary-item {
      flex-direction: column;
      gap: 0.5rem;
    }

    .item-price {
      text-align: right;
    }
  }
</style>