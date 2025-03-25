// server/middleware/upload.js
const multer = require('multer');
const path = require('path');

// تكوين التخزين
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'server/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// تصفية الملفات
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  
  // التحقق من نوع الملف
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('خطأ: نوع الملف غير مدعوم. يرجى رفع صور (.jpeg, .jpg, .png, .gif) أو مستندات (.pdf, .doc, .docx) فقط!'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // الحد الأقصى للملف: 10 ميجابايت
});

module.exports = upload;