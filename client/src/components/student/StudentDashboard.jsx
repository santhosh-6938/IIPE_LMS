import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchClassrooms } from '../../store/slices/classroomSlice';
import { fetchTasks, isTaskCompletedForUser } from '../../store/slices/taskSlice';
import { fetchNotifications } from '../../store/slices/notificationSlice';
import StudentClassroomCard from './StudentClassroomCard';
import StudentTaskCard from './StudentTaskCard';
import NotificationPanel from '../common/NotificationPanel';
import { BookOpen, Clock, CheckCircle, Bell, Users, UserCircle } from 'lucide-react';
import { isAfter, isBefore, addDays } from 'date-fns';

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const { classrooms, isLoading } = useSelector(state => state.classroom);
  const { tasks } = useSelector(state => state.task);
  const { unreadCount } = useSelector(state => state.notification);

  useEffect(() => {
    dispatch(fetchClassrooms());
    dispatch(fetchTasks());
    dispatch(fetchNotifications());
  }, [dispatch]);

  // Refresh tasks when tab/window regains focus or becomes visible
  useEffect(() => {
    const onFocus = () => dispatch(fetchTasks());
    const onVisibility = () => { if (!document.hidden) dispatch(fetchTasks()); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [dispatch]);

  // Listen for task updates and refresh
  useEffect(() => {
    const handleTaskUpdate = () => {
      console.log('Task update event received, refreshing tasks...');
      dispatch(fetchTasks());
    };

    // Add event listener for task updates
    window.addEventListener('taskSubmitted', handleTaskUpdate);
    
    return () => {
      window.removeEventListener('taskSubmitted', handleTaskUpdate);
    };
  }, [dispatch]);

  // Force refresh tasks when component mounts or user changes
  useEffect(() => {
    if (user?._id) {
      console.log('User changed, refreshing tasks...');
      dispatch(fetchTasks());
    }
  }, [user?._id, dispatch]);

  // (reverted) No per-task submission refresh here

  // Refresh tasks periodically to ensure accurate counts
  useEffect(() => {
    const intervalId = setInterval(() => {
      dispatch(fetchTasks());
    }, 10000); // Refresh every 10 seconds
    return () => clearInterval(intervalId);
  }, [dispatch]);

  // Filter tasks by status
  const hasStudentSubmitted = (task) => {
    return isTaskCompletedForUser(task, user?._id);
  };

  const hasStudentDraft = (task) => {
    return task.submissions?.some(sub => {
      const subStudentId = typeof sub.student === 'object' ? sub.student?._id : sub.student;
      if (!(subStudentId && user?._id && subStudentId.toString() === user._id)) return false;
      return sub.status === 'draft';
    });
  };

  const pendingTasks = tasks.filter(task => {
    const submitted = hasStudentSubmitted(task);
    const hasDraft = hasStudentDraft(task);
    return !submitted && !hasDraft && (!task.deadline || isBefore(new Date(), new Date(task.deadline)));
  });

  const dueSoonTasks = pendingTasks.filter(task => 
    task.deadline && isBefore(new Date(), addDays(new Date(task.deadline), 3))
  );

  const draftTasks = tasks.filter(task => hasStudentDraft(task));

  const overdueTasks = tasks.filter(task => {
    const submitted = hasStudentSubmitted(task);
    return !submitted && task.deadline && isAfter(new Date(), new Date(task.deadline));
  });

  const completedTasks = tasks.filter(task => hasStudentSubmitted(task));

  return (
    <div className="min-h-screen dark:bg-gray-950">
      <header className="bg-gradient-to-r from-brandBlue via-brandNavy to-brandBlue text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                {user?.profilePhoto ? (
                  <img 
                    src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}/${user.profilePhoto}`} 
                    alt="Profile" 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <UserCircle className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">Student Dashboard</h1>
                <p className="text-white/90 mt-1">Welcome back, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/student/profile')}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white/90 hover:text-white"
              >
                <UserCircle className="w-5 h-5" />
                <span>Profile</span>
              </button>
              <button className="relative p-2 text-white/90 hover:text-brandGold transition-colors">
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brandOrange text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg ring-1 ring-blue-200">
                <BookOpen className="w-8 h-8 text-brandBlue" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{classrooms.length}</p>
                <p className="text-gray-600">Enrolled Classes</p>
              </div>
            </div>
          </div>
          
          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg ring-1 ring-yellow-200">
                <Clock className="w-8 h-8 text-brandGold" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{pendingTasks.length}</p>
                <p className="text-gray-600">Pending Tasks</p>
              </div>
            </div>
          </div>
          
          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg ring-1 ring-green-200">
                <CheckCircle className="w-8 h-8 text-brandGreen" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{completedTasks.length}</p>
                <p className="text-gray-600">Completed</p>
              </div>
            </div>
          </div>
          
          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <Users className="w-8 h-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{overdueTasks.length}</p>
                <p className="text-gray-600">Overdue</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Urgent Tasks */}
            {(overdueTasks.length > 0 || dueSoonTasks.length > 0) && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Urgent Tasks</h2>
                <div className="space-y-4">
                  {overdueTasks.map(task => (
                    <StudentTaskCard key={task._id} task={task} isOverdue={true} />
                  ))}
                  {dueSoonTasks.map(task => (
                    <StudentTaskCard key={task._id} task={task} isDueSoon={true} />
                  ))}
                </div>
              </section>
            )}

            {/* Draft Tasks */}
            {draftTasks.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Draft Tasks</h2>
                <div className="space-y-4">
                  {draftTasks.map(task => (
                    <StudentTaskCard key={task._id} task={task} />
                  ))}
                </div>
              </section>
            )}

            {/* My Classrooms */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">My Classrooms</h2>
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
              ) : classrooms.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No classrooms enrolled</h3>
                  <p className="text-gray-600 mb-6">Ask your teacher for a join link to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {classrooms.map((classroom) => (
                    <StudentClassroomCard key={classroom._id} classroom={classroom} />
                  ))}
                </div>
              )}
            </section>

            {/* Recent Tasks */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Tasks</h2>
              {pendingTasks.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                  <p className="text-gray-600">You have no pending tasks at the moment.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingTasks.slice(0, 5).map(task => (
                    <StudentTaskCard key={task._id} task={task} />
                  ))}
                </div>
              )}
            </section>

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Completed Tasks</h2>
                <div className="space-y-4">
                  {completedTasks.slice(0, 3).map(task => (
                    <StudentTaskCard key={task._id} task={task} />
                  ))}
                  {completedTasks.length > 3 && (
                    <div className="text-center">
                      <button 
                        onClick={() => navigate('/student/tasks/completed')}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View all {completedTasks.length} completed tasks →
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <NotificationPanel />
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;