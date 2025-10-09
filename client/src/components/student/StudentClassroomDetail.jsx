import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchClassrooms } from '../../store/slices/classroomSlice';
import { fetchTasks, isTaskCompletedForUser, fetchMySubmission } from '../../store/slices/taskSlice';
import CourseContentViewer from './CourseContentViewer';
import StudentAttendanceView from './StudentAttendanceView';
import StudentTaskCard from './StudentTaskCard';
import { ArrowLeft, Users, FileText, BookOpen, Calendar, User, CheckSquare, Clock, AlertCircle } from 'lucide-react';
import { fetchGroupInteractions, postGroupInteraction } from '../../store/slices/taskSlice';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const GroupMessages = ({ task }) => {
  const dispatch = useDispatch();
  const { tasks } = useSelector(state => state.task);
  const { user } = useSelector(state => state.auth);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const current = tasks.find(t => t._id === task._id) || task;
  const messages = current.groupInteractionMessages || [];

  useEffect(() => {
    dispatch(fetchGroupInteractions({ taskId: task._id }));
    const interval = setInterval(() => {
      dispatch(fetchGroupInteractions({ taskId: task._id }));
    }, 5000);
    return () => clearInterval(interval);
  }, [dispatch, task._id]);

  const send = async () => {
    if (!input.trim()) return;
    try {
      setLoading(true);
      await dispatch(postGroupInteraction({ taskId: task._id, message: input.trim() })).unwrap();
      setInput('');
    } catch (e) {
      // noop toast here is optional; keep UI simple
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-medium text-gray-900">{task.title}</p>
          <p className="text-xs text-gray-500">Group chat (submitted students & teacher)</p>
        </div>
        <button
          className="text-sm text-blue-600 hover:underline"
          onClick={() => dispatch(fetchGroupInteractions({ taskId: task._id }))}
        >
          Refresh
        </button>
      </div>
      <div className="max-h-56 overflow-y-auto bg-gray-50 border rounded p-3 space-y-2">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500">No messages yet.</p>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${ ((m.sender && (m.sender._id || m.sender))?.toString?.() === user?._id?.toString?.()) ? 'justify-end' : 'justify-start' }`}>
              <div className={`${ (m.senderRole === 'teacher') ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border' } rounded px-3 py-2 max-w-[75%]`}>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-medium">
                    {(m.senderRole === 'teacher' ? 'Teacher' : 'Student') + ' – ' + (m.sender?.name || '')}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${m.senderRole === 'teacher' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                    {m.senderRole === 'teacher' ? 'Teacher' : 'Student'}
                  </span>
                </div>
                {m.message && (
                  <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                )}
                <div className={`text-[10px] mt-1 ${ (m.senderRole === 'teacher') ? 'text-blue-100' : 'text-gray-400' }`}>
                  {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-3 flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className={`px-4 py-2 rounded text-white ${loading || !input.trim() ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

const StudentClassroomDetail = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { classrooms } = useSelector(state => state.classroom);
  const { tasks, isLoading: tasksLoading } = useSelector(state => state.task);
  const { user } = useSelector(state => state.auth);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedChatTaskId, setSelectedChatTaskId] = useState(null);
  const [materialsCount, setMaterialsCount] = useState(0);

  const classroom = classrooms.find(c => c._id === classroomId);

  useEffect(() => {
    if (!classroom) {
      dispatch(fetchClassrooms());
    }
  }, [classroom, dispatch]);

  // Fetch tasks for this classroom
  useEffect(() => {
    if (classroomId) {
      dispatch(fetchTasks(classroomId));
    }
  }, [classroomId, dispatch]);

  // Fetch course materials count for quick stats (public items only for students)
  useEffect(() => {
    const loadCount = async () => {
      if (!classroomId) return;
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/course-content/classroom/${classroomId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const publicItems = Array.isArray(res.data) ? res.data.filter(i => i.isPublic) : [];
        setMaterialsCount(publicItems.length);
      } catch (e) {
        setMaterialsCount(0);
      }
    };
    loadCount();
  }, [classroomId]);

  // Fetch submission statuses only when viewing the Tasks tab to reduce background load
  useEffect(() => {
    if (activeTab !== 'tasks') return;
    if (!user?._id) return;
    const ids = (tasks || [])
      .filter(t => t.classroom?._id === classroomId || t.classroom === classroomId)
      .map(t => t._id)
      .filter(Boolean);
    if (ids.length === 0) return;
    let cancelled = false;
    const BATCH_SIZE = 6;
    const DELAY_MS = 250;
    const run = async () => {
      for (let i = 0; i < ids.length && !cancelled; i += BATCH_SIZE) {
        const batch = ids.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(id => dispatch(fetchMySubmission(id)))).catch(() => {});
        if (i + BATCH_SIZE < ids.length) {
          await new Promise(r => setTimeout(r, DELAY_MS));
        }
      }
    };
    run();
    return () => { cancelled = true; };
  }, [activeTab, dispatch, tasks, classroomId, user?._id]);

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

  // Filter tasks for this classroom
  const classroomTasks = tasks.filter(task => task.classroom?._id === classroomId || task.classroom === classroomId);
  
  // Task filtering logic
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

  const pendingTasks = classroomTasks.filter(task => {
    const submitted = hasStudentSubmitted(task);
    const hasDraft = hasStudentDraft(task);
    return !submitted && !hasDraft && (!task.deadline || isBefore(new Date(), new Date(task.deadline)));
  });

  const dueSoonTasks = pendingTasks.filter(task => 
    task.deadline && isBefore(new Date(), addDays(new Date(task.deadline), 3))
  );

  const draftTasks = classroomTasks.filter(task => hasStudentDraft(task));

  const overdueTasks = classroomTasks.filter(task => {
    const submitted = hasStudentSubmitted(task);
    return !submitted && task.deadline && isAfter(new Date(), new Date(task.deadline));
  });

  const completedTasks = classroomTasks.filter(task => hasStudentSubmitted(task));

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'tasks', label: 'Tasks', icon: FileText },
    { id: 'messages', label: 'Messages', icon: Users },
    { id: 'content', label: 'Course Materials', icon: BookOpen },
    { id: 'attendance', label: 'My Attendance', icon: CheckSquare },
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
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">
                        Teacher: {classroom.teacher?.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {classroom.teacher?.email}
                      </span>
                    </div>
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
                    <p className="text-gray-600">Classmates</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 border">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <FileText className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{materialsCount}</p>
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
                    <p className="text-2xl font-bold text-gray-900">{pendingTasks.length}</p>
                    <p className="text-gray-600">Pending Tasks</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Classmates */}
            <div className="bg-white rounded-lg p-6 border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Classmates</h3>
              {classroom.students && classroom.students.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classroom.students.map((student) => (
                    <div key={student._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-600">{student.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No other students in this classroom yet</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'tasks':
        return (
          <div className="space-y-6">
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

            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Tasks</h2>
                <div className="space-y-4">
                  {pendingTasks.map(task => (
                    <StudentTaskCard key={task._id} task={task} />
                  ))}
                </div>
              </section>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Completed Tasks</h2>
                <div className="space-y-4">
                  {completedTasks.map(task => (
                    <StudentTaskCard key={task._id} task={task} />
                  ))}
                </div>
              </section>
            )}

            {/* No Tasks */}
            {classroomTasks.length === 0 && !tasksLoading && (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
                <p className="text-gray-600">Your teacher hasn't assigned any tasks for this classroom yet.</p>
              </div>
            )}

            {/* Loading State */}
            {tasksLoading && (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading tasks...</p>
              </div>
            )}
          </div>
        );
      case 'content':
        return <CourseContentViewer classroomId={classroomId} />;
      case 'attendance':
        return <StudentAttendanceView />;
      case 'messages':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Completed Tasks</h2>
              {completedTasks.length === 0 ? (
                <p className="text-gray-600">Complete a task to join the group discussion.</p>
              ) : (
                <div className="space-y-3">
                  {/* Lightweight list with lazy chat load */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {completedTasks.map(task => (
                      <button
                        key={task._id}
                        onClick={() => setSelectedChatTaskId(task._id)}
                        className={`text-left border rounded p-3 hover:border-blue-400 ${selectedChatTaskId === task._id ? 'border-blue-500' : ''}`}
                      >
                        <p className="font-medium text-gray-900">{task.title}</p>
                        <p className="text-xs text-gray-500">Open group chat</p>
                      </button>
                    ))}
                  </div>

                  {selectedChatTaskId && (
                    <GroupMessages key={selectedChatTaskId} task={completedTasks.find(t => t._id === selectedChatTaskId)} />
                  )}
                </div>
              )}
            </div>
          </div>
        );
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
                onClick={() => navigate('/student/dashboard')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{classroom.name}</h1>
                <p className="text-gray-600">{classroom.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                Teacher: {classroom.teacher?.name}
              </span>
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
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
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

export default StudentClassroomDetail;
