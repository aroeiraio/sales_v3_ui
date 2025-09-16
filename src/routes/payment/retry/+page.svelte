<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  // Get retry parameters from URL
  $: retryCount = parseInt($page.url.searchParams.get('retryCount') || '1');
  $: maxRetries = 3;
  $: reason = $page.url.searchParams.get('reason') || 'Payment was refused';

  function retry() {
    // Increment retry count and go back to method selection
    goto('/payment/method-selection');
  }

  function cancel() {
    goto('/');
  }

  function selectDifferentMethod() {
    goto('/payment/method-selection');
  }
</script>

<svelte:head>
  <title>Tentar Novamente - InoBag Sales</title>
</svelte:head>

<div class="retry-page">
  <div class="retry-container">
    <div class="retry-header">
      <div class="retry-icon">🔄</div>
      <h1>Vamos tentar novamente?</h1>
      <p class="retry-reason">{reason}</p>
    </div>

    <div class="retry-info">
      <div class="attempt-counter">
        <span class="attempt-text">Tentativa {retryCount} de {maxRetries}</span>
        <div class="attempt-progress">
          {#each Array(maxRetries) as _, i}
            <div class="progress-dot" class:completed={i < retryCount} class:current={i === retryCount - 1}></div>
          {/each}
        </div>
      </div>

      <div class="suggestions">
        <h3>💡 Sugestões:</h3>
        <ul>
          <li>Verifique se seu cartão não está bloqueado</li>
          <li>Confirme se há saldo ou limite disponível</li>
          <li>Tente usar outro cartão</li>
          <li>Para PIX, verifique sua conexão com a internet</li>
        </ul>
      </div>
    </div>

    <div class="retry-actions">
      {#if retryCount < maxRetries}
        <div class="action-group">
          <button class="primary-button" on:click={retry}>
            Tentar com o mesmo método
          </button>
          
          <button class="secondary-button" on:click={selectDifferentMethod}>
            Escolher outro método
          </button>
        </div>
        
        <button class="tertiary-button" on:click={cancel}>
          Cancelar compra
        </button>
      {:else}
        <div class="limit-exceeded">
          <h3>Limite de tentativas atingido</h3>
          <p>Você pode tentar novamente mais tarde ou entrar em contato com nosso suporte.</p>
          
          <div class="final-actions">
            <button class="secondary-button" on:click={selectDifferentMethod}>
              Escolher outro método
            </button>
            
            <button class="tertiary-button" on:click={cancel}>
              Cancelar compra
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .retry-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 80vh;
    padding: 2rem;
  }

  .retry-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    max-width: 600px;
    width: 100%;
    gap: 2rem;
  }

  .retry-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .retry-icon {
    font-size: 4rem;
    animation: rotate 3s ease-in-out infinite;
  }

  .retry-header h1 {
    font-size: 2rem;
    font-weight: 700;
    color: var(--foreground);
    margin: 0;
  }

  .retry-reason {
    color: var(--muted-foreground);
    font-size: 1.125rem;
    margin: 0;
    padding: 0.75rem 1.5rem;
    background: var(--muted);
    border-radius: var(--radius);
    border: 1px solid var(--border);
  }

  .retry-info {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    width: 100%;
  }

  .attempt-counter {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .attempt-text {
    font-size: 1rem;
    font-weight: 600;
    color: var(--foreground);
  }

  .attempt-progress {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .progress-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--border);
    transition: all 0.3s ease;
  }

  .progress-dot.completed {
    background: var(--destructive);
  }

  .progress-dot.current {
    background: var(--primary);
    transform: scale(1.2);
    box-shadow: 0 0 0 3px rgba(0, 129, 167, 0.3);
  }

  .suggestions {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    text-align: left;
  }

  .suggestions h3 {
    color: var(--foreground);
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
  }

  .suggestions ul {
    margin: 0;
    padding-left: 1.5rem;
  }

  .suggestions li {
    color: var(--muted-foreground);
    margin-bottom: 0.5rem;
    line-height: 1.5;
  }

  .retry-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    width: 100%;
  }

  .action-group {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    max-width: 400px;
  }

  .primary-button {
    background: var(--primary);
    color: var(--primary-foreground);
    border: none;
    padding: 1rem 2rem;
    border-radius: var(--radius);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
  }

  .primary-button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .secondary-button {
    background: transparent;
    color: var(--primary);
    border: 2px solid var(--primary);
    padding: 1rem 2rem;
    border-radius: var(--radius);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
  }

  .secondary-button:hover {
    background: var(--primary);
    color: var(--primary-foreground);
  }

  .tertiary-button {
    background: transparent;
    color: var(--muted-foreground);
    border: 1px solid var(--border);
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius);
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .tertiary-button:hover {
    background: var(--muted);
    color: var(--foreground);
  }

  .limit-exceeded {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    text-align: center;
  }

  .limit-exceeded h3 {
    color: var(--destructive);
    margin: 0;
    font-size: 1.25rem;
  }

  .limit-exceeded p {
    color: var(--muted-foreground);
    margin: 0;
    line-height: 1.5;
  }

  .final-actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    max-width: 300px;
    margin-top: 1rem;
  }

  @keyframes rotate {
    0% {
      transform: rotate(0deg);
    }
    25% {
      transform: rotate(90deg);
    }
    50% {
      transform: rotate(180deg);
    }
    75% {
      transform: rotate(270deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 640px) {
    .retry-header h1 {
      font-size: 1.75rem;
    }
    
    .retry-reason {
      font-size: 1rem;
      padding: 0.5rem 1rem;
    }
    
    .retry-icon {
      font-size: 3rem;
    }
    
    .suggestions {
      padding: 1rem;
    }
    
    .action-group {
      max-width: 280px;
    }
  }
</style>