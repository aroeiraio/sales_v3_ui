<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>POS System - Cart</title>
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
            display: flex;
            gap: 2rem;
            padding: 2rem;
            max-width: 1400px;
            margin: 0 auto;
            width: 100%;
        }

        /* Cart items section */
        .cart-items {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .cart-item {
            background: var(--card);
            border-radius: var(--radius);
            padding: 1.5rem;
            display: flex;
            gap: 1.5rem;
            align-items: center;
            border: 1px solid var(--border);
            transition: all 0.2s ease;
        }

        .cart-item:hover {
            border-color: var(--accent);
            transform: translateY(-2px);
            box-shadow: var(--shadow-sm);
        }

        .item-image {
            width: 100px;
            height: 100px;
            border-radius: var(--radius);
            overflow: hidden;
            flex-shrink: 0;
        }

        .item-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .item-details {
            flex: 1;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
        }

        .item-info {
            flex: 1;
        }

        .item-name {
            font-weight: 600;
            margin-bottom: 0.5rem;
            font-size: 1.125rem;
        }

        .item-price {
            color: var(--primary);
            font-weight: 700;
        }

        .quantity-controls {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .quantity-button {
            background: transparent;
            border: 1px solid var(--border);
            color: var(--foreground);
            width: 36px;
            height: 36px;
            border-radius: var(--radius);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .quantity-button:hover {
            background: var(--accent);
            border-color: var(--accent);
        }

        .quantity-display {
            font-weight: 600;
            min-width: 2rem;
            text-align: center;
        }

        .remove-button {
            background: transparent;
            border: none;
            color: var(--destructive);
            padding: 0.5rem;
            cursor: pointer;
            border-radius: var(--radius);
            transition: all 0.2s ease;
        }

        .remove-button:hover {
            background: var(--destructive);
            color: white;
        }

        /* Summary section */
        .summary-section {
            width: 380px;
            background: var(--card);
            border-radius: var(--radius);
            padding: 1.5rem;
            border: 1px solid var(--border);
            height: fit-content;
            position: sticky;
            top: calc(73px + 2rem); /* Header height + padding */
        }

        .summary-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--border);
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1rem;
            font-size: 1rem;
        }

        .summary-row.total {
            font-weight: 700;
            font-size: 1.25rem;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid var(--border);
        }

        .checkout-button {
            background: var(--bittersweet);
            color: white;
            border: none;
            width: 100%;
            padding: 1rem;
            border-radius: var(--radius);
            font-weight: 600;
            font-size: 1.125rem;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            margin-top: 2rem;
        }

        .checkout-button:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
        }

        .empty-cart {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1.5rem;
            padding: 3rem;
            text-align: center;
            color: var(--muted-foreground);
        }

        .empty-cart i {
            width: 64px;
            height: 64px;
            color: var(--muted-foreground);
        }

        .empty-cart-text {
            font-size: 1.25rem;
            font-weight: 500;
        }

        .continue-shopping {
            background: var(--primary);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: var(--radius);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .continue-shopping:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
        }

        /* Responsive design */
        @media (max-width: 1024px) {
            .main-content {
                padding: 1.5rem;
                gap: 1.5rem;
            }

            .summary-section {
                width: 340px;
            }
        }

        @media (max-width: 768px) {
            .header-top,
            .header-main {
                padding-left: 1rem;
                padding-right: 1rem;
            }

            .main-content {
                flex-direction: column;
                padding: 1rem;
            }

            .summary-section {
                width: 100%;
                position: static;
                order: -1;
            }

            .cart-item {
                flex-direction: column;
                padding: 1rem;
                text-align: center;
            }

            .item-details {
                flex-direction: column;
                gap: 1rem;
            }

            .item-image {
                width: 120px;
                height: 120px;
                margin: 0 auto;
            }

            .quantity-controls {
                justify-content: center;
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
            <h1 class="page-title">Carrinho</h1>
        </div>
    </header>

    <main class="main-content">
        <div class="cart-items">
            <!-- Cart Item -->
            <div class="cart-item">
                <div class="item-image">
                    <img src="https://placehold.co/100x100" alt="Café Expresso">
                </div>
                <div class="item-details">
                    <div class="item-info">
                        <div class="item-name">Café Expresso</div>
                        <div class="item-price">R$ 5,00</div>
                    </div>
                    <div class="quantity-controls">
                        <button class="quantity-button">
                            <i data-lucide="minus"></i>
                        </button>
                        <span class="quantity-display">2</span>
                        <button class="quantity-button">
                            <i data-lucide="plus"></i>
                        </button>
                    </div>
                    <button class="remove-button">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>

            <!-- Another Cart Item -->
            <div class="cart-item">
                <div class="item-image">
                    <img src="https://placehold.co/100x100" alt="Cappuccino">
                </div>
                <div class="item-details">
                    <div class="item-info">
                        <div class="item-name">Cappuccino</div>
                        <div class="item-price">R$ 7,50</div>
                    </div>
                    <div class="quantity-controls">
                        <button class="quantity-button">
                            <i data-lucide="minus"></i>
                        </button>
                        <span class="quantity-display">1</span>
                        <button class="quantity-button">
                            <i data-lucide="plus"></i>
                        </button>
                    </div>
                    <button class="remove-button">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>

            <!-- Empty State (hidden by default) -->
            <div class="empty-cart" style="display: none;">
                <i data-lucide="shopping-cart"></i>
                <div class="empty-cart-text">Seu carrinho está vazio</div>
                <button class="continue-shopping">
                    <i data-lucide="arrow-left"></i>
                    Continuar Comprando
                </button>
            </div>
        </div>

        <aside class="summary-section">
            <h2 class="summary-title">Resumo do Pedido</h2>
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
            <button class="checkout-button">
                Finalizar Pedido
                <i data-lucide="arrow-right"></i>
            </button>
        </aside>
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
