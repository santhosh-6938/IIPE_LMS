import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useSelector(state => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Force password change on first login for students and teachers only
  if ((user?.role === 'student' || user?.role === 'teacher') && user?.isFirstLogin === true) {
    return <Navigate to="/first-login-password-change" />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    const redirectPath = user?.role === 'admin' ? '/admin/dashboard' : 
                        user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';
    return <Navigate to={redirectPath} />;
  }

  return children;
};

export default PrivateRoute;