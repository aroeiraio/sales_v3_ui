<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>POS System - Payment Result V1</title>
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

        .page-title {
            font-size: 1.25rem;
            font-weight: 600;
        }

        /* Main content */
        .main-content {
            flex: 1;
            padding: 2rem;
            max-width: 800px;
            margin: 0 auto;
            width: 100%;
        }

        /* Enhanced result card with better alignment */
        .result-card {
            background: var(--card);
            border-radius: var(--radius-lg);
            padding: 3rem 2rem;
            border: 1px solid var(--border);
            margin-bottom: 2rem;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .result-header {
            display: flex;
            align-items: center;
            gap: 1.5rem;
            margin-bottom: 2rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid var(--border);
            width: 100%;
            max-width: 500px;
        }

        .result-icon {
            width: 64px;
            height: 64px;
            flex-shrink: 0;
        }

        .result-icon.success {
            color: var(--success);
        }

        .result-icon.error {
            color: var(--destructive);
        }

        .result-text {
            flex: 1;
        }

        .result-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: var(--foreground);
            line-height: 1.2;
        }

        .result-message {
            font-size: 1rem;
            color: var(--muted-foreground);
            line-height: 1.5;
        }

        /* Transaction details */
        .transaction-details {
            background: var(--card);
            border-radius: var(--radius-lg);
            padding: 2rem;
            border: 1px solid var(--border);
            width: 100%;
        }

        .details-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--border);
        }

        .details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
            margin-bottom: 2rem;
        }

        .detail-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .detail-label {
            font-size: 0.875rem;
            color: var(--muted-foreground);
        }

        .detail-value {
            font-weight: 600;
            color: var(--foreground);
        }

        /* Action buttons */
        .action-buttons {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
        }

        .button {
            flex: 1;
            padding: 1rem;
            border-radius: var(--radius);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            border: none;
            min-height: var(--touch-target);
        }

        .button-primary {
            background: var(--primary);
            color: var(--primary-foreground);
        }

        .button-primary:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
        }

        .button-outline {
            background: transparent;
            border: 2px solid var(--border);
            color: var(--foreground);
        }

        .button-outline:hover {
            background: var(--accent);
            border-color: var(--accent);
        }

        .button-error {
            background: var(--destructive);
            color: white;
        }

        .button-error:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
        }

        /* Status badge */
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border-radius: var(--radius);
            font-weight: 500;
            font-size: 0.875rem;
            margin-bottom: 0.75rem;
        }

        .status-badge.success {
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
        }

        .status-badge.error {
            background: rgba(239, 68, 68, 0.1);
            color: var(--destructive);
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

            .result-card {
                padding: 2rem 1.5rem;
            }

            .result-header {
                flex-direction: column;
                text-align: center;
                gap: 1rem;
            }

            .transaction-details {
                padding: 1.5rem;
            }

            .details-grid {
                grid-template-columns: 1fr;
                gap: 1.5rem;
            }

            .action-buttons {
                flex-direction: column;
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
            <h1 class="page-title">Status do Pagamento</h1>
        </div>
    </header>

    <main class="main-content">
        <!-- Success State (hidden by default) -->
        <div class="result-card" id="successState" style="display: none;">
            <div class="result-header">
                <i data-lucide="check-circle" class="result-icon success"></i>
                <div class="result-text">
                    <div class="status-badge success">
                        <i data-lucide="check"></i>
                        Pagamento Aprovado
                    </div>
                    <h2 class="result-title">Pagamento Realizado com Sucesso!</h2>
                    <p class="result-message">
                        Seu pedido foi confirmado e está sendo preparado.
                    </p>
                </div>
            </div>
        </div>

        <!-- Error State -->
        <div class="result-card" id="errorState">
            <div class="result-header">
                <i data-lucide="x-circle" class="result-icon error"></i>
                <div class="result-text">
                    <div class="status-badge error">
                        <i data-lucide="x"></i>
                        Pagamento Negado
                    </div>
                    <h2 class="result-title">Não foi possível processar o pagamento</h2>
                    <p class="result-message">
                        Houve um problema ao processar seu pagamento. Por favor, tente novamente ou escolha outro método de pagamento.
                    </p>
                </div>
            </div>
        </div>

        <section class="transaction-details">
            <h3 class="details-title">Detalhes da Transação</h3>
            <div class="details-grid">
                <div class="detail-group">
                    <span class="detail-label">Número do Pedido</span>
                    <span class="detail-value">#123456</span>
                </div>
                <div class="detail-group">
                    <span class="detail-label">Data</span>
                    <span class="detail-value">05/09/2024 12:30</span>
                </div>
                <div class="detail-group">
                    <span class="detail-label">Método de Pagamento</span>
                    <span class="detail-value">Cartão de Crédito</span>
                </div>
                <div class="detail-group">
                    <span class="detail-label">Valor Total</span>
                    <span class="detail-value">R$ 19,50</span>
                </div>
            </div>

            <!-- Success Actions -->
            <div class="action-buttons" id="successActions" style="display: none;">
                <button class="button button-primary">
                    <i data-lucide="printer"></i>
                    Imprimir Comprovante
                </button>
                <button class="button button-outline">
                    <i data-lucide="home"></i>
                    Voltar ao Início
                </button>
            </div>

            <!-- Error Actions -->
            <div class="action-buttons" id="errorActions">
                <button class="button button-error">
                    <i data-lucide="refresh-cw"></i>
                    Tentar Novamente
                </button>
                <button class="button button-outline">
                    <i data-lucide="credit-card"></i>
                    Alterar Forma de Pagamento
                </button>
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

        // Demo: Toggle between success and error states
        function toggleState(success) {
            document.getElementById('successState').style.display = success ? 'block' : 'none';
            document.getElementById('errorState').style.display = success ? 'none' : 'block';
            document.getElementById('successActions').style.display = success ? 'flex' : 'none';
            document.getElementById('errorActions').style.display = success ? 'none' : 'flex';
        }

        // Demo: Add click handlers to action buttons
        document.querySelector('.button-error').addEventListener('click', () => {
            // Simulate payment retry
            console.log('Retrying payment...');
        });

        document.querySelector('.button-outline').addEventListener('click', () => {
            // Navigate back to payment method selection
            console.log('Changing payment method...');
        });
    </script>
</body>
</html>

Above is the design implementation, please use that as a reference to build a similar UI component. Make sure to follow modern React and TypeScript best practices.
