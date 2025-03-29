// client/src/index.js
// استيراد React و ReactDOM أولاً
import React from 'react';
import ReactDOM from 'react-dom/client';

// ثم استيراد الخطوط و CSS
import '@fontsource/tajawal/400.css';
import '@fontsource/tajawal/500.css';
import '@fontsource/tajawal/700.css';
import './index.css';

// بعد ذلك استيراد التطبيق
import App from './App';

// إعداد axios
import axios from 'axios';
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// أخيرًا تقديم التطبيق
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);