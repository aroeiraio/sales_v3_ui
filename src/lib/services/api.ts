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
	private baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090/interface';

	private async request<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<T> {
		try {
			const fullUrl = `${this.baseURL}${endpoint}`;
			console.log('API Request:', {
				method: options.method || 'GET',
				url: fullUrl,
				baseURL: this.baseURL,
				endpoint: endpoint
			});
			
			const response = await fetch(fullUrl, {
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
			console.log('API Response content type:', contentType);
			
			if (!contentType || !contentType.includes('application/json')) {
				// For non-JSON responses, try to read as text to provide better error info
				if (contentType && contentType.includes('text/html')) {
					const htmlResponse = await response.text();
					console.error('HTML response received instead of JSON:', {
						url: fullUrl,
						contentType,
						htmlPreview: htmlResponse.substring(0, 200) + (htmlResponse.length > 200 ? '...' : '')
					});
					throw new APIError(
						`Expected JSON response but received HTML. This usually means the API endpoint doesn't exist or the server is misconfigured. URL: ${fullUrl}`,
						response.status
					);
				}
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