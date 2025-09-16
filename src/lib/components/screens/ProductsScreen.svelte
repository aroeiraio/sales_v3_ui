<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { slide } from 'svelte/transition';
  import { Search, X, Plus, Menu, Package, ImageOff, HelpCircle } from 'lucide-svelte';
  import { visualSettingsService } from '../../services/visualSettings';
  import { productsService, type Product, type Category } from '../../services/products';
  import { cartService } from '../../services/cart';
  import { sessionService } from '../../services/session';
  import { errorDialogService } from '../../services/errorDialog';
  import { toastService } from '../../services/toast';
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
  let currentTime = '';

  // Session timeout handling
  let sessionTimeoutId: NodeJS.Timeout | null = null;
  let progressIntervalId: NodeJS.Timeout | null = null;
  let sessionStartTime = 0;
  let showProgressBar = false;
  let showTimeoutDialog = false;
  let progressWidth = 100;
  const SESSION_TIMEOUT = 60000; // 60 seconds
  const PROGRESS_THRESHOLD = 11000; // Show progress bar when less than 11 seconds remain


  onMount(async () => {
    try {
      // Load interface settings
      settings = await visualSettingsService.loadSettings();
      
      // Initialize time display
      function updateTime() {
        currentTime = new Date().toLocaleTimeString('pt-BR');
      }
      updateTime();
      const timeInterval = setInterval(updateTime, 1000);
      
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

      // Cleanup on component destroy
      return () => {
        clearInterval(timeInterval);
        window.removeEventListener('resize', updateSidebarStateForScreenSize);
      };

    } catch (error) {
      console.error('Failed to load products data:', error);
      errorDialogService.showError({
        title: 'Erro ao Carregar Produtos',
        message: 'Não foi possível carregar a lista de produtos.',
        actions: [
          {
            label: 'Fechar',
            action: () => {},
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
            label: 'Fechar',
            action: () => {},
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
        message: 'Não foi possível realizar a busca.',
        actions: [
          {
            label: 'Fechar',
            action: () => {},
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
    showTimeoutDialog = false;
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

  // Reset timeout on any user interaction
  function handleUserInteraction() {
    sessionService.resetTimeout();
    resetSessionTimeout();
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
  <!-- Abstract Background Pattern -->
  <div class="abstract-background">
    <div class="floating-shape shape-1"></div>
    <div class="floating-shape shape-2"></div>
    <div class="floating-shape shape-3"></div>
    <div class="floating-shape shape-4"></div>
    <div class="floating-shape shape-5"></div>
    <div class="floating-shape shape-6"></div>
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

  <!-- Header -->
  <header class="header" style:background-color={settings?.font_color || 'var(--primary)'}>
    <div class="header-content">
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
      
      <!-- Clock -->
      <div class="header-clock">
        <div class="clock-display">{currentTime}</div>
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
            <button 
              class="category-button"
              class:active={selectedCategory === category.categoryId}
              onclick={() => handleCategorySelect(category.categoryId)}
            >
              <span class="category-name">{category.name}</span>
            </button>
          {/each}
        </div>
      </aside>
    {/if}

    <!-- Products Area -->
    <main class="products-area">
      <div class="products-header">
        <div class="products-header-left">
          <button class="menu-toggle" onclick={toggleDrawer} aria-label="Abrir/fechar menu">
            <Menu size={20} />
          </button>
          <h2 class="products-title">
            {categories.find(c => c.categoryId === selectedCategory)?.name || 'Produtos'}
          </h2>
        </div>
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
              {#if product.amount === 0}
                <div class="product-badge out-of-stock">Esgotado</div>
              {/if}
              <div class="product-image">
                {#if hasValidImage(product)}
                  <img src={getProductImage(product)} alt={product.name || 'Produto'} />
                {:else}
                  <div class="no-image-placeholder">
                    <ImageOff size={32} />
                    <span>Imagem não disponível</span>
                  </div>
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
        <span class="cart-count">{cartCount}</span>
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
    position: relative;
    overflow: hidden;
  }

  /* Abstract Background Shapes */
  .abstract-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    pointer-events: none;
    overflow: hidden;
  }

  .floating-shape {
    position: absolute;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(0, 129, 167, 0.08), rgba(0, 175, 185, 0.12));
    animation: float 20s infinite ease-in-out;
    backdrop-filter: blur(1px);
  }

  .shape-1 {
    width: 120px;
    height: 120px;
    top: 10%;
    left: 80%;
    animation-delay: 0s;
  }

  .shape-2 {
    width: 80px;
    height: 80px;
    top: 60%;
    left: 5%;
    animation-delay: -5s;
    border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
  }

  .shape-3 {
    width: 200px;
    height: 200px;
    top: 30%;
    right: 85%;
    animation-delay: -10s;
    opacity: 0.6;
  }

  .shape-4 {
    width: 60px;
    height: 60px;
    bottom: 20%;
    right: 15%;
    animation-delay: -15s;
    border-radius: 63% 37% 54% 46% / 55% 48% 52% 45%;
  }

  .shape-5 {
    width: 140px;
    height: 140px;
    bottom: 40%;
    left: 75%;
    animation-delay: -8s;
    opacity: 0.4;
  }

  .shape-6 {
    width: 100px;
    height: 100px;
    top: 80%;
    left: 40%;
    animation-delay: -12s;
    border-radius: 38% 62% 63% 37% / 70% 33% 67% 30%;
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px) rotate(0deg);
      opacity: 0.3;
    }
    33% {
      transform: translateY(-30px) rotate(120deg);
      opacity: 0.6;
    }
    66% {
      transform: translateY(-60px) rotate(240deg);
      opacity: 0.4;
    }
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

  /* Timeout Dialog Styles */
  .timeout-dialog-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.3s ease-out;
  }

  .timeout-dialog {
    background: white;
    border-radius: var(--radius-lg);
    padding: 2rem;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.3s ease-out;
    max-width: 400px;
    width: 90%;
  }

  .dialog-icon {
    color: var(--primary);
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
  
  .header {
    padding: 1rem;
    color: white;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: var(--shadow-sm);
    backdrop-filter: blur(10px);
    background: rgba(0, 129, 167, 0.95);
  }
  
  .header-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: space-between;
  }

  .header-clock {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .clock-display {
    font-size: 0.875rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
    text-align: center;
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
    height: 50px;
    margin-right: 1rem;
  }
  
  .header-logo-text {
    font-size: 1.75rem;
    font-weight: 700;
    white-space: nowrap;
    margin-right: 1rem;
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
    background: rgba(255, 255, 255, 0.7);
    border-right: 1px solid rgba(226, 232, 240, 0.5);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    flex-shrink: 0;
    backdrop-filter: blur(16px);
    z-index: 50;
  }

  .sidebar-header {
    padding: 1.5rem 1rem 1rem 1rem;
    border-bottom: 1px solid rgba(226, 232, 240, 0.4);
    background: rgba(245, 245, 245, 0.3);
    backdrop-filter: blur(8px);
    height: 72px;
    display: flex;
    align-items: center;
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
    background: rgba(248, 250, 252, 0.4);
    backdrop-filter: blur(4px);
  }
  
  .category-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.875rem 1rem;
    width: 100%;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(226, 232, 240, 0.8);
    border-radius: 0.5rem;
    margin-bottom: 0.625rem;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    min-height: 44px;
    color: var(--foreground);
    font-weight: 500;
    font-size: 0.95rem;
    backdrop-filter: blur(8px);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .category-name {
    text-align: center;
  }
  
  .category-button:hover {
    background: rgba(255, 255, 255, 0.95);
    border-color: rgba(0, 129, 167, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .category-button.active {
    background: rgba(0, 129, 167, 0.9);
    color: white;
    border-color: rgba(0, 129, 167, 0.8);
    box-shadow: 0 2px 8px rgba(0, 129, 167, 0.2);
    backdrop-filter: blur(12px);
  }

  .category-button.active:hover {
    background: rgba(0, 129, 167, 0.95);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0, 129, 167, 0.3);
  }
  
  .products-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 10;
    position: relative;
  }
  
  .products-header {
    padding: 1.5rem 2rem 1rem 2rem;
    border-bottom: 1px solid rgba(226, 232, 240, 0.4);
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 72px;
  }

  .products-header-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--foreground);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: var(--radius);
    transition: all 0.2s ease;
    min-height: 36px;
    min-width: 36px;
  }

  .menu-toggle:hover {
    background: var(--muted);
    border-color: var(--accent);
  }

  .menu-toggle:active {
    transform: scale(0.95);
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
    background: rgba(255, 255, 255, 0.95);
    border-radius: 0.75rem;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.08);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    min-height: 280px;
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(226, 232, 240, 0.6);
    backdrop-filter: blur(10px);
    position: relative;
  }
  
  .product-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: rgba(0, 129, 167, 0.3);
    background: rgba(255, 255, 255, 0.98);
  }
  
  .product-image {
    width: calc(100% - 1.5rem);
    height: 160px;
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(248, 250, 252, 0.8), rgba(241, 245, 249, 0.9));
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0.75rem 0.75rem 0;
    border-radius: 0.5rem;
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
    top: 8px;
    right: 8px;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.375rem 0.75rem;
    border-radius: var(--radius-sm);
    z-index: 10;
  }

  .product-badge.out-of-stock {
    background: var(--error);
    color: white;
  }
  
  .product-info {
    padding: 1.25rem 1.25rem 1rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(8px);
  }
  
  .product-name {
    font-weight: 600;
    margin-bottom: 0.75rem;
    color: var(--foreground);
    font-size: 1rem;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
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
    background: linear-gradient(135deg, var(--primary), rgba(0, 129, 167, 0.8));
    color: white;
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 129, 167, 0.2);
  }
  
  .add-to-cart:hover:not(:disabled) {
    transform: translateY(-1px) scale(1.05);
    background: linear-gradient(135deg, rgba(0, 129, 167, 0.9), var(--primary));
    box-shadow: 0 4px 16px rgba(0, 129, 167, 0.3);
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
    padding: 1rem 2rem;
    border-radius: var(--radius);
    font-weight: 600;
    font-size: 1.125rem;
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 48px;
    min-width: 250px;
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

    .header-content {
      gap: 0.5rem;
    }

    .header-logo {
      height: 40px;
      margin-right: 0.5rem;
    }

    .header-logo-text {
      font-size: 1.5rem;
      margin-right: 0.5rem;
    }

    .clock-display {
      font-size: 0.75rem;
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