// client/src/components/NotFound.js
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Container, Typography, Button, Paper } from '@mui/material';

const NotFound = () => {
  return (
    <Container maxWidth="md">
      <Paper 
        elevation={3} 
        sx={{ 
          textAlign: 'center', 
          p: 5, 
          mt: 4,
          borderRadius: 2,
          bgcolor: '#f8f9fa'
        }}
      >
        <Typography variant="h1" component="h1" color="error" gutterBottom>
          404
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          الصفحة غير موجودة
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها أو حذفها.
        </Typography>
        <Box mt={4}>
          <Button
            variant="contained"
            color="primary"
            component={RouterLink}
            to="/"
            size="large"
          >
            العودة للصفحة الرئيسية
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default NotFound;