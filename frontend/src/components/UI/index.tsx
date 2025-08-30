import React from 'react';

// Minimal UI Components for EVEP
// This is a temporary simplified version to get the build working

export const EVEPButton: React.FC<any> = ({ children, ...props }) => (
  <button {...props}>{children}</button>
);

export const EVEPCard: React.FC<any> = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

export const EVEPInput: React.FC<any> = ({ ...props }) => (
  <input {...props} />
);

// Placeholder components
export const EVEPAppBar: React.FC<any> = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

export const EVEPSidebar: React.FC<any> = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

export const EVEPBreadcrumbs: React.FC<any> = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

// Design tokens
export const EVEP_DESIGN_TOKENS = {
  colors: {
    primary: { main: '#9B7DCF' },
    secondary: { main: '#E8BEE8' },
  },
} as const;

