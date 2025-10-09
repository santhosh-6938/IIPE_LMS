import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchClassrooms } from '../../store/slices/classroomSlice';
import CourseContentManager from './CourseContentManager';
import StudentManager from './StudentManager';
import TaskManager from './TaskManager';
import AttendanceManager from './AttendanceManager';
import ClassroomSettings from './ClassroomSettings';
import { ArrowLeft, Users, FileText, Settings, BookOpen, Calendar, Clock, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const ClassroomDetail = () => {
  const { classroomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { classrooms } = useSelector(state => state.classroom);
  const [activeTab, setActiveTab] = useState('overview');
  const [courseContentCount, setCourseContentCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const classroom = classrooms.find(c => c._id === classroomId);

  useEffect(() => {
    if (!classroom) {
      dispatch(fetchClassrooms());
    }
  }, [classroom, dispatch]);

  // Initialize active tab from query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Fetch counts for overview
  useEffect(() => {
    if (classroom) {
      fetchCounts();
    }
  }, [classroom]); // Remove refreshKey dependency to prevent infinite loop

  // Refresh counts when content tab is active
  useEffect(() => {
    if (activeTab === 'content') {
      fetchCounts();
    }
  }, [activeTab]);

  // Refresh counts when component mounts
  useEffect(() => {
    fetchCounts();
  }, [classroomId]);

  const fetchCounts = async () => {
    // Prevent multiple simultaneous calls
    if (isUpdating) {
      return;
    }

    try {
      setIsUpdating(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch course content count
      try {
        const contentResponse = await axios.get(`${API_URL}/course-content/classroom/${classroomId}`, { headers });
        setCourseContentCount(contentResponse.data.length);
      } catch (contentError) {
        setCourseContentCount(0);
      }

      // Fetch task count
      try {
        const taskResponse = await axios.get(`${API_URL}/tasks/classroom/${classroomId}`, { headers });
        setTaskCount(taskResponse.data.length);
      } catch (taskError) {
        setTaskCount(0);
      }
    } catch (error) {
      // Only log actual errors, not expected ones
      if (error.response?.status !== 404) {
        console.error('Error fetching counts:', error);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Callback to refresh classroom data
  const handleClassroomUpdate = () => {
    // Only update if not already updating
    if (!isUpdating) {
      // Refresh classrooms to update students list after add/remove
      dispatch(fetchClassrooms());
      fetchCounts();
    }
  };

  // Join token functionality has been removed

  if (!classroom) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading classroom...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'tasks', label: 'Tasks', icon: Clock },
    { id: 'content', label: 'Course Content', icon: FileText },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: CheckSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Classroom Info */}
            <div className="bg-white rounded-lg p-6 border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Classroom Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{classroom.name}</h3>
                  <p className="text-gray-600 mb-4">{classroom.description}</p>
                  {classroom.subject && (
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="text-sm font-medium text-gray-700">Subject:</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {classroom.subject}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Created {format(new Date(classroom.createdAt), 'MMMM d, yyyy')}</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <Users className="w-5 h-5 text-gray-600" />
                    <span className="text-lg font-medium text-gray-900">
                      {classroom.students?.length || 0} Students
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">
                      Students can be added to this classroom by the teacher
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 border">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{classroom.students?.length || 0}</p>
                    <p className="text-gray-600">Enrolled Students</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <FileText className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{courseContentCount}</p>
                    <p className="text-gray-600">Course Materials</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <BookOpen className="w-8 h-8 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{taskCount}</p>
                    <p className="text-gray-600">Active Tasks</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg p-6 border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="text-center py-8">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No recent activity</p>
              </div>
            </div>
          </div>
        );
      case 'tasks':
        return <TaskManager classroomId={classroomId} onUpdate={handleClassroomUpdate} />;
      case 'content':
        return <CourseContentManager classroomId={classroomId} onUpdate={handleClassroomUpdate} />;
      case 'students':
        return <StudentManager classroom={classroom} onUpdate={handleClassroomUpdate} />;
      case 'attendance':
        return <AttendanceManager />;
      case 'settings':
        return <ClassroomSettings classroom={classroom} onUpdate={handleClassroomUpdate} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/teacher/dashboard')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-4">
                {classroom.coverImage && (
                  <img
                    src={`${API_URL}/classrooms/cover-image/${classroom.coverImage}`}
                    alt="Classroom cover"
                    className="w-8 h-8 object-cover rounded-lg border"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{classroom.name}</h1>
                  <p className="text-gray-600">{classroom.description}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </main>
    </div>
  );
};

export default ClassroomDetail;
