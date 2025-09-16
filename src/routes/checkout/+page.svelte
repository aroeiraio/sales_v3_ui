<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { cartService } from '$lib/services/cart';

  onMount(async () => {
    try {
      // Check if cart has items
      const cart = await cartService.getCart();
      
      if (!cart.items || cart.items.length === 0) {
        // No items in cart, redirect to products
        console.log('Checkout: No items in cart, redirecting to products');
        goto('/');
        return;
      }

      // Redirect to new payment system
      console.log('Checkout: Redirecting to new payment system');
      goto('/payment/method-selection');
    } catch (error) {
      console.error('Checkout: Error loading cart, redirecting to products:', error);
      goto('/');
    }
  });
</script>

<svelte:head>
  <title>Redirecionando... - InoBag Sales</title>
</svelte:head>

<div class="redirect-page">
  <div class="redirect-container">
    <div class="loading-spinner"></div>
    <h2>Redirecionando para o pagamento...</h2>
    <p>Aguarde um momento.</p>
  </div>
</div>

<style>
  .redirect-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 80vh;
    padding: 2rem;
  }

  .redirect-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.5rem;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--border);
    border-top: 4px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  h2 {
    color: var(--foreground);
    margin: 0;
    font-size: 1.5rem;
  }

  p {
    color: var(--muted-foreground);
    margin: 0;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>