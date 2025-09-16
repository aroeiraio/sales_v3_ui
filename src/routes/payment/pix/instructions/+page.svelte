<script lang="ts">
  import { goto } from '$app/navigation';

  const pixSteps = [
    {
      number: 1,
      title: 'Abra seu aplicativo bancário',
      description: 'Abra o app do seu banco ou carteira digital'
    },
    {
      number: 2,
      title: 'Encontre a opção PIX',
      description: 'Procure pela opção "PIX" no menu principal'
    },
    {
      number: 3,
      title: 'Escaneie o QR Code',
      description: 'Use a câmera do celular para escanear o código'
    },
    {
      number: 4,
      title: 'Confirme os dados',
      description: 'Verifique o valor e confirme o pagamento'
    },
    {
      number: 5,
      title: 'Autorize o pagamento',
      description: 'Use sua senha, digital ou FaceID'
    }
  ];

  function goBack() {
    goto('/payment/pix');
  }
</script>

<svelte:head>
  <title>Como Pagar com PIX - InoBag Sales</title>
</svelte:head>

<div class="instructions-page">
  <div class="instructions-header">
    <button class="back-btn" on:click={goBack}>
      ← Voltar ao QR Code
    </button>
    <h1>Como pagar com PIX</h1>
    <p>Siga os passos abaixo para completar seu pagamento</p>
  </div>

  <div class="instructions-content">
    <div class="steps-container">
      {#each pixSteps as step}
        <div class="instruction-step">
          <div class="step-number">{step.number}</div>
          <div class="step-content">
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </div>
        </div>
      {/each}
    </div>

    <div class="tips-section">
      <h3>💡 Dicas importantes:</h3>
      <ul>
        <li>Certifique-se de que seu celular tem acesso à internet</li>
        <li>Verifique se o app do seu banco está atualizado</li>
        <li>O pagamento é instantâneo - você receberá a confirmação imediatamente</li>
        <li>Mantenha a tela do QR Code aberta até finalizar o pagamento</li>
      </ul>
    </div>

    <div class="bank-apps">
      <h3>📱 Principais bancos com PIX:</h3>
      <div class="bank-grid">
        <div class="bank-item">Banco do Brasil</div>
        <div class="bank-item">Bradesco</div>
        <div class="bank-item">Itaú</div>
        <div class="bank-item">Santander</div>
        <div class="bank-item">Caixa</div>
        <div class="bank-item">Nubank</div>
        <div class="bank-item">Inter</div>
        <div class="bank-item">PicPay</div>
      </div>
    </div>
  </div>

  <div class="instructions-footer">
    <button class="primary-button" on:click={goBack}>
      Voltar ao Pagamento
    </button>
  </div>
</div>

<style>
  .instructions-page {
    max-width: 700px;
    margin: 0 auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .instructions-header {
    text-align: center;
    position: relative;
  }

  .back-btn {
    position: absolute;
    left: 0;
    top: 0;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--muted-foreground);
    padding: 0.5rem 1rem;
    border-radius: var(--radius);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
  }

  .back-btn:hover {
    background: var(--muted);
    color: var(--foreground);
  }

  .instructions-header h1 {
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary);
    margin: 0 0 0.5rem 0;
  }

  .instructions-header p {
    color: var(--muted-foreground);
    font-size: 1.125rem;
    margin: 0;
  }

  .instructions-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .steps-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .instruction-step {
    display: flex;
    gap: 1rem;
    padding: 1.5rem;
    background: var(--card);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    transition: all 0.2s ease;
  }

  .instruction-step:hover {
    border-color: var(--primary);
    box-shadow: var(--shadow-sm);
  }

  .step-number {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    background: var(--primary);
    color: var(--primary-foreground);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1.125rem;
  }

  .step-content {
    flex: 1;
  }

  .step-content h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--foreground);
    margin: 0 0 0.5rem 0;
  }

  .step-content p {
    color: var(--muted-foreground);
    margin: 0;
    line-height: 1.5;
  }

  .tips-section,
  .bank-apps {
    background: var(--muted);
    padding: 1.5rem;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
  }

  .tips-section h3,
  .bank-apps h3 {
    color: var(--foreground);
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
  }

  .tips-section ul {
    margin: 0;
    padding-left: 1.5rem;
  }

  .tips-section li {
    color: var(--muted-foreground);
    margin-bottom: 0.5rem;
    line-height: 1.5;
  }

  .bank-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.75rem;
  }

  .bank-item {
    background: var(--card);
    padding: 0.75rem;
    border-radius: var(--radius);
    text-align: center;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--foreground);
    border: 1px solid var(--border);
  }

  .instructions-footer {
    text-align: center;
    padding-top: 1rem;
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
    min-width: 250px;
  }

  .primary-button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  @media (max-width: 640px) {
    .instructions-page {
      padding: 0.5rem;
    }
    
    .instructions-header h1 {
      font-size: 1.5rem;
      margin-top: 2rem;
    }
    
    .back-btn {
      position: static;
      margin-bottom: 1rem;
    }
    
    .instruction-step {
      padding: 1rem;
    }
    
    .step-number {
      width: 32px;
      height: 32px;
      font-size: 1rem;
    }
    
    .bank-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .primary-button {
      min-width: 200px;
    }
  }
</style>