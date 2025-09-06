<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>POS System - QR Code Payment V1</title>
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
            box-shadow: var(--shadow-sm);
        }

        .header-content {
            max-width: 1400px;
            margin: 0 auto;
            padding: 1.5rem 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .page-title {
            font-size: 1.25rem;
            font-weight: 600;
        }

        .amount-display {
            display: flex;
            align-items: baseline;
            gap: 0.75rem;
            padding: 0.5rem 1rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: var(--radius);
        }

        .amount-label {
            font-size: 0.875rem;
            opacity: 0.8;
        }

        .amount-value {
            font-size: 1.25rem;
            font-weight: 600;
        }

        /* Main content */
        .main-content {
            flex: 1;
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 300px;
            gap: 2rem;
            align-items: start;
        }

        /* QR Code section with centered elements */
        .qr-section {
            background: var(--card);
            border-radius: var(--radius-lg);
            padding: 3rem;
            border: 1px solid var(--border);
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .qr-header {
            margin-bottom: 2rem;
            max-width: 600px;
        }

        .qr-title {
            font-size: 1.75rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: var(--foreground);
        }

        .qr-subtitle {
            font-size: 1.125rem;
            color: var(--muted-foreground);
        }

        .qr-container {
            background: white;
            padding: 2rem;
            border-radius: var(--radius);
            margin-bottom: 2rem;
            position: relative;
            box-shadow: var(--shadow-sm);
            max-width: 300px;
            width: 100%;
        }

        .qr-code {
            width: 100%;
            aspect-ratio: 1/1;
            background: url('https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=example');
            background-size: contain;
            background-position: center;
            background-repeat: no-repeat;
        }

        .qr-loading {
            position: absolute;
            inset: 0;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            border-radius: var(--radius);
        }

        .loading-spinner {
            animation: spin 1s linear infinite;
            color: var(--primary);
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .loading-text {
            font-size: 0.875rem;
            color: var(--muted-foreground);
        }

        .timer-display {
            background: var(--background);
            padding: 1rem 2rem;
            border-radius: var(--radius);
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 2rem;
            box-shadow: var(--shadow-xs);
        }

        .timer-icon {
            color: var(--primary);
        }

        .timer-text {
            font-size: 1.125rem;
            font-weight: 500;
        }

        .timer-count {
            font-weight: 700;
            color: var(--primary);
        }

        /* Side panel */
        .side-panel {
            background: var(--card);
            border-radius: var(--radius-lg);
            padding: 1.5rem;
            border: 1px solid var(--border);
            position: sticky;
            top: calc(73px + 2rem);
        }

        .help-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--border);
        }

        .steps-list {
            list-style: none;
            margin-bottom: 2rem;
        }

        .step-item {
            display: flex;
            gap: 1rem;
            padding: 1rem 0;
            border-bottom: 1px solid var(--border);
        }

        .step-item:last-child {
            border-bottom: none;
        }

        .step-number {
            width: 24px;
            height: 24px;
            background: var(--primary);
            color: var(--primary-foreground);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.875rem;
            font-weight: 600;
            flex-shrink: 0;
        }

        .step-content {
            font-size: 0.875rem;
            color: var(--muted-foreground);
            line-height: 1.6;
        }

        .cancel-button {
            width: 100%;
            padding: 0.75rem;
            background: transparent;
            border: 1px solid var(--border);
            color: var(--destructive);
            border-radius: var(--radius);
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }

        .cancel-button:hover {
            background: var(--destructive);
            color: white;
            border-color: var(--destructive);
        }

        /* Responsive design */
        @media (max-width: 1024px) {
            .main-content {
                grid-template-columns: 1fr;
                padding: 1.5rem;
            }

            .side-panel {
                position: static;
            }
        }

        @media (max-width: 768px) {
            .header-content {
                padding: 1rem;
                flex-direction: column;
                gap: 1rem;
                align-items: stretch;
            }

            .amount-display {
                justify-content: center;
            }

            .main-content {
                padding: 1rem;
            }

            .qr-section {
                padding: 1.5rem;
            }
        }

        @media (max-width: 480px) {
            .qr-title {
                font-size: 1.5rem;
            }

            .qr-subtitle {
                font-size: 1rem;
            }

            .qr-container {
                padding: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="header-content">
            <div class="header-left">
                <h1 class="page-title">Pagamento via PIX</h1>
            </div>
            <div class="amount-display">
                <span class="amount-label">Total:</span>
                <span class="amount-value">R$ 19,50</span>
            </div>
        </div>
    </header>

    <main class="main-content">
        <section class="qr-section">
            <div class="qr-header">
                <h2 class="qr-title">Escaneie o QR Code</h2>
                <p class="qr-subtitle">
                    Use o aplicativo do seu banco para escanear o código e realizar o pagamento
                </p>
            </div>

            <div class="qr-container">
                <div class="qr-code"></div>
                <div class="qr-loading" style="display: none;">
                    <i data-lucide="loader-2" class="loading-spinner"></i>
                    <span class="loading-text">Gerando QR Code...</span>
                </div>
            </div>

            <div class="timer-display">
                <i data-lucide="clock" class="timer-icon"></i>
                <span class="timer-text">Expira em: <span class="timer-count">05:00</span></span>
            </div>
        </section>

        <aside class="side-panel">
            <h3 class="help-title">Como pagar com PIX</h3>
            <ol class="steps-list">
                <li class="step-item">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        Abra o aplicativo do seu banco
                    </div>
                </li>
                <li class="step-item">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        Escolha a opção "Pagar com PIX"
                    </div>
                </li>
                <li class="step-item">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        Escaneie o QR Code exibido na tela
                    </div>
                </li>
                <li class="step-item">
                    <div class="step-number">4</div>
                    <div class="step-content">
                        Confirme as informações e valor
                    </div>
                </li>
                <li class="step-item">
                    <div class="step-number">5</div>
                    <div class="step-content">
                        Aguarde a confirmação do pagamento
                    </div>
                </li>
            </ol>
            <button class="cancel-button">
                <i data-lucide="x"></i>
                Cancelar Pagamento
            </button>
        </aside>
    </main>

    <script>
        // Initialize Lucide icons
        lucide.createIcons();

        // Demo: Timer countdown
        let timeLeft = 300; // 5 minutes in seconds
        const timerDisplay = document.querySelector('.timer-count');

        function updateTimer() {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            if (timeLeft > 0) {
                timeLeft--;
            }
        }

        setInterval(updateTimer, 1000);
        updateTimer();
    </script>
</body>
</html>

Above is the design implementation, please use that as a reference to build a similar UI component. Make sure to follow modern React and TypeScript best practices.
