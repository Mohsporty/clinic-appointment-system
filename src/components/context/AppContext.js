// client/src/components/context/AppContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Create Context
const AppContext = createContext(null);

// Session Manager Class with improved token handling
class SessionManager {
  static setUserInfo(userData) {
    // Store token with expiry time
    const secureUserData = {
      ...userData,
      tokenExpiry: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    localStorage.setItem('userInfo', JSON.stringify(secureUserData));
    
    // Set JWT token in request headers
    axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
  }
  
  static getUserInfo() {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) return null;
    
    try {
      const userData = JSON.parse(userInfo);
      
      // Check if token is expired
      if (userData.tokenExpiry && userData.tokenExpiry < Date.now()) {
        this.clearUserInfo();
        return null;
      }
      
      if (userData.token) {
        // Set JWT token in request headers
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
      // Check if token is expired
      return decoded.exp * 1000 > Date.now();
    } catch (error) {
      return false;
    }
  }
}

// Global axios response interceptor for handling 401 errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors globally
    if (error.response && error.response.status === 401) {
      // Clear session and redirect to login
      SessionManager.clearUserInfo();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Provider Component
export const AppContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check authentication status on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = SessionManager.getUserInfo();
        
        if (userData && userData.token) {
          // Verify token validity
          if (SessionManager.isTokenValid(userData.token)) {
            // Set default role if not provided
            const userWithRole = {
              ...userData,
              role: userData.role || 'user'
            };
            
            setUser(userWithRole);
            setIsAuthenticated(true);
            
            // Verify token with server
            try {
              const config = {
                headers: {
                  Authorization: `Bearer ${userData.token}`
                }
              };
              
              const response = await axios.get('/api/users/profile', config);
              // Update information from server if needed
              if (response.data) {
                const updatedUserData = {
                  ...userWithRole,
                  ...response.data,
                  token: userData.token // Keep original token
                };
                
                setUser(updatedUserData);
                SessionManager.setUserInfo(updatedUserData);
              }
            } catch (profileError) {
              // On profile check failure, assume token is invalid
              console.warn('Profile check failed, logging out automatically:', profileError);
              logout();
            }
          } else {
            // Token expired, log out
            logout();
          }
        }
      } catch (error) {
        console.error('Authentication check error:', error);
        SessionManager.clearUserInfo();
        setError('Error checking login status');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    try {
      setError(null);
      
      const { data } = await axios.post('/api/users/login', { email, password });
      
      // Store user data securely
      SessionManager.setUserInfo(data);
      
      // Ensure role is set
      const userWithRole = {
        ...data,
        role: data.role || 'user'
      };
      
      setUser(userWithRole);
      setIsAuthenticated(true);
      return { success: true, role: userWithRole.role };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      setError(errorMessage);
      return { 
        success: false, 
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = useCallback(() => {
    SessionManager.clearUserInfo();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // Register function
  const register = async (name, email, password, phone) => {
    setLoading(true);
    try {
      setError(null);
      
      const { data } = await axios.post('/api/users/register', { 
        name, email, password, phone
      });
      
      // Store user data securely
      SessionManager.setUserInfo(data);
      
      // Ensure role is set
      const userWithRole = {
        ...data,
        role: data.role || 'user'
      };
      
      setUser(userWithRole);
      setIsAuthenticated(true);
      return { success: true, role: userWithRole.role };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      return { 
        success: false, 
        message: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  // Update profile function
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
      
      // Update user data while keeping the token
      const updatedUserData = {
        ...data,
        token: user.token
      };
      
      SessionManager.setUserInfo(updatedUserData);
      setUser(updatedUserData);
      
      return { success: true, data: updatedUserData };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      setError(errorMessage);
      return { 
        success: false, 
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  // Verify token function
  const verifyToken = useCallback(async () => {
    if (!user || !user.token) return false;
    
    try {
      // Check local token validity first
      if (!SessionManager.isTokenValid(user.token)) {
        logout();
        return false;
      }
      
      // Verify with server
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      await axios.get('/api/users/verify-token', config);
      return true;
    } catch (error) {
      // Token invalid, log out
      logout();
      return false;
    }
  }, [user, logout]);

  // Context values to provide
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

// Custom hook for using Context
export const useAppContext = () => {
  const context = useContext(AppContext);
  
  if (!context) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }
  
  return context;
};