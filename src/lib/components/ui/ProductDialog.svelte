<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { X, Plus, ImageOff } from 'lucide-svelte';
  import { cartService } from '../../services/cart';
  import { productsService } from '../../services/products';
  import type { Product } from '../../services/products';

  export let product: Product | null = null;
  export let isOpen: boolean = false;

  const dispatch = createEventDispatcher();

  let isAddingToCart = false;

  function closeDialog() {
    dispatch('close');
  }

  async function addToCart() {
    if (!product || isAddingToCart) return;

    isAddingToCart = true;
    try {
      await cartService.addItem(product.itemId, product.type);
      closeDialog();
    } catch (error) {
      console.error('Failed to add product to cart:', error);
    } finally {
      isAddingToCart = false;
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeDialog();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeDialog();
    }
  }

  function hasValidImage(product: Product): boolean {
    return product.media && product.media.length > 0 && 
           (product.media[0].url || product.media[0].source);
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && product}
  <div class="dialog-backdrop" onclick={handleBackdropClick} role="dialog" aria-modal="true">
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 class="dialog-title">{product.name}</h2>
        <button class="close-button" onclick={closeDialog} aria-label="Fechar">
          <X size={24} />
        </button>
      </div>

      <div class="dialog-content">
        <div class="product-image-container">
          {#if hasValidImage(product)}
            <img 
              src={productsService.getProductImage(product)} 
              alt={product.name}
              class="product-image"
            />
          {:else}
            <div class="no-image-placeholder">
              <ImageOff size={48} />
              <span>Imagem não disponível</span>
            </div>
          {/if}
        </div>

        <div class="product-details">
          <div class="product-description">
            <h3>Descrição</h3>
            <p>{product.description || 'Nenhuma descrição disponível.'}</p>
          </div>

          <div class="product-price-section">
            <div class="price-display">
              <span class="price-label">Preço:</span>
              <span class="price-value">{productsService.formatPrice(product.price)}</span>
            </div>
          </div>

          {#if product.expiration}
            <div class="product-expiration">
              <span class="expiration-label">Validade:</span>
              <span class="expiration-value">{product.expiration}</span>
            </div>
          {/if}

          {#if product.amount > 0}
            <div class="product-stock">
              <span class="stock-label">Estoque:</span>
              <span class="stock-value">{product.amount} unidades</span>
            </div>
          {/if}
        </div>
      </div>

      <div class="dialog-footer">
        <button 
          class="add-to-cart-button"
          onclick={addToCart}
          disabled={isAddingToCart || product.amount === 0}
        >
          {#if isAddingToCart}
            <div class="loading-spinner"></div>
            Adicionando...
          {:else}
            <Plus size={20} />
            Adicionar ao Carrinho
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .dialog-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .dialog-container {
    background: white;
    border-radius: var(--radius-lg, 12px);
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    animation: dialogSlideIn 0.3s ease-out;
  }

  @keyframes dialogSlideIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border, #e2e8f0);
  }

  .dialog-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--foreground, #1e293b);
    margin: 0;
  }

  .close-button {
    background: transparent;
    border: none;
    color: var(--muted-foreground, #64748b);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: var(--radius, 8px);
    transition: all 0.2s ease;
  }

  .close-button:hover {
    background: var(--muted, #f1f5f9);
    color: var(--foreground, #1e293b);
  }

  .dialog-content {
    padding: 1.5rem;
    overflow-y: auto;
    max-height: 60vh;
  }

  .product-image-container {
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .product-image {
    width: 100%;
    max-width: 360px;
    height: 240px;
    object-fit: contain;
    border-radius: var(--radius, 8px);
    box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
    background: transparent;
  }

  .no-image-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 360px;
    height: 240px;
    color: var(--muted-foreground, #64748b);
    text-align: center;
    padding: 1rem;
    border: 2px dashed var(--border, #e2e8f0);
    border-radius: var(--radius, 8px);
    background: var(--muted, #f8fafc);
  }

  .no-image-placeholder span {
    font-size: 1rem;
    margin-top: 0.75rem;
    font-weight: 500;
  }

  .product-details {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .product-description h3 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--foreground, #1e293b);
    margin: 0 0 0.5rem 0;
  }

  .product-description p {
    color: var(--muted-foreground, #64748b);
    line-height: 1.5;
    margin: 0;
  }

  .product-price-section {
    padding: 1rem;
    background: var(--accent, #fef3c7);
    border-radius: var(--radius, 8px);
  }

  .price-display {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .price-label {
    font-weight: 500;
    color: var(--foreground, #1e293b);
  }

  .price-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary, #0081a7);
  }

  .product-expiration,
  .product-stock {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border, #e2e8f0);
  }

  .product-stock:last-child {
    border-bottom: none;
  }

  .expiration-label,
  .stock-label {
    font-weight: 500;
    color: var(--muted-foreground, #64748b);
  }

  .expiration-value,
  .stock-value {
    font-weight: 600;
    color: var(--foreground, #1e293b);
  }

  .dialog-footer {
    padding: 1.5rem;
    border-top: 1px solid var(--border, #e2e8f0);
  }

  .add-to-cart-button {
    width: 100%;
    background: var(--primary, #0081a7);
    color: white;
    border: none;
    padding: 1rem;
    border-radius: var(--radius-lg, 12px);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 48px;
  }

  .add-to-cart-button:hover:not(:disabled) {
    background: var(--bittersweet, #f07167);
    transform: translateY(-1px);
  }

  .add-to-cart-button:disabled {
    background: var(--muted, #e2e8f0);
    color: var(--muted-foreground, #64748b);
    cursor: not-allowed;
    transform: none;
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .dialog-backdrop {
      padding: 0.5rem;
    }

    .dialog-container {
      max-height: 95vh;
    }

    .dialog-header,
    .dialog-content,
    .dialog-footer {
      padding: 1rem;
    }

    .product-image {
      height: 180px;
    }

    .no-image-placeholder {
      height: 180px;
    }
  }
</style>
