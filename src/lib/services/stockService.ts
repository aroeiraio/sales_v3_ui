import type { IStockService, StockItem, StockUpdate } from '../types/dashboard.js';
import { apiClient } from './api.js';

export class StockService implements IStockService {
	async getStock(): Promise<StockItem[]> {
		const rawData = await apiClient.get<any[]>('/dashboard/stock/');
		
		// Filter out invalid objects and timestamp entries
		const validItems = rawData.filter((item: any) => 
			item && 
			typeof item === 'object' && 
			!item.timestamp && // Exclude timestamp objects
			item.id && 
			item.shelf && 
			item.coil &&
			item.item_name
		);

		// Map to StockItem format with validation
		return validItems.map((item: any): StockItem => ({
			id: String(item.id),
			amount: String(item.amount || '0'),
			capacity: String(item.capacity || '0'),
			coil: String(item.coil),
			controlled: String(item.controlled || '0'),
			expiration: item.expiration || '', // Handle empty expiration dates
			item_name: item.item_name || 'Item sem nome',
			item_variant_name: item.item_variant_name || '',
			price: String(item.price || '0.00'),
			shelf: String(item.shelf)
		}));
	}

	async updateStock(update: StockUpdate): Promise<void> {
		await apiClient.put('/dashboard/stock/', update);
	}

	// Helper method to validate if an item has valid data for display
	isValidStockItem(item: StockItem): boolean {
		return !!(
			item.id &&
			item.shelf &&
			item.coil &&
			item.item_name &&
			item.item_name !== 'Item sem nome'
		);
	}

	// Helper method to check if item has expiration date
	hasValidExpiration(item: StockItem): boolean {
		return !!(item.expiration && item.expiration.length > 0);
	}
}

export const stockService = new StockService();