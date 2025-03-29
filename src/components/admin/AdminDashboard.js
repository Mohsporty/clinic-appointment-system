// client/src/components/admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, Paper, Card, CardContent, Tabs, Tab } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import AdminHeader from './AdminHeader';
import axios from 'axios';
import { useAppContext } from '../context/AppContext';
import AdminAppointments from './AdminAppointments';
import AdminPatients from './AdminPatients';
import AdminDocuments from './AdminDocuments';
import AdminLayout from './AdminLayout';

const AdminDashboard = () => {
  const { user } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    totalPatients: 0,
    newPatients: 0,
    upcomingAppointments: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    pendingEditRequests: 0,
    todayAppointments: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      // جلب إحصائيات لوحة المدير
      const { data } = await axios.get('/api/admin/dashboard', config);
      
      setStats(data.stats);
      setError('');
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'فشل في تحميل إحصائيات لوحة التحكم'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // المحتوى الرئيسي للصفحة
  const dashboardContent = (
    <>
      <AdminHeader title="لوحة تحكم المدير" onRefresh={fetchDashboardStats} />
      
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* بطاقات الإحصائيات */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ height: '100%', borderRight: 4, borderColor: 'primary.main' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  المواعيد اليوم
                </Typography>
                <Typography variant="h3" color="primary">
                  {stats.todayAppointments}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  من إجمالي {stats.totalAppointments} موعد
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ height: '100%', borderRight: 4, borderColor: 'success.main' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  إجمالي المرضى
                </Typography>
                <Typography variant="h3" color="success.main">
                  {stats.totalPatients}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  منهم {stats.newPatients} مرضى جدد
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ height: '100%', borderRight: 4, borderColor: 'warning.main' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  طلبات التعديل
                </Typography>
                <Typography variant="h3" color="warning.main">
                  {stats.pendingEditRequests}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  تحتاج للمراجعة والموافقة
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ height: '100%', borderRight: 4, borderColor: 'info.main' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  مواعيد معلقة
                </Typography>
                <Typography variant="h3" color="info.main">
                  {stats.pendingAppointments}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  بانتظار التأكيد من الإدارة
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* لوحة تحكم تفاعلية */}
        <Paper sx={{ width: '100%', mb: 4 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="المواعيد" />
            <Tab label="المرضى" />
            <Tab label="الوثائق" />
          </Tabs>
          
          <Box sx={{ p: 2 }}>
            {activeTab === 0 && <AdminAppointments compact />}
            {activeTab === 1 && <AdminPatients compact />}
            {activeTab === 2 && <AdminDocuments compact />}
          </Box>
        </Paper>
      </Container>
    </>
  );

  return (
    <AdminLayout>
      {dashboardContent}
    </AdminLayout>
  );
};

export default AdminDashboard;