import { useMemo } from 'react';
import { safeRender, safeRenderAddress, safeRenderFormValue } from '../utils/safeRender';

/**
 * Custom hook for safe rendering of values
 * Prevents React error #31 by ensuring objects are properly converted to strings
 */
export const useSafeRender = () => {
  const safeRenderValue = useMemo(() => safeRender, []);
  const safeRenderAddressValue = useMemo(() => safeRenderAddress, []);
  const safeRenderFormValueHook = useMemo(() => safeRenderFormValue, []);

  return {
    safeRender: safeRenderValue,
    safeRenderAddress: safeRenderAddressValue,
    safeRenderFormValue: safeRenderFormValueHook,
  };
};

/**
 * Hook for safely rendering address objects
 */
export const useSafeAddressRender = (address: any) => {
  return useMemo(() => safeRenderAddress(address), [address]);
};

/**
 * Hook for safely rendering form values
 */
export const useSafeFormValue = (value: any) => {
  return useMemo(() => safeRenderFormValue(value), [value]);
};
