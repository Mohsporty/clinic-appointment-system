// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: false,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      default: 'user',
      enum: ['user', 'admin'],
    },
    isNewPatient: {
      type: Boolean,
      default: true,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// طريقة لمقارنة كلمة المرور المدخلة مع كلمة المرور المشفرة في قاعدة البيانات
userSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    return isMatch;
  } catch (error) {
    console.error('خطأ في مقارنة كلمة المرور:', error);
    return false;
  }
};

// إضافة دالة comparePassword لضمان التوافقية مع الكود القديم
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await this.matchPassword(enteredPassword);
};

// تشفير كلمة المرور قبل الحفظ
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    console.error('خطأ في تشفير كلمة المرور:', error);
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;