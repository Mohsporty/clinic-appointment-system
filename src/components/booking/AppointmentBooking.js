// client/src/components/booking/AppointmentBooking.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, 
  Paper, 
  Grid, 
  Typography, 
  Box, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText, 
  Stepper, 
  Step, 
  StepLabel,
  CircularProgress,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip
} from '@mui/material';
import { 
  CalendarMonth as CalendarIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  MedicalServices as MedicalIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { format, addDays, isBefore, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

const AppointmentBooking = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // حالة الحجز
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');
  
  // للتعامل مع الأوقات المتاحة
  const [availableTimes, setAvailableTimes] = useState([]);
  const [bookedTimes, setBookedTimes] = useState([]);
  
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
  
  // الأوقات الأساسية للعيادة
  const clinicTimes = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
  ];
  
  useEffect(() => {
    // التحقق من تسجيل الدخول وتخزين معرف المستخدم
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      navigate('/login?redirect=booking');
      return;
    }
    
    const parsedUserInfo = JSON.parse(userInfo);
    if (!parsedUserInfo._id) {
      console.warn('تحذير: معرف المستخدم غير موجود في بيانات المستخدم المخزنة.');
      
      // يمكنك هنا محاولة الحصول على معرف المستخدم من الخادم إذا لزم الأمر
      const fetchUserProfile = async () => {
        try {
          const config = {
            headers: {
              Authorization: `Bearer ${parsedUserInfo.token}`
            }
          };
          
          const { data } = await axios.get('/api/users/profile', config);
          
          // تحديث بيانات المستخدم في التخزين المحلي مع إضافة المعرف
          const updatedUserInfo = { ...parsedUserInfo, _id: data._id };
          localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
        } catch (error) {
          console.error('خطأ في جلب بيانات المستخدم:', error);
        }
      };
      
      fetchUserProfile();
    }
    
    // تعيين التاريخ الافتراضي (غداً)
    const tomorrow = addDays(new Date(), 1);
    setSelectedDate(format(tomorrow, 'yyyy-MM-dd'));
  }, [navigate]);
  
  useEffect(() => {
    // جلب الأوقات المحجوزة للتاريخ المحدد
    const fetchBookedTimes = async () => {
      if (!selectedDate) return;
      
      try {
        setLoading(true);
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`
          }
        };
        
        const { data } = await axios.get(`/api/appointments/booked/${selectedDate}`, config);
        setBookedTimes(data);
        
        // حساب الأوقات المتاحة
        setAvailableTimes(clinicTimes.filter(time => !data.includes(time)));
      } catch (error) {
        console.error('خطأ في جلب المواعيد المحجوزة:', error);
        setError('حدث خطأ في جلب المواعيد المتاحة. يرجى المحاولة مرة أخرى.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookedTimes();
  }, [selectedDate]);
  
  // التحقق من البيانات
  const validateAppointmentData = () => {
    if (!selectedDate) return 'يرجى تحديد التاريخ';
    if (!selectedTime) return 'يرجى تحديد الوقت';
    if (!appointmentType) return 'يرجى تحديد نوع الموعد';
    if (!selectedPayment) return 'يرجى تحديد طريقة الدفع';
    return null;
  };
  
  const handleNextStep = () => {
    // التحقق من إدخال البيانات المطلوبة
    if (activeStep === 0 && (!selectedDate || !selectedTime)) {
      setError('يرجى تحديد التاريخ والوقت');
      return;
    }
    
    if (activeStep === 1 && !appointmentType) {
      setError('يرجى تحديد نوع الموعد');
      return;
    }
    
    if (activeStep === 2 && !selectedPayment) {
      setError('يرجى اختيار طريقة الدفع');
      console.log('لم يتم اختيار طريقة الدفع، القيمة الحالية:', selectedPayment);
      return;
    }
    
    setError('');
    setActiveStep(prevStep => prevStep + 1);
    
    // طباعة حالة البيانات في كل خطوة
    console.log('الخطوة الحالية:', activeStep, 'البيانات:', {
      date: selectedDate,
      time: selectedTime,
      type: appointmentType,
      paymentMethod: selectedPayment
    });
  };
  
  const handlePreviousStep = () => {
    setActiveStep(prevStep => prevStep - 1);
  };
  
  const handleSubmit = async () => {
    try {
      // تحقق من البيانات قبل الإرسال
      const validationError = validateAppointmentData();
      if (validationError) {
        setError(validationError);
        return;
      }
      
      setLoading(true);
      setError('');
      
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`
        }
      };
      
      // بيانات الموعد مع إضافة معرف المريض
      const appointmentData = {
        patient: userInfo._id, // إضافة معرف المريض
        date: selectedDate,
        time: selectedTime,
        reason: reason || appointmentTypes.find(type => type.value === appointmentType)?.label,
        notes: notes || '',
        type: appointmentType,
        paymentMethod: selectedPayment,
        paymentStatus: selectedPayment === 'cash' ? 'pending' : 'paid'
      };
      
      console.log('البيانات المرسلة للخادم:', appointmentData);
      
      const { data } = await axios.post('/api/appointments', appointmentData, config);
      console.log('استجابة الخادم:', data);
      
      // تمت العملية بنجاح
      setSuccess(true);
      
      // إعادة التعيين بعد فترة
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      console.error('خطأ في إرسال البيانات:', error.response ? error.response.data : error);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'حدث خطأ أثناء حجز الموعد. يرجى المحاولة مرة أخرى.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // تنسيق التاريخ بالعربية
  const formatDateArabic = (dateStr) => {
    try {
      const date = parseISO(dateStr);
      return format(date, 'EEEE d MMMM yyyy', { locale: ar });
    } catch {
      return dateStr;
    }
  };
  
  // الحصول على سعر نوع الموعد
  const getAppointmentPrice = () => {
    const appointmentTypeObj = appointmentTypes.find(type => type.value === appointmentType);
    return appointmentTypeObj ? appointmentTypeObj.price : 0;
  };
  
  // إذا تمت العملية بنجاح
  if (success) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            تم حجز موعدك بنجاح!
          </Typography>
          <Typography variant="body1" paragraph>
            سيتم تأكيد الموعد وإرسال تفاصيله لك قريباً.
          </Typography>
          <Typography variant="body1">
            يتم الآن توجيهك إلى لوحة التحكم...
          </Typography>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ mb: 4 }}>
          حجز موعد مع د. سليمان الخالدي
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>اختيار الموعد</StepLabel>
          </Step>
          <Step>
            <StepLabel>نوع الزيارة</StepLabel>
          </Step>
          <Step>
            <StepLabel>الدفع</StepLabel>
          </Step>
          <Step>
            <StepLabel>التأكيد</StepLabel>
          </Step>
        </Stepper>
        
        <Box sx={{ mt: 4 }}>
          {/* الخطوة 1: اختيار التاريخ والوقت */}
          {activeStep === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarIcon sx={{ mr: 1 }} /> اختر التاريخ
                  </Typography>
                  <TextField
                    type="date"
                    fullWidth
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    inputProps={{
                      min: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
                      max: format(addDays(new Date(), 30), 'yyyy-MM-dd')
                    }}
                    helperText="يمكنك حجز موعد خلال الشهر القادم"
                  />
                </Box>
                
                {selectedDate && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body1" gutterBottom>
                      الموعد المختار: <strong>{formatDateArabic(selectedDate)}</strong>
                    </Typography>
                  </Box>
                )}
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <ScheduleIcon sx={{ mr: 1 }} /> اختر الوقت المناسب
                </Typography>
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                    {availableTimes.length > 0 ? (
                      availableTimes.map((time) => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? "contained" : "outlined"}
                          onClick={() => setSelectedTime(time)}
                          sx={{ mb: 1 }}
                        >
                          {time}
                        </Button>
                      ))
                    ) : (
                      <Typography variant="body2" color="error" sx={{ gridColumn: 'span 3' }}>
                        لا توجد مواعيد متاحة في هذا التاريخ، يرجى اختيار تاريخ آخر.
                      </Typography>
                    )}
                  </Box>
                )}
              </Grid>
            </Grid>
          )}
          
          {/* الخطوة 2: نوع الموعد */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <MedicalIcon sx={{ mr: 1 }} /> حدد نوع الزيارة
              </Typography>
              
              <RadioGroup
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value)}
              >
                <Grid container spacing={2}>
                  {appointmentTypes.map((type) => (
                    <Grid item xs={12} md={4} key={type.value}>
                      <Paper 
                        elevation={appointmentType === type.value ? 3 : 1}
                        sx={{ 
                          p: 2, 
                          border: appointmentType === type.value ? 2 : 1,
                          borderColor: appointmentType === type.value ? 'primary.main' : 'divider',
                          position: 'relative'
                        }}
                      >
                        <FormControlLabel
                          value={type.value}
                          control={<Radio />}
                          label={
                            <Box>
                              <Typography variant="subtitle1">{type.label}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {type.value === 'new' && 'للمرضى الجدد أو حالات جديدة'}
                                {type.value === 'followup' && 'لمتابعة حالة سابقة'}
                                {type.value === 'consultation' && 'استشارة طبية سريعة'}
                              </Typography>
                              <Chip 
                                label={`${type.price} ريال`} 
                                color="primary" 
                                size="small"
                                sx={{ mt: 1 }}
                              />
                            </Box>
                          }
                          sx={{ m: 0 }}
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </RadioGroup>
              
              <Box sx={{ mt: 3 }}>
                <TextField
                  fullWidth
                  label="سبب الزيارة أو ملاحظات إضافية"
                  multiline
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  helperText="اختياري: أضف أي تفاصيل قد تساعد الطبيب في الاستعداد لزيارتك"
                />
              </Box>
            </Box>
          )}
          
          {/* الخطوة 3: طريقة الدفع - المعدلة */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                اختر طريقة الدفع
              </Typography>
              
              {/* RadioGroup مباشر */}
              <RadioGroup
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
                name="payment-methods"
              >
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {paymentMethods.map((method) => (
                    <Grid item xs={12} sm={4} key={method.value}>
                      <Paper 
                        elevation={selectedPayment === method.value ? 3 : 1}
                        sx={{ 
                          p: 2, 
                          border: selectedPayment === method.value ? 2 : 1,
                          borderColor: selectedPayment === method.value ? 'primary.main' : 'divider',
                          cursor: 'pointer',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        onClick={() => setSelectedPayment(method.value)}
                      >
                        <FormControlLabel
                          value={method.value}
                          control={<Radio />}
                          label={method.label}
                          sx={{ width: '100%' }}
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </RadioGroup>
              
              {/* إضافة قسم للتأكد من أن طريقة الدفع تم اختيارها */}
              {selectedPayment && (
                <Typography variant="body1" sx={{ mt: 2, color: 'success.main' }}>
                  تم اختيار طريقة الدفع: {paymentMethods.find(method => method.value === selectedPayment)?.label}
                </Typography>
              )}
              
              <Box sx={{ bgcolor: 'action.hover', p: 3, borderRadius: 1, mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  ملخص التكلفة:
                </Typography>
                <Grid container sx={{ mb: 1 }}>
                  <Grid item xs={8}>
                    <Typography variant="body1">
                      {appointmentTypes.find(type => type.value === appointmentType)?.label || 'الزيارة'}:
                    </Typography>
                  </Grid>
                  <Grid item xs={4} sx={{ textAlign: 'left' }}>
                    <Typography variant="body1" fontWeight="bold">
                      {getAppointmentPrice()} ريال
                    </Typography>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 1 }} />
                
                <Grid container>
                  <Grid item xs={8}>
                    <Typography variant="subtitle1">
                      الإجمالي:
                    </Typography>
                  </Grid>
                  <Grid item xs={4} sx={{ textAlign: 'left' }}>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary">
                      {getAppointmentPrice()} ريال
                    </Typography>
                  </Grid>
                </Grid>
                
                {selectedPayment === 'insurance' && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    يرجى إحضار بطاقة التأمين الخاصة بك عند الزيارة
                  </Alert>
                )}
                
                {selectedPayment === 'creditCard' && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    سيتم تحويلك إلى بوابة الدفع لإتمام العملية
                  </Alert>
                )}
              </Box>
            </Box>
          )}
          
          {/* الخطوة 4: التأكيد النهائي */}
          {activeStep === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                تأكيد الحجز
              </Typography>
              
              <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      تفاصيل الموعد
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <CalendarIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="التاريخ"
                          secondary={formatDateArabic(selectedDate)}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <ScheduleIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="الوقت"
                          secondary={selectedTime}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <MedicalIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="نوع الزيارة"
                          secondary={appointmentTypes.find(type => type.value === appointmentType)?.label}
                        />
                      </ListItem>
                    </List>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      تفاصيل الدفع
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="طريقة الدفع"
                          secondary={paymentMethods.find(method => method.value === selectedPayment)?.label}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="المبلغ الإجمالي"
                          secondary={`${getAppointmentPrice()} ريال`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="حالة الدفع"
                          secondary={selectedPayment === 'cash' ? 'الدفع عند الزيارة' : 'مدفوع'}
                        />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
                
                {reason && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      ملاحظات إضافية:
                    </Typography>
                    <Typography variant="body2">
                      {reason}
                    </Typography>
                  </Box>
                )}
              </Paper>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                يرجى الوصول قبل الموعد بـ 15 دقيقة. في حال الرغبة بإلغاء الموعد، يرجى الإبلاغ قبل 24 ساعة على الأقل.
              </Alert>
            </Box>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          {activeStep > 0 && (
            <Button
              variant="outlined"
              onClick={handlePreviousStep}
            >
              رجوع
            </Button>
          )}
          
          {activeStep < 3 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNextStep}
              disabled={
                (activeStep === 0 && (!selectedDate || !selectedTime)) ||
                (activeStep === 1 && !appointmentType) ||
                (activeStep === 2 && !selectedPayment)
              }
            >
              متابعة
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} color="inherit" />}
            >
              {loading ? 'جاري الحجز...' : 'تأكيد الحجز'}
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default AppointmentBooking;