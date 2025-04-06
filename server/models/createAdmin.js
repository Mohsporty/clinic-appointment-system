// createAdmin.js
// سكريبت لإنشاء مستخدم مدير في قاعدة البيانات

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// استيراد نموذج المستخدم - تصحيح المسار
const User = require('./User');

// اتصال بقاعدة البيانات
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/medicalAppointments', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // التحقق مما إذا كان هناك مستخدم مدير موجود
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log('مستخدم مدير موجود بالفعل:', adminExists.email);
      console.log('معلومات المدير:', {
        name: adminExists.name,
        email: adminExists.email,
        id: adminExists._id
      });
      mongoose.disconnect();
      return;
    }
    
    // إنشاء كلمة مرور مشفرة
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // بيانات المستخدم المدير
    const adminData = {
      name: 'مدير النظام',
      email: 'admin@example.com',
      password: hashedPassword,
      phone: '0500000000',
      role: 'admin',
      isNewPatient: false,
      registrationDate: new Date()
    };
    
    // إنشاء مستخدم مدير جديد
    const adminUser = await User.create(adminData);
    
    console.log('تم إنشاء مستخدم مدير بنجاح:');
    console.log({
      name: adminUser.name,
      email: adminUser.email,
      id: adminUser._id,
      role: adminUser.role
    });
    console.log('استخدم هذه البيانات لتسجيل الدخول:');
    console.log('البريد الإلكتروني: admin@example.com');
    console.log('كلمة المرور: admin123');
  } catch (error) {
    console.error('خطأ في إنشاء مستخدم مدير:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}).catch(err => {
  console.error('خطأ في الاتصال بقاعدة البيانات:', err);
});