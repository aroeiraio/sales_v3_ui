<script lang="ts">
  import { onMount } from 'svelte';
  import { visualSettingsService } from '../../services/visualSettings';
  import { productsService } from '../../services/products';
  import { cartService } from '../../services/cart';
  import { errorDialogService } from '../../services/errorDialog';
  import { Search, Plus, Coffee, Sandwich, Candy, Salad, Package } from 'lucide-svelte';

  let settings: any = null;
  let categories: any[] = [];
  let products: any[] = [];
  let selectedCategory: string | null = null;
  let searchQuery = '';
  let isLoading = true;

  const categoryIcons = {
    'bebidas': Coffee,
    'lanches': Sandwich,
    'doces': Candy,
    'saudaveis': Salad,
    'combos': Package
  };

  onMount(async () => {
    try {
      settings = await visualSettingsService.loadSettings();
      categories = await productsService.getCategories();
      if (categories.length > 0) {
        selectedCategory = categories[0].id;
        await loadProducts(selectedCategory);
      }
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

  async function loadProducts(categoryId: string) {
    try {
      products = await productsService.getProductsByCategory(categoryId);
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
    }
  }

  async function addToCart(product: any) {
    try {
      await cartService.addItem(product.id, 1);
    } catch (error) {
      // Error handling is done in cartService
    }
  }

  function handleCategorySelect(categoryId: string) {
    selectedCategory = categoryId;
    loadProducts(categoryId);
  }

  function handleSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    searchQuery = target.value;
    // Implement search logic
  }
</script>

<div class="products-screen" style:background-color={settings?.background_color || 'var(--fallback-bg)'}>
  <header class="header" style:background-color={settings?.font_color || 'var(--fallback-primary)'}>
    <div class="header-content">
      {#if settings?.logotype_image}
        <img src={settings.logotype_image} alt="Logo" class="header-logo" />
      {:else}
        <div class="header-logo-text">InoBag</div>
      {/if}
      
      <div class="search-bar">
        <Search size={20} />
        <input 
          type="text" 
          placeholder="Buscar produtos..." 
          value={searchQuery}
          on:input={handleSearch}
        />
      </div>
    </div>
  </header>

  <div class="main-content">
    <aside class="sidebar">
      <h3 class="sidebar-title">Categorias</h3>
      <div class="categories">
        {#each categories as category}
          {@const IconComponent = categoryIcons[category.id] || Package}
          <button 
            class="category-button"
            class:active={selectedCategory === category.id}
            on:click={() => handleCategorySelect(category.id)}
          >
            <IconComponent size={20} />
            {category.name}
          </button>
        {/each}
      </div>
    </aside>

    <main class="products-area">
      <div class="products-header">
        <h2 class="products-title">
          {categories.find(c => c.id === selectedCategory)?.name || 'Produtos'}
        </h2>
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
        {:else}
          {#each products as product}
            <div class="product-card">
              <div class="product-image">
                <img src={product.image || 'https://placehold.co/200x160'} alt={product.name} />
                {#if product.badge}
                  <div class="product-badge">{product.badge}</div>
                {/if}
              </div>
              <div class="product-info">
                <h3 class="product-name">{product.name}</h3>
                <div class="product-price">
                  <span>R$ {product.price.toFixed(2).replace('.', ',')}</span>
                  <button class="add-to-cart" on:click={() => addToCart(product)}>
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

  <div class="cart-bar">
    <div class="cart-info">
      <span class="cart-count">{cartService.getCartCount()}</span>
      <span class="cart-total">R$ {cartService.getCartTotal().toFixed(2).replace('.', ',')}</span>
    </div>
    <button class="view-cart-button" on:click={() => window.location.href = '/cart'}>
      Ver Carrinho
    </button>
  </div>
</div>

<style>
  .products-screen {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  .header {
    padding: 1rem 2rem;
    color: white;
  }
  
  .header-content {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .header-logo {
    height: 40px;
  }
  
  .header-logo-text {
    font-size: 1.5rem;
    font-weight: 700;
  }
  
  .search-bar {
    flex: 1;
    background: rgba(255, 255, 255, 0.15);
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    gap: 0.75rem;
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
  
  .main-content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }
  
  .sidebar {
    width: 280px;
    background: white;
    border-right: 1px solid var(--border);
    padding: 1.5rem 1rem;
  }
  
  .sidebar-title {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--primary);
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
  }
  
  .products-title {
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .products-grid {
    flex: 1;
    padding: 1rem 2rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    overflow-y: auto;
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
  }
  
  .product-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);
  }
  
  .product-image {
    width: 100%;
    height: 160px;
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
  }
  
  .product-name {
    font-weight: 600;
    margin-bottom: 0.5rem;
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
  
  .add-to-cart:hover {
    transform: scale(1.1);
    background: var(--bittersweet);
  }
  
  .cart-bar {
    background: white;
    border-top: 1px solid var(--border);
    padding: 1rem 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
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
    padding: 0.75rem 2rem;
    border-radius: var(--radius-lg);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 44px;
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
      width: 100%;
      order: 2;
    }
    
    .products-area {
      order: 1;
    }
    
    .products-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      padding: 1rem;
    }
    
    .cart-bar {
      padding: 1rem;
    }
  }
</style>

