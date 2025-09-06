<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>POS System - Centered Welcome</title>
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
            overflow: hidden;
        }

        .status-bar {
            background: var(--primary);
            color: var(--primary-foreground);
            padding: 0.75rem 2rem;
            font-size: 0.875rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: var(--shadow-sm);
            position: relative;
            z-index: 10;
        }

        .status-bar .offline-indicator {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .status-bar .offline-indicator i {
            color: var(--destructive);
        }

        .main-content {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            position: relative;
            overflow: hidden;
            background: linear-gradient(135deg, var(--cerulean) 0%, var(--verdigris) 100%);
        }

        /* Background pattern */
        .pattern-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
                radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 10%),
                radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 10%);
            opacity: 0.6;
        }

        .welcome-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            max-width: 600px;
            width: 100%;
            position: relative;
            z-index: 1;
        }

        .logo-container {
            margin-bottom: 2.5rem;
            position: relative;
        }

        .logo {
            width: 180px;
            height: 180px;
            background: var(--card);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            font-weight: 700;
            color: var(--primary);
            box-shadow: var(--shadow-lg);
            position: relative;
            overflow: hidden;
            animation: fadeIn 1s ease-out;
        }

        .logo::after {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.2) 100%);
        }

        .welcome-text {
            color: var(--primary-foreground);
            font-size: 2.25rem;
            font-weight: 700;
            margin-bottom: 1rem;
            text-align: center;
            animation: fadeIn 1s ease-out 0.2s both;
        }

        .welcome-subtext {
            color: rgba(255, 255, 255, 0.8);
            font-size: 1.25rem;
            margin-bottom: 3rem;
            text-align: center;
            animation: fadeIn 1s ease-out 0.4s both;
        }

        .start-button {
            background: var(--bittersweet);
            color: white;
            border: none;
            padding: 1.5rem 4rem;
            border-radius: var(--radius-lg);
            font-size: 1.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 10px 30px rgba(240, 113, 103, 0.3);
            min-height: var(--touch-target);
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            animation: fadeIn 1s ease-out 0.6s both, pulse 2s infinite 2s;
        }

        .start-button::before {
            content: "";
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.2),
                transparent
            );
            animation: shimmer 2s infinite;
        }

        .start-button:hover {
            transform: translateY(-3px) scale(1.05);
            box-shadow: 0 15px 40px rgba(240, 113, 103, 0.4);
            animation: none;
        }

        .start-button:active {
            transform: translateY(1px);
            box-shadow: 0 5px 15px rgba(240, 113, 103, 0.3);
        }

        .button-highlight {
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 255, 255, 0.9);
            color: var(--foreground);
            padding: 0.5rem 1rem;
            border-radius: var(--radius);
            font-size: 0.875rem;
            font-weight: 600;
            box-shadow: var(--shadow-md);
            opacity: 0;
            animation: fadeInOut 4s infinite 3s;
        }

        .button-highlight::after {
            content: "";
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border-width: 8px;
            border-style: solid;
            border-color: rgba(255, 255, 255, 0.9) transparent transparent transparent;
        }

        /* Floating elements */
        .floating-element {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            z-index: 0;
            animation: float 8s infinite ease-in-out;
        }

        .element-1 {
            width: 300px;
            height: 300px;
            bottom: -150px;
            right: -100px;
            animation-delay: 0s;
        }

        .element-2 {
            width: 200px;
            height: 200px;
            top: -100px;
            left: -50px;
            animation-delay: 1s;
        }

        .element-3 {
            width: 150px;
            height: 150px;
            bottom: 20%;
            left: 10%;
            animation-delay: 2s;
        }

        .element-4 {
            width: 100px;
            height: 100px;
            top: 20%;
            right: 10%;
            animation-delay: 3s;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes shimmer {
            100% {
                left: 100%;
            }
        }

        @keyframes float {
            0%, 100% {
                transform: translateY(0);
            }
            50% {
                transform: translateY(-20px);
            }
        }

        @keyframes pulse {
            0%, 100% {
                transform: scale(1);
                box-shadow: 0 10px 30px rgba(240, 113, 103, 0.3);
            }
            50% {
                transform: scale(1.03);
                box-shadow: 0 15px 40px rgba(240, 113, 103, 0.4);
            }
        }

        @keyframes fadeInOut {
            0%, 100% {
                opacity: 0;
                transform: translateX(-50%) translateY(10px);
            }
            20%, 80% {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
            .welcome-text {
                font-size: 1.75rem;
            }
            
            .logo {
                width: 150px;
                height: 150px;
                font-size: 1.5rem;
            }

            .welcome-subtext {
                font-size: 1.125rem;
                margin-bottom: 2.5rem;
            }

            .start-button {
                padding: 1.25rem 3rem;
                font-size: 1.25rem;
            }
        }

        @media (max-width: 480px) {
            .status-bar {
                padding: 0.75rem 1rem;
            }
            
            .welcome-text {
                font-size: 1.5rem;
            }
            
            .logo {
                width: 120px;
                height: 120px;
                font-size: 1.25rem;
            }

            .welcome-subtext {
                font-size: 1rem;
                margin-bottom: 2rem;
            }

            .start-button {
                padding: 1.25rem 2rem;
                font-size: 1.125rem;
            }
        }
    </style>
</head>
<body>
    <div class="status-bar">
        <div class="offline-indicator">
            <i data-lucide="wifi-off"></i>
            <span>Modo Offline</span>
        </div>
        <div class="time">
            <script>
                function updateTime() {
                    const now = new Date();
                    document.querySelector('.time').textContent = now.toLocaleTimeString('pt-BR');
                }
                setInterval(updateTime, 1000);
                updateTime();
            </script>
        </div>
    </div>

    <main class="main-content">
        <div class="pattern-overlay"></div>
        <div class="floating-element element-1"></div>
        <div class="floating-element element-2"></div>
        <div class="floating-element element-3"></div>
        <div class="floating-element element-4"></div>
        
        <div class="welcome-container">
            <div class="logo-container">
                <div class="logo">LOGO</div>
            </div>
            
            <h1 class="welcome-text">Bem-vindo à Máquina de Vendas</h1>
            <p class="welcome-subtext">Escolha seus produtos favoritos com facilidade</p>
            
            <div style="position: relative;">
                <button class="start-button">
                    <i data-lucide="shopping-cart"></i>
                    Começar Compra
                </button>
               <!-- <div class="button-highlight">Toque aqui para iniciar</div> -->
            </div>
        </div>
    </main>

    <script>
        // Initialize Lucide icons
        lucide.createIcons();
    </script>
</body>
</html>

Above is the design implementation. Please use this as a reference to create a similar component. Focus on clean, maintainable code structure.
