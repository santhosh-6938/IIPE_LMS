import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClassrooms, fetchTasks, fetchStatistics } from '../../store/slices/adminSlice';

const SystemMonitoring = () => {
  const dispatch = useDispatch();
  const { classrooms, tasks, statistics, pagination } = useSelector(state => state.admin);
  const [activeTab, setActiveTab] = useState('overview');
  const [classroomPage, setClassroomPage] = useState(1);
  const [taskPage, setTaskPage] = useState(1);

  useEffect(() => {
    dispatch(fetchStatistics());
    loadClassrooms();
    loadTasks();
  }, [dispatch]);

  useEffect(() => {
    loadClassrooms();
  }, [classroomPage]);

  useEffect(() => {
    loadTasks();
  }, [taskPage]);

  const loadClassrooms = () => {
    dispatch(fetchClassrooms({ page: classroomPage, limit: 10 }));
  };

  const loadTasks = () => {
    dispatch(fetchTasks({ page: taskPage, limit: 10 }));
  };

  const tabs = [
    { id: 'overview', name: 'System Overview', icon: '📊' },
    { id: 'classrooms', name: 'Classrooms', icon: '🏫' },
    { id: 'tasks', name: 'Tasks', icon: '📝' }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-green-800">System Status</h3>
              <p className="text-green-600">All systems operational</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-blue-800">Performance</h3>
              <p className="text-blue-600">Excellent</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-yellow-800">Uptime</h3>
              <p className="text-yellow-600">99.9%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Statistics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Users</span>
                <span className="text-lg font-semibold text-gray-900">{statistics.statistics.users.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Teachers</span>
                <span className="text-lg font-semibold text-blue-600">{statistics.statistics.users.teachers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Students</span>
                <span className="text-lg font-semibold text-green-600">{statistics.statistics.users.students}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Admins</span>
                <span className="text-lg font-semibold text-purple-600">{statistics.statistics.users.admins}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Statistics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Classrooms</span>
                <span className="text-lg font-semibold text-gray-900">{statistics.statistics.content.classrooms}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Tasks</span>
                <span className="text-lg font-semibold text-gray-900">{statistics.statistics.content.tasks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Course Content</span>
                <span className="text-lg font-semibold text-gray-900">{statistics.statistics.content.courseContent}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {statistics && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent System Activity</h3>
          <div className="space-y-3">
            {statistics.recent.classrooms.slice(0, 5).map((classroom, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">New classroom created: {classroom.name}</p>
                  <p className="text-xs text-gray-500">by {classroom.teacher?.name}</p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(classroom.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderClassrooms = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">All Classrooms</h3>
        <span className="text-sm text-gray-500">
          Total: {pagination.classrooms?.totalClassrooms || 0}
        </span>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Classroom
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Teacher
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Students
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {classrooms.map((classroom) => (
              <tr key={classroom._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{classroom.name}</div>
                    <div className="text-sm text-gray-500">{classroom.subject}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{classroom.teacher?.name}</div>
                  <div className="text-sm text-gray-500">{classroom.teacher?.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {classroom.students?.length || 0} students
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(classroom.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.classrooms && pagination.classrooms.total > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {pagination.classrooms.current} of {pagination.classrooms.total}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setClassroomPage(Math.max(1, classroomPage - 1))}
              disabled={classroomPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setClassroomPage(Math.min(pagination.classrooms.total, classroomPage + 1))}
              disabled={classroomPage === pagination.classrooms.total}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderTasks = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">All Tasks</h3>
        <span className="text-sm text-gray-500">
          Total: {pagination.tasks?.totalTasks || 0}
        </span>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Classroom
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Teacher
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submissions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tasks.map((task) => (
              <tr key={task._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{task.title}</div>
                    <div className="text-sm text-gray-500">{task.description.substring(0, 50)}...</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {task.classroom?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{task.teacher?.name}</div>
                  <div className="text-sm text-gray-500">{task.teacher?.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {task.submissions?.length || 0} submissions
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${task.status === 'active' ? 'bg-green-100 text-green-800' :
                      task.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                    {task.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.tasks && pagination.tasks.total > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {pagination.tasks.current} of {pagination.tasks.total}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setTaskPage(Math.max(1, taskPage - 1))}
              disabled={taskPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setTaskPage(Math.min(pagination.tasks.total, taskPage + 1))}
              disabled={taskPage === pagination.tasks.total}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'classrooms':
        return renderClassrooms();
      case 'tasks':
        return renderTasks();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
};

export default SystemMonitoring;
