// server/utils/jwtUtils.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * يقوم بإنشاء توكن JWT مع خيارات أمان محسنة
 * @param {string} id معرف المستخدم
 * @param {object} additionalData بيانات إضافية (اختياري)
 * @param {string} expiresIn مدة صلاحية التوكن (الافتراضي '30d')
 * @returns {string} توكن JWT
 */
const generateToken = (id, additionalData = {}, expiresIn = '30d') => {
  // إنشاء رقم عشوائي لزيادة الأمان (jti - JWT ID)
  const jwtId = crypto.randomBytes(16).toString('hex');
  
  const payload = {
    id,
    jti: jwtId,
    iat: Math.floor(Date.now() / 1000), // وقت الإصدار
    ...additionalData
  };
  
  return jwt.sign(
    payload, 
    process.env.JWT_SECRET, 
    {
      expiresIn,
      algorithm: 'HS256' // استخدام خوارزمية آمنة
    }
  );
};

/**
 * يتحقق من صحة توكن JWT
 * @param {string} token توكن JWT للتحقق
 * @returns {object|null} البيانات المستخرجة من التوكن أو null في حالة الخطأ
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // التحقق من انتهاء الصلاحية
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('خطأ في التحقق من التوكن:', error.message);
    return null;
  }
};

/**
 * استخراج المعلومات من التوكن دون التحقق من التوقيع
 * ملاحظة: لا تستخدم هذه الدالة للتحقق من صحة التوكن
 * @param {string} token توكن JWT
 * @returns {object|null} البيانات المستخرجة أو null في حالة الخطأ
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('خطأ في فك تشفير التوكن:', error.message);
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken
};