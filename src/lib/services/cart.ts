import { errorDialogService } from './errorDialog';
import { cart, cartActions } from '../stores/cart';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  maxQuantity?: number;
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
      const response = await fetch('/interface/cart');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.cart = data;
      this.notifySubscribers();
      return this.cart;
    } catch (error) {
      console.error('Failed to load cart:', error);
      errorDialogService.showNetworkError(() => this.getCart());
      throw error;
    }
  }

  async addItem(productId: string, quantity: number = 1): Promise<void> {
    try {
      const response = await fetch('/interface/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          quantity
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check for specific error codes
      if (data.error) {
        switch (data.error.code) {
          case 'STOCK_UNAVAILABLE':
            errorDialogService.showCartError('stock');
            return;
          case 'MAX_ITEMS_REACHED':
            errorDialogService.showCartError('limit');
            return;
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
      this.cart = data.cart;
      this.notifySubscribers();

      // Show success feedback
      errorDialogService.showSuccess({
        title: 'Item Adicionado',
        message: 'Produto adicionado ao carrinho com sucesso!',
        autoClose: true,
        autoCloseDelay: 2000
      });

    } catch (error) {
      console.error('Failed to add item to cart:', error);
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        errorDialogService.showNetworkError(() => this.addItem(productId, quantity));
      } else {
        errorDialogService.showError({
          title: 'Erro ao Adicionar Item',
          message: 'Não foi possível adicionar o item ao carrinho. Tente novamente.',
          actions: [
            {
              label: 'Tentar Novamente',
              action: () => this.addItem(productId, quantity),
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
      const response = await fetch('/interface/cart', {
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
      this.cart = data.cart;
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

      const response = await fetch('/interface/cart', {
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
      this.cart = data.cart;
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
      const response = await fetch('/interface/cart', {
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
    return this.cart.items.reduce((total, item) => total + item.quantity, 0);
  }

  getCartTotal(): number {
    return this.cart.total;
  }

  getCartItems(): CartItem[] {
    return [...this.cart.items];
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
    this.subscribers.forEach(callback => callback({ ...this.cart }));
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
      const response = await fetch('/interface/cart/validate');
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
