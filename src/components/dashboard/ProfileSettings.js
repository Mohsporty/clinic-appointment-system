// client/src/components/dashboard/ProfileSettings.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Grid, 
  Paper, 
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Person as PersonIcon
} from '@mui/icons-material';

const ProfileSettings = ({ user, setUser }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess(false);
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        }
      };
      
      const { data } = await axios.put(
        '/api/users/profile',
        { name, email, phone, password: password || undefined },
        config
      );
      
      // تحديث معلومات المستخدم في التخزين المحلي
      localStorage.setItem('userInfo', JSON.stringify({
        ...data,
        token: user.token
      }));
      
      // تحديث حالة المستخدم
      setUser({
        ...data,
        token: user.token
      });
      
      setSuccess(true);
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'فشل في تحديث الملف الشخصي'
      );
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Paper elevation={0} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <PersonIcon sx={{ fontSize: 30, mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" component="h2">
          الملف الشخصي
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          تم تحديث الملف الشخصي بنجاح
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="الاسم الكامل"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              dir="rtl"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="رقم الهاتف"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              dir="rtl"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="البريد الإلكتروني"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="rtl"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              تغيير كلمة المرور
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="كلمة المرور الجديدة"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText="اتركها فارغة إذا كنت لا تريد تغييرها"
              dir="rtl"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="تأكيد كلمة المرور"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              dir="rtl"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default ProfileSettings;