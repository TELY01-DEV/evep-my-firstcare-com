import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  organization?: string;
  permissions?: string[];
  portal_access?: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  hasPortalAccess: (portal: string) => boolean;
  isMedicalAdmin: () => boolean;
  isSystemAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token and user data on app start
    const storedToken = localStorage.getItem('evep_token');
    const storedUser = localStorage.getItem('evep_user');
    
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('evep_token');
        localStorage.removeItem('evep_user');
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:8014/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Login failed:', data.detail);
        return false;
      }

      // Store token and user data
      localStorage.setItem('evep_token', data.access_token);
      localStorage.setItem('evep_user', JSON.stringify(data.user));
      
      setToken(data.access_token);
      setUser(data.user);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    // Clear stored data
    localStorage.removeItem('evep_token');
    localStorage.removeItem('evep_user');
    
    // Clear state
    setToken(null);
    setUser(null);
  };

  // Role-based access control functions
  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission) || user.permissions.includes('full_access');
  };

  const hasPortalAccess = (portal: string): boolean => {
    if (!user || !user.portal_access) return false;
    return user.portal_access.includes(portal);
  };

  const isMedicalAdmin = (): boolean => {
    return user?.role === 'medical_admin';
  };

  const isSystemAdmin = (): boolean => {
    return user?.role === 'system_admin';
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    loading,
    hasPermission,
    hasPortalAccess,
    isMedicalAdmin,
    isSystemAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
