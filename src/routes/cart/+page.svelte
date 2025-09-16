<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { ArrowLeft, Minus, Plus, Trash2, ArrowRight, ShoppingCart, HelpCircle } from 'lucide-svelte';
	import { visualSettingsService } from '$lib/services/visualSettings';
	import { cartService, type Cart, type CartItem } from '$lib/services/cart';
	import { errorDialogService } from '$lib/services/errorDialog';
	import { sessionService } from '$lib/services/session';

	let settings: any = $state(null);
	let currentTime = $state('');
	let cart: Cart = $state({
		items: [],
		total: 0,
		subtotal: 0,
		serviceFee: 0,
		discount: 0
	});
	let unsubscribeCart: (() => void) | null = null;
	
	// Session timeout handling
	let sessionTimeoutId: NodeJS.Timeout | null = null;
	let progressIntervalId: NodeJS.Timeout | null = null;
	let sessionStartTime = 0;
	let showTimeoutDialog = $state(false);
	let showProgressBar = $state(false);
	let progressWidth = $state(100);
	const SESSION_TIMEOUT = 60000; // 60 seconds
	const PROGRESS_THRESHOLD = 11000; // Show dialog when less than 11 seconds remain

	onMount(async () => {
		try {
			settings = await visualSettingsService.loadSettings();
		} catch (error) {
			console.error('Failed to load visual settings:', error);
		}


		// Update time every second
		function updateTime() {
			const now = new Date();
			currentTime = now.toLocaleTimeString('pt-BR');
		}
		updateTime();
		const timeInterval = setInterval(updateTime, 1000);

		// Initialize cart and subscribe to changes
		try {
			// Subscribe to cart updates first
			unsubscribeCart = cartService.subscribe((updatedCart) => {
				cart = updatedCart;
			});

			// Load cart from server
			cart = await cartService.getCart();
		} catch (error) {
			console.error('Failed to initialize cart:', error);
		}

		// Start session timeout
		startSessionTimeout();

		return () => {
			clearInterval(timeInterval);
			if (unsubscribeCart) {
				unsubscribeCart();
			}
			if (sessionTimeoutId) {
				clearTimeout(sessionTimeoutId);
			}
			if (progressIntervalId) {
				clearInterval(progressIntervalId);
			}
		};
	});

	onDestroy(() => {
		if (unsubscribeCart) {
			unsubscribeCart();
		}
		if (sessionTimeoutId) {
			clearTimeout(sessionTimeoutId);
		}
		if (progressIntervalId) {
			clearInterval(progressIntervalId);
		}
	});

	function goBack() {
		window.location.href = '/products';
	}

	function goToProducts() {
		window.location.href = '/products';
	}

	async function updateQuantity(productId: string, newQuantity: number) {
		try {
			await cartService.updateQuantity(productId, newQuantity);
			// Refresh cart data to ensure UI is updated
			cart = await cartService.getCart();
			// Show success toast
			showToast(newQuantity === 0 ? 'Item removido com sucesso!' : 'Quantidade atualizada com sucesso!');
		} catch (error) {
			console.error('Failed to update quantity:', error);
			// Don't show additional dialog - cartService already handles error dialogs
			// Just refresh cart to ensure UI is in sync
			cart = await cartService.getCart();
		}
	}

	async function removeItem(productId: string) {
		try {
			await cartService.removeItem(productId);
			// Refresh cart data to ensure UI is updated
			cart = await cartService.getCart();
			// Show success toast
			showToast('Item removido com sucesso!');
		} catch (error) {
			console.error('Failed to remove item:', error);
			// Don't show additional dialog - cartService already handles error dialogs
			// Just refresh cart to ensure UI is in sync
			cart = await cartService.getCart();
		}
	}

	function goToCheckout() {
		window.location.href = '/payment/method-selection';
	}

	// Reset timeout on any user interaction
	function handleUserInteraction() {
		sessionService.resetTimeout();
		resetSessionTimeout();
	}

	function startSessionTimeout() {
		if (sessionTimeoutId) {
			clearTimeout(sessionTimeoutId);
		}
		if (progressIntervalId) {
			clearInterval(progressIntervalId);
		}
		
		sessionStartTime = Date.now();
		showTimeoutDialog = false;
		showProgressBar = false;
		progressWidth = 100;
		
		sessionTimeoutId = setTimeout(() => {
			console.log('Session timeout reached, ending session');
			sessionService.endSession();
			window.location.href = '/';
		}, SESSION_TIMEOUT);
		
		// Start progress monitoring
		startProgressMonitoring();
	}

	function startProgressMonitoring() {
		progressIntervalId = setInterval(() => {
			const elapsed = Date.now() - sessionStartTime;
			const remaining = SESSION_TIMEOUT - elapsed;
			
			if (remaining <= PROGRESS_THRESHOLD) {
				if (!showProgressBar) {
					showProgressBar = true;
				}
				if (!showTimeoutDialog) {
					showTimeoutDialog = true;
				}
				// Calculate progress width (100% to 0% over the last 11 seconds)
				progressWidth = Math.max(0, (remaining / PROGRESS_THRESHOLD) * 100);
			} else {
				showProgressBar = false;
				showTimeoutDialog = false;
				progressWidth = 100;
			}
		}, 100); // Update every 100ms for smooth animation
	}

	function resetSessionTimeout() {
		startSessionTimeout();
	}

	function continueSession() {
		showTimeoutDialog = false;
		resetSessionTimeout();
	}

	function showToast(message: string, duration: number = 3000): void {
		// Create toast element
		const toast = document.createElement('div');
		toast.className = 'toast-notification';
		toast.textContent = message;
		toast.style.cssText = `
			position: fixed;
			top: 80px;
			right: 20px;
			background: #10B981;
			color: white;
			padding: 1rem 1.5rem;
			border-radius: 8px;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
			z-index: 10001;
			font-weight: 600;
			font-size: 16px;
			max-width: 320px;
			word-wrap: break-word;
			opacity: 0;
			transform: translateX(100%);
			transition: all 0.3s ease-out;
			font-family: system-ui, -apple-system, sans-serif;
			border: 2px solid rgba(255, 255, 255, 0.2);
		`;

		document.body.appendChild(toast);

		// Trigger animation
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				toast.style.opacity = '1';
				toast.style.transform = 'translateX(0)';
			});
		});

		// Remove toast after specified duration
		setTimeout(() => {
			if (toast.parentNode) {
				toast.style.opacity = '0';
				toast.style.transform = 'translateX(100%)';
				setTimeout(() => {
					if (toast.parentNode) {
						toast.parentNode.removeChild(toast);
					}
				}, 300);
			}
		}, duration);
	}
</script>

<svelte:head>
	<title>Carrinho - InoBag</title>
</svelte:head>

<svelte:window onclick={handleUserInteraction} onkeydown={handleUserInteraction} />

<div class="full-screen-container">
	<header class="header">
		<div class="header-main">
			<button class="back-button" onclick={goBack}>
				<ArrowLeft size={24} />
			</button>
			<h1 class="page-title">Carrinho</h1>
			<div class="time">{currentTime}</div>
		</div>
	</header>

	<main class="main-content">
		<div class="cart-container">
			{#if cart.items.length > 0}
				<div class="summary-section">
					<h2 class="summary-title">Resumo do Pedido</h2>
					<div class="summary-row">
						<span>Itens ({cart.items.reduce((total, item) => total + item.quantity, 0)})</span>
						<span>R$ {cart.subtotal.toFixed(2).replace('.', ',')}</span>
					</div>
					{#if cart.serviceFee > 0}
						<div class="summary-row">
							<span>Taxa de serviço</span>
							<span>R$ {cart.serviceFee.toFixed(2).replace('.', ',')}</span>
						</div>
					{/if}
					{#if cart.discount > 0}
						<div class="summary-row">
							<span>Desconto</span>
							<span>- R$ {cart.discount.toFixed(2).replace('.', ',')}</span>
						</div>
					{/if}
					<div class="summary-row total">
						<span>Total</span>
						<span>R$ {cart.total.toFixed(2).replace('.', ',')}</span>
					</div>
					<button class="checkout-button" onclick={goToCheckout}>
						Finalizar Pedido
						<ArrowRight size={20} />
					</button>
					<button class="cancel-button" onclick={() => window.location.href = '/'}>
						Cancelar
					</button>
				</div>

				<div class="cart-items">
					<h2 class="section-title">Itens</h2>
					{#each cart.items as item (item.itemId)}
						<div class="cart-item">
							<div class="item-image">
								{#if item.media && item.media.length > 0 && (item.media[0].url || item.media[0].source)}
									<img src={item.media[0].url || item.media[0].source} alt={item.name} />
								{:else}
									<div class="item-placeholder">
										<ShoppingCart size={24} />
									</div>
								{/if}
							</div>
							<div class="item-details">
								<div class="item-info">
									<div class="item-name">{item.name}</div>
									<div class="item-price">R$ {item.price.toFixed(2).replace('.', ',')}</div>
								</div>
								<div class="quantity-controls">
									<button 
										class="quantity-button" 
										onclick={() => {
											if (item.quantity === 1) {
												removeItem(item.itemId.toString());
											} else {
												updateQuantity(item.itemId.toString(), item.quantity - 1);
											}
										}}
									>
										<Minus size={16} />
									</button>
									<span class="quantity-display">{item.quantity}</span>
									<button 
										class="quantity-button" 
										onclick={() => updateQuantity(item.itemId.toString(), item.quantity + 1)}
										disabled={item.saleLimit && item.quantity >= item.saleLimit}
									>
										<Plus size={16} />
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="empty-cart">
					<ShoppingCart size={64} />
					<div class="empty-cart-text">Seu carrinho está vazio</div>
					<button class="continue-shopping" onclick={goToProducts}>
						<ArrowLeft size={20} />
						Continuar Comprando
					</button>
				</div>
			{/if}
		</div>
	</main>
</div>

<!-- Session Timeout Progress Bar -->
{#if showProgressBar}
	<div class="timeout-progress-bar">
		<div class="progress-fill" style:width="{progressWidth}%"></div>
	</div>
{/if}

<!-- Timeout Dialog -->
{#if showTimeoutDialog}
	<div class="timeout-dialog-backdrop">
		<div class="timeout-dialog">
			<div class="dialog-icon">
				<HelpCircle size={48} />
			</div>
			<h3 class="dialog-title">Ei! Tem alguém aí?</h3>
			<p class="dialog-message">Clique para continuar</p>
			<button class="continue-button" onclick={continueSession}>
				OK
			</button>
		</div>
	</div>
{/if}

<style>
	.full-screen-container {
		height: 100vh;
		width: 100vw;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: var(--background);
	}

	.header {
		background: var(--primary);
		color: var(--primary-foreground);
		position: sticky;
		top: 0;
		z-index: 10;
		flex-shrink: 0;
	}

	.header-main {
		padding: 1.5rem 2rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.back-button {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: var(--primary-foreground);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		width: 44px;
		height: 44px;
		border-radius: 0.5rem;
		backdrop-filter: blur(8px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.back-button:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.3);
		transform: translateX(-3px) translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.page-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
		color: var(--primary-foreground);
		text-align: center;
		flex: 1;
	}

	.time {
		font-size: 0.875rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.9);
		width: 44px;
		text-align: center;
	}

	.main-content {
		flex: 1;
		display: flex;
		justify-content: center;
		padding: 2rem;
		overflow-y: auto;
		background: var(--background);
	}

	.cart-container {
		width: 100%;
		max-width: 800px;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--foreground);
		text-align: center;
		margin-bottom: 1.5rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid var(--primary);
	}

	.cart-items {
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
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--muted);
	}

	.item-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.item-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--muted-foreground);
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
		color: var(--foreground);
	}

	.item-price {
		color: var(--primary);
		font-weight: 700;
		font-size: 1rem;
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

	.quantity-button:hover:not(:disabled) {
		background: var(--accent);
		border-color: var(--accent);
	}

	.quantity-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.quantity-display {
		font-weight: 600;
		min-width: 2rem;
		text-align: center;
		font-size: 1rem;
		color: var(--foreground);
	}


	.summary-section {
		background: var(--card);
		border-radius: var(--radius);
		padding: 1.5rem;
		border: 1px solid var(--border);
		width: 100%;
		max-width: 800px;
		box-shadow: var(--shadow-sm);
	}

	.summary-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border);
		color: var(--foreground);
	}

	.summary-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 1rem;
		font-size: 1rem;
		color: var(--foreground);
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
		min-height: var(--touch-target);
	}

	.checkout-button:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	.cancel-button {
		background: transparent;
		color: var(--muted-foreground);
		border: 2px solid var(--border);
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
		margin-top: 1rem;
		min-height: var(--touch-target);
	}

	.cancel-button:hover {
		background: var(--muted);
		border-color: var(--muted-foreground);
		transform: translateY(-2px);
		box-shadow: var(--shadow-sm);
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

	.empty-cart-text {
		font-size: 1.25rem;
		font-weight: 500;
		color: var(--foreground);
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
		min-height: var(--touch-target);
		font-size: 1rem;
	}

	.continue-shopping:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	/* HD Portrait Display optimizations */
	@media (min-width: 768px) and (min-height: 1024px) {
		.main-content {
			padding: 2.5rem;
		}

		.cart-item {
			padding: 2rem;
		}

		.item-image {
			width: 120px;
			height: 120px;
		}

		.summary-section {
			width: 100%;
			max-width: 800px;
		}
	}

	/* Full HD Portrait (1080x1920) optimizations */
	@media (min-width: 1080px) and (min-height: 1920px) {
		.header-top,
		.header-main {
			padding-left: 3rem;
			padding-right: 3rem;
		}

		.main-content {
			padding: 3rem;
			gap: 3rem;
		}

		.cart-item {
			padding: 2.5rem;
		}

		.item-image {
			width: 140px;
			height: 140px;
		}

		.summary-section {
			width: 100%;
			max-width: 800px;
			padding: 2rem;
		}

		.page-title {
			font-size: 1.5rem;
		}
	}

	/* Responsive design */
	@media (max-width: 1024px) {
		.main-content {
			padding: 1.5rem;
		}

		.cart-container {
			max-width: 700px;
		}
	}

	@media (max-width: 768px) {
		.header-main {
			padding: 1rem;
		}

		.back-button {
			width: 40px;
			height: 40px;
		}

		.page-title {
			font-size: 1.25rem;
		}

		.time {
			font-size: 0.75rem;
			width: 40px;
		}

		.main-content {
			padding: 1rem;
		}

		.cart-container {
			gap: 1.5rem;
			max-width: 100%;
		}

		.cart-item {
			flex-direction: column;
			padding: 1rem;
			text-align: center;
		}

		.item-details {
			flex-direction: column;
			gap: 1rem;
			width: 100%;
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

	@media (max-width: 480px) {
		.header-top,
		.header-main {
			padding-left: 0.75rem;
			padding-right: 0.75rem;
		}

		.main-content {
			padding: 0.75rem;
		}

		.cart-item {
			padding: 0.75rem;
		}

		.summary-section {
			padding: 1rem;
		}

		.checkout-button {
			font-size: 1rem;
			padding: 0.875rem;
		}

		.section-title {
			font-size: 1.25rem;
		}
	}

	/* Timeout Dialog Styles */
	.timeout-dialog-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.3s ease-out;
	}

	.timeout-dialog {
		background: white;
		border-radius: var(--radius-lg);
		padding: 2rem;
		max-width: 400px;
		width: 90%;
		text-align: center;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
		animation: slideUp 0.3s ease-out;
	}

	.dialog-icon {
		color: #f59e0b;
		margin-bottom: 1rem;
	}

	.dialog-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--foreground);
		margin: 0 0 1rem 0;
	}

	.dialog-message {
		font-size: 1rem;
		color: var(--muted-foreground);
		margin: 0 0 2rem 0;
	}

	.continue-button {
		background: var(--primary);
		color: white;
		border: none;
		padding: 1rem 2rem;
		border-radius: var(--radius);
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		min-width: 120px;
	}

	.continue-button:hover {
		background: var(--primary-hover, #006b8a);
		transform: translateY(-1px);
	}

	/* Session Timeout Progress Bar */
	.timeout-progress-bar {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 4px;
		background: rgba(0, 0, 0, 0.1);
		z-index: 9999;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #ff6b6b, #ff8e53, #ff6b6b);
		background-size: 200% 100%;
		animation: progressShimmer 1s ease-in-out infinite;
		transition: width 0.1s linear;
	}

	@keyframes progressShimmer {
		0% {
			background-position: -200% 0;
		}
		100% {
			background-position: 200% 0;
		}
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes slideUp {
		from { 
			opacity: 0;
			transform: translateY(20px) scale(0.95);
		}
		to { 
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
</style>