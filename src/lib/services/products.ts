import { get } from '../utils/api';
import { ENDPOINTS } from '../utils/constants';
import { errorDialogService } from './errorDialog';

export interface ProductMedia {
  filename: string;
  pending: number;
  source: string;
  url: string;
}

export interface Product {
  amount: number;
  categoryId: number;
  controlled: number;
  description: string;
  expiration: string;
  itemId: number;
  media: ProductMedia[];
  name: string;
  price: number;
  saleLimit: number;
  type: string;
}

export interface Category {
  categoryId: number;
  description: string;
  name: string;
  position: number;
}

export interface ProductsResponse {
  products: Product[];
  timestamp: string;
}

export interface CategoriesResponse {
  categories: Category[];
  timestamp: string;
}

class ProductsService {
  private products: Product[] = [];
  private categories: Category[] = [];

  async getCategories(): Promise<Category[]> {
    try {
      const response = await get<Category[]>(ENDPOINTS.categories);
      
      // Debug: Log the raw response to identify issues
      console.log('Raw categories response:', response);
      
      // Filter out "Produtos destacados" (categoryId: -200) and timestamp objects
      this.categories = response
        .filter(category => {
          const isValid = category.categoryId !== -200 && // Remove "Produtos destacados" (Destaques)
            typeof category.categoryId === 'number' && // Ensure it's a valid category object
            category.name && // Ensure it has a name
            category.name.trim() !== ''; // Ensure name is not empty
          
          if (!isValid) {
            console.log('Filtered out invalid category:', category);
          }
          return isValid;
        })
        .map(category => {
          // Keep all other categories as they are
          return category;
        })
        .sort((a, b) => a.position - b.position);

      console.log('Filtered categories:', this.categories);
      return this.categories;
    } catch (error) {
      console.warn('Failed to load categories from API:', error);
      // Return empty array instead of mock data to avoid showing fake products
      this.categories = [];
      return this.categories;
    }
  }

  async getProducts(categoryId?: number): Promise<Product[]> {
    try {
      let endpoint = ENDPOINTS.products;
      
      // If no categoryId provided, get all products
      if (categoryId !== undefined) {
        endpoint = `${ENDPOINTS.products}/${categoryId}`;
      }

      const response = await get<Product[]>(endpoint);
      
      // Filter out timestamp objects and invalid products
      this.products = response.filter(item => {
        // Check if the item has the required product properties
        const isValidProduct = typeof item.itemId === 'number' && 
          typeof item.name === 'string' && 
          item.name.trim() !== '' &&
          typeof item.price === 'number';
        
        if (!isValidProduct) {
          console.log('Filtered out invalid product item:', item);
        }
        
        return isValidProduct;
      });
      
      return this.products;
    } catch (error) {
      console.warn('Failed to load products from API:', error);
      // Return empty array instead of mock data to avoid showing fake products
      this.products = [];
      return this.products;
    }
  }

  async searchProducts(expression: string): Promise<Product[]> {
    try {
      if (!expression.trim()) {
        return this.getProducts();
      }

      const response = await get<Product[]>(`${ENDPOINTS.products}/${encodeURIComponent(expression)}`);
      
      // Filter out timestamp objects and invalid products
      this.products = response.filter(item => {
        // Check if the item has the required product properties
        const isValidProduct = typeof item.itemId === 'number' && 
          typeof item.name === 'string' && 
          item.name.trim() !== '' &&
          typeof item.price === 'number';
        
        if (!isValidProduct) {
          console.log('Filtered out invalid search result item:', item);
        }
        
        return isValidProduct;
      });
      
      return this.products;
    } catch (error) {
      console.warn('Failed to search products from API:', error);
      // Return empty array instead of mock data to avoid showing fake products
      this.products = [];
      return this.products;
    }
  }

  getProductsByCategory(categoryId: number): Product[] {
    return this.products.filter(product => product.categoryId === categoryId);
  }

  getProductById(itemId: number): Product | undefined {
    return this.products.find(product => product.itemId === itemId);
  }

  getCachedProducts(): Product[] {
    return [...this.products];
  }

  getCachedCategories(): Category[] {
    return [...this.categories];
  }

  // Helper method to format price in Brazilian Real format
  formatPrice(price: number | undefined): string {
    if (price === undefined || price === null) return 'R$ 0,00';
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  }

  // Helper method to truncate product name if too long
  truncateName(name: string | undefined, maxLength: number = 50): string {
    if (!name) return '';
    if (name.length <= maxLength) {
      return name;
    }
    return name.substring(0, maxLength - 3) + '...';
  }

  // Helper method to get product image URL
  getProductImage(product: Product): string {
    if (product.media && product.media.length > 0) {
      return product.media[0].url || product.media[0].source;
    }
    return 'https://placehold.co/200x160'; // Fallback image
  }
}

export const productsService = new ProductsService();
