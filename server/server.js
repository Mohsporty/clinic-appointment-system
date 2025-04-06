// server/server.js
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const morgan = require('morgan');
const rfs = require('rotating-file-stream');
const cors = require('cors');

// تحميل متغيرات البيئة
dotenv.config();

// استيراد المسارات
const userRoutes = require('./routes/userRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const documentRoutes = require('./routes/documentRoutes');
const adminRoutes = require('./routes/admin');
const settingsRoutes = require('./routes/settingsRoutes');

// إنشاء التطبيق Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// إنشاء مجلد التحميلات إذا لم يكن موجوداً
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// طباعة متغيرات الاتصال بقاعدة البيانات (بدون المعلومات الحساسة)
console.log('MONGO_URI configured:', process.env.MONGO_URI ? 'Yes' : 'No');
console.log('JWT_SECRET configured:', process.env.JWT_SECRET ? 'Yes' : 'No');

// إعداد المسارات API
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);

// إعداد مجلد التحميل كمجلد ثابت
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

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

// التعامل مع الأخطاء
app.use((err, req, res, next) => {
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
    // استخدام متغير MONGO_URI البيئي أو القيمة الافتراضية المحلية
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/medicalAppointments';
    console.log('محاولة الاتصال بقاعدة البيانات:', mongoUri.replace(/^(mongodb:\/\/)([^:]+:[^@]+)(@.+)$/, '$1***:***$3'));
    
    const conn = await mongoose.connect(mongoUri, {
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
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 5001;

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(
      `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
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