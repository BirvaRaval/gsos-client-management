import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import ModernDashboard from './components/ModernDashboard';
import PullHistory from './components/PullHistory';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import ClientDetails from './components/ClientDetails';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const theme = useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#667eea',
        dark: '#764ba2',
      },
      secondary: {
        main: '#f093fb',
      },
      background: {
        default: darkMode ? '#0a0e27' : '#f8fafc',
        paper: darkMode ? '#1a1f3a' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 700,
      },
      h5: {
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: darkMode 
              ? '0 4px 20px rgba(0,0,0,0.3)' 
              : '0 4px 20px rgba(0,0,0,0.08)',
            border: darkMode 
              ? '1px solid rgba(255,255,255,0.1)' 
              : '1px solid rgba(0,0,0,0.05)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
            },
          },
        },
      },
    },
  }), [darkMode]);

  const handleThemeToggle = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout darkMode={darkMode} onThemeToggle={handleThemeToggle}>
          <Routes>
            <Route path="/" element={<ModernDashboard />} />
            <Route path="/client/:id" element={<ClientDetails />} />
            <Route path="/client/:id/history" element={<PullHistory />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              background: darkMode ? '#1a1f3a' : '#ffffff',
              color: darkMode ? '#ffffff' : '#000000',
              border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            },
          }}
        />
      </Router>
    </ThemeProvider>
  );
}

export default App;