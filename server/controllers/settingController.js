// server/controllers/settingController.js
const Setting = require('../models/Setting');

// جلب جميع الإعدادات
const getAllSettings = async (req, res) => {
  try {
    const settings = await Setting.find({});
    
    // تحويل المصفوفة إلى كائن مع مفتاح حسب نوع الإعداد
    const formattedSettings = settings.reduce((acc, setting) => {
      acc[setting.type] = setting.data;
      return acc;
    }, {});
    
    res.json(formattedSettings);
  } catch (error) {
    console.error('خطأ في جلب الإعدادات:', error);
    res.status(500).json({ message: 'فشل في جلب الإعدادات', error: error.message });
  }
};

// جلب إعدادات محددة حسب النوع
const getSettingByType = async (req, res) => {
  try {
    const { type } = req.params;
    
    const setting = await Setting.findOne({ type });
    
    if (!setting) {
      return res.status(404).json({ message: `لا توجد إعدادات من نوع ${type}` });
    }
    
    res.json(setting.data);
  } catch (error) {
    console.error(`خطأ في جلب إعدادات ${req.params.type}:`, error);
    res.status(500).json({ message: 'فشل في جلب الإعدادات', error: error.message });
  }
};

// إنشاء أو تحديث الإعدادات
const updateSetting = async (req, res) => {
  try {
    const { type } = req.params;
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ message: 'البيانات مطلوبة للتحديث' });
    }
    
    // البحث عن الإعداد وتحديثه إذا كان موجوداً، أو إنشاء إعداد جديد
    const setting = await Setting.findOneAndUpdate(
      { type },
      { type, data },
      { new: true, upsert: true } // إرجاع القيمة المحدثة وإنشاء إذا لم تكن موجودة
    );
    
    res.json(setting);
  } catch (error) {
    console.error(`خطأ في تحديث إعدادات ${req.params.type}:`, error);
    res.status(500).json({ message: 'فشل في تحديث الإعدادات', error: error.message });
  }
};

module.exports = {
  getAllSettings,
  getSettingByType,
  updateSetting
};