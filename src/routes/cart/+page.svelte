<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { ArrowLeft, WifiOff, Minus, Plus, Trash2, ArrowRight, ShoppingCart } from 'lucide-svelte';
	import { visualSettingsService } from '$lib/services/visualSettings';
	import { offlineService } from '$lib/services/offline';
	import { cartService, type Cart, type CartItem } from '$lib/services/cart';

	let settings: any = $state(null);
	let isOnline = $state(true);
	let currentTime = $state('');
	let cart: Cart = $state({
		items: [],
		total: 0,
		subtotal: 0,
		serviceFee: 0,
		discount: 0
	});
	let unsubscribeCart: (() => void) | null = null;

	onMount(async () => {
		try {
			settings = await visualSettingsService.loadSettings();
		} catch (error) {
			console.error('Failed to load visual settings:', error);
		}

		// Initialize offline status
		isOnline = offlineService.isOnlineStatus();
		
		// Listen for online/offline changes
		const handleOnline = () => isOnline = true;
		const handleOffline = () => isOnline = false;
		
		if (typeof window !== 'undefined') {
			window.addEventListener('online', handleOnline);
			window.addEventListener('offline', handleOffline);
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
			cart = cartService.getCart();
			
			// Subscribe to cart updates
			unsubscribeCart = cartService.subscribe((updatedCart) => {
				cart = updatedCart;
			});

			// Load cart from server if needed
			await cartService.getCart();
		} catch (error) {
			console.error('Failed to initialize cart:', error);
		}

		return () => {
			if (typeof window !== 'undefined') {
				window.removeEventListener('online', handleOnline);
				window.removeEventListener('offline', handleOffline);
			}
			clearInterval(timeInterval);
			if (unsubscribeCart) {
				unsubscribeCart();
			}
		};
	});

	onDestroy(() => {
		if (unsubscribeCart) {
			unsubscribeCart();
		}
	});

	function goBack() {
		window.history.back();
	}

	function goToProducts() {
		window.location.href = '/products';
	}

	async function updateQuantity(productId: string, newQuantity: number) {
		try {
			await cartService.updateQuantity(productId, newQuantity);
		} catch (error) {
			console.error('Failed to update quantity:', error);
		}
	}

	async function removeItem(productId: string) {
		try {
			await cartService.removeItem(productId);
		} catch (error) {
			console.error('Failed to remove item:', error);
		}
	}

	function goToCheckout() {
		window.location.href = '/checkout';
	}
</script>

<svelte:head>
	<title>Carrinho - InoBag</title>
</svelte:head>

<div class="full-screen-container">
	<header class="header">
		<div class="header-top">
			{#if !isOnline}
				<div class="status-indicator">
					<WifiOff size={16} />
					<span>Modo Offline</span>
				</div>
			{:else}
				<div></div>
			{/if}
			<div class="time">{currentTime}</div>
		</div>
		<div class="header-main">
			<button class="back-button" onclick={goBack}>
				<ArrowLeft size={20} />
				Voltar
			</button>
			<h1 class="page-title">Carrinho</h1>
		</div>
	</header>

	<main class="main-content">
		{#if cart.items.length > 0}
			<div class="cart-items">
				{#each cart.items as item (item.productId)}
					<div class="cart-item">
						<div class="item-image">
							{#if item.image}
								<img src={item.image} alt={item.name} />
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
									onclick={() => updateQuantity(item.productId, item.quantity - 1)}
									disabled={item.quantity <= 1}
								>
									<Minus size={16} />
								</button>
								<span class="quantity-display">{item.quantity}</span>
								<button 
									class="quantity-button" 
									onclick={() => updateQuantity(item.productId, item.quantity + 1)}
									disabled={item.maxQuantity && item.quantity >= item.maxQuantity}
								>
									<Plus size={16} />
								</button>
							</div>
							<button class="remove-button" onclick={() => removeItem(item.productId)}>
								<Trash2 size={20} />
							</button>
						</div>
					</div>
				{/each}
			</div>

			<aside class="summary-section">
				<h2 class="summary-title">Resumo do Pedido</h2>
				<div class="summary-row">
					<span>Subtotal</span>
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
			</aside>
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
	</main>
</div>

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

	.header-top {
		background: rgba(0, 0, 0, 0.1);
		padding: 0.5rem 2rem;
		font-size: 0.875rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.status-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--bittersweet);
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
		min-height: 44px;
		font-size: 1rem;
	}

	.back-button:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.page-title {
		font-size: 1.25rem;
		font-weight: 600;
	}

	.main-content {
		flex: 1;
		display: flex;
		gap: 2rem;
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
		width: 100%;
		overflow-y: auto;
	}

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

	.remove-button {
		background: transparent;
		border: none;
		color: var(--destructive);
		padding: 0.5rem;
		cursor: pointer;
		border-radius: var(--radius);
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		min-width: 44px;
	}

	.remove-button:hover {
		background: var(--destructive);
		color: white;
	}

	.summary-section {
		width: 380px;
		background: var(--card);
		border-radius: var(--radius);
		padding: 1.5rem;
		border: 1px solid var(--border);
		height: fit-content;
		position: sticky;
		top: calc(73px + 2rem); /* Header height + padding */
		flex-shrink: 0;
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
			width: 420px;
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
			width: 480px;
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
	}
</style>