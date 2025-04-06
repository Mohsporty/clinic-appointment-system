// server/controllers/appointmentController.js
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { sendSMS } = require('../config/twilio');

// إنشاء موعد جديد
const createAppointment = async (req, res) => {
  try {
    console.log('بيانات الموعد المرسلة:', req.body);

    let { 
      date, 
      time, 
      reason, 
      notes, 
      type, 
      paymentMethod, 
      paymentStatus 
    } = req.body;
    
    // تعيين قيم افتراضية للحقول المفقودة
    if (!type) type = 'new';
    if (!paymentMethod) paymentMethod = 'cash';
    if (!paymentStatus) {
      paymentStatus = paymentMethod === 'cash' ? 'pending' : 'paid';
    }

    // التحقق من الحقول الإلزامية الأساسية
    if (!date || !time || !reason) {
      return res.status(400).json({ 
        message: 'حقول مطلوبة مفقودة', 
        missingFields: {
          date: !date,
          time: !time,
          reason: !reason
        }
      });
    }

    // التحقق من عدم وجود موعد آخر في نفس الوقت
    const existingAppointment = await Appointment.findOne({
      date: new Date(date),
      time,
      status: { $ne: 'cancelled' }
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'هذا الموعد محجوز بالفعل' });
    }

    // إنشاء موعد جديد
    const appointment = new Appointment({
      patient: req.user._id,
      date: new Date(date),
      time,
      reason,
      notes: notes || '',
      type, // استخدام القيمة الافتراضية إذا لزم الأمر
      paymentMethod, // استخدام القيمة الافتراضية إذا لزم الأمر
      paymentStatus,
      status: 'scheduled'
    });

    console.log('بيانات الموعد قبل الحفظ:', appointment);

    const createdAppointment = await appointment.save();
    
    // تحديث حالة المريض إلى "ليس جديدًا"
    if (req.user.isNewPatient) {
      await User.findByIdAndUpdate(req.user._id, { isNewPatient: false });
    }
    
    // إرسال رسالة تأكيد
    try {
      await sendSMS(
        req.user.phone,
        `مرحبًا ${req.user.name}، تم تأكيد موعدك في ${time} يوم ${new Date(date).toLocaleDateString('ar-SA')}. شكرًا لك!`
      );
    } catch (smsError) {
      console.error('فشل في إرسال رسالة التأكيد:', smsError);
      // نستمر بالرغم من فشل إرسال الرسالة
    }

    res.status(201).json(createdAppointment);
  } catch (error) {
    console.error('خطأ في إنشاء الموعد:', error);
    
    // التعامل مع أخطاء التحقق من Mongoose
    if (error.name === 'ValidationError') {
      const errors = {};
      for (const field in error.errors) {
        errors[field] = error.errors[field].message;
      }
      return res.status(400).json({ 
        message: 'خطأ في التحقق من البيانات', 
        errors 
      });
    }
    
    res.status(500).json({ 
      message: 'فشل في إنشاء الموعد',
      error: error.message
    });
  }
};

// الحصول على مواعيد المستخدم
const getUserAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .sort({ date: 1, time: 1 });
    
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

// الحصول على جميع المواعيد (للمدير فقط)
const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({})
      .populate('patient', 'name email phone isNewPatient')
      .sort({ date: 1, time: 1 });
    
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

// الحصول على الأوقات المحجوزة في تاريخ معين
const getBookedTimes = async (req, res) => {
  try {
    const { date } = req.params;
    
    // إنشاء كائن تاريخ من التاريخ المرسل
    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ message: 'تاريخ غير صالح' });
    }
    
    // ضبط الساعة والدقائق والثواني إلى الصفر للحصول على بداية اليوم
    appointmentDate.setHours(0, 0, 0, 0);
    
    // إنشاء تاريخ نهاية اليوم
    const endDate = new Date(appointmentDate);
    endDate.setHours(23, 59, 59, 999);
    
    // البحث عن المواعيد في هذا التاريخ
    const bookedAppointments = await Appointment.find({
      date: { $gte: appointmentDate, $lte: endDate },
      status: { $ne: 'cancelled' }
    }).select('time');
    
    // استخراج الأوقات المحجوزة
    const bookedTimes = bookedAppointments.map(appointment => appointment.time);
    
    res.json(bookedTimes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'فشل في جلب الأوقات المحجوزة' });
  }
};

// الحصول على موعد محدد
const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'الموعد غير موجود' });
    }
    
    // التحقق من أن الموعد للمستخدم الحالي أو أن المستخدم مدير
    if (appointment.patient.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'غير مصرح لك بعرض هذا الموعد' });
    }
    
    res.json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'فشل في جلب الموعد' });
  }
};

// تحديث موعد
const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'الموعد غير موجود' });
    }
    
    // التحقق من أن الموعد للمستخدم الحالي أو أن المستخدم مدير
    if (appointment.patient.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'غير مصرح لك بتعديل هذا الموعد' });
    }
    
    // التحقق من التاريخ والوقت الجديدين
    if (req.body.date && req.body.time && req.body.status !== 'cancelled') {
      const existingAppointment = await Appointment.findOne({
        _id: { $ne: req.params.id },
        date: new Date(req.body.date),
        time: req.body.time,
        status: { $ne: 'cancelled' }
      });

      if (existingAppointment) {
        return res.status(400).json({ message: 'هذا الموعد محجوز بالفعل' });
      }
    }
    
    // تحديث بيانات الموعد - الاحتفاظ بالقيم القديمة إذا لم يتم توفير قيم جديدة
    const updatedAppointment = {
      date: req.body.date ? new Date(req.body.date) : appointment.date,
      time: req.body.time || appointment.time,
      reason: req.body.reason || appointment.reason,
      notes: req.body.notes !== undefined ? req.body.notes : appointment.notes,
      status: req.body.status || appointment.status,
      type: req.body.type || appointment.type, // الاحتفاظ بالقيمة القديمة إذا لم يتم توفير قيمة جديدة
      paymentMethod: req.body.paymentMethod || appointment.paymentMethod, // الاحتفاظ بالقيمة القديمة إذا لم يتم توفير قيمة جديدة
      paymentStatus: req.body.paymentStatus || appointment.paymentStatus
    };
    
    // حقول إضافية للمدير فقط
    if (req.user.role === 'admin') {
      updatedAppointment.medicalReport = req.body.medicalReport !== undefined ? req.body.medicalReport : appointment.medicalReport;
      updatedAppointment.prescription = req.body.prescription !== undefined ? req.body.prescription : appointment.prescription;
    }
    
    // تحديث الموعد
    const result = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $set: updatedAppointment },
      { new: true, runValidators: true }
    );
    
    // إرسال رسالة تحديث
    try {
      await sendSMS(
        req.user.phone,
        `مرحبًا ${req.user.name}، تم تحديث موعدك إلى ${result.time} يوم ${new Date(result.date).toLocaleDateString('ar-SA')}. شكرًا لك!`
      );
    } catch (smsError) {
      console.error('فشل في إرسال رسالة التحديث:', smsError);
      // نستمر بالرغم من فشل إرسال الرسالة
    }
    
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'فشل في تحديث الموعد', error: error.message });
  }
};

// إلغاء موعد
const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'الموعد غير موجود' });
    }
    
    // التحقق من أن الموعد للمستخدم الحالي أو أن المستخدم مدير
    if (appointment.patient.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'غير مصرح بإلغاء هذا الموعد' });
    }
    
    // تحديث حالة الموعد إلى ملغي
    appointment.status = 'cancelled';
    await appointment.save();
    
    // إرسال رسالة إلغاء
    try {
      await sendSMS(
        req.user.phone,
        `مرحبًا ${req.user.name}، تم إلغاء موعدك المحدد في ${appointment.time} يوم ${new Date(appointment.date).toLocaleDateString('ar-SA')}. يرجى الاتصال بنا إذا كنت ترغب في إعادة الجدولة.`
      );
    } catch (smsError) {
      console.error('فشل في إرسال رسالة الإلغاء:', smsError);
      // نستمر بالرغم من فشل إرسال الرسالة
    }
    
    res.json({ message: 'تم إلغاء الموعد بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

// الحصول على مواعيد مريض محدد (للمدير فقط)
const getPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.params.id })
      .sort({ date: -1, time: 1 });
    
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'فشل في جلب مواعيد المريض' });
  }
};

// طلب تعديل موعد
const requestAppointmentEdit = async (req, res) => {
  try {
    const { newDate, newTime, reason } = req.body;
    const appointmentId = req.params.id;

    // التحقق من صحة البيانات
    if (!newDate || !newTime || !reason) {
      return res.status(400).json({ 
        message: 'يرجى تقديم التاريخ والوقت الجديد وسبب التعديل' 
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ message: 'الموعد غير موجود' });
    }
    
    // التحقق من أن الموعد للمستخدم الحالي
    if (appointment.patient.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'غير مصرح لك بتقديم طلب تعديل لهذا الموعد' });
    }
    
    // التحقق من أن الموعد لم يتم إلغاؤه
    if (appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'لا يمكن تعديل موعد تم إلغاؤه' });
    }
    
    // التحقق من أن الموعد ليس في خلال 24 ساعة
    const appointmentDateTime = new Date(appointment.date);
    appointmentDateTime.setHours(
      parseInt(appointment.time.split(':')[0]),
      parseInt(appointment.time.split(':')[1])
    );
    
    const now = new Date();
    const hoursUntilAppointment = (appointmentDateTime - now) / (1000 * 60 * 60);
    
    if (hoursUntilAppointment < 24) {
      return res.status(400).json({ 
        message: 'لا يمكن تعديل المواعيد قبل 24 ساعة من الموعد المحدد' 
      });
    }
    
    // إنشاء طلب التعديل
    appointment.editRequest = {
      newDate: new Date(newDate),
      newTime: newTime,
      reason: reason,
      requestedAt: new Date()
    };
    
    appointment.editRequestStatus = 'pending';
    
    const updatedAppointment = await appointment.save();
    
    // إرسال رسالة تأكيد
    try {
      await sendSMS(
        req.user.phone,
        `مرحبًا ${req.user.name}، تم استلام طلب تعديل موعدك. سيتم مراجعته والرد عليك قريبًا.`
      );
    } catch (smsError) {
      console.error('فشل في إرسال رسالة تأكيد طلب التعديل:', smsError);
    }
    
    res.json({
      message: 'تم إرسال طلب التعديل بنجاح وسيتم مراجعته',
      appointment: updatedAppointment
    });
    
  } catch (error) {
    console.error('خطأ في طلب تعديل الموعد:', error);
    res.status(500).json({ 
      message: 'حدث خطأ أثناء معالجة طلب التعديل',
      error: error.message
    });
  }
};

// الموافقة على طلب تعديل الموعد (للمدير فقط)
const approveEditRequest = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ message: 'الموعد غير موجود' });
    }
    
    // التحقق من وجود طلب تعديل معلق
    if (!appointment.editRequest || appointment.editRequestStatus !== 'pending') {
      return res.status(400).json({ message: 'لا يوجد طلب تعديل معلق لهذا الموعد' });
    }
    
    // التحقق من عدم وجود موعد آخر في نفس الوقت الجديد
    const existingAppointment = await Appointment.findOne({
      _id: { $ne: appointmentId },
      date: new Date(appointment.editRequest.newDate),
      time: appointment.editRequest.newTime,
      status: { $ne: 'cancelled' }
    });

    if (existingAppointment) {
      // تحديث حالة طلب التعديل إلى مرفوض
      appointment.editRequestStatus = 'rejected';
      await appointment.save();
      
      return res.status(400).json({ 
        message: 'التاريخ والوقت الجديد غير متاح، محجوز بالفعل',
        appointment
      });
    }
    
    // تحديث الموعد بالمعلومات الجديدة
    appointment.date = appointment.editRequest.newDate;
    appointment.time = appointment.editRequest.newTime;
    appointment.editRequestStatus = 'approved';
    
    const updatedAppointment = await appointment.save();
    
    // جلب معلومات المريض لإرسال رسالة نصية
    const patient = await User.findById(appointment.patient);
    
    // إرسال إشعار للمريض
    try {
      await sendSMS(
        patient.phone,
        `مرحبًا ${patient.name}، تمت الموافقة على طلب تعديل موعدك. الموعد الجديد: ${appointment.time} يوم ${new Date(appointment.date).toLocaleDateString('ar-SA')}.`
      );
    } catch (smsError) {
      console.error('فشل في إرسال رسالة الموافقة على طلب التعديل:', smsError);
    }
    
    res.json({
      message: 'تمت الموافقة على طلب التعديل وتحديث الموعد',
      appointment: updatedAppointment
    });
    
  } catch (error) {
    console.error('خطأ في الموافقة على طلب التعديل:', error);
    res.status(500).json({ 
      message: 'حدث خطأ أثناء معالجة الموافقة على طلب التعديل',
      error: error.message
    });
  }
};

// رفض طلب تعديل الموعد (للمدير فقط)
const rejectEditRequest = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { rejectReason } = req.body; // سبب الرفض اختياري
    
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ message: 'الموعد غير موجود' });
    }
    
    // التحقق من وجود طلب تعديل معلق
    if (!appointment.editRequest || appointment.editRequestStatus !== 'pending') {
      return res.status(400).json({ message: 'لا يوجد طلب تعديل معلق لهذا الموعد' });
    }
    
    // تحديث حالة طلب التعديل إلى مرفوض
    appointment.editRequestStatus = 'rejected';
    
    // إضافة سبب الرفض إلى الملاحظات إذا تم تقديمه
    if (rejectReason) {
      const noteAddition = `طلب التعديل مرفوض: ${rejectReason}`;
      appointment.notes = appointment.notes 
        ? `${appointment.notes}\n${noteAddition}` 
        : noteAddition;
    }
    
    const updatedAppointment = await appointment.save();
    
    // جلب معلومات المريض لإرسال رسالة نصية
    const patient = await User.findById(appointment.patient);
    
    // إرسال إشعار للمريض
    try {
      let message = `مرحبًا ${patient.name}، تم رفض طلب تعديل موعدك.`;
      
      if (rejectReason) {
        message += ` السبب: ${rejectReason}`;
      }
      
      message += ` يرجى الاتصال بالعيادة لمزيد من المعلومات.`;
      
      await sendSMS(patient.phone, message);
    } catch (smsError) {
      console.error('فشل في إرسال رسالة رفض طلب التعديل:', smsError);
    }
    
    res.json({
      message: 'تم رفض طلب التعديل',
      appointment: updatedAppointment
    });
    
  } catch (error) {
    console.error('خطأ في رفض طلب التعديل:', error);
    res.status(500).json({ 
      message: 'حدث خطأ أثناء معالجة رفض طلب التعديل',
      error: error.message
    });
  }
};

// تصدير جميع الدوال
module.exports = {
  createAppointment,
  getUserAppointments,
  getAllAppointments,
  getBookedTimes,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  getPatientAppointments,
  requestAppointmentEdit,
  approveEditRequest,
  rejectEditRequest
};