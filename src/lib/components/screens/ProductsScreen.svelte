<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { slide } from 'svelte/transition';
  import { Search, X, Plus, Menu, Coffee, Sandwich, Candy, Salad, Package, ImageOff } from 'lucide-svelte';
  import { visualSettingsService } from '../../services/visualSettings';
  import { productsService, type Product, type Category } from '../../services/products';
  import { cartService } from '../../services/cart';
  import { sessionService } from '../../services/session';
  import { errorDialogService } from '../../services/errorDialog';
  import ProductDialog from '../ui/ProductDialog.svelte';
  import VirtualKeyboard from '../ui/VirtualKeyboard.svelte';

  let settings: any = null;
  let categories: Category[] = [];
  let products: Product[] = [];
  let selectedCategory: number | null = null;
  let searchQuery = '';
  let isLoading = true;
  let isSearching = false;
  let isDrawerOpen = false; // Will be set based on screen size in onMount
  let selectedProduct: Product | null = null;
  let isProductDialogOpen = false;
  let cartCount = 0;
  let cartTotal = 0;
  let isVirtualKeyboardOpen = false;
  let searchInputRef: HTMLInputElement;

  // Session timeout handling
  let sessionTimeoutId: NodeJS.Timeout | null = null;
  let progressIntervalId: NodeJS.Timeout | null = null;
  let sessionStartTime = 0;
  let showProgressBar = false;
  let progressWidth = 100;
  const SESSION_TIMEOUT = 60000; // 60 seconds
  const PROGRESS_THRESHOLD = 11000; // Show progress bar when less than 11 seconds remain

  const categoryIcons = {
    'BEBIDAS': Coffee,
    'Destaques': Coffee,
    'CATEGORIA 2': Sandwich,
    'SNACKS': Candy,
    'LANCHES': Sandwich,
    'DOCES': Candy,
    'SAUDÁVEIS': Salad,
    'COMBOS': Package
  };

  onMount(async () => {
    try {
      // Load interface settings
      settings = await visualSettingsService.loadSettings();
      
      // Load categories
      categories = await productsService.getCategories();
      
      // Set default category (first available category)
      const defaultCategory = categories[0];
      if (defaultCategory) {
        selectedCategory = defaultCategory.categoryId;
        await loadProducts(selectedCategory);
      }

      // Initialize cart
      await cartService.initializeCart();
      await loadCartData();

      // Start session timeout
      startSessionTimeout();

      // Set initial sidebar state based on screen size
      updateSidebarStateForScreenSize();

      // Add resize listener to handle screen size changes
      window.addEventListener('resize', updateSidebarStateForScreenSize);

    } catch (error) {
      console.error('Failed to load products data:', error);
      errorDialogService.showError({
        title: 'Erro ao Carregar Produtos',
        message: 'Não foi possível carregar a lista de produtos. Tente novamente.',
        actions: [
          {
            label: 'Tentar Novamente',
            action: () => window.location.reload(),
            variant: 'primary'
          }
        ]
      });
    } finally {
      isLoading = false;
    }
  });

  onDestroy(() => {
    if (sessionTimeoutId) {
      clearTimeout(sessionTimeoutId);
    }
    if (progressIntervalId) {
      clearInterval(progressIntervalId);
    }
    // Remove resize listener
    window.removeEventListener('resize', updateSidebarStateForScreenSize);
  });

  async function loadProducts(categoryId: number) {
    try {
      isLoading = true;
      products = await productsService.getProducts(categoryId);
    } catch (error) {
      console.error('Failed to load products:', error);
      errorDialogService.showError({
        title: 'Erro ao Carregar Produtos',
        message: 'Não foi possível carregar os produtos desta categoria.',
        actions: [
          {
            label: 'Tentar Novamente',
            action: () => loadProducts(categoryId),
            variant: 'primary'
          }
        ]
      });
    } finally {
      isLoading = false;
    }
  }

  async function searchProducts(expression: string) {
    if (!expression.trim()) {
      if (selectedCategory) {
        await loadProducts(selectedCategory);
      }
      return;
    }

    try {
      isSearching = true;
      products = await productsService.searchProducts(expression);
    } catch (error) {
      console.error('Failed to search products:', error);
      errorDialogService.showError({
        title: 'Erro na Busca',
        message: 'Não foi possível realizar a busca. Tente novamente.',
        actions: [
          {
            label: 'Tentar Novamente',
            action: () => searchProducts(expression),
            variant: 'primary'
          }
        ]
      });
    } finally {
      isSearching = false;
    }
  }

  async function loadCartData() {
    try {
      const cart = await cartService.getCart();
      cartCount = cartService.getCartCount();
      cartTotal = cartService.getCartTotal();
    } catch (error) {
      console.warn('Failed to load cart data, using defaults:', error);
      // Initialize with default values if cart service fails
      cartCount = 0;
      cartTotal = 0;
    }
  }

  function handleCategorySelect(categoryId: number) {
    selectedCategory = categoryId;
    searchQuery = ''; // Clear search when selecting category
    loadProducts(categoryId);
    
    // Only close drawer on mobile devices
    if (window.innerWidth <= 768) {
      isDrawerOpen = false;
    }
    // On desktop, keep the sidebar open
  }

  function handleSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    searchQuery = target.value;
    
    if (searchQuery.trim()) {
      searchProducts(searchQuery);
    } else {
      // Clear search and reload default products
      if (selectedCategory) {
        loadProducts(selectedCategory);
      }
    }
  }

  function clearSearch() {
    searchQuery = '';
    if (selectedCategory) {
      loadProducts(selectedCategory);
    }
  }

  function openVirtualKeyboard() {
    isVirtualKeyboardOpen = true;
  }

  function closeVirtualKeyboard() {
    isVirtualKeyboardOpen = false;
    // Focus back to the search input if needed
    if (searchInputRef) {
      searchInputRef.focus();
    }
  }

  function handleVirtualKeyboardInput(event: CustomEvent<string>) {
    searchQuery = event.detail;
    
    if (searchQuery.trim()) {
      searchProducts(searchQuery);
    } else {
      // Clear search and reload default products
      if (selectedCategory) {
        loadProducts(selectedCategory);
      }
    }
  }

  function handleVirtualKeyboardEnter() {
    if (searchQuery.trim()) {
      searchProducts(searchQuery);
    }
    closeVirtualKeyboard();
  }

  function openProductDialog(product: Product) {
    selectedProduct = product;
    isProductDialogOpen = true;
  }

  function closeProductDialog() {
    isProductDialogOpen = false;
    selectedProduct = null;
  }

  async function refreshCartData() {
    try {
      await loadCartData();
    } catch (error) {
      console.warn('Failed to refresh cart data:', error);
    }
  }

  function toggleDrawer() {
    isDrawerOpen = !isDrawerOpen;
  }

  function updateSidebarStateForScreenSize() {
    // On desktop (769px+), keep sidebar open by default
    // On mobile (768px-), keep sidebar closed by default
    if (window.innerWidth > 768) {
      isDrawerOpen = true;
    } else {
      isDrawerOpen = false;
    }
  }

  function startSessionTimeout() {
    if (sessionTimeoutId) {
      clearTimeout(sessionTimeoutId);
    }
    if (progressIntervalId) {
      clearInterval(progressIntervalId);
    }
    
    sessionStartTime = Date.now();
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
        // Calculate progress width (100% to 0% over the last 11 seconds)
        progressWidth = Math.max(0, (remaining / PROGRESS_THRESHOLD) * 100);
      } else {
        showProgressBar = false;
        progressWidth = 100;
      }
    }, 100); // Update every 100ms for smooth animation
  }

  function resetSessionTimeout() {
    startSessionTimeout();
  }

  // Reset timeout on any user interaction
  function handleUserInteraction() {
    sessionService.resetTimeout();
    resetSessionTimeout();
  }

  function getCategoryIcon(categoryName: string) {
    const IconComponent = categoryIcons[categoryName] || Package;
    return IconComponent;
  }

  function formatPrice(price: number): string {
    return productsService.formatPrice(price);
  }

  function truncateName(name: string): string {
    return productsService.truncateName(name);
  }

  function getProductImage(product: Product): string {
    return productsService.getProductImage(product);
  }

  function hasValidImage(product: Product): boolean {
    return product.media && product.media.length > 0 && 
           (product.media[0].url || product.media[0].source);
  }

  // Subscribe to cart changes
  cartService.subscribe((cart) => {
    try {
      cartCount = cartService.getCartCount();
      cartTotal = cartService.getCartTotal();
      console.log('Cart updated:', { cartCount, cartTotal, cart });
    } catch (error) {
      console.warn('Failed to update cart data:', error);
      cartCount = 0;
      cartTotal = 0;
    }
  });
</script>

<svelte:window onclick={handleUserInteraction} onkeydown={handleUserInteraction} />

<div 
  class="products-screen" 
  style:background-color={settings?.background_color || 'var(--background)'}
  style:background-image={settings?.background_image ? `url(${settings.background_image})` : 'none'}
>
  <!-- Session Timeout Progress Bar -->
  {#if showProgressBar}
    <div class="timeout-progress-bar">
      <div class="progress-fill" style:width="{progressWidth}%"></div>
    </div>
  {/if}

  <!-- Header -->
  <header class="header" style:background-color={settings?.font_color || 'var(--primary)'}>
    <div class="header-content">
      <button class="mobile-menu-toggle" onclick={toggleDrawer} aria-label="Abrir menu">
        <Menu size={24} />
      </button>

      {#if settings?.logotype_image}
        <img src={settings.logotype_image} alt="Logo" class="header-logo" />
      {:else}
        <div class="header-logo-text">InoBag</div>
      {/if}
      
      <div class="search-bar">
        <button class="keyboard-button" onclick={openVirtualKeyboard} aria-label="Abrir teclado virtual">
          <Search size={20} />
        </button>
        <input 
          bind:this={searchInputRef}
          type="text" 
          placeholder="Buscar produtos..." 
          value={searchQuery}
          oninput={handleSearch}
          onclick={openVirtualKeyboard}
        />
        {#if searchQuery}
          <button class="clear-search" onclick={clearSearch} aria-label="Limpar busca">
            <X size={16} />
          </button>
        {/if}
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <div class="main-content" class:sidebar-open={isDrawerOpen}>
    <!-- Sidebar Overlay for Mobile -->
    {#if isDrawerOpen}
      <div class="sidebar-overlay" onclick={toggleDrawer}></div>
    {/if}

    <!-- Categories Sidebar -->
    {#if isDrawerOpen}
      <aside class="sidebar">
        <div class="sidebar-header">
          <h3>Categorias</h3>
        </div>
        <div class="categories">
          {#each categories as category}
            {@const IconComponent = getCategoryIcon(category.name)}
            <button 
              class="category-button"
              class:active={selectedCategory === category.categoryId}
              onclick={() => handleCategorySelect(category.categoryId)}
            >
              <IconComponent size={20} />
              {category.name}
            </button>
          {/each}
        </div>
      </aside>
    {/if}

    <!-- Products Area -->
    <main class="products-area">
      <div class="products-header">
        <h2 class="products-title">
          {categories.find(c => c.categoryId === selectedCategory)?.name || 'Produtos'}
        </h2>
        {#if isSearching}
          <div class="search-indicator">Buscando...</div>
        {/if}
      </div>
      
      <div class="products-grid">
        {#if isLoading}
          {#each Array(6) as _}
            <div class="product-card skeleton">
              <div class="product-image skeleton"></div>
              <div class="product-info">
                <div class="product-name skeleton"></div>
                <div class="product-price skeleton"></div>
              </div>
            </div>
          {/each}
        {:else if !products || products.length === 0}
          <div class="no-products">
            <Package size={48} />
            <h3>Nenhum produto encontrado</h3>
            <p>Tente uma busca diferente ou selecione outra categoria.</p>
          </div>
        {:else}
          {#each products || [] as product}
            <div class="product-card" onclick={() => openProductDialog(product)}>
              <div class="product-image">
                {#if hasValidImage(product)}
                  <img src={getProductImage(product)} alt={product.name || 'Produto'} />
                {:else}
                  <div class="no-image-placeholder">
                    <ImageOff size={32} />
                    <span>Imagem não disponível</span>
                  </div>
                {/if}
                {#if product.amount === 0}
                  <div class="product-badge out-of-stock">Esgotado</div>
                {/if}
              </div>
              <div class="product-info">
                <h3 class="product-name">{truncateName(product.name)}</h3>
                <div class="product-price">
                  <span>{formatPrice(product.price)}</span>
                  <button 
                    class="add-to-cart" 
                    onclick={async (e) => {
                      e.stopPropagation();
                      await cartService.addItem(product.itemId, product.type);
                      await refreshCartData();
                    }}
                    disabled={product.amount === 0}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </main>
  </div>

  <!-- Cart Summary Bar -->
  {#if cartCount > 0}
    <div class="cart-bar" transition:slide={{ duration: 400, axis: 'y' }}>
      <div class="cart-info">
        <span class="cart-count">({cartCount})</span>
        <span class="cart-total">{formatPrice(cartTotal)}</span>
      </div>
      <button class="view-cart-button" onclick={() => window.location.href = '/cart'}>
        Ver Carrinho
      </button>
    </div>
  {/if}
</div>

<!-- Product Dialog -->
<ProductDialog 
  bind:product={selectedProduct}
  bind:isOpen={isProductDialogOpen}
  on:close={closeProductDialog}
/>

<!-- Virtual Keyboard -->
<VirtualKeyboard 
  bind:isVisible={isVirtualKeyboardOpen}
  bind:value={searchQuery}
  on:input={handleVirtualKeyboardInput}
  on:enter={handleVirtualKeyboardEnter}
  on:close={closeVirtualKeyboard}
/>

<style>
  .products-screen {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }

  /* Session Timeout Progress Bar */
  .timeout-progress-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    z-index: 1000;
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
  
  .header {
    padding: 1rem;
    color: white;
    position: sticky;
    top: 0;
    z-index: 10;
    box-shadow: var(--shadow-sm);
  }
  
  .header-content {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .mobile-menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: var(--radius);
    transition: all 0.2s ease;
    min-height: 44px;
    min-width: 44px;
  }

  .mobile-menu-toggle:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .header-logo {
    height: 40px;
  }
  
  .header-logo-text {
    font-size: 1.5rem;
    font-weight: 700;
    white-space: nowrap;
  }
  
  .search-bar {
    flex: 1;
    background: rgba(255, 255, 255, 0.15);
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    gap: 0.75rem;
    transition: all 0.2s ease;
    border: 1px solid transparent;
  }

  .search-bar:focus-within {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  .search-bar input {
    background: transparent;
    border: none;
    color: white;
    font-size: 1rem;
    width: 100%;
    outline: none;
  }
  
  .search-bar input::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

  .clear-search {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 50%;
    transition: all 0.2s ease;
  }

  .clear-search:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .keyboard-button {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 50%;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
    min-height: 2rem;
  }

  .keyboard-button:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    transform: scale(1.05);
  }
  
  .main-content {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
    transition: all 0.3s ease;
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
    background: white;
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    flex-shrink: 0;
  }

  .sidebar-header {
    padding: 1.5rem 1rem;
    border-bottom: 1px solid var(--border);
  }

  .sidebar-header h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0;
    color: var(--primary);
  }
  
  .categories {
    padding: 1rem;
    flex: 1;
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
    min-height: 44px;
    color: var(--foreground);
    font-weight: 500;
  }
  
  .category-button:hover {
    background: var(--accent);
    border-color: var(--accent);
    transform: translateY(-2px);
  }
  
  .category-button.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }
  
  .products-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .products-header {
    padding: 1rem 2rem;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .products-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }

  .search-indicator {
    color: var(--muted-foreground);
    font-size: 0.875rem;
    font-style: italic;
  }
  
  .products-grid {
    flex: 1;
    padding: 1rem 2rem;
    display: grid;
    grid-template-columns: repeat(2, 1fr); /* Default: 2 items per row when sidebar is open */
    gap: 1rem;
    overflow-y: auto;
    align-content: start;
  }

  /* When sidebar is closed, show 3 items per row */
  .main-content:not(.sidebar-open) .products-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .no-products {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    text-align: center;
    color: var(--muted-foreground);
  }

  .no-products h3 {
    margin: 1rem 0 0.5rem 0;
    color: var(--foreground);
  }

  .no-products p {
    margin: 0;
  }
  
  .product-card {
    background: white;
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
    position: relative;
    overflow: hidden;
    background: var(--muted, #f1f5f9);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .product-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    max-width: 100%;
    max-height: 100%;
    display: block;
  }

  /* No image placeholder */
  .no-image-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: var(--muted-foreground, #64748b);
    text-align: center;
    padding: 1rem;
  }

  .no-image-placeholder span {
    font-size: 0.875rem;
    margin-top: 0.5rem;
    font-weight: 500;
  }

  .product-image img {
    position: relative;
    z-index: 2;
  }
  
  .product-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-sm);
  }

  .product-badge.out-of-stock {
    background: var(--error);
    color: white;
  }
  
  .product-info {
    padding: 1rem;
    flex: 1;
    display: flex;
    flex-direction: column;
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
    color: white;
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
  
  .add-to-cart:hover:not(:disabled) {
    transform: scale(1.1);
    background: var(--bittersweet);
  }

  .add-to-cart:disabled {
    background: var(--muted);
    color: var(--muted-foreground);
    cursor: not-allowed;
    transform: none;
  }
  
  .cart-bar {
    background: white;
    border-top: 1px solid var(--border);
    padding: 1rem 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    bottom: 0;
    z-index: 10;
  }
  
  .cart-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .cart-count {
    background: var(--primary);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius);
    font-weight: 600;
  }
  
  .cart-total {
    font-weight: 600;
    font-size: 1.125rem;
  }
  
  .view-cart-button {
    background: var(--bittersweet);
    color: white;
    border: none;
    padding: 1rem 2.5rem;
    border-radius: var(--radius-lg);
    font-weight: 600;
    font-size: 1.125rem;
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .view-cart-button:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
  
  /* Skeleton loading styles */
  .skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }
  
  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
  
  .skeleton.product-name {
    height: 1.2rem;
    width: 80%;
    margin-bottom: 0.5rem;
  }
  
  .skeleton.product-price {
    height: 1.5rem;
    width: 60%;
    margin-top: auto;
  }
  
  /* Responsive design */
  @media (max-width: 768px) {

    .header {
      padding: 1rem;
    }
    
    .main-content {
      flex-direction: column;
    }
    
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      z-index: 20;
      width: 280px;
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }

    /* Show sidebar when open on mobile */
    .main-content.sidebar-open .sidebar {
      transform: translateX(0);
    }

    .sidebar-overlay {
      display: block;
    }
    
    .products-area {
      order: 1;
    }
    
    .products-grid {
      grid-template-columns: repeat(2, 1fr); /* 2 items per row on mobile */
      padding: 1rem;
    }

    .product-image {
      height: 120px; /* Smaller for mobile */
    }

    .product-card {
      min-height: 220px; /* Smaller for mobile */
    }
    
    .cart-bar {
      padding: 1rem;
    }

    .view-cart-button {
      padding: 0.875rem 2rem;
      font-size: 1rem;
      min-height: 44px;
    }
  }

  @media (max-width: 1024px) {
    .products-grid {
      grid-template-columns: repeat(2, 1fr); /* 2 items per row on smaller screens when sidebar is open */
    }
    
    /* When sidebar is closed on smaller screens, show 3 items per row */
    .main-content:not(.sidebar-open) .products-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  /* HD (1280x720) and above - maintain 200x160 ratio */
  @media (min-width: 1280px) {
    .product-image {
      height: 160px;
    }
    
    .product-card {
      min-height: 260px;
    }
    
    .products-grid {
      grid-template-columns: repeat(2, 1fr); /* 2 items per row when sidebar is open */
    }
    
    /* When sidebar is closed, show 3 items per row */
    .main-content:not(.sidebar-open) .products-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  /* Full HD (1920x1080) and above - proportional scaling */
  @media (min-width: 1920px) {
    .products-grid {
      grid-template-columns: repeat(2, 1fr); /* 2 items per row when sidebar is open */
      max-width: 1920px;
      margin: 0 auto;
    }
    
    /* When sidebar is closed, show 3 items per row */
    .main-content:not(.sidebar-open) .products-grid {
      grid-template-columns: repeat(3, 1fr);
    }
    
    .product-image {
      height: 200px; /* Proportional increase for Full HD */
    }
    
    .product-card {
      min-height: 320px; /* Proportional increase for Full HD */
    }
  }
</style>