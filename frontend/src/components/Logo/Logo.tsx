import React from 'react';
import { Box, Typography } from '@mui/material';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'medium', showText = true }) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return { width: 32, height: 32, fontSize: '0.875rem' };
      case 'large':
        return { width: 64, height: 64, fontSize: '1.5rem' };
      default:
        return { width: 48, height: 48, fontSize: '1.125rem' };
    }
  };

  const sizeConfig = getSize();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* Eye Icon */}
      <Box
        sx={{
          width: sizeConfig.width,
          height: sizeConfig.height,
          borderRadius: '50%',
          background: `linear-gradient(135deg, #E8BEE8 0%, #F8EBF8 100%)`,
          border: `2px solid #9B7DCF`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Eye Shape */}
        <Box
          sx={{
            width: sizeConfig.width * 0.6,
            height: sizeConfig.height * 0.4,
            borderRadius: '50%',
            background: '#D0E0F0',
            border: `2px solid #9B7DCF`,
            position: 'relative',
          }}
        >
          {/* Iris */}
          <Box
            sx={{
              width: sizeConfig.width * 0.3,
              height: sizeConfig.height * 0.2,
              borderRadius: '50%',
              background: '#A070D0',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Pupil */}
            <Box
              sx={{
                width: sizeConfig.width * 0.1,
                height: sizeConfig.height * 0.05,
                borderRadius: '50%',
                background: '#FFFFFF',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Text */}
      {showText && (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: sizeConfig.fontSize,
              fontWeight: 700,
              color: '#9B7DCF',
              lineHeight: 1,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            EVEP
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontSize: `${parseFloat(sizeConfig.fontSize) * 0.6}rem`,
              color: '#7B5DBF',
              lineHeight: 1,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Vision Platform
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Logo;
