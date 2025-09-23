import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Download, Code, Calendar, FileText, Eye, User } from 'lucide-react';

const CompilerHistory = () => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchHistory();
  }, [isAuthenticated]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const authToken = localStorage.getItem('token');
      let endpoint = '/compiler/history';
      
      // If user is teacher or admin, fetch all student code
      if (user?.role === 'teacher' || user?.role === 'admin') {
        endpoint = '/compiler/all-student-code';
      }
      
      const res = await axios.get(`${API_BASE}${endpoint}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setItems(res.data.items || []);
    } catch (e) {
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const viewItem = async (id) => {
    try {
      const authToken = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/compiler/code/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setSelected(res.data.item);
    } catch (e) {
      setError('Failed to load code');
    }
  };

  const downloadItem = async (id) => {
    try {
      const authToken = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/compiler/download/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const item = items.find(i => i._id === id) || selected;
      const fullName = item ? `${item.filename || 'main'}${item.extension || ''}` : 'code.txt';
      link.setAttribute('download', fullName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError('Failed to download code');
    }
  };

  const getPageTitle = () => {
    if (user?.role === 'student') {
      return 'My Compiled Code';
    } else if (user?.role === 'teacher' || user?.role === 'admin') {
      return 'Student Code Files';
    }
    return 'Code History';
  };

  const getPageDescription = () => {
    if (user?.role === 'student') {
      return 'View and download your compiled files';
    } else if (user?.role === 'teacher' || user?.role === 'admin') {
      return 'View and download student compiled files';
    }
    return 'View compiled code files';
  };

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-r from-brandBlue via-brandNavy to-brandBlue text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-brandOrange rounded-lg flex items-center justify-center shadow-brand">
              <Code className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{getPageTitle()}</h1>
              <p className="text-white/90">{getPageDescription()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">History</h3>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.length === 0 ? (
                  <p className="text-gray-600">No compiled files found.</p>
                ) : (
                  items.map(item => (
                    <div key={item._id} className="p-3 border rounded-lg hover:bg-blue-50/40">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{item.language.toUpperCase()} {item.extension}</div>
                          <div className="text-sm text-gray-600 flex items-center space-x-2">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(item.createdAt).toLocaleString()}</span>
                          </div>
                          {(user?.role === 'teacher' || user?.role === 'admin') && item.studentName && (
                            <div className="text-sm text-blue-600 flex items-center space-x-1 mt-1">
                              <User className="w-3 h-3" />
                              <span>{item.studentName}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => viewItem(item._id)} className="px-2 py-1 text-brandBlue hover:underline flex items-center text-sm">
                            <Eye className="w-4 h-4 mr-1" /> View
                          </button>
                          <button onClick={() => downloadItem(item._id)} className="px-2 py-1 text-brandGreen hover:underline flex items-center text-sm">
                            <Download className="w-4 h-4 mr-1" /> Download
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
            {selected ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 border rounded-lg">
                    <div className="text-gray-600 text-sm">Language</div>
                    <div className="font-medium">{selected.language.toUpperCase()}</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-gray-600 text-sm">Filename</div>
                    <div className="font-medium">{selected.filename}{selected.extension}</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-gray-600 text-sm">Date</div>
                    <div className="font-medium">{new Date(selected.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                {(user?.role === 'teacher' || user?.role === 'admin') && selected.studentName && (
                  <div className="p-3 border rounded-lg">
                    <div className="text-gray-600 text-sm">Student</div>
                    <div className="font-medium text-blue-600">{selected.studentName}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-600 mb-2">Code</div>
                  <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap bg-gray-50 p-4 rounded border">{selected.code}</pre>
                </div>
                {selected.input && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Input</div>
                    <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap bg-gray-50 p-4 rounded border">{selected.input}</pre>
                  </div>
                )}
                {(selected.output || selected.error) && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Output</div>
                    <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap bg-gray-50 p-4 rounded border">{selected.error ? `Error:\n${selected.error}` : selected.output}</pre>
                  </div>
                )}
                <div>
                  <button onClick={() => downloadItem(selected._id)} className="px-4 py-2 bg-brandGreen text-white rounded-lg hover:brightness-110">Download</button>
                </div>
              </div>
            ) : (
              <div className="text-gray-600">Select an item from the history to preview.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompilerHistory;


