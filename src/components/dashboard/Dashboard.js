// client/src/components/dashboard/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Grid, 
  Button, 
  Card, 
  CardContent, 
  CardActions,
  Tabs,
  Tab,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  CalendarToday as CalendarIcon,
  Description as DocumentIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';

// مكونات الألسنة
import AppointmentsList from './AppointmentsList';
import DocumentsList from './DocumentsList';
import ProfileSettings from './ProfileSettings';
import AdminPanel from './AdminPanel';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // التحقق من وجود مستخدم مسجل الدخول
    const userInfo = localStorage.getItem('userInfo');
    
    if (!userInfo) {
      navigate('/login');
      return;
    }
    
    setUser(JSON.parse(userInfo));
    setLoading(false);
  }, [navigate]);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {user.role === 'admin' ? 'لوحة تحكم المدير' : 'صفحتي الشخصية'}
          </Typography>
          
          <Box>
            <Button
              variant="outlined"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
            >
              تسجيل الخروج
            </Button>
          </Box>
        </Box>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="dashboard tabs"
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            dir="rtl"
          >
            <Tab icon={<CalendarIcon />} label="المواعيد" />
            <Tab icon={<DocumentIcon />} label="الوثائق والتقارير" />
            <Tab icon={<PersonIcon />} label="الملف الشخصي" />
            {user.role === 'admin' && <Tab label="لوحة المدير" />}
          </Tabs>
        </Box>
        
        <Box sx={{ pt: 3 }}>
          {/* مكون المواعيد */}
          {activeTab === 0 && <AppointmentsList user={user} />}
          
          {/* مكون الوثائق */}
          {activeTab === 1 && <DocumentsList user={user} />}
          
          {/* مكون الملف الشخصي */}
          {activeTab === 2 && <ProfileSettings user={user} setUser={setUser} />}
          
          {/* مكون لوحة المدير */}
          {user.role === 'admin' && activeTab === 3 && <AdminPanel />}
        </Box>
      </Paper>
    </Container>
  );
};

export default Dashboard;