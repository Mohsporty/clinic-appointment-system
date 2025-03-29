// client/src/components/admin/AdminPatients.js
import React, { useState, useEffect } from 'react';
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
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  CalendarToday as CalendarIcon,
  Description as DocumentIcon,
  Phone as PhoneIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import axios from 'axios';
import { useAppContext } from '../context/AppContext';
import AdminHeader from './AdminHeader';
import AdminLayout from './AdminLayout';

const AdminPatients = ({ compact = false }) => {
  const { user } = useAppContext();
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetailsOpen, setPatientDetailsOpen] = useState(false);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [patientDocuments, setPatientDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      const [usersResponse, appointmentsResponse] = await Promise.all([
        axios.get('/api/users', config),
        axios.get('/api/appointments/all', config)
      ]);
      
      console.log(`تم جلب ${usersResponse.data.length} مريض`);
      setPatients(usersResponse.data);
      setAppointments(appointmentsResponse.data);
      setError('');
    } catch (error) {
      console.error('خطأ في جلب المرضى:', error);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'فشل في تحميل بيانات المرضى'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewPatientDetails = async (patient) => {
    try {
      setLoading(true);
      
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      setSelectedPatient(patient);
      
      const [patientAppointmentsResponse, patientDocumentsResponse] = await Promise.all([
        axios.get(`/api/appointments/patient/${patient._id}`, config),
        axios.get(`/api/documents/patient/${patient._id}`, config)
      ]);
      
      setPatientAppointments(patientAppointmentsResponse.data || []);
      setPatientDocuments(patientDocumentsResponse.data || []);
      setPatientDetailsOpen(true);
    } catch (error) {
      console.error('خطأ في جلب تفاصيل المريض:', error);
      setError('فشل في جلب تفاصيل المريض');
    } finally {
      setLoading(false);
    }
  };

  const handleClosePatientDetails = () => {
    setPatientDetailsOpen(false);
    setSelectedPatient(null);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // فلترة المرضى حسب البحث
  const filteredPatients = patients.filter(patient => 
    !searchTerm || 
    (patient.name && patient.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (patient.phone && patient.phone.includes(searchTerm))
  );

  // محتوى الصفحة
  const content = (
    <>
      <AdminHeader title="إدارة المرضى" onRefresh={fetchPatients} />
      <Box sx={{ p: 3, flexGrow: 1 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            قائمة المرضى ({patients.length})
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              size="small"
              placeholder="بحث عن مريض..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
            
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
            >
              إضافة مريض
            </Button>
          </Box>
        </Box>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {patients.length === 0 ? (
              <Alert severity="info">لا يوجد مرضى مسجلين في النظام</Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>المريض</TableCell>
                      <TableCell>البريد الإلكتروني</TableCell>
                      <TableCell>رقم الهاتف</TableCell>
                      <TableCell>تاريخ التسجيل</TableCell>
                      <TableCell>عدد الزيارات</TableCell>
                      <TableCell>الإجراءات</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPatients.map((patient) => {
                      // حساب عدد زيارات المريض
                      const patientAppointments = appointments.filter(
                        appointment => appointment.patient && 
                                      appointment.patient._id === patient._id
                      );
                      
                      return (
                        <TableRow key={patient._id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ mr: 1, bgcolor: patient.isNewPatient ? 'secondary.main' : 'primary.main' }}>
                                {patient.name ? patient.name.charAt(0) : '?'}
                              </Avatar>
                              <Box>
                                <Typography variant="body2">
                                  {patient.name}
                                  {patient.isNewPatient && (
                                    <Chip 
                                      label="جديد" 
                                      size="small" 
                                      color="secondary" 
                                      sx={{ mr: 0.5, ml: 0.5 }} 
                                    />
                                  )}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{patient.email || 'غير متوفر'}</TableCell>
                          <TableCell>{patient.phone || 'غير متوفر'}</TableCell>
                          <TableCell>
                            {patient.registrationDate || patient.createdAt 
                              ? format(new Date(patient.registrationDate || patient.createdAt), 'd MMMM yyyy', { locale: ar })
                              : 'غير متوفر'
                            }
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={`${patientAppointments.length} زيارة`} 
                              color={patientAppointments.length > 0 ? 'primary' : 'default'} 
                              size="small" 
                              variant={patientAppointments.length > 0 ? 'filled' : 'outlined'} 
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              startIcon={<ViewIcon />}
                              onClick={() => handleViewPatientDetails(patient)}
                            >
                              عرض الملف
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
        
        {/* نافذة عرض تفاصيل المريض */}
        <Dialog open={patientDetailsOpen} onClose={handleClosePatientDetails} maxWidth="lg" fullWidth>
          <DialogTitle>
            ملف المريض: {selectedPatient?.name}
          </DialogTitle>
          <DialogContent>
            {selectedPatient && (
              <Box sx={{ py: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ mb: 3 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ width: 80, height: 80, mb: 2, bgcolor: selectedPatient.isNewPatient ? 'secondary.main' : 'primary.main', fontSize: 32 }}>
                            {selectedPatient.name.charAt(0)}
                          </Avatar>
                          <Typography variant="h6">
                            {selectedPatient.name}
                            {selectedPatient.isNewPatient && (
                              <Chip 
                                label="جديد" 
                                size="small" 
                                color="secondary" 
                                sx={{ mr: 0.5, ml: 0.5 }} 
                              />
                            )}
                          </Typography>
                        </Box>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <List dense>
                          <ListItem>
                            <PhoneIcon sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />
                            <ListItemText primary={selectedPatient.phone || 'غير متوفر'} />
                          </ListItem>
                          <ListItem>
                            <EmailIcon sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />
                            <ListItemText primary={selectedPatient.email} />
                          </ListItem>
                          <ListItem>
                            <CalendarIcon sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />
                            <ListItemText 
                              primary={`تاريخ التسجيل: ${format(new Date(selectedPatient.registrationDate || selectedPatient.createdAt), 'd MMMM yyyy', { locale: ar })}`} 
                            />
                          </ListItem>
                        </List>
                        
                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                          <Chip 
                            label={`${patientAppointments.length} زيارة`} 
                            color="primary" 
                            variant="outlined" 
                          />
                          <Chip 
                            label={`${patientDocuments.length} وثيقة`} 
                            color="secondary" 
                            variant="outlined" 
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={8}>
                    <Paper sx={{ mb: 3 }}>
                      <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
                        <Tab icon={<CalendarIcon />} label="المواعيد" />
                        <Tab icon={<DocumentIcon />} label="الوثائق" />
                      </Tabs>
                      
                      <Box sx={{ p: 2 }}>
                        {activeTab === 0 && (
                          <Box>
                            {patientAppointments.length === 0 ? (
                              <Alert severity="info">لا توجد مواعيد لهذا المريض</Alert>
                            ) : (
                              <TableContainer>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>التاريخ</TableCell>
                                      <TableCell>الوقت</TableCell>
                                      <TableCell>نوع الزيارة</TableCell>
                                      <TableCell>الحالة</TableCell>
                                      <TableCell>الدفع</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {patientAppointments.map((appointment) => (
                                      <TableRow key={appointment._id}>
                                        <TableCell>{format(parseISO(appointment.date), 'd/M/yyyy', { locale: ar })}</TableCell>
                                        <TableCell>{appointment.time}</TableCell>
                                        <TableCell>
                                          {appointment.type === 'new' ? 'كشف جديد' :
                                           appointment.type === 'followup' ? 'متابعة' :
                                           appointment.type === 'consultation' ? 'استشارة' :
                                           appointment.type || 'غير محدد'}
                                        </TableCell>
                                        <TableCell>
                                          <Chip 
                                            label={appointment.status === 'scheduled' ? 'مجدول' :
                                                  appointment.status === 'completed' ? 'مكتمل' :
                                                  appointment.status === 'cancelled' ? 'ملغي' :
                                                  appointment.status === 'no-show' ? 'لم يحضر' :
                                                  appointment.status}
                                            size="small"
                                            color={appointment.status === 'scheduled' ? 'primary' :
                                                appointment.status === 'completed' ? 'success' :
                                                appointment.status === 'cancelled' ? 'error' :
                                                appointment.status === 'no-show' ? 'warning' :
                                                'default'}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Chip 
                                          label={appointment.paymentStatus === 'paid' ? 'مدفوع' :
                                                appointment.paymentStatus === 'pending' ? 'غير مدفوع' :
                                                appointment.paymentStatus === 'refunded' ? 'مسترجع' :
                                                appointment.paymentStatus}
                                          size="small"
                                          color={appointment.paymentStatus === 'paid' ? 'success' :
                                                appointment.paymentStatus === 'pending' ? 'warning' :
                                                appointment.paymentStatus === 'refunded' ? 'info' :
                                                'default'}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          )}
                        </Box>
                      )}
                      
                      {activeTab === 1 && (
                        <Box>
                          {patientDocuments.length === 0 ? (
                            <Alert severity="info">لا توجد وثائق لهذا المريض</Alert>
                          ) : (
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>اسم الملف</TableCell>
                                    <TableCell>النوع</TableCell>
                                    <TableCell>تاريخ الرفع</TableCell>
                                    <TableCell>الوصف</TableCell>
                                    <TableCell>عرض</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {patientDocuments.map((document) => (
                                    <TableRow key={document._id}>
                                      <TableCell>{document.name}</TableCell>
                                      <TableCell>
                                        <Chip 
                                          label={document.type === 'report' ? 'تقرير طبي' :
                                                document.type === 'image' ? 'صورة أشعة' :
                                                document.type === 'prescription' ? 'وصفة طبية' :
                                                document.type === 'other' ? 'أخرى' :
                                                document.type}
                                          size="small"
                                          color={document.type === 'report' ? 'primary' :
                                                document.type === 'image' ? 'info' :
                                                document.type === 'prescription' ? 'secondary' :
                                                'default'}
                                        />
                                      </TableCell>
                                      <TableCell>{format(new Date(document.uploadDate), 'd/M/yyyy', { locale: ar })}</TableCell>
                                      <TableCell>{document.description || '-'}</TableCell>
                                      <TableCell>
                                        <Button 
                                          size="small" 
                                          variant="outlined"
                                          component="a"
                                          href={`/uploads/${document.filePath.split('/').pop()}`}
                                          target="_blank"
                                        >
                                          عرض
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePatientDetails}>إغلاق</Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<CalendarIcon />}
          >
            إضافة موعد جديد
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

export default AdminPatients;