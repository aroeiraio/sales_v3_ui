<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { Home, Receipt, Package } from 'lucide-svelte';
  import { paymentService } from '$lib/services/payment';
  import { deliveryService } from '$lib/services/delivery';
  import { cartService } from '$lib/services/cart';
  import { errorDialogService } from '$lib/services/errorDialog';
  
  let isVisible = false;
  let orderNumber = '#' + Math.floor(Math.random() * 900000 + 100000).toString();
  let countdown = 20;
  let countdownInterval: number;

  onMount(() => {
    // Clean up all services to prevent timeout errors and popups
    console.log('End page: Cleaning up all services');
    
    // Stop all polling services
    paymentService.stopPolling();
    deliveryService.stopPolling();
    
    // Clear any error dialogs that might be showing
    try {
      errorDialogService.closeAllDialogs();
    } catch (error) {
      console.warn('Could not close error dialogs:', error);
    }

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
  });

  onDestroy(() => {
    // Cleanup interval on component destroy
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
    
    // Ensure all services are stopped when leaving the end page
    paymentService.stopPolling();
    deliveryService.stopPolling();
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
          <!-- Confetti particles -->
          <div class="confetti-container">
            {#each Array(12) as _, i}
              <div class="confetti confetti-{i}" style="--delay: {i * 0.1}s"></div>
            {/each}
          </div>
          
          <!-- Success glow effect -->
          <div class="success-glow"></div>
          
          <!-- Package delivery animation -->
          <div class="package-container">
            <div class="package-pulse"></div>
            <div class="package-background"></div>
            <div class="package-icon-wrapper">
              <Package size={64} class="package-icon" strokeWidth={2.5} color="white" stroke="white" />
            </div>
            <div class="delivery-checkmark">✓</div>
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
    width: 160px;
    height: 160px;
    margin: 0 auto 2.5rem;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .confetti-container {
    position: absolute;
    width: 200px;
    height: 200px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 1;
  }

  .confetti {
    position: absolute;
    width: 8px;
    height: 8px;
    background: var(--primary);
    border-radius: 2px;
    opacity: 0;
  }

  .success-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%);
    opacity: 0;
    z-index: 2;
  }

  .package-container {
    width: 120px;
    height: 120px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    z-index: 5;
  }

  .package-pulse {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 120px;
    height: 120px;
    border: 3px solid var(--success);
    border-radius: 24px;
    opacity: 0;
    z-index: 3;
  }

  .delivery-checkmark {
    position: absolute;
    top: -10px;
    right: -10px;
    width: 40px;
    height: 40px;
    background: var(--success);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
    font-weight: bold;
    transform: scale(0);
    z-index: 15;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
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

  .success-animation.visible .success-glow {
    animation: glow-appear 0.8s ease-out 0.2s forwards;
  }

  .success-animation.visible .confetti {
    animation: confetti-burst 1.5s ease-out forwards;
  }

  .success-animation.visible .package-background {
    animation: package-background-appear 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.3s forwards;
  }

  .success-animation.visible .package-pulse {
    animation: package-pulse-effect 2s ease-out 1s infinite;
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
    animation: package-icon-appear 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.9s forwards;
  }

  .success-animation.visible .delivery-checkmark {
    animation: checkmark-appear 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) 1.4s forwards;
  }

  @keyframes glow-appear {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.8);
    }
    50% {
      opacity: 0.8;
      transform: translate(-50%, -50%) scale(1.1);
    }
    100% {
      opacity: 0.4;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  @keyframes confetti-burst {
    0% {
      opacity: 0;
      transform: translateY(0) rotate(0deg) scale(0);
    }
    10% {
      opacity: 1;
      transform: translateY(-20px) rotate(90deg) scale(1);
    }
    100% {
      opacity: 0;
      transform: translateY(-100px) rotate(180deg) scale(0.5);
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

  @keyframes package-pulse-effect {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(1);
    }
    50% {
      opacity: 0.6;
      transform: translate(-50%, -50%) scale(1.1);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(1.2);
    }
  }

  @keyframes checkmark-appear {
    0% {
      opacity: 0;
      transform: scale(0) rotate(-180deg);
    }
    50% {
      opacity: 1;
      transform: scale(1.3) rotate(-90deg);
    }
    100% {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }
  }

  /* Individual confetti positioning */
  .confetti-0 { top: 20%; left: 30%; background: var(--primary); animation-delay: calc(var(--delay) + 0.1s); }
  .confetti-1 { top: 15%; left: 70%; background: var(--secondary); animation-delay: calc(var(--delay) + 0.2s); }
  .confetti-2 { top: 25%; left: 10%; background: var(--accent); animation-delay: calc(var(--delay) + 0.15s); }
  .confetti-3 { top: 30%; left: 80%; background: var(--success); animation-delay: calc(var(--delay) + 0.25s); }
  .confetti-4 { top: 10%; left: 50%; background: var(--primary); animation-delay: calc(var(--delay) + 0.3s); }
  .confetti-5 { top: 35%; left: 20%; background: var(--secondary); animation-delay: calc(var(--delay) + 0.35s); }
  .confetti-6 { top: 40%; left: 60%; background: var(--accent); animation-delay: calc(var(--delay) + 0.4s); }
  .confetti-7 { top: 45%; left: 40%; background: var(--success); animation-delay: calc(var(--delay) + 0.45s); }
  .confetti-8 { top: 20%; left: 90%; background: var(--primary); animation-delay: calc(var(--delay) + 0.5s); }
  .confetti-9 { top: 50%; left: 15%; background: var(--secondary); animation-delay: calc(var(--delay) + 0.55s); }
  .confetti-10 { top: 55%; left: 75%; background: var(--accent); animation-delay: calc(var(--delay) + 0.6s); }
  .confetti-11 { top: 60%; left: 45%; background: var(--success); animation-delay: calc(var(--delay) + 0.65s); }

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