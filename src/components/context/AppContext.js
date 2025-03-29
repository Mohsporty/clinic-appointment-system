// client/src/components/context/AppContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // إضافة مكتبة jwt-decode للتحقق من صلاحية التوكن

// إنشاء Context
const AppContext = createContext(null);

// إنشاء كلاس لإدارة الجلسة في localStorage
class SessionManager {
  static setUserInfo(userData) {
    // تخزين التوكن بطريقة أكثر أمانًا مع وقت انتهاء الصلاحية
    const secureUserData = {
      ...userData,
      tokenExpiry: Date.now() + (24 * 60 * 60 * 1000) // 24 ساعة
    };
    localStorage.setItem('userInfo', JSON.stringify(secureUserData));
    
    // تعيين توكن الـ JWT في رأس الطلبات
    axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
  }
  
  static getUserInfo() {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) return null;
    
    try {
      const userData = JSON.parse(userInfo);
      
      // التحقق من انتهاء صلاحية التوكن
      if (userData.tokenExpiry && userData.tokenExpiry < Date.now()) {
        // التوكن منتهي الصلاحية، قم بإزالة بيانات المستخدم
        this.clearUserInfo();
        return null;
      }
      
      if (userData.token) {
        // تعيين توكن الـ JWT في رأس الطلبات
        axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
      }
      
      return userData;
    } catch (error) {
      this.clearUserInfo();
      return null;
    }
  }
  
  static clearUserInfo() {
    localStorage.removeItem('userInfo');
    delete axios.defaults.headers.common['Authorization'];
  }
  
  static isTokenValid(token) {
    if (!token) return false;
    
    try {
      const decoded = jwtDecode(token);
      // التحقق مما إذا كان التوكن منتهي الصلاحية
      return decoded.exp * 1000 > Date.now();
    } catch (error) {
      return false;
    }
  }
}

// Provider Component
export const AppContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // التحقق من حالة تسجيل الدخول عند تحميل التطبيق
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = SessionManager.getUserInfo();
        
        if (userData && userData.token) {
          // التحقق من صلاحية التوكن
          if (SessionManager.isTokenValid(userData.token)) {
            // تأكد من وجود قيمة للـ role
            const userWithRole = {
              ...userData,
              role: userData.role || 'user' // تعيين 'user' كقيمة افتراضية
            };
            
            setUser(userWithRole);
            setIsAuthenticated(true);
            
            // التحقق من صلاحية التوكن مع الخادم
            try {
              const config = {
                headers: {
                  Authorization: `Bearer ${userData.token}`
                }
              };
              
              const response = await axios.get('/api/users/profile', config);
              // تحديث المعلومات من الخادم إذا لزم الأمر
              if (response.data) {
                const updatedUserData = {
                  ...userWithRole,
                  ...response.data,
                  token: userData.token // الحفاظ على التوكن الأصلي
                };
                
                setUser(updatedUserData);
                SessionManager.setUserInfo(updatedUserData);
              }
            } catch (profileError) {
              // في حالة فشل التحقق من الملف الشخصي، نفترض أن التوكن غير صالح
              console.warn('فشل التحقق من الملف الشخصي، تسجيل الخروج تلقائيًا:', profileError);
              logout();
            }
          } else {
            // التوكن منتهي الصلاحية، تسجيل الخروج
            logout();
          }
        }
      } catch (error) {
        console.error('خطأ في التحقق من المصادقة:', error);
        SessionManager.clearUserInfo();
        setError('حدث خطأ أثناء التحقق من تسجيل الدخول');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // تسجيل الدخول
  const login = async (email, password) => {
    setLoading(true);
    try {
      setError(null);
      
      const { data } = await axios.post('/api/users/login', { email, password });
      
      // تخزين بيانات المستخدم بطريقة آمنة
      SessionManager.setUserInfo(data);
      
      // تأكد من تعيين دور المستخدم
      const userWithRole = {
        ...data,
        role: data.role || 'user' // التأكد من وجود قيمة افتراضية
      };
      
      setUser(userWithRole);
      setIsAuthenticated(true);
      return { success: true, role: userWithRole.role };
    } catch (error) {
      setError(error.response?.data?.message || 'فشل تسجيل الدخول');
      return { 
        success: false, 
        message: error.response?.data?.message || 'فشل تسجيل الدخول' 
      };
    } finally {
      setLoading(false);
    }
  };

  // تسجيل الخروج
  const logout = useCallback(() => {
    SessionManager.clearUserInfo();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // التسجيل
  const register = async (name, email, password, phone) => {
    setLoading(true);
    try {
      setError(null);
      
      const { data } = await axios.post('/api/users/register', { 
        name, email, password, phone
      });
      
      // تخزين بيانات المستخدم بطريقة آمنة
      SessionManager.setUserInfo(data);
      
      // تأكد من تعيين دور المستخدم
      const userWithRole = {
        ...data,
        role: data.role || 'user' // التأكد من وجود قيمة افتراضية
      };
      
      setUser(userWithRole);
      setIsAuthenticated(true);
      return { success: true, role: userWithRole.role };
    } catch (error) {
      setError(error.response?.data?.message || 'فشل التسجيل');
      return { 
        success: false, 
        message: error.response?.data?.message || 'فشل التسجيل' 
      };
    } finally {
      setLoading(false);
    }
  };

  // تحديث الملف الشخصي
  const updateProfile = async (userData) => {
    setLoading(true);
    try {
      setError(null);
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        }
      };
      
      const { data } = await axios.put('/api/users/profile', userData, config);
      
      // تحديث بيانات المستخدم مع الاحتفاظ بالتوكن
      const updatedUserData = {
        ...data,
        token: user.token
      };
      
      SessionManager.setUserInfo(updatedUserData);
      setUser(updatedUserData);
      
      return { success: true, data: updatedUserData };
    } catch (error) {
      setError(error.response?.data?.message || 'فشل تحديث الملف الشخصي');
      return { 
        success: false, 
        message: error.response?.data?.message || 'فشل تحديث الملف الشخصي' 
      };
    } finally {
      setLoading(false);
    }
  };

  // التحقق من صلاحية التوكن
  const verifyToken = useCallback(async () => {
    if (!user || !user.token) return false;
    
    try {
      // التحقق من صلاحية التوكن المحلية أولاً
      if (!SessionManager.isTokenValid(user.token)) {
        logout();
        return false;
      }
      
      // التحقق من الخادم
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      await axios.get('/api/users/verify-token', config);
      return true;
    } catch (error) {
      // التوكن غير صالح، تسجيل الخروج
      logout();
      return false;
    }
  }, [user, logout]);

  // القيم التي ستوفرها الـ Context
  const contextValue = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    register,
    updateProfile,
    verifyToken
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Hook مخصص لاستخدام Context
export const useAppContext = () => {
  const context = useContext(AppContext);
  
  if (!context) {
    throw new Error('يجب استخدام useAppContext داخل AppContextProvider');
  }
  
  return context;
};