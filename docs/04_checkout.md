<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>POS System - Checkout V1</title>
    <style>
:root {
  /* Base colors from provided palette */
  --background: var(--light-yellow);
  --foreground: #2C3E50;
  
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
  --popover: #FFFFFF;
  --popover-foreground: #1E293B;
  --destructive: var(--bittersweet);
  --destructive-foreground: #FFFFFF;
  --border: #E2E8F0;
  --input: #F1F5F9;
  --ring: var(--cerulean);
  
  /* Status Colors */
  --success: #10B981;
  --warning: #F59E0B;
  --error: var(--bittersweet);
  
  /* Data Visualization */
  --chart-1: var(--cerulean);
  --chart-2: var(--verdigris);
  --chart-3: var(--bittersweet);
  --chart-4: var(--light-orange);
  --chart-5: var(--light-yellow);
  
  /* Navigation */
  --sidebar: #FFFFFF;
  --sidebar-foreground: #1E293B;
  --sidebar-muted: #64748B;
  --sidebar-accent: var(--light-orange);
  
  /* Typography */
  --font-sans: 'Plus Jakarta Sans', sans-serif;
  --font-serif: 'Playfair Display', serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Spacing & Layout */
  --radius: 1rem;
  --radius-sm: 0.75rem;
  --radius-md: 1rem;
  --radius-lg: 1.25rem;
  --radius-xl: 1.5rem;
  
  /* Shadows */
  --shadow-xs: 0px 1px 2px rgba(16, 24, 40, 0.05);
  --shadow-sm: 0px 2px 4px rgba(16, 24, 40, 0.05);
  --shadow: 0px 4px 6px -1px rgba(16, 24, 40, 0.05);
  --shadow-md: 0px 6px 8px rgba(16, 24, 40, 0.05);
  --shadow-lg: 0px 8px 16px rgba(16, 24, 40, 0.05);
  --shadow-xl: 0px 12px 24px rgba(16, 24, 40, 0.05);
  
  /* Touch Targets */
  --touch-target: 2.75rem;  /* 44px */
  --spacing: 1rem;
}
</style>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
    <style>
        /* Base styles from original */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: var(--font-sans);
            -webkit-tap-highlight-color: transparent;
        }

        body {
            background: var(--background);
            color: var(--foreground);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        /* Header styles */
        .header {
            background: var(--primary);
            color: var(--primary-foreground);
            position: sticky;
            top: 0;
            z-index: 10;
        }

        .header-top {
            background: rgba(0, 0, 0, 0.1);
            padding: 0.5rem 2rem;
            font-size: 0.875rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .header-main {
            padding: 1rem 2rem;
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .back-button {
            background: transparent;
            border: none;
            color: var(--primary-foreground);
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem;
            cursor: pointer;
            font-weight: 500;
            border-radius: var(--radius);
            transition: all 0.2s ease;
        }

        .back-button:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .page-title {
            font-size: 1.25rem;
            font-weight: 600;
        }

        /* Main content */
        .main-content {
            flex: 1;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 2rem;
        }

        /* Section styles */
        .section {
            background: var(--card);
            border-radius: var(--radius-lg);
            padding: 2rem;
            border: 1px solid var(--border);
        }

        .section-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            color: var(--foreground);
        }

        /* Payment methods */
        .payment-methods {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 1rem;
        }

        .payment-method {
            background: var(--background);
            border: 2px solid var(--border);
            border-radius: var(--radius);
            padding: 1.5rem;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .payment-method:hover {
            border-color: var(--primary);
            transform: translateY(-2px);
            box-shadow: var(--shadow-sm);
        }

        .payment-method.selected {
            border-color: var(--primary);
            background: var(--primary);
            color: var(--primary-foreground);
        }

        .payment-method i {
            width: 24px;
            height: 24px;
        }

        .payment-method-info {
            flex: 1;
        }

        .payment-method-name {
            font-weight: 600;
            margin-bottom: 0.25rem;
        }

        .payment-method-description {
            font-size: 0.875rem;
            opacity: 0.8;
        }

        /* Summary section */
        .summary-items {
            margin-bottom: 1.5rem;
        }

        .summary-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.75rem;
            padding-bottom: 0.75rem;
            border-bottom: 1px solid var(--border);
        }

        .item-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .item-quantity {
            background: var(--muted);
            color: var(--muted-foreground);
            padding: 0.25rem 0.5rem;
            border-radius: var(--radius);
            font-size: 0.875rem;
        }

        .item-price {
            font-weight: 500;
        }

        .summary-totals {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            color: var(--muted-foreground);
        }

        .summary-row.total {
            font-weight: 700;
            font-size: 1.25rem;
            margin-top: 0.5rem;
            padding-top: 1rem;
            border-top: 1px solid var(--border);
            color: var(--foreground);
        }

        /* Payment processing */
        .payment-status {
            text-align: center;
            padding: 2rem;
            display: none;
        }

        .payment-status.active {
            display: block;
        }

        .status-icon {
            width: 64px;
            height: 64px;
            margin: 0 auto 1rem;
            color: var(--primary);
        }

        .status-message {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: var(--foreground);
        }

        .status-description {
            color: var(--muted-foreground);
        }

        /* Processing animation */
        .processing-animation {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            margin-top: 1.5rem;
        }

        .processing-dot {
            width: 8px;
            height: 8px;
            background: var(--primary);
            border-radius: 50%;
            animation: pulse 1s infinite;
        }

        .processing-dot:nth-child(2) {
            animation-delay: 0.2s;
        }

        .processing-dot:nth-child(3) {
            animation-delay: 0.4s;
        }

        @keyframes pulse {
            0%, 100% {
                transform: scale(0.5);
                opacity: 0.5;
            }
            50% {
                transform: scale(1);
                opacity: 1;
            }
        }

        /* Responsive design */
        @media (max-width: 768px) {
            .header-top,
            .header-main {
                padding-left: 1rem;
                padding-right: 1rem;
            }

            .main-content {
                padding: 1rem;
            }

            .section {
                padding: 1.5rem;
            }

            .payment-methods {
                grid-template-columns: 1fr;
            }
        }

        @media (max-width: 480px) {
            .section {
                padding: 1rem;
            }

            .payment-method {
                padding: 1rem;
            }

            .summary-item {
                flex-direction: column;
                gap: 0.5rem;
            }

            .item-price {
                align-self: flex-end;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="header-top">
            <div class="status-indicator">
                <i data-lucide="wifi-off"></i>
                <span>Modo Offline</span>
            </div>
            <div class="time">12:00</div>
        </div>
        <div class="header-main">
            <button class="back-button">
                <i data-lucide="arrow-left"></i>
                Voltar
            </button>
            <h1 class="page-title">Pagamento</h1>
        </div>
    </header>

    <main class="main-content">
        <section class="section">
            <h2 class="section-title">Escolha a forma de pagamento</h2>
            <div class="payment-methods">
                <div class="payment-method">
                    <i data-lucide="credit-card"></i>
                    <div class="payment-method-info">
                        <div class="payment-method-name">Cartão de Crédito</div>
                        <div class="payment-method-description">Pagamento em até 12x</div>
                    </div>
                </div>

                <div class="payment-method">
                    <i data-lucide="landmark"></i>
                    <div class="payment-method-info">
                        <div class="payment-method-name">Cartão de Débito</div>
                        <div class="payment-method-description">Débito direto em conta</div>
                    </div>
                </div>

                <div class="payment-method">
                    <i data-lucide="qr-code"></i>
                    <div class="payment-method-info">
                        <div class="payment-method-name">PIX</div>
                        <div class="payment-method-description">Pagamento instantâneo</div>
                    </div>
                </div>
            </div>
        </section>

        <section class="section">
            <h2 class="section-title">Resumo do Pedido</h2>
            <div class="summary-items">
                <div class="summary-item">
                    <div class="item-info">
                        <span class="item-quantity">2x</span>
                        <span>Café Expresso</span>
                    </div>
                    <span class="item-price">R$ 10,00</span>
                </div>
                <div class="summary-item">
                    <div class="item-info">
                        <span class="item-quantity">1x</span>
                        <span>Cappuccino</span>
                    </div>
                    <span class="item-price">R$ 7,50</span>
                </div>
            </div>

            <div class="summary-totals">
                <div class="summary-row">
                    <span>Subtotal</span>
                    <span>R$ 17,50</span>
                </div>
                <div class="summary-row">
                    <span>Taxa de serviço</span>
                    <span>R$ 2,00</span>
                </div>
                <div class="summary-row">
                    <span>Desconto</span>
                    <span>- R$ 0,00</span>
                </div>
                <div class="summary-row total">
                    <span>Total</span>
                    <span>R$ 19,50</span>
                </div>
            </div>
        </section>

        <section class="section payment-status">
            <i data-lucide="loader-2" class="status-icon"></i>
            <div class="status-message">Processando pagamento</div>
            <div class="status-description">Por favor, aguarde enquanto processamos seu pagamento</div>
            <div class="processing-animation">
                <div class="processing-dot"></div>
                <div class="processing-dot"></div>
                <div class="processing-dot"></div>
            </div>
        </section>
    </main>

    <script>
        // Initialize Lucide icons
        lucide.createIcons();

        // Update time
        function updateTime() {
            const now = new Date();
            document.querySelector('.time').textContent = now.toLocaleTimeString('pt-BR');
        }
        setInterval(updateTime, 1000);
        updateTime();

        // Payment method selection
        const paymentMethods = document.querySelectorAll('.payment-method');

        paymentMethods.forEach(method => {
            method.addEventListener('click', () => {
                // Remove selected class from all methods
                paymentMethods.forEach(m => m.classList.remove('selected'));
                // Add selected class to clicked method
                method.classList.add('selected');
                // Show processing state after a short delay
                setTimeout(() => {
                    document.querySelector('.payment-status').classList.add('active');
                }, 500);
            });
        });
    </script>
</body>
</html>

Above is the design implementation, please use that as a reference to build a similar UI component. Make sure to follow modern React and TypeScript best practices.
