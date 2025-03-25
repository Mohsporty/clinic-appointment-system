// server/controllers/userController.js
const User = require('../models/User');
const Appointment = require('../models/Appointment'); // إضافة استيراد الموعد
const jwt = require('jsonwebtoken');

// إنشاء توكن الدخول
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// تسجيل مستخدم جديد
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    // التحقق من وجود المستخدم
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return res.status(400).json({ message: 'المستخدم موجود بالفعل' });
    }
    
    // إنشاء مستخدم جديد
    const user = await User.create({
      name,
      email,
      password,
      phone,
      isNewPatient: true
    });
    
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isNewPatient: user.isNewPatient,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'بيانات المستخدم غير صالحة' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

// تسجيل الدخول
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // البحث عن المستخدم
    const user = await User.findOne({ email });
    
    if (user && (await user.matchPassword(password))) {
      // إذا كان المستخدم قد حجز موعد سابقًا، فهو لم يعد مريضًا جديدًا
      if (user.isNewPatient) {
        const hadAppointment = await Appointment.findOne({ patient: user._id });
        if (hadAppointment) {
          user.isNewPatient = false;
          await user.save();
        }
      }
      
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isNewPatient: user.isNewPatient,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'بريد إلكتروني أو كلمة مرور غير صحيحة' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

// الحصول على ملف المستخدم
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'المستخدم غير موجود' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

// تحديث ملف المستخدم
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      
      if (req.body.password) {
        user.password = req.body.password;
      }
      
      const updatedUser = await user.save();
      
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        isNewPatient: updatedUser.isNewPatient,
        token: generateToken(updatedUser._id)
      });
    } else {
      res.status(404).json({ message: 'المستخدم غير موجود' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

// الحصول على جميع المستخدمين (للمدير فقط)
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'patient' }).select('-password');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUsers
};