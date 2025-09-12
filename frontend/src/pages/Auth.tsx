import React, { useState } from 'react';
import { Box, Fade } from '@mui/material';
import LoginForm from '../components/Auth/LoginForm';
import RegisterForm from '../components/Auth/RegisterForm';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  const handleSwitchToRegister = () => {
    setIsLogin(false);
  };

  const handleSwitchToLogin = () => {
    setIsLogin(true);
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Fade in={true} timeout={500}>
        <Box>
          {isLogin ? (
            <LoginForm
              onSwitchToRegister={handleSwitchToRegister}
              onForgotPassword={() => {
                // TODO: Implement forgot password functionality
                console.log('Forgot password clicked');
              }}
            />
          ) : (
            <RegisterForm onSwitchToLogin={handleSwitchToLogin} />
          )}
        </Box>
      </Fade>
    </Box>
  );
};

export default Auth;
