import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Async thunks
export const fetchAttendance = createAsyncThunk(
  'attendance/fetchAttendance',
  async ({ classroomId, date }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/attendance/classroom/${classroomId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { date }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance');
    }
  }
);

export const updateStudentAttendance = createAsyncThunk(
  'attendance/updateStudentAttendance',
  async ({ classroomId, studentId, status, date, notes }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/attendance/classroom/${classroomId}/student/${studentId}`, {
        status,
        date,
        notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update attendance');
    }
  }
);

export const fetchAttendanceHistory = createAsyncThunk(
  'attendance/fetchAttendanceHistory',
  async ({ classroomId, startDate, endDate, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/attendance/classroom/${classroomId}/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate, endDate, page, limit }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance history');
    }
  }
);

export const fetchStudentAttendanceSummary = createAsyncThunk(
  'attendance/fetchStudentAttendanceSummary',
  async ({ classroomId, studentId, startDate, endDate }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/attendance/classroom/${classroomId}/student/${studentId}/summary`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch student attendance summary');
    }
  }
);

export const fetchAttendanceStatistics = createAsyncThunk(
  'attendance/fetchAttendanceStatistics',
  async ({ classroomId, startDate, endDate }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/attendance/classroom/${classroomId}/statistics`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance statistics');
    }
  }
);

export const downloadAttendanceReport = createAsyncThunk(
  'attendance/downloadAttendanceReport',
  async ({ classroomId, startDate, endDate }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/attendance/classroom/${classroomId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate, endDate },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-report-${startDate}-to-${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { message: 'Report downloaded successfully' };
    } catch (error) {
      return rejectWithValue('Failed to download attendance report');
    }
  }
);

export const freezeAttendance = createAsyncThunk(
  'attendance/freezeAttendance',
  async ({ classroomId, date }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/attendance/classroom/${classroomId}/freeze`, { date }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to freeze attendance');
    }
  }
);

export const unfreezeAttendance = createAsyncThunk(
  'attendance/unfreezeAttendance',
  async ({ classroomId, date }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/attendance/classroom/${classroomId}/unfreeze`, { date }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to unfreeze attendance');
    }
  }
);

export const fetchStudentOwnAttendance = createAsyncThunk(
  'attendance/fetchStudentOwnAttendance',
  async ({ classroomId, startDate, endDate }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/attendance/student/summary`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { classroomId, startDate, endDate }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance summary');
    }
  }
);

// Admin actions for viewing all student attendance
export const fetchAllStudentAttendance = createAsyncThunk(
  'attendance/fetchAllStudentAttendance',
  async ({ startDate, endDate, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/attendance/admin/all-students`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate, endDate, page, limit }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch all student attendance');
    }
  }
);

export const fetchAllStudentAttendanceStatistics = createAsyncThunk(
  'attendance/fetchAllStudentAttendanceStatistics',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/attendance/admin/statistics`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch all student attendance statistics');
    }
  }
);

export const downloadAllStudentAttendanceReport = createAsyncThunk(
  'attendance/downloadAllStudentAttendanceReport',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/attendance/admin/download`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate, endDate },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `all-student-attendance-report-${startDate}-to-${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { message: 'All student attendance report downloaded successfully' };
    } catch (error) {
      return rejectWithValue('Failed to download all student attendance report');
    }
  }
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    currentAttendance: null,
    attendanceHistory: [],
    studentSummary: null,
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
    clearAttendance: (state) => {
      state.currentAttendance = null;
      state.attendanceHistory = [];
      state.studentSummary = null;
      state.statistics = null;
      state.dailyData = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch attendance
      .addCase(fetchAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAttendance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentAttendance = action.payload.attendance;
      })
      .addCase(fetchAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update student attendance
      .addCase(updateStudentAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateStudentAttendance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentAttendance = action.payload.attendance;
        state.successMessage = action.payload.message;
      })
      .addCase(updateStudentAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch attendance history
      .addCase(fetchAttendanceHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.attendanceHistory = action.payload.attendance;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAttendanceHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch student attendance summary
      .addCase(fetchStudentAttendanceSummary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentAttendanceSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.studentSummary = action.payload.summary;
      })
      .addCase(fetchStudentAttendanceSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch attendance statistics
      .addCase(fetchAttendanceStatistics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceStatistics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.statistics = action.payload.statistics;
        state.dailyData = action.payload.dailyData;
      })
      .addCase(fetchAttendanceStatistics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Download attendance report
      .addCase(downloadAttendanceReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(downloadAttendanceReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = action.payload.message;
      })
      .addCase(downloadAttendanceReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Freeze attendance
      .addCase(freezeAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(freezeAttendance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentAttendance = action.payload.attendance;
        state.successMessage = action.payload.message;
      })
      .addCase(freezeAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Unfreeze attendance
      .addCase(unfreezeAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(unfreezeAttendance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentAttendance = action.payload.attendance;
        state.successMessage = action.payload.message;
      })
      .addCase(unfreezeAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch student own attendance
      .addCase(fetchStudentOwnAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentOwnAttendance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.studentSummary = action.payload.summary;
      })
      .addCase(fetchStudentOwnAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch all student attendance (admin)
      .addCase(fetchAllStudentAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllStudentAttendance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.attendanceHistory = action.payload.attendance;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllStudentAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch all student attendance statistics (admin)
      .addCase(fetchAllStudentAttendanceStatistics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllStudentAttendanceStatistics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.statistics = action.payload.statistics;
        state.dailyData = action.payload.dailyData;
      })
      .addCase(fetchAllStudentAttendanceStatistics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Download all student attendance report (admin)
      .addCase(downloadAllStudentAttendanceReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(downloadAllStudentAttendanceReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = action.payload.message;
      })
      .addCase(downloadAllStudentAttendanceReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSuccessMessage, clearAttendance } = attendanceSlice.actions;
export default attendanceSlice.reducer;
