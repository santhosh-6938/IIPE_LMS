import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Async thunks
export const inviteCoTeacher = createAsyncThunk(
  'coTeacher/inviteCoTeacher',
  async ({ classroomId, coTeacherEmail, invitationMessage }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/co-teacher/invite`, {
        classroomId,
        coTeacherEmail,
        invitationMessage
      }, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to invite co-teacher');
    }
  }
);

export const acceptCoTeacherInvitation = createAsyncThunk(
  'coTeacher/acceptCoTeacherInvitation',
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/co-teacher/accept/${token}`, {}, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to accept invitation');
    }
  }
);

export const declineCoTeacherInvitation = createAsyncThunk(
  'coTeacher/declineCoTeacherInvitation',
  async ({ token, declineReason }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/co-teacher/decline/${token}`, {
        declineReason
      }, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to decline invitation');
    }
  }
);

export const removeCoTeacher = createAsyncThunk(
  'coTeacher/removeCoTeacher',
  async (classroomId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_URL}/co-teacher/remove/${classroomId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to remove co-teacher');
    }
  }
);

export const fetchCoTeacherInvitations = createAsyncThunk(
  'coTeacher/fetchCoTeacherInvitations',
  async (classroomId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/co-teacher/invitations/${classroomId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to fetch invitations');
    }
  }
);

export const fetchCoTeacherClassrooms = createAsyncThunk(
  'coTeacher/fetchCoTeacherClassrooms',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/co-teacher/classrooms`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to fetch co-teacher classrooms');
    }
  }
);

export const fetchCoTeacherInvitationDetails = createAsyncThunk(
  'coTeacher/fetchCoTeacherInvitationDetails',
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/co-teacher/invitation/${token}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to fetch invitation details');
    }
  }
);

export const checkClassroomAccess = createAsyncThunk(
  'coTeacher/checkClassroomAccess',
  async (classroomId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/co-teacher/access/${classroomId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to check classroom access');
    }
  }
);

export const fetchClassroomActivity = createAsyncThunk(
  'coTeacher/fetchClassroomActivity',
  async ({ classroomId, page = 1, limit = 50 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/co-teacher/activity/${classroomId}?page=${page}&limit=${limit}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to fetch classroom activity');
    }
  }
);

const initialState = {
  invitations: [],
  coTeacherClassrooms: [],
  currentInvitation: null,
  classroomAccess: null,
  activityLogs: [],
  pagination: null,
  isLoading: false,
  error: null
};

const coTeacherSlice = createSlice({
  name: 'coTeacher',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearInvitations: (state) => {
      state.invitations = [];
    },
    clearCurrentInvitation: (state) => {
      state.currentInvitation = null;
    },
    clearActivityLogs: (state) => {
      state.activityLogs = [];
      state.pagination = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Invite Co-Teacher
      .addCase(inviteCoTeacher.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(inviteCoTeacher.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add the new invitation to the list
        if (action.payload.invitation) {
          state.invitations.push(action.payload.invitation);
        }
      })
      .addCase(inviteCoTeacher.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Accept Co-Teacher Invitation
      .addCase(acceptCoTeacherInvitation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(acceptCoTeacherInvitation.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update invitation status if it exists in the list
        const invitationIndex = state.invitations.findIndex(
          inv => inv.invitationToken === action.meta.arg
        );
        if (invitationIndex !== -1) {
          state.invitations[invitationIndex].status = 'accepted';
        }
      })
      .addCase(acceptCoTeacherInvitation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Decline Co-Teacher Invitation
      .addCase(declineCoTeacherInvitation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(declineCoTeacherInvitation.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update invitation status if it exists in the list
        const invitationIndex = state.invitations.findIndex(
          inv => inv.invitationToken === action.meta.arg
        );
        if (invitationIndex !== -1) {
          state.invitations[invitationIndex].status = 'declined';
        }
      })
      .addCase(declineCoTeacherInvitation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Remove Co-Teacher
      .addCase(removeCoTeacher.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeCoTeacher.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(removeCoTeacher.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Co-Teacher Invitations
      .addCase(fetchCoTeacherInvitations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCoTeacherInvitations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.invitations = action.payload.invitations || [];
      })
      .addCase(fetchCoTeacherInvitations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Co-Teacher Classrooms
      .addCase(fetchCoTeacherClassrooms.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCoTeacherClassrooms.fulfilled, (state, action) => {
        state.isLoading = false;
        state.coTeacherClassrooms = action.payload.classrooms || [];
      })
      .addCase(fetchCoTeacherClassrooms.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Co-Teacher Invitation Details
      .addCase(fetchCoTeacherInvitationDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCoTeacherInvitationDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentInvitation = action.payload.invitation;
      })
      .addCase(fetchCoTeacherInvitationDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Check Classroom Access
      .addCase(checkClassroomAccess.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkClassroomAccess.fulfilled, (state, action) => {
        state.isLoading = false;
        state.classroomAccess = action.payload;
      })
      .addCase(checkClassroomAccess.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Classroom Activity
      .addCase(fetchClassroomActivity.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchClassroomActivity.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activityLogs = action.payload.logs || [];
        state.pagination = action.payload.pagination || null;
      })
      .addCase(fetchClassroomActivity.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearInvitations, clearCurrentInvitation, clearActivityLogs } = coTeacherSlice.actions;
export default coTeacherSlice.reducer;
