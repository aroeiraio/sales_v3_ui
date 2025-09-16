import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ url, depends }) => {
  // Make this load function reactive to cart changes
  depends('payment:cart');

  // For now, we'll implement basic route access
  // In the future, we could add more sophisticated guards here
  
  return {
    // Pass any shared payment data to all payment routes
    paymentFlow: {
      currentRoute: url.pathname,
      timestamp: Date.now()
    }
  };
};