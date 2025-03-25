// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

      // جلب بيانات المستخدم (باستثناء كلمة المرور)
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
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

module.exports = { protect, admin };