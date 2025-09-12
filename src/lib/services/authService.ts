import type { IAuthService, LoginCredentials, User } from '../types/dashboard.js';
import { apiClient } from './api.js';

export class AuthService implements IAuthService {
	async login(credentials: LoginCredentials): Promise<User> {
		// Convert password to number as expected by API
		const loginData = {
			username: credentials.username,
			password: parseInt(credentials.password) || credentials.password
		};
		await apiClient.post('/login/', loginData);
		return { username: credentials.username };
	}

	async logout(): Promise<void> {
		await apiClient.delete('/login/');
	}

	async renewSession(): Promise<void> {
		await apiClient.get('/login/renew');
	}
}

export const authService = new AuthService();