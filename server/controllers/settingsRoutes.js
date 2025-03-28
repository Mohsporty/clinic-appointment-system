// server/routes/settingsRoutes.js
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { 
  getAllSettings, 
  getSettingByType, 
  updateSetting 
} = require('../controllers/settingController');

// جلب جميع الإعدادات
router.get('/', protect, admin, getAllSettings);

// جلب إعدادات محددة
router.get('/:type', protect, admin, getSettingByType);

// تحديث إعدادات محددة
router.post('/:type', protect, admin, updateSetting);

module.exports = router;