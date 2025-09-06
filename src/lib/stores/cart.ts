import { writable, derived } from 'svelte/store';

export interface CartItem {
  id: string;
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
  fees: number;
  discount: number;
}

// Cart store
export const cart = writable<Cart>({
  items: [],
  total: 0,
  subtotal: 0,
  fees: 0,
  discount: 0
});

// Derived stores for computed values
export const cartItemCount = derived(cart, ($cart) => 
  $cart.items.reduce((total, item) => total + item.quantity, 0)
);

export const cartIsEmpty = derived(cart, ($cart) => 
  $cart.items.length === 0
);

export const cartSubtotal = derived(cart, ($cart) => 
  $cart.items.reduce((total, item) => total + (item.price * item.quantity), 0)
);

// Cart actions
export const cartActions = {
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    cart.update($cart => {
      const existingIndex = $cart.items.findIndex(i => i.id === item.id);
      
      if (existingIndex >= 0) {
        // Update existing item quantity
        $cart.items[existingIndex].quantity += item.quantity || 1;
      } else {
        // Add new item
        $cart.items.push({
          ...item,
          quantity: item.quantity || 1
        });
      }
      
      // Recalculate totals
      const subtotal = $cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      $cart.subtotal = subtotal;
      $cart.total = subtotal + ($cart.fees || 0) - ($cart.discount || 0);
      
      return $cart;
    });
  },

  removeItem: (itemId: string) => {
    cart.update($cart => {
      $cart.items = $cart.items.filter(item => item.id !== itemId);
      
      // Recalculate totals
      const subtotal = $cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      $cart.subtotal = subtotal;
      $cart.total = subtotal + ($cart.fees || 0) - ($cart.discount || 0);
      
      return $cart;
    });
  },

  updateQuantity: (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      cartActions.removeItem(itemId);
      return;
    }

    cart.update($cart => {
      const itemIndex = $cart.items.findIndex(item => item.id === itemId);
      
      if (itemIndex >= 0) {
        $cart.items[itemIndex].quantity = quantity;
        
        // Recalculate totals
        const subtotal = $cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        $cart.subtotal = subtotal;
        $cart.total = subtotal + ($cart.fees || 0) - ($cart.discount || 0);
      }
      
      return $cart;
    });
  },

  clearCart: () => {
    cart.set({
      items: [],
      total: 0,
      subtotal: 0,
      fees: 0,
      discount: 0
    });
  },

  setCart: (newCart: Cart) => {
    cart.set(newCart);
  },

  updateFees: (fees: number) => {
    cart.update($cart => {
      $cart.fees = fees;
      $cart.total = $cart.subtotal + fees - ($cart.discount || 0);
      return $cart;
    });
  },

  updateDiscount: (discount: number) => {
    cart.update($cart => {
      $cart.discount = discount;
      $cart.total = $cart.subtotal + ($cart.fees || 0) - discount;
      return $cart;
    });
  }
};