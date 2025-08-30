import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface AdminUser {
  _id: string;
  email: string;
  role: 'admin' | 'super_admin';
  name: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Configure axios for admin panel
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8013';
  axios.defaults.baseURL = apiUrl;
  console.log('🌐 Admin Panel API URL configured:', apiUrl);
  
  // Add request interceptor for logging
  axios.interceptors.request.use(
    (config) => {
      console.log('📤 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        headers: config.headers
      });
      return config;
    },
    (error) => {
      console.error('📤 Request Error:', error);
      return Promise.reject(error);
    }
  );

  // Add response interceptor for logging
  axios.interceptors.response.use(
    (response) => {
      console.log('📥 API Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.config.url,
        data: response.data
      });
      return response;
    },
    (error) => {
      console.error('📥 Response Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        data: error.response?.data,
        message: error.message
      });
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    console.log('🔍 CHECKING AUTH STATUS...');
    try {
      const token = localStorage.getItem('evep_admin_token');
      console.log('🔑 Token exists:', !!token);
      if (!token) {
        console.log('❌ No token found, skipping auth check');
        setLoading(false);
        return;
      }

      // Set token in axios headers
      console.log('🔧 Setting axios headers...');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Verify token with backend
      console.log('🌐 Making auth check request to /api/v1/auth/me...');
      const response = await axios.get('/api/v1/auth/me');
      console.log('✅ Auth check response:', response.data);
      const userData = response.data;

      // Check if user is admin or super_admin
      console.log('👤 User role:', userData.role);
      if (userData.role === 'admin' || userData.role === 'super_admin') {
        console.log('✅ User has admin privileges');
        setUser(userData);
      } else {
        console.log('❌ User does not have admin privileges');
        // User is not admin, clear token
        localStorage.removeItem('evep_admin_token');
        delete axios.defaults.headers.common['Authorization'];
        toast.error('Access denied. Admin privileges required.');
      }
    } catch (error) {
      console.error('💥 Auth check failed:', error);
      console.error('💥 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        response: (error as any)?.response?.data,
        status: (error as any)?.response?.status,
        statusText: (error as any)?.response?.statusText
      });
      localStorage.removeItem('evep_admin_token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      console.log('🏁 Auth check finished');
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('🔐 ADMIN LOGIN ATTEMPT...');
    console.log('📧 Email:', email);
    console.log('🔑 Password length:', password.length);
    console.log('🌐 API URL:', axios.defaults.baseURL);
    
    try {
      setLoading(true);
      
      console.log('🔄 Making login request to /api/v1/auth/login...');
      const response = await axios.post('/api/v1/auth/login', {
        email,
        password,
      });
      console.log('✅ Login response received:', response.data);

      const { access_token, user: userData } = response.data;
      console.log('🔑 Token received:', !!access_token);
      console.log('👤 User data:', userData);

      // Check if user is admin or super_admin
      console.log('🔍 Checking user role:', userData.role);
      if (userData.role !== 'admin' && userData.role !== 'super_admin') {
        console.log('❌ User does not have admin privileges');
        toast.error('Access denied. Admin privileges required.');
        return false;
      }

      console.log('✅ User has admin privileges, storing token...');
      // Store admin-specific token
      localStorage.setItem('evep_admin_token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      setUser(userData);
      toast.success(`Welcome back, ${userData.name || userData.email}!`);
      console.log('🎉 Login successful!');
      return true;
    } catch (error: any) {
      console.error('💥 Login failed:', error);
      console.error('💥 Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      const errorMessage = error.response?.data?.detail || 'Login failed. Please try again.';
      toast.error(errorMessage);
      return false;
    } finally {
      console.log('🏁 Login attempt finished');
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('evep_admin_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out successfully');
  };

  const value: AdminAuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isSuperAdmin: user?.role === 'super_admin',
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};



