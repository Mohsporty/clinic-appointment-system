// client/src/components/Home.js
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CardMedia,
  Stack,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Article as ArticleIcon,
  Star as StarIcon,
  Check as CheckIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  MedicalServices as MedicalIcon
} from '@mui/icons-material';

const Home = () => {
  // نماذج للمقالات - يمكن استبدالها بمحتوى حقيقي
  const articles = [
    {
      id: 1,
      title: 'أحدث طرق علاج آلام العمود الفقري',
      summary: 'يستعرض الدكتور سليمان الخالدي أحدث التقنيات المستخدمة في علاج آلام الظهر والعمود الفقري...',
      date: '10 مارس 2023'
    },
    {
      id: 2,
      title: 'نصائح للتعامل مع إصابات الركبة الشائعة',
      summary: 'يقدم الدكتور سليمان الخالدي مجموعة من النصائح الهامة للوقاية من إصابات الركبة...',
      date: '22 فبراير 2023'
    },
    {
      id: 3,
      title: 'العلاج الطبيعي ودوره في التأهيل بعد الجراحة',
      summary: 'مقال تفصيلي عن أهمية العلاج الطبيعي في مرحلة التعافي بعد العمليات الجراحية...',
      date: '5 فبراير 2023'
    }
  ];
  
  // استخدام صور افتراضية من موقع خارجي بدلاً من الاعتماد على ملفات محلية قد لا تكون موجودة
  const doctorImage = 'https://img.freepik.com/free-photo/doctor-with-his-arms-crossed-white-background_1368-5790.jpg?size=626&ext=jpg';
  const articleImages = [
    'https://img.freepik.com/free-photo/young-male-psysical-therapist-making-massage-patient-back_1303-20838.jpg?size=626&ext=jpg',
    'https://img.freepik.com/free-photo/woman-doing-rehabilitation-exercises-with-therapist_23-2149113460.jpg?size=626&ext=jpg',
    'https://img.freepik.com/free-photo/physiotherapist-giving-shoulder-exercise-with-dumbbell-male-patient_107420-83450.jpg?size=626&ext=jpg'
  ];
  
  return (
    <Container maxWidth="lg">
      {/* قسم الدكتور */}
      <Box 
        sx={{ 
          py: 6,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          gap: 4
        }}
      >
        <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'right' } }}>
          <Typography variant="h3" component="h1" gutterBottom color="primary">
            د. سليمان الخالدي
          </Typography>
          <Typography variant="h5" gutterBottom color="text.secondary">
            استشاري جراحة العظام والمفاصل
          </Typography>
          <Typography variant="body1" paragraph>
            خبرة أكثر من 15 عاماً في مجال جراحة العظام والمفاصل، حاصل على الزمالة البريطانية والأمريكية في جراحة العظام والعمود الفقري.
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 3, maxWidth: 300, mx: { xs: 'auto', md: 0 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationIcon color="primary" />
              <Typography>الرياض - حي الورود - شارع التخصصي</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon color="primary" />
              <Typography>+966 50 123 4567</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon color="primary" />
              <Typography>dr.sulaiman@example.com</Typography>
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ flex: 1, maxWidth: { xs: '100%', md: '400px' } }}>
          <CardMedia
            component="img"
            sx={{ 
              height: 400, 
              objectFit: 'cover', 
              borderRadius: 2,
              boxShadow: 3
            }}
            image={doctorImage}
            alt="صورة الدكتور سليمان الخالدي"
          />
        </Box>
      </Box>
      
      <Divider sx={{ my: 4 }} />
      
      {/* قسم التخصصات */}
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ mb: 4 }}>
          تخصصاتنا
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 3, height: '100%', textAlign: 'center' }}>
              <Box sx={{ mb: 2, color: 'primary.main' }}>
                <MedicalIcon sx={{ fontSize: 40 }} />
              </Box>
              <Typography variant="h6" gutterBottom>جراحة العمود الفقري</Typography>
              <Typography variant="body2" color="text.secondary">
                علاج متكامل لمشاكل العمود الفقري بأحدث التقنيات
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 3, height: '100%', textAlign: 'center' }}>
              <Box sx={{ mb: 2, color: 'primary.main' }}>
                <MedicalIcon sx={{ fontSize: 40 }} />
              </Box>
              <Typography variant="h6" gutterBottom>جراحة المفاصل</Typography>
              <Typography variant="body2" color="text.secondary">
                تشخيص وعلاج مشاكل المفاصل وجراحات استبدال المفاصل
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 3, height: '100%', textAlign: 'center' }}>
              <Box sx={{ mb: 2, color: 'primary.main' }}>
                <MedicalIcon sx={{ fontSize: 40 }} />
              </Box>
              <Typography variant="h6" gutterBottom>علاج إصابات الرياضيين</Typography>
              <Typography variant="body2" color="text.secondary">
                تشخيص وعلاج إصابات الملاعب والرياضيين المحترفين
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 3, height: '100%', textAlign: 'center' }}>
              <Box sx={{ mb: 2, color: 'primary.main' }}>
                <MedicalIcon sx={{ fontSize: 40 }} />
              </Box>
              <Typography variant="h6" gutterBottom>العلاج الطبيعي</Typography>
              <Typography variant="body2" color="text.secondary">
                برامج تأهيل وعلاج طبيعي متكاملة بعد الجراحة وللإصابات المختلفة
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      
      <Divider sx={{ my: 4 }} />
      
      {/* قسم المقالات */}
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ mb: 4 }}>
          أحدث المقالات الطبية
        </Typography>
        
        <Grid container spacing={4}>
          {articles.map((article, index) => (
            <Grid item xs={12} md={4} key={article.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="180"
                  image={articleImages[index]}
                  alt={article.title}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {article.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {article.summary}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    نُشر في {article.date}
                  </Typography>
                </CardContent>
                <Box sx={{ p: 2, pt: 0 }}>
                  <Button size="small" color="primary">
                    قراءة المزيد
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
      
      <Divider sx={{ my: 4 }} />
      
      {/* قسم حجز المواعيد */}
      <Box 
        sx={{ 
          py: 6,
          textAlign: 'center',
          bgcolor: 'primary.main',
          color: 'white',
          borderRadius: 2,
          mb: 6,
          px: 3
        }}
      >
        <Typography variant="h4" component="h2" gutterBottom>
          احجز موعدك الآن
        </Typography>
        <Typography variant="body1" paragraph sx={{ mb: 4, maxWidth: 700, mx: 'auto' }}>
          يمكنك الآن حجز موعد مع الدكتور سليمان الخالدي بسهولة عبر نظامنا الإلكتروني. قم بتحديد الوقت المناسب لك واختر نوع الزيارة.
        </Typography>
        <Button 
          variant="contained" 
          size="large"
          component={RouterLink}
          to="/register"
          sx={{ 
            bgcolor: 'white', 
            color: 'primary.main',
            '&:hover': {
              bgcolor: 'grey.100',
            },
            mr: 2
          }}
        >
          تسجيل حساب جديد
        </Button>
        <Button 
          variant="outlined" 
          size="large"
          component={RouterLink}
          to="/login"
          sx={{ 
            borderColor: 'white', 
            color: 'white',
            '&:hover': {
              borderColor: 'grey.300',
              bgcolor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          تسجيل الدخول
        </Button>
      </Box>
    </Container>
  );
};

export default Home;