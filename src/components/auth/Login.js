// client/src/components/auth/Login.js
import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
  const { login, isAuthenticated, user } = useAppContext();
  
  // إعادة التوجيه إذا كان المستخدم مسجل الدخول بالفعل
  useEffect(() => {
    if (isAuthenticated) {
      // توجيه المستخدم حسب دوره
      if (user && user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);
  
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
      // استخدام وظيفة login من Context
      const result = await login(email, password);
      
      if (!result.success) {
        setError(result.message);
      } else {
        // توجيه المستخدم حسب دوره باستخدام مسار خاص بالتوجيه
        navigate('/role-redirect');
      }
    } catch (err) {
      setError('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
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