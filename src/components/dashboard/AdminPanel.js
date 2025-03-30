// client/src/components/dashboard/AdminPanel.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format, parseISO, isToday, isTomorrow, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Button, 
  Chip, 
  CircularProgress, 
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Divider,
  IconButton,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Tooltip,
  InputAdornment,
  Collapse,
  Snackbar
} from '@mui/material';
import {
  SupervisorAccount as AdminIcon,
  Group as PatientsIcon,
  CalendarToday as AppointmentsIcon,
  CalendarToday as CalendarIcon,
  Description as DocumentsIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Payment as PaymentIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  PersonAdd as PersonAddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  MedicalServices as MedicalIcon,
  MonetizationOn as MoneyIcon,
  Person as PersonIcon,
  ChangeCircle as ChangeCircleIcon
} from '@mui/icons-material';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [stats, setStats] = useState({
    totalPatients: 0,
    newPatients: 0,
    upcomingAppointments: 0,
    totalAppointments: 0,
    cancelledAppointments: 0,
    totalDocuments: 0,
    pendingPayments: 0,
    todayAppointments: 0,
    pendingEditRequests: 0
  });
  
  // حالة تعديل الموعد
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentStatus, setAppointmentStatus] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [medicalReport, setMedicalReport] = useState('');
  const [prescription, setPrescription] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  
  // حالة طلبات التعديل
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  // حالة عرض تفاصيل المريض
  const [patientDetailsOpen, setPatientDetailsOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [patientDocuments, setPatientDocuments] = useState([]);
  
  // الفلترة والبحث
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [editRequestFilter, setEditRequestFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  
  // الحصول على تكوين التوثيق
  const getAuthConfig = useCallback(() => {
    return {
      headers: {
        Authorization: `Bearer ${userInfo.token}`
      }
    };
  }, [userInfo.token]);
  
  // جلب البيانات الأساسية
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const config = getAuthConfig();
      
      // جلب جميع البيانات بالتوازي
      const [usersResponse, appointmentsResponse, documentsResponse] = await Promise.all([
        axios.get('/api/users', config),
        axios.get('/api/appointments/all', config),
        axios.get('/api/documents/all', config)
      ]);
      
      setUsers(usersResponse.data);
      setAppointments(appointmentsResponse.data);
      setFilteredAppointments(appointmentsResponse.data);
      setDocuments(documentsResponse.data);
      
      // حساب الإحصائيات
      calculateStats(usersResponse.data, appointmentsResponse.data, documentsResponse.data);
      
      setError('');
      setSuccessMessage('تم تحديث البيانات بنجاح');
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'فشل في تحميل البيانات'
      );
    } finally {
      setLoading(false);
    }
  }, [getAuthConfig]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  useEffect(() => {
    // تطبيق الفلاتر على المواعيد
    applyFilters();
  }, [appointments, searchTerm, dateFilter, typeFilter, paymentFilter, editRequestFilter]);
  
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
            return appointmentDate >= today;
          case 'past':
            return appointmentDate < today;
          default:
            return true;
        }
      });
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
      switch(editRequestFilter) {
        case 'pending':
          filtered = filtered.filter(appointment => appointment.editRequestStatus === 'pending');
          break;
        case 'approved':
          filtered = filtered.filter(appointment => appointment.editRequestStatus === 'approved');
          break;
        case 'rejected':
          filtered = filtered.filter(appointment => appointment.editRequestStatus === 'rejected');
          break;
        case 'any':
          filtered = filtered.filter(appointment => appointment.editRequestStatus);
          break;
      }
    }
    
    setFilteredAppointments(filtered);
  };
  
  const calculateStats = (users, appointments, documents) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const newPatients = users.filter(user => user.isNewPatient).length;
    
    const upcomingAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      appointmentDate.setHours(0, 0, 0, 0);
      return appointmentDate >= today && appointment.status === 'scheduled';
    }).length;
    
    const todayAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      appointmentDate.setHours(0, 0, 0, 0);
      return isToday(appointmentDate) && appointment.status === 'scheduled';
    }).length;
    
    const cancelledAppointments = appointments.filter(
      appointment => appointment.status === 'cancelled'
    ).length;
    
    const pendingPayments = appointments.filter(
      appointment => appointment.paymentStatus === 'pending' && appointment.status !== 'cancelled'
    ).length;
    
    // إضافة إحصائية لطلبات التعديل المعلقة
    const pendingEditRequests = appointments.filter(
      appointment => appointment.editRequestStatus === 'pending'
    ).length;
    
    setStats({
      totalPatients: users.length,
      newPatients,
      upcomingAppointments,
      totalAppointments: appointments.length,
      cancelledAppointments,
      totalDocuments: documents.length,
      pendingPayments,
      todayAppointments,
      pendingEditRequests
    });
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
  
  // دالة للموافقة على طلب تعديل موعد
  const handleApproveEditRequest = async (appointment) => {
    try {
      setLoading(true);
      
      const config = getAuthConfig();
      
      // التحقق من وجود طلب تعديل معلق
      if (!appointment.editRequestStatus || appointment.editRequestStatus !== 'pending') {
        setError('لا يوجد طلب تعديل معلق لهذا الموعد');
        setLoading(false);
        return;
      }
      
      // إرسال طلب الموافقة
      await axios.put(`/api/appointments/${appointment._id}/approve-edit`, {}, config);
      
      // إعادة تحميل البيانات
      fetchData();
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

  // دالة لرفض طلب تعديل موعد
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
          Authorization: `Bearer ${userInfo.token}`
        }
      };
      
      await axios.put(
        `/api/appointments/${appointment._id}/reject-edit`, 
        { rejectReason: reason }, 
        config
      );
      
      // إعادة تحميل البيانات
      fetchData();
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
  
  const handleViewPatientDetails = async (patient) => {
    try {
      setLoading(true);
      
      const config = getAuthConfig();
      
      // جلب بيانات المريض ومواعيده ووثائقه
      const [patientAppointmentsResponse, patientDocumentsResponse] = await Promise.all([
        axios.get(`/api/appointments/patient/${patient._id}`, config),
        axios.get(`/api/documents/patient/${patient._id}`, config)
      ]);
      
      setSelectedPatient(patient);
      setPatientAppointments(patientAppointmentsResponse.data);
      setPatientDocuments(patientDocumentsResponse.data);
      setPatientDetailsOpen(true);
    } catch (error) {
      console.error('خطأ في جلب بيانات المريض:', error);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'فشل في جلب بيانات المريض'
      );
    } finally {
      setLoading(false);
    }
  };
  
  const handleClosePatientDetails = () => {
    setPatientDetailsOpen(false);
    setSelectedPatient(null);
  };
  
  const handleUpdateAppointment = async () => {
    try {
      setLoading(true);
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`
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
      fetchData();
      handleCloseEditDialog();
      setSuccessMessage('تم تحديث الموعد بنجاح');
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
  
  // إغلاق رسالة النجاح
  const handleCloseSuccessMessage = () => {
    setSuccessMessage('');
  };
  
  // دالة للحصول على URL الوثيقة
  const getDocumentUrl = (document) => {
    if (!document || !document.filePath) return '#';
    
    // استخراج اسم الملف فقط من المسار
    const pathParts = document.filePath.split('/');
    const filename = pathParts[pathParts.length - 1];
    
    return `/uploads/${filename}`;
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
        sx={{ ml: 1 }}
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
  
  // تحويل نوع الوثيقة إلى نص عربي
  const getDocumentType = (type) => {
    switch (type) {
      case 'report':
        return 'تقرير طبي';
      case 'image':
        return 'صورة أشعة';
      case 'prescription':
        return 'وصفة طبية';
      case 'other':
        return 'وثيقة أخرى';
      default:
        return type;
    }
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
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AdminIcon sx={{ fontSize: 30, mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="h2">
            لوحة تحكم المدير
          </Typography>
        </Box>
        
        <Button
          variant="outlined"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={fetchData}
        >
          تحديث البيانات
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
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
      
      {/* بطاقات الإحصائيات */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
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
        
        <Grid item xs={12} sm={6} md={3}>
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
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderRight: 4, borderColor: 'warning.main' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                مدفوعات معلقة
              </Typography>
              <Typography variant="h3" color="warning.main">
                {stats.pendingPayments}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                من إجمالي {stats.upcomingAppointments} موعد قادم
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderRight: 4, borderColor: stats.pendingEditRequests > 0 ? 'warning.main' : 'error.main' }}>
            <CardContent>
              {stats.pendingEditRequests > 0 ? (
                <>
                  <Typography variant="h6" gutterBottom>
                    طلبات تعديل معلقة
                  </Typography>
                  <Typography variant="h3" color="warning.main">
                    {stats.pendingEditRequests}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    تحتاج للمراجعة والموافقة
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom>
                    المواعيد الملغاة
                  </Typography>
                  <Typography variant="h3" color="error.main">
                    {stats.cancelledAppointments}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    بنسبة {(stats.totalAppointments > 0 ? (stats.cancelledAppointments / stats.totalAppointments) * 100 : 0).toFixed(1)}%
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* ألسنة البيانات */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<AppointmentsIcon />} iconPosition="start" label="المواعيد" />
          <Tab icon={<PatientsIcon />} iconPosition="start" label="المرضى" />
          <Tab icon={<DocumentsIcon />} iconPosition="start" label="الوثائق" />
        </Tabs>
        
        <Box sx={{ p: 2 }}>
          {/* قائمة المواعيد */}
          {activeTab === 0 && (
            <React.Fragment>
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ m: 1 }}>
                  قائمة المواعيد
                  {stats.pendingEditRequests > 0 && (
                    <Chip 
                      label={`${stats.pendingEditRequests} طلب تعديل معلق`} 
                      color="warning" 
                      size="small" 
                      sx={{ ml: 2 }}
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
                          <MenuItem value="approved">طلبات موافق عليها</MenuItem>
                          <MenuItem value="rejected">طلبات مرفوضة</MenuItem>
                          <MenuItem value="any">أي طلب تعديل</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <Button 
                        variant="contained" 
                        size="small"
                        onClick={() => {
                          setSearchTerm('');
                          setDateFilter('all');
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
              
              <TableContainer>
                {loading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                    <CircularProgress />
                  </Box>
                )}
                
                {!loading && filteredAppointments.length === 0 ? (
                  <Alert severity="info">لا توجد مواعيد تطابق معايير البحث</Alert>
                ) : (
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
                              <Avatar 
                                sx={{ 
                                  mr: 1, 
                                  bgcolor: appointment.patient?.isNewPatient ? 'secondary.main' : 'primary.main' 
                                }}
                              >
                                {appointment.patient?.name?.charAt(0) || '?'}
                              </Avatar>
                              <Box>
                                <Typography variant="body2">
                                  {appointment.patient?.name || 'غير معروف'}
                                  {appointment.patient?.isNewPatient && (
                                    <Chip 
                                      label="جديد" 
                                      size="small" 
                                      color="secondary" 
                                      sx={{ mr: 0.5, ml: 0.5 }} 
                                    />
                                  )}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {appointment.patient?.phone || ''}
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
                          <TableCell>{getPaymentStatusChip(appointment.paymentStatus)}</TableCell>
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
                              <Tooltip title="عرض ملف المريض">
                                <IconButton 
                                  size="small" 
                                  color="info"
                                  onClick={() => handleViewPatientDetails(appointment.patient)}
                                >
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              {/* إضافة خيارات طلب التعديل */}
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
                                      <CloseIcon fontSize="small" />
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
                )}
              </TableContainer>
            </React.Fragment>
          )}
        
          {/* قائمة المرضى - هنا باقي المحتوى */}
          {/* ألسنة أخرى  - هنا باقي المحتوى */}
        </Box>
      </Paper>
      
      {/* نافذة تعديل الموعد */}
      {/* نافذة تعديل الموعد */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          تحديث بيانات الموعد والتقرير الطبي
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {selectedAppointment && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      بيانات الموعد
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PersonIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body1">
                          <strong>المريض:</strong> {selectedAppointment.patient?.name || 'غير معروف'}
                          {selectedAppointment.patient?.isNewPatient && (
                            <Chip label="جديد" size="small" color="secondary" sx={{ mr: 1, ml: 1 }} />
                          )}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', mb: 1 }}>
                        <PhoneIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body1">
                          <strong>الهاتف:</strong> {selectedAppointment.patient?.phone || 'غير متوفر'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', mb: 1 }}>
                        <CalendarIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body1">
                          <strong>التاريخ والوقت:</strong> {format(parseISO(selectedAppointment.date), 'EEEE d MMMM yyyy', { locale: ar })} - {selectedAppointment.time}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', mb: 1 }}>
                        <MedicalIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body1">
                          <strong>نوع الزيارة:</strong> {selectedAppointment.type === 'new' ? 'كشف جديد' : 
                                            selectedAppointment.type === 'followup' ? 'متابعة' : 
                                            selectedAppointment.type === 'consultation' ? 'استشارة' : 
                                            selectedAppointment.type || 'غير محدد'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex' }}>
                        <MedicalIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body1">
                          <strong>سبب الزيارة:</strong> {selectedAppointment.reason || 'غير محدد'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* إضافة معلومات طلب التعديل في نافذة تعديل الموعد */}
                    {selectedAppointment.editRequestStatus === 'pending' && selectedAppointment.editRequest && (
                      <Box sx={{ mt: 3, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                        <Typography variant="subtitle1" color="warning.dark" gutterBottom>
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
                                sx={{ mr: 1 }}
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
                    
                    <Divider sx={{ my: 2 }} />
                    
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
                        <MenuItem value="cash">نقداً</MenuItem>
                        <MenuItem value="creditCard">بطاقة ائتمان</MenuItem>
                        <MenuItem value="insurance">تأمين طبي</MenuItem>
                        <MenuItem value="bankTransfer">تحويل بنكي</MenuItem>
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
                      label="ملاحظات إدارية"
                      multiline
                      rows={2}
                      value={appointmentNotes}
                      onChange={(e) => setAppointmentNotes(e.target.value)}
                      placeholder="ملاحظات داخلية للموعد (غير مرئية للمريض)"
                    />
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      التقرير الطبي والعلاج
                    </Typography>
                    
                    <TextField
                      margin="normal"
                      fullWidth
                      multiline
                      rows={6}
                      label="التقرير الطبي"
                      value={medicalReport}
                      onChange={(e) => setMedicalReport(e.target.value)}
                      placeholder="أدخل تفاصيل الحالة والتشخيص هنا"
                    />
                    
                    <TextField
                      margin="normal"
                      fullWidth
                      multiline
                      rows={4}
                      label="الوصفة الطبية والعلاج"
                      value={prescription}
                      onChange={(e) => setPrescription(e.target.value)}
                      placeholder="أدخل وصف الأدوية والعلاج هنا"
                    />
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>إلغاء</Button>
          <Button onClick={handleUpdateAppointment} variant="contained" color="primary">
            حفظ التغييرات
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* نافذة سبب رفض طلب التعديل */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
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
            dir="rtl"
            placeholder="يرجى كتابة سبب رفض طلب التعديل ليظهر للمريض"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>إلغاء</Button>
          <Button 
            onClick={() => {
              handleRejectEditRequest(selectedAppointment, rejectReason);
              setRejectDialogOpen(false);
              setRejectReason('');
            }} 
            color="error"
            variant="contained"
          >
            رفض الطلب
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* نافذة عرض تفاصيل المريض */}
      <Dialog open={patientDetailsOpen} onClose={handleClosePatientDetails} maxWidth="lg" fullWidth>
        <DialogTitle>
          ملف المريض: {selectedPatient?.name}
        </DialogTitle>
        
        <DialogContent>
          {selectedPatient && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    البيانات الشخصية
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      sx={{ 
                        width: 80, 
                        height: 80, 
                        mr: 2,
                        bgcolor: selectedPatient.isNewPatient ? 'secondary.main' : 'primary.main',
                        fontSize: 32
                      }}
                    >
                      {selectedPatient.name.charAt(0)}
                    </Avatar>
                    
                    <Box>
                      <Typography variant="h6">
                        {selectedPatient.name}
                        {selectedPatient.isNewPatient && (
                          <Chip label="مريض جديد" color="secondary" size="small" sx={{ mr: 1, ml: 1 }} />
                        )}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        عضو منذ {format(new Date(selectedPatient.registrationDate), 'MMMM yyyy', { locale: ar })}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PhoneIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body1">
                        {selectedPatient.phone || 'لا يوجد رقم هاتف'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <EmailIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body1">
                        {selectedPatient.email}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      إحصائيات الزيارات
                    </Typography>
                    
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 1, 
                            textAlign: 'center',
                            borderColor: 'primary.main'
                          }}
                        >
                          <Typography variant="h4" color="primary">
                            {patientAppointments.length}
                          </Typography>
                          <Typography variant="caption">
                            إجمالي الزيارات
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 1, 
                            textAlign: 'center',
                            borderColor: patientAppointments.filter(a => a.status === 'completed').length > 0 ? 'success.main' : 'grey.400'
                          }}
                        >
                          <Typography variant="h4" color={patientAppointments.filter(a => a.status === 'completed').length > 0 ? 'success.main' : 'grey.500'}>
                            {patientAppointments.filter(a => a.status === 'completed').length}
                          </Typography>
                          <Typography variant="caption">
                            الزيارات المكتملة
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 1, 
                            textAlign: 'center',
                            mt: 1,
                            borderColor: patientAppointments.filter(a => a.status === 'cancelled').length > 0 ? 'error.main' : 'grey.400'
                          }}
                        >
                          <Typography variant="h4" color={patientAppointments.filter(a => a.status === 'cancelled').length > 0 ? 'error.main' : 'grey.500'}>
                            {patientAppointments.filter(a => a.status === 'cancelled').length}
                          </Typography>
                          <Typography variant="caption">
                            الزيارات الملغاة
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 1, 
                            textAlign: 'center',
                            mt: 1,
                            borderColor: patientDocuments.length > 0 ? 'info.main' : 'grey.400'
                          }}
                        >
                          <Typography variant="h4" color={patientDocuments.length > 0 ? 'info.main' : 'grey.500'}>
                            {patientDocuments.length}
                          </Typography>
                          <Typography variant="caption">
                            الوثائق والتقارير
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={8}>
                <Tabs value={0} sx={{ mb: 2 }}>
                  <Tab label="سجل الزيارات والتقارير" />
                </Tabs>
                
                {patientAppointments.length === 0 ? (
                  <Alert severity="info">لا توجد زيارات مسجلة لهذا المريض</Alert>
                ) : (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    {patientAppointments.map((appointment, index) => (
                      <Box key={appointment._id} sx={{ mb: index !== patientAppointments.length - 1 ? 3 : 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CalendarIcon color="primary" sx={{ mr: 1 }} />
                            <Typography variant="subtitle1">
                              {format(parseISO(appointment.date), 'EEEE d MMMM yyyy', { locale: ar })} - {appointment.time}
                            </Typography>
                          </Box>
                          
                          <Box>
                            {getStatusChip(appointment.status)}
                            <Box component="span" sx={{ mx: 1 }} />
                            {getPaymentStatusChip(appointment.paymentStatus)}
                            <Box component="span" sx={{ mx: 1 }} />
                            {getAppointmentType(appointment.type)}
                            {getEditRequestBadge(appointment)}
                          </Box>
                        </Box>
                        
                        <Box sx={{ ml: 4, mt: 1 }}>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            <strong>سبب الزيارة:</strong> {appointment.reason || 'غير محدد'}
                          </Typography>
                          
                          {/* إظهار معلومات طلب التعديل إذا كان موجوداً */}
                          {appointment.editRequestStatus === 'pending' && appointment.editRequest && (
                            <Box sx={{ my: 1, p: 2, bgcolor: 'warning.50', borderRadius: 1 }}>
                              <Typography variant="subtitle2" color="warning.dark" gutterBottom>
                                طلب تعديل معلق:
                              </Typography>
                              <Typography variant="body2">
                                <strong>التاريخ الجديد:</strong> {format(parseISO(appointment.editRequest.newDate), 'd MMMM yyyy', { locale: ar })}
                              </Typography>
                              <Typography variant="body2">
                                <strong>الوقت الجديد:</strong> {appointment.editRequest.newTime}
                              </Typography>
                              <Typography variant="body2">
                                <strong>سبب التعديل:</strong> {appointment.editRequest.reason}
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                <Button 
                                  size="small" 
                                  variant="contained" 
                                  color="success"
                                  onClick={() => handleApproveEditRequest(appointment)}
                                  sx={{ mr: 1 }}
                                >
                                  موافقة
                                </Button>
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  color="error"
                                  onClick={() => {
                                    setSelectedAppointment(appointment);
                                    setRejectReason('');
                                    setRejectDialogOpen(true);
                                  }}
                                >
                                  رفض
                                </Button>
                              </Box>
                            </Box>
                          )}
                          
                          {appointment.medicalReport && (
                            <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                              <Typography variant="subtitle2" color="primary" gutterBottom>
                                التقرير الطبي:
                              </Typography>
                              <Typography variant="body2">
                                {appointment.medicalReport}
                              </Typography>
                            </Box>
                          )}
                          
                          {appointment.prescription && (
                            <Box sx={{ mt: 1, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                              <Typography variant="subtitle2" color="primary" gutterBottom>
                                الوصفة الطبية والعلاج:
                              </Typography>
                              <Typography variant="body2">
                                {appointment.prescription}
                              </Typography>
                            </Box>
                          )}
                          
                          {appointment.notes && (
                            <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                ملاحظات:
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {appointment.notes}
                              </Typography>
                            </Box>
                          )}
                          
                          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                              size="small"
                              startIcon={<EditIcon />}
                              onClick={() => {
                                handleClosePatientDetails();
                                handleOpenEditDialog(appointment);
                              }}
                            >
                              تعديل الزيارة
                            </Button>
                          </Box>
                        </Box>
                        
                        {index !== patientAppointments.length - 1 && <Divider sx={{ mt: 2 }} />}
                      </Box>
                    ))}
                  </Paper>
                )}
                
                {patientDocuments.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      الوثائق والتقارير
                    </Typography>
                    
                    <Grid container spacing={2}>
                      {patientDocuments.map((document) => (
                        <Grid item xs={12} sm={6} key={document._id}>
                          <Paper variant="outlined" sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="subtitle2">{document.name}</Typography>
                              <Chip
                                label={getDocumentType(document.type)}
                                color={document.type === 'report' ? 'primary' : 
                                      document.type === 'prescription' ? 'secondary' : 
                                      document.type === 'image' ? 'info' : 'default'}
                                size="small"
                              />
                            </Box>
                            
                            <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                              تاريخ الرفع: {format(new Date(document.uploadDate), 'd MMMM yyyy', { locale: ar })}
                            </Typography>
                            
                            {document.description && (
                              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                {document.description}
                              </Typography>
                            )}
                            
                            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                              <Button
                                size="small"
                                component="a"
                                href={getDocumentUrl(document)}
                                target="_blank"
                              >
                                عرض
                              </Button>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClosePatientDetails}>إغلاق</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPanel;