<script lang="ts">
  import type { DisplayPaymentMethod } from '$lib/utils/checkout';

  export let paymentMethods: DisplayPaymentMethod[] = [];
  export let onSelect: (methodId: string) => void;

  let selectedMethod: string = '';
  let isProcessing = false;

  async function handleMethodSelect(method: DisplayPaymentMethod) {
    if (isProcessing) return;
    
    selectedMethod = method.id;
    isProcessing = true;
    
    try {
      await onSelect(method.id);
    } catch (error) {
      console.error('Error selecting payment method:', error);
      // Reset state on error
      selectedMethod = '';
    } finally {
      isProcessing = false;
    }
  }
</script>

<div class="payment-methods-grid">
  {#each paymentMethods as method}
    <button 
      class="payment-method-card"
      class:selected={selectedMethod === method.id}
      class:processing={isProcessing && selectedMethod === method.id}
      disabled={isProcessing}
      on:click={() => handleMethodSelect(method)}
    >
      {#if isProcessing && selectedMethod === method.id}
        <div class="processing-spinner"></div>
      {:else}
        <div class="method-icon">
          {#if method.icon === 'qr-code'}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="5" height="5"/>
              <rect x="3" y="16" width="5" height="5"/>
              <rect x="16" y="3" width="5" height="5"/>
              <path d="M21 16h-3"/>
              <path d="M16 16v3"/>
              <path d="M12 7v3"/>
              <path d="M7 7h3"/>
              <path d="M7 7v3"/>
            </svg>
          {:else if method.icon === 'credit-card'}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          {:else if method.icon === 'landmark'}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          {:else}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          {/if}
        </div>
      {/if}
      
      <div class="method-content">
        <h3 class="method-name">{method.name}</h3>
        <p class="method-description">{method.description}</p>
      </div>
    </button>
  {/each}
</div>

{#if paymentMethods.length === 0}
  <div class="no-methods">
    <div class="no-methods-icon">💳</div>
    <p>Nenhum método de pagamento disponível</p>
  </div>
{/if}

<style>
  .payment-methods-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1rem;
    width: 100%;
  }

  .payment-method-card {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1.5rem;
    background: var(--card);
    border: 2px solid var(--border);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    min-height: 100px;
  }

  .payment-method-card:hover:not(:disabled) {
    border-color: var(--primary);
    background: var(--card);
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .payment-method-card.selected {
    border-color: var(--primary);
    background: rgba(0, 129, 167, 0.05);
  }

  .payment-method-card:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .payment-method-card.processing {
    border-color: var(--primary);
    background: rgba(0, 129, 167, 0.1);
  }

  .method-icon {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--primary);
    border-radius: var(--radius);
    color: var(--primary-foreground);
    font-size: 1.5rem;
  }

  .processing-spinner {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border: 4px solid var(--border);
    border-top: 4px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .method-content {
    flex: 1;
    min-width: 0;
  }

  .method-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--foreground);
    margin: 0 0 0.5rem 0;
  }

  .method-description {
    font-size: 0.875rem;
    color: var(--muted-foreground);
    margin: 0;
    line-height: 1.4;
  }

  .no-methods {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    text-align: center;
    color: var(--muted-foreground);
  }

  .no-methods-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .method-icon {
    font-size: 1.5rem;
  }


  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 640px) {
    .payment-methods-grid {
      grid-template-columns: 1fr;
    }
    
    .payment-method-card {
      min-height: 80px;
      padding: 1rem;
    }
    
    .method-icon,
    .processing-spinner {
      width: 40px;
      height: 40px;
    }
    
    .method-icon {
      font-size: 1.25rem;
    }
    
    .processing-spinner {
      border-width: 3px;
    }
  }
</style>