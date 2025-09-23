import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('No authentication token found in localStorage');
    return {};
  }
  return { Authorization: `Bearer ${token}` };
};

// Async thunks
export const fetchTasks = createAsyncThunk(
  'task/fetchTasks',
  async (classroomId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No token, authorization denied');
      }
      
      const response = await axios.get(`${API_URL}/tasks${classroomId ? `?classroom=${classroomId}` : ''}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        return rejectWithValue('No token, authorization denied');
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
    }
  }
);

export const fetchTaskCount = createAsyncThunk(
  'task/fetchTaskCount',
  async (classroomId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/tasks/count${classroomId ? `?classroom=${classroomId}` : ''}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch task count');
    }
  }
);

export const fetchTaskById = createAsyncThunk(
  'task/fetchTaskById',
  async (taskId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No token, authorization denied');
      }
      
      const response = await axios.get(`${API_URL}/tasks/${taskId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        return rejectWithValue('No token, authorization denied');
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch task');
    }
  }
);

export const fetchMySubmission = createAsyncThunk(
  'task/fetchMySubmission',
  async (taskId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No token, authorization denied');
      }
      
      const response = await axios.get(`${API_URL}/tasks/${taskId}/my-submission`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        return rejectWithValue('No token, authorization denied');
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch submission status');
    }
  }
);

// Interactions: fetch messages (student own or teacher for a student)
export const fetchInteractions = createAsyncThunk(
  'task/fetchInteractions',
  async ({ taskId, studentId }, { rejectWithValue }) => {
    try {
      const params = studentId ? `?studentId=${studentId}` : '';
      const response = await axios.get(`${API_URL}/tasks/${taskId}/interactions${params}`, {
        headers: getAuthHeaders()
      });
      return { taskId, studentId: response.data.studentId || studentId, messages: response.data.messages || [], interactionEnabled: !!response.data.interactionEnabled };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch interactions');
    }
  }
);

// Interactions: student post message
export const postInteraction = createAsyncThunk(
  'task/postInteraction',
  async ({ taskId, message }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/tasks/${taskId}/interactions`, { message }, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
      });
      return { taskId, messages: response.data.messages };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to post interaction');
    }
  }
);

// Interactions: teacher reply
export const replyInteraction = createAsyncThunk(
  'task/replyInteraction',
  async ({ taskId, studentId, message }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/tasks/${taskId}/interactions/reply`, { studentId, message }, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
      });
      return { taskId, studentId, messages: response.data.messages };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reply');
    }
  }
);

// Group interactions thunks
export const fetchGroupInteractions = createAsyncThunk(
  'task/fetchGroupInteractions',
  async ({ taskId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/tasks/${taskId}/group-interactions`, {
        headers: getAuthHeaders()
      });
      return { taskId, messages: response.data.messages || [] };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch group interactions');
    }
  }
);

export const postGroupInteraction = createAsyncThunk(
  'task/postGroupInteraction',
  async ({ taskId, message, files }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      if (message) formData.append('message', message);
      if (files && files.length > 0) {
        files.forEach(file => formData.append('attachments', file));
      }

      const headers = getAuthHeaders();
      delete headers['Content-Type']; // Let browser set multipart/form-data boundary

      const response = await axios.post(`${API_URL}/tasks/${taskId}/group-interactions`, formData, {
        headers
      });
      return { taskId, message: response.data.message };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to post group interaction');
    }
  }
);

export const createTask = createAsyncThunk(
  'task/createTask',
  async (taskData, { rejectWithValue }) => {
    try {
      const headers = getAuthHeaders();
      // Don't set Content-Type for FormData, let the browser set it with boundary
      delete headers['Content-Type'];
      
      const response = await axios.post(`${API_URL}/tasks`, taskData, {
        headers
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create task');
    }
  }
);

export const submitTask = createAsyncThunk(
  'task/submitTask',
  async ({ taskId, submission }, { rejectWithValue }) => {
    try {
      const headers = getAuthHeaders();
      // Allow FormData to set its own Content-Type
      delete headers['Content-Type'];
      const response = await axios.post(`${API_URL}/tasks/${taskId}/submit`, submission, {
        headers
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit task');
    }
  }
);

export const discardDraft = createAsyncThunk(
  'task/discardDraft',
  async (taskId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_URL}/tasks/${taskId}/draft`, {
        headers: getAuthHeaders()
      });
      return { taskId, message: response.data?.message };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to discard draft');
    }
  }
);

export const updateTask = createAsyncThunk(
  'task/updateTask',
  async ({ taskId, updates }, { rejectWithValue }) => {
    try {
      const headers = getAuthHeaders();
      delete headers['Content-Type'];
      const response = await axios.put(`${API_URL}/tasks/${taskId}`, updates, {
        headers
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update task');
    }
  }
);

export const deleteTask = createAsyncThunk(
  'task/deleteTask',
  async (taskId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_URL}/tasks/${taskId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete task');
    }
  }
);

export const setSubmissionRemarks = createAsyncThunk(
  'task/setSubmissionRemarks',
  async ({ taskId, studentId, remarks }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/tasks/${taskId}/submissions/${studentId}/remarks`, { remarks }, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to set remarks');
    }
  }
);

const taskSlice = createSlice({
  name: 'task',
  initialState: {
    tasks: [],
    taskCount: 0,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        // Add the task to the tasks array if it doesn't exist
        const existingIndex = state.tasks.findIndex(t => t._id === action.payload._id);
        if (existingIndex === -1) {
          state.tasks.push(action.payload);
        } else {
          state.tasks[existingIndex] = action.payload;
        }
      })
      .addCase(fetchTaskById.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(fetchMySubmission.fulfilled, (state, action) => {
        // Update the task with the submission status
        const taskIndex = state.tasks.findIndex(t => t._id === action.payload.taskId);
        if (taskIndex !== -1) {
          const task = state.tasks[taskIndex];
          
          if (action.payload.hasSubmission && action.payload.submission) {
            // Find existing submission for current user and update it
            const submissionIndex = task.submissions.findIndex(sub => {
              const subStudentId = typeof sub.student === 'object' ? sub.student?._id : sub.student;
              return subStudentId && subStudentId.toString() === action.payload.userId;
            });
            
            if (submissionIndex !== -1) {
              // Update existing submission
              task.submissions[submissionIndex] = {
                ...task.submissions[submissionIndex],
                ...action.payload.submission
              };
            } else {
              // Add new submission if it doesn't exist
              task.submissions.push(action.payload.submission);
            }
          } else {
            // Remove submission if it doesn't exist
            task.submissions = task.submissions.filter(sub => {
              const subStudentId = typeof sub.student === 'object' ? sub.student?._id : sub.student;
              return subStudentId && subStudentId.toString() !== action.payload.userId;
            });
          }
        }
      })
      .addCase(fetchMySubmission.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.push(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(submitTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          // Update the task with the new submission data
          state.tasks[index] = action.payload;
          console.log('Task updated after submission:', {
            taskId: action.payload._id,
            title: action.payload.title,
            submissionsCount: action.payload.submissions?.length || 0,
            submissions: action.payload.submissions?.map(sub => ({
              student: typeof sub.student === 'object' ? sub.student?._id : sub.student,
              status: sub.status
            }))
          });
        } else {
          // If task not found, add it to the list
          state.tasks.push(action.payload);
        }
        
        // Dispatch a custom event to notify components about task update
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('taskSubmitted', { 
            detail: { taskId: action.payload._id } 
          }));
        }
      })
      .addCase(submitTask.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(discardDraft.fulfilled, (state, action) => {
        const { taskId } = action.payload;
        const taskIndex = state.tasks.findIndex(t => t._id === taskId);
        if (taskIndex !== -1) {
          const userId = localStorage.getItem('userId');
          if (userId) {
            state.tasks[taskIndex].submissions = (state.tasks[taskIndex].submissions || []).filter(sub => {
              const subStudentId = typeof sub.student === 'object' ? sub.student?._id : sub.student;
              return subStudentId && subStudentId.toString() !== userId.toString();
            });
          }
        }
      })
      .addCase(discardDraft.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        } else {
          state.tasks.push(action.payload);
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        const deletedId = action.payload.id;
        state.tasks = state.tasks.filter(t => t._id !== deletedId);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(setSubmissionRemarks.fulfilled, (state, action) => {
        const task = action.payload.task;
        const index = state.tasks.findIndex(t => t._id === task._id);
        if (index !== -1) state.tasks[index] = task;
      })
      .addCase(setSubmissionRemarks.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(fetchTaskCount.fulfilled, (state, action) => {
        state.taskCount = action.payload.count;
      })
      // Interactions reducers
      .addCase(fetchInteractions.fulfilled, (state, action) => {
        const { taskId, studentId, messages, interactionEnabled } = action.payload;
        const task = state.tasks.find(t => t._id === taskId);
        if (!task) return;
        const targetStudentId = (studentId || localStorage.getItem('userId'))?.toString();
        const idx = (task.submissions || []).findIndex(s => {
          const sid = typeof s.student === 'object' ? s.student?._id : s.student;
          return sid && sid.toString() === targetStudentId;
        });
        if (idx !== -1) {
          task.submissions[idx].interactionMessages = messages || [];
        }
        if (typeof interactionEnabled !== 'undefined') {
          // also mirror flag on submission for convenience
          if (idx !== -1) {
            task.submissions[idx].interactionEnabled = interactionEnabled;
          }
        }
      })
      .addCase(postInteraction.fulfilled, (state, action) => {
        const { taskId, messages } = action.payload;
        const task = state.tasks.find(t => t._id === taskId);
        if (!task) return;
        const myId = localStorage.getItem('userId');
        const idx = (task.submissions || []).findIndex(s => {
          const sid = typeof s.student === 'object' ? s.student?._id : s.student;
          return sid && sid.toString() === (myId || '').toString();
        });
        if (idx !== -1) {
          task.submissions[idx].interactionMessages = messages;
        }
      })
      .addCase(replyInteraction.fulfilled, (state, action) => {
        const { taskId, studentId, messages } = action.payload;
        const task = state.tasks.find(t => t._id === taskId);
        if (!task) return;
        const idx = (task.submissions || []).findIndex(s => {
          const sid = typeof s.student === 'object' ? s.student?._id : s.student;
          return sid && sid.toString() === studentId.toString();
        });
        if (idx !== -1) {
          task.submissions[idx].interactionMessages = messages;
        }
      })
      .addCase(fetchGroupInteractions.fulfilled, (state, action) => {
        const { taskId, messages } = action.payload;
        const task = state.tasks.find(t => t._id === taskId);
        if (task) task.groupInteractionMessages = messages;
      })
      .addCase(postGroupInteraction.fulfilled, (state, action) => {
        const { taskId, message } = action.payload;
        const task = state.tasks.find(t => t._id === taskId);
        if (task && message) {
          task.groupInteractionMessages = task.groupInteractionMessages || [];
          task.groupInteractionMessages.push(message);
        }
      });
  },
});

export const { clearError } = taskSlice.actions;

// Helper function to check if a task is completed for a specific user
export const isTaskCompletedForUser = (task, userId) => {
  if (!task || !userId || !Array.isArray(task.submissions)) return false;

  const hasSubmission = task.submissions.some(submission => {
    const submissionStudentId = typeof submission.student === 'object' ? submission.student?._id : submission.student;
    const isSameStudent = submissionStudentId && submissionStudentId.toString() === userId.toString();
    const isFinalized = (submission.status && submission.status.toLowerCase() === 'submitted') || Boolean(submission.submittedAt);
    return isSameStudent && isFinalized;
  });

  if (process.env.NODE_ENV === 'development') {
    // Keep this log concise to avoid noise
    console.debug('[isTaskCompletedForUser]', task._id, hasSubmission);
  }

  return hasSubmission;
};

// Helper function to get user's submission for a task
export const getUserSubmissionForTask = (task, userId) => {
  if (!task || !userId || !task.submissions) return null;
  
  return task.submissions.find(sub => {
    const subStudentId = typeof sub.student === 'object' ? sub.student?._id : sub.student;
    return subStudentId && subStudentId.toString() === userId.toString();
  }) || null;
};

export default taskSlice.reducer;