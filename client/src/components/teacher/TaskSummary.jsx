import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';

const TaskSummary = ({ tasks, classroomId }) => {
  const navigate = useNavigate();

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

  const overdueTasks = tasks.filter(task => getTaskStatus(task) === 'overdue');
  const pendingTasks = tasks.filter(task => getTaskStatus(task) === 'pending');
  const dueTodayTasks = tasks.filter(task => getTaskStatus(task) === 'due-today');
  const completedTasks = tasks.filter(task => 
    task.submissions && task.submissions.length >= (task.maxSubmissions || 1)
  );

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Task Summary</h2>
        <button
          onClick={() => navigate(`/teacher/classroom/${classroomId}?tab=tasks`)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View All
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Overdue</p>
              <p className="text-sm text-gray-500">{overdueTasks.length} tasks</p>
            </div>
          </div>
          <span className="text-red-600 font-semibold">{overdueTasks.length}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Due Today</p>
              <p className="text-sm text-gray-500">{dueTodayTasks.length} tasks</p>
            </div>
          </div>
          <span className="text-yellow-600 font-semibold">{dueTodayTasks.length}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Pending</p>
              <p className="text-sm text-gray-500">{pendingTasks.length} tasks</p>
            </div>
          </div>
          <span className="text-blue-600 font-semibold">{pendingTasks.length}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Completed</p>
              <p className="text-sm text-gray-500">{completedTasks.length} tasks</p>
            </div>
          </div>
          <span className="text-green-600 font-semibold">{completedTasks.length}</span>
        </div>
      </div>

      {tasks.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Tasks</h3>
          <div className="space-y-3">
            {tasks.slice(0, 3).map((task) => (
              <div key={task._id} className="flex items-center space-x-3">
                <FileText className="w-4 h-4 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                  <p className="text-xs text-gray-500">
                    Due: {task.deadline ? format(new Date(task.deadline), 'MMM d, yyyy') : 'No deadline'}
                  </p>
                </div>
                <span className={`w-2 h-2 rounded-full ${
                  getTaskStatus(task) === 'overdue' ? 'bg-red-500' :
                  getTaskStatus(task) === 'due-today' ? 'bg-yellow-500' :
                  getTaskStatus(task) === 'pending' ? 'bg-blue-500' : 'bg-green-500'
                }`}></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskSummary;