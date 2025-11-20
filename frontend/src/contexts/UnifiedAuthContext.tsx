/**
 * Unified Authentication Context with Blockchain Hash Support
 * Replaces both AuthContext and AdminAuthContext
 * Provides consistent authentication across Medical Portal and Admin Panel
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import unifiedAuth, { User } from '../services/unifiedAuth';

interface UnifiedAuthContextType {
  // Core authentication
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  
  // Authentication methods
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  
  // Token management
  getToken: () => string | null;
  getSessionHash: () => string | null;
  isTokenExpired: () => boolean;
  
  // Role-based access control
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  isMedicalAdmin: () => boolean;
  
  // Legacy compatibility methods
  hasPermission: (permission: string) => boolean;
  hasPortalAccess: (portal: string) => boolean;
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

interface UnifiedAuthProviderProps {
  children: ReactNode;
}

export const UnifiedAuthProvider: React.FC<UnifiedAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    console.log('🔐 Initializing unified authentication...');
    
    try {
      // Check if user is already authenticated
      if (unifiedAuth.isAuthenticated()) {
        const currentUser = unifiedAuth.getUser();
        setUser(currentUser);
        
        console.log('✅ User already authenticated:', currentUser?.email);
        console.log('🔗 Session hash:', unifiedAuth.getSessionHash()?.substring(0, 16) + '...');
        
        // Check if token needs refresh
        if (unifiedAuth.isTokenExpired()) {
          console.log('🔄 Token expired, attempting refresh...');
          const refreshed = await unifiedAuth.refreshToken();
          if (refreshed) {
            const updatedUser = unifiedAuth.getUser();
            setUser(updatedUser);
            console.log('✅ Token refreshed successfully');
          } else {
            console.log('❌ Token refresh failed, clearing session');
            unifiedAuth.logout();
            setUser(null);
          }
        }
      } else {
        console.log('ℹ️ No existing authentication found');
      }
    } catch (error) {
      console.error('❌ Auth initialization error:', error);
      unifiedAuth.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      const result = await unifiedAuth.login(email, password);
      
      if (result.success && result.user) {
        setUser(result.user);
        console.log('🎉 Login successful for:', result.user.email);
        return { success: true };
      } else {
        console.log('❌ Login failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    console.log('🚪 Logging out user:', user?.email);
    await unifiedAuth.logout();
    setUser(null);
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const success = await unifiedAuth.refreshToken();
      if (success) {
        const updatedUser = unifiedAuth.getUser();
        setUser(updatedUser);
      }
      return success;
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      return false;
    }
  };

  // Role-based access control methods
  const hasRole = (role: string): boolean => {
    return unifiedAuth.hasRole(role);
  };

  const isAdmin = (): boolean => {
    return unifiedAuth.isAdmin();
  };

  const isSuperAdmin = (): boolean => {
    return unifiedAuth.isSuperAdmin();
  };

  const isMedicalAdmin = (): boolean => {
    return unifiedAuth.isMedicalAdmin();
  };

  // Legacy compatibility methods for existing components
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    // Super admin bypasses all permission checks
    if (user.role === 'super_admin') return true;
    if (!user.permissions) return false;
    return user.permissions.includes(permission) || user.permissions.includes('full_access');
  };

  const hasPortalAccess = (portal: string): boolean => {
    if (!user || !user.portal_access) return false;
    return user.portal_access.includes(portal);
  };

  const contextValue: UnifiedAuthContextType = {
    // Core authentication
    user,
    isAuthenticated: unifiedAuth.isAuthenticated(),
    loading,
    
    // Authentication methods
    login,
    logout,
    refreshToken,
    
    // Token management
    getToken: unifiedAuth.getToken.bind(unifiedAuth),
    getSessionHash: unifiedAuth.getSessionHash.bind(unifiedAuth),
    isTokenExpired: unifiedAuth.isTokenExpired.bind(unifiedAuth),
    
    // Role-based access control
    hasRole,
    isAdmin,
    isSuperAdmin,
    isMedicalAdmin,
    
    // Legacy compatibility
    hasPermission,
    hasPortalAccess,
  };

  return (
    <UnifiedAuthContext.Provider value={contextValue}>
      {children}
    </UnifiedAuthContext.Provider>
  );
};

export const useUnifiedAuth = (): UnifiedAuthContextType => {
  const context = useContext(UnifiedAuthContext);
  if (context === undefined) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
  }
  return context;
};

// Export for backward compatibility
export const useAuth = useUnifiedAuth;
export const useAdminAuth = useUnifiedAuth;

export default UnifiedAuthContext;
