import React, { useState, useEffect } from 'react';
import { Play, Download, Code, Terminal, Clock, AlertCircle, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const CodeCompiler = () => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      const response = await axios.get(`${API_BASE}/compiler/languages`);
      setLanguages(response.data.languages);
      
      // Set default language to first available one
      if (response.data.languages.length > 0) {
        setSelectedLanguage(response.data.languages[0].value);
        loadTemplate(response.data.languages[0].value);
      }
    } catch (error) {
      console.error('Failed to fetch languages:', error);
      // Fallback to basic languages
      setLanguages([
        { value: 'javascript', name: 'JavaScript', extension: '.js', available: true, localAvailable: true },
        { value: 'python', name: 'Python', extension: '.py', available: true, localAvailable: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = (language) => {
    const templates = {
      javascript: 'console.log("Hello, World!");',
      python: 'print("Hello, World!")',
      cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
      c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
      java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
      php: '<?php\necho "Hello, World!";\n?>',
      ruby: 'puts "Hello, World!"',
      go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}'
    };
    setCode(templates[language] || '');
  };

  useEffect(() => {
    if (languages.length > 0) {
      loadTemplate(selectedLanguage);
    }
  }, [selectedLanguage, languages]);

  const handleRun = async () => {
    if (!code.trim()) {
      setError('Please enter some code to run');
      return;
    }

    setIsRunning(true);
    setError('');
    setOutput('');
    setExecutionTime(null);

    const startTime = Date.now();

    try {
      const response = await axios.post(`${API_BASE}/compiler/run`, {
        language: selectedLanguage,
        code: code.trim(),
        input: input.trim(),
        filename: 'main'
      });

      const endTime = Date.now();
      setExecutionTime(endTime - startTime);

      if (response.data.success) {
        setOutput(response.data.result.output || '');
        setError(response.data.result.error || '');
      } else {
        setError(response.data.message || 'Failed to run code');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to run code';
      setError(errorMessage);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      setError('Please login to save your code');
      return;
    }

    if (user?.role !== 'student') {
      setError('Only students can save code');
      return;
    }

    if (!code.trim()) {
      setError('Please enter some code to save');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE}/compiler/run-and-save`, {
        language: selectedLanguage,
        code: code.trim(),
        input: input.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setOutput('Code saved successfully!');
        setError('');
      } else {
        setError('Failed to save code');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save code');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (!code.trim()) {
      setError('Please enter some code to download');
      return;
    }

    const langConfig = languages.find(l => l.value === selectedLanguage);
    const filename = `main${langConfig?.extension || '.txt'}`;
    
    const blob = new Blob([code], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const getSelectedLanguageInfo = () => {
    return languages.find(lang => lang.value === selectedLanguage);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading compiler...</p>
        </div>
      </div>
    );
  }

  const selectedLangInfo = getSelectedLanguageInfo();

  return (
    <div className="min-h-screen dark:bg-gray-950">
      <div className="bg-gradient-to-r from-brandBlue via-brandNavy to-brandBlue text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-brandOrange rounded-lg flex items-center justify-center shadow-brand">
              <Code className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Code Compiler</h1>
              <p className="text-white/90">Write, compile, and run code in multiple languages</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Code Editor */}
          <div className="space-y-6">
            <div className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Code Editor</h3>
                <div className="flex items-center space-x-3">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue"
                  >
                    {languages.map(lang => (
                      <option key={lang.value} value={lang.value}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                  {selectedLangInfo && (
                    <div className="flex items-center space-x-1">
                      {selectedLangInfo.localAvailable ? (
                        <CheckCircle className="w-4 h-4 text-green-500" title="Local compiler available" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-500" title="Local compiler not available" />
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {selectedLangInfo && !selectedLangInfo.localAvailable && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-yellow-800">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Local compiler not available</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    {selectedLangInfo.installInstructions}
                  </p>
                </div>
              )}
              
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Write your code here..."
                className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue resize-none"
              />
              
              <div className="flex items-center space-x-3 mt-4">
                <button
                  onClick={handleRun}
                  disabled={isRunning}
                  className="flex items-center space-x-2 px-4 py-2 bg-brandBlue text-white rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed shadow-brand"
                >
                  <Play className="w-4 h-4" />
                  <span>{isRunning ? 'Running...' : 'Run'}</span>
                </button>
                
                <button
                  onClick={handleDownload}
                  className="flex items-center space-x-2 px-4 py-2 bg-brandGreen text-white rounded-lg hover:brightness-110"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>

                {isAuthenticated && user?.role === 'student' && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center space-x-2 px-4 py-2 bg-brandOrange text-white rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Input/Output */}
          <div className="space-y-6">
            {/* Input */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Input</h3>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter input for your program..."
                className="w-full h-32 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue resize-none"
              />
            </div>

            {/* Output */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Output</h3>
                {executionTime && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{executionTime}ms</span>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 min-h-32">
                {error ? (
                  <div className="flex items-start space-x-2 text-red-600">
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <pre className="font-mono text-sm whitespace-pre-wrap">{error}</pre>
                  </div>
                ) : output ? (
                  <pre className="font-mono text-sm text-gray-800 whitespace-pre-wrap">{output}</pre>
                ) : (
                  <p className="text-gray-500 text-sm">Output will appear here after running your code...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeCompiler;
