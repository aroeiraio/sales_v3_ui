import type { Product, Category } from './products';

// Mock data for testing when API is not available
export const mockCategories: Category[] = [
  {
    categoryId: 602,
    description: "Bebidas e refrigerantes",
    name: "BEBIDAS",
    position: 0
  },
  {
    categoryId: 604,
    description: "Lanches e sanduíches",
    name: "CATEGORIA 2",
    position: 1
  },
  {
    categoryId: 607,
    description: "Snacks e petiscos",
    name: "SNACKS",
    position: 2
  }
];

export const mockProducts: Product[] = [
  {
    amount: 10,
    categoryId: 602,
    controlled: 0,
    description: "Refrigerante gelado e refrescante",
    expiration: "2025-12-31",
    itemId: 4374,
    media: [
      {
        filename: "coca-cola.jpg",
        pending: 0,
        source: "/media/images/coca-cola.jpg",
        url: "https://placehold.co/200x160/CCCCCC/666666?text=Coca-Cola"
      }
    ],
    name: "Coca-cola",
    price: 1.5,
    saleLimit: 100,
    type: "product"
  },
  {
    amount: 8,
    categoryId: 602,
    controlled: 0,
    description: "Água mineral natural",
    expiration: "2025-12-31",
    itemId: 4375,
    media: [
      {
        filename: "agua.jpg",
        pending: 0,
        source: "/media/images/agua.jpg",
        url: "https://placehold.co/200x160/CCCCCC/666666?text=Água"
      }
    ],
    name: "Água Mineral",
    price: 2.5,
    saleLimit: 50,
    type: "product"
  },
  {
    amount: 5,
    categoryId: 604,
    controlled: 0,
    description: "Sanduíche natural com ingredientes frescos",
    expiration: "2025-01-15",
    itemId: 4376,
    media: [
      {
        filename: "sanduiche.jpg",
        pending: 0,
        source: "/media/images/sanduiche.jpg",
        url: "https://placehold.co/200x160/CCCCCC/666666?text=Sanduíche"
      }
    ],
    name: "Sanduíche Natural",
    price: 12.0,
    saleLimit: 20,
    type: "product"
  },
  {
    amount: 0,
    categoryId: 607,
    controlled: 0,
    description: "Batata frita crocante",
    expiration: "2025-01-10",
    itemId: 4377,
    media: [
      {
        filename: "batata.jpg",
        pending: 0,
        source: "/media/images/batata.jpg",
        url: "https://placehold.co/200x160/CCCCCC/666666?text=Batata"
      }
    ],
    name: "Batata Frita",
    price: 8.0,
    saleLimit: 30,
    type: "product"
  }
];

export const mockSettings = {
  background_color: "#fdfcdc",
  background_image: "",
  font_color: "#0081a7",
  logotype_image: "",
  logotype_pos_x: "center",
  logotype_pos_y: "center",
  timestamp: new Date().toISOString()
};
