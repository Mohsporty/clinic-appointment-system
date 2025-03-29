// client/src/components/admin/AdminAppointments.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Avatar,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Radio,
  RadioGroup,
  DialogContentText,
  FormHelperText,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ChangeCircle as ChangeCircleIcon,
  Payments as PaymentsIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Money as MoneyIcon,
  MedicalServices as MedicalIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { format, parseISO, isToday, isTomorrow, addDays, isAfter, isBefore } from 'date-fns';
import { ar } from 'date-fns/locale';
import axios from 'axios';
import { useAppContext } from '../context/AppContext';
import AdminHeader from './AdminHeader';
import AdminLayout from './AdminLayout';

const AdminAppointments = ({ compact = false }) => {
  const { user } = useAppContext();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [editRequestFilter, setEditRequestFilter] = useState('all');

  // حالات النوافذ المنبثقة
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [viewDetailDialogOpen, setViewDetailDialogOpen] = useState(false);
  
  // حالات تعديل الموعد
  const [appointmentStatus, setAppointmentStatus] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [medicalReport, setMedicalReport] = useState('');
  const [prescription, setPrescription] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // حالات إنشاء موعد جديد
  const [newAppointmentDate, setNewAppointmentDate] = useState('');
  const [newAppointmentTime, setNewAppointmentTime] = useState('');
  const [newAppointmentType, setNewAppointmentType] = useState('new');
  const [newAppointmentReason, setNewAppointmentReason] = useState('');
  const [newAppointmentNotes, setNewAppointmentNotes] = useState('');
  const [newAppointmentPaymentMethod, setNewAppointmentPaymentMethod] = useState('cash');
  const [newAppointmentPaymentStatus, setNewAppointmentPaymentStatus] = useState('pending');
  const [newAppointmentPaymentAmount, setNewAppointmentPaymentAmount] = useState('');
  const [patientsList, setPatientsList] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [bookedTimes, setBookedTimes] = useState([]);

  // الأوقات المتاحة للمواعيد
  const allAvailableTimes = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30'
  ];

  // أنواع المواعيد والأسعار
  const appointmentTypes = [
    { value: 'new', label: 'كشف جديد', price: 300 },
    { value: 'followup', label: 'متابعة', price: 200 },
    { value: 'consultation', label: 'استشارة', price: 250 }
  ];

  // طرق الدفع
  const paymentMethods = [
    { value: 'cash', label: 'نقداً' },
    { value: 'creditCard', label: 'بطاقة ائتمان' },
    { value: 'insurance', label: 'تأمين طبي' },
    { value: 'bankTransfer', label: 'تحويل بنكي' }
  ];

  // إنشاء تكوين للطلبات مع التوكن
  const getAuthConfig = useCallback(() => {
    return {
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    };
  }, [user.token]);

  // جلب المواعيد
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      
      const config = getAuthConfig();
      
      const { data } = await axios.get('/api/appointments/all', config);
      
      console.log(`تم جلب ${data.length} موعد`);
      setAppointments(data);
      setFilteredAppointments(data);
      setError('');
    } catch (error) {
      console.error('خطأ في جلب المواعيد:', error);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'فشل في تحميل بيانات المواعيد'
      );
    } finally {
      setLoading(false);
    }
  }, [getAuthConfig]);

  // جلب قائمة المرضى
  const fetchPatients = useCallback(async () => {
    try {
      const config = getAuthConfig();
      
      const { data } = await axios.get('/api/users', config);
      setPatientsList(data);
    } catch (error) {
      console.error('خطأ في جلب المرضى:', error);
    }
  }, [getAuthConfig]);

  // جلب الأوقات المتاحة للتاريخ المحدد
  const fetchAvailableTimes = useCallback(async (date) => {
    try {
      if (!date) return;
      
      const config = getAuthConfig();
      
      const { data } = await axios.get(`/api/appointments/booked/${date}`, config);
      setBookedTimes(data);
      
      // تحديد الأوقات المتاحة بناءً على الحجوزات الموجودة
      const available = allAvailableTimes.filter(time => !data.includes(time));
      setAvailableTimeSlots(available);
    } catch (error) {
      console.error('خطأ في جلب الأوقات المتاحة:', error);
    }
  }, [getAuthConfig]);

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
  }, [fetchAppointments, fetchPatients]);

  useEffect(() => {
    // جلب الأوقات المتاحة عند تغيير تاريخ الموعد الجديد
    if (newAppointmentDate) {
      fetchAvailableTimes(newAppointmentDate);
    }
  }, [newAppointmentDate, fetchAvailableTimes]);

  useEffect(() => {
    applyFilters();
  }, [appointments, searchTerm, dateFilter, statusFilter, typeFilter, paymentFilter, editRequestFilter]);

  // تطبيق الفلاتر
  const applyFilters = () => {
    let filtered = [...appointments];
    
    // تطبيق البحث
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        appointment => 
          (appointment.patient && appointment.patient.name && appointment.patient.name.toLowerCase().includes(searchLower)) ||
          (appointment.patient && appointment.patient.phone && appointment.patient.phone.toLowerCase().includes(searchLower)) ||
          (appointment.patient && appointment.patient.email && appointment.patient.email.toLowerCase().includes(searchLower))
      );
    }
    
    // تطبيق فلتر التاريخ
    if (dateFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = addDays(today, 1);
      
      filtered = filtered.filter(appointment => {
        const appointmentDate = parseISO(appointment.date);
        appointmentDate.setHours(0, 0, 0, 0);
        
        switch (dateFilter) {
          case 'today':
            return isToday(appointmentDate);
          case 'tomorrow':
            return isTomorrow(appointmentDate);
          case 'upcoming':
            return isAfter(appointmentDate, today) || isToday(appointmentDate);
          case 'past':
            return isBefore(appointmentDate, today);
          default:
            return true;
        }
      });
    }
    
    // تطبيق فلتر الحالة
    if (statusFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === statusFilter);
    }
    
    // تطبيق فلتر نوع الزيارة
    if (typeFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.type === typeFilter);
    }
    
    // تطبيق فلتر حالة الدفع
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.paymentStatus === paymentFilter);
    }
    
    // تطبيق فلتر طلبات التعديل
    if (editRequestFilter !== 'all') {
      if (editRequestFilter === 'pending') {
        filtered = filtered.filter(appointment => appointment.editRequestStatus === 'pending');
      } else if (editRequestFilter === 'any') {
        filtered = filtered.filter(appointment => appointment.editRequestStatus);
      }
    }
    
    setFilteredAppointments(filtered);
  };

  // دوال معالجة طلبات التعديل
  const handleApproveEditRequest = async (appointment) => {
    try {
      setLoading(true);
      
      // التحقق من وجود طلب تعديل معلق
      if (!appointment.editRequestStatus || appointment.editRequestStatus !== 'pending') {
        setError('لا يوجد طلب تعديل معلق لهذا الموعد');
        setLoading(false);
        return;
      }
      
      const config = getAuthConfig();
      
      // التحقق من توفر التاريخ والوقت الجديد
      const { data: bookedTimes } = await axios.get(
        `/api/appointments/booked/${format(parseISO(appointment.editRequest.newDate), 'yyyy-MM-dd')}`, 
        config
      );
      
      if (bookedTimes.includes(appointment.editRequest.newTime)) {
        setError('الوقت المطلوب غير متاح. الرجاء رفض الطلب واختيار وقت آخر.');
        setLoading(false);
        return;
      }
      
      // إرسال طلب الموافقة
      await axios.put(`/api/appointments/${appointment._id}/approve-edit`, {}, config);
      
      // إعادة تحميل البيانات
      fetchAppointments();
      setSuccessMessage('تمت الموافقة على طلب التعديل بنجاح');
      setError('');
    } catch (error) {
      console.error('خطأ في الموافقة على الطلب:', error);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'فشل في الموافقة على طلب التعديل'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRejectEditRequest = async (appointment, reason = '') => {
    try {
      setLoading(true);
      
      // التحقق من وجود طلب تعديل معلق
      if (!appointment.editRequestStatus || appointment.editRequestStatus !== 'pending') {
        setError('لا يوجد طلب تعديل معلق لهذا الموعد');
        setLoading(false);
        return;
      }
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        }
      };
      
      await axios.put(
        `/api/appointments/${appointment._id}/reject-edit`, 
        { rejectReason: reason }, 
        config
      );
      
      // إعادة تحميل البيانات
      fetchAppointments();
      setSuccessMessage('تم رفض طلب التعديل بنجاح');
      setError('');
    } catch (error) {
      console.error('خطأ في رفض الطلب:', error);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'فشل في رفض طلب التعديل'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditDialog = (appointment) => {
    setSelectedAppointment(appointment);
    setAppointmentStatus(appointment.status || 'scheduled');
    setAppointmentNotes(appointment.notes || '');
    setMedicalReport(appointment.medicalReport || '');
    setPrescription(appointment.prescription || '');
    setPaymentStatus(appointment.paymentStatus || 'pending');
    setPaymentAmount(appointment.paymentAmount || '');
    setPaymentMethod(appointment.paymentMethod || 'cash');
    setEditDialogOpen(true);
  };
  
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedAppointment(null);
  };

  // دالة لفتح نافذة عرض التفاصيل
  const handleOpenViewDetailsDialog = (appointment) => {
    setSelectedAppointment(appointment);
    setViewDetailDialogOpen(true);
  };

  const handleCloseViewDetailsDialog = () => {
    setViewDetailDialogOpen(false);
    setSelectedAppointment(null);
  };

  // دالة لفتح نافذة إنشاء موعد جديد
  const handleOpenCreateDialog = () => {
    const today = new Date();
    setNewAppointmentDate(format(today, 'yyyy-MM-dd'));
    setNewAppointmentTime('');
    setNewAppointmentType('new');
    setNewAppointmentReason('');
    setNewAppointmentNotes('');
    setNewAppointmentPaymentMethod('cash');
    setNewAppointmentPaymentStatus('pending');
    setNewAppointmentPaymentAmount('');
    setSelectedPatientId('');
    fetchAvailableTimes(format(today, 'yyyy-MM-dd'));
    setCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
  };

  // دالة لفتح نافذة الدفع
  const handleOpenPaymentDialog = (appointment) => {
    setSelectedAppointment(appointment);
    setPaymentStatus(appointment.paymentStatus || 'pending');
    setPaymentAmount(appointment.paymentAmount || getAppointmentTypePrice(appointment.type));
    setPaymentMethod(appointment.paymentMethod || 'cash');
    setPaymentDialogOpen(true);
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setSelectedAppointment(null);
  };

  // دالة لحفظ معلومات الدفع
  const handleSavePayment = async () => {
    try {
      setLoading(true);
      
      if (!paymentAmount) {
        setError('الرجاء إدخال مبلغ الدفع');
        setLoading(false);
        return;
      }
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        }
      };
      
      const paymentData = { 
        paymentStatus, 
        paymentAmount: Number(paymentAmount),
        paymentMethod,
        paymentDate: new Date()
      };
      
      const { data } = await axios.put(
        `/api/appointments/${selectedAppointment._id}`,
        paymentData,
        config
      );
      
      // إعادة تحميل البيانات
      fetchAppointments();
      handleClosePaymentDialog();
      setSuccessMessage('تم تحديث معلومات الدفع بنجاح');
      setError('');
    } catch (error) {
      console.error('خطأ في تحديث معلومات الدفع:', error);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'فشل في تحديث معلومات الدفع'
      );
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateAppointment = async () => {
    try {
      setLoading(true);
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        }
      };
      
      const appointmentData = { 
        status: appointmentStatus, 
        notes: appointmentNotes,
        medicalReport,
        prescription,
        paymentStatus,
        paymentAmount: paymentAmount ? Number(paymentAmount) : undefined,
        paymentMethod
      };
      
      await axios.put(
        `/api/appointments/${selectedAppointment._id}`,
        appointmentData,
        config
      );
      
      // إعادة تحميل البيانات
      fetchAppointments();
      handleCloseEditDialog();
      setSuccessMessage('تم تحديث الموعد بنجاح');
      setError('');
    } catch (error) {
      console.error('خطأ في تحديث الموعد:', error);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'فشل في تحديث الموعد'
      );
    } finally {
      setLoading(false);
    }
  };

  // دالة إنشاء موعد جديد
  const handleCreateAppointment = async () => {
    try {
      setLoading(true);
      
      // التحقق من البيانات المطلوبة
      if (!selectedPatientId || !newAppointmentDate || !newAppointmentTime || !newAppointmentType || !newAppointmentReason) {
        setError('الرجاء ملء جميع الحقول المطلوبة');
        setLoading(false);
        return;
      }
      
      // التحقق من تاريخ الموعد (يجب أن يكون اليوم أو بعده)
      const selectedDate = parseISO(newAppointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (isBefore(selectedDate, today)) {
        setError('لا يمكن حجز موعد في تاريخ ماضٍ');
        setLoading(false);
        return;
      }
      
      // التحقق من أن الوقت غير محجوز
      if (bookedTimes.includes(newAppointmentTime)) {
        setError('هذا الوقت محجوز بالفعل، الرجاء اختيار وقت آخر');
        setLoading(false);
        return;
      }
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        }
      };
      
      // حساب مبلغ الدفع بناءً على نوع الموعد إذا لم يتم تحديده
      const calculatedAmount = newAppointmentPaymentAmount || getAppointmentTypePrice(newAppointmentType);
      
      // بيانات الموعد الجديد
      const appointmentData = {
        patient: selectedPatientId,
        date: newAppointmentDate,
        time: newAppointmentTime,
        reason: newAppointmentReason,
        notes: newAppointmentNotes,
        type: newAppointmentType,
        paymentMethod: newAppointmentPaymentMethod,
        paymentStatus: newAppointmentPaymentStatus,
        paymentAmount: calculatedAmount
      };
      
      await axios.post('/api/appointments', appointmentData, config);
      
      // إعادة تحميل البيانات
      fetchAppointments();
      handleCloseCreateDialog();
      setSuccessMessage('تم إنشاء الموعد بنجاح');
      setError('');
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
  
  // عرض مؤشر لطلبات التعديل
  const getEditRequestBadge = (appointment) => {
    if (!appointment.editRequestStatus || appointment.editRequestStatus !== 'pending') {
      return null;
    }
    
    return (
      <Chip 
        label="طلب تعديل" 
        color="warning" 
        size="small" 
        icon={<ChangeCircleIcon />}
        sx={{ mr: 1 }}
      />
    );
  };
  
  // تحويل حالة الدفع إلى نص عربي ولون
  const getPaymentStatusChip = (status) => {
    let label, color;
    
    switch (status) {
      case 'paid':
        label = 'مدفوع';
        color = 'success';
        break;
      case 'pending':
        label = 'غير مدفوع';
        color = 'warning';
        break;
      case 'refunded':
        label = 'مسترجع';
        color = 'info';
        break;
      case 'partially_paid':
        label = 'مدفوع جزئياً';
        color = 'warning';
        break;
      default:
        label = status;
        color = 'default';
    }
    
    return <Chip label={label} color={color} size="small" />;
  };
  
  // تحويل نوع الموعد إلى نص عربي
  const getAppointmentType = (type) => {
    switch (type) {
      case 'new':
        return <Chip label="كشف جديد" color="info" size="small" />;
      case 'followup':
        return <Chip label="متابعة" color="secondary" size="small" />;
      case 'consultation':
        return <Chip label="استشارة" color="primary" size="small" variant="outlined" />;
      default:
        return <Chip label={type || "غير محدد"} size="small" />;
    }
  };

  // الحصول على سعر الموعد بناءً على نوعه
  const getAppointmentTypePrice = (type) => {
    const appointmentType = appointmentTypes.find(t => t.value === type);
    return appointmentType ? appointmentType.price : 0;
  };

  // إغلاق رسالة النجاح
  const handleCloseSuccessMessage = () => {
    setSuccessMessage('');
  };

  // محتوى الصفحة
  const content = (
    <>
      <AdminHeader title="إدارة المواعيد" onRefresh={fetchAppointments} />
      <Box sx={{ p: 3, flexGrow: 1 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ m: 1 }}>
            قائمة المواعيد ({filteredAppointments.length})
            {appointments.filter(a => a.editRequestStatus === 'pending').length > 0 && (
              <Chip 
                label={`${appointments.filter(a => a.editRequestStatus === 'pending').length} طلب تعديل معلق`} 
                color="warning" 
                size="small" 
                sx={{ mr: 2 }}
              />
            )}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="بحث عن مريض..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ m: 1, minWidth: 200 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
            
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={filterOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setFilterOpen(!filterOpen)}
              sx={{ m: 1 }}
            >
              فلترة
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<AddIcon />}
              sx={{ m: 1 }}
              onClick={handleOpenCreateDialog}
            >
              إضافة موعد
            </Button>
            
            <Tooltip title="تحديث البيانات">
              <IconButton
                color="primary"
                onClick={fetchAppointments}
                disabled={loading}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Collapse in={filterOpen}>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>فلترة حسب التاريخ</InputLabel>
                  <Select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    label="فلترة حسب التاريخ"
                  >
                    <MenuItem value="all">جميع المواعيد</MenuItem>
                    <MenuItem value="today">اليوم</MenuItem>
                    <MenuItem value="tomorrow">غداً</MenuItem>
                    <MenuItem value="upcoming">المواعيد القادمة</MenuItem>
                    <MenuItem value="past">المواعيد السابقة</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>حالة الموعد</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="حالة الموعد"
                  >
                    <MenuItem value="all">الكل</MenuItem>
                    <MenuItem value="scheduled">مجدول</MenuItem>
                    <MenuItem value="completed">مكتمل</MenuItem>
                    <MenuItem value="cancelled">ملغي</MenuItem>
                    <MenuItem value="no-show">لم يحضر</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>نوع الزيارة</InputLabel>
                  <Select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    label="نوع الزيارة"
                  >
                    <MenuItem value="all">الكل</MenuItem>
                    <MenuItem value="new">كشف جديد</MenuItem>
                    <MenuItem value="followup">متابعة</MenuItem>
                    <MenuItem value="consultation">استشارة</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>حالة الدفع</InputLabel>
                  <Select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    label="حالة الدفع"
                  >
                    <MenuItem value="all">الكل</MenuItem>
                    <MenuItem value="paid">مدفوع</MenuItem>
                    <MenuItem value="pending">غير مدفوع</MenuItem>
                    <MenuItem value="refunded">مسترجع</MenuItem>
                    <MenuItem value="partially_paid">مدفوع جزئياً</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>طلبات التعديل</InputLabel>
                  <Select
                    value={editRequestFilter}
                    onChange={(e) => setEditRequestFilter(e.target.value)}
                    label="طلبات التعديل"
                  >
                    <MenuItem value="all">الكل</MenuItem>
                    <MenuItem value="pending">طلبات معلقة</MenuItem>
                    <MenuItem value="any">أي طلب تعديل</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => {
                    setSearchTerm('');
                    setDateFilter('all');
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setPaymentFilter('all');
                    setEditRequestFilter('all');
                  }}
                >
                  إعادة ضبط الفلاتر
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Collapse>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {successMessage && (
          <Snackbar
            open={Boolean(successMessage)}
            autoHideDuration={6000}
            onClose={handleCloseSuccessMessage}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert onClose={handleCloseSuccessMessage} severity="success" sx={{ width: '100%' }}>
              {successMessage}
            </Alert>
          </Snackbar>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {filteredAppointments.length === 0 ? (
              <Alert severity="info">لا توجد مواعيد تطابق معايير البحث</Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>المريض</TableCell>
                      <TableCell>التاريخ</TableCell>
                      <TableCell>الوقت</TableCell>
                      <TableCell>نوع الزيارة</TableCell>
                      <TableCell>حالة الموعد</TableCell>
                      <TableCell>حالة الدفع</TableCell>
                      <TableCell>الطبيب</TableCell>
                      <TableCell>الإجراءات</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAppointments.map((appointment) => (
                      <TableRow 
                        key={appointment._id}
                        sx={{
                          bgcolor: 
                            appointment.status === 'cancelled' ? 'grey.100' : 
                            appointment.editRequestStatus === 'pending' ? 'warning.50' :
                            isToday(parseISO(appointment.date)) ? 'primary.50' : 
                            'transparent'
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ ml: 1, bgcolor: appointment.patient && appointment.patient.isNewPatient ? 'secondary.main' : 'primary.main' }}>
                              {appointment.patient && appointment.patient.name ? appointment.patient.name.charAt(0) : '?'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2">
                                {appointment.patient ? appointment.patient.name : 'غير معروف'}
                                {appointment.patient && appointment.patient.isNewPatient && (
                                  <Chip 
                                    label="جديد" 
                                    size="small" 
                                    color="secondary" 
                                    sx={{ mr: 0.5, ml: 0.5 }} 
                                  />
                                )}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {appointment.patient ? appointment.patient.phone : ''}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {format(parseISO(appointment.date), 'EEEE d/M/yyyy', { locale: ar })}
                        </TableCell>
                        <TableCell>{appointment.time}</TableCell>
                        <TableCell>{getAppointmentType(appointment.type)}</TableCell>
                        <TableCell>
                          {getStatusChip(appointment.status)}
                          {getEditRequestBadge(appointment)}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getPaymentStatusChip(appointment.paymentStatus)}
                            {appointment.paymentAmount && (
                              <Typography variant="caption" sx={{ mr: 1 }}>
                                {appointment.paymentAmount} ريال
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>د. سليمان الخالدي</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex' }}>
                            <Tooltip title="تعديل الموعد">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => handleOpenEditDialog(appointment)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="إدارة الدفع">
                              <IconButton 
                                size="small" 
                                color="success"
                                onClick={() => handleOpenPaymentDialog(appointment)}
                              >
                                <PaymentsIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="عرض">
                              <IconButton 
                                size="small" 
                                color="info"
                                onClick={() => handleOpenViewDetailsDialog(appointment)}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            {/* أزرار طلبات التعديل */}
                            {appointment.editRequestStatus === 'pending' && (
                              <>
                                <Tooltip title="موافقة على طلب التعديل">
                                  <IconButton 
                                    size="small" 
                                    color="success"
                                    onClick={() => handleApproveEditRequest(appointment)}
                                  >
                                    <CheckIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="رفض طلب التعديل">
                                  <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={() => {
                                      setSelectedAppointment(appointment);
                                      setRejectReason('');
                                      setRejectDialogOpen(true);
                                    }}
                                  >
                                    <CancelIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
        
        {/* نافذة تعديل الموعد */}
        <Dialog 
          open={editDialogOpen} 
          onClose={handleCloseEditDialog} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>
            تحديث بيانات الموعد
          </DialogTitle>
          <DialogContent>
            {/* محتوى تعديل الموعد */}
            {selectedAppointment && (
              <Box sx={{ py: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ ml: 1, color: 'primary.main' }} />
                        معلومات المريض
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{ ml: 1, bgcolor: selectedAppointment.patient?.isNewPatient ? 'secondary.main' : 'primary.main' }}>
                          {selectedAppointment.patient?.name?.charAt(0) || '?'}
                        </Avatar>
                        <Typography>
                          {selectedAppointment.patient?.name || 'غير معروف'}
                          {selectedAppointment.patient?.isNewPatient && (
                            <Chip label="مريض جديد" size="small" color="secondary" sx={{ mr: 1, ml: 1 }} />
                          )}
                        </Typography>
                      </Box>
                      <Typography variant="body2">
                        الهاتف: {selectedAppointment.patient?.phone || 'غير متوفر'}
                      </Typography>
                      <Typography variant="body2">
                        البريد: {selectedAppointment.patient?.email || 'غير متوفر'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarIcon sx={{ ml: 1, color: 'primary.main' }} />
                        تفاصيل الموعد
                      </Typography>
                      <Typography variant="body2">
                        التاريخ: {format(parseISO(selectedAppointment.date), 'EEEE d/M/yyyy', { locale: ar })}
                      </Typography>
                      <Typography variant="body2">
                        الوقت: {selectedAppointment.time}
                      </Typography>
                      <Typography variant="body2">
                        نوع الزيارة: {
                          selectedAppointment.type === 'new' ? 'كشف جديد' : 
                          selectedAppointment.type === 'followup' ? 'متابعة' : 
                          selectedAppointment.type === 'consultation' ? 'استشارة' : 
                          selectedAppointment.type || 'غير محدد'
                        }
                      </Typography>
                      <Typography variant="body2">
                        سبب الزيارة: {selectedAppointment.reason || 'غير محدد'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <PaymentsIcon sx={{ ml: 1, color: 'primary.main' }} />
                        معلومات الدفع
                      </Typography>
                      <Typography variant="body2">
                        طريقة الدفع: {
                          selectedAppointment.paymentMethod === 'cash' ? 'نقدًا' :
                          selectedAppointment.paymentMethod === 'creditCard' ? 'بطاقة ائتمان' :
                          selectedAppointment.paymentMethod === 'insurance' ? 'تأمين طبي' :
                          selectedAppointment.paymentMethod === 'bankTransfer' ? 'تحويل بنكي' :
                          selectedAppointment.paymentMethod || 'غير محدد'
                        }
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          حالة الدفع:
                        </Typography>
                        {getPaymentStatusChip(selectedAppointment.paymentStatus)}
                      </Box>
                      {selectedAppointment.paymentAmount && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          المبلغ المدفوع: {selectedAppointment.paymentAmount} ريال
                        </Typography>
                      )}
                    </Box>
                    
                    {/* عرض معلومات طلب التعديل إذا كان موجودًا */}
                    {selectedAppointment.editRequestStatus === 'pending' && selectedAppointment.editRequest && (
                      <Box sx={{ mt: 3, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                        <Typography variant="subtitle1" color="warning.dark" gutterBottom>
                          <ChangeCircleIcon sx={{ ml: 1, verticalAlign: 'middle' }} />
                          طلب تعديل معلق
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2">
                              <strong>التاريخ المطلوب:</strong> {format(parseISO(selectedAppointment.editRequest.newDate), 'd MMMM yyyy', { locale: ar })}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2">
                              <strong>الوقت المطلوب:</strong> {selectedAppointment.editRequest.newTime}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2">
                              <strong>سبب التعديل:</strong> {selectedAppointment.editRequest.reason}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2">
                              <strong>تاريخ الطلب:</strong> {format(parseISO(selectedAppointment.editRequest.requestedAt), 'd MMMM yyyy HH:mm', { locale: ar })}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                              <Button 
                                size="small" 
                                variant="outlined" 
                                color="error"
                                onClick={() => {
                                  setRejectReason('');
                                  setRejectDialogOpen(true);
                                }}
                                sx={{ ml: 1 }}
                              >
                                رفض
                              </Button>
                              <Button 
                                size="small" 
                                variant="contained" 
                                color="success"
                                onClick={() => handleApproveEditRequest(selectedAppointment)}
                              >
                                موافقة
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>حالة الموعد</InputLabel>
                      <Select
                        value={appointmentStatus}
                        onChange={(e) => setAppointmentStatus(e.target.value)}
                        label="حالة الموعد"
                      >
                        <MenuItem value="scheduled">مجدول</MenuItem>
                        <MenuItem value="completed">مكتمل</MenuItem>
                        <MenuItem value="cancelled">ملغي</MenuItem>
                        <MenuItem value="no-show">لم يحضر</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <FormControl fullWidth margin="normal">
                      <InputLabel>حالة الدفع</InputLabel>
                      <Select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        label="حالة الدفع"
                      >
                        <MenuItem value="pending">غير مدفوع</MenuItem>
                        <MenuItem value="paid">مدفوع</MenuItem>
                        <MenuItem value="refunded">مسترجع</MenuItem>
                        <MenuItem value="partially_paid">مدفوع جزئياً</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth margin="normal">
                      <InputLabel>طريقة الدفع</InputLabel>
                      <Select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        label="طريقة الدفع"
                      >
                        {paymentMethods.map((method) => (
                          <MenuItem key={method.value} value={method.value}>{method.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      margin="normal"
                      fullWidth
                      label="المبلغ المدفوع (بالريال)"
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">ريال</InputAdornment>,
                      }}
                    />
                    
                    <TextField
                      margin="normal"
                      fullWidth
                      label="ملاحظات"
                      multiline
                      rows={3}
                      value={appointmentNotes}
                      onChange={(e) => setAppointmentNotes(e.target.value)}
                    />
                    
                    <TextField
                      margin="normal"
                      fullWidth
                      label="تقرير طبي"
                      multiline
                      rows={3}
                      value={medicalReport}
                      onChange={(e) => setMedicalReport(e.target.value)}
                    />
                    
                    <TextField
                      margin="normal"
                      fullWidth
                      label="الوصفة الطبية"
                      multiline
                      rows={3}
                      value={prescription}
                      onChange={(e) => setPrescription(e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditDialog}>إلغاء</Button>
            <Button variant="contained" color="primary" onClick={handleUpdateAppointment}>
              حفظ التغييرات
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* نافذة سبب رفض طلب التعديل */}
        <Dialog 
          open={rejectDialogOpen} 
          onClose={() => setRejectDialogOpen(false)}
        >
          <DialogTitle>سبب رفض طلب التعديل</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="سبب الرفض"
              type="text"
              fullWidth
              multiline
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="يرجى كتابة سبب رفض طلب التعديل ليظهر للمريض"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRejectDialogOpen(false)}>إلغاء</Button>
            <Button 
              onClick={() => {
                if (selectedAppointment) {
                  handleRejectEditRequest(selectedAppointment, rejectReason);
                  setRejectDialogOpen(false);
                  setRejectReason('');
                }
              }} 
              color="error"
              variant="contained"
            >
              رفض الطلب
            </Button>
          </DialogActions>
        </Dialog>

        {/* نافذة إدارة الدفع */}
        <Dialog 
          open={paymentDialogOpen} 
          onClose={handleClosePaymentDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>إدارة الدفع</DialogTitle>
          <DialogContent>
            {selectedAppointment && (
              <Box sx={{ pt: 2 }}>
                <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>المريض:</strong> {selectedAppointment.patient?.name || 'غير معروف'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>التاريخ:</strong> {format(parseISO(selectedAppointment.date), 'EEEE d/M/yyyy', { locale: ar })}
                  </Typography>
                  <Typography variant="body2">
                    <strong>الوقت:</strong> {selectedAppointment.time}
                  </Typography>
                  <Typography variant="body2">
                    <strong>نوع الزيارة:</strong> {
                      selectedAppointment.type === 'new' ? 'كشف جديد' : 
                      selectedAppointment.type === 'followup' ? 'متابعة' : 
                      selectedAppointment.type === 'consultation' ? 'استشارة' : 
                      selectedAppointment.type || 'غير محدد'
                    }
                  </Typography>
                  <Typography variant="body2" color="primary">
                    <strong>السعر المتوقع:</strong> {getAppointmentTypePrice(selectedAppointment.type)} ريال
                  </Typography>
                </Box>

                <FormControl fullWidth margin="normal">
                  <InputLabel>حالة الدفع</InputLabel>
                  <Select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    label="حالة الدفع"
                  >
                    <MenuItem value="pending">غير مدفوع</MenuItem>
                    <MenuItem value="paid">مدفوع</MenuItem>
                    <MenuItem value="refunded">مسترجع</MenuItem>
                    <MenuItem value="partially_paid">مدفوع جزئياً</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth margin="normal">
                  <InputLabel>طريقة الدفع</InputLabel>
                  <Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    label="طريقة الدفع"
                  >
                    {paymentMethods.map((method) => (
                      <MenuItem key={method.value} value={method.value}>{method.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  margin="normal"
                  fullWidth
                  label="المبلغ المدفوع (بالريال)"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">ريال</InputAdornment>,
                  }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClosePaymentDialog}>إلغاء</Button>
            <Button variant="contained" color="success" onClick={handleSavePayment}>
              حفظ معلومات الدفع
            </Button>
          </DialogActions>
        </Dialog>

        {/* نافذة إنشاء موعد جديد */}
        <Dialog 
          open={createDialogOpen} 
          onClose={handleCloseCreateDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>إضافة موعد جديد</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal" required>
                    <InputLabel>المريض</InputLabel>
                    <Select
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                      label="المريض"
                    >
                      {patientsList.map((patient) => (
                        <MenuItem key={patient._id} value={patient._id}>
                          {patient.name} - {patient.phone || 'بدون رقم'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    margin="normal"
                    fullWidth
                    label="التاريخ"
                    type="date"
                    value={newAppointmentDate}
                    onChange={(e) => setNewAppointmentDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      min: format(new Date(), 'yyyy-MM-dd')
                    }}
                    required
                  />

                  <FormControl fullWidth margin="normal" required>
                    <InputLabel>الوقت</InputLabel>
                    <Select
                      value={newAppointmentTime}
                      onChange={(e) => setNewAppointmentTime(e.target.value)}
                      label="الوقت"
                    >
                      {availableTimeSlots.length > 0 ? (
                        availableTimeSlots.map((time) => (
                          <MenuItem key={time} value={time}>{time}</MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled value="">لا توجد أوقات متاحة في هذا التاريخ</MenuItem>
                      )}
                    </Select>
                    <FormHelperText>
                      {bookedTimes.length > 0 && `${bookedTimes.length} أوقات محجوزة في هذا التاريخ`}
                    </FormHelperText>
                  </FormControl>

                  <FormControl fullWidth margin="normal" required>
                    <InputLabel>نوع الزيارة</InputLabel>
                    <Select
                      value={newAppointmentType}
                      onChange={(e) => setNewAppointmentType(e.target.value)}
                      label="نوع الزيارة"
                    >
                      {appointmentTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label} - {type.price} ريال
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    margin="normal"
                    fullWidth
                    label="سبب الزيارة"
                    value={newAppointmentReason}
                    onChange={(e) => setNewAppointmentReason(e.target.value)}
                    required
                  />

                  <TextField
                    margin="normal"
                    fullWidth
                    label="ملاحظات إضافية"
                    multiline
                    rows={2}
                    value={newAppointmentNotes}
                    onChange={(e) => setNewAppointmentNotes(e.target.value)}
                  />

                  <FormControl fullWidth margin="normal">
                    <InputLabel>طريقة الدفع</InputLabel>
                    <Select
                      value={newAppointmentPaymentMethod}
                      onChange={(e) => setNewAppointmentPaymentMethod(e.target.value)}
                      label="طريقة الدفع"
                    >
                      {paymentMethods.map((method) => (
                        <MenuItem key={method.value} value={method.value}>{method.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth margin="normal">
                    <InputLabel>حالة الدفع</InputLabel>
                    <Select
                      value={newAppointmentPaymentStatus}
                      onChange={(e) => setNewAppointmentPaymentStatus(e.target.value)}
                      label="حالة الدفع"
                    >
                      <MenuItem value="pending">غير مدفوع</MenuItem>
                      <MenuItem value="paid">مدفوع</MenuItem>
                      <MenuItem value="partially_paid">مدفوع جزئياً</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    margin="normal"
                    fullWidth
                    label="المبلغ المدفوع (بالريال)"
                    type="number"
                    value={newAppointmentPaymentAmount}
                    onChange={(e) => setNewAppointmentPaymentAmount(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">ريال</InputAdornment>,
                    }}
                    helperText={`السعر المتوقع: ${getAppointmentTypePrice(newAppointmentType)} ريال`}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCreateDialog}>إلغاء</Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleCreateAppointment}
              disabled={!selectedPatientId || !newAppointmentDate || !newAppointmentTime || !newAppointmentType || !newAppointmentReason}
            >
              إضافة الموعد
            </Button>
          </DialogActions>
        </Dialog>

        {/* نافذة عرض تفاصيل الموعد */}
        <Dialog
          open={viewDetailDialogOpen}
          onClose={handleCloseViewDetailsDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            تفاصيل الموعد
          </DialogTitle>
          <DialogContent>
            {selectedAppointment && (
              <Box sx={{ py: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ ml: 1, color: 'primary.main' }} />
                        معلومات المريض
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{ ml: 1, bgcolor: selectedAppointment.patient?.isNewPatient ? 'secondary.main' : 'primary.main' }}>
                          {selectedAppointment.patient?.name?.charAt(0) || '?'}
                        </Avatar>
                        <Typography>
                          {selectedAppointment.patient?.name || 'غير معروف'}
                          {selectedAppointment.patient?.isNewPatient && (
                            <Chip label="مريض جديد" size="small" color="secondary" sx={{ mr: 1, ml: 1 }} />
                          )}
                        </Typography>
                      </Box>
                      <Typography variant="body2">
                        الهاتف: {selectedAppointment.patient?.phone || 'غير متوفر'}
                      </Typography>
                      <Typography variant="body2">
                        البريد: {selectedAppointment.patient?.email || 'غير متوفر'}
                      </Typography>
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarIcon sx={{ ml: 1, color: 'primary.main' }} />
                        تفاصيل الموعد
                      </Typography>
                      <Typography variant="body2">
                        <strong>التاريخ:</strong> {format(parseISO(selectedAppointment.date), 'EEEE d/M/yyyy', { locale: ar })}
                      </Typography>
                      <Typography variant="body2">
                        <strong>الوقت:</strong> {selectedAppointment.time}
                      </Typography>
                      <Typography variant="body2">
                        <strong>نوع الزيارة:</strong> {
                          selectedAppointment.type === 'new' ? 'كشف جديد' : 
                          selectedAppointment.type === 'followup' ? 'متابعة' : 
                          selectedAppointment.type === 'consultation' ? 'استشارة' : 
                          selectedAppointment.type || 'غير محدد'
                        }
                      </Typography>
                      <Typography variant="body2">
                        <strong>سبب الزيارة:</strong> {selectedAppointment.reason || 'غير محدد'}
                      </Typography>
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          <strong>حالة الموعد:</strong>
                        </Typography>
                        {getStatusChip(selectedAppointment.status)}
                        {getEditRequestBadge(selectedAppointment)}
                      </Box>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <MoneyIcon sx={{ ml: 1, color: 'primary.main' }} />
                        معلومات الدفع
                      </Typography>
                      <Typography variant="body2">
                        <strong>طريقة الدفع:</strong> {
                          selectedAppointment.paymentMethod === 'cash' ? 'نقدًا' :
                          selectedAppointment.paymentMethod === 'creditCard' ? 'بطاقة ائتمان' :
                          selectedAppointment.paymentMethod === 'insurance' ? 'تأمين طبي' :
                          selectedAppointment.paymentMethod === 'bankTransfer' ? 'تحويل بنكي' :
                          selectedAppointment.paymentMethod || 'غير محدد'
                        }
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          <strong>حالة الدفع:</strong>
                        </Typography>
                        {getPaymentStatusChip(selectedAppointment.paymentStatus)}
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>المبلغ المدفوع:</strong> {selectedAppointment.paymentAmount || getAppointmentTypePrice(selectedAppointment.type)} ريال
                      </Typography>
                      {selectedAppointment.paymentDate && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>تاريخ الدفع:</strong> {format(parseISO(selectedAppointment.paymentDate), 'd/M/yyyy', { locale: ar })}
                        </Typography>
                      )}
                    </Paper>

                    {(selectedAppointment.medicalReport || selectedAppointment.prescription) && (
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                          <MedicalIcon sx={{ ml: 1, color: 'primary.main' }} />
                          التقرير الطبي والعلاج
                        </Typography>
                        
                        {selectedAppointment.medicalReport && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" fontWeight="bold">
                              التقرير الطبي:
                            </Typography>
                            <Typography variant="body2">
                              {selectedAppointment.medicalReport}
                            </Typography>
                          </Box>
                        )}
                        
                        {selectedAppointment.prescription && (
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              الوصفة الطبية:
                            </Typography>
                            <Typography variant="body2">
                              {selectedAppointment.prescription}
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    )}
                  </Grid>

                  {/* عرض معلومات طلب التعديل إذا كان موجودًا */}
                  {selectedAppointment.editRequestStatus === 'pending' && selectedAppointment.editRequest && (
                    <Grid item xs={12}>
                      <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                        <Typography variant="subtitle1" color="warning.dark" gutterBottom>
                          <ChangeCircleIcon sx={{ ml: 1, verticalAlign: 'middle' }} />
                          طلب تعديل معلق
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2">
                              <strong>التاريخ المطلوب:</strong> {format(parseISO(selectedAppointment.editRequest.newDate), 'd MMMM yyyy', { locale: ar })}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2">
                              <strong>الوقت المطلوب:</strong> {selectedAppointment.editRequest.newTime}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2">
                              <strong>سبب التعديل:</strong> {selectedAppointment.editRequest.reason}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2">
                              <strong>تاريخ الطلب:</strong> {format(parseISO(selectedAppointment.editRequest.requestedAt), 'd MMMM yyyy HH:mm', { locale: ar })}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                              <Button 
                                size="small" 
                                variant="outlined" 
                                color="error"
                                onClick={() => {
                                  setRejectReason('');
                                  setRejectDialogOpen(true);
                                  handleCloseViewDetailsDialog();
                                }}
                                sx={{ ml: 1 }}
                              >
                                رفض
                              </Button>
                              <Button 
                                size="small" 
                                variant="contained" 
                                color="success"
                                onClick={() => {
                                  handleApproveEditRequest(selectedAppointment);
                                  handleCloseViewDetailsDialog();
                                }}
                              >
                                موافقة
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    </Grid>
                  )}
                  
                  {selectedAppointment.notes && (
                    <Grid item xs={12}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          ملاحظات
                        </Typography>
                        <Typography variant="body2">
                          {selectedAppointment.notes}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseViewDetailsDialog}>إغلاق</Button>
            <Button 
              variant="outlined" 
              color="success" 
              onClick={() => {
                handleOpenPaymentDialog(selectedAppointment);
                handleCloseViewDetailsDialog();
              }}
              startIcon={<PaymentsIcon />}
            >
              إدارة الدفع
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => {
                handleOpenEditDialog(selectedAppointment);
                handleCloseViewDetailsDialog();
              }}
              startIcon={<EditIcon />}
            >
              تعديل
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );

  if (compact) {
    return content;
  }

  return (
    <AdminLayout>
      {content}
    </AdminLayout>
  );
};

export default AdminAppointments;