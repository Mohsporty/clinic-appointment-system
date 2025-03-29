// client/src/components/admin/AdminHeader.js
import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Badge, 
  Menu, 
  MenuItem, 
  Box,
  Avatar,
  Button
} from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  AccountCircle,
  Refresh as RefreshIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const AdminHeader = ({ title, onRefresh }) => {
  const { user, logout } = useAppContext();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleNotificationsMenuOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };
  
  const handleNotificationsMenuClose = () => {
    setNotificationsAnchorEl(null);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: '1px solid #e0e0e0' }}>
      <Toolbar>
        <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
          <IconButton color="inherit" edge="start">
            <MenuIcon />
          </IconButton>
        </Box>
        
        <Typography variant="h6" component="h1" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          {title}
        </Typography>
        
        {onRefresh && (
          <Button 
            color="primary" 
            startIcon={<RefreshIcon />} 
            onClick={onRefresh}
            sx={{ mx: 1 }}
          >
            تحديث
          </Button>
        )}
        
        <IconButton color="inherit" onClick={handleNotificationsMenuOpen}>
          <Badge badgeContent={4} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
        
        <IconButton
          edge="end"
          aria-haspopup="true"
          color="inherit"
          onClick={handleProfileMenuOpen}
          sx={{ ml: 1 }}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            {user?.name?.charAt(0) || 'A'}
          </Avatar>
        </IconButton>
        
        {/* قائمة الإشعارات */}
        <Menu
          anchorEl={notificationsAnchorEl}
          keepMounted
          open={Boolean(notificationsAnchorEl)}
          onClose={handleNotificationsMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={handleNotificationsMenuClose}>طلب تعديل موعد جديد</MenuItem>
          <MenuItem onClick={handleNotificationsMenuClose}>مريض جديد سجل في النظام</MenuItem>
          <MenuItem onClick={handleNotificationsMenuClose}>تم إلغاء موعد</MenuItem>
        </Menu>
        
        {/* قائمة الملف الشخصي */}
        <Menu
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={handleMenuClose}>الملف الشخصي</MenuItem>
          <MenuItem onClick={handleMenuClose}>الإعدادات</MenuItem>
          <MenuItem onClick={handleLogout}>تسجيل الخروج</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default AdminHeader;