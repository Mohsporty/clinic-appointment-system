// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const rateLimit = require('express-rate-limit');

// إعداد مُحدد معدل لحماية من هجمات bruteforce
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 5, // عدد المحاولات المسموح بها لكل IP
  message: { message: 'تم تجاوز الحد المسموح لمحاولات تسجيل الدخول. الرجاء المحاولة بعد 15 دقيقة.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// إعداد مُحدد معدل عام
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 دقيقة
  max: 60, // 60 طلب في الدقيقة لكل IP
  message: { message: 'تم تجاوز الحد المسموح للطلبات. الرجاء المحاولة بعد قليل.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// وسيط للتحقق من توكن المستخدم
const protect = async (req, res, next) => {
  let token;

  // التحقق من وجود توكن في الهيدرز
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // استخراج التوكن من الهيدر
      token = req.headers.authorization.split(' ')[1];

      // فك تشفير التوكن واستخراج معرف المستخدم
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // التحقق من وقت انتهاء الصلاحية
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        return res.status(401).json({ message: 'انتهت صلاحية التوكن. الرجاء تسجيل الدخول مرة أخرى.' });
      }

      // جلب بيانات المستخدم (باستثناء كلمة المرور)
      req.user = await User.findById(decoded.id).select('-password');

      // التحقق من عدم وجود المستخدم
      if (!req.user) {
        return res.status(401).json({ message: 'المستخدم غير موجود. الرجاء تسجيل الدخول مرة أخرى.' });
      }

      next();
    } catch (error) {
      console.error('خطأ في التحقق من التوكن:', error);
      
      // تحديد نوع الخطأ
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'التوكن غير صالح. الرجاء تسجيل الدخول مرة أخرى.' });
      } else if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'انتهت صلاحية التوكن. الرجاء تسجيل الدخول مرة أخرى.' });
      }
      
      res.status(401).json({ message: 'غير مصرح به، التوكن غير صالح' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'غير مصرح به، لا يوجد توكن' });
  }
};

// وسيط للتحقق من صلاحيات المدير
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'غير مصرح له، يجب أن تكون مديراً' });
  }
};

// وسيط للتأكد من أن المستخدم هو نفسه أو مدير
const ownerOrAdmin = (req, res, next) => {
  if (
    req.user && 
    (req.user._id.toString() === req.params.id || req.user.role === 'admin')
  ) {
    next();
  } else {
    res.status(403).json({ message: 'غير مصرح به، ليس لديك صلاحية للوصول' });
  }
};

// وسيط للتحقق من صحة التوكن
const verifyToken = async (req, res, next) => {
  try {
    // تم التحقق بالفعل في وسيط الحماية
    res.status(200).json({ valid: true });
  } catch (error) {
    console.error(error);
    res.status(401).json({ valid: false, message: 'التوكن غير صالح' });
  }
};

module.exports = { 
  protect, 
  admin, 
  loginLimiter, 
  generalLimiter, 
  ownerOrAdmin,
  verifyToken 
};