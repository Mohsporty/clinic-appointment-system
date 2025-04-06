// server/routes/settingsRoutes.js
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');

// يمكن إضافة المزيد من المعالجات هنا عندما تكون جاهزة
// const { 
//   getSettings,
//   updateSettings
// } = require('../controllers/settingsController');

// مسار مؤقت للتأكد من عمل الخادم
router.get('/', protect, admin, (req, res) => {
  res.json({ message: 'إعدادات النظام', success: true });
});

// @desc    الحصول على إعدادات النظام
// @route   GET /api/settings
// @access  Private/Admin
// router.get('/', protect, admin, getSettings);

// @desc    تحديث إعدادات النظام
// @route   PUT /api/settings
// @access  Private/Admin
// router.put('/', protect, admin, updateSettings);

module.exports = router;