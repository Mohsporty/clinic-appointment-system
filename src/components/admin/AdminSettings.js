// client/src/components/admin/AdminSettings.js
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  TextField, 
  Button, 
  Grid,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Card,
  CardContent,
  CardHeader,
  Tooltip,
  Chip
} from '@mui/material';
import { 
  Save as SaveIcon,
  AccessTime as TimeIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  CalendarMonth as CalendarIcon,
  AttachMoney as MoneyIcon,
  NotificationsActive as AlertIcon
} from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';
import AdminHeader from './AdminHeader';
import AdminLayout from './AdminLayout';
import axios from 'axios';

const AdminSettings = () => {
  const { user } = useAppContext();
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // إعدادات العامة
  const [clinicName, setClinicName] = useState('عيادة الدكتور سليمان الخالدي');
  const [clinicEmail, setClinicEmail] = useState('info@clinic.com');
  const [clinicPhone, setClinicPhone] = useState('+966 50 123 4567');
  const [clinicAddress, setClinicAddress] = useState('الرياض - حي الورود - شارع التخصصي');
  
  // إعدادات المواعيد
  const [appointmentDuration, setAppointmentDuration] = useState('30');
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('20:00');
  
  // إعدادات أيام العمل
  const [workingDays, setWorkingDays] = useState({
    sunday: true,
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: false,
    saturday: false
  });

  // جدول الأوقات المتاحة للحجز
  const [availableTimeSlots, setAvailableTimeSlots] = useState([
    { day: 'sunday', slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30'] },
    { day: 'monday', slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30'] },
    { day: 'tuesday', slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30'] },
    { day: 'wednesday', slots: ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'] },
    { day: 'thursday', slots: ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'] }
  ]);
  
  // أوقات الراحة/العطلات
  const [breakTimes, setBreakTimes] = useState([
    { day: 'all', startTime: '13:00', endTime: '14:00', label: 'استراحة الغداء' }
  ]);

  // إعدادات الأسعار
  const [appointmentTypes, setAppointmentTypes] = useState([
    { id: 1, type: 'new', name: 'كشف جديد', price: 300 },
    { id: 2, type: 'followup', name: 'متابعة', price: 200 },
    { id: 3, type: 'consultation', name: 'استشارة', price: 250 }
  ]);

  // حالة إضافة فترة راحة جديدة
  const [newBreakDay, setNewBreakDay] = useState('all');
  const [newBreakStartTime, setNewBreakStartTime] = useState('');
  const [newBreakEndTime, setNewBreakEndTime] = useState('');
  const [newBreakLabel, setNewBreakLabel] = useState('');

  // إعدادات الإشعارات
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [reminderHours, setReminderHours] = useState('24');
  
  // قائمة بأيام الأسبوع بالعربية
  const daysOfWeek = [
    { value: 'sunday', label: 'الأحد' },
    { value: 'monday', label: 'الإثنين' },
    { value: 'tuesday', label: 'الثلاثاء' },
    { value: 'wednesday', label: 'الأربعاء' },
    { value: 'thursday', label: 'الخميس' },
    { value: 'friday', label: 'الجمعة' },
    { value: 'saturday', label: 'السبت' },
    { value: 'all', label: 'كل الأيام' }
  ];

  // قائمة بساعات اليوم
  const timeOptions = [];
  for (let hour = 8; hour <= 20; hour++) {
    for (let minute of ['00', '30']) {
      timeOptions.push(`${hour}:${minute}`);
    }
  }

  useEffect(() => {
    // محاكاة جلب البيانات من الخادم
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // التعامل مع تغيير أيام العمل
  const handleWorkingDayChange = (day) => {
    setWorkingDays({
      ...workingDays,
      [day]: !workingDays[day]
    });
  };

  // دالة لتوليد الأوقات المتاحة بناءً على مدة الموعد
  const generateTimeSlots = () => {
    const startTime = parseInt(workStartTime.split(':')[0]) * 60 + parseInt(workStartTime.split(':')[1]);
    const endTime = parseInt(workEndTime.split(':')[0]) * 60 + parseInt(workEndTime.split(':')[1]);
    const duration = parseInt(appointmentDuration);
    
    let slots = [];
    for (let time = startTime; time < endTime; time += duration) {
      const hour = Math.floor(time / 60);
      const minute = time % 60;
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
    
    return slots;
  };

  // إعادة توليد جميع الأوقات المتاحة
  const regenerateAllTimeSlots = () => {
    const slots = generateTimeSlots();
    
    // تحديث الأوقات المتاحة لكل يوم
    const updatedTimeSlots = [];
    Object.keys(workingDays).forEach(day => {
      if (workingDays[day]) {
        updatedTimeSlots.push({ day, slots });
      }
    });
    
    setAvailableTimeSlots(updatedTimeSlots);
    setSuccess('تم إعادة توليد جدول المواعيد بنجاح');
  };

  // إضافة فترة راحة جديدة
  const addBreakTime = () => {
    if (!newBreakStartTime || !newBreakEndTime) {
      setError('يرجى تحديد وقت البداية والنهاية للفترة');
      return;
    }
    
    // التحقق من أن وقت البداية قبل وقت النهاية
    const startMinutes = parseInt(newBreakStartTime.split(':')[0]) * 60 + parseInt(newBreakStartTime.split(':')[1]);
    const endMinutes = parseInt(newBreakEndTime.split(':')[0]) * 60 + parseInt(newBreakEndTime.split(':')[1]);
    
    if (startMinutes >= endMinutes) {
      setError('يجب أن يكون وقت البداية قبل وقت النهاية');
      return;
    }
    
    setBreakTimes([
      ...breakTimes,
      {
        day: newBreakDay,
        startTime: newBreakStartTime,
        endTime: newBreakEndTime,
        label: newBreakLabel || 'فترة راحة'
      }
    ]);
    
    // إعادة تعيين الحقول
    setNewBreakDay('all');
    setNewBreakStartTime('');
    setNewBreakEndTime('');
    setNewBreakLabel('');
    
    setSuccess('تمت إضافة فترة الراحة بنجاح');
  };

  // حذف فترة راحة
  const removeBreakTime = (index) => {
    setBreakTimes(breakTimes.filter((_, i) => i !== index));
    setSuccess('تم حذف فترة الراحة بنجاح');
  };

  // تحديث أسعار أنواع المواعيد
  const updateAppointmentPrice = (id, newPrice) => {
    setAppointmentTypes(appointmentTypes.map(type => 
      type.id === id ? { ...type, price: newPrice } : type
    ));
  };

  const handleSaveGeneralSettings = async () => {
    try {
      setLoading(true);
      
      // محاكاة الاتصال بالخادم
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // هنا سيتم إرسال البيانات إلى الخادم
      // const config = {
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${user.token}`
      //   }
      // };
      // 
      // await axios.post('/api/settings/general', {
      //   clinicName,
      //   clinicEmail,
      //   clinicPhone,
      //   clinicAddress
      // }, config);
      
      setSuccess('تم حفظ الإعدادات العامة بنجاح');
    } catch (error) {
      setError('حدث خطأ أثناء حفظ الإعدادات');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveAppointmentSettings = async () => {
    try {
      setLoading(true);
      
      // محاكاة الاتصال بالخادم
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // هنا سيتم إرسال البيانات إلى الخادم
      // const config = {
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${user.token}`
      //   }
      // };
      // 
      // await axios.post('/api/settings/appointments', {
      //   appointmentDuration,
      //   workStartTime,
      //   workEndTime,
      //   workingDays,
      //   availableTimeSlots,
      //   breakTimes
      // }, config);
      
      setSuccess('تم حفظ إعدادات المواعيد بنجاح');
    } catch (error) {
      setError('حدث خطأ أثناء حفظ إعدادات المواعيد');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSavePriceSettings = async () => {
    try {
      setLoading(true);
      
      // محاكاة الاتصال بالخادم
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // هنا سيتم إرسال البيانات إلى الخادم
      // const config = {
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${user.token}`
      //   }
      // };
      // 
      // await axios.post('/api/settings/prices', {
      //   appointmentTypes
      // }, config);
      
      setSuccess('تم حفظ إعدادات الأسعار بنجاح');
    } catch (error) {
      setError('حدث خطأ أثناء حفظ إعدادات الأسعار');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveNotificationSettings = async () => {
    try {
      setLoading(true);
      
      // محاكاة الاتصال بالخادم
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // هنا سيتم إرسال البيانات إلى الخادم
      // const config = {
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${user.token}`
      //   }
      // };
      // 
      // await axios.post('/api/settings/notifications', {
      //   emailNotifications,
      //   smsNotifications,
      //   reminderHours
      // }, config);
      
      setSuccess('تم حفظ إعدادات الإشعارات بنجاح');
    } catch (error) {
      setError('حدث خطأ أثناء حفظ إعدادات الإشعارات');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // محتوى الصفحة
  const content = (
    <>
      <AdminHeader title="إعدادات النظام" />
      
      <Box sx={{ p: 3, flexGrow: 1 }}>
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="الإعدادات العامة" icon={<SettingsIcon />} iconPosition="start" />
            <Tab label="إعدادات المواعيد" icon={<CalendarIcon />} iconPosition="start" />
            <Tab label="الأسعار والخدمات" icon={<MoneyIcon />} iconPosition="start" />
            <Tab label="الإشعارات والتنبيهات" icon={<NotificationsIcon />} iconPosition="start" />
          </Tabs>
        </Paper>
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        )}
        
        {/* الإعدادات العامة */}
        {activeTab === 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              الإعدادات العامة
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="اسم العيادة"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="البريد الإلكتروني للعيادة"
                  value={clinicEmail}
                  onChange={(e) => setClinicEmail(e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="رقم هاتف العيادة"
                  value={clinicPhone}
                  onChange={(e) => setClinicPhone(e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="عنوان العيادة"
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSaveGeneralSettings}
                    startIcon={<SaveIcon />}
                    disabled={loading}
                  >
                    حفظ الإعدادات
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}
        
        {/* إعدادات المواعيد */}
        {activeTab === 1 && (
          <Box>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                إعدادات أوقات العمل
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="مدة الموعد (بالدقائق)"
                    type="number"
                    value={appointmentDuration}
                    onChange={(e) => setAppointmentDuration(e.target.value)}
                    InputProps={{ inputProps: { min: 10, max: 120 } }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="بداية ساعات العمل"
                    type="time"
                    value={workStartTime}
                    onChange={(e) => setWorkStartTime(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="نهاية ساعات العمل"
                    type="time"
                    value={workEndTime}
                    onChange={(e) => setWorkEndTime(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    أيام العمل
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {daysOfWeek.slice(0, 7).map((day) => (
                      <FormControlLabel
                        key={day.value}
                        control={
                          <Checkbox
                            checked={workingDays[day.value]}
                            onChange={() => handleWorkingDayChange(day.value)}
                          />
                        }
                        label={day.label}
                      />
                    ))}
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={regenerateAllTimeSlots}
                      disabled={loading}
                      sx={{ ml: 2 }}
                    >
                      إعادة توليد جدول المواعيد
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSaveAppointmentSettings}
                      startIcon={<SaveIcon />}
                      disabled={loading}
                    >
                      حفظ إعدادات المواعيد
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
            
            {/* جدول الأوقات المتاحة للحجز */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                جدول الأوقات المتاحة للحجز
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                {/* عرض الأوقات المتاحة لكل يوم */}
                {availableTimeSlots.map((daySlot, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Card variant="outlined">
                      <CardHeader 
                        title={daysOfWeek.find(d => d.value === daySlot.day)?.label || daySlot.day} 
                        sx={{ bgcolor: 'primary.light', color: 'white' }} 
                      />
                      <CardContent>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {daySlot.slots.map((time, timeIndex) => (
                            <Chip 
                              key={timeIndex} 
                              label={time} 
                              color="primary" 
                              variant="outlined"
                              onDelete={() => {
                                const updatedSlots = [...availableTimeSlots];
                                updatedSlots[index].slots = updatedSlots[index].slots.filter(t => t !== time);
                                setAvailableTimeSlots(updatedSlots);
                              }}
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
            
            {/* فترات الراحة والعطلات */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                فترات الراحة والعطلات
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>اليوم</InputLabel>
                    <Select
                      value={newBreakDay}
                      onChange={(e) => setNewBreakDay(e.target.value)}
                      label="اليوم"
                    >
                      {daysOfWeek.map((day) => (
                        <MenuItem key={day.value} value={day.value}>{day.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="وقت البداية"
                    type="time"
                    value={newBreakStartTime}
                    onChange={(e) => setNewBreakStartTime(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="وقت النهاية"
                    type="time"
                    value={newBreakEndTime}
                    onChange={(e) => setNewBreakEndTime(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="الوصف"
                    value={newBreakLabel}
                    onChange={(e) => setNewBreakLabel(e.target.value)}
                    placeholder="مثال: استراحة الغداء"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={addBreakTime}
                    startIcon={<AddIcon />}
                  >
                    إضافة فترة راحة
                  </Button>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    فترات الراحة الحالية:
                  </Typography>
                  
                  <List>
                    {breakTimes.map((breakTime, index) => (
                      <ListItem 
                        key={index}
                        secondaryAction={
                          <IconButton edge="end" onClick={() => removeBreakTime(index)}>
                            <DeleteIcon />
                          </IconButton>
                        }
                      >
                        <ListItemIcon>
                          <TimeIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary={breakTime.label} 
                          secondary={`${daysOfWeek.find(d => d.value === breakTime.day)?.label || breakTime.day}: من ${breakTime.startTime} إلى ${breakTime.endTime}`} 
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}
        
        {/* إعدادات الأسعار والخدمات */}
        {activeTab === 2 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              إعدادات الأسعار
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              {appointmentTypes.map((type) => (
                <Grid item xs={12} sm={6} md={4} key={type.id}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {type.name}
                    </Typography>
                    <TextField
                      fullWidth
                      label="السعر (ريال)"
                      type="number"
                      value={type.price}
                      onChange={(e) => updateAppointmentPrice(type.id, e.target.value)}
                      InputProps={{ inputProps: { min: 0 } }}
                      sx={{ mb: 1 }}
                    />
                  </Paper>
                </Grid>
              ))}
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSavePriceSettings}
                    startIcon={<SaveIcon />}
                    disabled={loading}
                  >
                    حفظ إعدادات الأسعار
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}
        
        {/* إعدادات الإشعارات */}
        {activeTab === 3 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              إعدادات الإشعارات والتنبيهات
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="تفعيل الإشعارات عبر البريد الإلكتروني"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={smsNotifications}
                      onChange={(e) => setSmsNotifications(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="تفعيل الإشعارات عبر الرسائل النصية"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="إرسال تذكير قبل الموعد بـ (ساعة)"
                  type="number"
                  value={reminderHours}
                  onChange={(e) => setReminderHours(e.target.value)}
                  InputProps={{ inputProps: { min: 1, max: 72 } }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                   variant="contained"
                   color="primary"
                   onClick={handleSaveNotificationSettings}
                   startIcon={<SaveIcon />}
                   disabled={loading}
                 >
                   حفظ إعدادات الإشعارات
                 </Button>
               </Box>
             </Grid>
           </Grid>
         </Paper>
       )}
     </Box>
   </>
 );

 return (
   <AdminLayout>
     {content}
   </AdminLayout>
 );
};

export default AdminSettings;