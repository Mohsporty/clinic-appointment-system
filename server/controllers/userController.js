// server/controllers/userController.js
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

/**
 * إنشاء توكن الدخول
 * @param {string} id - معرف المستخدم
 * @param {string} role - دور المستخدم
 * @returns {string} توكن JWT 
 */
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '30d',
      // تضمين منشئ التوكن لزيادة الأمان
      issuer: 'medical-appointments-system',
      // تحديد الخوارزمية
      algorithm: 'HS256'
    }
  );
};

/**
 * تسجيل مستخدم جديد
 * @route POST /api/users/register
 * @access Public
 */
const registerUser = async (req, res) => {
  try {
    // التحقق من صحة المدخلات
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'بيانات غير صالحة', 
        errors: errors.array() 
      });
    }

    const { name, email, password, phone } = req.body;
    
    // التحقق من صحة المدخلات يدويًا
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'جميع الحقول المطلوبة غير مكتملة',
        required: {
          name: !name,
          email: !email,
          password: !password
        }
      });
    }
    
    // التحقق من تنسيق البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'تنسيق البريد الإلكتروني غير صحيح' });
    }
    
    // التحقق من وجود المستخدم
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
    }
    
    // التحقق من قوة كلمة المرور
    if (password.length < 6) {
      return res.status(400).json({ message: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل' });
    }
    
    // إنشاء مستخدم جديد
    const user = await User.create({
      name,
      email,
      password, // سيتم تشفير كلمة المرور في نموذج المستخدم
      phone: phone || '',
      isNewPatient: true,
      role: 'user' // تعيين الدور الافتراضي
    });
    
    if (user) {
      // إنشاء توكن مع معلومات أقل وعمر محدد
      const token = generateToken(user._id, user.role);
      
      // تسجيل عملية إنشاء الحساب
      console.log(`تم إنشاء حساب جديد: ${user.email} (${user._id})`);
      
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isNewPatient: user.isNewPatient,
        token
      });
    } else {
      res.status(400).json({ message: 'بيانات المستخدم غير صالحة' });
    }
  } catch (error) {
    console.error('خطأ في تسجيل المستخدم:', error);
    res.status(500).json({ 
      message: 'خطأ في الخادم', 
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

/**
 * تسجيل الدخول
 * @route POST /api/users/login
 * @access Public
 */
const loginUser = async (req, res) => {
  try {
    // التحقق من صحة المدخلات
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'بيانات غير صالحة', 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;
    
    // التحقق من صحة المدخلات يدويًا
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور',
        required: {
          email: !email,
          password: !password
        }
      });
    }
    
    // البحث عن المستخدم باستخدام البريد الإلكتروني فقط
    const user = await User.findOne({ email });
    
    // التحقق من وجود المستخدم وصحة كلمة المرور
    if (!user) {
      // رسالة عامة للحماية من هجمات حصاد المعلومات
      return res.status(401).json({ message: 'بريد إلكتروني أو كلمة مرور غير صحيحة' });
    }
    
    // مقارنة كلمة المرور
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      // تأخير الرد لمنع هجمات الحصول على كلمة المرور بالقوة
      setTimeout(() => {
        return res.status(401).json({ message: 'بريد إلكتروني أو كلمة مرور غير صحيحة' });
      }, 300);
      return;
    }
    
    // إذا كان المستخدم قد حجز موعد سابقًا، فهو لم يعد مريضًا جديدًا
    if (user.isNewPatient) {
      const hadAppointment = await Appointment.findOne({ patient: user._id });
      if (hadAppointment) {
        user.isNewPatient = false;
        await user.save();
      }
    }
    
    // تسجيل عملية تسجيل الدخول
    console.log(`تم تسجيل دخول: ${user.email} (${user._id})`);
    
    // إنشاء توكن وإرساله مع بيانات المستخدم
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isNewPatient: user.isNewPatient,
      token: generateToken(user._id, user.role)
    });
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    res.status(500).json({ 
      message: 'خطأ في الخادم', 
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

/**
 * الحصول على ملف المستخدم
 * @route GET /api/users/profile
 * @access Private
 */
const getUserProfile = async (req, res) => {
  try {
    // التحقق من وجود req.user (يتم إضافته من middleware)
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'غير مصرح', error: 'غير مصرح به' });
    }
    
    const user = await User.findById(req.user._id).select('-password -__v -createdAt -updatedAt');
    
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('خطأ في جلب ملف المستخدم:', error);
    res.status(500).json({ 
      message: 'خطأ في الخادم', 
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

/**
 * تحديث ملف المستخدم
 * @route PUT /api/users/profile
 * @access Private
 */
const updateUserProfile = async (req, res) => {
  try {
    // التحقق من وجود req.user
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'غير مصرح', error: 'غير مصرح به' });
    }
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    
    // تحديث البيانات
    user.name = req.body.name || user.name;
    
    // التحقق من تنسيق البريد الإلكتروني
    if (req.body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.email)) {
        return res.status(400).json({ message: 'تنسيق البريد الإلكتروني غير صحيح' });
      }
      
      // التحقق من عدم استخدام البريد الإلكتروني من قبل مستخدم آخر
      if (req.body.email !== user.email) {
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
          return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
        }
      }
      
      user.email = req.body.email;
    }
    
    user.phone = req.body.phone || user.phone;
    
    // تغيير كلمة المرور (اختياري)
    if (req.body.password) {
      // التحقق من قوة كلمة المرور
      if (req.body.password.length < 6) {
        return res.status(400).json({ message: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل' });
      }
      
      user.password = req.body.password;
    }
    
    const updatedUser = await user.save();
    
    // تسجيل عملية تحديث الملف الشخصي
    console.log(`تم تحديث ملف المستخدم: ${user.email} (${user._id})`);
    
    // إعادة بيانات المستخدم المحدثة
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      isNewPatient: updatedUser.isNewPatient,
      token: generateToken(updatedUser._id, updatedUser.role)
    });
  } catch (error) {
    console.error('خطأ في تحديث ملف المستخدم:', error);
    res.status(500).json({ 
      message: 'خطأ في الخادم', 
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

/**
 * الحصول على جميع المستخدمين (للمدير فقط)
 * @route GET /api/users
 * @access Private/Admin
 */
const getUsers = async (req, res) => {
  try {
    // التحقق من صلاحيات المدير
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'غير مصرح', error: 'غير مصرح به للوصول' });
    }
    
    // جلب المستخدمين مع استثناء المدراء وإخفاء كلمات المرور
    const users = await User.find({ role: 'user' })
      .select('-password -__v -createdAt -updatedAt')
      .sort({ registrationDate: -1 });
    
    res.json(users);
  } catch (error) {
    console.error('خطأ في جلب المستخدمين:', error);
    res.status(500).json({ 
      message: 'خطأ في الخادم', 
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

/**
 * إنشاء مستخدم من قبل المدير
 * @route POST /api/users/admin
 * @access Private/Admin
 */
const createUserByAdmin = async (req, res) => {
  try {
    // التحقق من صلاحيات المدير
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'غير مصرح', error: 'غير مصرح به للوصول' });
    }
    
    const { name, email, password, phone, isNewPatient } = req.body;
    
    // التحقق من صحة المدخلات
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'جميع الحقول المطلوبة غير مكتملة',
        required: {
          name: !name,
          email: !email,
          password: !password
        }
      });
    }
    
    // التحقق من تنسيق البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'تنسيق البريد الإلكتروني غير صحيح' });
    }
    
    // التحقق من وجود المستخدم
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
    }
    
    // إنشاء المستخدم
    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      isNewPatient: isNewPatient !== undefined ? isNewPatient : true,
      role: 'user'
    });
    
    if (user) {
      // تسجيل عملية إنشاء المستخدم
      console.log(`تم إنشاء مستخدم بواسطة المدير: ${user.email} (${user._id})`);
      
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isNewPatient: user.isNewPatient
      });
    } else {
      res.status(400).json({ message: 'بيانات المستخدم غير صالحة' });
    }
  } catch (error) {
    console.error('خطأ في إنشاء المستخدم:', error);
    res.status(500).json({ 
      message: 'خطأ في الخادم', 
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

/**
 * الحصول على مستخدم محدد (للمدير فقط)
 * @route GET /api/users/:id
 * @access Private/Admin
 */
const getUserById = async (req, res) => {
  try {
    // التحقق من صلاحيات المدير
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'غير مصرح', error: 'غير مصرح به للوصول' });
    }
    
    const user = await User.findById(req.params.id).select('-password -__v');
    
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('خطأ في جلب المستخدم:', error);
    
    // التحقق من صحة المعرف
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'معرف غير صالح' });
    }
    
    res.status(500).json({ 
      message: 'خطأ في الخادم', 
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

/**
 * تحديث مستخدم محدد (للمدير فقط)
 * @route PUT /api/users/:id
 * @access Private/Admin
 */
const updateUserById = async (req, res) => {
  try {
    // التحقق من صلاحيات المدير
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'غير مصرح', error: 'غير مصرح به للوصول' });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    
    // منع تحديث حسابات المدراء
    if (user.role === 'admin' && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'غير مسموح بتحديث حساب مدير آخر' });
    }
    
    // تحديث البيانات
    user.name = req.body.name || user.name;
    
    // التحقق من تنسيق البريد الإلكتروني
    if (req.body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.email)) {
        return res.status(400).json({ message: 'تنسيق البريد الإلكتروني غير صحيح' });
      }
      
      // التحقق من عدم استخدام البريد الإلكتروني من قبل مستخدم آخر
      if (req.body.email !== user.email) {
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
          return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
        }
      }
      
      user.email = req.body.email;
    }
    
    user.phone = req.body.phone || user.phone;
    user.isNewPatient = req.body.isNewPatient !== undefined ? req.body.isNewPatient : user.isNewPatient;
    
    // تغيير كلمة المرور (اختياري)
    if (req.body.password) {
      // التحقق من قوة كلمة المرور
      if (req.body.password.length < 6) {
        return res.status(400).json({ message: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل' });
      }
      
      user.password = req.body.password;
    }
    
    const updatedUser = await user.save();
    
    // تسجيل عملية تحديث المستخدم
    console.log(`تم تحديث المستخدم بواسطة المدير: ${user.email} (${user._id})`);
    
    // إعادة بيانات المستخدم المحدثة
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      isNewPatient: updatedUser.isNewPatient
    });
  } catch (error) {
    console.error('خطأ في تحديث المستخدم:', error);
    
    // التحقق من صحة المعرف
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'معرف غير صالح' });
    }
    
    res.status(500).json({ 
      message: 'خطأ في الخادم', 
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

/**
 * حذف مستخدم محدد (للمدير فقط)
 * @route DELETE /api/users/:id
 * @access Private/Admin
 */
const deleteUser = async (req, res) => {
  try {
    // التحقق من صلاحيات المدير
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'غير مصرح', error: 'غير مصرح به للوصول' });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    
    // منع حذف حسابات المدراء
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'غير مسموح بحذف حساب مدير' });
    }
    
    // التحقق من وجود مواعيد مرتبطة بالمستخدم
    const appointments = await Appointment.find({ patient: user._id });
    
    if (appointments.length > 0) {
      // تحديث المواعيد لإلغائها بدلاً من حذفها
      await Appointment.updateMany(
        { patient: user._id, status: { $ne: 'cancelled' } },
        { status: 'cancelled', notes: `تم إلغاء الموعد بسبب حذف حساب المريض` }
      );
    }
    
    // تسجيل عملية حذف المستخدم
    console.log(`تم حذف المستخدم بواسطة المدير: ${user.email} (${user._id})`);
    
    // حذف المستخدم
    await user.deleteOne();
    
    res.json({ message: 'تم حذف المستخدم بنجاح' });
  } catch (error) {
    console.error('خطأ في حذف المستخدم:', error);
    
    // التحقق من صحة المعرف
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'معرف غير صالح' });
    }
    
    res.status(500).json({ 
      message: 'خطأ في الخادم', 
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

/**
 * تغيير كلمة المرور
 * @route POST /api/users/change-password
 * @access Private
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // التحقق من وجود كلمة المرور الحالية والجديدة
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'يرجى إدخال كلمة المرور الحالية والجديدة',
        required: {
          currentPassword: !currentPassword,
          newPassword: !newPassword
        }
      });
    }
    
    // التحقق من قوة كلمة المرور الجديدة
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل' });
    }
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    
    // التحقق من صحة كلمة المرور الحالية
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      // تأخير الرد لمنع هجمات الحصول على كلمة المرور بالقوة
      return setTimeout(() => {
        res.status(401).json({ message: 'كلمة المرور الحالية غير صحيحة' });
      }, 300);
    }
    
    // تعيين كلمة المرور الجديدة
    user.password = newPassword;
    await user.save();
    
    // تسجيل عملية تغيير كلمة المرور
    console.log(`تم تغيير كلمة المرور للمستخدم: ${user.email} (${user._id})`);
    
    res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error) {
    console.error('خطأ في تغيير كلمة المرور:', error);
    res.status(500).json({ 
      message: 'خطأ في الخادم', 
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  createUserByAdmin,
  getUserById,
  updateUserById,
  deleteUser,
  changePassword
};