import type { IErrorHandler } from '../types/dashboard.js';
import { toastService } from './toast.js';

export class ErrorHandler implements IErrorHandler {
	handleError(error: Error, context?: string): void {
		const message = error.message;
		
		// Show error toast notification
		toastService.showError(message, 5000);
		
		// Log error details to console for debugging
		console.error('Error:', error.message, context ? `(${context})` : '');
	}
}

export const errorHandler = new ErrorHandler();