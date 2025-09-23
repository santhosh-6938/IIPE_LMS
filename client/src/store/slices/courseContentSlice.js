import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Async thunks
export const fetchCourseContent = createAsyncThunk(
  'courseContent/fetchCourseContent',
  async (classroomId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/course-content/classroom/${classroomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch course content');
    }
  }
);

export const uploadCourseContent = createAsyncThunk(
  'courseContent/uploadCourseContent',
  async ({ classroomId, formData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/course-content/upload/${classroomId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload course content');
    }
  }
);

export const deleteCourseContent = createAsyncThunk(
  'courseContent/deleteCourseContent',
  async (contentId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/course-content/${contentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return contentId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete course content');
    }
  }
);

export const updateCourseContent = createAsyncThunk(
  'courseContent/updateCourseContent',
  async ({ contentId, updateData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/course-content/${contentId}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update course content');
    }
  }
);

const courseContentSlice = createSlice({
  name: 'courseContent',
  initialState: {
    content: [],
    isLoading: false,
    error: null,
    uploadProgress: 0,
    isUploading: false
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    clearContent: (state) => {
      state.content = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch course content
      .addCase(fetchCourseContent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCourseContent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.content = action.payload;
      })
      .addCase(fetchCourseContent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Upload course content
      .addCase(uploadCourseContent.pending, (state) => {
        state.isUploading = true;
        state.error = null;
        state.uploadProgress = 0;
      })
      .addCase(uploadCourseContent.fulfilled, (state, action) => {
        state.isUploading = false;
        state.uploadProgress = 0;
        state.content.unshift(action.payload);
      })
      .addCase(uploadCourseContent.rejected, (state, action) => {
        state.isUploading = false;
        state.uploadProgress = 0;
        state.error = action.payload;
      })
      // Delete course content
      .addCase(deleteCourseContent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteCourseContent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.content = state.content.filter(item => item._id !== action.payload);
      })
      .addCase(deleteCourseContent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update course content
      .addCase(updateCourseContent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCourseContent.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.content.findIndex(item => item._id === action.payload._id);
        if (index !== -1) {
          state.content[index] = action.payload;
        }
      })
      .addCase(updateCourseContent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setUploadProgress, clearContent } = courseContentSlice.actions;
export default courseContentSlice.reducer;
