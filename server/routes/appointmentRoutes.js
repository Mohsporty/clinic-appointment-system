// server/routes/appointmentRoutes.js
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createAppointment,
  getUserAppointments,
  getAllAppointments,
  getBookedTimes,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  getPatientAppointments
} = require('../controllers/appointmentController');

// @desc    إنشاء موعد جديد
// @route   POST /api/appointments
// @access  Private
router.post('/', protect, createAppointment);

// @desc    جلب مواعيد المستخدم
// @route   GET /api/appointments
// @access  Private
router.get('/', protect, getUserAppointments);

// @desc    جلب جميع المواعيد (للمدير)
// @route   GET /api/appointments/all
// @access  Private/Admin
router.get('/all', protect, admin, getAllAppointments);

// @desc    جلب الأوقات المحجوزة في تاريخ معين
// @route   GET /api/appointments/booked/:date
// @access  Private
router.get('/booked/:date', protect, getBookedTimes);

// @desc    جلب مواعيد مريض محدد
// @route   GET /api/appointments/patient/:id
// @access  Private/Admin
router.get('/patient/:id', protect, admin, getPatientAppointments);

// @desc    جلب موعد محدد
// @route   GET /api/appointments/:id
// @access  Private
router.get('/:id', protect, getAppointmentById);

// @desc    تحديث موعد
// @route   PUT /api/appointments/:id
// @access  Private
router.put('/:id', protect, updateAppointment);

// @desc    إلغاء موعد
// @route   PUT /api/appointments/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, cancelAppointment);

module.exports = router;