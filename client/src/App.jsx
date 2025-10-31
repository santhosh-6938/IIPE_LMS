import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser, logout } from './store/slices/authSlice';
import Header from './components/common/Header';
import PrivateRoute from './components/common/PrivateRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import FirstLoginPasswordChange from './components/auth/FirstLoginPasswordChange';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import TeacherProfile from './components/teacher/TeacherProfile';
import StudentDashboard from './components/student/StudentDashboard';
import StudentProfile from './components/student/StudentProfile';
import AdminDashboard from './components/admin/AdminDashboard';
import ClassroomDetail from './components/teacher/ClassroomDetail';
import CoTeacherInvitationPage from './components/teacher/CoTeacherInvitationPage';
import StudentClassroomDetail from './components/student/StudentClassroomDetail';
import TaskDetail from './components/teacher/TaskDetail';
import CodeCompiler from './components/compiler/CodeCompiler';
import CompilerLanding from './components/compiler/CompilerLanding';
import LandingPage from './components/LandingPage';
import NotFound from './components/NotFound';
import CompilerHistory from './components/compiler/CompilerHistory';
import './App.css';
import StudentTaskDetail from './components/student/StudentTaskDetail';
import StudentMarksView from './components/student/StudentMarksView';
import ConcurrentLoginManager from './components/auth/ConcurrentLoginManager';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Footer from './components/common/Footer';

// Logout component that handles the logout action
const LogoutHandler = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(logout());
  }, [dispatch]);

  return <Navigate to="/login" />;
};

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading, user } = useSelector(state => state.auth);
  const [toastTheme, setToastTheme] = React.useState(() => (typeof window !== 'undefined' ? (localStorage.getItem('theme') || 'light') : 'light'));
  React.useEffect(() => {
    const handler = (e) => {
      const next = (e && e.detail) ? e.detail : (localStorage.getItem('theme') || 'light');
      setToastTheme(next === 'dark' ? 'dark' : 'light');
    };
    window.addEventListener('themechange', handler);
    return () => window.removeEventListener('themechange', handler);
  }, []);

  useEffect(() => {
    // Only try to load user if there's a token
    const token = localStorage.getItem('token');
    console.log('App useEffect - Token check:', { hasToken: !!token, isAuthenticated });

    if (token) {
      dispatch(loadUser());
    } else {
      console.log('No token found, skipping loadUser');
    }
  }, [dispatch]);

  // Debug authentication state changes
  useEffect(() => {
    console.log('Auth state changed:', { isAuthenticated, isLoading, hasUser: !!user });
  }, [isAuthenticated, isLoading, user]);

  // Cleanup effect to handle authentication state properly
  useEffect(() => {
    const token = localStorage.getItem('token');

    // If no token but still authenticated, clear the state
    if (!token && isAuthenticated) {
      console.log('Token missing but still authenticated, clearing state');
      dispatch(logout());
    }

    // If token exists but not authenticated, try to load user
    if (token && !isAuthenticated && !isLoading) {
      console.log('Token exists but not authenticated, loading user');
      dispatch(loadUser());
    }
  }, [isAuthenticated, isLoading, dispatch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if student or teacher needs to change password on first login
  const shouldRedirectToPasswordChange = isAuthenticated && (user?.role === 'student' || user?.role === 'teacher') && user?.isFirstLogin === true;

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <div className="App">
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover theme={toastTheme === 'dark' ? 'dark' : 'light'} />
        <Header />
        <Routes>
          {/* Unauthenticated: Only show landing, compiler, login, register, public pages */}
          {!isAuthenticated && (
            <>
              <Route path="/" element={<LandingPage />} />
              <Route path="/compiler" element={<CodeCompiler />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              {/* Catch-all always last so known pages win */}
              <Route path="*" element={<NotFound />} />
            </>
          )}
          {/* Authenticated: Show real app except landing, / will redirect to dashboard */}
          {isAuthenticated && (
            <>
              <Route path="/" element={<Navigate to={`/${user?.role}/dashboard`} />} />
              <Route path="/compiler" element={<CodeCompiler />} />
              <Route path="/logout" element={<LogoutHandler />} />
              {/* Admin */}
              <Route path="/admin/dashboard" element={<PrivateRoute requiredRole="admin"><AdminDashboard /></PrivateRoute>} />
              {/* Teacher */}
              <Route path="/teacher/dashboard" element={<PrivateRoute requiredRole="teacher"><TeacherDashboard /></PrivateRoute>} />
              <Route path="/teacher/profile" element={<PrivateRoute requiredRole="teacher"><TeacherProfile /></PrivateRoute>} />
              <Route path="/teacher/classroom/:classroomId" element={<PrivateRoute requiredRole="teacher"><ClassroomDetail /></PrivateRoute>} />
              <Route path="/teacher/task/:taskId" element={<PrivateRoute requiredRole="teacher"><TaskDetail /></PrivateRoute>} />
              <Route path="/co-teacher/invitation/:token" element={<PrivateRoute requiredRole="teacher"><CoTeacherInvitationPage /></PrivateRoute>} />
              {/* Student */}
              <Route path="/student/dashboard" element={<PrivateRoute requiredRole="student"><StudentDashboard /></PrivateRoute>} />
              <Route path="/student/profile" element={<PrivateRoute requiredRole="student"><StudentProfile /></PrivateRoute>} />
              <Route path="/student/classroom/:classroomId" element={<PrivateRoute requiredRole="student"><StudentClassroomDetail /></PrivateRoute>} />
              <Route path="/student/classroom/:classroomId/content" element={<PrivateRoute requiredRole="student"><StudentClassroomDetail /></PrivateRoute>} />
              <Route path="/student/task/:taskId" element={<PrivateRoute requiredRole="student"><StudentTaskDetail /></PrivateRoute>} />
              <Route path="/student/marks" element={<PrivateRoute requiredRole="student"><StudentMarksView /></PrivateRoute>} />
              <Route path="/compiler/history" element={<PrivateRoute requiredRole={user?.role}><CompilerHistory /></PrivateRoute>} />
              <Route path="/first-login-password-change" element={user && (user.role === 'student' || user.role === 'teacher') && user.isFirstLogin ? <FirstLoginPasswordChange /> : <Navigate to="/" />} />
              {/* Catch-all for real unknown pages */}
              <Route path="*" element={<NotFound />} />
            </>
          )}
        </Routes>

        {/* Global Concurrent Login Manager */}
        <ConcurrentLoginManager isVisible={isAuthenticated} />
        <Footer />
      </div>
    </Router>
  );
}

export default App;
