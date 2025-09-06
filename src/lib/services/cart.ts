import { errorDialogService } from './errorDialog';
import { sessionService } from './session';
import { cart, cartActions } from '../stores/cart';

export interface CartItem {
  amount: number;
  categoryId: number;
  controlled: number;
  description: string;
  expiration: string;
  itemId: number;
  media: Array<{
    filename: string;
    pending: number;
    source: string;
    url: string;
  }>;
  name: string;
  price: number;
  quantity: number;
  saleLimit: number;
  subtotal: number;
  type: string;
  variantId: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  subtotal: number;
  serviceFee: number;
  discount: number;
}

class CartService {
  private cart: Cart = {
    items: [],
    total: 0,
    subtotal: 0,
    serviceFee: 0,
    discount: 0
  };

  private subscribers: ((cart: Cart) => void)[] = [];

  async getCart(): Promise<Cart> {
    try {
      const response = await fetch('http://localhost:8090/interface/cart');
      
      if (response.status === 404) {
        // Empty cart - return default empty cart
        this.cart = {
          items: [],
          total: 0,
          subtotal: 0,
          serviceFee: 0,
          discount: 0
        };
        this.notifySubscribers();
        return this.cart;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Cart API response:', data);
      
      // API returns array of items directly, we need to transform it
      this.cart = this.transformApiResponseToCart(data);
      this.notifySubscribers();
      return this.cart;
    } catch (error) {
      console.error('Failed to load cart:', error);
      // Return empty cart instead of throwing error
      this.cart = {
        items: [],
        total: 0,
        subtotal: 0,
        serviceFee: 0,
        discount: 0
      };
      this.notifySubscribers();
      return this.cart;
    }
  }

  async addItem(itemId: number, type: string = 'product', retryCount: number = 0): Promise<void> {
    try {
      const response = await fetch('http://localhost:8090/interface/cart/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          itemId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle specific error cases
        if (response.status === 404) {
          // Check if there's an error message in the response
          if (errorData.message && errorData.msg_code) {
            console.log('404 response with error:', errorData);
            
            // Handle specific error codes
            switch (errorData.msg_code) {
              case 'SALES_LIMIT_REACHED':
                errorDialogService.showError({
                  title: 'Limite de Compra Atingido',
                  message: errorData.message,
                  actions: [
                    {
                      label: 'Ver Carrinho',
                      action: () => window.location.href = '/cart',
                      variant: 'primary'
                    },
                    {
                      label: 'Continuar Comprando',
                      action: () => {
                        // Close the dialog by finding and closing it
                        const dialogs = errorDialogService.getDialogs();
                        if (dialogs.length > 0) {
                          errorDialogService.closeDialog(dialogs[dialogs.length - 1]);
                        }
                      },
                      variant: 'secondary'
                    }
                  ]
                });
                return;
              case 'CART_SESSION_NOT_OPENED':
                if (retryCount >= 1) {
                  console.error('Max retries reached for session creation (404)');
                  errorDialogService.showError({
                    title: 'Erro de Sessão',
                    message: 'Não foi possível criar uma sessão de compra após múltiplas tentativas.',
                    actions: [
                      {
                        label: 'Tentar Novamente',
                        action: () => this.addItem(itemId, type, 0),
                        variant: 'primary'
                      }
                    ]
                  });
                  return;
                }
                
                console.log('404: Session not opened, creating session and retrying');
                try {
                  await sessionService.startSession();
                  console.log('Session created, retrying add item');
                  // Retry adding the item after creating the session
                  return await this.addItem(itemId, type, retryCount + 1);
                } catch (sessionError) {
                  console.error('Failed to create session:', sessionError);
                  errorDialogService.showError({
                    title: 'Erro de Sessão',
                    message: 'Não foi possível criar uma sessão de compra. Tente novamente.',
                    actions: [
                      {
                        label: 'Tentar Novamente',
                        action: () => this.addItem(itemId, type, 0),
                        variant: 'primary'
                      }
                    ]
                  });
                  return;
                }
              default:
                // Show generic error for other 404 error codes
                errorDialogService.showError({
                  title: 'Erro ao Adicionar Item',
                  message: errorData.message,
                  actions: [
                    {
                      label: 'Tentar Novamente',
                      action: () => this.addItem(itemId, type, 0),
                      variant: 'primary'
                    }
                  ]
                });
                return;
            }
          } else {
            // Cart doesn't exist yet, but item was added - this is normal
            console.log('Cart created with new item');
            // Refresh cart data to get the updated cart
            await this.getCart();
            return;
          }
        }
        
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Add item API response:', data);
      
      // Check for specific error codes
      if (data.error) {
        switch (data.error.code) {
          case 'STOCK_UNAVAILABLE':
            console.log('Showing stock error dialog');
            errorDialogService.showCartError('stock');
            return;
          case 'MAX_ITEMS_REACHED':
            console.log('Showing limit error dialog');
            errorDialogService.showCartError('limit');
            return;
          case 'SALES_LIMIT_REACHED':
            console.log('Showing sales limit error dialog');
            errorDialogService.showError({
              title: 'Limite de Compra Atingido',
              message: data.error.message || 'Não é possível adicionar mais produtos. O limite de itens da compra foi alcançado.',
              actions: [
                {
                  label: 'Ver Carrinho',
                  action: () => window.location.href = '/cart',
                  variant: 'primary'
                },
                {
                  label: 'Continuar Comprando',
                  action: () => {
                    // Close the dialog by finding and closing it
                    const dialogs = errorDialogService.getDialogs();
                    if (dialogs.length > 0) {
                      errorDialogService.closeDialog(dialogs[dialogs.length - 1]);
                    }
                  },
                  variant: 'secondary'
                }
              ]
            });
            return;
          case 'CART_SESSION_NOT_OPENED':
            if (retryCount >= 1) {
              console.error('Max retries reached for session creation');
              errorDialogService.showError({
                title: 'Erro de Sessão',
                message: 'Não foi possível criar uma sessão de compra após múltiplas tentativas.',
                actions: [
                  {
                    label: 'Tentar Novamente',
                    action: () => this.addItem(itemId, type, 0),
                    variant: 'primary'
                  }
                ]
              });
              return;
            }
            
            console.log('Session not opened, creating session and retrying');
            try {
              await sessionService.startSession();
              console.log('Session created, retrying add item');
              // Retry adding the item after creating the session
              return await this.addItem(itemId, type, retryCount + 1);
            } catch (sessionError) {
              console.error('Failed to create session:', sessionError);
              errorDialogService.showError({
                title: 'Erro de Sessão',
                message: 'Não foi possível criar uma sessão de compra. Tente novamente.',
                actions: [
                  {
                    label: 'Tentar Novamente',
                    action: () => this.addItem(itemId, type, 0),
                    variant: 'primary'
                  }
                ]
              });
              return;
            }
          case 'PRODUCT_NOT_FOUND':
            errorDialogService.showError({
              title: 'Produto Não Encontrado',
              message: 'O produto selecionado não está mais disponível.',
              actions: [
                {
                  label: 'Atualizar Lista',
                  action: () => window.location.reload(),
                  variant: 'primary'
                }
              ]
            });
            return;
          default:
            throw new Error(data.error.message || 'Erro desconhecido');
        }
      }

      // Update local cart state
      if (data.cart) {
        this.cart = this.transformApiResponseToCart(data.cart);
      } else if (Array.isArray(data)) {
        this.cart = this.transformApiResponseToCart(data);
      } else {
        // Fallback: refresh cart data
        await this.getCart();
        return;
      }
      console.log('Cart updated after adding item:', this.cart);
      this.notifySubscribers();

      // Show success toast for 3 seconds
      if (data.message && data.msg_code === 'CART_ADDED_ITEM') {
        this.showToast(data.message, 3000);
      } else if (data.message) {
        this.showToast(data.message, 3000);
      } else {
        // Fallback success message
        this.showToast('Item adicionado ao carrinho com sucesso!', 3000);
      }

    } catch (error) {
      console.error('Failed to add item to cart:', error);
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        console.log('Showing network error dialog');
        errorDialogService.showNetworkError(() => this.addItem(itemId, type, 0));
      } else {
        console.log('Showing general error dialog');
        // Show modal with error message as per API specification
        errorDialogService.showError({
          title: 'Erro ao Adicionar Item',
          message: error.message || 'Não foi possível adicionar o item ao carrinho. Tente novamente.',
          actions: [
            {
              label: 'Tentar Novamente',
              action: () => this.addItem(itemId, type, 0),
              variant: 'primary'
            },
            {
              label: 'Ver Carrinho',
              action: () => window.location.href = '/cart',
              variant: 'secondary'
            }
          ]
        });
      }
    }
  }

  async removeItem(productId: string): Promise<void> {
    try {
      const response = await fetch('http://localhost:8090/interface/cart', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.cart) {
        this.cart = this.transformApiResponseToCart(data.cart);
      } else if (Array.isArray(data)) {
        this.cart = this.transformApiResponseToCart(data);
      }
      this.notifySubscribers();

      // Show success feedback
      errorDialogService.showInfo({
        title: 'Item Removido',
        message: 'Produto removido do carrinho.',
        autoClose: true,
        autoCloseDelay: 2000
      });

    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        errorDialogService.showNetworkError(() => this.removeItem(productId));
      } else {
        errorDialogService.showError({
          title: 'Erro ao Remover Item',
          message: 'Não foi possível remover o item do carrinho. Tente novamente.',
          actions: [
            {
              label: 'Tentar Novamente',
              action: () => this.removeItem(productId),
              variant: 'primary'
            }
          ]
        });
      }
    }
  }

  async updateQuantity(productId: string, newQuantity: number): Promise<void> {
    try {
      if (newQuantity <= 0) {
        await this.removeItem(productId);
        return;
      }

      const response = await fetch('http://localhost:8090/interface/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          quantity: newQuantity
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (errorData.error?.code === 'MAX_QUANTITY_EXCEEDED') {
          errorDialogService.showError({
            title: 'Quantidade Máxima Atingida',
            message: `Você pode adicionar no máximo ${errorData.error.maxQuantity} unidades deste produto.`,
            actions: [
              {
                label: 'OK',
                action: () => {},
                variant: 'primary'
              }
            ]
          });
          return;
        }
        
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.cart) {
        this.cart = this.transformApiResponseToCart(data.cart);
      } else if (Array.isArray(data)) {
        this.cart = this.transformApiResponseToCart(data);
      }
      this.notifySubscribers();

    } catch (error) {
      console.error('Failed to update quantity:', error);
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        errorDialogService.showNetworkError(() => this.updateQuantity(productId, newQuantity));
      } else {
        errorDialogService.showError({
          title: 'Erro ao Atualizar Quantidade',
          message: 'Não foi possível atualizar a quantidade do item. Tente novamente.',
          actions: [
            {
              label: 'Tentar Novamente',
              action: () => this.updateQuantity(productId, newQuantity),
              variant: 'primary'
            }
          ]
        });
      }
    }
  }

  async clearCart(): Promise<void> {
    try {
      const response = await fetch('http://localhost:8090/interface/cart', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.cart = {
        items: [],
        total: 0,
        subtotal: 0,
        serviceFee: 0,
        discount: 0
      };
      this.notifySubscribers();

    } catch (error) {
      console.error('Failed to clear cart:', error);
      errorDialogService.showError({
        title: 'Erro ao Limpar Carrinho',
        message: 'Não foi possível limpar o carrinho. Tente novamente.',
        actions: [
          {
            label: 'Tentar Novamente',
            action: () => this.clearCart(),
            variant: 'primary'
          }
        ]
      });
    }
  }

  getCartCount(): number {
    if (!this.cart || !this.cart.items) {
      return 0;
    }
    return this.cart.items.reduce((total, item) => total + (item.quantity || 0), 0);
  }

  getCartTotal(): number {
    return this.cart?.total || 0;
  }

  getCartItems(): CartItem[] {
    return this.cart?.items ? [...this.cart.items] : [];
  }

  // Initialize cart if it doesn't exist
  async initializeCart(): Promise<void> {
    try {
      await this.getCart();
    } catch (error) {
      console.warn('Failed to initialize cart:', error);
      // Cart will be created when first item is added
    }
  }


  subscribe(callback: (cart: Cart) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(): void {
    console.log('Notifying subscribers, cart:', this.cart, 'subscribers count:', this.subscribers.length);
    this.subscribers.forEach(callback => callback({ ...this.cart }));
  }

  private transformApiResponseToCart(apiResponse: any[]): Cart {
    // API returns array of items, last item contains total info
    const items = apiResponse.filter(item => item.itemId !== undefined);
    const totalInfo = apiResponse.find(item => item.total !== undefined);
    
    const total = totalInfo ? parseFloat(totalInfo.total) : 0;
    const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    
    return {
      items: items,
      total: total,
      subtotal: subtotal,
      serviceFee: 0,
      discount: 0
    };
  }

  private showToast(message: string, duration: number = 3000): void {
    console.log('Showing toast:', message, 'for', duration, 'ms');
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10B981;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-weight: 500;
      font-size: 14px;
      max-width: 300px;
      word-wrap: break-word;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease-out;
    `;

    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });

    // Remove toast after specified duration
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  // Validation methods
  validateCart(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.cart.items.length === 0) {
      errors.push('O carrinho está vazio');
    }

    for (const item of this.cart.items) {
      if (item.quantity <= 0) {
        errors.push(`Quantidade inválida para ${item.name}`);
      }
      
      if (item.maxQuantity && item.quantity > item.maxQuantity) {
        errors.push(`Quantidade máxima excedida para ${item.name}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Checkout validation
  async validateForCheckout(): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      const response = await fetch('http://localhost:8090/interface/cart/validate');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to validate cart for checkout:', error);
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        errorDialogService.showNetworkError(() => this.validateForCheckout());
      } else {
        errorDialogService.showError({
          title: 'Erro de Validação',
          message: 'Não foi possível validar o carrinho. Tente novamente.',
          actions: [
            {
              label: 'Tentar Novamente',
              action: () => this.validateForCheckout(),
              variant: 'primary'
            }
          ]
        });
      }
      
      return { isValid: false, errors: ['Erro de validação'] };
    }
  }
}

export const cartService = new CartService();
