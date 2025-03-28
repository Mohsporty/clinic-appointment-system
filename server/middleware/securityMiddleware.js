// server/middleware/securityMiddleware.js
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cors = require('cors');

// تكوين أمان التطبيق
const configureSecurityMiddleware = (app) => {
  // إعداد Helmet لإضافة رؤوس HTTP للأمان
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "cdnjs.cloudflare.com"],
        fontSrc: ["'self'", "fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "*.amazonaws.com", "*.cloudfront.net"],
        connectSrc: ["'self'", "localhost:*", "*.amazonaws.com", "*.cloudfront.net"],
        frameAncestors: ["'none'"]
      }
    },
    referrerPolicy: { policy: 'same-origin' }
  }));

  // تعيين حماية XSS (Cross-Site Scripting)
  app.use(xss());

  // حماية من هجمات NoSQL Injection
  app.use(mongoSanitize());

  // حماية من HTTP Parameter Pollution
  app.use(hpp({
    whitelist: [
      // قائمة المعلمات المسموح بها
      'date', 'time', 'status', 'type', 'paymentStatus'
    ]
  }));

  // تكوين CORS
  const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL || 'https://mydomain.com' // للإنتاج
      : ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    maxAge: 600  // 10 دقائق
  };

  app.use(cors(corsOptions));

  // وسيط للتحقق من نوع المحتوى
  app.use((req, res, next) => {
    // تجاهل الطلبات التي لا تحتوي على محتوى
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || !req.body || Object.keys(req.body).length === 0) {
      return next();
    }

    // التحقق من Content-Type لطلبات POST/PUT
    if (!req.is('application/json') && !req.is('multipart/form-data') && !req.is('application/x-www-form-urlencoded')) {
      return res.status(415).json({ 
        message: 'نوع المحتوى غير مدعوم. الرجاء استخدام application/json أو multipart/form-data.'
      });
    }

    next();
  });

  // إضافة middleware للتحقق من حجم الطلب
  app.use((req, res, next) => {
    const contentLength = req.headers['content-length'];
    
    // التحقق من حجم الطلب
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10 ميجابايت كحد أقصى
      return res.status(413).json({ 
        message: 'حجم الطلب كبير جدًا. الحد الأقصى هو 10 ميجابايت.'
      });
    }
    
    next();
  });

  // حماية من محاولات CSRF 
  app.use((req, res, next) => {
    // إضافة رأس CSRF-Token
    res.setHeader('X-CSRF-Token', 'token');
    
    // التحقق من Referer في طلبات تعديل البيانات
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const referer = req.headers.referer || '';
      const host = req.headers.host;
      
      // تجاهل التحقق في بيئة التطوير
      if (process.env.NODE_ENV === 'production' && host) {
        if (!referer || !referer.includes(host)) {
          return res.status(403).json({ 
            message: 'تم رفض الطلب لأسباب أمنية.'
          });
        }
      }
    }
    
    next();
  });

  // حماية من clickjacking (X-Frame-Options)
  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  });

  // منع تخمين نوع المحتوى في المتصفحات القديمة
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  // إضافة رأس Feature-Policy للتحكم في ميزات المتصفح
  app.use((req, res, next) => {
    res.setHeader('Feature-Policy', "camera 'none'; microphone 'none'; geolocation 'none'");
    next();
  });

  // إضافة رأس Permissions-Policy (بديل جديد عن Feature-Policy)
  app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  // تعيين رأس Cache-Control للتحكم في التخزين المؤقت
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  // منع تسرب معلومات الخطأ التفصيلية في الإنتاج
  app.use((err, req, res, next) => {
    console.error(err.stack);
    
    const isProd = process.env.NODE_ENV === 'production';
    const statusCode = err.statusCode || 500;
    
    res.status(statusCode).json({
      message: isProd ? 'حدث خطأ في الخادم' : err.message,
      ...(isProd ? {} : { stack: err.stack })
    });
  });
};

module.exports = configureSecurityMiddleware;