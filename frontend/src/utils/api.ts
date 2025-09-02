import { useAuth } from '../contexts/AuthContext';

// Create a custom fetch wrapper that handles token refresh
export const createAuthenticatedFetch = (token: string | null, refreshToken: () => Promise<boolean>) => {
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

    // If we get a 401, try to refresh the token and retry the request
    if (response.status === 401) {
      console.log('Token expired, attempting to refresh...');
      const refreshSuccess = await refreshToken();
      
      if (refreshSuccess) {
        // Get the new token from localStorage
        const newToken = localStorage.getItem('evep_token');
        if (newToken) {
          // Retry the request with the new token
          headers['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });
          return retryResponse;
        }
      } else {
        // If refresh fails, redirect to login
        console.log('Token refresh failed, redirecting to login...');
        window.location.href = '/login';
        return response; // Return the original 401 response
      }
    }

    return response;
  };
};

// Hook to get authenticated fetch function
export const useAuthenticatedFetch = () => {
  const { token, refreshToken } = useAuth();
  return createAuthenticatedFetch(token, refreshToken);
};

// Utility function to check if response indicates token expiration
export const isTokenExpired = (response: Response): boolean => {
  return response.status === 401;
};

// Utility function to handle API errors with automatic token refresh
export const handleApiError = async (
  response: Response, 
  refreshToken: () => Promise<boolean>
): Promise<Response> => {
  if (response.status === 401) {
    console.log('Handling 401 error with token refresh...');
    const refreshSuccess = await refreshToken();
    
    if (refreshSuccess) {
      // Return a mock response indicating refresh success
      // The calling code should retry the original request
      return new Response(JSON.stringify({ refreshed: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Redirect to login if refresh fails
      window.location.href = '/login';
    }
  }
  
  return response;
};
