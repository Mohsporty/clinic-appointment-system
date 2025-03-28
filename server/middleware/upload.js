// server/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// قائمة أنواع الملفات المسموح بها
const allowedTypes = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
};

// تكوين التخزين
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // إنشاء مجلد بتاريخ اليوم للتنظيم
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const uploadDir = path.join('server/uploads', `${year}-${month}`);
    
    // إنشاء المجلد إذا لم يكن موجودًا
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // إنشاء مجلد خاص بالمستخدم
    const userDir = path.join(uploadDir, `user-${req.user._id}`);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // إنشاء اسم فريد للملف باستخدام تشفير
    const randomString = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const fileExt = path.extname(file.originalname);
    const safeName = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, '_') // استبدال الأحرف غير الآمنة
      .substring(0, 50); // تقليص الطول
    
    cb(null, `${timestamp}-${randomString}-${safeName}`);
  }
});

// تصفية الملفات والتحقق من نوعها وحجمها
const fileFilter = (req, file, cb) => {
  const fileType = allowedTypes[file.mimetype];
  
  if (!fileType) {
    return cb(
      new Error(
        'نوع الملف غير مدعوم. الأنواع المسموح بها: JPEG, JPG, PNG, GIF, PDF, DOC, DOCX'
      ),
      false
    );
  }
  
  // التحقق من امتداد الملف
  const ext = path.extname(file.originalname).toLowerCase();
  const validExt = `.${fileType}`;
  
  if (ext !== validExt && (ext !== '.jpeg' && fileType !== 'jpg')) {
    return cb(
      new Error(
        `امتداد الملف (${ext}) لا يتطابق مع نوع الملف (${validExt})`
      ),
      false
    );
  }
  
  cb(null, true);
};

// إنشاء middleware للتحميل
const upload = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10 ميجابايت كحد أقصى
    files: 1 // ملف واحد في كل مرة
  }
});

// ميدلوير للتعامل مع أخطاء التحميل
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'حجم الملف كبير جدًا. الحد الأقصى هو 10 ميجابايت'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        message: 'عدد الملفات أكثر من المسموح به'
      });
    }
    return res.status(400).json({ message: `خطأ في تحميل الملف: ${err.message}` });
  }
  
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  
  next();
};

// دالة للتحقق من وجود الملف وحذفه عند الحاجة
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('خطأ في حذف الملف:', error);
    return false;
  }
};

// دالة للتحقق من أن المستخدم هو مالك الملف
const checkFileOwnership = (userId, filePath) => {
  // التحقق من أن المسار يحتوي على مجلد المستخدم
  return filePath.includes(`user-${userId}`);
};

module.exports = { 
  upload, 
  handleUploadErrors, 
  deleteFile, 
  checkFileOwnership,
  allowedTypes
};