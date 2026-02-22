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

import { useTranslation } from 'react-i18next';

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
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<StudentList />} />
          <Route path="/students/:id" element={<StudentDetail />} />
          <Route path="/guardians" element={<GuardianList />} />
          <Route path="/guardians/:id" element={<GuardianDetail />} />
          <Route path="/expenses" element={<ExpenseList />} />
          <Route path="/attendance" element={<AttendanceDashboard />} />
          <Route path="/teachers" element={<TeacherList />} />
          <Route path="/teachers/:id" element={<TeacherDetail />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
