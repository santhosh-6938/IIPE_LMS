import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { LogOut, User, Settings, ChevronDown, Code, Sun, Moon } from 'lucide-react';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    console.log('Logout button clicked, clearing auth state');
    dispatch(logout());
    
    // Force clear any remaining state
    localStorage.removeItem('token');
    sessionStorage.clear();
    
    // Force redirect to login page
    navigate('/login', { replace: true });
    
    // Force page refresh to clear any cached state
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // Theme toggle
  const getInitialTheme = () => {
    if (typeof window === 'undefined') return 'light';
    return localStorage.getItem('theme') || 'light';
  };
  const [theme, setTheme] = useState(getInitialTheme());
  const applyTheme = (t) => {
    const root = document.documentElement;
    if (t === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
  };
  React.useEffect(() => { applyTheme(theme); }, []);
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    applyTheme(next);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <button
              onClick={() => navigate(isAuthenticated ? `/${user?.role}/dashboard` : '/')}
              className="flex items-center space-x-3 group"
            >
              <img
                src="/IIPE%20LOGO.jpg"
                alt="IIPE Logo"
                className="w-10 h-10 rounded-full shadow-sm ring-1 ring-gray-200 group-hover:ring-blue-400 transition-all duration-200 group-hover:scale-105"
              />
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 bg-clip-text text-transparent">
                IIPE LMS
              </span>
            </button>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-2">
              <button
                onClick={() => navigate('/compiler')}
                className="text-gray-700 hover:text-blue-700 transition-all font-medium flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-blue-50"
              >
                <Code className="w-4 h-4" />
                <span>Compiler</span>
              </button>
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => navigate(`/${user?.role}/dashboard`)}
                    className="text-gray-700 hover:text-blue-700 transition-all font-medium px-3 py-2 rounded-md hover:bg-blue-50"
                  >
                    Dashboard
                  </button>
                  {user?.role === 'student' && (
                    <button
                      onClick={() => navigate('/compiler/history')}
                      className="text-gray-700 hover:text-blue-700 transition-all font-medium px-3 py-2 rounded-md hover:bg-blue-50"
                    >
                      My Codes
                    </button>
                  )}
                  {(user?.role === 'teacher' || user?.role === 'admin') && (
                    <button
                      onClick={() => navigate('/compiler/history')}
                      className="text-gray-700 hover:text-blue-700 transition-all font-medium px-3 py-2 rounded-md hover:bg-blue-50"
                    >
                      Student Codes
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="text-gray-700 hover:text-blue-700 transition-all font-medium px-3 py-2 rounded-md hover:bg-blue-50"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="text-gray-700 hover:text-blue-700 transition-all font-medium px-3 py-2 rounded-md hover:bg-blue-50"
                  >
                    Register
                  </button>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-700" />}
            </button>
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-all"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-sm group-hover:shadow">
                  <User className="w-4 h-4 text-white" />
                </div>
                {isAuthenticated && (
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                  </div>
                )}
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              {isAuthenticated && showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-1 z-50">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/${user?.role}/dashboard`)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Dashboard
                  </button>
                  {user?.role === 'student' && (
                    <button
                      onClick={() => navigate('/compiler/history')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <Code className="w-4 h-4 mr-2" />
                      My Codes
                    </button>
                  )}
                  {(user?.role === 'teacher' || user?.role === 'admin') && (
                    <button
                      onClick={() => navigate('/compiler/history')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <Code className="w-4 h-4 mr-2" />
                      Student Codes
                    </button>
                  )}
                  {user?.role === 'teacher' && (
                    <button
                      onClick={() => navigate('/teacher/profile')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Profile
                    </button>
                  )}
                  {user?.role === 'student' && (
                    <button
                      onClick={() => navigate('/student/profile')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Profile
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Click outside to close dropdown */}
      {isAuthenticated && showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </header>
  );
};

export default Header;