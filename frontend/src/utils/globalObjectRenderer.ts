/**
 * Global Object Renderer - Aggressive solution for React error #31
 * Intercepts all object renderings and converts them to safe strings
 */

import React from 'react';

// Store original React.createElement
const originalCreateElement = React.createElement;

// Override React.createElement to intercept object renderings
React.createElement = function(type: any, props: any, ...children: any[]) {
  // Process children to ensure no objects are rendered directly
  const safeChildren = children.map(child => {
    if (child === null || child === undefined) {
      return child;
    }
    
    if (typeof child === 'object' && !React.isValidElement(child)) {
      // This is an object being rendered directly - convert to string
      console.warn('Preventing React error #31: Object being rendered directly', child);
      
      if (child && typeof child === 'object') {
        // Handle address objects specifically
        if (child.house_no || child.village_no || child.soi || child.road || 
            child.subdistrict || child.district || child.province || child.postal_code) {
          const parts = [
            child.house_no ? `บ้านเลขที่ ${child.house_no}` : '',
            child.village_no ? `หมู่ ${child.village_no}` : '',
            child.soi ? `ซอย ${child.soi}` : '',
            child.road ? `ถนน ${child.road}` : '',
            child.subdistrict ? `ตำบล/แขวง ${child.subdistrict}` : '',
            child.district ? `อำเภอ/เขต ${child.district}` : '',
            child.province ? `จังหวัด ${child.province}` : '',
            child.postal_code ? `รหัสไปรษณีย์ ${child.postal_code}` : '',
          ].filter(Boolean);
          return parts.join('\n') || 'Address not available';
        }
        
        // Handle other objects
        try {
          return JSON.stringify(child);
        } catch (error) {
          return '[Object]';
        }
      }
    }
    
    return child;
  });
  
  // Process props to ensure no objects in props are rendered directly
  let safeProps = props;
  if (props && typeof props === 'object') {
    safeProps = { ...props };
    
    // Check for common prop names that might contain objects
    const objectProps = ['value', 'defaultValue', 'children', 'title', 'alt'];
    objectProps.forEach(propName => {
      if (safeProps[propName] && typeof safeProps[propName] === 'object' && 
          !React.isValidElement(safeProps[propName])) {
        console.warn(`Preventing React error #31: Object in prop ${propName}`, safeProps[propName]);
        
        if (safeProps[propName].house_no || safeProps[propName].village_no || 
            safeProps[propName].soi || safeProps[propName].road || 
            safeProps[propName].subdistrict || safeProps[propName].district || 
            safeProps[propName].province || safeProps[propName].postal_code) {
          const parts = [
            safeProps[propName].house_no ? `บ้านเลขที่ ${safeProps[propName].house_no}` : '',
            safeProps[propName].village_no ? `หมู่ ${safeProps[propName].village_no}` : '',
            safeProps[propName].soi ? `ซอย ${safeProps[propName].soi}` : '',
            safeProps[propName].road ? `ถนน ${safeProps[propName].road}` : '',
            safeProps[propName].subdistrict ? `ตำบล/แขวง ${safeProps[propName].subdistrict}` : '',
            safeProps[propName].district ? `อำเภอ/เขต ${safeProps[propName].district}` : '',
            safeProps[propName].province ? `จังหวัด ${safeProps[propName].province}` : '',
            safeProps[propName].postal_code ? `รหัสไปรษณีย์ ${safeProps[propName].postal_code}` : '',
          ].filter(Boolean);
          safeProps[propName] = parts.join('\n') || 'Address not available';
        } else {
          try {
            safeProps[propName] = JSON.stringify(safeProps[propName]);
          } catch (error) {
            safeProps[propName] = '[Object]';
          }
        }
      }
    });
  }
  
  return originalCreateElement(type, safeProps, ...safeChildren);
};

// Export the original createElement for reference
export { originalCreateElement };
