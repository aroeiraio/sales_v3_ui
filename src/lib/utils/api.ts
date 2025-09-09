import { API_BASE_URL } from './constants';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log(`API Call: ${options.method || 'GET'} ${url}`, options);
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  console.log(`API Response: ${response.status} ${response.statusText} for ${url}`);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      `HTTP ${response.status}: ${response.statusText}`
    );
  }

  // Handle empty response bodies gracefully
  const contentType = response.headers.get('content-type');
  const text = await response.text();
  
  if (!text || text.trim() === '') {
    console.log('Empty response body, returning empty object');
    return {} as T;
  }
  
  try {
    return JSON.parse(text);
  } catch (error) {
    console.warn('Failed to parse JSON response:', text);
    return {} as T;
  }
}

export async function get<T>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint);
}

export async function post<T>(endpoint: string, data?: any): Promise<T> {
  return apiCall<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function put<T>(endpoint: string, data: any): Promise<T> {
  return apiCall<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function del<T>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, {
    method: 'DELETE',
  });
}