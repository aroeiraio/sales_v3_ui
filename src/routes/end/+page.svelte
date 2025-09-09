<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { Home, Receipt, Package } from 'lucide-svelte';
  
  let isVisible = false;
  let orderNumber = '#' + Math.floor(Math.random() * 900000 + 100000).toString();
  let countdown = 10;
  let countdownInterval: NodeJS.Timeout;

  onMount(() => {
    // Animate the checkmark after component mounts
    setTimeout(() => {
      isVisible = true;
    }, 200);

    // Start countdown timer
    countdownInterval = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        goHome();
      }
    }, 1000);

    // Cleanup interval on component destroy
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  });

  function goHome() {
    goto('/');
  }
</script>

<svelte:head>
  <title>Obrigado - InoBag</title>
</svelte:head>

<div class="end-screen">
  <main class="main-content">
    <div class="thank-you-card">
      <div class="background-pattern"></div>
      <div class="content-wrapper">
        <div class="success-animation" class:visible={isVisible}>
          <div class="package-container">
            <div class="package-background"></div>
            <div class="package-icon-wrapper">
              <Package size={64} class="package-icon" strokeWidth={2.5} color="white" stroke="white" />
            </div>
          </div>
        </div>

        <h1 class="thank-you-title">Obrigado pela sua compra!</h1>
        <p class="thank-you-message">
          Esperamos que você aproveite seus produtos.<br>
          Volte sempre!
        </p>

        <div class="order-info">
          <Receipt size={24} class="order-icon" />
          <p class="order-number">
            Número do Pedido: <strong>{orderNumber}</strong>
          </p>
        </div>

        <button class="action-button" onclick={goHome}>
          <Home size={20} />
          Fazer Nova Compra
        </button>
        
        <p class="countdown-text">
          Redirecionando automaticamente em {countdown} segundos
        </p>
      </div>
    </div>
  </main>
</div>

<style>
  :root {
    /* Brand colors */
    --cerulean: #0081a7ff;
    --verdigris: #00afb9ff;
    --light-yellow: #fdfcdcff;
    --light-orange: #fed9b7ff;
    --bittersweet: #f07167ff;
    
    /* Semantic mappings */
    --primary: var(--cerulean);
    --primary-foreground: #FFFFFF;
    --secondary: var(--verdigris);
    --secondary-foreground: #FFFFFF;
    --muted: #E5E5E5;
    --muted-foreground: #64748B;
    --accent: var(--light-orange);
    --accent-foreground: #1E293B;
    
    /* UI Elements */
    --card: #FFFFFF;
    --card-foreground: #1E293B;
    --border: #E2E8F0;
    
    /* Status Colors */
    --success: #10B981;
    
    /* Typography */
    --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    
    /* Spacing & Layout */
    --radius: 1rem;
    --radius-lg: 1.25rem;
    
    /* Shadows */
    --shadow-sm: 0px 2px 4px rgba(16, 24, 40, 0.05);
    --shadow-md: 0px 6px 8px rgba(16, 24, 40, 0.05);
    --shadow-lg: 0px 8px 16px rgba(16, 24, 40, 0.05);
    
    /* Touch Targets */
    --touch-target: 2.75rem;
    --spacing: 1rem;
  }

  .end-screen {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--light-yellow, #fdfcdcff);
    color: var(--card-foreground, #1E293B);
    font-family: var(--font-sans);
  }

  .main-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: linear-gradient(
      135deg,
      var(--light-yellow, #fdfcdcff) 0%,
      var(--accent, #fed9b7ff) 100%
    );
  }

  .thank-you-card {
    background: var(--card, #FFFFFF);
    border-radius: var(--radius-lg, 1.25rem);
    padding: 4rem 3rem;
    text-align: center;
    max-width: 600px;
    width: 100%;
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-lg);
  }

  .background-pattern {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0.03;
    pointer-events: none;
    background: 
      radial-gradient(circle at 0% 0%, var(--primary) 1px, transparent 1px),
      radial-gradient(circle at 100% 100%, var(--primary) 1px, transparent 1px);
    background-size: 24px 24px;
    background-position: 0 0, 12px 12px;
  }

  .content-wrapper {
    position: relative;
    z-index: 1;
  }

  .success-animation {
    width: 120px;
    height: 120px;
    margin: 0 auto 2.5rem;
    position: relative;
  }

  .package-container {
    width: 120px;
    height: 120px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
  }

  .package-background {
    width: 120px;
    height: 120px;
    border-radius: 24px;
    background: linear-gradient(135deg, var(--primary, #0081a7) 0%, var(--secondary, #00afb9) 100%);
    position: absolute;
    top: 0;
    left: 0;
    transform: scale(0) rotate(-10deg);
    box-shadow: 0 8px 24px rgba(0, 129, 167, 0.3);
    border: 2px solid rgba(255, 255, 255, 0.2);
    z-index: 5;
  }

  .success-animation.visible .package-background {
    animation: package-background-appear 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
  }

  .package-icon-wrapper {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0) rotate(15deg);
    opacity: 0;
    z-index: 10;
  }

  .package-icon {
    color: white !important;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  .package-icon :global(svg) {
    color: white !important;
    stroke: white !important;
    fill: white !important;
  }

  .package-icon :global(svg path) {
    stroke: white !important;
    fill: white !important;
  }

  .success-animation.visible .package-icon-wrapper {
    animation: package-icon-appear 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.7s forwards;
  }

  @keyframes circle-scale {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes package-background-appear {
    0% {
      opacity: 0;
      transform: scale(0) rotate(-10deg);
    }
    50% {
      opacity: 1;
      transform: scale(1.1) rotate(-5deg);
    }
    100% {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }
  }

  @keyframes package-icon-appear {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0) rotate(15deg);
    }
    50% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.3) rotate(5deg);
    }
    100% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1) rotate(0deg);
    }
  }

  @keyframes scale {
    0%, 100% {
      transform: none;
    }
    50% {
      transform: scale3d(1.1, 1.1, 1);
    }
  }

  @keyframes fill {
    100% {
      box-shadow: inset 0px 0px 0px 60px var(--success, #10B981);
    }
  }

  .thank-you-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: var(--card-foreground, #1E293B);
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  .thank-you-message {
    font-size: 1.25rem;
    color: var(--muted-foreground, #64748B);
    margin-bottom: 2.5rem;
    line-height: 1.6;
  }

  .order-info {
    background: var(--light-yellow, #fdfcdcff);
    padding: 1.5rem;
    border-radius: var(--radius, 1rem);
    margin-bottom: 2.5rem;
    border: 1px solid var(--border, #E2E8F0);
    display: inline-flex;
    align-items: center;
    gap: 1rem;
  }

  .order-icon {
    color: var(--primary, #0081a7ff);
  }

  .order-number {
    font-size: 1.125rem;
    color: var(--muted-foreground, #64748B);
  }

  .order-number strong {
    color: var(--card-foreground, #1E293B);
    font-weight: 600;
  }

  .action-button {
    background: var(--primary, #0081a7ff);
    color: var(--primary-foreground, #FFFFFF);
    padding: 1.25rem 2.5rem;
    border-radius: var(--radius, 1rem);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    min-height: var(--touch-target, 2.75rem);
    font-size: 1.125rem;
    border: none;
    box-shadow: var(--shadow-sm);
  }

  .action-button:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .action-button:active {
    transform: translateY(0);
  }

  .countdown-text {
    font-size: 1rem;
    color: var(--muted-foreground, #64748B);
    margin-top: 1.5rem;
    text-align: center;
    font-weight: 500;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .main-content {
      padding: 1rem;
    }

    .thank-you-card {
      padding: 3rem 2rem;
    }

    .thank-you-title {
      font-size: 2rem;
    }

    .thank-you-message {
      font-size: 1.125rem;
    }

    .success-animation {
      width: 100px;
      height: 100px;
      margin-bottom: 2rem;
    }

    .order-info {
      padding: 1.25rem;
      margin-bottom: 2rem;
    }
  }

  @media (max-width: 480px) {
    .thank-you-card {
      padding: 2.5rem 1.5rem;
    }

    .thank-you-title {
      font-size: 1.75rem;
    }

    .thank-you-message {
      font-size: 1rem;
    }

    .action-button {
      width: 100%;
      padding: 1rem 2rem;
    }
  }
</style>