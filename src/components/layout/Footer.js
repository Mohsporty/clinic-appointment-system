// client/src/components/layout/Footer.js
import React from 'react';
import { Box, Container, Typography, Link, Grid } from '@mui/material';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: '#f5f5f5',
        borderTop: '1px solid #e0e0e0'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={2} justifyContent="space-between">
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              نظام المواعيد الطبية
            </Typography>
            <Typography variant="body2" color="text.secondary">
              منصة متكاملة لإدارة العيادات والمراكز الطبية
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} sx={{ textAlign: { xs: 'right', md: 'center' } }}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              روابط هامة
            </Typography>
            <Typography variant="body2">
              <Link href="/" color="inherit" sx={{ display: 'block', mb: 1 }}>
                الرئيسية
              </Link>
              <Link href="/about" color="inherit" sx={{ display: 'block', mb: 1 }}>
                من نحن
              </Link>
              <Link href="/privacy" color="inherit" sx={{ display: 'block', mb: 1 }}>
                سياسة الخصوصية
              </Link>
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} sx={{ textAlign: { xs: 'right', md: 'left' } }}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              تواصل معنا
            </Typography>
            <Typography variant="body2" color="text.secondary">
              info@tadw.io
            </Typography>
            <Typography variant="body2" color="text.secondary">
            +966 55 555 5555
            </Typography>
          </Grid>
        </Grid>
        
        <Box mt={3} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            {'جميع الحقوق محفوظة © '}
            {currentYear}
            {'  شركه تداو البرمجية '}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;