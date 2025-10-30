import React from 'react';
import { Link } from 'react-router-dom';
import { FaExclamationTriangle } from 'react-icons/fa';

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 py-16 px-4 text-center">
    <img
      src="/iipe-logo.png"
      alt="IIPE LMS Logo"
      className="mb-6 w-16 h-16 rounded-full shadow bg-white dark:bg-slate-800 p-2 inline-block mx-auto"
      onError={e=>e.target.style.display='none'}
    />
    <FaExclamationTriangle className="w-20 h-20 text-blue-400 dark:text-blue-600 mx-auto mb-4" />
    <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-blue-900 dark:text-blue-100">Page Not Found</h1>
    <p className="text-lg text-slate-500 dark:text-slate-300 mb-8">Sorry, the page you’re looking for doesn’t exist, has been removed, or is temporarily unavailable.</p>
    <Link
      to="/"
      className="inline-block px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white text-lg font-semibold rounded transition-colors shadow"
    >
      Go Back Home
    </Link>
    <div className="mt-8 text-xs text-slate-400">&copy; {new Date().getFullYear()} IIPE LMS</div>
  </div>
);

export default NotFound;
