import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { File, Video, Image, Music, FileText, Download, Eye, Calendar, User } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const CourseContentViewer = ({ classroomId }) => {
  const { user } = useSelector(state => state.auth);
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [showViewer, setShowViewer] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [classroomId]);

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/course-content/classroom/${classroomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Only show public content to students
      const publicContent = response.data.filter(item => item.isPublic);
      setContent(publicContent);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewContent = (item) => {
    setSelectedContent(item);
    setShowViewer(true);
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
      alert(`Error downloading file: ${error.response?.data?.message || error.message}`);
    }
  };

  const handlePreview = async (contentItem) => {
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

      // Create blob URL for preview
      const blob = new Blob([response.data], { type: contentItem.mimeType });
      const url = window.URL.createObjectURL(blob);
      
      // Open in new tab for preview
      window.open(url, '_blank');
      
      // Clean up blob URL
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Error previewing file:', error);
      alert(`Error previewing file: ${error.response?.data?.message || error.message}`);
    }
  };

  const canPreview = (mimeType) => {
    return mimeType.startsWith('image/') || 
           mimeType.startsWith('video/') || 
           mimeType.startsWith('audio/') ||
           mimeType === 'application/pdf' ||
           mimeType === 'text/plain';
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5" />;
      case 'image': return <Image className="w-5 h-5" />;
      case 'audio': return <Music className="w-5 h-5" />;
      case 'document': return <FileText className="w-5 h-5" />;
      default: return <File className="w-5 h-5" />;
    }
  };

  const getFileTypeColor = (type) => {
    switch (type) {
      case 'video': return 'text-red-600 bg-red-100';
      case 'image': return 'text-green-600 bg-green-100';
      case 'audio': return 'text-purple-600 bg-purple-100';
      case 'document': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
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

  const renderContentViewer = () => {
    if (!selectedContent) return null;

    switch (selectedContent.type) {
      case 'video':
        return (
          <div className="text-center py-8">
            <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Video files cannot be previewed directly</p>
            <button
              onClick={() => handleDownload(selectedContent)}
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Video</span>
            </button>
          </div>
        );
      case 'image':
        return (
          <div className="text-center py-8">
            <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Image files cannot be previewed directly</p>
            <button
              onClick={() => handleDownload(selectedContent)}
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Image</span>
            </button>
          </div>
        );
      case 'audio':
        return (
          <div className="text-center py-8">
            <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Audio files cannot be previewed directly</p>
            <button
              onClick={() => handleDownload(selectedContent)}
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Audio</span>
            </button>
          </div>
        );
      default:
        return (
          <div className="text-center py-8">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">This file type cannot be previewed</p>
            <div className="flex justify-center space-x-4">
              {canPreview(selectedContent.mimeType) && (
                <button
                  onClick={() => handlePreview(selectedContent)}
                  className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </button>
              )}
              <button
                onClick={() => handleDownload(selectedContent)}
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download File</span>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Course Materials</h2>
        <div className="text-sm text-gray-600">
          {content.length} item(s) available
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-4 animate-pulse border">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : content.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center border">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No course materials available</h3>
          <p className="text-gray-600">Your teacher hasn't uploaded any content yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {content.map((item) => (
            <div key={item._id} className="bg-white rounded-lg p-4 border hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getFileIcon(item.type)}
                  <span className="text-sm font-medium text-gray-900 line-clamp-1">{item.title}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getFileTypeColor(item.type)}`}>
                  {item.type}
                </span>
              </div>
              
              {item.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
              )}
              
              <div className="space-y-2 mb-3">
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>{formatDate(item.createdAt)}</span>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <User className="w-3 h-3 mr-1" />
                  <span>By {item.uploadedBy.name}</span>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <File className="w-3 h-3 mr-1" />
                  <span>{formatFileSize(item.fileSize)}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleViewContent(item)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => handleDownload(item)}
                  className="flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content Viewer Modal */}
      {showViewer && selectedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedContent.title}</h3>
                <p className="text-sm text-gray-600">
                  Uploaded by {selectedContent.uploadedBy.name} on {formatDate(selectedContent.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setShowViewer(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            {selectedContent.description && (
              <p className="text-gray-700 mb-4 p-3 bg-gray-50 rounded-lg">
                {selectedContent.description}
              </p>
            )}

            <div className="flex-1 overflow-y-auto">
              {renderContentViewer()}
            </div>

            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <div className="text-sm text-gray-600">
                {formatFileSize(selectedContent.fileSize)} • {selectedContent.type}
              </div>
              <button
                onClick={() => handleDownload(selectedContent)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseContentViewer;
