// server/utils/jwtUtils.js
const jwt = require('jsonwebtoken');

// إنشاء توكن JWT
const generateToken = (id, role = 'user') => {
  return jwt.sign(
    { id, role }, 
    process.env.JWT_SECRET || 'default_secret_key_replace_in_production', 
    {
      expiresIn: '30d',
      jwtid: require('crypto').randomBytes(16).toString('hex')
    }
  );
};

// التحقق من صحة توكن JWT
const verifyToken = (token) => {
  try {
    return jwt.verify(
      token, 
      process.env.JWT_SECRET || 'default_secret_key_replace_in_production'
    );
  } catch (error) {
    console.error('خطأ في التحقق من التوكن:', error.message);
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken
};