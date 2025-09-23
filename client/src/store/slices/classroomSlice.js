import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Async thunks
export const fetchClassrooms = createAsyncThunk(
  'classroom/fetchClassrooms',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/classrooms`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || 'Request failed');
    }
  }
);

export const createClassroom = createAsyncThunk(
  'classroom/createClassroom',
  async (classroomData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/classrooms`, classroomData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || 'Request failed');
    }
  }
);

export const updateClassroom = createAsyncThunk(
  'classroom/updateClassroom',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/classrooms/${id}`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || 'Request failed');
    }
  }
);

export const deleteClassroom = createAsyncThunk(
  'classroom/deleteClassroom',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/classrooms/${id}`, {
        headers: getAuthHeaders()
      });
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Join classroom functionality has been removed

const classroomSlice = createSlice({
  name: 'classroom',
  initialState: {
    classrooms: [],
    currentClassroom: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    setCurrentClassroom: (state, action) => {
      state.currentClassroom = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClassrooms.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchClassrooms.fulfilled, (state, action) => {
        state.isLoading = false;
        state.classrooms = action.payload;
      })
      .addCase(fetchClassrooms.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createClassroom.fulfilled, (state, action) => {
        state.classrooms.push(action.payload);
      })
      .addCase(updateClassroom.fulfilled, (state, action) => {
        const index = state.classrooms.findIndex(c => c._id === action.payload._id);
        if (index !== -1) {
          state.classrooms[index] = action.payload;
        }
      })
      .addCase(deleteClassroom.fulfilled, (state, action) => {
        state.classrooms = state.classrooms.filter(c => c._id !== action.payload);
      })
      // Join classroom functionality has been removed
  },
});

export const { setCurrentClassroom, clearError } = classroomSlice.actions;
export default classroomSlice.reducer;