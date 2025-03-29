// client/src/components/layout/Header.js
import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  AccountCircle as AccountIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';

const Header = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  
  // استخدام Context بدلاً من localStorage مباشرة
  const { isAuthenticated, logout } = useAppContext();
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    logout(); // استدعاء وظيفة logout من Context
    navigate('/login');
    handleClose();
  };
  
  const handleDashboard = () => {
    navigate('/dashboard');
    handleClose();
  };
  
  return (
    <AppBar position="static" sx={{ bgcolor: '#fff', color: '#333', boxShadow: 1 }}>
      <Container>
        <Toolbar>
          <Typography
            variant="h5"
            component={RouterLink}
            to="/"
            sx={{
              flexGrow: 1,
              color: 'primary.main',
              fontWeight: 'bold',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <CalendarIcon sx={{ mr: 1 }} />
            نظام حجز المواعيد الطبية
          </Typography>
          
          <Box>
            {isAuthenticated ? (
              <div>
                <IconButton
                  size="large"
                  onClick={handleMenu}
                  color="primary"
                >
                  <AccountIcon />
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem onClick={handleDashboard}>لوحة التحكم</MenuItem>
                  <MenuItem onClick={handleLogout}>تسجيل الخروج</MenuItem>
                </Menu>
              </div>
            ) : (
              <Box>
                <Button
                  color="primary"
                  component={RouterLink}
                  to="/login"
                  sx={{ ml: 1 }}
                >
                  تسجيل الدخول
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  component={RouterLink}
                  to="/register"
                >
                  إنشاء حساب
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;