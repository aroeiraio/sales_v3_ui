// Dashboard Types
export interface User {
	username: string;
}

export interface LoginCredentials {
	username: string;
	password: string;
}

export interface StockItem {
	id: string;
	amount: string;
	capacity: string;
	coil: string;
	controlled: string;
	expiration: string;
	item_name: string;
	item_variant_name: string;
	price: string;
	shelf: string;
}

export interface StockUpdate {
	id: number;
	amount: number;
	expiration_date: string;
}

export interface DeliveryRequest {
	lift: boolean;
	order: string;
	coils: Array<{
		id: number;
		quantity: number;
	}>;
}

export interface ActionRequest {
	action: 'lock' | 'unlock';
}

// Service Interfaces
export interface IAuthService {
	login(credentials: LoginCredentials): Promise<User>;
	logout(): Promise<void>;
	renewSession(): Promise<void>;
}

export interface IStockService {
	getStock(): Promise<StockItem[]>;
	updateStock(update: StockUpdate): Promise<void>;
}

export interface IDispenserService {
	openDoor(action: ActionRequest): Promise<void>;
	handleHatch(action: ActionRequest): Promise<void>;
	testSlot(delivery: DeliveryRequest): Promise<void>;
}

export interface IErrorHandler {
	handleError(error: Error, context?: string): void;
}

export interface ISessionManager {
	startSession(user: User): void;
	endSession(): void;
	getCurrentUser(): User | null;
	startRenewalTimer(): void;
	stopRenewalTimer(): void;
}