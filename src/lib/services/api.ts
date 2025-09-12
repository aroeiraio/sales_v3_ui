// Base API Configuration and Error Handling
export class APIError extends Error {
	constructor(
		message: string,
		public status?: number,
		public code?: string
	) {
		super(message);
		this.name = 'APIError';
	}
}

export class APIClient {
	private baseURL = 'http://localhost:8090/interface/dashboard';

	private async request<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<T> {
		try {
			const response = await fetch(`${this.baseURL}${endpoint}`, {
				headers: {
					'Content-Type': 'application/json',
					...options.headers
				},
				...options
			});

			if (!response.ok) {
				let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
				let errorCode: string | undefined;
				
				try {
					// Try to parse JSON error response
					const errorBody = await response.text();
					if (errorBody) {
						try {
							const parsedError = JSON.parse(errorBody);
							if (parsedError.message) {
								errorMessage = parsedError.message;
							}
							if (parsedError.msg_code) {
								errorCode = parsedError.msg_code;
							}
						} catch {
							// If not JSON, use as text
							errorMessage += ` - ${errorBody}`;
						}
					}
				} catch {
					// Ignore if we can't read the error body
				}
				
				throw new APIError(errorMessage, response.status, errorCode);
			}

			// Handle empty responses (like DELETE requests)
			const contentType = response.headers.get('content-type');
			if (!contentType || !contentType.includes('application/json')) {
				return {} as T;
			}

			const responseData = await response.json();
			
			// Check for errors in successful HTTP responses
			// The API can return 200 OK but still contain error information
			if (responseData && typeof responseData === 'object') {
				// Define known error codes that should be treated as errors
				const ERROR_CODES = [
					'DISPENSER_UNAVAILABLE',
					'HARDWARE_ERROR',
					'AUTHENTICATION_FAILED',
					'PERMISSION_DENIED',
					'VALIDATION_ERROR',
					'OPERATION_FAILED'
				];
				
				// Check for msg_code field - only throw error for known error codes
				if (responseData.msg_code && ERROR_CODES.includes(responseData.msg_code)) {
					throw new APIError(
						responseData.message || 'Operation failed',
						response.status,
						responseData.msg_code
					);
				}
				
				// Check for non-null error field
				if (responseData.error && responseData.error !== '') {
					throw new APIError(
						responseData.error,
						response.status
					);
				}
			}

			return responseData;
		} catch (error) {
			if (error instanceof APIError) {
				throw error;
			}
			throw new APIError(
				`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	async post<T>(endpoint: string, data: any): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	async get<T>(endpoint: string): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'GET'
		});
	}

	async put<T>(endpoint: string, data: any): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'PUT',
			body: JSON.stringify(data)
		});
	}

	async delete<T>(endpoint: string): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'DELETE'
		});
	}
}

export const apiClient = new APIClient();