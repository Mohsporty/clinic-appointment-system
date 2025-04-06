// server/utils/jwtUtils.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * يقوم بإنشاء توكن JWT مع خيارات أمان محسنة
 * @param {string} id معرف المستخدم
 * @param {string} role دور المستخدم (user أو admin)
 * @param {string} expiresIn مدة صلاحية التوكن (الافتراضي '30d')
 * @returns {string} توكن JWT
 */
const generateToken = (id, role = 'user', expiresIn = '30d') => {
  // إنشاء رقم عشوائي لزيادة الأمان (jti - JWT ID)
  const jwtId = crypto.randomBytes(16).toString('hex');
  
  const payload = {
    id,
    role,
    jti: jwtId,
    iat: Math.floor(Date.now() / 1000), // وقت الإصدار
  };
  
  console.log('إنشاء توكن JWT للمستخدم:', id, 'بدور:', role);
  
  return jwt.sign(
    payload, 
    process.env.JWT_SECRET || 'default_secret_key_replace_in_production', 
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
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key_replace_in_production');
    
    // التحقق من انتهاء الصلاحية
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      console.log('توكن منتهي الصلاحية');
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