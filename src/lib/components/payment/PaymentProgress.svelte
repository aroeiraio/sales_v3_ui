<script lang="ts">
  export let currentStep: number = 1;

  const steps = [
    { id: 1, title: 'Método', description: 'Escolha o método de pagamento' },
    { id: 2, title: 'Processando', description: 'Iniciando pagamento' },
    { id: 3, title: 'Pagamento', description: 'Complete o pagamento' },
    { id: 4, title: 'Concluído', description: 'Pagamento finalizado' }
  ];
</script>

<div class="payment-progress">
  <div class="progress-steps">
    {#each steps as step, index}
      <div class="step" class:active={currentStep >= step.id} class:current={currentStep === step.id}>
        <div class="step-circle">
          {#if currentStep > step.id}
            <span class="check">✓</span>
          {:else}
            <span class="number">{step.id}</span>
          {/if}
        </div>
        <div class="step-content">
          <div class="step-title">{step.title}</div>
          <div class="step-description">{step.description}</div>
        </div>
        
        {#if index < steps.length - 1}
          <div class="step-connector" class:active={currentStep > step.id}></div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .payment-progress {
    background: var(--card);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    border: 1px solid var(--border);
    width: 100%;
    max-width: 800px; /* Match layout container max-width */
    margin: 0 auto;
    box-sizing: border-box;
  }

  .progress-steps {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
  }

  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    flex: 1;
    position: relative;
  }

  .step-circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--muted);
    border: 2px solid var(--border);
    font-weight: 600;
    font-size: 0.875rem;
    transition: all 0.3s ease;
    z-index: 2;
    position: relative;
  }

  .step.active .step-circle {
    background: var(--primary);
    border-color: var(--primary);
    color: var(--primary-foreground);
  }

  .step.current .step-circle {
    box-shadow: 0 0 0 4px rgba(0, 129, 167, 0.2);
  }

  .check {
    font-size: 1rem;
    line-height: 1;
  }

  .number {
    line-height: 1;
  }

  .step-content {
    margin-top: 0.75rem;
    max-width: 120px;
  }

  .step-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--foreground);
    margin-bottom: 0.25rem;
  }

  .step-description {
    font-size: 0.75rem;
    color: var(--muted-foreground);
    line-height: 1.3;
  }

  .step.active .step-title {
    color: var(--primary);
  }

  .step-connector {
    position: absolute;
    top: 20px;
    left: 60%;
    right: -60%;
    height: 2px;
    background: var(--border);
    z-index: 1;
    transition: background-color 0.3s ease;
  }

  .step-connector.active {
    background: var(--primary);
  }

  .step:last-child .step-connector {
    display: none;
  }

  @media (max-width: 640px) {
    .step-content {
      max-width: 80px;
    }
    
    .step-title {
      font-size: 0.75rem;
    }
    
    .step-description {
      font-size: 0.625rem;
    }
    
    .step-circle {
      width: 32px;
      height: 32px;
      font-size: 0.75rem;
    }
    
    .step-connector {
      top: 16px;
    }
  }
</style>