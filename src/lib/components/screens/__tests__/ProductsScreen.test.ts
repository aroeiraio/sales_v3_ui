import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { vi } from 'vitest';
import ProductsScreen from '../ProductsScreen.svelte';
import { visualSettingsService } from '../../../services/visualSettings';
import { productsService } from '../../../services/products';
import { cartService } from '../../../services/cart';
import { errorDialogService } from '../../../services/errorDialog';

// Mock all services
vi.mock('../../../services/visualSettings');
vi.mock('../../../services/products');
vi.mock('../../../services/cart');
vi.mock('../../../services/errorDialog');

describe('ProductsScreen', () => {
  const mockCategories = [
    { id: 'bebidas', name: 'Bebidas' },
    { id: 'lanches', name: 'Lanches' },
    { id: 'doces', name: 'Doces' }
  ];

  const mockProducts = [
    { 
      id: '1', 
      name: 'Café Expresso', 
      price: 5.00, 
      image: '/media/coffee.jpg',
      badge: 'Popular'
    },
    { 
      id: '2', 
      name: 'Cappuccino', 
      price: 7.50, 
      image: '/media/cappuccino.jpg'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    (visualSettingsService.loadSettings as any).mockResolvedValue({});
    (productsService.getCategories as any).mockResolvedValue(mockCategories);
    (productsService.getProductsByCategory as any).mockResolvedValue(mockProducts);
    (cartService.getCartCount as any).mockReturnValue(0);
    (cartService.getCartTotal as any).mockReturnValue(0);
    (cartService.addItem as any).mockResolvedValue({});
  });

  describe('Initial Load', () => {
    it('should render products when loaded successfully', async () => {
      render(ProductsScreen);
      
      await waitFor(() => {
        expect(screen.getByText('Café Expresso')).toBeInTheDocument();
        expect(screen.getByText('Cappuccino')).toBeInTheDocument();
        expect(screen.getByText('R$ 5,00')).toBeInTheDocument();
        expect(screen.getByText('R$ 7,50')).toBeInTheDocument();
      });
    });

    it('should render categories in sidebar', async () => {
      render(ProductsScreen);
      
      await waitFor(() => {
        expect(screen.getByText('Bebidas')).toBeInTheDocument();
        expect(screen.getByText('Lanches')).toBeInTheDocument();
        expect(screen.getByText('Doces')).toBeInTheDocument();
      });
    });

    it('should show loading skeleton initially', async () => {
      // Delay the mock response to test loading state
      (productsService.getProductsByCategory as any).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockProducts), 100))
      );

      render(ProductsScreen);
      
      // Should show skeleton loading
      expect(screen.getByText('Café Expresso')).not.toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Café Expresso')).toBeInTheDocument();
      });
    });
  });

  describe('Visual Settings Integration', () => {
    it('should apply custom visual settings when available', async () => {
      const mockSettings = {
        background_color: '#ff0000',
        font_color: '#ffffff',
        logotype_image: '/media/logo.png'
      };

      (visualSettingsService.loadSettings as any).mockResolvedValue(mockSettings);

      render(ProductsScreen);
      
      await waitFor(() => {
        const logo = screen.getByAltText('Logo');
        expect(logo).toHaveAttribute('src', '/media/logo.png');
      });
    });

    it('should show fallback logo when no custom logo is provided', async () => {
      (visualSettingsService.loadSettings as any).mockResolvedValue({
        logotype_image: null
      });

      render(ProductsScreen);
      
      await waitFor(() => {
        expect(screen.getByText('InoBag')).toBeInTheDocument();
      });
    });
  });

  describe('Category Selection', () => {
    it('should load products when category is selected', async () => {
      render(ProductsScreen);
      
      await waitFor(() => {
        const lanchesButton = screen.getByText('Lanches');
        fireEvent.click(lanchesButton);
      });

      expect(productsService.getProductsByCategory).toHaveBeenCalledWith('lanches');
    });

    it('should highlight active category', async () => {
      render(ProductsScreen);
      
      await waitFor(() => {
        const bebidasButton = screen.getByText('Bebidas');
        expect(bebidasButton).toHaveClass('active');
      });
    });
  });

  describe('Product Interaction', () => {
    it('should add product to cart when add button is clicked', async () => {
      render(ProductsScreen);
      
      await waitFor(() => {
        const addButtons = screen.getAllByRole('button', { name: /add/i });
        fireEvent.click(addButtons[0]);
      });

      expect(cartService.addItem).toHaveBeenCalledWith('1', 1);
    });

    it('should show product badges when available', async () => {
      render(ProductsScreen);
      
      await waitFor(() => {
        expect(screen.getByText('Popular')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should update search query when user types', async () => {
      render(ProductsScreen);
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Buscar produtos...');
        fireEvent.input(searchInput, { target: { value: 'café' } });
      });

      expect(screen.getByDisplayValue('café')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should show error dialog when categories fail to load', async () => {
      (productsService.getCategories as any).mockRejectedValue(new Error('Network error'));

      render(ProductsScreen);
      
      await waitFor(() => {
        expect(errorDialogService.showError).toHaveBeenCalledWith({
          title: 'Erro ao Carregar Produtos',
          message: 'Não foi possível carregar a lista de produtos. Tente novamente.',
          actions: [
            {
              label: 'Tentar Novamente',
              action: expect.any(Function),
              variant: 'primary'
            }
          ]
        });
      });
    });

    it('should show error dialog when products fail to load', async () => {
      (productsService.getProductsByCategory as any).mockRejectedValue(new Error('Network error'));

      render(ProductsScreen);
      
      await waitFor(() => {
        expect(errorDialogService.showError).toHaveBeenCalledWith({
          title: 'Erro ao Carregar Produtos',
          message: 'Não foi possível carregar os produtos desta categoria.',
          actions: [
            {
              label: 'Tentar Novamente',
              action: expect.any(Function),
              variant: 'primary'
            }
          ]
        });
      });
    });

    it('should show error dialog when visual settings fail to load', async () => {
      (visualSettingsService.loadSettings as any).mockRejectedValue(new Error('Settings error'));

      render(ProductsScreen);
      
      await waitFor(() => {
        expect(errorDialogService.showError).toHaveBeenCalledWith({
          title: 'Erro ao Carregar Produtos',
          message: 'Não foi possível carregar a lista de produtos. Tente novamente.',
          actions: [
            {
              label: 'Tentar Novamente',
              action: expect.any(Function),
              variant: 'primary'
            }
          ]
        });
      });
    });
  });

  describe('Cart Integration', () => {
    it('should display cart count and total', async () => {
      (cartService.getCartCount as any).mockReturnValue(3);
      (cartService.getCartTotal as any).mockReturnValue(15.50);

      render(ProductsScreen);
      
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('R$ 15,50')).toBeInTheDocument();
      });
    });

    it('should navigate to cart when view cart button is clicked', async () => {
      // Mock window.location.href
      delete (window as any).location;
      (window as any).location = { href: '' };

      render(ProductsScreen);
      
      await waitFor(() => {
        const viewCartButton = screen.getByText('Ver Carrinho');
        fireEvent.click(viewCartButton);
      });

      expect(window.location.href).toBe('/cart');
    });
  });

  describe('Responsive Design', () => {
    it('should render correctly on mobile viewport', async () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(ProductsScreen);
      
      await waitFor(() => {
        expect(screen.getByText('Café Expresso')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for buttons', async () => {
      render(ProductsScreen);
      
      await waitFor(() => {
        const addButtons = screen.getAllByRole('button');
        addButtons.forEach(button => {
          expect(button).toHaveAttribute('type');
        });
      });
    });

    it('should have proper alt text for images', async () => {
      render(ProductsScreen);
      
      await waitFor(() => {
        const images = screen.getAllByRole('img');
        images.forEach(img => {
          expect(img).toHaveAttribute('alt');
        });
      });
    });
  });

  describe('Performance', () => {
    it('should not make unnecessary API calls', async () => {
      render(ProductsScreen);
      
      await waitFor(() => {
        expect(productsService.getCategories).toHaveBeenCalledTimes(1);
        expect(productsService.getProductsByCategory).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle rapid category changes gracefully', async () => {
      render(ProductsScreen);
      
      await waitFor(() => {
        const lanchesButton = screen.getByText('Lanches');
        const docesButton = screen.getByText('Doces');
        
        fireEvent.click(lanchesButton);
        fireEvent.click(docesButton);
        fireEvent.click(lanchesButton);
      });

      // Should handle multiple rapid clicks without errors
      expect(productsService.getProductsByCategory).toHaveBeenCalled();
    });
  });
});

