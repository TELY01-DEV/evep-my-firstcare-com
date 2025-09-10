/**
 * Runtime Object Inspector - Catches and logs all object renderings
 * This provides detailed debugging information for React error #31
 */

// Global object inspector
class ObjectInspector {
  private static instance: ObjectInspector;
  private objectRenderings: any[] = [];
  private isEnabled = true;

  static getInstance(): ObjectInspector {
    if (!ObjectInspector.instance) {
      ObjectInspector.instance = new ObjectInspector();
    }
    return ObjectInspector.instance;
  }

  logObjectRendering(obj: any, context: string = 'Unknown') {
    if (!this.isEnabled) return;

    this.objectRenderings.push({
      object: obj,
      context,
      timestamp: new Date().toISOString(),
      stack: new Error().stack
    });

    console.group('🚨 Object Rendering Detected');
    console.log('Context:', context);
    console.log('Object:', obj);
    console.log('Type:', typeof obj);
    console.log('Keys:', Object.keys(obj || {}));
    console.log('Stack:', new Error().stack);
    console.groupEnd();

    // If this is an address object, provide specific guidance
    if (obj && typeof obj === 'object' && 
        (obj.house_no || obj.village_no || obj.soi || obj.road || 
         obj.subdistrict || obj.district || obj.province || obj.postal_code)) {
      console.group('📍 Address Object Detected');
      console.log('This is an address object that should be formatted before rendering');
      console.log('Suggested fix: Use SafeAddressRenderer component or formatAddress function');
      console.log('Object details:', obj);
      console.groupEnd();
    }
  }

  getObjectRenderings() {
    return this.objectRenderings;
  }

  clearLogs() {
    this.objectRenderings = [];
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }
}

// Export singleton instance
export const objectInspector = ObjectInspector.getInstance();

// Override console methods to catch object renderings
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.log = function(...args: any[]) {
  args.forEach(arg => {
    if (arg && typeof arg === 'object' && !Array.isArray(arg) && 
        (arg.house_no || arg.village_no || arg.soi || arg.road || 
         arg.subdistrict || arg.district || arg.province || arg.postal_code)) {
      objectInspector.logObjectRendering(arg, 'Console.log');
    }
  });
  return originalConsoleLog.apply(console, args);
};

console.error = function(...args: any[]) {
  args.forEach(arg => {
    if (arg && typeof arg === 'object' && !Array.isArray(arg) && 
        (arg.house_no || arg.village_no || arg.soi || arg.road || 
         arg.subdistrict || arg.district || arg.province || arg.postal_code)) {
      objectInspector.logObjectRendering(arg, 'Console.error');
    }
  });
  return originalConsoleError.apply(console, args);
};

console.warn = function(...args: any[]) {
  args.forEach(arg => {
    if (arg && typeof arg === 'object' && !Array.isArray(arg) && 
        (arg.house_no || arg.village_no || arg.soi || arg.road || 
         arg.subdistrict || arg.district || arg.province || arg.postal_code)) {
      objectInspector.logObjectRendering(arg, 'Console.warn');
    }
  });
  return originalConsoleWarn.apply(console, args);
};

// Make inspector available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).objectInspector = objectInspector;
}

console.log('🔍 Runtime Object Inspector loaded - Object rendering detection active');
