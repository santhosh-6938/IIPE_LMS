import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTeacherActivity, fetchUsers } from '../../store/slices/adminSlice';

const TeacherActivity = () => {
  const dispatch = useDispatch();
  const { teacherActivity, users, isLoading, error } = useSelector(state => state.admin);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [activityDays, setActivityDays] = useState(30);
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    loadTeachers();
  }, []);

  useEffect(() => {
    if (selectedTeacher || activityDays) {
      loadTeacherActivity();
    }
  }, [selectedTeacher, activityDays]);

  const loadTeachers = async () => {
    try {
      const result = await dispatch(fetchUsers({ role: 'teacher', limit: 100 })).unwrap();
      setTeachers(result.users || []);
    } catch (error) {
      console.error('Failed to load teachers:', error);
    }
  };

  const loadTeacherActivity = () => {
    const params = {
      days: activityDays,
      ...(selectedTeacher && { teacherId: selectedTeacher })
    };
    dispatch(fetchTeacherActivity(params));
  };

  const getActivitySummary = () => {
    if (!teacherActivity) return null;

    const totalClassrooms = teacherActivity.classrooms?.length || 0;
    const totalTasks = teacherActivity.tasks?.length || 0;
    const totalContent = teacherActivity.courseContent?.length || 0;

    return {
      totalClassrooms,
      totalTasks,
      totalContent,
      totalActivity: totalClassrooms + totalTasks + totalContent
    };
  };

  const getTeacherName = (teacher) => {
    if (!teacher) return 'Unknown Teacher';
    return typeof teacher === 'string' ? teacher : teacher.name || 'Unknown Teacher';
  };

  const getTeacherEmail = (teacher) => {
    if (!teacher) return 'Unknown Email';
    return typeof teacher === 'string' ? teacher : teacher.email || 'Unknown Email';
  };

  const activitySummary = getActivitySummary();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading teacher activity...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Teacher Activity Monitoring</h2>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Teacher</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Teachers</option>
              {teachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name} ({teacher.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Activity Period</label>
            <select
              value={activityDays}
              onChange={(e) => setActivityDays(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadTeacherActivity}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading teacher activity</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Summary */}
      {activitySummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Classrooms Created</p>
                <p className="text-2xl font-semibold text-gray-900">{activitySummary.totalClassrooms}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tasks Assigned</p>
                <p className="text-2xl font-semibold text-gray-900">{activitySummary.totalTasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Content Uploaded</p>
                <p className="text-2xl font-semibold text-gray-900">{activitySummary.totalContent}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Activity</p>
                <p className="text-2xl font-semibold text-gray-900">{activitySummary.totalActivity}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Details */}
      {teacherActivity && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Classrooms */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Classrooms</h3>
            </div>
            <div className="p-6">
              {teacherActivity.classrooms && teacherActivity.classrooms.length > 0 ? (
                <div className="space-y-4">
                  {teacherActivity.classrooms.slice(0, 5).map((classroom, index) => (
                    <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{classroom.name}</p>
                          <p className="text-xs text-gray-500">{classroom.subject}</p>
                          <p className="text-xs text-gray-400">by {getTeacherName(classroom.teacher)}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(classroom.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No classrooms created in this period</p>
              )}
            </div>
          </div>

          {/* Tasks */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Tasks</h3>
            </div>
            <div className="p-6">
              {teacherActivity.tasks && teacherActivity.tasks.length > 0 ? (
                <div className="space-y-4">
                  {teacherActivity.tasks.slice(0, 5).map((task, index) => (
                    <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{task.title}</p>
                          <p className="text-xs text-gray-500">{task.classroom?.name}</p>
                          <p className="text-xs text-gray-400">by {getTeacherName(task.teacher)}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No tasks assigned in this period</p>
              )}
            </div>
          </div>

          {/* Course Content */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Content</h3>
            </div>
            <div className="p-6">
              {teacherActivity.courseContent && teacherActivity.courseContent.length > 0 ? (
                <div className="space-y-4">
                  {teacherActivity.courseContent.slice(0, 5).map((content, index) => (
                    <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{content.title}</p>
                          <p className="text-xs text-gray-500">{content.type}</p>
                          <p className="text-xs text-gray-400">by {getTeacherName(content.uploadedBy)}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(content.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No content uploaded in this period</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      {teacherActivity && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[
                ...(teacherActivity.classrooms || []).map(item => ({ ...item, type: 'classroom' })),
                ...(teacherActivity.tasks || []).map(item => ({ ...item, type: 'task' })),
                ...(teacherActivity.courseContent || []).map(item => ({ ...item, type: 'content' }))
              ]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 10)
                .map((item, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${item.type === 'classroom' ? 'bg-blue-500' :
                        item.type === 'task' ? 'bg-yellow-500' :
                          'bg-purple-500'
                      }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {item.type === 'classroom' ? 'Created classroom: ' + item.name :
                          item.type === 'task' ? 'Assigned task: ' + item.title :
                            'Uploaded content: ' + item.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        by {getTeacherName(item.teacher || item.uploadedBy)} • {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* No Data Message */}
      {!teacherActivity && !isLoading && !error && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Data</h3>
          <p className="text-gray-500">Select a teacher and time period to view activity data.</p>
        </div>
      )}
    </div>
  );
};

export default TeacherActivity;
