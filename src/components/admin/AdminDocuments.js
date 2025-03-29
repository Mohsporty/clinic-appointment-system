// client/src/components/admin/AdminDocuments.js
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
  IconButton,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  DownloadOutlined as DownloadIcon,
  CloudUpload as UploadIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import axios from 'axios';
import { useAppContext } from '../context/AppContext';
import AdminHeader from './AdminHeader';
import AdminLayout from './AdminLayout';

const AdminDocuments = ({ compact = false }) => {
  const { user } = useAppContext();
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      const { data } = await axios.get('/api/documents/all', config);
      
      console.log(`تم جلب ${data.length} وثيقة`);
      setDocuments(data);
      setError('');
    } catch (error) {
      console.error('خطأ في جلب الوثائق:', error);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'فشل في تحميل بيانات الوثائق'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (document) => {
    setSelectedDocument(document);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDocument = async () => {
    try {
      setLoading(true);
      
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      await axios.delete(`/api/documents/${selectedDocument._id}`, config);
      
      // إعادة تحميل الوثائق
      fetchDocuments();
      setDeleteDialogOpen(false);
      setSelectedDocument(null);
    } catch (error) {
      setError('فشل في حذف الوثيقة');
      console.error('خطأ في حذف الوثيقة:', error);
    } finally {
      setLoading(false);
    }
  };

  // تحويل نوع الوثيقة إلى نص عربي
  const getDocumentType = (type) => {
    switch (type) {
      case 'report':
        return <Chip label="تقرير طبي" color="primary" size="small" />;
      case 'image':
        return <Chip label="صورة أشعة" color="info" size="small" />;
      case 'prescription':
        return <Chip label="وصفة طبية" color="secondary" size="small" />;
      case 'other':
        return <Chip label="وثيقة أخرى" color="default" size="small" />;
      default:
        return <Chip label={type || "غير محدد"} size="small" />;
    }
  };

  // فلترة الوثائق حسب البحث
  const filteredDocuments = documents.filter(doc => 
    !searchTerm || 
    (doc.name && doc.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (doc.patient && doc.patient.name && doc.patient.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (doc.type && doc.type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // محتوى الصفحة
  const content = (
    <>
      <AdminHeader title="إدارة الوثائق" onRefresh={fetchDocuments} />
      <Box sx={{ p: 3, flexGrow: 1 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            قائمة الوثائق ({documents.length})
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              size="small"
              placeholder="بحث عن وثيقة أو مريض..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
              sx={{ width: 250 }}
            />
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<UploadIcon />}
            >
              رفع وثيقة جديدة
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
            {filteredDocuments.length === 0 ? (
              <Alert severity="info">لا توجد وثائق تطابق معايير البحث</Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>المريض</TableCell>
                      <TableCell>اسم الملف</TableCell>
                      <TableCell>النوع</TableCell>
                      <TableCell>تاريخ الرفع</TableCell>
                      <TableCell>الوصف</TableCell>
                      <TableCell>الإجراءات</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredDocuments.map((document) => (
                      <TableRow key={document._id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 1, bgcolor: 'primary.main' }}>
                              {document.patient && document.patient.name ? document.patient.name.charAt(0) : '?'}
                            </Avatar>
                            <Typography variant="body2">
                              {document.patient ? document.patient.name : 'غير معروف'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{document.name}</TableCell>
                        <TableCell>{getDocumentType(document.type)}</TableCell>
                        <TableCell>
                          {format(new Date(document.uploadDate), 'd MMMM yyyy', { locale: ar })}
                        </TableCell>
                        <TableCell>
                          {document.description || '-'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton 
                              size="small" 
                              color="primary"
                              component="a"
                              href={`/uploads/${document.filePath.split('/').pop()}`}
                              target="_blank"
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="info"
                              component="a"
                              href={`/uploads/${document.filePath.split('/').pop()}`}
                              download
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="secondary"
                            >
                              <PersonIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteClick(document)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
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
        
        {/* حوار تأكيد الحذف */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>
            تأكيد الحذف
          </DialogTitle>
          <DialogContent>
            <Typography>
              هل أنت متأكد من رغبتك في حذف هذه الوثيقة؟
              {selectedDocument && (
                <Typography component="div" sx={{ mt: 1 }}>
                  <strong>الوثيقة:</strong> {selectedDocument.name}<br />
                  <strong>نوع الوثيقة:</strong> {
                    selectedDocument.type === 'report' ? 'تقرير طبي' :
                    selectedDocument.type === 'image' ? 'صورة أشعة' :
                    selectedDocument.type === 'prescription' ? 'وصفة طبية' :
                    selectedDocument.type === 'other' ? 'وثيقة أخرى' :
                    selectedDocument.type
                  }<br />
                  {selectedDocument.patient && (
                    <><strong>المريض:</strong> {selectedDocument.patient.name}</>
                  )}
                </Typography>
              )}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleDeleteDocument} color="error" variant="contained">
              تأكيد الحذف
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

export default AdminDocuments;