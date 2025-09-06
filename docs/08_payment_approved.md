<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>POS System - Dispensing Products</title>
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
        /* Base styles */
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

        /* Header */
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

        /* Status card */
        .status-card {
            background: var(--card);
            border-radius: var(--radius-lg);
            padding: 3rem 2rem;
            text-align: center;
            border: 1px solid var(--border);
            margin-bottom: 2rem;
        }

        .status-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 1.5rem;
            color: var(--success);
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% {
                transform: scale(1);
                opacity: 1;
            }
            50% {
                transform: scale(1.1);
                opacity: 0.8;
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }

        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border-radius: var(--radius);
            font-weight: 500;
            font-size: 0.875rem;
            margin-bottom: 1.5rem;
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
        }

        .status-title {
            font-size: 1.75rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: var(--foreground);
        }

        .status-message {
            font-size: 1.125rem;
            color: var(--muted-foreground);
            margin-bottom: 2rem;
        }

        /* Progress section */
        .progress-section {
            max-width: 400px;
            margin: 0 auto;
        }

        .progress-steps {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            position: relative;
            padding-left: 2.5rem;
        }

        .progress-steps::before {
            content: '';
            position: absolute;
            left: 12px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: var(--border);
            z-index: 0;
        }

        .progress-step {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            position: relative;
        }

        .step-indicator {
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: var(--card);
            border: 2px solid var(--border);
            position: absolute;
            left: -2.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1;
        }

        .step-indicator i {
            width: 16px;
            height: 16px;
            color: var(--muted-foreground);
        }

        .step-content {
            flex: 1;
            padding-bottom: 1.5rem;
        }

        .step-title {
            font-weight: 600;
            margin-bottom: 0.25rem;
            color: var(--foreground);
        }

        .step-description {
            font-size: 0.875rem;
            color: var(--muted-foreground);
        }

        /* Active step styles */
        .progress-step.active .step-indicator {
            border-color: var(--success);
            background: var(--success);
        }

        .progress-step.active .step-indicator i {
            color: white;
        }

        .progress-step.active .step-title {
            color: var(--success);
        }

        .progress-step.completed .step-indicator {
            border-color: var(--success);
            background: var(--success);
        }

        .progress-step.completed .step-indicator i {
            color: white;
        }

        /* Transaction details */
        .transaction-details {
            background: var(--card);
            border-radius: var(--radius-lg);
            padding: 2rem;
            border: 1px solid var(--border);
            margin-top: 2rem;
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

            .status-card {
                padding: 2rem 1.5rem;
            }

            .transaction-details {
                padding: 1.5rem;
            }

            .details-grid {
                grid-template-columns: 1fr;
                gap: 1.5rem;
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
            <h1 class="page-title">Status do Pedido</h1>
        </div>
    </header>

    <main class="main-content">
        <div class="status-card">
            <i data-lucide="package" class="status-icon"></i>
            <div class="status-badge">
                <i data-lucide="check"></i>
                Pagamento Aprovado
            </div>
            <h2 class="status-title">Preparando seus produtos</h2>
            <p class="status-message">
                Aguarde enquanto seus produtos são liberados
            </p>

            <div class="progress-section">
                <div class="progress-steps">
                    <div class="progress-step completed">
                        <div class="step-indicator">
                            <i data-lucide="check"></i>
                        </div>
                        <div class="step-content">
                            <div class="step-title">Pagamento Confirmado</div>
                            <div class="step-description">
                                Transação aprovada com sucesso
                            </div>
                        </div>
                    </div>

                    <div class="progress-step active">
                        <div class="step-indicator">
                            <i data-lucide="package"></i>
                        </div>
                        <div class="step-content">
                            <div class="step-title">Liberando Produtos</div>
                            <div class="step-description">
                                Seus produtos estão sendo preparados para entrega
                            </div>
                        </div>
                    </div>

                    <div class="progress-step">
                        <div class="step-indicator">
                            <i data-lucide="check-circle"></i>
                        </div>
                        <div class="step-content">
                            <div class="step-title">Entrega Concluída</div>
                            <div class="step-description">
                                Retire seus produtos no compartimento de entrega
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <section class="transaction-details">
            <h3 class="details-title">Detalhes do Pedido</h3>
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
    </script>
</body>
</html>

Above is the design implementation, please use that as a reference to build a similar UI component. Make sure to follow modern React and TypeScript best practices.
