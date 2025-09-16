<script lang="ts">
  import { onMount } from 'svelte';
  import PaymentSuccess from '$lib/components/checkout/payments/PaymentSuccess.svelte';

  // Test data for payment success
  let paymentResult = {
    receipt: {
      transactionId: 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      timestamp: new Date().toISOString(),
      paymentMethod: 'PIX',
      total: 25.50,
      items: [
        { name: 'Produto A', quantity: 2, price: 10.00 },
        { name: 'Produto B', quantity: 1, price: 5.50 }
      ]
    }
  };

  let deliverySteps = [
    {
      id: 1,
      title: 'Pagamento Confirmado',
      description: 'Transação aprovada com sucesso',
      status: 'completed'
    },
    {
      id: 2,
      title: 'Separando Produtos',
      description: 'Seus produtos estão sendo preparados',
      status: 'active'
    },
    {
      id: 3,
      title: 'Entregando',
      description: 'Produtos sendo liberados para entrega',
      status: 'pending'
    },
    {
      id: 4,
      title: 'Entrega Concluída',
      description: 'Retire seus produtos no compartimento',
      status: 'pending'
    }
  ];

  let currentStepIndex = 1;
  let isAnimating = false;

  onMount(() => {
    // Simulate delivery progress
    const interval = setInterval(() => {
      if (currentStepIndex < deliverySteps.length - 1) {
        currentStepIndex++;
        updateDeliverySteps();
      } else {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  });

  function updateDeliverySteps() {
    deliverySteps = deliverySteps.map((step, index) => ({
      ...step,
      status: index < currentStepIndex ? 'completed' : 
              index === currentStepIndex ? 'active' : 'pending'
    }));
  }

  function resetSteps() {
    currentStepIndex = 1;
    updateDeliverySteps();
  }

  function completeAllSteps() {
    currentStepIndex = deliverySteps.length - 1;
    updateDeliverySteps();
  }

  function changePaymentMethod(method: string) {
    paymentResult = {
      ...paymentResult,
      receipt: {
        ...paymentResult.receipt,
        paymentMethod: method
      }
    };
  }

  function changeAmount(amount: number) {
    paymentResult = {
      ...paymentResult,
      receipt: {
        ...paymentResult.receipt,
        total: amount
      }
    };
  }

  function generateNewTransaction() {
    paymentResult = {
      receipt: {
        transactionId: 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        timestamp: new Date().toISOString(),
        paymentMethod: paymentResult.receipt.paymentMethod,
        total: paymentResult.receipt.total,
        items: paymentResult.receipt.items
      }
    };
  }
</script>

<svelte:head>
  <title>Payment Success Test - InoBag Sales</title>
</svelte:head>

<div class="test-page">
  <div class="test-header">
    <h1>Payment Success Test Page</h1>
    <p>This page allows you to test and adjust the "Pagamento aprovado" screen</p>
    
    <div class="test-controls">
      <div class="control-group">
        <label>Payment Method:</label>
        <select on:change={(e) => changePaymentMethod(e.target.value)}>
          <option value="PIX">PIX</option>
          <option value="Cartão de Crédito">Cartão de Crédito</option>
          <option value="Cartão de Débito">Cartão de Débito</option>
        </select>
      </div>
      
      <div class="control-group">
        <label>Amount:</label>
        <input 
          type="number" 
          step="0.01" 
          bind:value={paymentResult.receipt.total}
          on:input={(e) => changeAmount(parseFloat(e.target.value))}
        />
      </div>
      
      <button on:click={generateNewTransaction}>New Transaction</button>
      <button on:click={resetSteps}>Reset Steps</button>
      <button on:click={completeAllSteps}>Complete All</button>
    </div>
  </div>

  <div class="test-content">
    <PaymentSuccess 
      {paymentResult}
      {deliverySteps}
    />
  </div>

  <div class="test-info">
    <h3>Test Information:</h3>
    <ul>
      <li><strong>Transaction ID:</strong> {paymentResult.receipt.transactionId}</li>
      <li><strong>Payment Method:</strong> {paymentResult.receipt.paymentMethod}</li>
      <li><strong>Amount:</strong> R$ {paymentResult.receipt.total.toFixed(2)}</li>
      <li><strong>Current Step:</strong> {currentStepIndex + 1} of {deliverySteps.length}</li>
      <li><strong>Active Step:</strong> {deliverySteps.find(step => step.status === 'active')?.title || 'None'}</li>
    </ul>
    
    <h4>Delivery Steps Status:</h4>
    <div class="steps-status">
      {#each deliverySteps as step, index}
        <div class="step-status" class:completed={step.status === 'completed'} class:active={step.status === 'active'}>
          <span class="step-number">{index + 1}</span>
          <span class="step-title">{step.title}</span>
          <span class="step-status-badge">{step.status}</span>
        </div>
      {/each}
    </div>
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
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
    align-items: center;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    align-items: center;
  }

  .control-group label {
    font-size: 0.875rem;
    color: var(--muted-foreground);
    font-weight: 500;
  }

  .control-group select,
  .control-group input {
    padding: 0.5rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--background);
    color: var(--foreground);
    font-size: 0.875rem;
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

  .test-info h3,
  .test-info h4 {
    margin: 0 0 0.5rem 0;
    color: var(--foreground);
    font-size: 1rem;
  }

  .test-info ul {
    margin: 0 0 1rem 0;
    padding-left: 1rem;
    color: var(--muted-foreground);
  }

  .test-info li {
    margin-bottom: 0.25rem;
  }

  .steps-status {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .step-status {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    border-radius: var(--radius);
    background: var(--muted);
    font-size: 0.875rem;
  }

  .step-status.completed {
    background: rgba(16, 185, 129, 0.1);
    color: var(--success);
  }

  .step-status.active {
    background: rgba(0, 129, 167, 0.1);
    color: var(--primary);
  }

  .step-number {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--muted-foreground);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: bold;
    flex-shrink: 0;
  }

  .step-status.completed .step-number {
    background: var(--success);
  }

  .step-status.active .step-number {
    background: var(--primary);
  }

  .step-title {
    flex: 1;
    font-weight: 500;
  }

  .step-status-badge {
    font-size: 0.75rem;
    text-transform: uppercase;
    font-weight: 600;
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
    
    .control-group {
      width: 100%;
      max-width: 200px;
    }
    
    .test-controls button {
      width: 200px;
    }
  }
</style>
