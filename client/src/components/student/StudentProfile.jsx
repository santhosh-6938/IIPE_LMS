import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { loadUser } from '../../store/slices/authSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const StudentProfile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    course: '',
    year: '',
    semester: '',
    department: '',
    dateOfBirth: '',
    city: '',
    state: '',
    bio: ''
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/profile/me`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setData(res.data);

        // Initialize form data
        const userData = res.data.user;
        setFormData({
          phone: userData.phone || '',
          course: userData.course || '',
          year: userData.year || '',
          semester: userData.semester || '',
          department: userData.department || '',
          dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split('T')[0] : '',
          city: userData.address?.city || '',
          state: userData.address?.state || '',
          bio: userData.bio || ''
        });

        if (userData.profilePhoto) {
          setProfilePhotoPreview(`${API_URL.replace('/api', '')}/${userData.profilePhoto}`);
        }
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => setProfilePhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();

      // Add form fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Add profile photo if selected
      if (profilePhoto) {
        formDataToSend.append('profilePhoto', profilePhoto);
      }

      const res = await axios.put(`${API_URL}/profile/update`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setData(prev => ({
        ...prev,
        user: res.data.user,
        profileCompletion: res.data.profileCompletion
      }));

      // Update the user data in Redux store
      dispatch(loadUser());

      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original values
    const userData = data.user;
    setFormData({
      phone: userData.phone || '',
      course: userData.course || '',
      year: userData.year || '',
      semester: userData.semester || '',
      department: userData.department || '',
      dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split('T')[0] : '',
      city: userData.address?.city || '',
      state: userData.address?.state || '',
      bio: userData.bio || ''
    });
    setProfilePhoto(null);
    if (userData.profilePhoto) {
      setProfilePhotoPreview(`${API_URL.replace('/api', '')}/${userData.profilePhoto}`);
    } else {
      setProfilePhotoPreview(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const active = data?.classrooms?.active || [];
  const archived = data?.classrooms?.archived || [];
  const overview = data?.attendanceOverview || { overallPercentage: 0, perClassroom: [] };
  const profileCompletion = data?.profileCompletion || 0;
  const userData = data?.user;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                {profilePhotoPreview ? (
                  <img
                    src={profilePhotoPreview}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {userData?.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                {isEditing && (
                  <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{userData?.name}</h1>
                <p className="text-gray-600">{userData?.email}</p>
                <p className="text-sm text-gray-500">Roll Number: {userData?.rollNumber}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <p className="text-4xl font-bold text-blue-600">{overview.overallPercentage}%</p>
                <p className="text-gray-600">Overall attendance</p>
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${profileCompletion}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">Profile: {profileCompletion}% Complete</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {successMessage}
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-6 border-b">
          <nav className="flex space-x-6">
            {[
              { id: 'profile', label: 'Profile' },
              { id: 'overview', label: 'Overview' },
              { id: 'archived', label: 'Archived' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${tab === t.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                  }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={userData?.name || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={userData?.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                  <input
                    type="text"
                    value={userData?.rollNumber || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Enter your phone number"
                    className={`w-full px-3 py-2 border rounded-lg ${isEditing
                        ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        : 'border-gray-300 bg-gray-50 text-gray-500'
                      }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-lg ${isEditing
                        ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        : 'border-gray-300 bg-gray-50 text-gray-500'
                      }`}
                  />
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course/Program</label>
                  <select
                    name="course"
                    value={formData.course}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-lg ${isEditing
                        ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        : 'border-gray-300 bg-gray-50 text-gray-500'
                      }`}
                  >
                    <option value="">Select Course</option>
                    <option value="B.Tech">B.Tech</option>
                    <option value="M.Tech">M.Tech</option>
                    <option value="B.Sc">B.Sc</option>
                    <option value="M.Sc">M.Sc</option>
                    <option value="BBA">BBA</option>
                    <option value="MBA">MBA</option>
                    <option value="BCA">BCA</option>
                    <option value="MCA">MCA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-lg ${isEditing
                        ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        : 'border-gray-300 bg-gray-50 text-gray-500'
                      }`}
                  >
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="5th Year">5th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-lg ${isEditing
                        ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        : 'border-gray-300 bg-gray-50 text-gray-500'
                      }`}
                  >
                    <option value="">Select Semester</option>
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="3rd Semester">3rd Semester</option>
                    <option value="4th Semester">4th Semester</option>
                    <option value="5th Semester">5th Semester</option>
                    <option value="6th Semester">6th Semester</option>
                    <option value="7th Semester">7th Semester</option>
                    <option value="8th Semester">8th Semester</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-lg ${isEditing
                        ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        : 'border-gray-300 bg-gray-50 text-gray-500'
                      }`}
                  >
                    <option value="">Select Department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Civil">Civil</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Business Administration">Business Administration</option>
                    <option value="Commerce">Commerce</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Enter your city"
                    className={`w-full px-3 py-2 border rounded-lg ${isEditing
                        ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        : 'border-gray-300 bg-gray-50 text-gray-500'
                      }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Enter your state"
                    className={`w-full px-3 py-2 border rounded-lg ${isEditing
                        ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        : 'border-gray-300 bg-gray-50 text-gray-500'
                      }`}
                  />
                </div>
              </div>
            </div>

            {/* Bio/Description */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">About Me</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description/Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself, your interests, goals, and hobbies..."
                  rows={4}
                  maxLength={500}
                  className={`w-full px-3 py-2 border rounded-lg resize-none ${isEditing
                      ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      : 'border-gray-300 bg-gray-50 text-gray-500'
                    }`}
                />
                <p className="text-sm text-gray-500 mt-1">{formData.bio.length}/500 characters</p>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancel}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Enrolled Classrooms</h2>
              {active.length === 0 ? (
                <p className="text-gray-600">No active classrooms.</p>
              ) : (
                <ul className="divide-y">
                  {active.map(c => (
                    <li key={c._id} className="py-3">
                      <p className="font-medium text-gray-900">{c.name}</p>
                      <p className="text-sm text-gray-600">{c.program} • {c.branch} • {c.academicYear} • {c.semester}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance by Classroom</h2>
              {overview.perClassroom.length === 0 ? (
                <p className="text-gray-600">No attendance data.</p>
              ) : (
                <ul className="space-y-2">
                  {overview.perClassroom.map(p => (
                    <li key={p.classroomId} className="flex items-center justify-between">
                      <span className="text-gray-800">{p.classroomName}</span>
                      <span className="font-semibold text-blue-600">{p.percentage}%</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Archived Tab */}
        {tab === 'archived' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Archived Classrooms</h2>
            {archived.length === 0 ? (
              <p className="text-gray-600">No archived classrooms.</p>
            ) : (
              <ul className="divide-y">
                {archived.map(c => (
                  <li key={c._id} className="py-3">
                    <p className="font-medium text-gray-900">{c.name}</p>
                    <p className="text-sm text-gray-600">{c.program} • {c.branch} • {c.academicYear} • {c.semester}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;
