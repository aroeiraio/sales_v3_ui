import { errorDialogService } from './errorDialog';
import { sessionService } from './session';
import { toastService } from './toast';
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
      const response = await fetch('http://localhost:8090/interface/cart/');
      
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
    console.log('🚀 addItem called with:', { itemId, type, retryCount });
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
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (jsonError) {
          console.log('Failed to parse error response as JSON:', jsonError);
          errorData = {};
        }
        
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
                        label: 'Fechar',
                        action: () => {},
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
                        label: 'Fechar',
                        action: () => {},
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
                      label: 'Fechar',
                      action: () => {},
                      variant: 'primary'
                    }
                  ]
                });
                return;
            }
          } else {
            // Cart doesn't exist yet, but item was added - this is normal
            console.log('🛒 Cart created with new item (404 without error data)');
            // Refresh cart data to get the updated cart
            await this.getCart();
            // Cart creation successful - no toast on early return
            console.log('✅ Cart created successfully');
            return;
          }
        }
        
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      let data: any = {};
      try {
        data = await response.json();
        console.log('Add item API response:', data);
        console.log('🔍 Successfully parsed response, proceeding to check for errors...');
      } catch (jsonError) {
        console.log('Failed to parse success response as JSON:', jsonError);
        // Refresh cart - no toast on parsing error
        await this.getCart();
        console.log('✅ Cart updated (response parsing failed)');
        return;
      }
      
      // Check for specific error codes
      console.log('🔍 Checking for errors in response data...');
      if (data.error) {
        console.log('❌ Found error in response:', data.error);
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
                    label: 'Fechar',
                    action: () => {},
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
                    label: 'Fechar',
                    action: () => {},
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
      console.log('🔍 No errors found, updating cart state...');
      if (data.cart) {
        console.log('🛒 Updating cart from data.cart');
        this.cart = this.transformApiResponseToCart(data.cart);
      } else if (Array.isArray(data)) {
        console.log('🛒 Updating cart from array data');
        this.cart = this.transformApiResponseToCart(data);
      } else {
        // Fallback: refresh cart data
        console.log('🛒 Fallback: refreshing cart data');
        await this.getCart();
      }
      console.log('Cart updated after adding item:', this.cart);
      this.notifySubscribers();

      // Show success toast for 3 seconds (always show on successful HTTP 200)
      console.log('🍞 HTTP 200 success - showing toast. Data:', data);
      
      if (data.message && data.msg_code === 'CART_ADDED_ITEM') {
        console.log('🍞 Showing toast with API message (CART_ADDED_ITEM)');
        toastService.showSuccess(data.message, 3000);
      } else if (data.message && !data.error) {
        console.log('🍞 Showing toast with API message (no error)');
        toastService.showSuccess(data.message, 3000);
      } else {
        // Always show success toast for HTTP 200, regardless of data content
        console.log('🍞 Showing default success toast for HTTP 200');
        toastService.showSuccess('Item adicionado ao carrinho com sucesso!', 3000);
      }

    } catch (error) {
      console.error('Failed to add item to cart:', error);
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        console.log('Showing network error dialog');
        errorDialogService.showNetworkError(() => {});
      } else {
        console.log('Showing general error dialog');
        // Show modal with error message as per API specification
        errorDialogService.showError({
          title: 'Erro ao Adicionar Item',
          message: error.message || 'Não foi possível adicionar o item ao carrinho. Tente novamente.',
          actions: [
            {
              label: 'Fechar',
              action: () => {},
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

  async removeItem(itemId: string): Promise<void> {
    try {
      const response = await fetch('http://localhost:8090/interface/cart/', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'product',
          itemId: parseInt(itemId)
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

      // Success feedback will be handled by the calling component

    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        errorDialogService.showNetworkError(() => this.removeItem(itemId));
      } else {
        errorDialogService.showError({
          title: 'Erro ao Remover Item',
          message: 'Não foi possível remover o item do carrinho. Tente novamente.',
          actions: [
            {
              label: 'Fechar',
              action: () => {},
              variant: 'primary'
            }
          ]
        });
      }
    }
  }

  async updateQuantity(itemId: string, newQuantity: number): Promise<void> {
    try {
      if (newQuantity <= 0) {
        await this.removeItem(itemId);
        return;
      }

      // Since API doesn't provide UPDATE, we use ADD operation
      // Find current quantity in cart
      const currentItem = this.cart.items.find(item => item.itemId.toString() === itemId);
      const currentQuantity = currentItem ? currentItem.quantity : 0;
      
      if (newQuantity === currentQuantity) {
        return; // No change needed
      }
      
      if (newQuantity > currentQuantity) {
        // Add more items
        const itemsToAdd = newQuantity - currentQuantity;
        for (let i = 0; i < itemsToAdd; i++) {
          await this.addItem(parseInt(itemId), 'product');
        }
      } else {
        // Remove items one by one
        const itemsToRemove = currentQuantity - newQuantity;
        for (let i = 0; i < itemsToRemove; i++) {
          await this.removeItem(itemId);
        }
      }

    } catch (error) {
      console.error('Failed to update quantity:', error);
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        errorDialogService.showNetworkError(() => this.updateQuantity(itemId, newQuantity));
      } else {
        errorDialogService.showError({
          title: 'Erro ao Atualizar Quantidade',
          message: 'Não foi possível atualizar a quantidade do item. Tente novamente.',
          actions: [
            {
              label: 'Fechar',
              action: () => {},
              variant: 'primary'
            }
          ]
        });
      }
    }
  }

  async clearCart(showErrorDialog: boolean = true): Promise<void> {
    try {
      // Store cart total as backup before clearing (for payment success page)
      if (typeof window !== 'undefined' && this.cart.total > 0) {
        localStorage.setItem('lastCartTotal', this.cart.total.toString());
        console.log('Cart service: Stored cart total in localStorage before clearing:', this.cart.total);
      }

      // Use the correct session endpoint to clear cart and close session
      const response = await fetch('http://localhost:8090/interface/session', {
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
      if (showErrorDialog) {
        errorDialogService.showError({
          title: 'Erro ao Limpar Carrinho',
          message: 'Não foi possível limpar o carrinho. Tente novamente.',
          actions: [
            {
              label: 'Fechar',
              action: () => {},
              variant: 'primary'
            }
          ]
        });
      }
      throw error;
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
    console.log('CartService getCartItems() called:', {
      hasCart: !!this.cart,
      cartItems: this.cart?.items || null,
      itemCount: this.cart?.items?.length || 0
    });
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
              label: 'Fechar',
              action: () => {},
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
