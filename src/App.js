// client/src/App.js
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, createTheme, responsiveFontSizes, StyledEngineProvider } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';
import CssBaseline from '@mui/material/CssBaseline';

// استيراد مكونات التطبيق
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import AppRoutes from './routes';

// استيراد Context Provider
import { AppContextProvider } from './components/context/AppContext';

// إنشاء ثيم مخصص للتطبيق
let theme = createTheme({
  direction: 'rtl', // تعيين الاتجاه للغة العربية من اليمين إلى اليسار
  palette: {
    primary: {
      main: '#0277bd', // لون أزرق غامق
      light: '#58a5f0',
      dark: '#004c8c',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#26a69a', // لون أخضر فاتح
      light: '#64d8cb',
      dark: '#00766c',
      contrastText: '#ffffff',
    },
    error: {
      main: '#e53935',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
    success: {
      main: '#4caf50',
    },
    background: {
      default: '#f7f9fc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      'Tajawal',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif'
    ].join(','),
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
        // تصحيح اتجاه الأيقونات في الأزرار
        startIcon: {
          marginRight: 0,
          marginLeft: 8,
        },
        endIcon: {
          marginLeft: 0,
          marginRight: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
        },
        root: {
          textAlign: 'right', // ضبط اتجاه النص في الخلايا
        }
      },
    },
    // إضافة ضبط للمكونات لتكون متوافقة مع RTL
    MuiTableRow: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            textAlign: 'right',
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          marginLeft: 0,
          marginRight: -8,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          textAlign: 'right'
        }
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          textAlign: 'right'
        }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          transformOrigin: 'right', // تغيير نقطة التحول لتناسب الاتجاه من اليمين لليسار
        }
      }
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          textAlign: 'right'
        }
      }
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          textAlign: 'right'
        }
      }
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          textAlign: 'right'
        }
      }
    },
    // تعديل القوائم المنسدلة لتظهر بشكل صحيح
    MuiSelect: {
      styleOverrides: {
        icon: {
          right: 'auto',
          left: 7,
        }
      }
    },
    // تعديل حقول النص
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: {
          textAlign: 'right',
        }
      }
    },
    // تعديل Card للتوسيط
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 8px 18px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-2px)'
          }
        }
      }
    },
    // تنسيق الفورم
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          margin: '8px 0', // تباعد أفضل للفورم كونترول
        }
      }
    }
  },
});

// جعل الخط متجاوب مع حجم الشاشة
theme = responsiveFontSizes(theme);

// إنشاء cache للـ RTL
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
  prepend: true,
});

// اضافة أنماط CSS العامة
const globalStyles = {
  '.center-form': {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '500px',
    margin: '0 auto',
    padding: '20px',
  },
  '.centered-container': {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 130px)',
  },
  '.auth-card': {
    width: '100%',
    maxWidth: '500px',
    margin: '20px auto',
    padding: '30px 20px',
  },
  '.form-control-spaced': {
    marginBottom: '16px',
  }
};

const App = () => {
  return (
    <CacheProvider value={cacheRtl}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {/* إضافة الأنماط العامة */}
          <style jsx global>{`
            body {
              direction: rtl;
              font-family: 'Tajawal', 'Roboto', sans-serif;
            }
            .center-form {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              width: 100%;
              max-width: 500px;
              margin: 0 auto;
              padding: 20px;
            }
            .centered-container {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: calc(100vh - 130px);
            }
            .auth-card {
              width: 100%;
              max-width: 500px;
              margin: 20px auto;
              padding: 30px 20px;
              box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15) !important;
              border-radius: 10px !important;
            }
            .form-control-spaced {
              margin-bottom: 16px;
            }
            .text-center {
              text-align: center;
            }
            .page-container {
              padding: 30px 0;
              max-width: 1200px;
              margin: 0 auto;
            }
            .dashboard-card {
              transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .dashboard-card:hover {
              transform: translateY(-5px);
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            }
          `}</style>
          <AppContextProvider>
            <Router>
              <div dir="rtl"> {/* تعيين الاتجاه على المستوى العام */}
                <Header />
                <main style={{ minHeight: 'calc(100vh - 130px)', padding: '20px 0' }}>
                  <AppRoutes />
                </main>
                <Footer />
              </div>
            </Router>
          </AppContextProvider>
        </ThemeProvider>
      </StyledEngineProvider>
    </CacheProvider>
  );
};

export default App;