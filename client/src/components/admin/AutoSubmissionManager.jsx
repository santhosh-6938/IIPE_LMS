import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Play, 
  FileText, 
  Users,
  Calendar,
  Eye
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'react-toastify';

const AutoSubmissionManager = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('pending');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const tabs = [
    { id: 'pending', name: 'Pending Auto-Submissions', icon: Clock },
    { id: 'stats', name: 'Statistics', icon: CheckCircle },
    { id: 'history', name: 'History', icon: FileText }
  ];

  // Fetch auto-submission statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/auto-submission/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to fetch auto-submission statistics');
    }
  };

  // Fetch pending auto-submissions
  const fetchPendingTasks = async () => {
    try {
      const response = await fetch('/api/auto-submission/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPendingTasks(data.data.tasks);
      }
    } catch (error) {
      console.error('Error fetching pending tasks:', error);
      toast.error('Failed to fetch pending auto-submissions');
    }
  };

  // Trigger auto-submission for all pending tasks
  const triggerAutoSubmission = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auto-submission/trigger', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Auto-submission completed: ${data.data.totalAutoSubmitted} submissions processed`);
        fetchPendingTasks();
        fetchStats();
      } else {
        toast.error(data.message || 'Failed to trigger auto-submission');
      }
    } catch (error) {
      console.error('Error triggering auto-submission:', error);
      toast.error('Failed to trigger auto-submission');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger auto-submission for specific task
  const triggerTaskAutoSubmission = async (taskId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/auto-submission/trigger/${taskId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Auto-submission completed for task: ${data.data.autoSubmittedCount} submissions processed`);
        fetchPendingTasks();
        fetchStats();
      } else {
        toast.error(data.message || 'Failed to trigger auto-submission for task');
      }
    } catch (error) {
      console.error('Error triggering task auto-submission:', error);
      toast.error('Failed to trigger auto-submission for task');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch auto-submission history for a task
  const fetchTaskHistory = async (taskId) => {
    try {
      const response = await fetch(`/api/auto-submission/history/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setHistory(data.data);
        setSelectedTaskId(taskId);
      }
    } catch (error) {
      console.error('Error fetching task history:', error);
      toast.error('Failed to fetch auto-submission history');
    }
  };

  useEffect(() => {
    fetchStats();
    fetchPendingTasks();
  }, []);

  const renderPendingTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Pending Auto-Submissions</h3>
        <div className="flex space-x-3">
          <button
            onClick={fetchPendingTasks}
            disabled={isLoading}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={triggerAutoSubmission}
            disabled={isLoading || pendingTasks.length === 0}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            <Play className="w-4 h-4 mr-2" />
            Trigger All Auto-Submissions
          </button>
        </div>
      </div>

      {pendingTasks.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No pending auto-submissions</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {pendingTasks.map((task) => (
              <li key={task.taskId} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {task.draftCount} draft{task.draftCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Deadline: {format(new Date(task.deadline), 'MMM dd, yyyy HH:mm')}
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {task.classroom.name}
                      </div>
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        {task.teacher.name}
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-gray-600">
                        Overdue by {formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => fetchTaskHistory(task.taskId)}
                      className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </button>
                    <button
                      onClick={() => triggerTaskAutoSubmission(task.taskId)}
                      disabled={isLoading}
                      className="flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Auto-Submit
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderStatsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Auto-Submission Statistics</h3>
      
      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Tasks with Auto-Submissions
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalTasksWithAutoSubmissions}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Auto-Submissions
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalAutoSubmissions}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Tasks
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {pendingTasks.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Loading statistics...</p>
        </div>
      )}
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Auto-Submission History</h3>
      
      {selectedTaskId && history ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-lg font-medium text-gray-900">{history.title}</h4>
            <p className="text-sm text-gray-600">
              Classroom: {history.classroom.name} | Teacher: {history.teacher.name}
            </p>
            <p className="text-sm text-gray-600">
              Deadline: {format(new Date(history.deadline), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>
          
          {history.autoSubmittedSubmissions.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {history.autoSubmittedSubmissions.map((submission, index) => (
                <li key={index} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h5 className="text-sm font-medium text-gray-900">
                          {submission.studentName}
                        </h5>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Auto-Submitted
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {submission.studentEmail}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-submitted: {formatDistanceToNow(new Date(submission.autoSubmittedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-6 py-4 text-center text-gray-500">
              No auto-submissions found for this task.
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Select a task to view its auto-submission history</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'pending' && renderPendingTab()}
          {activeTab === 'stats' && renderStatsTab()}
          {activeTab === 'history' && renderHistoryTab()}
        </div>
      </div>
    </div>
  );
};

export default AutoSubmissionManager;
