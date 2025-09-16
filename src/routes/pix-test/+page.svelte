<script lang="ts">
  import { onMount } from 'svelte';
  import PixDisplay from '$lib/components/payment/PixDisplay.svelte';

  // Test data for PIX display
  let paymentResult = {
    qrcode_source: '/api/test-qrcode.png', // This will show the placeholder
    session: 'test-session-123',
    amount: 25.50
  };

  let cart = {
    total: 25.50
  };

  let countdown = 60;
  let countdownInterval: NodeJS.Timeout | null = null;

  onMount(() => {
    // Start countdown for testing
    countdownInterval = setInterval(() => {
      countdown = countdown - 1;
      if (countdown <= 0) {
        countdown = 60; // Reset for continuous testing
      }
    }, 1000);

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  });

  function showInstructions() {
    alert('Instructions button clicked! This would normally show PIX payment instructions.');
  }

  function cancelPayment() {
    alert('Cancel button clicked! This would normally cancel the payment and go back.');
  }
</script>

<svelte:head>
  <title>PIX Layout Test - InoBag Sales</title>
</svelte:head>

<div class="test-page">
  <div class="test-header">
    <h1>PIX Layout Test Page</h1>
    <p>This page allows you to test and adjust the PIX payment layout</p>
    <div class="test-controls">
      <button on:click={() => countdown = 60}>Reset Timer</button>
      <button on:click={() => cart.total = Math.random() * 100}>Random Amount</button>
      <button on:click={() => paymentResult.qrcode_source = paymentResult.qrcode_source ? null : '/api/test-qrcode.png'}>
        Toggle QR Code
      </button>
    </div>
  </div>

  <div class="test-content">
    <PixDisplay 
      {paymentResult}
      {cart}
      {countdown}
      onShowInstructions={showInstructions}
      onCancel={cancelPayment}
    />
  </div>

  <div class="test-info">
    <h3>Test Information:</h3>
    <ul>
      <li><strong>Current Amount:</strong> R$ {cart.total.toFixed(2)}</li>
      <li><strong>Countdown:</strong> {countdown}s</li>
      <li><strong>QR Code:</strong> {paymentResult.qrcode_source ? 'Showing' : 'Placeholder'}</li>
      <li><strong>Session:</strong> {paymentResult.session}</li>
    </ul>
  </div>
</div>

<style>
  .test-page {
    min-height: 100vh;
    background: var(--background);
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .test-header {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    text-align: center;
  }

  .test-header h1 {
    margin: 0 0 0.5rem 0;
    color: var(--foreground);
    font-size: 1.5rem;
  }

  .test-header p {
    margin: 0 0 1rem 0;
    color: var(--muted-foreground);
  }

  .test-controls {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .test-controls button {
    background: var(--primary);
    color: var(--primary-foreground);
    border: none;
    padding: 0.5rem 1rem;
    border-radius: var(--radius);
    font-size: 0.875rem;
    cursor: pointer;
    transition: opacity 0.2s ease;
  }

  .test-controls button:hover {
    opacity: 0.9;
  }

  .test-content {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 1rem 0;
  }

  .test-info {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 1rem;
    margin-top: auto;
  }

  .test-info h3 {
    margin: 0 0 0.5rem 0;
    color: var(--foreground);
    font-size: 1rem;
  }

  .test-info ul {
    margin: 0;
    padding-left: 1rem;
    color: var(--muted-foreground);
  }

  .test-info li {
    margin-bottom: 0.25rem;
  }

  @media (max-width: 768px) {
    .test-page {
      padding: 0.5rem;
    }
    
    .test-header {
      padding: 1rem;
    }
    
    .test-controls {
      flex-direction: column;
      align-items: center;
    }
    
    .test-controls button {
      width: 200px;
    }
  }
</style>
