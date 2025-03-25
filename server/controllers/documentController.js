// server/controllers/documentController.js
const Document = require('../models/Document');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// رفع وثيقة جديدة
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'يرجى تحميل ملف' });
    }
    
    const { type, description, appointment } = req.body;
    
    // التحقق من نوع الوثيقة
    const validTypes = ['report', 'image', 'prescription', 'other'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        message: 'نوع الوثيقة غير صالح', 
        validTypes 
      });
    }
    
    const document = await Document.create({
      patient: req.user._id,
      appointment: appointment || null,
      name: req.file.originalname,
      type,
      filePath: req.file.path,
      description,
      uploadDate: new Date()
    });
    
    // إذا كان المستند مرتبطًا بموعد، قم بتحديث تاريخ الموعد
    if (appointment) {
      document.appointmentDate = document.uploadDate;
      await document.save();
    }
    
    res.status(201).json(document);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

// الحصول على وثائق المستخدم
const getUserDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ patient: req.user._id })
      .sort({ uploadDate: -1 });
    
    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

// الحصول على جميع الوثائق (للمدير فقط)
const getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.find({})
      .populate('patient', 'name email phone')
      // إزالة populate للحقل appointment لتجنب الخطأ
      .sort({ uploadDate: -1 });
    
    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

// الحصول على وثيقة محددة
const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'الوثيقة غير موجودة' });
    }
    
    // التحقق من أن الوثيقة للمستخدم الحالي أو أن المستخدم مدير
    if (document.patient.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'غير مصرح لك بعرض هذه الوثيقة' });
    }
    
    res.json(document);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

// تحديث معلومات الوثيقة
const updateDocument = async (req, res) => {
  try {
    const { type, description } = req.body;
    
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'الوثيقة غير موجودة' });
    }
    
    // التحقق من أن الوثيقة للمستخدم الحالي أو أن المستخدم مدير
    if (document.patient.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'غير مصرح لك بتعديل هذه الوثيقة' });
    }
    
    // تحديث معلومات الوثيقة
    document.type = type || document.type;
    document.description = description !== undefined ? description : document.description;
    
    const updatedDocument = await document.save();
    
    res.json(updatedDocument);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

// حذف وثيقة
const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'الوثيقة غير موجودة' });
    }
    
    // التحقق من ملكية الوثيقة أو إذا كان المستخدم مديرًا
    if (document.patient.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'غير مصرح بحذف هذه الوثيقة' });
    }
    
    // حذف الملف من نظام الملفات
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }
    
    // حذف السجل من قاعدة البيانات
    await Document.findByIdAndDelete(document._id);
    
    res.json({ message: 'تم حذف الوثيقة بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

// الحصول على وثائق مريض محدد (للمدير فقط)
const getPatientDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ patient: req.params.id })
      .sort({ uploadDate: -1 });
    
    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

module.exports = {
  uploadDocument,
  getUserDocuments,
  getAllDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  getPatientDocuments
};