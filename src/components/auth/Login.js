// client/src/components/auth/Login.js
import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Container, 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Alert, 
  CircularProgress,
  Avatar,
  Link
} from '@mui/material';
import {
  Lock as LockIcon
} from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user, loading } = useAppContext();
  
  // استخراج معلمات URL
  const urlParams = new URLSearchParams(location.search);
  const redirectPath = urlParams.get('redirect');
  const expired = urlParams.get('expired');
  
  // إعادة التوجيه إذا كان المستخدم مسجل الدخول بالفعل
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('المستخدم مسجل الدخول بالفعل، إعادة التوجيه...');
      // توجيه المستخدم حسب دوره أو إلى الصفحة المطلوبة
      if (redirectPath) {
        navigate(redirectPath);
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate, redirectPath]);
  
  // إظهار رسالة خطأ إذا انتهت صلاحية الجلسة
  useEffect(() => {
    if (expired === 'true') {
      setError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
    }
  }, [expired]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // التحقق من صحة الإدخال
    if (!email || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      console.log('محاولة تسجيل الدخول...'); // للتشخيص
      
      // استخدام وظيفة login من Context
      const result = await login(email, password);
      console.log('نتيجة تسجيل الدخول:', result); // للتشخيص
      
      if (!result.success) {
        setError(result.message);
      } else {
        // توجيه المستخدم حسب دوره أو إلى الصفحة المطلوبة
        if (redirectPath) {
          navigate(redirectPath);
        } else {
          navigate('/role-redirect');
        }
      }
    } catch (err) {
      console.error('خطأ غير متوقع في تسجيل الدخول:', err);
      setError('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // إذا كانت حالة التحميل الأولية قيد التنفيذ
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <div className="centered-container">
      <Paper elevation={3} className="auth-card">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
            <LockIcon fontSize="large" />
          </Avatar>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            تسجيل الدخول
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            مرحبًا بك في نظام حجز المواعيد الطبية
          </Typography>
        </Box>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="البريد الإلكتروني"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
            variant="outlined"
            dir="rtl"
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="كلمة المرور"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3 }}
            variant="outlined"
            dir="rtl"
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isSubmitting}
            sx={{ py: 1.5, mb: 2 }}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'تسجيل الدخول'}
          </Button>
          
          <Box mt={2} textAlign="center">
            <Typography variant="body2">
              ليس لديك حساب؟{' '}
              <Link 
                component={RouterLink}
                to="/register"
                color="primary"
                fontWeight="medium"
              >
                سجل الآن
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </div>
  );
};

export default Login;