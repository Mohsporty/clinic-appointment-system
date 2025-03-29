// client/src/components/admin/AdminLayout.js
import React from 'react';
import { Box } from '@mui/material';
import AdminSidebar from './AdminSidebar';

// عرض القائمة الجانبية
const drawerWidth = 280;

const AdminLayout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar />
      
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          marginRight: `${drawerWidth}px`, // هامش على اليمين لفسح مجال للقائمة الجانبية 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          overflowX: 'auto'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;