import type { ISessionManager, User } from '../types/dashboard.js';
import { writable } from 'svelte/store';
import { authService } from './authService.js';
import { errorHandler } from './errorHandler.js';

export const currentUser = writable<User | null>(null);

export class SessionManager implements ISessionManager {
	private renewalTimer: number | null = null;
	private readonly RENEWAL_INTERVAL = 5 * 60 * 1000; // 5 minutes

	startSession(user: User): void {
		currentUser.set(user);
		this.startRenewalTimer();
	}

	endSession(): void {
		currentUser.set(null);
		this.stopRenewalTimer();
	}

	getCurrentUser(): User | null {
		let user: User | null = null;
		currentUser.subscribe(u => user = u)();
		return user;
	}

	startRenewalTimer(): void {
		this.stopRenewalTimer();
		this.renewalTimer = window.setInterval(async () => {
			try {
				await authService.renewSession();
			} catch (error) {
				errorHandler.handleError(
					error instanceof Error ? error : new Error('Session renewal failed'),
					'Session renewal'
				);
				// On renewal failure, end session
				this.endSession();
			}
		}, this.RENEWAL_INTERVAL);
	}

	stopRenewalTimer(): void {
		if (this.renewalTimer) {
			clearInterval(this.renewalTimer);
			this.renewalTimer = null;
		}
	}
}

export const sessionManager = new SessionManager();