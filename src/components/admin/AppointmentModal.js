// client/src/components/admin/AppointmentModal.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
  Alert,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
  Paper,
  Grid
} from '@mui/material';
import axios from 'axios';
import { format } from 'date-fns';

const AppointmentModal = ({ open, handleClose, refreshAppointments }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // إضافة حقول نوع الزيارة وطريقة الدفع
  const [type, setType] = useState('new');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  
  // أنواع المواعيد
  const appointmentTypes = [
    { value: 'new', label: 'كشف جديد', price: 300 },
    { value: 'followup', label: 'متابعة', price: 200 },
    { value: 'consultation', label: 'استشارة', price: 250 }
  ];
  
  // طرق الدفع
  const paymentMethods = [
    { value: 'cash', label: 'نقداً عند الزيارة' },
    { value: 'creditCard', label: 'بطاقة ائتمان' },
    { value: 'insurance', label: 'تأمين طبي' }
  ];
  
  // الأوقات المتاحة
  const availableTimes = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
  ];
  
  // إعادة تعيين الحقول عند فتح النافذة
  useEffect(() => {
    if (open) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(format(tomorrow, 'yyyy-MM-dd'));
      setTime('');
      setReason('');
      setNotes('');
      setType('new');
      setPaymentMethod('cash');
      setError('');
    }
  }, [open]);
  
  const handleSubmit = async () => {
    // التحقق من صحة البيانات
    if (!date || !time || !reason) {
      setError('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`
        }
      };
      
      // بيانات الموعد
      const appointmentData = {
        date,
        time,
        reason,
        notes,
        type,  // إضافة نوع الزيارة
        paymentMethod,  // إضافة طريقة الدفع
        paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid'
      };
      
      console.log('بيانات الموعد المرسلة للخادم:', appointmentData);
      
      await axios.post('/api/appointments', appointmentData, config);
      
      setLoading(false);
      handleClose();
      refreshAppointments();
    } catch (error) {
      console.error('خطأ في إنشاء الموعد:', error.response ? error.response.data : error);
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'حدث خطأ أثناء إنشاء الموعد'
      );
    }
  };
  
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>حجز موعد جديد</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {/* التاريخ */}
            <Grid item xs={12} md={6}>
              <TextField
                label="التاريخ *"
                type="date"
                fullWidth
                value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            
            {/* الوقت */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>الوقت *</InputLabel>
                <Select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  label="الوقت *"
                >
                  {availableTimes.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* سبب الزيارة */}
            <Grid item xs={12}>
              <TextField
                label="سبب الزيارة *"
                fullWidth
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </Grid>
            
            {/* نوع الزيارة - جديد */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                نوع الزيارة *
              </Typography>
              <RadioGroup
                row
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {appointmentTypes.map((appointmentType) => (
                  <FormControlLabel
                    key={appointmentType.value}
                    value={appointmentType.value}
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2">
                          {appointmentType.label}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {appointmentType.price} ريال
                        </Typography>
                      </Box>
                    }
                  />
                ))}
              </RadioGroup>
            </Grid>
            
            {/* طريقة الدفع - جديد */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                طريقة الدفع *
              </Typography>
              <RadioGroup
                row
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                {paymentMethods.map((method) => (
                  <FormControlLabel
                    key={method.value}
                    value={method.value}
                    control={<Radio />}
                    label={method.label}
                  />
                ))}
              </RadioGroup>
            </Grid>
            
            {/* ملاحظات إضافية */}
            <Grid item xs={12}>
              <TextField
                label="ملاحظات إضافية"
                fullWidth
                multiline
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Grid>
          </Grid>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>إلغاء</Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'جاري الحجز...' : 'حجز الموعد'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AppointmentModal;