import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
export const createTeacher = createAsyncThunk(
  'admin/createTeacher',
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/admin/users/teacher`, { name, email, password }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create teacher');
    }
  }
);

// Async thunks
export const fetchUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'admin/fetchUserById',
  async (userId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
    }
  }
);

// User blocking actions
export const blockUser = createAsyncThunk(
  'admin/blockUser',
  async ({ userId, reason }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/user-blocking/block/${userId}`, 
        { reason }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to block user');
    }
  }
);

export const unblockUser = createAsyncThunk(
  'admin/unblockUser',
  async (userId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/user-blocking/unblock/${userId}`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to unblock user');
    }
  }
);

export const fetchBlockedUsers = createAsyncThunk(
  'admin/fetchBlockedUsers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/user-blocking/blocked`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch blocked users');
    }
  }
);

export const getUserBlockingStatus = createAsyncThunk(
  'admin/getUserBlockingStatus',
  async (userId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/user-blocking/status/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch user blocking status');
    }
  }
);

export const bulkBlockUsers = createAsyncThunk(
  'admin/bulkBlockUsers',
  async ({ userIds, reason }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/user-blocking/bulk-block`, 
        { userIds, reason }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to bulk block users');
    }
  }
);

export const updateUser = createAsyncThunk(
  'admin/updateUser',
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/admin/users/${userId}`, userData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { userId, message: response.data.message };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
    }
  }
);

export const fetchStatistics = createAsyncThunk(
  'admin/fetchStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/statistics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch statistics');
    }
  }
);

export const fetchClassrooms = createAsyncThunk(
  'admin/fetchClassrooms',
  async (params = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/classrooms`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch classrooms');
    }
  }
);

export const fetchTasks = createAsyncThunk(
  'admin/fetchTasks',
  async (params = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
    }
  }
);

export const fetchTeacherActivity = createAsyncThunk(
  'admin/fetchTeacherActivity',
  async (params = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/teacher-activity`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch teacher activity');
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    users: [],
    currentUser: null,
    statistics: null,
    classrooms: [],
    tasks: [],
    teacherActivity: null,
    blockedUsers: [],
    userBlockingStatus: null,
    pagination: {
      users: {},
      classrooms: {},
      tasks: {},
      blockedUsers: {}
    },
    isLoading: false,
    error: null,
    successMessage: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    clearCurrentUser: (state) => {
      state.currentUser = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create teacher
      .addCase(createTeacher.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTeacher.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = action.payload.message || 'Teacher created successfully';
        // Prepend new teacher to list if on first page
        if (state.users) {
          state.users.unshift({
            _id: action.payload.teacher?.id || action.payload.user?.id,
            name: action.payload.teacher?.name || action.payload.user?.name,
            email: action.payload.teacher?.email || action.payload.user?.email,
            role: action.payload.teacher?.role || action.payload.user?.role || 'teacher',
            createdAt: new Date().toISOString()
          });
        }
      })
      .addCase(createTeacher.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.users;
        state.pagination.users = action.payload.pagination;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch user by ID
      .addCase(fetchUserById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUser = action.payload.user;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update user
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = action.payload.message;
        // Update user in the list
        const index = state.users.findIndex(user => user._id === action.payload.user.id);
        if (index !== -1) {
          state.users[index] = action.payload.user;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = action.payload.message;
        // Remove user from the list
        state.users = state.users.filter(user => user._id !== action.payload.userId);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch statistics
      .addCase(fetchStatistics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStatistics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.statistics = action.payload;
      })
      .addCase(fetchStatistics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch classrooms
      .addCase(fetchClassrooms.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchClassrooms.fulfilled, (state, action) => {
        state.isLoading = false;
        state.classrooms = action.payload.classrooms;
        state.pagination.classrooms = action.payload.pagination;
      })
      .addCase(fetchClassrooms.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch tasks
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload.tasks;
        state.pagination.tasks = action.payload.pagination;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch teacher activity
      .addCase(fetchTeacherActivity.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTeacherActivity.fulfilled, (state, action) => {
        state.isLoading = false;
        state.teacherActivity = action.payload;
      })
      .addCase(fetchTeacherActivity.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Block user
      .addCase(blockUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(blockUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = action.payload.message || 'User blocked successfully';
        // Update user in the list
        const userIndex = state.users.findIndex(user => user._id === action.payload.data.userId);
        if (userIndex !== -1) {
          state.users[userIndex].isBlocked = true;
          state.users[userIndex].blockedAt = action.payload.data.blockedAt;
          state.users[userIndex].blockedReason = action.payload.data.blockedReason;
        }
      })
      .addCase(blockUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Unblock user
      .addCase(unblockUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(unblockUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = action.payload.message || 'User unblocked successfully';
        // Update user in the list
        const userIndex = state.users.findIndex(user => user._id === action.payload.data.userId);
        if (userIndex !== -1) {
          state.users[userIndex].isBlocked = false;
          state.users[userIndex].blockedAt = null;
          state.users[userIndex].blockedReason = null;
        }
      })
      .addCase(unblockUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch blocked users
      .addCase(fetchBlockedUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBlockedUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.blockedUsers = action.payload.data.users;
        state.pagination.blockedUsers = action.payload.data.pagination;
      })
      .addCase(fetchBlockedUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get user blocking status
      .addCase(getUserBlockingStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUserBlockingStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userBlockingStatus = action.payload.data;
      })
      .addCase(getUserBlockingStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Bulk block users
      .addCase(bulkBlockUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(bulkBlockUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = action.payload.message || 'Users blocked successfully';
        // Update users in the list
        action.payload.data.blockedUsers.forEach(blockedUser => {
          const userIndex = state.users.findIndex(user => user._id === blockedUser.userId);
          if (userIndex !== -1) {
            state.users[userIndex].isBlocked = true;
            state.users[userIndex].blockedAt = new Date().toISOString();
            state.users[userIndex].blockedReason = action.payload.data.reason;
          }
        });
      })
      .addCase(bulkBlockUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSuccessMessage, clearCurrentUser } = adminSlice.actions;
export default adminSlice.reducer;
