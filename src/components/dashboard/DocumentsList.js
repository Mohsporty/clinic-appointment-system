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
  const [success, setSuccess] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  // Form state
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
  
  // Improved fetchDocuments with useCallback
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user || !user.token) {
        setError('User authentication required');
        setLoading(false);
        return;
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      const { data } = await axios.get('/api/documents', config);
      
      // Sort documents by upload date (newest first)
      const sortedDocuments = data.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
      
      setDocuments(sortedDocuments);
      setError('');
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Failed to load documents'
      );
    } finally {
      setLoading(false);
    }
  }, [user]); // Add user as dependency
  
  useEffect(() => {
    if (user && user.token) {
      fetchDocuments();
    }
  }, [fetchDocuments, user]); // Add fetchDocuments as dependency
  
  const handleOpenUpload = () => {
    setFile(null);
    setDocumentType('');
    setDescription('');
    setUploadOpen(true);
    setError('');
    setSuccess('');
  };
  
  const handleCloseUpload = () => {
    setUploadOpen(false);
  };
  
  const handleOpenDelete = (document) => {
    setSelectedDocument(document);
    setDeleteOpen(true);
    setError('');
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
      setError('Please select a file and document type');
      return;
    }
    
    try {
      setUploadLoading(true);
      setError('');
      
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
      
      // Reload documents
      fetchDocuments();
      setSuccess('Document uploaded successfully');
      handleCloseUpload();
    } catch (error) {
      console.error('Error uploading document:', error);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Failed to upload document'
      );
    } finally {
      setUploadLoading(false);
    }
  };
  
  const handleDeleteDocument = async () => {
    try {
      setLoading(true);
      setError('');
      
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      await axios.delete(`/api/documents/${selectedDocument._id}`, config);
      
      // Reload documents
      fetchDocuments();
      setSuccess('Document deleted successfully');
      handleCloseDelete();
    } catch (error) {
      console.error('Error deleting document:', error);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Failed to delete document'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Get icon based on document type
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
  
  // Get document type name in Arabic
  const getDocumentTypeName = (type) => {
    const docType = documentTypes.find(d => d.value === type);
    return docType ? docType.label : 'وثيقة';
  };
  
  // Fixed document URL generation
  const getDocumentUrl = (document) => {
    if (!document || !document.filePath) return '#';
    
    // Extract just the filename from the path
    const pathParts = document.filePath.split('/');
    const filename = pathParts[pathParts.length - 1];
    
    return `/uploads/${filename}`;
  };
  
  if (loading && documents.length === 0) {
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
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
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
                    href={getDocumentUrl(document)}
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
      
      {/* Upload new document dialog */}
      <Dialog open={uploadOpen} onClose={handleCloseUpload} maxWidth="sm" fullWidth>
        <DialogTitle>
          رفع وثيقة جديدة
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 1 }}>
              {error}
            </Alert>
          )}
          
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
      
      {/* Confirm delete dialog */}
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