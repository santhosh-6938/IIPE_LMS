import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClassrooms, createClassroom } from '../../store/slices/classroomSlice';
import { fetchTasks, fetchTaskCount } from '../../store/slices/taskSlice';
import { fetchNotifications } from '../../store/slices/notificationSlice';
import ClassroomCard from './ClassroomCard';
import CreateClassroomModal from './CreateClassroomModal';
import TaskSummary from './TaskSummary';
import NotificationPanel from '../common/NotificationPanel';
import { Plus, Users, BookOpen, Bell, BarChart3 } from 'lucide-react';
import { isAfter, isBefore } from 'date-fns';

const TeacherDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { classrooms, isLoading } = useSelector(state => state.classroom);
  const { tasks, taskCount } = useSelector(state => state.task);
  const { unreadCount } = useSelector(state => state.notification);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [tab, setTab] = useState('active'); // 'active' | 'archived'

  useEffect(() => {
    dispatch(fetchClassrooms({ includeArchived: tab === 'archived' }));
    dispatch(fetchTasks());
    dispatch(fetchTaskCount());
    dispatch(fetchNotifications());
  }, [dispatch, tab]);

  const visibleClassrooms = tab === 'archived' ? classrooms.filter(c => c.isArchived) : classrooms.filter(c => !c.isArchived);
  const totalStudents = visibleClassrooms.reduce((total, classroom) => total + (classroom.students?.length || 0), 0);
  const totalTasks = taskCount;

  // Group tasks by classroom for per-class summaries and counts
  const tasksByClassroom = tasks.reduce((acc, task) => {
    const clsId = (typeof task.classroom === 'object' ? task.classroom?._id : task.classroom) || 'unknown';
    if (!acc[clsId]) acc[clsId] = [];
    acc[clsId].push(task);
    return acc;
  }, {});
  
  // Calculate task statistics
  const getTaskStatus = (task) => {
    if (!task.deadline) return 'pending';
    const now = new Date();
    const deadline = new Date(task.deadline);
    if (isAfter(now, deadline)) return 'overdue';
    if (isBefore(now, deadline)) return 'pending';
    return 'due-today';
  };
  
  const overdueTasks = tasks.filter(task => getTaskStatus(task) === 'overdue').length;
  const pendingTasks = tasks.filter(task => getTaskStatus(task) === 'pending').length;

  return (
    <div className="min-h-screen dark:bg-gray-950">
      <header className="bg-gradient-to-r from-brandBlue via-brandNavy to-brandBlue text-white shadow-sm border-b border-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
              <p className="opacity-90 mt-1">Welcome back, {user?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-white/90 hover:text-brandGold transition-colors"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brandOrange text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-brandOrange text-white px-4 py-2 rounded-lg hover:brightness-110 transition-colors flex items-center space-x-2 shadow-brand"
              >
                <Plus className="w-4 h-4" />
                <span>Create Classroom</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs for Active / Archived */}
        <div className="mb-6 border-b">
          <nav className="flex space-x-6">
            {['active','archived'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`py-2 px-1 border-b-2 text-sm font-medium ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'}`}
              >
                {t === 'active' ? 'Active' : 'Archived'}
              </button>
            ))}
          </nav>
        </div>
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-gray-800 rounded-lg ring-1 ring-blue-200 dark:ring-gray-700">
                <Users className="w-8 h-8 text-brandBlue dark:text-brandGold" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                <p className="text-gray-600">Total Students</p>
                {visibleClassrooms.length > 0 && (
                  <div className="mt-3 space-y-1 max-h-28 overflow-y-auto pr-1">
                    {visibleClassrooms.map(cls => (
                      <div key={cls._id} className="text-xs text-gray-600 flex items-center justify-between">
                        <span className="truncate mr-2">{cls.name}</span>
                        <span className="text-gray-900 font-medium">{cls.students?.length || 0}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-gray-800 rounded-lg ring-1 ring-green-200 dark:ring-gray-700">
                <BookOpen className="w-8 h-8 text-brandGreen" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{visibleClassrooms.length}</p>
                <p className="text-gray-600">{tab === 'archived' ? 'Archived Classrooms' : 'Active Classrooms'}</p>
              </div>
            </div>
          </div>
          
          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 dark:bg-gray-800 rounded-lg ring-1 ring-orange-200 dark:ring-gray-700">
                <BarChart3 className="w-8 h-8 text-brandOrange" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
                <p className="text-gray-600">Total Tasks</p>
                <p className="text-sm text-brandBlue">{overdueTasks} overdue</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Classrooms */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">My Classrooms</h2>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : visibleClassrooms.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{tab === 'archived' ? 'No archived classrooms' : 'No classrooms yet'}</h3>
                {tab !== 'archived' && (
                  <>
                    <p className="text-gray-600 mb-6">Create your first classroom to get started</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Classroom
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {visibleClassrooms.map((classroom) => (
                  <ClassroomCard key={classroom._id} classroom={classroom} tasksByClassroom={tasksByClassroom} />
                ))}
              </div>
            )}
          </div>

          {/* Single Consolidated Task Summary (all classes) */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Task Summary</h2>
              </div>
              <div className="space-y-3">
                {visibleClassrooms.map((cls) => {
                  const list = tasksByClassroom[cls._id] || [];
                  if (list.length === 0) return null;
                  return (
                    <div key={cls._id} className="p-3 rounded-lg border hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900 truncate">{cls.name}</div>
                        <button
                          onClick={() => window.location.assign(`/teacher/classroom/${cls._id}?tab=tasks`)}
                          className="text-sm text-brandBlue hover:underline"
                        >
                          View Tasks
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {['overdue','due-today','pending','completed'].map((key) => {
                          const counts = list.reduce((acc, t) => {
                            const now = new Date();
                            const hasDeadline = Boolean(t.deadline);
                            const deadline = hasDeadline ? new Date(t.deadline) : null;
                            const isCompleted = Array.isArray(t.submissions) && t.submissions.length >= (t.maxSubmissions || 1);
                            let status = 'pending';
                            if (!hasDeadline) status = 'pending';
                            else if (now > deadline) status = 'overdue';
                            else if (now < deadline) status = 'pending';
                            else status = 'due-today';
                            acc[status]++;
                            if (isCompleted) acc.completed++;
                            return acc;
                          }, { overdue:0, 'due-today':0, pending:0, completed:0 });
                          const value = counts[key];
                          const labelMap = { overdue:'Overdue', 'due-today':'Due Today', pending:'Pending', completed:'Completed' };
                          const colorMap = { overdue:'text-red-600', 'due-today':'text-yellow-600', pending:'text-brandBlue', completed:'text-brandGreen' };
                          return (
                            <div key={key} className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2">
                              <span className="text-sm text-gray-600">{labelMap[key]}</span>
                              <span className={`font-semibold ${colorMap[key]}`}>{value}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {classrooms.every(c => (tasksByClassroom[c._id] || []).length === 0) && (
                  <p className="text-sm text-gray-600">No tasks yet across your classrooms.</p>
                )}
              </div>
            </div>
            {showNotifications && (
              <div className="lg:hidden">
                <NotificationPanel />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Notifications Panel - Desktop */}
      {showNotifications && (
        <div className="hidden lg:block fixed right-4 top-20 w-80 z-50">
          <NotificationPanel />
        </div>
      )}

      {/* Create Classroom Modal */}
      {showCreateModal && (
        <CreateClassroomModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;