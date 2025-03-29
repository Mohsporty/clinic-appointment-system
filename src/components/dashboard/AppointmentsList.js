// client/src/components/dashboard/AppointmentsList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
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
  Tooltip
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
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openEditRequestDialog, setOpenEditRequestDialog] = useState(false);
  
  // حالة النموذج
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  
  // حالة طلب التعديل
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editRequestLoading, setEditRequestLoading] = useState(false);
  
  // الأوقات المتاحة
  const availableTimes = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30'
  ];
  
  useEffect(() => {
    fetchAppointments();
  }, []);
  
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      const { data } = await axios.get('/api/appointments', config);
      
      // ترتيب المواعيد حسب التاريخ (الأقرب أولاً)
      const sortedAppointments = data.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      setAppointments(sortedAppointments);
      setError('');
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'فشل في تحميل المواعيد'
      );
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenDialog = (appointment = null) => {
    if (appointment) {
      // تم إزالة وضع التعديل المباشر للمواعيد للمرضى
      setSelectedAppointment(appointment);
      
      // بدلاً من ذلك، نفتح نافذة طلب التعديل
      handleOpenEditRequestDialog(appointment);
    } else {
      // وضع للإضافة
      setSelectedAppointment(null);
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setTime('');
      setReason('');
      setNotes('');
      setOpenDialog(true);
    }
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAppointment(null);
  };
  
  const handleOpenDeleteDialog = (appointment) => {
    setSelectedAppointment(appointment);
    setOpenDeleteDialog(true);
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
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        }
      };
      
      // إرسال طلب التعديل
      const { data } = await axios.post(
        `/api/appointments/${selectedAppointment._id}/edit-request`,
        { newDate, newTime, reason: editReason },
        config
      );
      
      // تحديث المواعيد بعد إرسال الطلب
      fetchAppointments();
      
      // إغلاق النافذة
      handleCloseEditRequestDialog();
      
      // عرض رسالة نجاح
      setError('');
      alert('تم إرسال طلب التعديل بنجاح وسيتم مراجعته من قبل المدير');
      
    } catch (error) {
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
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        }
      };
      
      // إنشاء موعد جديد فقط (تم إزالة تعديل الموعد المباشر)
      await axios.post(
        '/api/appointments',
        { date, time, reason, notes },
        config
      );
      
      // إعادة تحميل المواعيد
      fetchAppointments();
      handleCloseDialog();
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'فشل في إنشاء الموعد'
      );
    }
  };
  
  const handleDeleteAppointment = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      await axios.put(`/api/appointments/${selectedAppointment._id}/cancel`, {}, config);
      
      // إعادة تحميل المواعيد
      fetchAppointments();
      handleCloseDeleteDialog();
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'فشل في إلغاء الموعد'
      );
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
    
    const appointmentDate = new Date(appointment.date);
    appointmentDate.setHours(
      parseInt(appointment.time.split(':')[0]),
      parseInt(appointment.time.split(':')[1])
    );
    
    const now = new Date();
    const hoursUntilAppointment = (appointmentDate - now) / (1000 * 60 * 60);
    
    // لا يمكن تعديل الموعد قبل 24 ساعة
    return hoursUntilAppointment >= 24;
  };
  
  if (loading) {
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
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
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
                      {format(new Date(appointment.date), 'EEEE، d MMMM yyyy', { locale: ar })}
                    </Typography>
                    {getStatusChip(appointment.status)}
                  </Box>
                  
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>الوقت:</strong> {appointment.time}
                  </Typography>
                  
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>السبب:</strong> {appointment.reason}
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
                        <strong>التاريخ المطلوب:</strong> {format(new Date(appointment.editRequest.newDate), 'd MMMM yyyy', { locale: ar })}
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
                      onClick={() => handleOpenDeleteDialog(appointment)}
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
              {availableTimes.map((timeOption) => (
                <MenuItem key={timeOption} value={timeOption}>
                  {timeOption}
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
              <strong>التاريخ:</strong> {selectedAppointment ? format(new Date(selectedAppointment.date), 'EEEE، d MMMM yyyy', { locale: ar }) : ''}
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
              {availableTimes.map((timeOption) => (
                <MenuItem key={timeOption} value={timeOption}>
                  {timeOption}
                </MenuItem>
              ))}
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