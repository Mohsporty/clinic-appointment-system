// client/src/components/dashboard/AppointmentsList.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format, parseISO, addDays, differenceInHours } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CardActions, 
  Grid, 
  Chip, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  MenuItem, 
  CircularProgress,
  Alert,
  Tooltip,
  Snackbar
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  ChangeCircle as ChangeCircleIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const AppointmentsList = ({ user }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openEditRequestDialog, setOpenEditRequestDialog] = useState(false);
  
  // Form state
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [appointmentType, setAppointmentType] = useState('new'); // Default to 'new'
  const [paymentMethod, setPaymentMethod] = useState('cash'); // Default to 'cash'
  
  // Edit request state
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editRequestLoading, setEditRequestLoading] = useState(false);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [bookedTimes, setBookedTimes] = useState([]);
  
  // Default available times
  const defaultTimes = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30'
  ];

  // Appointment types
  const appointmentTypes = [
    { value: 'new', label: 'كشف جديد', price: 300 },
    { value: 'followup', label: 'متابعة', price: 200 },
    { value: 'consultation', label: 'استشارة', price: 250 }
  ];
  
  // Payment methods
  const paymentMethods = [
    { value: 'cash', label: 'نقداً عند الزيارة' },
    { value: 'creditCard', label: 'بطاقة ائتمان' },
    { value: 'insurance', label: 'تأمين طبي' },
    { value: 'bankTransfer', label: 'تحويل بنكي' }
  ];
  
  // Improved fetchAppointments with useCallback
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user || !user.token) {
        setError('User authentication required');
        setLoading(false);
        return;
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      const { data } = await axios.get('/api/appointments', config);
      
      // Sort appointments by date (closest first)
      const sortedAppointments = data.sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
      });
      
      setAppointments(sortedAppointments);
      setError('');
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Failed to load appointments'
      );
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  // Fetch available times for a specific date
  const fetchAvailableTimes = useCallback(async (selectedDate) => {
    try {
      if (!selectedDate || !user?.token) return;
      
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      const { data } = await axios.get(`/api/appointments/booked/${selectedDate}`, config);
      setBookedTimes(data);
      
      // Set available times by filtering out booked times
      const available = defaultTimes.filter(time => !data.includes(time));
      setAvailableTimes(available);
    } catch (error) {
      console.error('Error fetching available times:', error);
      setError('Failed to fetch available times');
    }
  }, [user]);
  
  useEffect(() => {
    if (user && user.token) {
      fetchAppointments();
    }
  }, [fetchAppointments, user]);
  
  useEffect(() => {
    // Fetch available times when date changes
    if (date) {
      fetchAvailableTimes(date);
    }
  }, [date, fetchAvailableTimes]);
  
  useEffect(() => {
    // Fetch available times for new date in edit request
    if (newDate) {
      fetchAvailableTimes(newDate);
    }
  }, [newDate, fetchAvailableTimes]);
  
  const handleOpenDialog = (appointment = null) => {
    if (appointment) {
      // We've removed direct appointment editing for patients
      setSelectedAppointment(appointment);
      
      // Instead, open the edit request dialog
      handleOpenEditRequestDialog(appointment);
    } else {
      // Mode for adding
      setSelectedAppointment(null);
      const tomorrow = addDays(new Date(), 1);
      setDate(format(tomorrow, 'yyyy-MM-dd'));
      setTime('');
      setReason('');
      setNotes('');
      setAppointmentType('new');
      setPaymentMethod('cash');
      setOpenDialog(true);
    }
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAppointment(null);
  };
  
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedAppointment(null);
  };
  
  // دوال لطلب تعديل الموعد
  const handleOpenEditRequestDialog = (appointment) => {
    setSelectedAppointment(appointment);
    setNewDate(format(new Date(appointment.date), 'yyyy-MM-dd'));
    setNewTime(appointment.time);
    setEditReason('');
    setOpenEditRequestDialog(true);
  };
  
  const handleCloseEditRequestDialog = () => {
    setOpenEditRequestDialog(false);
    setSelectedAppointment(null);
    setNewDate('');
    setNewTime('');
    setEditReason('');
  };
  
  const handleSubmitEditRequest = async () => {
    try {
      setEditRequestLoading(true);
      
      // التحقق من صحة البيانات
      if (!newDate || !newTime || !editReason) {
        setError('يرجى ملء جميع الحقول المطلوبة');
        setEditRequestLoading(false);
        return;
      }
      
      // التحقق أن المستخدم لم يختر موعدًا في الماضي
      const selectedDate = new Date(newDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        setError('لا يمكن اختيار تاريخ في الماضي');
        setEditRequestLoading(false);
        return;
      }
      
      // التحقق من عدم اختيار وقت محجوز
      if (bookedTimes.includes(newTime)) {
        setError('هذا الوقت محجوز بالفعل، يرجى اختيار وقت آخر');
        setEditRequestLoading(false);
        return;
      }
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        }
      };
      
      // إرسال طلب التعديل
      await axios.post(
        `/api/appointments/${selectedAppointment._id}/edit-request`,
        { newDate, newTime, reason: editReason },
        config
      );
      
      // تحديث المواعيد بعد إرسال الطلب
      fetchAppointments();
      
      // إغلاق النافذة
      handleCloseEditRequestDialog();
      
      // عرض رسالة نجاح
      setSuccessMessage('تم إرسال طلب التعديل بنجاح وسيتم مراجعته من قبل المدير');
    } catch (error) {
      console.error('خطأ في إرسال طلب التعديل:', error);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'فشل في إرسال طلب التعديل'
      );
    } finally {
      setEditRequestLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // التحقق من صحة البيانات
      if (!date || !time || !reason || !appointmentType || !paymentMethod) {
        setError('يرجى ملء جميع الحقول المطلوبة');
        setLoading(false);
        return;
      }
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        }
      };
      
      // بيانات إنشاء موعد جديد
      const appointmentData = {
        date,
        time,
        reason,
        notes: notes || '',
        type: appointmentType,
        paymentMethod,
        paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid'
      };
      
      console.log('بيانات الموعد المرسلة:', appointmentData);
      
      await axios.post('/api/appointments', appointmentData, config);
      
      // إعادة تحميل المواعيد
      fetchAppointments();
      handleCloseDialog();
      setSuccessMessage('تم حجز الموعد بنجاح');
    } catch (error) {
      console.error('خطأ في إنشاء الموعد:', error);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'فشل في إنشاء الموعد'
      );
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteAppointment = async () => {
    try {
      setLoading(true);
      
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      await axios.put(`/api/appointments/${selectedAppointment._id}/cancel`, {}, config);
      
      // إعادة تحميل المواعيد
      fetchAppointments();
      handleCloseDeleteDialog();
      setSuccessMessage('تم إلغاء الموعد بنجاح');
    } catch (error) {
      console.error('خطأ في إلغاء الموعد:', error);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'فشل في إلغاء الموعد'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // تحويل حالة الموعد إلى نص عربي ولون
  const getStatusChip = (status) => {
    let label, color;
    
    switch (status) {
      case 'scheduled':
        label = 'مجدول';
        color = 'primary';
        break;
      case 'cancelled':
        label = 'ملغي';
        color = 'error';
        break;
      case 'completed':
        label = 'مكتمل';
        color = 'success';
        break;
      case 'no-show':
        label = 'لم يحضر';
        color = 'warning';
        break;
      default:
        label = status;
        color = 'default';
    }
    
    return <Chip label={label} color={color} size="small" />;
  };
  
  // عرض حالة طلب التعديل
  const getEditRequestStatusChip = (appointment) => {
    if (!appointment.editRequestStatus) return null;
    
    let label, color;
    
    switch (appointment.editRequestStatus) {
      case 'pending':
        label = 'طلب تعديل قيد الانتظار';
        color = 'warning';
        break;
      case 'approved':
        label = 'تم الموافقة على التعديل';
        color = 'success';
        break;
      case 'rejected':
        label = 'تم رفض التعديل';
        color = 'error';
        break;
      default:
        return null;
    }
    
    return <Chip label={label} color={color} size="small" sx={{ mt: 1 }} />;
  };
  
  // التحقق من إمكانية تعديل الموعد (بناءً على الوقت المتبقي)
  const canEditAppointment = (appointment) => {
    if (appointment.status === 'cancelled' || 
        appointment.status === 'completed' || 
        appointment.status === 'no-show') {
      return false;
    }
    
    // إذا كان هناك طلب تعديل معلق
    if (appointment.editRequestStatus === 'pending') {
      return false;
    }
    
    const appointmentDate = parseISO(appointment.date);
    const appointmentHour = parseInt(appointment.time.split(':')[0]);
    const appointmentMinute = parseInt(appointment.time.split(':')[1]);
    
    appointmentDate.setHours(appointmentHour, appointmentMinute);
    
    const now = new Date();
    const hoursUntilAppointment = differenceInHours(appointmentDate, now);
    
    // لا يمكن تعديل الموعد قبل 24 ساعة
    return hoursUntilAppointment >= 24;
  };
  
  // إغلاق الإشعار
  const handleCloseSnackbar = () => {
    setSuccessMessage('');
  };
  
  if (loading && appointments.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" component="h2">
          المواعيد
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          حجز موعد جديد
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}
      
      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
      
      {appointments.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="textSecondary">
            لا توجد مواعيد محجوزة. قم بحجز موعد جديد.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {appointments.map((appointment) => (
            <Grid item xs={12} sm={6} md={4} key={appointment._id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  bgcolor: appointment.status === 'cancelled' ? 'grey.100' : 'white'
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" component="div">
                      {format(parseISO(appointment.date), 'EEEE، d MMMM yyyy', { locale: ar })}
                    </Typography>
                    {getStatusChip(appointment.status)}
                  </Box>
                  
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>الوقت:</strong> {appointment.time}
                  </Typography>
                  
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>السبب:</strong> {appointment.reason}
                  </Typography>
                  
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>نوع الزيارة:</strong> {
                      appointment.type === 'new' ? 'كشف جديد' :
                      appointment.type === 'followup' ? 'متابعة' :
                      appointment.type === 'consultation' ? 'استشارة' :
                      appointment.type
                    }
                  </Typography>
                  
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>طريقة الدفع:</strong> {
                      appointment.paymentMethod === 'cash' ? 'نقداً عند الزيارة' :
                      appointment.paymentMethod === 'creditCard' ? 'بطاقة ائتمان' :
                      appointment.paymentMethod === 'insurance' ? 'تأمين طبي' :
                      appointment.paymentMethod === 'bankTransfer' ? 'تحويل بنكي' :
                      appointment.paymentMethod
                    }
                  </Typography>
                  
                  {appointment.notes && (
                    <Typography variant="body2" color="textSecondary">
                      <strong>ملاحظات:</strong> {appointment.notes}
                    </Typography>
                  )}
                  
                  {getEditRequestStatusChip(appointment)}
                  
                  {appointment.editRequestStatus === 'pending' && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>التاريخ المطلوب:</strong> {format(parseISO(appointment.editRequest.newDate), 'd MMMM yyyy', { locale: ar })}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>الوقت المطلوب:</strong> {appointment.editRequest.newTime}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                
                {appointment.status !== 'cancelled' && (
                  <CardActions>
                    {canEditAppointment(appointment) ? (
                      <Button 
                        size="small" 
                        startIcon={<ChangeCircleIcon />}
                        onClick={() => handleOpenEditRequestDialog(appointment)}
                      >
                        طلب تعديل
                      </Button>
                    ) : (
                      <Tooltip title={
                        appointment.editRequestStatus === 'pending' 
                          ? "لديك طلب تعديل معلق" 
                          : "لا يمكن التعديل قبل 24 ساعة من الموعد"
                      }>
                        <span>
                          <Button 
                            size="small" 
                            startIcon={<ChangeCircleIcon />}
                            disabled={true}
                          >
                            طلب تعديل
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                    <Button 
                      size="small" 
                      color="error" 
                      startIcon={<DeleteIcon />}
                      onClick={() => handleCloseDeleteDialog(appointment)}
                    >
                      إلغاء
                    </Button>
                  </CardActions>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* نافذة إضافة موعد جديد */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          حجز موعد جديد
        </DialogTitle>
        
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="date"
              label="التاريخ"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                min: format(new Date(), 'yyyy-MM-dd')
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="time"
              label="الوقت"
              select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              dir="rtl"
            >
              {availableTimes.length > 0 ? (
                availableTimes.map((timeOption) => (
                  <MenuItem key={timeOption} value={timeOption}>
                    {timeOption}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled value="">
                  لا توجد أوقات متاحة في هذا التاريخ
                </MenuItem>
              )}
            </TextField>
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="appointmentType"
              label="نوع الزيارة"
              select
              value={appointmentType}
              onChange={(e) => setAppointmentType(e.target.value)}
              dir="rtl"
            >
              {appointmentTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label} - {type.price} ريال
                </MenuItem>
              ))}
            </TextField>
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="paymentMethod"
              label="طريقة الدفع"
              select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              dir="rtl"
            >
              {paymentMethods.map((method) => (
                <MenuItem key={method.value} value={method.value}>
                  {method.label}
                </MenuItem>
              ))}
            </TextField>
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="reason"
              label="سبب الزيارة"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              dir="rtl"
            />
            
            <TextField
              margin="normal"
              fullWidth
              id="notes"
              label="ملاحظات إضافية"
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              dir="rtl"
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>إلغاء</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            حجز الموعد
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* نافذة تأكيد الإلغاء */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>تأكيد إلغاء الموعد</DialogTitle>
        <DialogContent>
          <Typography>
            هل أنت متأكد من رغبتك في إلغاء هذا الموعد؟
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>تراجع</Button>
          <Button onClick={handleDeleteAppointment} color="error" variant="contained">
            تأكيد الإلغاء
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* نافذة طلب تعديل الموعد */}
      <Dialog open={openEditRequestDialog} onClose={handleCloseEditRequestDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          طلب تعديل الموعد
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 1 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ mt: 2, mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              الموعد الحالي
            </Typography>
            <Typography variant="body2">
              <strong>التاريخ:</strong> {selectedAppointment ? format(parseISO(selectedAppointment.date), 'EEEE، d MMMM yyyy', { locale: ar }) : ''}
            </Typography>
            <Typography variant="body2">
              <strong>الوقت:</strong> {selectedAppointment ? selectedAppointment.time : ''}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <InfoIcon color="info" sx={{ mr: 1 }} />
            <Typography variant="caption" color="text.secondary">
              سيتم مراجعة طلب التعديل من قبل الإدارة والرد عليك
            </Typography>
          </Box>
          
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="newDate"
              label="التاريخ المطلوب"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                min: format(new Date(), 'yyyy-MM-dd')
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="newTime"
              label="الوقت المطلوب"
              select
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              dir="rtl"
            >
              {availableTimes.length > 0 ? (
                availableTimes.map((timeOption) => (
                  <MenuItem key={timeOption} value={timeOption}>
                    {timeOption}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled value="">
                  لا توجد أوقات متاحة في هذا التاريخ
                </MenuItem>
              )}
            </TextField>
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="editReason"
              label="سبب طلب التعديل"
              multiline
              rows={3}
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              dir="rtl"
              placeholder="يرجى ذكر سبب طلب تعديل الموعد"
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseEditRequestDialog}>إلغاء</Button>
          <Button 
            onClick={handleSubmitEditRequest} 
            variant="contained" 
            color="primary"
            disabled={editRequestLoading}
          >
            {editRequestLoading ? 'جاري الإرسال...' : 'إرسال طلب التعديل'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentsList;