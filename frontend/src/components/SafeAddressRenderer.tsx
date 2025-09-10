import React from 'react';
import { Typography, Box } from '@mui/material';
import { LocationOn } from '@mui/icons-material';

interface SafeAddressRendererProps {
  address?: any;
  variant?: 'body1' | 'body2' | 'caption';
  showIcon?: boolean;
  multiline?: boolean;
}

/**
 * Safe Address Renderer Component
 * Prevents React error #31 by safely rendering address objects
 */
const SafeAddressRenderer: React.FC<SafeAddressRendererProps> = ({
  address,
  variant = 'body1',
  showIcon = false,
  multiline = true
}) => {
  const formatAddress = (addr: any): string => {
    if (!addr) {
      return 'Address not available';
    }
    
    if (typeof addr === 'string') {
      return addr;
    }
    
    if (typeof addr === 'object') {
      const parts = [
        addr.house_no ? `บ้านเลขที่ ${addr.house_no}` : '',
        addr.village_no ? `หมู่ ${addr.village_no}` : '',
        addr.soi ? `ซอย ${addr.soi}` : '',
        addr.road ? `ถนน ${addr.road}` : '',
        addr.subdistrict ? `ตำบล/แขวง ${addr.subdistrict}` : '',
        addr.district ? `อำเภอ/เขต ${addr.district}` : '',
        addr.province ? `จังหวัด ${addr.province}` : '',
        addr.postal_code ? `รหัสไปรษณีย์ ${addr.postal_code}` : '',
      ].filter(Boolean);
      
      return parts.join(multiline ? '\n' : ', ') || 'Address not available';
    }
    
    return String(addr) || 'Address not available';
  };

  const formattedAddress = formatAddress(address);

  return (
    <Box display="flex" alignItems={multiline ? "flex-start" : "center"} gap={1}>
      {showIcon && <LocationOn color="action" fontSize="small" />}
      <Typography 
        variant={variant} 
        sx={{ 
          whiteSpace: multiline ? "pre-line" : "normal",
          lineHeight: multiline ? 1.6 : "normal",
          color: "text.primary"
        }}
      >
        {formattedAddress}
      </Typography>
    </Box>
  );
};

export default SafeAddressRenderer;
