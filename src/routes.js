// client/src/routes.js
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Dashboard from './components/dashboard/Dashboard';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AppointmentBooking from './components/booking/AppointmentBooking';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminAppointments from './components/admin/AdminAppointments';
import AdminPatients from './components/admin/AdminPatients';
import AdminDocuments from './components/admin/AdminDocuments';
import AdminSettings from './components/admin/AdminSettings';
import Home from './components/Home';
import NotFound from './components/NotFound';
import { useAppContext } from './components/context/AppContext';

// مكون جديد للتحكم في تمرير العناوين
const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

// مكون لتوجيه المستخدم حسب دوره
const RoleRedirect = () => {
  const { user, isAuthenticated, loading } = useAppContext();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        if (user.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        navigate('/login', { replace: true });
      }
    }
  }, [isAuthenticated, user, loading, navigate]);
  
  return null; // هذا المكون لا يعرض أي شيء، فقط يوجه المستخدم
};

// مكون للتحقق من المصادقة (محسن)
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user, loading } = useAppContext();
  const location = useLocation();
  
  if (loading) {
    // عرض تحميل بسيط أثناء التحقق من المصادقة
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>جاري التحميل...</div>;
  }
  
  if (!isAuthenticated) {
    // حفظ المسار الحالي للعودة إليه بعد تسجيل الدخول
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  
  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* مسار الصفحة الرئيسية */}
        <Route path="/" element={<Home />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/role-redirect" element={<RoleRedirect />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/booking" element={
          <ProtectedRoute>
            <AppointmentBooking />
          </ProtectedRoute>
        } />
        
        {/* مسارات المدير */}
        <Route path="/admin" element={
          <ProtectedRoute adminOnly={true}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/appointments" element={
          <ProtectedRoute adminOnly={true}>
            <AdminAppointments />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/patients" element={
          <ProtectedRoute adminOnly={true}>
            <AdminPatients />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/documents" element={
          <ProtectedRoute adminOnly={true}>
            <AdminDocuments />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/settings" element={
          <ProtectedRoute adminOnly={true}>
            <AdminSettings />
          </ProtectedRoute>
        } />
        
        {/* صفحة 404 لأي مسار غير معروف */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default AppRoutes;