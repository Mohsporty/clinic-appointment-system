// server/server.js
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const morgan = require('morgan');
const rfs = require('rotating-file-stream');

// تحميل متغيرات البيئة
dotenv.config();

// استيراد الوسائط middleware
const configureSecurityMiddleware = require('./middleware/securityMiddleware');
const { generalLimiter } = require('./middleware/authMiddleware');

// استيراد المسارات
const userRoutes = require('./routes/userRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const documentRoutes = require('./routes/documentRoutes');
const adminRoutes = require('./routes/admin');
const settingsRoutes = require('./routes/settingsRoutes');

// إنشاء التطبيق Express
const app = express();

// إعداد مجلد السجلات
const logDirectory = path.join(__dirname, 'logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

// إنشاء دفق دوار للسجلات
const accessLogStream = rfs.createStream('access.log', {
  interval: '1d', // دوران يومي
  path: logDirectory
});

// إعداد التسجيل
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // تسجيل مفصل في بيئة التطوير
} else {
  app.use(morgan('combined', { stream: accessLogStream })); // تسجيل مختصر في الإنتاج
}

// تطبيق الوسائط middleware للأمان
configureSecurityMiddleware(app);

// تفعيل تحليل JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// تطبيق مُحدد معدل عام
app.use(generalLimiter);

// إنشاء مجلد التحميلات إذا لم يكن موجوداً
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// إعداد المسارات API
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);

// إعداد مجلد التحميل كمجلد ثابت مع حماية إضافية
app.use('/uploads', (req, res, next) => {
  const filePath = req.path;
  
  // التحقق من محاولات الخروج من المجلد
  if (filePath.includes('..') || filePath.includes('%2e%2e')) {
    return res.status(403).json({ message: 'غير مسموح بهذا المسار' });
  }
  
  next();
}, express.static(path.join(__dirname, '/uploads'), {
  setHeaders: (res) => {
    // تعيين رؤوس أمان للملفات
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; script-src 'none'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// إعداد المسار الافتراضي لبيئة الإنتاج
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'))
  );
} else {
  app.get('/', (req, res) => {
    res.send('API is running...');
  });
}

// وسيط للتعامل مع المسارات غير الموجودة
app.use((req, res) => {
  res.status(404).json({ message: 'المسار غير موجود' });
});

// التعامل مع الأخطاء
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    message: process.env.NODE_ENV === 'production' 
      ? 'حدث خطأ في الخادم'
      : err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// الاتصال بقاعدة البيانات والبدء في الاستماع
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // إضافة خيارات أمان إضافية
      ssl: process.env.NODE_ENV === 'production',
      authSource: 'admin',
      retryWrites: true,
      w: 'majority'
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 5001;

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(
      `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    );
  });
  
  // التعامل مع إغلاق الخادم بشكل آمن
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    });
  });
});