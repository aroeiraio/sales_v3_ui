<script lang="ts">
  export let cart: {
    items: any[];
    total: number;
    subtotal: number;
    serviceFee: number;
    discount: number;
  };

  function formatPrice(price: number): string {
    if (typeof price !== 'number' || isNaN(price)) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  }
</script>

<div class="cart-summary">
  <div class="summary-header">
    <h3>Resumo do Pedido</h3>
    <span class="item-count">{cart.items.length} {cart.items.length === 1 ? 'item' : 'itens'}</span>
  </div>

  <div class="summary-items">
    {#each cart.items as item}
      <div class="summary-item">
        <div class="item-info">
          <span class="item-name">{item.name}</span>
          <span class="item-details">Qtd: {item.quantity}</span>
        </div>
        <div class="item-price">
          {formatPrice(item.price * item.quantity)}
        </div>
      </div>
    {/each}
  </div>

  <div class="summary-totals">
    <div class="total-line">
      <span>Subtotal</span>
      <span>{formatPrice(cart.subtotal)}</span>
    </div>
    
    {#if cart.serviceFee > 0}
      <div class="total-line">
        <span>Taxa de serviço</span>
        <span>{formatPrice(cart.serviceFee)}</span>
      </div>
    {/if}
    
    {#if cart.discount > 0}
      <div class="total-line discount">
        <span>Desconto</span>
        <span>-{formatPrice(cart.discount)}</span>
      </div>
    {/if}
    
    <div class="total-line final-total">
      <span>Total</span>
      <span>{formatPrice(cart.total)}</span>
    </div>
  </div>
</div>

<style>
  .cart-summary {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .summary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border);
    background: var(--muted);
  }

  .summary-header h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--foreground);
    margin: 0;
  }

  .item-count {
    font-size: 0.875rem;
    color: var(--muted-foreground);
    background: var(--background);
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius);
    border: 1px solid var(--border);
  }

  .summary-items {
    padding: 1rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .summary-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .item-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .item-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--foreground);
    line-height: 1.3;
  }

  .item-details {
    font-size: 0.75rem;
    color: var(--muted-foreground);
  }

  .item-price {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--foreground);
    white-space: nowrap;
  }

  .summary-totals {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border);
    background: var(--muted);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .total-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
    color: var(--foreground);
  }

  .total-line.discount {
    color: var(--destructive);
  }

  .total-line.discount span:last-child {
    font-weight: 600;
  }

  .total-line.final-total {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--primary);
    border-top: 1px solid var(--border);
    padding-top: 0.75rem;
    margin-top: 0.25rem;
  }

  @media (max-width: 640px) {
    .summary-header {
      padding: 0.75rem 1rem;
    }
    
    .summary-header h3 {
      font-size: 1rem;
    }
    
    .summary-items {
      padding: 0.75rem 1rem;
    }
    
    .summary-totals {
      padding: 0.75rem 1rem;
    }
    
    .item-name {
      font-size: 0.8125rem;
    }
    
    .total-line.final-total {
      font-size: 1rem;
    }
  }
</style>