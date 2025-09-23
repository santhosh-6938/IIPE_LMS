import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchTasks, submitTask, fetchMySubmission, getUserSubmissionForTask, fetchTaskById, discardDraft, fetchInteractions, postInteraction, fetchGroupInteractions, postGroupInteraction } from '../../store/slices/taskSlice';
import { toast } from 'react-toastify';
import { ArrowLeft, Calendar, FileText, Upload, CheckCircle, Clock, AlertCircle, Eye, Download, Image, File, X } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';

const StudentTaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { tasks, isLoading, error } = useSelector(state => state.task);
  const { user } = useSelector(state => state.auth);

  const task = tasks.find(t => t._id === taskId);
  
  // Debug task finding
  console.log('Task finding debug:', {
    taskId,
    tasksCount: tasks.length,
    taskFound: !!task,
    taskTitle: task?.title
  });

  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [filesToRemove, setFilesToRemove] = useState([]);
  const WORD_LIMIT = 150; // hard cap on words for concise descriptions
  const [wordCount, setWordCount] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [groupChatInput, setGroupChatInput] = useState('');
  const [isLoadingGroupChat, setIsLoadingGroupChat] = useState(false);
  const [groupChatFiles, setGroupChatFiles] = useState([]);

  const mySubmission = useMemo(() => {
    if (!task || !user?._id) return null;
    return getUserSubmissionForTask(task, user._id);
  }, [task, user]);

  useEffect(() => {
    if (!task && taskId) {
      console.log('Task not found, fetching specific task...', taskId);
      dispatch(fetchTaskById(taskId));
    }
  }, [task, taskId, dispatch]);

  // Fetch submission status when task is available
  useEffect(() => {
    if (task && taskId) {
      dispatch(fetchMySubmission(taskId));
    }
  }, [task, taskId, dispatch]);

  // Also fetch my submission immediately on mount by taskId (covers back navigation cache)
  useEffect(() => {
    if (taskId) {
      dispatch(fetchMySubmission(taskId));
    }
  }, [taskId, dispatch]);

  // Ensure latest draft is loaded when user returns to this page (visibility/focus)
  useEffect(() => {
    const refresh = () => { if (taskId) dispatch(fetchMySubmission(taskId)); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('popstate', refresh);
    window.addEventListener('pageshow', (e) => { if (e.persisted) refresh(); });
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('popstate', refresh);
    };
  }, [dispatch, taskId]);

  // Poll for task updates to reflect teacher edits (e.g., deadline changes)
  useEffect(() => {
    const intervalId = setInterval(() => {
      dispatch(fetchTasks());
      if (taskId) {
        dispatch(fetchMySubmission(taskId));
      }
    }, 20000);
    return () => clearInterval(intervalId);
  }, [dispatch, taskId]);

  useEffect(() => {
    if (mySubmission) {
      console.log('Loading existing submission:', mySubmission);
      const initial = mySubmission.content || '';
      setContent(initial);
      setWordCount((initial.trim() ? initial.trim().split(/\s+/) : []).length);
      // Keep existing files in state for draft editing
      // Note: We don't set files from mySubmission.files because those are server files
      // The files state is for new files being uploaded in the current session
      setFiles([]);
      setFilesToRemove([]);
    } else {
      console.log('No existing submission found, resetting form');
      // Reset form when no submission exists
      setContent('');
      setFiles([]);
      setFilesToRemove([]);
    }
  }, [mySubmission]);

  // Reset form when task changes
  useEffect(() => {
    setContent('');
    setFiles([]);
    setMessage('');
    setFilesToRemove([]);
  }, [taskId]);

  const isSubmitted = mySubmission?.status === 'submitted' || mySubmission?.interactionEnabled === true;
  // Load interactions when submitted
  useEffect(() => {
    if (taskId && isSubmitted && user?._id) {
      dispatch(fetchInteractions({ taskId }));
      dispatch(fetchGroupInteractions({ taskId }));
    }
  }, [dispatch, taskId, isSubmitted]);

  // Poll for group interaction updates every 5 seconds
  useEffect(() => {
    if (taskId && isSubmitted && user?._id) {
      const interval = setInterval(() => {
        dispatch(fetchGroupInteractions({ taskId }));
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [dispatch, taskId, isSubmitted, user?._id]);

  const interactionMessages = mySubmission?.interactionMessages || [];
  const groupInteractionMessages = task?.groupInteractionMessages || [];

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    if (!taskId) return;
    try {
      setIsLoadingChat(true);
      await dispatch(postInteraction({ taskId, message: chatInput.trim() })).unwrap();
      setChatInput('');
      // Refresh interactions
      dispatch(fetchInteractions({ taskId }));
    } catch (e) {
      toast.error(typeof e === 'string' ? e : 'Failed to send message');
    } finally {
      setIsLoadingChat(false);
    }
  };

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
    if (file.type.startsWith('image/')) return <Image className="w-4 h-4" />;
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

  const isDraft = mySubmission?.status === 'draft';
  const isAutoSubmitted = mySubmission?.isAutoSubmitted === true;
  
  // Debug logging
  console.log('StudentTaskDetail Debug:', {
    taskId,
    task: task ? { _id: task._id, title: task.title, submissions: task.submissions?.length } : null,
    mySubmission: mySubmission ? {
      status: mySubmission.status,
      submittedAt: mySubmission.submittedAt,
      draftedAt: mySubmission.draftedAt,
      content: mySubmission.content?.substring(0, 50) + '...',
      files: mySubmission.files?.length || 0
    } : null,
    isSubmitted,
    isDraft,
    content: content?.substring(0, 50) + '...',
    userId: user?._id
  });
  const isOverdue = useMemo(() => {
    if (!task?.deadline) return false;
    try {
      return new Date() > new Date(task.deadline);
    } catch {
      return false;
    }
  }, [task]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
    // Allow picking the same files again by clearing input value
    try { if (e.target) e.target.value = null; } catch {}
  };

  const handleRemoveFile = (fileId) => {
    const confirmRemove = window.confirm('Are you sure you want to remove this file? This action can be undone before saving.');
    if (confirmRemove) {
      const idStr = (fileId || '').toString();
      setFilesToRemove(prev => Array.from(new Set([...(prev || []).map(x => x.toString()), idStr])));
    }
  };

  const handleUndoRemoveFile = (fileId) => {
    const idStr = (fileId || '').toString();
    setFilesToRemove(prev => (prev || []).filter(id => id.toString() !== idStr));
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

      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/tasks/${task._id}/submissions/${submissionId}/files/${file._id}/preview`, {
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

      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/tasks/${task._id}/submissions/${submissionId}/files/${file._id}/download`, {
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

  const handleDiscardDraft = async () => {
    if (!task) return;
    const confirmDiscard = window.confirm('Discard your draft? This will remove saved content and files.');
    if (!confirmDiscard) return;
    try {
      setIsSaving(true);
      await dispatch(discardDraft(task._id)).unwrap();
      toast.success('Draft discarded');
      // Refresh task and submission state
      dispatch(fetchTasks());
      dispatch(fetchMySubmission(task._id));
      // Reset local form state
      setContent('');
      setFiles([]);
      setFilesToRemove([]);
    } catch (e) {
      toast.error(typeof e === 'string' ? e : 'Failed to discard draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (finalize) => {
    if (!task) return;
    
    // Prevent multiple submissions
    if (isSaving) return;
    
    // Check if already submitted
    if (isSubmitted && finalize) {
      toast.error('Task already submitted. Cannot submit again.');
      return;
    }
    
    // Enforce word limit on client before submit
    const words = (content.trim() ? content.trim().split(/\s+/) : []);
    if (words.length > WORD_LIMIT) {
      toast.error(`Content too long. Max ${WORD_LIMIT} words.`);
      return;
    }

    setIsSaving(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('status', finalize ? 'submitted' : 'draft');
      formData.append('filesToRemove', JSON.stringify(filesToRemove));
      files.forEach(f => formData.append('files', f));

      await dispatch(submitTask({ taskId, submission: formData })).unwrap();
      const successMsg = finalize ? 'Submitted successfully.' : 'Draft saved.';
      setMessage(successMsg);
      toast.success(successMsg);
      
      // Dispatch custom event to notify dashboard of task update
      window.dispatchEvent(new CustomEvent('taskSubmitted', { 
        detail: { taskId, status: finalize ? 'submitted' : 'draft' } 
      }));
      
      // After submit, refresh tasks and submission status to reflect updated status
      dispatch(fetchTasks());
      dispatch(fetchMySubmission(taskId));
      
      // Keep selected files cleared after save; server-side files remain in mySubmission
      setFiles([]);
      setFilesToRemove([]);
    } catch (err) {
      const errorMsg = typeof err === 'string' ? err : 'Failed to submit';
      setMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading task...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Task</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Task Not Found</h2>
            <p className="text-gray-600 mb-4">The task you're looking for doesn't exist or you don't have access to it.</p>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
                <p className="text-gray-600">{task.classroom?.name}</p>
              </div>
            </div>
            {isSubmitted && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-4 h-4 mr-1" /> Completed
              </div>
            )}
            {isDraft && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                <Clock className="w-4 h-4 mr-1" /> Draft
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white rounded-lg p-6 border">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Task Overview</h2>
          <p className="text-gray-700 mb-4">{task.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            {task.deadline && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Due: {format(new Date(task.deadline), 'MMM d, yyyy HH:mm')}
              </div>
            )}
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Max submissions: {task.maxSubmissions}
            </div>
          </div>

          {task.instructions && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-md font-medium text-gray-900 mb-2">Instructions</h3>
              <div className="bg-gray-50 rounded p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{task.instructions}</p>
              </div>
            </div>
          )}

          {task.attachments && task.attachments.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-md font-medium text-gray-900 mb-2">Attachments</h3>
              <div className="space-y-1">
                {task.attachments.map((a, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded p-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span>{a.originalName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePreviewAttachment(a)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Preview</span>
                      </button>
                      <button
                        onClick={() => handleDownloadAttachment(a)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors flex items-center space-x-1"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg p-6 border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Work</h2>
          
          {/* Show existing submission if any */}
          {mySubmission && (mySubmission.status === 'submitted' || mySubmission.status === 'draft') && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">
                  {mySubmission.status === 'submitted' ? 'Submitted Work' : 'Draft Work'}
                </h4>
                {isAutoSubmitted && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    ⚠️ Auto-Submitted
                  </span>
                )}
              </div>
              {mySubmission.content && (
                <div className="mb-3">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{mySubmission.content}</p>
                </div>
              )}
              {mySubmission.files && mySubmission.files.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">{isDraft ? 'Files in draft:' : 'Attached files:'}</p>
                  <div className="space-y-1">
                    {mySubmission.files.map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white rounded p-2 border">
                        <div className="flex items-center space-x-2 text-sm text-gray-700">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span>{f.originalName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handlePreviewSubmissionFile(f, mySubmission._id)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors flex items-center space-x-1"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Preview</span>
                          </button>
                          <button
                            onClick={() => handleDownloadSubmissionFile(f, mySubmission._id)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors flex items-center space-x-1"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-500">
                {mySubmission.status === 'submitted' 
                  ? `Submitted on ${format(new Date(mySubmission.submittedAt), 'MMM d, yyyy HH:mm')}`
                  : `Draft saved on ${format(new Date(mySubmission.draftedAt), 'MMM d, yyyy HH:mm')}`
                }
              </p>
            </div>
          )}

          {/* Auto-submission warning */}
          {isAutoSubmitted && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <div>
                  <p className="text-sm text-red-800 font-medium">
                    This submission was automatically submitted due to the deadline passing.
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Your draft work was automatically submitted on {format(new Date(mySubmission.autoSubmittedAt), 'MMM d, yyyy HH:mm')}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Always show the form, but disable submit if already submitted */}
          {isSubmitted && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <p className="text-sm text-green-800 font-medium">
                  Task completed successfully! Your submission has been received and cannot be modified.
                </p>
              </div>
            </div>
          )}
          
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(true); }} className="space-y-4">
            {isDraft && (
              <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded p-3">
                <span className="text-sm text-yellow-800">This is a saved draft. You can edit, replace files, or discard it.</span>
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  disabled={isSaving}
                  className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50 disabled:opacity-50"
                >
                  Discard Draft
                </button>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                value={content}
                onChange={(e) => {
                  const next = e.target.value;
                  const words = (next.trim() ? next.trim().split(/\s+/) : []);
                  if (words.length <= WORD_LIMIT) {
                    setContent(next);
                    setWordCount(words.length);
                  } else {
                    // Trim to limit
                    const trimmed = words.slice(0, WORD_LIMIT).join(' ');
                    setContent(trimmed);
                    setWordCount(WORD_LIMIT);
                  }
                }}
                rows={5}
                disabled={isSubmitted}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  isSubmitted ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                placeholder={isSubmitted ? "Task already submitted" : "Type your answer here"}
              />
              <div className="mt-1 text-xs text-gray-500 text-right">{wordCount}/{WORD_LIMIT} words</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Attach files</label>
              <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isSubmitted 
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                  : 'border-gray-300 hover:border-blue-400'
              }`}>
                <input
                  type="file"
                  id="submissionFiles"
                  multiple
                  onChange={handleFileChange}
                  disabled={isSubmitted}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif"
                />
                <label htmlFor="submissionFiles" className={`cursor-pointer ${isSubmitted ? 'cursor-not-allowed' : ''}`}>
                  <Upload className={`w-8 h-8 mx-auto mb-2 ${isSubmitted ? 'text-gray-300' : 'text-gray-400'}`} />
                  <p className={`text-sm ${isSubmitted ? 'text-gray-400' : 'text-gray-600'}`}>
                    {isSubmitted ? 'Files cannot be changed after submission' : 
                     isDraft ? 'Click to upload new files (will replace existing files)' : 
                     'Click to upload files or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Max 3 files, 10MB each</p>
                </label>
              </div>
              {/* Show existing files from draft/submission */}
              {mySubmission && Array.isArray(mySubmission.files) && mySubmission.files.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-medium text-gray-700">Current files:</p>
                  {mySubmission.files
                    .filter(f => !filesToRemove.some(id => id.toString() === (f._id || '').toString()))
                    .map((f, i) => (
                    <div key={i} className={`flex items-center justify-between rounded p-2 border ${
                      filesToRemove.some(id => id.toString() === (f._id || '').toString()) ? 'bg-red-50 border-red-200' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className={filesToRemove.some(id => id.toString() === (f._id || '').toString()) ? 'line-through text-gray-500' : ''}>
                          {f.originalName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!filesToRemove.includes(f._id) && !isSubmitted ? (
                          <>
                            <button
                              onClick={() => handlePreviewSubmissionFile(f, mySubmission._id)}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors flex items-center space-x-1"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Preview</span>
                            </button>
                            <button
                              onClick={() => handleDownloadSubmissionFile(f, mySubmission._id)}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors flex items-center space-x-1"
                            >
                              <Download className="w-4 h-4" />
                              <span>Download</span>
                            </button>
                            <button
                              onClick={() => handleRemoveFile(f._id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors flex items-center space-x-1"
                            >
                              <span>Remove</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleUndoRemoveFile(f._id)}
                            className="p-1 text-red-400 hover:text-green-600 transition-colors flex items-center space-x-1"
                          >
                            <span>Undo</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {filesToRemove.length > 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      {filesToRemove.length} file(s) marked for removal. Save draft to confirm.
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Upload new files to add more, or remove existing files above.
                  </p>
                </div>
              )}

              {/* Show newly selected files */}
              {Array.isArray(files) && files.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-medium text-gray-700">New files to upload:</p>
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center space-x-2 text-sm text-gray-700">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span>{f.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {message && (
              <div className="text-sm text-gray-700">{message}</div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                disabled={isSaving || isSubmitted}
                onClick={() => handleSubmit(false)}
                className={`px-4 py-2 border border-gray-300 rounded-lg transition-colors disabled:opacity-50 ${
                  isSubmitted ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'
                }`}
              >
                {isSaving ? 'Saving...' : (isSubmitted ? 'Cannot Save Draft' : 'Save Draft')}
              </button>
              <button
                type="submit"
                disabled={isSaving || isOverdue || isSubmitted}
                className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                  isOverdue || isSubmitted ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isOverdue ? 'Deadline Passed' : 
                isSubmitted ? 'Task Completed' : 
                isSaving ? 'Submitting...' : 
                (isDraft ? 'Submit Draft' : 'Submit Now')}
              </button>
            </div>
          </form>
        </div>

        {/* Individual Interaction area: visible only after submission */}
        {isSubmitted && (
          <div className="bg-white rounded-lg p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ask your teacher (Private)</h2>
            <div className="max-h-64 overflow-y-auto border rounded p-3 bg-gray-50 space-y-2">
              {interactionMessages.length === 0 ? (
                <p className="text-sm text-gray-500">No messages yet. Start the conversation with your question.</p>
              ) : (
                interactionMessages.map((m, i) => (
                  <div key={i} className={`flex ${ (m.sender === user?._id) ? 'justify-end' : 'justify-start' }`}>
                    <div className={`${ (m.sender === user?._id) ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border' } rounded px-3 py-2 max-w-[75%]`}>
                      <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                      <div className={`text-[10px] mt-1 ${ (m.sender === user?._id) ? 'text-blue-100' : 'text-gray-400' }`}>
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
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 border rounded px-3 py-2"
              />
              <button
                onClick={handleSendChat}
                disabled={isLoadingChat || !chatInput.trim()}
                className={`px-4 py-2 rounded text-white ${isLoadingChat || !chatInput.trim() ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isLoadingChat ? 'Sending...' : 'Send'}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">Private conversation with your teacher.</p>
          </div>
        )}

        {/* Group Interaction area: visible only after submission */}
        {isSubmitted ? (
          <div className="bg-white rounded-lg p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Group Discussion</h2>
            <p className="text-sm text-gray-600 mb-4">Discuss with your teacher and other students who have submitted this task.</p>
            <div className="max-h-80 overflow-y-auto border rounded p-3 bg-gray-50 space-y-2">
              {groupInteractionMessages.length === 0 ? (
                <p className="text-sm text-gray-500">No messages yet. Start the group discussion!</p>
              ) : (
                groupInteractionMessages.map((m, i) => (
                  <div key={i} className={`flex ${ (m.sender?._id === user?._id) ? 'justify-end' : 'justify-start' }`}>
                    <div className={`${ (m.sender?._id === user?._id) ? 'bg-green-600 text-white' : 'bg-white text-gray-800 border' } rounded px-3 py-2 max-w-[75%]`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-medium">
                          {m.sender?.name || 'Unknown'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${m.senderRole === 'teacher' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                          {m.senderRole === 'teacher' ? 'Teacher' : 'Student'}
                        </span>
                      </div>
                      {m.message && (
                        <p className="text-sm whitespace-pre-wrap mb-2">{m.message}</p>
                      )}
                      {m.attachments && m.attachments.length > 0 && (
                        <div className="space-y-2 mb-2">
                          {m.attachments.map((attachment, attIndex) => (
                            <div key={attIndex} className={`flex items-center justify-between p-2 rounded ${ (m.sender?._id === user?._id) ? 'bg-green-700' : 'bg-gray-100' }`}>
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
                      <div className={`text-[10px] mt-1 ${ (m.sender?._id === user?._id) ? 'text-green-100' : 'text-gray-400' }`}>
                        {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* File upload area */}
            {groupChatFiles.length > 0 && (
              <div className="mt-3 p-3 bg-gray-100 rounded-lg">
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

            <div className="mt-3 space-y-2">
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
                  className={`px-4 py-2 rounded text-white ${isLoadingGroupChat || (!groupChatInput.trim() && groupChatFiles.length === 0) ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {isLoadingGroupChat ? 'Sending...' : 'Send'}
                </button>
              </div>
              <p className="text-xs text-gray-500">You can send text messages, files, or both. Max 5 files per message.</p>
            </div>
            <p className="mt-2 text-xs text-gray-500">Group discussion with teacher and other submitted students.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Group Discussion</h2>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                <div>
                  <p className="text-sm text-yellow-800 font-medium">
                    Group discussion is only available after you submit this task.
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Submit your work to participate in group discussions with your teacher and classmates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentTaskDetail;


