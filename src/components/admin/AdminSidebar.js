// client/src/components/admin/AdminSidebar.js
import React from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Box, 
  Typography
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  CalendarToday as AppointmentsIcon,
  People as PatientsIcon,
  Description as DocumentsIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const drawerWidth = 280;

const sidebarItems = [
  { text: 'لوحة التحكم', icon: <DashboardIcon />, path: '/admin' },
  { text: 'المواعيد', icon: <AppointmentsIcon />, path: '/admin/appointments' },
  { text: 'المرضى', icon: <PatientsIcon />, path: '/admin/patients' },
  { text: 'الوثائق والتقارير', icon: <DocumentsIcon />, path: '/admin/documents' },
  { text: 'الإعدادات', icon: <SettingsIcon />, path: '/admin/settings' }
];

const AdminSidebar = () => {
  const { user } = useAppContext();
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      anchor="right" // تثبيت القائمة على اليمين
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { 
          width: drawerWidth, 
          boxSizing: 'border-box',
          bgcolor: '#1e2a3a',
          color: 'white',
          borderLeft: 0,
          borderRight: 0,
          position: 'fixed',
          right: 0,
          height: '100%',
        },
      }}
    >
      <Box sx={{ py: 4, px: 2, textAlign: 'center' }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
          نظام المواعيد الطبية
        </Typography>
        <Typography variant="body2" color="inherit" sx={{ opacity: 0.8 }}>
          لوحة تحكم المدير
        </Typography>
      </Box>
      
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />
      
      <Box sx={{ py: 2, px: 2 }}>
        <Typography variant="body2" color="inherit" sx={{ opacity: 0.8, mb: 1 }}>
          مرحباً، {user?.name || 'المدير'}
        </Typography>
      </Box>
      
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />
      
      <List component="nav" sx={{ mt: 2 }}>
        {sidebarItems.map((item) => (
          <ListItem 
            key={item.text} 
            component={Link} 
            to={item.path}
            selected={location.pathname === item.path || location.pathname.startsWith(item.path + '/')}
            sx={{ 
              color: 'white', 
              mb: 1, 
              borderRadius: 1,
              '&.Mui-selected': {
                bgcolor: 'rgba(255, 255, 255, 0.15)',
              },
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default AdminSidebar;