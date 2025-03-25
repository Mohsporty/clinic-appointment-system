// server/routes/admin.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect, admin } = require('../middleware/authMiddleware');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Document = require('../models/Document');

// @desc    جلب بيانات لوحة تحكم المدير
// @route   GET /api/admin/dashboard
// @access  Private/Admin
router.get('/dashboard', protect, admin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // جلب إحصائيات المواعيد
    const totalAppointments = await Appointment.countDocuments({});
    const todayAppointments = await Appointment.countDocuments({
      date: { $gte: today, $lt: tomorrow }
    });
    const upcomingAppointments = await Appointment.countDocuments({
      date: { $gte: today },
      status: 'scheduled'
    });
    const completedAppointments = await Appointment.countDocuments({
      status: 'completed'
    });
    const cancelledAppointments = await Appointment.countDocuments({
      status: 'cancelled'
    });
    const pendingPayments = await Appointment.countDocuments({
      paymentStatus: 'pending',
      status: { $ne: 'cancelled' }
    });
    
    // جلب إحصائيات المستخدمين
    const totalUsers = await User.countDocuments({ role: 'user' });
    const newPatients = await User.countDocuments({ 
      role: 'user',
      isNewPatient: true
    });
    
    // جلب إحصائيات الوثائق
    const totalDocuments = await Document.countDocuments({});
    
    res.json({
      stats: {
        appointments: {
          total: totalAppointments,
          today: todayAppointments,
          upcoming: upcomingAppointments,
          completed: completedAppointments,
          cancelled: cancelledAppointments,
          pendingPayments
        },
        users: {
          total: totalUsers,
          newPatients
        },
        documents: {
          total: totalDocuments
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'فشل في جلب بيانات لوحة التحكم' });
  }
});

// @desc    جلب جميع المواعيد
// @route   GET /api/admin/appointments
// @access  Private/Admin
router.get('/appointments', protect, admin, async (req, res) => {
  try {
    const appointments = await Appointment.find({})
      .populate({
        path: 'patient',
        select: 'name email phone isNewPatient'
      })
      .sort({ date: 1, time: 1 });
    
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'فشل في جلب المواعيد' });
  }
});

// @desc    جلب جميع المستخدمين
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'فشل في جلب المستخدمين' });
  }
});

// @desc    جلب جميع الوثائق
// @route   GET /api/admin/documents
// @access  Private/Admin
router.get('/documents', protect, admin, async (req, res) => {
  try {
    const documents = await Document.find({})
      .populate({
        path: 'patient',
        select: 'name email phone'
      })
      .sort({ uploadDate: -1 });
    
    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'فشل في جلب الوثائق' });
  }
});

// @desc    تحديث حالة الموعد
// @route   PUT /api/admin/appointments/:id
// @access  Private/Admin
router.put('/appointments/:id', protect, admin, async (req, res) => {
  try {
    const { 
      status, 
      paymentStatus, 
      notes, 
      medicalReport, 
      prescription 
    } = req.body;
    
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'الموعد غير موجود' });
    }
    
    appointment.status = status || appointment.status;
    appointment.paymentStatus = paymentStatus || appointment.paymentStatus;
    appointment.notes = notes !== undefined ? notes : appointment.notes;
    appointment.medicalReport = medicalReport !== undefined ? medicalReport : appointment.medicalReport;
    appointment.prescription = prescription !== undefined ? prescription : appointment.prescription;
    
    const updatedAppointment = await appointment.save();
    
    res.json(updatedAppointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'فشل في تحديث الموعد' });
  }
});

// @desc    إنشاء مستخدم جديد
// @route   POST /api/admin/users
// @access  Private/Admin
router.post('/users', protect, admin, async (req, res) => {
  try {
    const { name, email, phone, password, isNewPatient } = req.body;
    
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return res.status(400).json({ message: 'المستخدم موجود بالفعل' });
    }
    
    const user = await User.create({
      name,
      email,
      phone,
      password,
      isNewPatient: isNewPatient || true,
      role: 'user'
    });
    
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isNewPatient: user.isNewPatient,
        role: user.role
      });
    } else {
      res.status(400).json({ message: 'بيانات المستخدم غير صالحة' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'فشل في إنشاء المستخدم' });
  }
});

// @desc    جلب مواعيد مريض محدد
// @route   GET /api/admin/patients/:id/appointments
// @access  Private/Admin
router.get('/patients/:id/appointments', protect, admin, async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.params.id })
      .sort({ date: -1, time: 1 });
    
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'فشل في جلب مواعيد المريض' });
  }
});

// @desc    جلب وثائق مريض محدد
// @route   GET /api/admin/patients/:id/documents
// @access  Private/Admin
router.get('/patients/:id/documents', protect, admin, async (req, res) => {
  try {
    const documents = await Document.find({ patient: req.params.id })
      .sort({ uploadDate: -1 });
    
    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'فشل في جلب وثائق المريض' });
  }
});

// @desc    جلب الأوقات المحجوزة في تاريخ محدد
// @route   GET /api/admin/booked-times/:date
// @access  Private/Admin
router.get('/booked-times/:date', protect, admin, async (req, res) => {
  try {
    const { date } = req.params;
    
    // إنشاء كائن تاريخ من التاريخ المرسل
    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ message: 'تاريخ غير صالح' });
    }
    
    // ضبط الساعة والدقائق والثواني إلى الصفر للحصول على بداية اليوم
    appointmentDate.setHours(0, 0, 0, 0);
    
    // إنشاء تاريخ نهاية اليوم
    const endDate = new Date(appointmentDate);
    endDate.setHours(23, 59, 59, 999);
    
    // البحث عن المواعيد في هذا التاريخ
    const bookedAppointments = await Appointment.find({
      date: { $gte: appointmentDate, $lte: endDate },
      status: { $ne: 'cancelled' }
    }).select('time');
    
    // استخراج الأوقات المحجوزة
    const bookedTimes = bookedAppointments.map(appointment => appointment.time);
    
    res.json(bookedTimes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'فشل في جلب الأوقات المحجوزة' });
  }
});

module.exports = router;