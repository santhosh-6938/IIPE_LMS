import React, { useState } from 'react';
import { Upload, FileSpreadsheet, X, Download, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const BulkImportModal = ({ isOpen, onClose, classroomId, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/octet-stream',
        'text/csv'
      ];
      
      const isValidType = validTypes.includes(selectedFile.type) || 
                         selectedFile.name.endsWith('.xlsx') || 
                         selectedFile.name.endsWith('.xls') ||
                         selectedFile.name.endsWith('.csv');
      
      if (!isValidType) {
        setError('Please select a valid Excel file (.xlsx, .xls) or CSV file (.csv)');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setUploadResults(null);

    try {
      const formData = new FormData();
      formData.append('excelFile', file);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/classrooms/${classroomId}/students/bulk-import`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setUploadResults(response.data);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.message || 'Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create a sample Excel template
    const templateData = [
      ['Name', 'Email'],
      ['John Doe', 'john.doe@example.com'],
      ['Jane Smith', 'jane.smith@example.com'],
      ['Mike Johnson', 'mike.johnson@example.com']
    ];

    // Convert to CSV format for download
    const csvContent = templateData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFile(null);
    setError(null);
    setUploadResults(null);
    setFile(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Bulk Import Students</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {!uploadResults ? (
          <div className="space-y-6">
            {/* Template Download */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Download className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-2">Download Template</h3>
                  <p className="text-blue-700 text-sm mb-3">
                    Download our Excel template to ensure your file has the correct format.
                  </p>
                  <button
                    onClick={downloadTemplate}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Download Template
                  </button>
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Excel File *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    <span className="font-medium text-blue-600 hover:text-blue-500">
                      Click to upload
                    </span>{' '}
                    or drag and drop
                  </p>
                  <p className="text-sm text-gray-500">
                    Excel files (.xlsx, .xls) up to 5MB
                  </p>
                </label>
              </div>
              {file && (
                <div className="mt-3 flex items-center text-sm text-gray-600">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  {file.name}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Instructions</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Your Excel file must have a header row with columns: <strong>Name</strong> and <strong>Email</strong></li>
                <li>• Supported formats: .xlsx, .xls, .csv</li>
                <li>• Students with existing emails will be added to the classroom</li>
                <li>• New students will be created with auto-generated passwords</li>
                <li>• Students already in the classroom will be skipped</li>
                <li>• Maximum file size: 5MB</li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Uploading...' : 'Upload and Import'}
              </button>
            </div>
          </div>
        ) : (
          /* Results Display */
          <div className="space-y-6">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Import Completed Successfully!</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-4">Import Results</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total rows processed:</span>
                  <span className="font-medium ml-2">{uploadResults.results.totalRows}</span>
                </div>
                <div>
                  <span className="text-gray-600">Successfully processed:</span>
                  <span className="font-medium ml-2">{uploadResults.results.processed}</span>
                </div>
                <div>
                  <span className="text-gray-600">New students created:</span>
                  <span className="font-medium ml-2 text-green-600">{uploadResults.results.added}</span>
                </div>
                <div>
                  <span className="text-gray-600">Existing students added:</span>
                  <span className="font-medium ml-2 text-blue-600">{uploadResults.results.alreadyExists}</span>
                </div>
                <div>
                  <span className="text-gray-600">Already in classroom:</span>
                  <span className="font-medium ml-2 text-yellow-600">{uploadResults.results.alreadyInClassroom}</span>
                </div>
              </div>

              {uploadResults.results.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-red-600 mb-2">Errors ({uploadResults.results.errors.length})</h4>
                  <div className="bg-red-50 border border-red-200 rounded p-3 max-h-32 overflow-y-auto">
                    {uploadResults.results.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700 mb-1">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={resetForm}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Import Another File
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkImportModal;
