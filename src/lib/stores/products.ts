import { writable, derived } from 'svelte/store';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  stock: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  productCount: number;
}

// Products and categories stores
export const products = writable<Product[]>([]);
export const categories = writable<Category[]>([]);
export const selectedCategory = writable<string>('bebidas');
export const searchQuery = writable<string>('');
export const isLoadingProducts = writable<boolean>(false);

// Derived stores
export const filteredProducts = derived(
  [products, selectedCategory, searchQuery],
  ([$products, $selectedCategory, $searchQuery]) => {
    return $products.filter(product => {
      const matchesCategory = product.category.toLowerCase() === $selectedCategory.toLowerCase();
      const matchesSearch = product.name.toLowerCase().includes($searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes($searchQuery.toLowerCase());
      const isAvailable = product.available && product.stock > 0;
      
      return matchesCategory && matchesSearch && isAvailable;
    });
  }
);

export const availableProducts = derived(products, ($products) =>
  $products.filter(product => product.available && product.stock > 0)
);

export const productsByCategory = derived(products, ($products) => {
  const grouped: Record<string, Product[]> = {};
  
  $products.forEach(product => {
    const category = product.category.toLowerCase();
    if (!grouped[category]) {
      grouped[category] = [];
    }
    if (product.available && product.stock > 0) {
      grouped[category].push(product);
    }
  });
  
  return grouped;
});

export const categoryProductCounts = derived(productsByCategory, ($productsByCategory) => {
  const counts: Record<string, number> = {};
  
  Object.entries($productsByCategory).forEach(([category, products]) => {
    counts[category] = products.length;
  });
  
  return counts;
});

// Product actions
export const productActions = {
  setProducts: (newProducts: Product[]) => {
    products.set(newProducts);
  },

  addProduct: (product: Product) => {
    products.update($products => [...$products, product]);
  },

  updateProduct: (productId: string, updates: Partial<Product>) => {
    products.update($products => 
      $products.map(product => 
        product.id === productId ? { ...product, ...updates } : product
      )
    );
  },

  removeProduct: (productId: string) => {
    products.update($products => 
      $products.filter(product => product.id !== productId)
    );
  },

  setCategories: (newCategories: Category[]) => {
    categories.set(newCategories);
  },

  setSelectedCategory: (category: string) => {
    selectedCategory.set(category.toLowerCase());
  },

  setSearchQuery: (query: string) => {
    searchQuery.set(query);
  },

  clearSearch: () => {
    searchQuery.set('');
  },

  setLoading: (loading: boolean) => {
    isLoadingProducts.set(loading);
  },

  updateStock: (productId: string, newStock: number) => {
    products.update($products => 
      $products.map(product => 
        product.id === productId 
          ? { ...product, stock: newStock, available: newStock > 0 }
          : product
      )
    );
  },

  getProductById: (productId: string): Product | undefined => {
    let foundProduct: Product | undefined;
    
    products.subscribe($products => {
      foundProduct = $products.find(product => product.id === productId);
    })();
    
    return foundProduct;
  }
};