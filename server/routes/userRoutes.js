// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUsers
} = require('../controllers/userController');

// @desc    تسجيل مستخدم جديد
// @route   POST /api/users/register
// @access  Public
router.post('/register', registerUser);

// @desc    تسجيل دخول المستخدم
// @route   POST /api/users/login
// @access  Public
router.post('/login', loginUser);

// @desc    الحصول على ملف المستخدم
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, getUserProfile);

// @desc    تحديث ملف المستخدم
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, updateUserProfile);

// @desc    الحصول على جميع المستخدمين
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, admin, getUsers);

module.exports = router;