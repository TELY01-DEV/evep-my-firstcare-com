/**
 * Unified Authentication Service with Blockchain Hash Support
 * Works for both Medical Portal and Admin Panel
 * Eliminates JWT authentication issues and provides consistent experience
 */

import axios, { AxiosResponse } from 'axios';

// Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://stardust.evep.my-firstcare.com';
const TOKEN_KEY = 'evep_token';
const REFRESH_TOKEN_KEY = 'evep_refresh_token';
const USER_KEY = 'evep_user';
const SESSION_HASH_KEY = 'evep_session_hash';

// Types
interface User {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  role: string;
  organization?: string;
  permissions?: string[];
  portal_access?: string[];
  last_login?: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  session_hash?: string;
  security_level?: string;
  user: User;
}

interface RefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  security_level?: string;
  user: User;
}

class UnifiedAuthService {
  private refreshPromise: Promise<boolean> | null = null;
  private isRefreshing = false;

  constructor() {
    this.setupAxiosInterceptors();
    console.log('🔐 Unified Auth Service initialized with blockchain support');
  }

  /**
   * Setup axios interceptors for automatic token handling
   */
  private setupAxiosInterceptors(): void {
    // Request interceptor - add token to requests
    axios.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // Try to refresh token
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Retry original request with new token
            const token = this.getToken();
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axios(originalRequest);
          } else {
            // Refresh failed, redirect to login
            this.logout();
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      console.log('🔐 Attempting login with blockchain authentication...');
      
      const response: AxiosResponse<LoginResponse> = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
        email,
        password,
      });

      const data = response.data;
      console.log('✅ Login successful with blockchain verification');
      console.log('🔗 Session hash:', data.session_hash?.substring(0, 16) + '...');
      console.log('🛡️ Security level:', data.security_level);

      // Store tokens and user data
      this.setToken(data.access_token);
      if (data.refresh_token) {
        this.setRefreshToken(data.refresh_token);
      }
      if (data.session_hash) {
        localStorage.setItem(SESSION_HASH_KEY, data.session_hash);
      }
      this.setUser(data.user);

      return { success: true, user: data.user };
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      const errorMessage = error.response?.data?.detail || 'Login failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<boolean> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing) {
      return this.refreshPromise || Promise.resolve(false);
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        console.log('❌ No refresh token available');
        return false;
      }

      console.log('🔄 Refreshing token with blockchain validation...');
      
      const response: AxiosResponse<RefreshResponse> = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
        refresh_token: refreshToken,
      });

      const data = response.data;
      console.log('✅ Token refreshed successfully');
      console.log('🛡️ Security level:', data.security_level);

      // Update stored token and user data
      this.setToken(data.access_token);
      this.setUser(data.user);

      return true;
    } catch (error: any) {
      console.error('❌ Token refresh failed:', error);
      // Clear invalid tokens
      this.clearTokens();
      return false;
    }
  }

  /**
   * Logout and clear all stored data
   */
  async logout(): Promise<void> {
    console.log('🚪 Logging out and clearing blockchain session...');
    
    // Call backend logout endpoint to invalidate token
    try {
      const token = this.getToken();
      if (token) {
        await axios.post(`${API_BASE_URL}/api/v1/auth/logout`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Server-side logout successful');
      }
    } catch (error) {
      console.warn('⚠️ Server-side logout failed, proceeding with client-side cleanup:', error);
    }
    
    // Clear all client-side data
    this.clearAllUserData();
  }

  /**
   * Clear all user data from localStorage
   */
  private clearAllUserData(): void {
    // Clear unified auth tokens
    this.clearTokens();
    this.clearUser();
    localStorage.removeItem(SESSION_HASH_KEY);
    
    // Clear legacy tokens (backward compatibility)
    localStorage.removeItem('evep_token');
    localStorage.removeItem('evep_user');
    localStorage.removeItem('evep_email');
    localStorage.removeItem('evep_password');
    localStorage.removeItem('evep_admin_token');
    
    // Clear any other application-specific data
    localStorage.removeItem('user_id');
    localStorage.removeItem('accessibility-settings'); // Optional: keep user preferences
    
    console.log('🧹 All user data cleared from localStorage');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  /**
   * Get current user
   */
  getUser(): User | null {
    try {
      const userData = localStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Get session hash
   */
  getSessionHash(): string | null {
    return localStorage.getItem(SESSION_HASH_KEY);
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.getUser();
    return user?.role === role;
  }

  /**
   * Check if user has admin privileges
   */
  isAdmin(): boolean {
    return this.hasRole('admin') || this.hasRole('super_admin');
  }

  /**
   * Check if user has super admin privileges
   */
  isSuperAdmin(): boolean {
    return this.hasRole('super_admin');
  }

  /**
   * Check if user has medical admin privileges
   */
  isMedicalAdmin(): boolean {
    return this.hasRole('medical_admin');
  }

  /**
   * Check if token is expired (client-side check)
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      // Consider token expired if it expires within 5 minutes
      return payload.exp < (currentTime + 300);
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  // Private helper methods
  private setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  private setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  private setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private clearTokens(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  private clearUser(): void {
    localStorage.removeItem(USER_KEY);
  }
}

// Export singleton instance
export const unifiedAuth = new UnifiedAuthService();
export default unifiedAuth;

// Export types for use in components
export type { User, LoginResponse, RefreshResponse };
