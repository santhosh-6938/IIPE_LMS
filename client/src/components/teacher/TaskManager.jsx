import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchTasks } from '../../store/slices/taskSlice';
import CreateTaskModal from './CreateTaskModal';
import { Plus, FileText, Calendar, Users, Clock, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';

const TaskManager = ({ classroomId, onUpdate }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tasks, isLoading } = useSelector(state => state.task);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    dispatch(fetchTasks(classroomId));
  }, [dispatch, classroomId]);

  // Call onUpdate when tasks change
  useEffect(() => {
    if (onUpdate && tasks.length >= 0) {
      // Only call onUpdate when tasks actually change, not on every render
      const timeoutId = setTimeout(() => {
        onUpdate();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [tasks.length, onUpdate]); // Only depend on tasks.length, not the entire tasks array

  const getTaskStatus = (task) => {
    if (!task.deadline) return 'pending';
    
    const now = new Date();
    const deadline = new Date(task.deadline);
    
    if (isAfter(now, deadline)) {
      return 'overdue';
    } else if (isBefore(now, deadline)) {
      return 'pending';
    } else {
      return 'due-today';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'due-today':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />;
      case 'due-today':
        return <Clock className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const status = getTaskStatus(task);
    if (filterStatus === 'all') return true;
    return status === filterStatus;
  });

  const getSubmissionProgress = (task) => {
    const totalStudents = task.classroom?.students?.length || 0;
    const submittedCount = task.submissions?.length || 0;
    const percentage = totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0;
    
    return {
      submitted: submittedCount,
      total: totalStudents,
      percentage: Math.round(percentage)
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Task Management</h2>
          <p className="text-gray-600">Create and manage assignments for your students</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Task</span>
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-700">Filter by status:</span>
        <div className="flex space-x-2">
          {[
            { value: 'all', label: 'All', color: 'bg-gray-100 text-gray-800' },
            { value: 'pending', label: 'Pending', color: 'bg-blue-100 text-blue-800' },
            { value: 'due-today', label: 'Due Today', color: 'bg-yellow-100 text-yellow-800' },
            { value: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800' },
            { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' }
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setFilterStatus(filter.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filterStatus === filter.value
                  ? filter.color
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 border animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center border">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600 mb-6">
            {filterStatus === 'all' 
              ? 'Create your first task to get started'
              : `No ${filterStatus} tasks found`
            }
          </p>
          {filterStatus === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Task
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => {
            const status = getTaskStatus(task);
            const progress = getSubmissionProgress(task);
            
            return (
              <div key={task._id} className="bg-white rounded-lg p-6 border hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {task.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {task.description}
                    </p>
                  </div>
                  <div className={`ml-3 p-2 rounded-full border ${getStatusColor(status)}`}>
                    {getStatusIcon(status)}
                  </div>
                </div>

                <div className="space-y-3">
                  {task.deadline && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>
                        Due: {format(new Date(task.deadline), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>
                      {progress.submitted}/{progress.total} students submitted
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        progress.percentage >= 80 ? 'bg-green-500' :
                        progress.percentage >= 50 ? 'bg-yellow-500' :
                        progress.percentage >= 20 ? 'bg-blue-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${progress.percentage}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{progress.percentage}% completed</span>
                    <span>Max: {task.maxSubmissions} submission{task.maxSubmissions > 1 ? 's' : ''}</span>
                  </div>

                  {task.attachments && task.attachments.length > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FileText className="w-4 h-4 mr-2" />
                      <span>{task.attachments.length} attachment{task.attachments.length > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={() => navigate(`/teacher/task/${task._id}`)}
                    className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          classroomId={classroomId}
        />
      )}
    </div>
  );
};

export default TaskManager; 