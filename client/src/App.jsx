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
import StudentClassroomDetail from './components/student/StudentClassroomDetail';
import TaskDetail from './components/teacher/TaskDetail';
import CodeCompiler from './components/compiler/CodeCompiler';
import CompilerLanding from './components/compiler/CompilerLanding';
import CompilerHistory from './components/compiler/CompilerHistory';
import './App.css';
import StudentTaskDetail from './components/student/StudentTaskDetail';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover theme="light" />
        <Header />
        <Routes>
          {/* Public routes - accessible even when authenticated */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/logout" element={<LogoutHandler />} />
          
          {/* Public Compiler Routes - No login required */}
          <Route path="/" element={<CompilerLanding />} />
          <Route path="/compiler" element={<CodeCompiler />} />
          <Route 
            path="/compiler/history" 
            element={
              isAuthenticated ? (
                <PrivateRoute requiredRole={user?.role}>
                  <CompilerHistory />
                </PrivateRoute>
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          
          {/* First Login Password Change Route */}
          <Route 
            path="/first-login-password-change" 
            element={
              shouldRedirectToPasswordChange ? (
                <FirstLoginPasswordChange />
              ) : (
                <Navigate to="/" />
              )
            } 
          />
          
          {/* Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <PrivateRoute requiredRole="admin">
                <AdminDashboard />
              </PrivateRoute>
            } 
          />
          
          {/* Teacher Routes */}
          <Route 
            path="/teacher/dashboard" 
            element={
              shouldRedirectToPasswordChange ? (
                <Navigate to="/first-login-password-change" />
              ) : (
                <PrivateRoute requiredRole="teacher">
                  <TeacherDashboard />
                </PrivateRoute>
              )
            } 
          />
          <Route 
            path="/teacher/profile" 
            element={
              shouldRedirectToPasswordChange ? (
                <Navigate to="/first-login-password-change" />
              ) : (
                <PrivateRoute requiredRole="teacher">
                  <TeacherProfile />
                </PrivateRoute>
              )
            } 
          />
          <Route 
            path="/teacher/classroom/:classroomId" 
            element={
              shouldRedirectToPasswordChange ? (
                <Navigate to="/first-login-password-change" />
              ) : (
                <PrivateRoute requiredRole="teacher">
                  <ClassroomDetail />
                </PrivateRoute>
              )
            } 
          />
          <Route 
            path="/teacher/task/:taskId" 
            element={
              shouldRedirectToPasswordChange ? (
                <Navigate to="/first-login-password-change" />
              ) : (
                <PrivateRoute requiredRole="teacher">
                  <TaskDetail />
                </PrivateRoute>
              )
            } 
          />
          <Route 
            path="/teacher/task/:taskId/detail" 
            element={
              <PrivateRoute requiredRole="teacher">
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Task Detail View</h2>
                    <p className="text-gray-600">Task detail view coming soon...</p>
                    <button 
                      onClick={() => window.history.back()}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/teacher/content/:contentId" 
            element={
              <PrivateRoute requiredRole="teacher">
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Content Detail View</h2>
                    <p className="text-gray-600">Content detail view coming soon...</p>
                    <button 
                      onClick={() => window.history.back()}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/teacher/content/:contentId/edit" 
            element={
              <PrivateRoute requiredRole="teacher">
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Content</h2>
                    <p className="text-gray-600">Content edit view coming soon...</p>
                    <button 
                      onClick={() => window.history.back()}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              </PrivateRoute>
            } 
          />
          
          {/* Student Routes */}
          <Route 
            path="/student/dashboard" 
            element={
              shouldRedirectToPasswordChange ? (
                <Navigate to="/first-login-password-change" />
              ) : (
                <PrivateRoute requiredRole="student">
                  <StudentDashboard />
                </PrivateRoute>
              )
            } 
          />
          <Route 
            path="/student/profile" 
            element={
              shouldRedirectToPasswordChange ? (
                <Navigate to="/first-login-password-change" />
              ) : (
                <PrivateRoute requiredRole="student">
                  <StudentProfile />
                </PrivateRoute>
              )
            } 
          />
          <Route 
            path="/student/classroom/:classroomId" 
            element={
              shouldRedirectToPasswordChange ? (
                <Navigate to="/first-login-password-change" />
              ) : (
                <PrivateRoute requiredRole="student">
                  <StudentClassroomDetail />
                </PrivateRoute>
              )
            } 
          />
          <Route 
            path="/student/task/:taskId" 
            element={
              shouldRedirectToPasswordChange ? (
                <Navigate to="/first-login-password-change" />
              ) : (
                <PrivateRoute requiredRole="student">
                  <StudentTaskDetail />
                </PrivateRoute>
              )
            } 
          />
          
          {/* Default redirect */}
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? (
                shouldRedirectToPasswordChange ? (
                  <Navigate to="/first-login-password-change" />
                ) : (
                  <Navigate to={`/${user?.role}/dashboard`} />
                )
              ) : (
                <Navigate to="/" />
              )
            } 
          />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
