// client/src/components/dashboard/DocumentsList.js
import React, { useState, useEffect, useCallback } from 'react';
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
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction
} from '@mui/material';
import { 
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  Description as ReportIcon,
  Assignment as PrescriptionIcon,
  MoreHoriz as OtherIcon
} from '@mui/icons-material';

const DocumentsList = ({ user }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  // حالة النموذج
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const [description, setDescription] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  
  const documentTypes = [
    { value: 'report', label: 'تقرير طبي', icon: <ReportIcon /> },
    { value: 'image', label: 'صورة أشعة', icon: <ImageIcon /> },
    { value: 'prescription', label: 'وصفة طبية', icon: <PrescriptionIcon /> },
    { value: 'other', label: 'وثيقة أخرى', icon: <OtherIcon /> }
  ];
  
  // تحسين fetchDocuments باستخدام useCallback
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      
      const config = {
        headers: {
          Authorization: `Bearer ${user?.token}`
        }
      };
      
      const { data } = await axios.get('/api/documents', config);
      
      // ترتيب الوثائق حسب تاريخ الرفع (الأحدث أولاً)
      const sortedDocuments = data.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
      
      setDocuments(sortedDocuments);
      setError('');
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'فشل في تحميل الوثائق'
      );
    } finally {
      setLoading(false);
    }
  }, [user]); // إضافة user كتبعية
  
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]); // إضافة fetchDocuments كتبعية
  
  const handleOpenUpload = () => {
    setFile(null);
    setDocumentType('');
    setDescription('');
    setUploadOpen(true);
  };
  
  const handleCloseUpload = () => {
    setUploadOpen(false);
  };
  
  const handleOpenDelete = (document) => {
    setSelectedDocument(document);
    setDeleteOpen(true);
  };
  
  const handleCloseDelete = () => {
    setDeleteOpen(false);
    setSelectedDocument(null);
  };
  
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };
  
  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file || !documentType) {
      setError('يرجى اختيار ملف ونوع الوثيقة');
      return;
    }
    
    try {
      setUploadLoading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', documentType);
      formData.append('description', description);
      
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user.token}`
        }
      };
      
      await axios.post('/api/documents', formData, config);
      
      // إعادة تحميل الوثائق
      fetchDocuments();
      handleCloseUpload();
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'فشل في رفع الوثيقة'
      );
    } finally {
      setUploadLoading(false);
    }
  };
  
  const handleDeleteDocument = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      await axios.delete(`/api/documents/${selectedDocument._id}`, config);
      
      // إعادة تحميل الوثائق
      fetchDocuments();
      handleCloseDelete();
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'فشل في حذف الوثيقة'
      );
    }
  };
  
  // الحصول على أيقونة حسب نوع الوثيقة
  const getDocumentIcon = (type) => {
    switch (type) {
      case 'report':
        return <ReportIcon fontSize="large" color="primary" />;
      case 'image':
        return <ImageIcon fontSize="large" color="secondary" />;
      case 'prescription':
        return <PrescriptionIcon fontSize="large" color="success" />;
      case 'other':
      default:
        return <FileIcon fontSize="large" color="action" />;
    }
  };
  
  // الحصول على اسم نوع الوثيقة بالعربية
  const getDocumentTypeName = (type) => {
    const docType = documentTypes.find(d => d.value === type);
    return docType ? docType.label : 'وثيقة';
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
          الوثائق والتقارير
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<UploadIcon />}
          onClick={handleOpenUpload}
        >
          رفع وثيقة جديدة
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {documents.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="textSecondary">
            لا توجد وثائق مرفوعة. قم برفع وثيقة جديدة.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {documents.map((document) => (
            <Grid item xs={12} sm={6} md={4} key={document._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                    {getDocumentIcon(document.type)}
                    <Typography variant="subtitle1" sx={{ mt: 1 }}>
                      {document.name}
                    </Typography>
                    <Chip 
                      label={getDocumentTypeName(document.type)} 
                      size="small" 
                      sx={{ mt: 1 }} 
                    />
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    <strong>تاريخ الرفع:</strong> {format(new Date(document.uploadDate), 'd MMMM yyyy', { locale: ar })}
                  </Typography>
                  
                  {document.description && (
                    <Typography variant="body2" color="textSecondary">
                      <strong>الوصف:</strong> {document.description}
                    </Typography>
                  )}
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'space-between' }}>
                  <Button 
                    size="small" 
                    color="primary"
                    component="a"
                    href={`/uploads/${document.filePath.split('/').pop()}`}
                    target="_blank"
                  >
                    عرض
                  </Button>
                  <Button 
                    size="small" 
                    color="error" 
                    startIcon={<DeleteIcon />}
                    onClick={() => handleOpenDelete(document)}
                  >
                    حذف
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* نافذة رفع وثيقة جديدة */}
      <Dialog open={uploadOpen} onClose={handleCloseUpload} maxWidth="sm" fullWidth>
        <DialogTitle>
          رفع وثيقة جديدة
        </DialogTitle>
        
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<UploadIcon />}
              sx={{ mb: 2, p: 1.5 }}
            >
              اختر ملفًا
              <input
                type="file"
                hidden
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
              />
            </Button>
            
            {file && (
              <Typography variant="body2" sx={{ mb: 2 }}>
                الملف المختار: {file.name}
              </Typography>
            )}
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="documentType"
              label="نوع الوثيقة"
              select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              dir="rtl"
            >
              {documentTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ mr: 1 }}>{type.icon}</Box>
                    {type.label}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
            
            <TextField
              margin="normal"
              fullWidth
              id="description"
              label="وصف الوثيقة"
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              dir="rtl"
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseUpload}>إلغاء</Button>
          <Button 
            onClick={handleUpload} 
            variant="contained" 
            color="primary"
            disabled={!file || !documentType || uploadLoading}
          >
            {uploadLoading ? 'جاري الرفع...' : 'رفع الوثيقة'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* نافذة تأكيد الحذف */}
      <Dialog open={deleteOpen} onClose={handleCloseDelete}>
        <DialogTitle>تأكيد حذف الوثيقة</DialogTitle>
        <DialogContent>
          <Typography>
            هل أنت متأكد من رغبتك في حذف هذه الوثيقة؟
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete}>تراجع</Button>
          <Button onClick={handleDeleteDocument} color="error" variant="contained">
            تأكيد الحذف
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentsList;