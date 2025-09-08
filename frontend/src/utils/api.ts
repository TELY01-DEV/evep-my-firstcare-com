import { useAuth } from '../contexts/AuthContext';

// Create a simple authenticated fetch wrapper
export const createAuthenticatedFetch = (token: string | null) => {
  return async (url: string, options: RequestInit = {}) => {
    // Add authorization header if token exists
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    return response;
  };
};

// Hook to get authenticated fetch function
export const useAuthenticatedFetch = () => {
  const { token } = useAuth();
  return createAuthenticatedFetch(token);
};

// Utility function to check if response indicates token expiration
export const isTokenExpired = (response: Response): boolean => {
  return response.status === 401;
};
