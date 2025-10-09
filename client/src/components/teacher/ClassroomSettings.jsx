import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateClassroom } from '../../store/slices/classroomSlice';
import { Upload, Save, X, Image as ImageIcon, Edit3, BookOpen, FileText, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const ClassroomSettings = ({ classroom, onUpdate }) => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector(state => state.classroom);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    coverImage: null
  });
  
  const [originalData, setOriginalData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  
  const WORD_LIMIT_DESC = 60;
  const [descCount, setDescCount] = useState(0);

  useEffect(() => {
    if (classroom) {
      const data = {
        name: classroom.name || '',
        description: classroom.description || '',
        subject: classroom.subject || '',
        coverImage: classroom.coverImage || null
      };
      setFormData(data);
      setOriginalData(data);
      
      // Calculate description word count
      const words = (data.description.trim() ? data.description.trim().split(/\s+/) : []);
      setDescCount(words.length);
      
      // Set preview image if cover image exists
      if (data.coverImage) {
        setPreviewImage(`${API_URL}/classrooms/cover-image/${data.coverImage}`);
      } else {
        setPreviewImage(null);
      }
    }
  }, [classroom]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'description') {
      const words = (value.trim() ? value.trim().split(/\s+/) : []);
      if (words.length <= WORD_LIMIT_DESC) {
        setFormData(prev => ({ ...prev, [name]: value }));
        setDescCount(words.length);
      } else {
        const trimmed = words.slice(0, WORD_LIMIT_DESC).join(' ');
        setFormData(prev => ({ ...prev, [name]: trimmed }));
        setDescCount(WORD_LIMIT_DESC);
      }
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('coverImage', file);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/classrooms/${classroom._id}/cover-image`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setFormData(prev => ({ ...prev, coverImage: response.data.classroom.coverImage }));
      setPreviewImage(`${API_URL}/classrooms/cover-image/${response.data.classroom.coverImage}`);
      setSuccess('Cover image uploaded successfully!');
      
      // Call onUpdate to refresh parent component
      if (onUpdate) {
        onUpdate();
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    // Check if there are any changes
    const hasChanges = Object.keys(formData).some(key => 
      formData[key] !== originalData[key]
    );

    if (!hasChanges) {
      setError('No changes to save');
      return;
    }

    try {
      await dispatch(updateClassroom({
        id: classroom._id,
        data: {
          name: formData.name,
          description: formData.description,
          subject: formData.subject
        }
      })).unwrap();

      setOriginalData({ ...formData });
      setIsEditing(false);
      setSuccess('Classroom settings updated successfully!');
      
      // Call onUpdate to refresh parent component
      if (onUpdate) {
        onUpdate();
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating classroom:', error);
      setError(error || 'Failed to update classroom settings');
    }
  };

  const handleCancel = () => {
    setFormData({ ...originalData });
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const hasChanges = Object.keys(formData).some(key => 
    formData[key] !== originalData[key]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Classroom Settings</h2>
          <p className="text-gray-600">Manage your classroom information and appearance</p>
        </div>
        <div className="flex space-x-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Settings</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
          <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          </div>
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Cover Image Section */}
      <div className="bg-white rounded-lg p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cover Image</h3>
        <div className="space-y-4">
          {/* Image Preview */}
          <div className="flex justify-center">
            {previewImage ? (
              <div className="relative group">
                <img
                  src={previewImage}
                  alt="Classroom cover"
                  className="w-64 h-48 object-cover rounded-lg border shadow-sm"
                />
                <button
                  onClick={() => {
                    setPreviewImage(null);
                    setFormData(prev => ({ ...prev, coverImage: null }));
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-64 h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
                <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">No cover image</p>
              </div>
            )}
          </div>
          
          {/* Upload Controls */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Upload a cover image to personalize your classroom
            </p>
            <label className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              <Upload className="w-4 h-4" />
              <span>{isUploading ? 'Uploading...' : 'Choose Image'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Recommended: 400x300px • Max 5MB • JPEG, PNG, GIF, WebP
            </p>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h3>
        <div className="space-y-6">
          {/* Classroom Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Classroom Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
              placeholder="Enter classroom name"
            />
          </div>

          {/* Subject/Course Title */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Subject / Course Title
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
              placeholder="e.g., Mathematics, Computer Science"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={!isEditing}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-colors resize-none"
              placeholder="Brief description of the classroom..."
            />
            <div className="mt-2 flex justify-between items-center">
              <p className="text-xs text-gray-500">
                Provide a brief overview of what this classroom covers
              </p>
              <span className="text-xs text-gray-500 font-medium">
                {descCount}/{WORD_LIMIT_DESC} words
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Classroom Info Display */}
      <div className="bg-white rounded-lg p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Classroom Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Program</h4>
              <p className="text-gray-900 font-medium">{classroom.program}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Branch</h4>
              <p className="text-gray-900 font-medium">{classroom.branch}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Semester</h4>
              <p className="text-gray-900 font-medium">{classroom.semester}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Academic Year</h4>
              <p className="text-gray-900 font-medium">{classroom.academicYear}</p>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            </div>
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> Program, Branch, Semester, and Academic Year cannot be changed after classroom creation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassroomSettings;
