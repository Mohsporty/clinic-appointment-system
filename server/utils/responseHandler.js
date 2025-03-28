// server/utils/responseHandler.js
/**
 * كلاس لإدارة ردود API بطريقة موحدة وآمنة
 */
class ResponseHandler {
    /**
     * إنشاء رد ناجح
     * @param {Object} res - كائن الاستجابة من Express
     * @param {*} data - البيانات المراد إرسالها
     * @param {string} message - رسالة نجاح اختيارية
     * @param {number} statusCode - رمز الحالة، الافتراضي 200
     */
    static success(res, data, message = '', statusCode = 200) {
      return res.status(statusCode).json({
        success: true,
        message,
        data
      });
    }
  
    /**
     * إنشاء رد خطأ
     * @param {Object} res - كائن الاستجابة من Express
     * @param {string} message - رسالة الخطأ
     * @param {number} statusCode - رمز الحالة، الافتراضي 400
     * @param {*} errors - تفاصيل الأخطاء اختيارية
     */
    static error(res, message, statusCode = 400, errors = null) {
      const response = {
        success: false,
        message
      };
  
      if (errors) {
        response.errors = errors;
      }
  
      return res.status(statusCode).json(response);
    }
  
    /**
     * التعامل مع خطأ داخلي في الخادم
     * @param {Object} res - كائن الاستجابة من Express
     * @param {Error} error - كائن الخطأ
     * @param {string} customMessage - رسالة مخصصة اختيارية
     */
    static serverError(res, error, customMessage = 'خطأ في الخادم') {
      console.error('خطأ في الخادم:', error);
      
      // إخفاء تفاصيل الخطأ في الإنتاج
      const isDevelopment = process.env.NODE_ENV !== 'production';
      const message = isDevelopment && error.message ? 
        `${customMessage}: ${error.message}` : 
        customMessage;
      
      return this.error(res, message, 500);
    }
  
    /**
     * إنشاء رد غير مصرح
     * @param {Object} res - كائن الاستجابة من Express
     * @param {string} message - رسالة الخطأ
     */
    static unauthorized(res, message = 'غير مصرح بالوصول') {
      return this.error(res, message, 401);
    }
  
    /**
     * إنشاء رد ممنوع
     * @param {Object} res - كائن الاستجابة من Express
     * @param {string} message - رسالة الخطأ
     */
    static forbidden(res, message = 'غير مسموح بالوصول') {
      return this.error(res, message, 403);
    }
  
    /**
     * إنشاء رد غير موجود
     * @param {Object} res - كائن الاستجابة من Express
     * @param {string} message - رسالة الخطأ
     */
    static notFound(res, message = 'غير موجود') {
      return this.error(res, message, 404);
    }
  
    /**
     * إنشاء رد خطأ في التحقق
     * @param {Object} res - كائن الاستجابة من Express
     * @param {*} errors - أخطاء التحقق
     * @param {string} message - رسالة الخطأ
     */
    static validationError(res, errors, message = 'خطأ في التحقق من البيانات') {
      return this.error(res, message, 422, errors);
    }
  }
  
  module.exports = ResponseHandler;