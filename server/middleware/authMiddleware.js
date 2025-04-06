// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken } = require('../utils/jwtUtils');

// وسيط للتحقق من توكن المستخدم
const protect = async (req, res, next) => {
  let token;

  console.log('التحقق من توكن المستخدم...');
  console.log('Headers:', req.headers.authorization);

  // التحقق من وجود توكن في الهيدرز
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // استخراج التوكن من الهيدر
      token = req.headers.authorization.split(' ')[1];
      console.log('التوكن المستخرج:', token);

      // فك تشفير التوكن واستخراج معرف المستخدم
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key_replace_in_production');
      console.log('تم فك تشفير التوكن:', decoded);

      // التحقق من وقت انتهاء الصلاحية
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        console.log('التوكن منتهي الصلاحية');
        return res.status(401).json({ message: 'انتهت صلاحية التوكن. الرجاء تسجيل الدخول مرة أخرى.' });
      }

      // جلب بيانات المستخدم (باستثناء كلمة المرور)
      req.user = await User.findById(decoded.id).select('-password');
      console.log('تم العثور على المستخدم:', req.user ? 'نعم' : 'لا');

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
  } else {
    console.log('لا يوجد توكن في الطلب');
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
const verifyTokenMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const isValid = token && verifyToken(token);
    
    if (isValid) {
      res.status(200).json({ valid: true });
    } else {
      res.status(401).json({ valid: false, message: 'التوكن غير صالح' });
    }
  } catch (error) {
    console.error(error);
    res.status(401).json({ valid: false, message: 'التوكن غير صالح' });
  }
};

module.exports = { 
  protect, 
  admin, 
  ownerOrAdmin,
  verifyTokenMiddleware
};