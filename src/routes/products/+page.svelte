<script lang="ts">
	import { onMount } from 'svelte';
	import { Search, Menu, Coffee, Sandwich, Candy, Salad, Package, Plus, ArrowRight, ChevronDown } from 'lucide-svelte';
	import { visualSettingsService } from '$lib/services/visualSettings';
	import { sessionService } from '$lib/services/session';
	import { cartService, type Cart } from '$lib/services/cart';

	let settings: any = $state(null);
	let sidebarOpen = $state(false);
	let searchQuery = $state('');
	let selectedCategory = $state('Bebidas');
	let cart: Cart = $state({
		items: [],
		total: 0,
		subtotal: 0,
		serviceFee: 0,
		discount: 0
	});

	// Mock product data - in a real app this would come from an API
	const categories = [
		{ id: 'bebidas', name: 'Bebidas', icon: Coffee },
		{ id: 'lanches', name: 'Lanches', icon: Sandwich },
		{ id: 'doces', name: 'Doces', icon: Candy },
		{ id: 'saudaveis', name: 'Saudáveis', icon: Salad },
		{ id: 'combos', name: 'Combos', icon: Package }
	];

	const products = [
		{ id: 1, name: 'Café Expresso', price: 5.00, category: 'bebidas', image: 'https://placehold.co/200x160/CCCCCC/666666?text=Café', badge: 'Popular' },
		{ id: 2, name: 'Cappuccino', price: 7.50, category: 'bebidas', image: 'https://placehold.co/200x160/CCCCCC/666666?text=Cappuccino' },
		{ id: 3, name: 'Chocolate Quente', price: 8.00, category: 'bebidas', image: 'https://placehold.co/200x160/CCCCCC/666666?text=Chocolate' },
		{ id: 4, name: 'Água Mineral', price: 2.50, category: 'bebidas', image: 'https://placehold.co/200x160/CCCCCC/666666?text=Água' },
		{ id: 5, name: 'Refrigerante', price: 4.00, category: 'bebidas', image: 'https://placehold.co/200x160/CCCCCC/666666?text=Refrigerante' },
		{ id: 6, name: 'Suco Natural', price: 6.00, category: 'bebidas', image: 'https://placehold.co/200x160/CCCCCC/666666?text=Suco' },
		{ id: 7, name: 'Hambúrguer', price: 15.00, category: 'lanches', image: 'https://placehold.co/200x160/CCCCCC/666666?text=Hambúrguer' },
		{ id: 8, name: 'Sanduíche Natural', price: 12.00, category: 'lanches', image: 'https://placehold.co/200x160/CCCCCC/666666?text=Sanduíche' },
		{ id: 9, name: 'Brownie', price: 8.50, category: 'doces', image: 'https://placehold.co/200x160/CCCCCC/666666?text=Brownie' },
		{ id: 10, name: 'Salada Caesar', price: 18.00, category: 'saudaveis', image: 'https://placehold.co/200x160/CCCCCC/666666?text=Salada' },
		{ id: 11, name: 'Combo Café + Brownie', price: 12.00, category: 'combos', image: 'https://placehold.co/200x160/CCCCCC/666666?text=Combo', badge: 'Promoção' }
	];

	const filteredProducts = $derived(products.filter(product => 
		product.category === selectedCategory.toLowerCase() &&
		product.name.toLowerCase().includes(searchQuery.toLowerCase())
	));

	const cartItemsCount = $derived(cart.items.reduce((total, item) => total + item.quantity, 0));

	onMount(async () => {
		try {
			settings = await visualSettingsService.loadSettings();
		} catch (error) {
			console.error('Failed to load visual settings:', error);
		}

		// Initialize cart service and subscribe to cart changes
		try {
			cart = cartService.getCart();
			
			// Subscribe to cart updates
			cartService.subscribe((updatedCart) => {
				cart = updatedCart;
			});
		} catch (error) {
			console.error('Failed to initialize cart:', error);
		}
	});

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	function selectCategory(category: string) {
		selectedCategory = category;
		if (window.innerWidth <= 768) {
			sidebarOpen = false;
		}
	}

	async function addToCart(product: any) {
		try {
			await cartService.addItem(product.id.toString(), 1);
		} catch (error) {
			console.error('Failed to add item to cart:', error);
			// Error handling is done by the cart service
		}
	}

	function goToCart() {
		window.location.href = '/cart';
	}
</script>

<svelte:head>
	<title>Produtos - InoBag</title>
</svelte:head>

<div class="full-screen-container">
	<header class="header">
		<div class="header-container">
			<button class="mobile-menu-toggle" onclick={toggleSidebar}>
				<Menu size={24} />
			</button>
			<div class="logo">
				<div class="logo-icon">
					<Coffee size={24} />
				</div>
				<span>InoBag</span>
			</div>
			<div class="search-bar">
				<Search size={20} />
				<input type="text" placeholder="Buscar produtos..." bind:value={searchQuery} />
			</div>
		</div>
	</header>

	<div class="app-container">
		{#if sidebarOpen}
			<div class="sidebar-overlay" onclick={() => sidebarOpen = false}></div>
		{/if}
		
		<aside class="sidebar" class:open={sidebarOpen}>
			<div class="sidebar-header">
				Categorias
			</div>
			<div class="sidebar-menu">
				{#each categories as category}
					<button 
						class="category-button"
						class:active={selectedCategory === category.name}
						onclick={() => selectCategory(category.name)}
					>
						<svelte:component this={category.icon} size={20} />
						{category.name}
					</button>
				{/each}
			</div>
		</aside>

		<main class="main-content">
			<div class="products-header">
				<div class="products-title">{selectedCategory}</div>
				<div class="products-filter">
					<span>Ordenar por:</span>
					<span>Mais vendidos</span>
					<ChevronDown size={16} />
				</div>
			</div>
			
			<div class="products-grid">
				{#each filteredProducts as product (product.id)}
					<div class="product-card">
						<div class="product-image">
							<img src={product.image} alt={product.name} />
							{#if product.badge}
								<div class="product-badge">{product.badge}</div>
							{/if}
						</div>
						<div class="product-info">
							<div class="product-name">{product.name}</div>
							<div class="product-price">
								<span>R$ {product.price.toFixed(2).replace('.', ',')}</span>
								<button class="add-to-cart" onclick={() => addToCart(product)}>
									<Plus size={16} />
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>

			{#if cartItemsCount > 0}
				<div class="cart-bar">
					<div class="cart-info">
						<span class="cart-count">{cartItemsCount}</span>
						<span class="cart-total">R$ {cart.total.toFixed(2).replace('.', ',')}</span>
					</div>
					<button class="view-cart-button" onclick={goToCart}>
						Ver Carrinho
						<ArrowRight size={20} />
					</button>
				</div>
			{/if}
		</main>
	</div>
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
		padding: 1rem;
		position: sticky;
		top: 0;
		z-index: 10;
		box-shadow: var(--shadow-sm);
		flex-shrink: 0;
	}

	.header-container {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.mobile-menu-toggle {
		display: none;
		background: transparent;
		border: none;
		color: var(--primary-foreground);
		cursor: pointer;
		padding: 0.5rem;
		border-radius: var(--radius);
		min-height: 44px;
		min-width: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.mobile-menu-toggle:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 700;
		font-size: 1.25rem;
		white-space: nowrap;
		color: var(--primary-foreground);
	}

	.logo-icon {
		background: var(--bittersweet);
		border-radius: 12px;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: var(--shadow-sm);
	}

	.search-bar {
		background: rgba(255, 255, 255, 0.15);
		border-radius: var(--radius-lg);
		display: flex;
		align-items: center;
		padding: 0.75rem 1rem;
		gap: 0.75rem;
		flex: 1;
		transition: all 0.2s ease;
		border: 1px solid transparent;
	}

	.search-bar:focus-within {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.3);
		box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
	}

	.search-bar input {
		background: transparent;
		border: none;
		color: var(--primary-foreground);
		font-size: 1rem;
		width: 100%;
		outline: none;
	}

	.search-bar input::placeholder {
		color: var(--primary-foreground);
		opacity: 0.6;
	}

	.app-container {
		display: flex;
		flex: 1;
		overflow: hidden;
		position: relative;
	}

	.sidebar-overlay {
		display: none;
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 15;
	}

	.sidebar {
		width: 280px;
		background: var(--card);
		border-right: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		flex-shrink: 0;
	}

	.sidebar-header {
		padding: 1.5rem 1rem;
		border-bottom: 1px solid var(--border);
		font-weight: 600;
		font-size: 1.125rem;
		color: var(--primary);
		background: var(--card);
	}

	.sidebar-menu {
		padding: 1rem;
		background: var(--card);
	}

	.category-button {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		width: 100%;
		background: transparent;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		margin-bottom: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
		min-height: var(--touch-target);
		color: var(--foreground);
		font-weight: 500;
		font-size: 1rem;
	}

	.category-button:hover {
		background: var(--accent);
		border-color: var(--accent);
		transform: translateY(-2px);
	}

	.category-button.active {
		background: var(--primary);
		color: var(--primary-foreground);
		border-color: var(--primary);
	}

	.main-content {
		display: flex;
		flex: 1;
		flex-direction: column;
		overflow: hidden;
		background: var(--background);
	}

	.products-header {
		padding: 1rem;
		border-bottom: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: var(--card);
		flex-shrink: 0;
	}

	.products-title {
		font-weight: 600;
		font-size: 1.25rem;
		color: var(--foreground);
	}

	.products-filter {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--muted-foreground);
		font-size: 0.875rem;
		cursor: pointer;
	}

	.products-grid {
		flex: 1;
		padding: 1rem;
		overflow-y: auto;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
		align-content: start;
	}

	.product-card {
		background: var(--card);
		border-radius: var(--radius-lg);
		overflow: hidden;
		box-shadow: var(--shadow-sm);
		transition: all 0.2s ease;
		cursor: pointer;
		min-height: 260px;
		display: flex;
		flex-direction: column;
		border: 1px solid var(--border);
	}

	.product-card:hover {
		transform: translateY(-3px);
		box-shadow: var(--shadow-md);
		border-color: var(--accent);
	}

	.product-image {
		width: 100%;
		height: 160px;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden;
	}

	.product-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.product-badge {
		position: absolute;
		top: 10px;
		right: 10px;
		background: var(--bittersweet);
		color: white;
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-sm);
	}

	.product-info {
		padding: 1rem;
		flex: 1;
		display: flex;
		flex-direction: column;
		background: var(--card);
	}

	.product-name {
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: var(--foreground);
	}

	.product-price {
		color: var(--primary);
		font-weight: 700;
		font-size: 1.125rem;
		margin-top: auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.add-to-cart {
		background: var(--primary);
		color: var(--primary-foreground);
		border: none;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.add-to-cart:hover {
		transform: scale(1.1);
		background: var(--bittersweet);
	}

	.cart-bar {
		background: var(--card);
		border-top: 1px solid var(--border);
		padding: 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		position: sticky;
		bottom: 0;
		z-index: 10;
		flex-shrink: 0;
	}

	.cart-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.cart-count {
		background: var(--primary);
		color: var(--primary-foreground);
		padding: 0.25rem 0.75rem;
		border-radius: var(--radius);
		font-weight: 600;
		font-size: 0.875rem;
	}

	.cart-total {
		font-weight: 600;
		font-size: 1.125rem;
		color: var(--foreground);
	}

	.view-cart-button {
		background: var(--bittersweet);
		color: var(--primary-foreground);
		border: none;
		padding: 0.75rem 2rem;
		border-radius: var(--radius-lg);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-height: var(--touch-target);
		font-size: 1rem;
	}

	.view-cart-button:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	/* HD Portrait Display optimizations */
	@media (min-width: 768px) and (min-height: 1024px) {
		.products-grid {
			grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		}

		.product-card {
			min-height: 280px;
		}

		.product-image {
			height: 180px;
		}
	}

	/* Full HD Portrait (1080x1920) optimizations */
	@media (min-width: 1080px) and (min-height: 1920px) {
		.header {
			padding: 1.25rem;
		}

		.products-grid {
			grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
			gap: 1.5rem;
		}

		.product-card {
			min-height: 320px;
		}

		.product-image {
			height: 200px;
		}

		.sidebar {
			width: 320px;
		}
	}

	/* Mobile responsive adjustments */
	@media (max-width: 768px) {
		.mobile-menu-toggle {
			display: flex;
		}

		.app-container {
			position: relative;
		}

		.sidebar-overlay.open {
			display: block;
		}

		.sidebar {
			position: absolute;
			left: -280px;
			top: 0;
			bottom: 0;
			z-index: 20;
			transition: left 0.3s ease;
			width: 280px;
		}

		.sidebar.open {
			left: 0;
		}

		.products-grid {
			grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
			gap: 0.75rem;
		}

		.product-card {
			min-height: 220px;
		}

		.product-image {
			height: 120px;
		}

		.header {
			padding: 0.75rem 1rem;
		}

		.logo {
			font-size: 1.125rem;
		}
	}

	@media (max-width: 480px) {
		.products-grid {
			grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
			padding: 0.75rem;
		}

		.search-bar {
			padding: 0.5rem 0.75rem;
		}

		.cart-bar {
			padding: 0.75rem;
		}

		.view-cart-button {
			padding: 0.75rem 1.5rem;
			font-size: 0.875rem;
		}
	}
</style>