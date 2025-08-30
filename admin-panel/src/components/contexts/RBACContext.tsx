import React, { createContext, useContext, ReactNode } from 'react';

interface RBACContextType {
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

interface RBACProviderProps {
  children: ReactNode;
}

export const RBACProvider: React.FC<RBACProviderProps> = ({ children }) => {
  const hasPermission = (permission: string) => {
    // Placeholder implementation
    return true;
  };

  const hasRole = (role: string) => {
    // Placeholder implementation
    return true;
  };

  return (
    <RBACContext.Provider value={{ hasPermission, hasRole }}>
      {children}
    </RBACContext.Provider>
  );
};

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (context === undefined) {
    throw new Error('useRBAC must be used within a RBACProvider');
  }
  return context;
};
