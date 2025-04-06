// server/routes/documentRoutes.js
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { upload, handleUploadErrors } = require('../middleware/upload');
const {
  uploadDocument,
  getUserDocuments,
  getAllDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  getPatientDocuments
} = require('../controllers/documentController');

// @desc رفع وثيقة جديدة
// @route POST /api/documents
// @access Private
router.post('/', protect, upload.single('file'), handleUploadErrors, uploadDocument);

// @desc جلب وثائق المستخدم
// @route GET /api/documents
// @access Private
router.get('/', protect, getUserDocuments);

// @desc جلب جميع الوثائق (للمدير)
// @route GET /api/documents/all
// @access Private/Admin
router.get('/all', protect, admin, getAllDocuments);

// @desc جلب وثائق مريض محدد
// @route GET /api/documents/patient/:id
// @access Private/Admin
router.get('/patient/:id', protect, admin, getPatientDocuments);

// @desc جلب وثيقة محددة
// @route GET /api/documents/:id
// @access Private
router.get('/:id', protect, getDocumentById);

// @desc تحديث معلومات الوثيقة
// @route PUT /api/documents/:id
// @access Private
router.put('/:id', protect, updateDocument);

// @desc حذف وثيقة
// @route DELETE /api/documents/:id
// @access Private
router.delete('/:id', protect, deleteDocument);

module.exports = router;