import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Async thunks for Mid Term Marks

export const fetchMidTermMarks = createAsyncThunk(
  'marks/fetchMidTermMarks',
  async (params = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/marks/midterm`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch mid term marks');
    }
  }
);

export const createMidTermMarks = createAsyncThunk(
  'marks/createMidTermMarks',
  async (marksData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/marks/midterm`, marksData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create mid term marks');
    }
  }
);

export const uploadMidTermMarks = createAsyncThunk(
  'marks/uploadMidTermMarks',
  async (formData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/marks/midterm/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload mid term marks');
    }
  }
);

export const updateMidTermMarks = createAsyncThunk(
  'marks/updateMidTermMarks',
  async ({ marksId, marksData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/marks/midterm/${marksId}`, { marksData }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update mid term marks');
    }
  }
);

export const publishMidTermMarks = createAsyncThunk(
  'marks/publishMidTermMarks',
  async (marksId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/marks/midterm/${marksId}/publish`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to publish mid term marks');
    }
  }
);

export const fetchStudentMidTermMarks = createAsyncThunk(
  'marks/fetchStudentMidTermMarks',
  async (params = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/marks/midterm/student`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch student mid term marks');
    }
  }
);

// Async thunks for Task Marks

export const fetchTaskMarks = createAsyncThunk(
  'marks/fetchTaskMarks',
  async (taskId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/marks/task/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch task marks');
    }
  }
);

export const updateTaskMarks = createAsyncThunk(
  'marks/updateTaskMarks',
  async ({ taskId, marksData, maxMarks }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/marks/task/${taskId}`, { marksData, maxMarks }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update task marks');
    }
  }
);

export const publishTaskMarks = createAsyncThunk(
  'marks/publishTaskMarks',
  async (taskId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/marks/task/${taskId}/publish`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to publish task marks');
    }
  }
);

export const fetchStudentTaskMarks = createAsyncThunk(
  'marks/fetchStudentTaskMarks',
  async (taskId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/marks/task/${taskId}/student`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch student task marks');
    }
  }
);

const marksSlice = createSlice({
  name: 'marks',
  initialState: {
    midTermMarks: [],
    taskMarks: {},
    studentMidTermMarks: [],
    studentTaskMarks: {},
    // granular loading flags
    isLoadingMidTerm: false,
    isLoadingTaskMarks: false,
    isLoadingStudentTaskMarks: false,
    // legacy combined (computed on the fly below)
    isLoading: false,
    error: null,
    // caching helpers
    _taskMarksLoadingMap: {},
    _studentTaskMarksLoadingMap: {},
    _lastFetchedTaskMarksAt: {},
    _lastFetchedStudentTaskMarksAt: {}
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMarks: (state) => {
      state.midTermMarks = [];
      state.taskMarks = {};
      state.studentMidTermMarks = [];
      state.studentTaskMarks = {};
      state._lastFetchedTaskMarksAt = {};
      state._lastFetchedStudentTaskMarksAt = {};
    },
    invalidateTaskMarks: (state, action) => {
      const taskId = action.payload;
      if (taskId) {
        delete state._lastFetchedTaskMarksAt[taskId];
      } else {
        state._lastFetchedTaskMarksAt = {};
      }
    },
    invalidateStudentTaskMarks: (state, action) => {
      const taskId = action.payload;
      if (taskId) {
        delete state._lastFetchedStudentTaskMarksAt[taskId];
      } else {
        state._lastFetchedStudentTaskMarksAt = {};
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Mid Term Marks
      .addCase(fetchMidTermMarks.pending, (state) => {
        state.isLoadingMidTerm = true;
        state.error = null;
      })
      .addCase(fetchMidTermMarks.fulfilled, (state, action) => {
        state.isLoadingMidTerm = false;
        state.midTermMarks = action.payload;
      })
      .addCase(fetchMidTermMarks.rejected, (state, action) => {
        state.isLoadingMidTerm = false;
        state.error = action.payload;
      })
      
      // Create Mid Term Marks
      .addCase(createMidTermMarks.pending, (state) => {
        state.isLoadingMidTerm = true;
        state.error = null;
      })
      .addCase(createMidTermMarks.fulfilled, (state, action) => {
        state.isLoadingMidTerm = false;
        state.midTermMarks.unshift(action.payload);
      })
      .addCase(createMidTermMarks.rejected, (state, action) => {
        state.isLoadingMidTerm = false;
        state.error = action.payload;
      })
      
      // Upload Mid Term Marks
      .addCase(uploadMidTermMarks.pending, (state) => {
        state.isLoadingMidTerm = true;
        state.error = null;
      })
      .addCase(uploadMidTermMarks.fulfilled, (state, action) => {
        state.isLoadingMidTerm = false;
        state.midTermMarks.unshift(action.payload);
      })
      .addCase(uploadMidTermMarks.rejected, (state, action) => {
        state.isLoadingMidTerm = false;
        state.error = action.payload;
      })
      
      // Update Mid Term Marks
      .addCase(updateMidTermMarks.pending, (state) => {
        state.isLoadingMidTerm = true;
        state.error = null;
      })
      .addCase(updateMidTermMarks.fulfilled, (state, action) => {
        state.isLoadingMidTerm = false;
        const index = state.midTermMarks.findIndex(mark => mark._id === action.payload._id);
        if (index !== -1) {
          state.midTermMarks[index] = action.payload;
        }
      })
      .addCase(updateMidTermMarks.rejected, (state, action) => {
        state.isLoadingMidTerm = false;
        state.error = action.payload;
      })
      
      // Publish Mid Term Marks
      .addCase(publishMidTermMarks.pending, (state) => {
        state.isLoadingMidTerm = true;
        state.error = null;
      })
      .addCase(publishMidTermMarks.fulfilled, (state, action) => {
        state.isLoadingMidTerm = false;
        const index = state.midTermMarks.findIndex(mark => mark._id === action.payload.marks._id);
        if (index !== -1) {
          state.midTermMarks[index] = action.payload.marks;
        }
      })
      .addCase(publishMidTermMarks.rejected, (state, action) => {
        state.isLoadingMidTerm = false;
        state.error = action.payload;
      })
      
      // Fetch Student Mid Term Marks
      .addCase(fetchStudentMidTermMarks.pending, (state) => {
        state.isLoadingMidTerm = true;
        state.error = null;
      })
      .addCase(fetchStudentMidTermMarks.fulfilled, (state, action) => {
        state.isLoadingMidTerm = false;
        state.studentMidTermMarks = action.payload;
      })
      .addCase(fetchStudentMidTermMarks.rejected, (state, action) => {
        state.isLoadingMidTerm = false;
        state.error = action.payload;
      })
      
      // Fetch Task Marks
      .addCase(fetchTaskMarks.pending, (state, action) => {
        state.isLoadingTaskMarks = true;
        state.error = null;
        const taskId = action.meta.arg;
        state._taskMarksLoadingMap[taskId] = true;
      })
      .addCase(fetchTaskMarks.fulfilled, (state, action) => {
        state.isLoadingTaskMarks = false;
        if (action.payload) {
          const taskKey = (action.payload.task && action.payload.task._id) ? action.payload.task._id : action.payload.task;
          if (taskKey) {
            state.taskMarks[taskKey] = action.payload;
            state._lastFetchedTaskMarksAt[taskKey] = Date.now();
            delete state._taskMarksLoadingMap[taskKey];
          }
        }
      })
      .addCase(fetchTaskMarks.rejected, (state, action) => {
        state.isLoadingTaskMarks = false;
        state.error = action.payload;
        const taskId = action.meta.arg;
        delete state._taskMarksLoadingMap[taskId];
      })
      
      // Update Task Marks
      .addCase(updateTaskMarks.pending, (state) => {
        state.isLoadingTaskMarks = true;
        state.error = null;
      })
      .addCase(updateTaskMarks.fulfilled, (state, action) => {
        state.isLoadingTaskMarks = false;
        const taskKey = (action.payload.task && action.payload.task._id) ? action.payload.task._id : action.payload.task;
        if (taskKey) {
          state.taskMarks[taskKey] = action.payload;
          state._lastFetchedTaskMarksAt[taskKey] = Date.now();
        }
      })
      .addCase(updateTaskMarks.rejected, (state, action) => {
        state.isLoadingTaskMarks = false;
        state.error = action.payload;
      })
      
      // Publish Task Marks
      .addCase(publishTaskMarks.pending, (state) => {
        state.isLoadingTaskMarks = true;
        state.error = null;
      })
      .addCase(publishTaskMarks.fulfilled, (state, action) => {
        state.isLoadingTaskMarks = false;
        const taskKey = (action.payload.marks.task && action.payload.marks.task._id) ? action.payload.marks.task._id : action.payload.marks.task;
        if (taskKey) {
          state.taskMarks[taskKey] = action.payload.marks;
          state._lastFetchedTaskMarksAt[taskKey] = Date.now();
        }
      })
      .addCase(publishTaskMarks.rejected, (state, action) => {
        state.isLoadingTaskMarks = false;
        state.error = action.payload;
      })
      
      // Fetch Student Task Marks
      .addCase(fetchStudentTaskMarks.pending, (state, action) => {
        state.isLoadingStudentTaskMarks = true;
        state.error = null;
        const taskId = action.meta.arg;
        state._studentTaskMarksLoadingMap[taskId] = true;
      })
      .addCase(fetchStudentTaskMarks.fulfilled, (state, action) => {
        state.isLoadingStudentTaskMarks = false;
        if (action.payload) {
          const taskKey = (action.payload.task && action.payload.task._id) ? action.payload.task._id : action.payload.task;
          if (taskKey) {
            state.studentTaskMarks[taskKey] = action.payload;
            state._lastFetchedStudentTaskMarksAt[taskKey] = Date.now();
            delete state._studentTaskMarksLoadingMap[taskKey];
          }
        }
      })
      .addCase(fetchStudentTaskMarks.rejected, (state, action) => {
        state.isLoadingStudentTaskMarks = false;
        state.error = action.payload;
        const taskId = action.meta.arg;
        delete state._studentTaskMarksLoadingMap[taskId];
      });
  }
});

export const { clearError, clearMarks, invalidateTaskMarks, invalidateStudentTaskMarks } = marksSlice.actions;
export default marksSlice.reducer;
