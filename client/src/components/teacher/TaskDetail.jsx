import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasks, fetchTaskById, updateTask, deleteTask, setSubmissionRemarks, fetchInteractions, replyInteraction, fetchGroupInteractions, postGroupInteraction } from '../../store/slices/taskSlice';
import { toast } from 'react-toastify';
import { ArrowLeft, FileText, Calendar, Users, Download, Eye, CheckCircle, Clock, AlertCircle, Upload, Image, File, X } from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';
import axios from 'axios';

const TeacherReplyInput = ({ taskId, studentId }) => {
  const dispatch = useDispatch();
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const handleSend = async () => {
    if (!value.trim()) return;
    try {
      setSending(true);
      await dispatch(replyInteraction({ taskId, studentId, message: value.trim() })).unwrap();
      setValue('');
      dispatch(fetchInteractions({ taskId, studentId }));
    } catch (e) {
      toast.error(typeof e === 'string' ? e : 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="mt-3 flex items-center space-x-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type a reply..."
        className="flex-1 border rounded px-3 py-2"
      />
      <button
        onClick={handleSend}
        disabled={sending || !value.trim()}
        className={`px-4 py-2 rounded text-white ${sending || !value.trim() ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {sending ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
};

const WordLimitedTextarea = ({ initialValue = '', placeholder = '', maxWords = 60, onBlurSave }) => {
  const [value, setValue] = useState(initialValue);
  const [count, setCount] = useState((initialValue.trim() ? initialValue.trim().split(/\s+/) : []).length);
  useEffect(() => {
    setValue(initialValue || '');
    setCount((initialValue?.trim() ? initialValue.trim().split(/\s+/) : []).length);
  }, [initialValue]);
  return (
    <div>
      <textarea
        className="w-full border rounded px-3 py-2 text-sm"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          const words = (next.trim() ? next.trim().split(/\s+/) : []);
          if (words.length <= maxWords) {
            setValue(next);
            setCount(words.length);
          } else {
            const trimmed = words.slice(0, maxWords).join(' ');
            setValue(trimmed);
            setCount(maxWords);
          }
        }}
        onBlur={() => onBlurSave && onBlurSave(value)}
        rows={3}
      />
      <div className="mt-1 text-xs text-gray-500 text-right">{count}/{maxWords} words</div>
    </div>
  );
};

const TaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { tasks } = useSelector(state => state.task);
  const { user } = useSelector(state => state.auth);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', deadline: '', instructions: '', maxSubmissions: 1, status: 'active' });
  const WORD_LIMIT_DESC = 100;
  const WORD_LIMIT_INSTR = 200;
  const [descCount, setDescCount] = useState(0);
  const [instrCount, setInstrCount] = useState(0);
  const [newAttachments, setNewAttachments] = useState([]);
  const [groupChatInput, setGroupChatInput] = useState('');
  const [isLoadingGroupChat, setIsLoadingGroupChat] = useState(false);
  const [groupChatFiles, setGroupChatFiles] = useState([]);

  const task = tasks.find(t => t._id === taskId);

  useEffect(() => {
    if (!task && taskId) {
      // Fetch specific task with proper error handling
      const fetchTaskData = async () => {
        try {
          await dispatch(fetchTaskById(taskId)).unwrap();
        } catch (error) {
          console.error('Failed to fetch task:', error);
          // If authentication fails, redirect to login
          if (error.includes('No token') || error.includes('authorization denied')) {
            navigate('/login');
          } else {
            toast.error('Failed to load task');
          }
        }
      };
      fetchTaskData();
    }
  }, [task, taskId, dispatch, navigate]);

  useEffect(() => {
    if (task) {
      setEditForm({
        title: task.title || '',
        description: task.description || '',
        deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0,16) : '',
        instructions: task.instructions || '',
        maxSubmissions: task.maxSubmissions || 1,
        status: task.status || 'active'
      });
      const d = (task.description || '').trim();
      setDescCount(d ? d.split(/\s+/).length : 0);
      const i = (task.instructions || '').trim();
      setInstrCount(i ? i.split(/\s+/).length : 0);
    }
  }, [task]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name === 'description') {
      const words = (value.trim() ? value.trim().split(/\s+/) : []);
      if (words.length <= WORD_LIMIT_DESC) {
        setEditForm(prev => ({ ...prev, [name]: value }));
        setDescCount(words.length);
      } else {
        const trimmed = words.slice(0, WORD_LIMIT_DESC).join(' ');
        setEditForm(prev => ({ ...prev, [name]: trimmed }));
        setDescCount(WORD_LIMIT_DESC);
      }
      return;
    }
    if (name === 'instructions') {
      const words = (value.trim() ? value.trim().split(/\s+/) : []);
      if (words.length <= WORD_LIMIT_INSTR) {
        setEditForm(prev => ({ ...prev, [name]: value }));
        setInstrCount(words.length);
      } else {
        const trimmed = words.slice(0, WORD_LIMIT_INSTR).join(' ');
        setEditForm(prev => ({ ...prev, [name]: trimmed }));
        setInstrCount(WORD_LIMIT_INSTR);
      }
      return;
    }
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAttachmentChange = (e) => {
    setNewAttachments(Array.from(e.target.files || []));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!task) return;
    const formData = new FormData();
    formData.append('title', editForm.title);
    formData.append('description', editForm.description);
    formData.append('deadline', editForm.deadline);
    formData.append('instructions', editForm.instructions);
    formData.append('maxSubmissions', editForm.maxSubmissions);
    formData.append('status', editForm.status);
    newAttachments.forEach(f => formData.append('attachments', f));
    try {
      await dispatch(updateTask({ taskId, updates: formData })).unwrap();
      setIsEditing(false);
      toast.success('Task updated');
    } catch (err) {
      console.error('Failed to update task', err);
      toast.error('Failed to update task');
    }
  };

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading task...</p>
        </div>
      </div>
    );
  }

  const getTaskStatus = () => {
    if (!task.deadline) return { status: 'pending', label: 'Pending', color: 'bg-blue-100 text-blue-800' };
    
    const now = new Date();
    const deadline = new Date(task.deadline);
    
    if (isAfter(now, deadline)) {
      return { status: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800' };
    } else if (isBefore(now, deadline)) {
      return { status: 'pending', label: 'Pending', color: 'bg-blue-100 text-blue-800' };
    } else {
      return { status: 'due-today', label: 'Due Today', color: 'bg-yellow-100 text-yellow-800' };
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
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getSubmissionProgress = () => {
    const totalStudents = task.classroom?.students?.length || 0;
    const submittedCount = task.submissions?.length || 0;
    const percentage = totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0;
    
    return {
      submitted: submittedCount,
      total: totalStudents,
      percentage: Math.round(percentage)
    };
  };

  const progress = getSubmissionProgress();
  const taskStatus = getTaskStatus();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'submissions', label: 'Submissions', icon: Users },
    { id: 'interaction', label: 'Group Discussion', icon: Users },
  ];

  const handleDelete = async () => {
    if (!task) return;
    const confirmDelete = window.confirm('Are you sure you want to delete this task? This cannot be undone.');
    if (!confirmDelete) return;
    try {
      await dispatch(deleteTask(task._id)).unwrap();
      toast.success('Task deleted');
      navigate(-1);
    } catch (err) {
      console.error('Failed to delete task', err);
      toast.error('Failed to delete task');
    }
  };

  const handlePreviewAttachment = async (attachment) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No authentication token found. Please log in again.');
        return;
      }

              const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/tasks/${task._id}/attachments/${attachment._id}/preview`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: attachment.mimetype || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      
      // Create a new window/tab for preview
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        toast.error('Please allow popups to preview files');
      }
      
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } catch (error) {
      console.error('Error previewing attachment:', error);
      toast.error('Failed to preview attachment');
    }
  };

  const handleDownloadAttachment = async (attachment) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No authentication token found. Please log in again.');
        return;
      }

              const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/tasks/${task._id}/attachments/${attachment._id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.originalName || attachment.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      toast.error('Failed to download attachment');
    }
  };

  const handlePreviewSubmissionFile = async (file, submissionId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No authentication token found. Please log in again.');
        return;
      }

      // Use the direct file access route for teachers (non-conflicting path)
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/tasks/file/${file._id}/preview`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: file.mimetype || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      
      // Create a new window/tab for preview
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        toast.error('Please allow popups to preview files');
      }
      
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } catch (error) {
      console.error('Error previewing submission file:', error);
      toast.error('Failed to preview submission file');
    }
  };

  const handleDownloadSubmissionFile = async (file, submissionId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No authentication token found. Please log in again.');
        return;
      }

      // Use the direct file access route for teachers (non-conflicting path)
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/tasks/file/${file._id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.originalName || file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Error downloading submission file:', error);
      toast.error('Failed to download submission file');
    }
  };

  // Load group interactions when task is available
  useEffect(() => {
    if (taskId && task) {
      dispatch(fetchGroupInteractions({ taskId }));
    }
  }, [dispatch, taskId, task]);

  // Poll for group interaction updates every 5 seconds
  useEffect(() => {
    if (taskId && task) {
      const interval = setInterval(() => {
        dispatch(fetchGroupInteractions({ taskId }));
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [dispatch, taskId, task]);

  const handleSendGroupChat = async () => {
    if (!groupChatInput.trim() && groupChatFiles.length === 0) return;
    if (!taskId) return;
    try {
      setIsLoadingGroupChat(true);
      await dispatch(postGroupInteraction({ 
        taskId, 
        message: groupChatInput.trim(), 
        files: groupChatFiles 
      })).unwrap();
      setGroupChatInput('');
      setGroupChatFiles([]);
      // Refresh group interactions
      dispatch(fetchGroupInteractions({ taskId }));
    } catch (e) {
      toast.error(typeof e === 'string' ? e : 'Failed to send message');
    } finally {
      setIsLoadingGroupChat(false);
    }
  };

  const handleGroupChatFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setGroupChatFiles(prev => [...prev, ...selectedFiles]);
    // Clear the input to allow selecting the same files again
    if (e.target) e.target.value = '';
  };

  const handleRemoveGroupChatFile = (index) => {
    setGroupChatFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file) => {
    if (file.type && file.type.startsWith('image/')) return <Image className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePreviewGroupAttachment = async (attachment, messageId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No authentication token found. Please log in again.');
        return;
      }

      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/tasks/${taskId}/group-interactions/${messageId}/attachments/${attachment._id}/preview`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: attachment.mimetype || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      
      // Create a new window/tab for preview
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        toast.error('Please allow popups to preview files');
      }
      
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } catch (error) {
      console.error('Error previewing group attachment:', error);
      toast.error('Failed to preview attachment');
    }
  };

  const handleDownloadGroupAttachment = async (attachment, messageId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No authentication token found. Please log in again.');
        return;
      }

      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/tasks/${taskId}/group-interactions/${messageId}/attachments/${attachment._id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.originalName || attachment.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Error downloading group attachment:', error);
      toast.error('Failed to download attachment');
    }
  };

  const groupInteractionMessages = task?.groupInteractionMessages || [];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Task Information */}
            <div className="bg-white rounded-lg p-6 border">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{task.title}</h2>
                  <p className="text-gray-600 mb-4">{task.description}</p>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${taskStatus.color}`}>
                    {getStatusIcon(taskStatus.status)}
                    <span className="ml-1">{taskStatus.label}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Task Details</h3>
                  <div className="space-y-3">
                    {task.deadline && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Deadline: {format(new Date(task.deadline), 'MMM d, yyyy HH:mm')}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span>Max Submissions: {task.maxSubmissions}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <FileText className="w-4 h-4 mr-2" />
                      <span>Created: {format(new Date(task.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Submission Progress</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Submissions</span>
                      <span className="text-sm font-medium">{progress.submitted}/{progress.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          progress.percentage >= 80 ? 'bg-green-500' :
                          progress.percentage >= 50 ? 'bg-yellow-500' :
                          progress.percentage >= 20 ? 'bg-blue-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${progress.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600">{progress.percentage}% completed</p>
                  </div>
                </div>
              </div>

              {task.instructions && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Instructions</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{task.instructions}</p>
                  </div>
                </div>
              )}

              {task.attachments && task.attachments.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Attachments</h3>
                  <div className="space-y-2">
                    {task.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{attachment.originalName}</p>
                            <p className="text-xs text-gray-500">
                              {(attachment.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                                                 <div className="flex items-center space-x-2">
                           <button 
                             onClick={() => handlePreviewAttachment(attachment)}
                             className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                           >
                             <Eye className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => handleDownloadAttachment(attachment)}
                             className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                           >
                             <Download className="w-4 h-4" />
                           </button>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 'submissions':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Submissions</h2>
              
              {task.submissions && task.submissions.length > 0 ? (
                <div className="space-y-4">
                  {task.submissions.map((submission, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">{submission.student.name}</h3>
                          <p className="text-sm text-gray-600">
                            {submission.status === 'submitted' 
                              ? `Submitted: ${format(new Date(submission.submittedAt), 'MMM d, yyyy HH:mm')}`
                              : `Draft saved: ${format(new Date(submission.draftedAt), 'MMM d, yyyy HH:mm')}`
                            }
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {submission.status === 'draft' && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                              Draft
                            </span>
                          )}
                          {submission.status === 'submitted' && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                              Submitted
                            </span>
                          )}
                          {submission.grade && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                              Grade: {submission.grade}%
                            </span>
                          )}
                          <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {submission.content && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.content}</p>
                        </div>
                      )}

                      <div className="mb-3">
                        <label className="block text-xs text-gray-500 mb-1">Remarks</label>
                        <WordLimitedTextarea
                          initialValue={submission.remarks || ''}
                          placeholder="Add remarks..."
                          maxWords={60}
                          onBlurSave={async (value) => {
                            try {
                              await dispatch(setSubmissionRemarks({ taskId, studentId: submission.student._id, remarks: value })).unwrap();
                              toast.success('Remarks updated');
                            } catch (err) {
                              toast.error('Failed to update remarks');
                            }
                          }}
                        />
                      </div>
                      
                      {submission.files && submission.files.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Attached files:</p>
                          <div className="space-y-1">
                            {submission.files.map((file, fileIndex) => (
                              <div key={fileIndex} className="flex items-center justify-between bg-gray-50 rounded p-2">
                                <div className="flex items-center space-x-2">
                                  <FileText className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-700">{file.originalName}</span>
                                </div>
                                                                                                                                   <div className="flex items-center space-x-2">
                                    <button 
                                      onClick={() => handlePreviewSubmissionFile(file, submission._id)}
                                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleDownloadSubmissionFile(file, submission._id)}
                                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                  </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Interaction thread */}
                      {submission.status === 'submitted' && (
                        <div className="mt-4 border-t pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-900">Interaction</h4>
                            <button
                              className="text-sm text-blue-600 hover:underline"
                              onClick={() => dispatch(fetchInteractions({ taskId, studentId: submission.student._id }))}
                            >
                              Refresh
                            </button>
                          </div>
                          <div className="max-h-56 overflow-y-auto bg-gray-50 border rounded p-3 space-y-2">
                            {(submission.interactionMessages || []).length === 0 ? (
                              <p className="text-sm text-gray-500">No messages yet.</p>
                            ) : (
                              (submission.interactionMessages || []).map((m, i) => (
                                <div key={i} className={`flex ${ (m.senderRole === 'teacher') ? 'justify-end' : 'justify-start' }`}>
                                  <div className={`${ (m.senderRole === 'teacher') ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border' } rounded px-3 py-2 max-w-[75%]`}>
                                    <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                                    <div className={`text-[10px] mt-1 ${ (m.senderRole === 'teacher') ? 'text-blue-100' : 'text-gray-400' }`}>
                                      {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                          <TeacherReplyInput taskId={taskId} studentId={submission.student._id} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
                  <p className="text-gray-600">Students haven't submitted their work for this task yet.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'interaction':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Group Discussion</h2>
              <p className="text-sm text-gray-600 mb-4">
                Discuss with students who have submitted this task. Only submitted students can participate in this discussion.
              </p>
              
              <div className="max-h-96 overflow-y-auto border rounded p-4 bg-gray-50 space-y-3">
                {groupInteractionMessages.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">No messages yet. Start the group discussion!</p>
                ) : (
                  groupInteractionMessages.map((m, i) => (
                    <div key={i} className={`flex ${ (m.sender?._id === user?._id) ? 'justify-end' : 'justify-start' }`}>
                      <div className={`${ (m.sender?._id === user?._id) ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border' } rounded px-4 py-3 max-w-[75%]`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium">
                            {m.sender?.name || 'Unknown'}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${m.senderRole === 'teacher' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                            {m.senderRole === 'teacher' ? 'Teacher' : 'Student'}
                          </span>
                        </div>
                        {m.message && (
                          <p className="text-sm whitespace-pre-wrap mb-2">{m.message}</p>
                        )}
                        {m.attachments && m.attachments.length > 0 && (
                          <div className="space-y-2 mb-2">
                            {m.attachments.map((attachment, attIndex) => (
                              <div key={attIndex} className={`flex items-center justify-between p-2 rounded ${ (m.sender?._id === user?._id) ? 'bg-blue-700' : 'bg-gray-100' }`}>
                                <div className="flex items-center space-x-2">
                                  {getFileIcon(attachment)}
                                  <div className="flex flex-col">
                                    <span className="text-xs font-medium truncate max-w-[150px]">
                                      {attachment.originalName || attachment.filename}
                                    </span>
                                    <span className="text-xs opacity-75">
                                      {formatFileSize(attachment.size)}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => handlePreviewGroupAttachment(attachment, m._id)}
                                    className="p-1 hover:bg-opacity-20 hover:bg-white rounded"
                                    title="Preview"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDownloadGroupAttachment(attachment, m._id)}
                                    className="p-1 hover:bg-opacity-20 hover:bg-white rounded"
                                    title="Download"
                                  >
                                    <Download className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className={`text-xs mt-2 ${ (m.sender?._id === user?._id) ? 'text-blue-100' : 'text-gray-400' }`}>
                          {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* File upload area */}
              {groupChatFiles.length > 0 && (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Selected files:</span>
                    <span className="text-xs text-gray-500">{groupChatFiles.length} file(s)</span>
                  </div>
                  <div className="space-y-1">
                    {groupChatFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white rounded p-2">
                        <div className="flex items-center space-x-2">
                          {getFileIcon(file)}
                          <span className="text-sm text-gray-700 truncate max-w-[200px]">{file.name}</span>
                          <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                        </div>
                        <button
                          onClick={() => handleRemoveGroupChatFile(index)}
                          className="p-1 text-red-500 hover:bg-red-100 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    id="groupChatFiles"
                    multiple
                    onChange={handleGroupChatFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.wav"
                  />
                  <label
                    htmlFor="groupChatFiles"
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center space-x-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">Attach files</span>
                  </label>
                  <input
                    type="text"
                    value={groupChatInput}
                    onChange={(e) => setGroupChatInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 border rounded px-3 py-2"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSendGroupChat();
                      }
                    }}
                  />
                  <button
                    onClick={handleSendGroupChat}
                    disabled={isLoadingGroupChat || (!groupChatInput.trim() && groupChatFiles.length === 0)}
                    className={`px-4 py-2 rounded text-white ${isLoadingGroupChat || (!groupChatInput.trim() && groupChatFiles.length === 0) ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {isLoadingGroupChat ? 'Sending...' : 'Send'}
                  </button>
                </div>
                <p className="text-xs text-gray-500">You can send text messages, files, or both. Max 5 files per message.</p>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Only students who have submitted this task can participate in this group discussion. 
                  This creates a collaborative learning environment where submitted students can discuss and learn from each other.
                </p>
              </div>
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
                onClick={() => navigate(-1)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
                <p className="text-gray-600">{task.classroom?.name}</p>
              </div>
            </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Task
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
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

      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Edit Task</h3>
                <button type="button" onClick={() => setIsEditing(false)} className="text-gray-500">Close</button>
              </div>
              <div>
                <label className="block text-sm mb-1">Title</label>
                <input name="title" value={editForm.title} onChange={handleEditChange} className="w-full px-3 py-2 border rounded" required />
              </div>
              <div>
                <label className="block text-sm mb-1">Description</label>
                <textarea name="description" value={editForm.description} onChange={handleEditChange} className="w-full px-3 py-2 border rounded" rows={3} required />
                <div className="mt-1 text-xs text-gray-500 text-right">{descCount}/{WORD_LIMIT_DESC} words</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Deadline</label>
                  <input type="datetime-local" name="deadline" value={editForm.deadline} onChange={handleEditChange} className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Max Submissions</label>
                  <input type="number" min="1" max="10" name="maxSubmissions" value={editForm.maxSubmissions} onChange={handleEditChange} className="w-full px-3 py-2 border rounded" />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Instructions</label>
                <textarea name="instructions" value={editForm.instructions} onChange={handleEditChange} className="w-full px-3 py-2 border rounded" rows={4} />
                <div className="mt-1 text-xs text-gray-500 text-right">{instrCount}/{WORD_LIMIT_INSTR} words</div>
              </div>
              <div>
                <label className="block text-sm mb-1">Status</label>
                <select name="status" value={editForm.status} onChange={handleEditChange} className="w-full px-3 py-2 border rounded">
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Add Attachments</label>
                <input type="file" multiple onChange={handleAttachmentChange} />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetail; 