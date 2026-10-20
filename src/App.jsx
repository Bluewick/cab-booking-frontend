import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SocketProvider } from './context/SocketContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <SocketProvider>
              <AppRoutes />
            </SocketProvider>
          </ToastProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

