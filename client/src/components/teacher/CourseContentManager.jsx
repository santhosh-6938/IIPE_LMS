import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Upload, File, Video, Image, Music, FileText, Trash2, Edit, Eye, Download, ExternalLink } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const CourseContentManager = ({ classroomId, onUpdate }) => {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    type: 'document',
    isPublic: true
  });
  const WORD_LIMIT_DESC = 80;
  const [descCount, setDescCount] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchContent();
  }, [classroomId]);

  // Call onUpdate when content changes
  useEffect(() => {
    if (onUpdate && content.length >= 0) {
      // Only call onUpdate when content actually changes, not on every render
      const timeoutId = setTimeout(() => {
        onUpdate();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [content.length, onUpdate]); // Only depend on content.length, not the entire content array

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/course-content/classroom/${classroomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContent(response.data);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Auto-detect content type
      const mimeType = file.type;
      let type = 'document';
      if (mimeType.startsWith('video/')) type = 'video';
      else if (mimeType.startsWith('image/')) type = 'image';
      else if (mimeType.startsWith('audio/')) type = 'audio';
      
      setUploadForm(prev => ({
        ...prev,
        type,
        title: file.name
      }));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setUploadProgress(0);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('type', uploadForm.type);
      formData.append('isPublic', uploadForm.isPublic);

      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/course-content/upload/${classroomId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      setShowUploadModal(false);
      setUploadForm({ title: '', description: '', type: 'document', isPublic: true });
      setSelectedFile(null);
      setUploadProgress(0);
      fetchContent();
      
      // Notify parent component to refresh counts with a small delay
      if (onUpdate) {
        setTimeout(() => {
          onUpdate();
        }, 500);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    }
  };

  const handleDelete = async (contentId) => {
    if (!window.confirm('Are you sure you want to delete this content?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/course-content/${contentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchContent();
      
      // Notify parent component to refresh counts with a small delay
      if (onUpdate) {
        setTimeout(() => {
          onUpdate();
        }, 500);
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Error deleting content. Please try again.');
    }
  };

  const handlePreview = async (contentItem) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('No authentication token found. Please log in again.');
        return;
      }
      
      console.log('Previewing content item:', contentItem);
      console.log('MIME type:', contentItem.mimeType);
      
      // Extract filename from fileUrl
      let filename = contentItem.fileUrl;
      
      // Remove any path prefixes to get just the filename
      if (filename.includes('/')) {
        filename = filename.split('/').pop(); // Get the last part after the last slash
      }
      
      const response = await axios.get(`${API_URL}/course-content/file/${filename}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      // Create blob URL for preview
      const blob = new Blob([response.data], { type: contentItem.mimeType });
      const url = window.URL.createObjectURL(blob);
      
      // Open in new tab for preview
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        alert('Please allow popups to preview files');
      }
      
      // Clean up blob URL
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } catch (error) {
      console.error('Error previewing file:', error);
      if (error.response?.status === 401) {
        alert('Authentication failed. Please log in again.');
      } else {
        alert(`Error previewing file: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleDownload = async (contentItem) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('No authentication token found. Please log in again.');
        return;
      }
      
      // Extract filename from fileUrl
      let filename = contentItem.fileUrl;
      
      // Remove any path prefixes to get just the filename
      if (filename.includes('/')) {
        filename = filename.split('/').pop(); // Get the last part after the last slash
      }
      
      const response = await axios.get(`${API_URL}/course-content/file/${filename}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = contentItem.fileName || contentItem.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Error downloading file:', error);
      if (error.response?.status === 401) {
        alert('Authentication failed. Please log in again.');
      } else {
        alert(`Error downloading file: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleViewDetails = (contentItem) => {
    // Navigate to content detail view (you can create this component later)
    navigate(`/teacher/content/${contentItem._id}`);
  };

  const handleEdit = (contentItem) => {
    // Navigate to edit content view (you can create this component later)
    navigate(`/teacher/content/${contentItem._id}/edit`);
  };

  const canPreview = (mimeType) => {
    // Debug: Log the MIME type to see what's being detected
    console.log('Checking preview for MIME type:', mimeType);
    
    // Allow preview for common file types that can be displayed in browser
    const previewableTypes = [
      'application/pdf',
      'text/plain',
      'text/csv',
      'text/html',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const canPreview = previewableTypes.includes(mimeType);
    console.log('Can preview:', canPreview, 'for MIME type:', mimeType);
    return canPreview;
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (mimeType.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-5 h-5" />;
    if (mimeType === 'application/pdf' || mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('excel')) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const getFileTypeLabel = (mimeType) => {
    if (mimeType.startsWith('video/')) return 'Video';
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType.startsWith('audio/')) return 'Audio';
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType.includes('document') || mimeType.includes('word')) return 'Document';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Spreadsheet';
    if (mimeType === 'text/plain') return 'Text';
    return 'File';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Course Content</h2>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Content</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : content.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center">
          <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No content uploaded yet</h3>
          <p className="text-gray-600 mb-6">Upload files, videos, or documents to share with your students</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upload First Content
          </button>
        </div>
      ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {content.map((item) => (
            <div key={item._id} className="bg-white rounded-lg p-4 border hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2 flex-1">
                  {getFileIcon(item.mimeType)}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{item.title}</h4>
                    <p className="text-xs text-gray-500">{getFileTypeLabel(item.mimeType)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <button
                    onClick={() => handleViewDetails(item)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="View Details"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePreview(item)}
                    className={`p-1 transition-colors ${
                      canPreview(item.mimeType) 
                        ? 'text-gray-400 hover:text-blue-600' 
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                    title={canPreview(item.mimeType) ? "Preview" : "Preview not available"}
                    disabled={!canPreview(item.mimeType)}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(item)}
                    className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {item.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
              )}
              
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>{formatFileSize(item.fileSize)}</span>
                <span>{formatDate(item.createdAt)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Uploaded by {item.uploadedBy.name}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  item.isPublic ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {item.isPublic ? 'Public' : 'Private'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Course Content</h3>
            
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File
                </label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => {
                    const next = e.target.value;
                    const words = (next.trim() ? next.trim().split(/\s+/) : []);
                    if (words.length <= WORD_LIMIT_DESC) {
                      setUploadForm(prev => ({ ...prev, description: next }));
                      setDescCount(words.length);
                    } else {
                      const trimmed = words.slice(0, WORD_LIMIT_DESC).join(' ');
                      setUploadForm(prev => ({ ...prev, description: trimmed }));
                      setDescCount(WORD_LIMIT_DESC);
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
                <div className="mt-1 text-xs text-gray-500 text-right">{descCount}/{WORD_LIMIT_DESC} words</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={uploadForm.type}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="document">Document</option>
                  <option value="video">Video</option>
                  <option value="image">Image</option>
                  <option value="audio">Audio</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={uploadForm.isPublic}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700">
                  Make content public to students
                </label>
              </div>

              {uploadProgress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || uploadProgress > 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadProgress > 0 ? `Uploading ${uploadProgress}%` : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseContentManager;
