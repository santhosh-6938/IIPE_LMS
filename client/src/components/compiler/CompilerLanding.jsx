import React from 'react';
import { Link } from 'react-router-dom';
import { Code, Play, Download, FileText, Terminal, Zap, Shield, Users } from 'lucide-react';

const CompilerLanding = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Code className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">IIPE Code Compiler</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Compile & Run Code
            <span className="text-blue-600"> Instantly</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A powerful online code compiler supporting 8+ programming languages. 
            No registration required, no data stored. Just pure coding experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/compiler"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg flex items-center justify-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>Start Coding Now</span>
            </Link>
            <a
              href="#features"
              className="px-8 py-4 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-lg border"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Code
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features designed for developers and learners
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Multiple Languages */}
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Code className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">8+ Languages</h3>
              <p className="text-gray-600">
                Support for JavaScript, Python, C++, C, Java, PHP, Ruby, and Go
              </p>
            </div>

            {/* Real-time Execution */}
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Execution</h3>
              <p className="text-gray-600">
                Compile and run code instantly with live output and error handling
              </p>
            </div>

            {/* Input/Output Support */}
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Terminal className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">I/O Support</h3>
              <p className="text-gray-600">
                Provide input to your programs and see real-time output
              </p>
            </div>

            {/* Code Download */}
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Download Code</h3>
              <p className="text-gray-600">
                Save your code with proper file extensions for each language
              </p>
            </div>

            {/* No Registration */}
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Registration</h3>
              <p className="text-gray-600">
                Start coding immediately without creating an account
              </p>
            </div>

            {/* Code Templates */}
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Code Templates</h3>
              <p className="text-gray-600">
                Pre-built templates to get you started quickly
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Languages Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Supported Programming Languages
            </h2>
            <p className="text-xl text-gray-600">
              From beginner-friendly to advanced programming languages
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'JavaScript', ext: '.js', color: 'bg-yellow-100 text-yellow-800' },
              { name: 'Python', ext: '.py', color: 'bg-blue-100 text-blue-800' },
              { name: 'C++', ext: '.cpp', color: 'bg-blue-100 text-blue-800' },
              { name: 'C', ext: '.c', color: 'bg-blue-100 text-blue-800' },
              { name: 'Java', ext: '.java', color: 'bg-orange-100 text-orange-800' },
              { name: 'PHP', ext: '.php', color: 'bg-purple-100 text-purple-800' },
              { name: 'Ruby', ext: '.rb', color: 'bg-red-100 text-red-800' },
              { name: 'Go', ext: '.go', color: 'bg-cyan-100 text-cyan-800' }
            ].map((lang) => (
              <div key={lang.name} className="bg-white rounded-xl p-6 text-center shadow-sm border">
                <div className={`w-12 h-12 ${lang.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                  <span className="font-mono font-bold text-sm">{lang.ext}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{lang.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Coding?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of developers who use our compiler daily
          </p>
          <Link
            to="/compiler"
            className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition-colors font-medium text-lg inline-flex items-center space-x-2"
          >
            <Code className="w-5 h-5" />
            <span>Launch Compiler</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Code className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">IIPE Compiler</h3>
              </div>
              <p className="text-gray-400">
                A powerful online code compiler for developers and learners.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/compiler" className="text-gray-400 hover:text-white transition-colors">
                    Code Compiler
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-gray-400 hover:text-white transition-colors">
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-gray-400 hover:text-white transition-colors">
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li>• 8+ Programming Languages</li>
                <li>• Real-time Execution</li>
                <li>• Code Download</li>
                <li>• No Registration Required</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 IIPE Code Compiler. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CompilerLanding;
