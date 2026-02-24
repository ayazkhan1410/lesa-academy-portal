import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard from './Dashboard';
import StudentList from './StudentList';
import StudentDetail from './StudentDetail';
import GuardianList from './GuardianList';
import GuardianDetail from './GuardianDetail';
import ExpenseList from './ExpenseList';
import AttendanceDashboard from './AttendanceDashboard';
import TeacherList from './TeacherList';
import TeacherDetail from './TeacherDetail';
import NotificationSettings from './NotificationSettings';
import NotFound from './NotFound';

import { useTranslation } from 'react-i18next';
import Login from './Login';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('access_token');
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const App = () => {
  const { i18n } = useTranslation();
  const direction = i18n.language === 'ur' ? 'rtl' : 'ltr';

  return (
    <div dir={direction} className={i18n.language === 'ur' ? 'font-urdu' : ''}>
      <Router>
        {/* ✅ GLOBAL DYNAMIC TOASTER CONFIGURATION */}
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            // Default options for all toasts
            duration: 10000, // 10 seconds (10000ms)
            style: {
              background: '#334155',
              color: '#fff',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              textAlign: direction === 'rtl' ? 'right' : 'left'
            },
            // Specific style for Success
            success: {
              duration: 10000,
              theme: { primary: '#10b981' }
            },
            // Specific style for Error
            error: {
              duration: 10000,
              theme: { primary: '#ef4444' }
            }
          }}
        />

        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute><StudentList /></ProtectedRoute>} />
          <Route path="/students/:id" element={<ProtectedRoute><StudentDetail /></ProtectedRoute>} />
          <Route path="/guardians" element={<ProtectedRoute><GuardianList /></ProtectedRoute>} />
          <Route path="/guardians/:id" element={<ProtectedRoute><GuardianDetail /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><ExpenseList /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><AttendanceDashboard /></ProtectedRoute>} />
          <Route path="/teachers" element={<ProtectedRoute><TeacherList /></ProtectedRoute>} />
          <Route path="/teachers/:id" element={<ProtectedRoute><TeacherDetail /></ProtectedRoute>} />
          <Route path="/notification-settings" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
