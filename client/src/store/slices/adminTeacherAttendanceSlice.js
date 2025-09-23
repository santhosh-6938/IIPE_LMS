import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Async thunks
export const fetchTeacherAttendance = createAsyncThunk(
  'adminTeacherAttendance/fetchTeacherAttendance',
  async ({ date }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/teacher-attendance/date/${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch teacher attendance');
    }
  }
);

export const updateTeacherAttendance = createAsyncThunk(
  'adminTeacherAttendance/updateTeacherAttendance',
  async ({ teacherId, status, date, notes }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/admin/teacher-attendance/teacher/${teacherId}`, {
        status,
        date,
        notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update teacher attendance');
    }
  }
);

export const fetchTeacherAttendanceHistory = createAsyncThunk(
  'adminTeacherAttendance/fetchTeacherAttendanceHistory',
  async ({ startDate, endDate, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/teacher-attendance/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate, endDate, page, limit }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch teacher attendance history');
    }
  }
);

export const fetchTeacherAttendanceSummary = createAsyncThunk(
  'adminTeacherAttendance/fetchTeacherAttendanceSummary',
  async ({ teacherId, startDate, endDate }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/teacher-attendance/teacher/${teacherId}/summary`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch teacher attendance summary');
    }
  }
);

export const fetchTeacherAttendanceStatistics = createAsyncThunk(
  'adminTeacherAttendance/fetchTeacherAttendanceStatistics',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/teacher-attendance/statistics`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch teacher attendance statistics');
    }
  }
);

export const downloadTeacherAttendanceReport = createAsyncThunk(
  'adminTeacherAttendance/downloadTeacherAttendanceReport',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/teacher-attendance/download`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate, endDate },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `teacher-attendance-report-${startDate}-to-${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { message: 'Teacher attendance report downloaded successfully' };
    } catch (error) {
      return rejectWithValue('Failed to download teacher attendance report');
    }
  }
);

const adminTeacherAttendanceSlice = createSlice({
  name: 'adminTeacherAttendance',
  initialState: {
    currentAttendance: null,
    attendanceHistory: [],
    teacherSummary: null,
    statistics: null,
    dailyData: [],
    pagination: {},
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
    clearTeacherAttendance: (state) => {
      state.currentAttendance = null;
      state.attendanceHistory = [];
      state.teacherSummary = null;
      state.statistics = null;
      state.dailyData = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch teacher attendance
      .addCase(fetchTeacherAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTeacherAttendance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentAttendance = action.payload.attendance;
      })
      .addCase(fetchTeacherAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update teacher attendance
      .addCase(updateTeacherAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTeacherAttendance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentAttendance = action.payload.attendance;
        state.successMessage = action.payload.message;
      })
      .addCase(updateTeacherAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch teacher attendance history
      .addCase(fetchTeacherAttendanceHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTeacherAttendanceHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.attendanceHistory = action.payload.attendance;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTeacherAttendanceHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch teacher attendance summary
      .addCase(fetchTeacherAttendanceSummary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTeacherAttendanceSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.teacherSummary = action.payload.summary;
      })
      .addCase(fetchTeacherAttendanceSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch teacher attendance statistics
      .addCase(fetchTeacherAttendanceStatistics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTeacherAttendanceStatistics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.statistics = action.payload.statistics;
        state.dailyData = action.payload.dailyData;
      })
      .addCase(fetchTeacherAttendanceStatistics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Download teacher attendance report
      .addCase(downloadTeacherAttendanceReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(downloadTeacherAttendanceReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = action.payload.message;
      })
      .addCase(downloadTeacherAttendanceReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSuccessMessage, clearTeacherAttendance } = adminTeacherAttendanceSlice.actions;
export default adminTeacherAttendanceSlice.reducer;
