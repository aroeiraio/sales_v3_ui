<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>POS System - Thank You V1</title>
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

        /* Main content */
        .main-content {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            background: linear-gradient(
                135deg,
                var(--background) 0%,
                var(--accent) 100%
            );
        }

        /* Thank you card */
        .thank-you-card {
            background: var(--card);
            border-radius: var(--radius-lg);
            padding: 4rem 3rem;
            text-align: center;
            max-width: 600px;
            width: 100%;
            position: relative;
            overflow: hidden;
            box-shadow: var(--shadow-lg);
        }

        /* Background pattern */
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

        /* Success checkmark animation */
        .success-animation {
            width: 120px;
            height: 120px;
            margin: 0 auto 2.5rem;
            position: relative;
        }

        .checkmark {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            display: block;
            stroke-width: 3;
            stroke: var(--success);
            stroke-miterlimit: 10;
            box-shadow: inset 0px 0px 0px var(--success);
            animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
        }

        .checkmark__circle {
            stroke-dasharray: 166;
            stroke-dashoffset: 166;
            stroke-width: 3;
            stroke-miterlimit: 10;
            stroke: var(--success);
            fill: none;
            animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }

        .checkmark__check {
            transform-origin: 50% 50%;
            stroke-dasharray: 48;
            stroke-dashoffset: 48;
            animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
        }

        @keyframes stroke {
            100% {
                stroke-dashoffset: 0;
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
                box-shadow: inset 0px 0px 0px 60px var(--success);
            }
        }

        .thank-you-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: var(--foreground);
            line-height: 1.2;
            letter-spacing: -0.02em;
        }

        .thank-you-message {
            font-size: 1.25rem;
            color: var(--muted-foreground);
            margin-bottom: 2.5rem;
            line-height: 1.6;
        }

        .order-info {
            background: var(--background);
            padding: 1.5rem;
            border-radius: var(--radius);
            margin-bottom: 2.5rem;
            border: 1px solid var(--border);
            display: inline-flex;
            align-items: center;
            gap: 1rem;
        }

        .order-icon {
            color: var(--primary);
        }

        .order-number {
            font-size: 1.125rem;
            color: var(--muted-foreground);
        }

        .order-number strong {
            color: var(--foreground);
            font-weight: 600;
        }

        .action-button {
            background: var(--primary);
            color: var(--primary-foreground);
            padding: 1.25rem 2.5rem;
            border-radius: var(--radius);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            min-height: var(--touch-target);
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
</head>
<body>
    <main class="main-content">
        <div class="thank-you-card">
            <div class="background-pattern"></div>
            <div class="content-wrapper">
                <div class="success-animation">
                    <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                        <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                </div>

                <h1 class="thank-you-title">Obrigado pela sua compra!</h1>
                <p class="thank-you-message">
                    Esperamos que você aproveite seus produtos.<br>
                    Volte sempre!
                </p>

                <div class="order-info">
                    <i data-lucide="receipt" class="order-icon"></i>
                    <p class="order-number">
                        Número do Pedido: <strong>#123456</strong>
                    </p>
                </div>

                <button class="action-button">
                    <i data-lucide="home"></i>
                    Fazer Nova Compra
                </button>
            </div>
        </div>
    </main>

    <script>
        // Initialize Lucide icons
        lucide.createIcons();
    </script>
</body>
</html>

Above is the design implementation, please use that as a reference to build a similar UI component. Make sure to follow modern React and TypeScript best practices.
