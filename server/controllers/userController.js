// server/controllers/userController.js
const User = require('../models/User');
const { generateToken } = require('../utils/jwtUtils');
const bcrypt = require('bcryptjs');

/**
 * تسجيل مستخدم جديد
 * @route POST /api/users/register
 * @access Public
 */
const registerUser = async (req, res) => {
  try {
    console.log('بدء عملية التسجيل', req.body);

    const { name, email, password, phone } = req.body;
    
    // التحقق من صحة المدخلات يدويًا
    if (!name || !email || !password) {
      console.log('بيانات غير مكتملة:', { name: !name, email: !email, password: !password });
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
      console.log('تنسيق البريد الإلكتروني غير صحيح:', email);
      return res.status(400).json({ message: 'تنسيق البريد الإلكتروني غير صحيح' });
    }
    
    // التحقق من وجود المستخدم
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      console.log('المستخدم موجود بالفعل:', email);
      return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
    }
    
    // التحقق من قوة كلمة المرور
    if (password.length < 6) {
      console.log('كلمة المرور قصيرة جدًا');
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
      // إنشاء توكن JWT
      const token = generateToken(user._id, user.role);
      
      console.log('تم إنشاء حساب جديد:', user.email, user._id);
      
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
      console.log('بيانات المستخدم غير صالحة');
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
    console.log('بدء عملية تسجيل الدخول', req.body);

    const { email, password } = req.body;
    
    // التحقق من صحة المدخلات يدويًا
    if (!email || !password) {
      console.log('بيانات غير مكتملة:', { email: !email, password: !password });
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
    console.log('تم العثور على المستخدم:', user ? 'نعم' : 'لا');
    
    // التحقق من وجود المستخدم وصحة كلمة المرور
    if (!user) {
      // رسالة عامة للحماية من هجمات حصاد المعلومات
      console.log('المستخدم غير موجود:', email);
      return res.status(401).json({ message: 'بريد إلكتروني أو كلمة مرور غير صحيحة' });
    }
    
    // مقارنة كلمة المرور
    const isMatch = await user.matchPassword(password);
    console.log('كلمة المرور متطابقة:', isMatch);
    
    if (!isMatch) {
      console.log('كلمة المرور غير صحيحة للمستخدم:', email);
      return res.status(401).json({ message: 'بريد إلكتروني أو كلمة مرور غير صحيحة' });
    }
    
    // إنشاء توكن مع معلومات المستخدم
    const token = generateToken(user._id, user.role);
    
    console.log('تم تسجيل دخول:', user.email, user._id);
    
    // إرسال بيانات المستخدم والتوكن
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isNewPatient: user.isNewPatient,
      token
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
    console.log('جلب ملف المستخدم:', req.user?._id);
    
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
    console.log('تحديث ملف المستخدم:', req.user?._id, req.body);
    
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
    console.log('تم تحديث ملف المستخدم:', user.email, user._id);
    
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
    console.log('جلب جميع المستخدمين بواسطة المدير:', req.user?._id);
    
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

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUsers
};