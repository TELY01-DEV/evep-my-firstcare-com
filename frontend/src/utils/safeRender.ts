/**
 * Safe rendering utilities to prevent React error #31
 * Handles objects that cannot be rendered directly in JSX
 */

/**
 * Safely renders any value for JSX display
 * Converts objects to strings, handles null/undefined gracefully
 */
export const safeRender = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return '[Object]';
    }
  }
  
  return String(value);
};

/**
 * Safely renders address objects in a human-readable format
 */
export const safeRenderAddress = (address: any): string => {
  if (!address) {
    return 'Address not available';
  }
  
  if (typeof address === 'string') {
    return address;
  }
  
  if (typeof address === 'object') {
    const parts = [
      address.house_no ? `บ้านเลขที่ ${address.house_no}` : '',
      address.village_no ? `หมู่ ${address.village_no}` : '',
      address.soi ? `ซอย ${address.soi}` : '',
      address.road ? `ถนน ${address.road}` : '',
      address.subdistrict ? `ตำบล/แขวง ${address.subdistrict}` : '',
      address.district ? `อำเภอ/เขต ${address.district}` : '',
      address.province ? `จังหวัด ${address.province}` : '',
      address.postal_code ? `รหัสไปรษณีย์ ${address.postal_code}` : '',
    ].filter(Boolean);
    
    return parts.join('\n') || 'Address not available';
  }
  
  return String(address) || 'Address not available';
};

/**
 * Safely renders any object for form input values
 */
export const safeRenderFormValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return '';
    }
  }
  
  return String(value);
};

/**
 * Higher-order component wrapper for safe rendering
 * Prevents React error #31 by ensuring all props are safely rendered
 */
export const withSafeRendering = <P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> => {
  return (props: P) => {
    const safeProps = Object.keys(props).reduce((acc, key) => {
      const value = (props as any)[key];
      acc[key] = safeRender(value);
      return acc;
    }, {} as any);
    
    return <Component {...safeProps} />;
  };
};
