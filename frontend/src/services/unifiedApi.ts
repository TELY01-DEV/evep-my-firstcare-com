/**
 * Unified API Service with Blockchain Authentication
 * Replaces both api.ts services and provides consistent API access
 * Automatically handles authentication and token refresh
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import unifiedAuth from './unifiedAuth';

// Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://stardust.evep.my-firstcare.com';

class UnifiedApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    console.log('🌐 Unified API Service initialized with base URL:', API_BASE_URL);
  }

  private setupInterceptors(): void {
    // Request interceptor - add authentication headers
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = unifiedAuth.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add session hash for additional security
        const sessionHash = unifiedAuth.getSessionHash();
        if (sessionHash) {
          config.headers['X-Session-Hash'] = sessionHash;
        }

        console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('📤 Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors and token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(`📥 API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        console.error(`📥 API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);

        // Handle 401 Unauthorized - attempt token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          console.log('🔄 Attempting token refresh due to 401 error...');
          const refreshed = await unifiedAuth.refreshToken();
          
          if (refreshed) {
            console.log('✅ Token refreshed, retrying original request');
            const newToken = unifiedAuth.getToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.axiosInstance(originalRequest);
          } else {
            console.log('❌ Token refresh failed, redirecting to login');
            unifiedAuth.logout();
            window.location.href = '/login';
            return Promise.reject(error);
          }
        }

        // Handle other errors
        if (error.response?.status === 403) {
          console.error('🚫 Access forbidden - insufficient permissions');
        } else if (error.response?.status >= 500) {
          console.error('🔥 Server error - please try again later');
        }

        return Promise.reject(error);
      }
    );
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get<T>(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post<T>(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put<T>(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.patch<T>(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete<T>(url, config);
  }

  // File upload with progress
  async uploadFile<T = any>(
    url: string, 
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<AxiosResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.axiosInstance.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  }

  // Convenience methods for common API patterns
  async fetchWithErrorHandling<T = any>(
    url: string, 
    config?: AxiosRequestConfig
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      const response = await this.get<T>(url, config);
      return { data: response.data, error: null };
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'An error occurred';
      console.error(`❌ Fetch error for ${url}:`, errorMessage);
      return { data: null, error: errorMessage };
    }
  }

  async postWithErrorHandling<T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      const response = await this.post<T>(url, data, config);
      return { data: response.data, error: null };
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'An error occurred';
      console.error(`❌ Post error for ${url}:`, errorMessage);
      return { data: null, error: errorMessage };
    }
  }

  // Get the underlying axios instance for advanced usage
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  // Update base URL if needed
  setBaseURL(baseURL: string): void {
    this.axiosInstance.defaults.baseURL = baseURL;
    console.log('🌐 API Base URL updated to:', baseURL);
  }
}

// Export singleton instance
export const unifiedApi = new UnifiedApiService();
export default unifiedApi;

// Export the class for testing or advanced usage
export { UnifiedApiService };
