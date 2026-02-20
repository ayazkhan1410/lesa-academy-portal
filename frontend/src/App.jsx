import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // ✅ Import here
import Dashboard from './Dashboard';
import StudentList from './StudentList';
import StudentDetail from './StudentDetail';
import GuardianList from './GuardianList';
import GuardianDetail from './GuardianDetail';

const App = () => {
  return (
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
      </Routes>
    </Router>
  );
};

export default App;
