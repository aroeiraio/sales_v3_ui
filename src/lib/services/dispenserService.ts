import type { IDispenserService, ActionRequest, DeliveryRequest } from '../types/dashboard.js';
import { apiClient } from './api.js';

export class DispenserService implements IDispenserService {
	async openDoor(action: ActionRequest): Promise<void> {
		await apiClient.post('/dashboard/dispenser/open-door', action);
	}

	async handleHatch(action: ActionRequest): Promise<void> {
		await apiClient.post('/dashboard/dispenser/handle-hatch', action);
	}

	async testSlot(delivery: DeliveryRequest): Promise<void> {
		await apiClient.post('/dashboard/dispenser/delivery/', delivery);
	}
}

export const dispenserService = new DispenserService();