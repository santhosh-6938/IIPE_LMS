import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      console.log('Login attempt with credentials:', {
        hasEmail: !!credentials.email,
        hasRollNumber: !!credentials.rollNumber,
        hasPassword: !!credentials.password
      });
      
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      console.log('Login response received:', {
        success: !!response.data.token,
        hasUser: !!response.data.user,
        userRole: response.data.user?.role
      });
      
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      const status = error.response?.status;
      const code = error.response?.data?.code;
      const message = error.response?.data?.message || 'Login failed';
      if (status === 403 && code === 'ACCOUNT_BLOCKED') {
        // Ensure no stale auth remains
        try { localStorage.removeItem('token'); } catch {}
        return rejectWithValue({ code, message });
      }
      return rejectWithValue(message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data; // Note: API returns user object directly
    } catch (error) {
      console.error('Token validation error:', error);
      // Clear invalid token
      localStorage.removeItem('token');
      
      if (error.response?.status === 401) {
        return rejectWithValue('Token expired or invalid');
      } else if (error.response?.status === 403) {
        return rejectWithValue('Access denied');
      } else {
        return rejectWithValue(error.response?.data?.message || 'Failed to validate token');
      }
    }
  }
);

// Forgot password - request OTP and reset link via email
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/forgot`, { email });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send reset email');
    }
  }
);

// Reset password using token or email+otp
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/reset`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reset password');
    }
  }
);

// Change password on first login
export const changePasswordFirstLogin = createAsyncThunk(
  'auth/changePasswordFirstLogin',
  async (passwordData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/auth/change-password-first-login`, passwordData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to change password');
    }
  }
);

// Send email verification OTP
export const sendEmailVerificationOTP = createAsyncThunk(
  'auth/sendEmailVerificationOTP',
  async ({ email, purpose = 'signup' }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/email-verification/send-otp`, {
        email,
        purpose
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send verification code');
    }
  }
);

// Verify email OTP
export const verifyEmailOTP = createAsyncThunk(
  'auth/verifyEmailOTP',
  async ({ email, otp, purpose = 'signup' }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/email-verification/verify-otp`, {
        email,
        otp,
        purpose
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to verify code');
    }
  }
);

// Get concurrent login requests
export const getConcurrentLoginRequests = createAsyncThunk(
  'auth/getConcurrentLoginRequests',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/session-management/concurrent-login-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get concurrent login requests');
    }
  }
);

// Handle concurrent login response
export const handleConcurrentLoginResponse = createAsyncThunk(
  'auth/handleConcurrentLoginResponse',
  async ({ requestId, response }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response_data = await axios.post(`${API_URL}/session-management/concurrent-login-response`, {
        requestId,
        response
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response_data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to handle concurrent login response');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('token'),
    isLoading: false,
    isAuthenticated: false,
    error: null,
    blocked: false,
    resetStatus: null,
    emailVerification: {
      isLoading: false,
      error: null,
      isVerified: false,
      expiresIn: null
    },
    concurrentLogin: {
      requests: [],
      isLoading: false,
      error: null
    }
  },
  reducers: {
    logout: (state) => {
      console.log('Logout action triggered, clearing auth state');
      localStorage.removeItem('token');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.resetStatus = null;
      state.isLoading = false;
      console.log('Auth state cleared, isAuthenticated:', state.isAuthenticated);
    },
    clearError: (state) => {
      state.error = null;
      state.blocked = false;
    },
    clearAuth: (state) => {
      localStorage.removeItem('token');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    clearEmailVerificationError: (state) => {
      state.emailVerification.error = null;
    },
    setEmailVerified: (state, action) => {
      state.emailVerification.isVerified = action.payload;
    },
    clearConcurrentLoginError: (state) => {
      state.concurrentLogin.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        // Handle blocked account specially
        if (typeof action.payload === 'object' && action.payload?.code === 'ACCOUNT_BLOCKED') {
          state.error = action.payload.message;
          state.blocked = true;
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        } else if (typeof action.payload === 'object' && action.payload?.code === 'IP_BLOCKED') {
          state.error = action.payload.message;
          state.blocked = true;
        } else {
          state.error = action.payload;
        }
      })
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(loadUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload; // API returns user directly
        state.isAuthenticated = true;
      })
      .addCase(loadUser.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      .addCase(changePasswordFirstLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePasswordFirstLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(changePasswordFirstLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.resetStatus = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.resetStatus = 'email_sent';
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.resetStatus = 'reset_success';
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(sendEmailVerificationOTP.pending, (state) => {
        state.emailVerification.isLoading = true;
        state.emailVerification.error = null;
      })
      .addCase(sendEmailVerificationOTP.fulfilled, (state, action) => {
        state.emailVerification.isLoading = false;
        state.emailVerification.expiresIn = action.payload.expiresIn;
      })
      .addCase(sendEmailVerificationOTP.rejected, (state, action) => {
        state.emailVerification.isLoading = false;
        state.emailVerification.error = action.payload;
      })
      .addCase(verifyEmailOTP.pending, (state) => {
        state.emailVerification.isLoading = true;
        state.emailVerification.error = null;
      })
      .addCase(verifyEmailOTP.fulfilled, (state) => {
        state.emailVerification.isLoading = false;
        state.emailVerification.isVerified = true;
      })
      .addCase(verifyEmailOTP.rejected, (state, action) => {
        state.emailVerification.isLoading = false;
        state.emailVerification.error = action.payload;
      })
      .addCase(getConcurrentLoginRequests.pending, (state) => {
        state.concurrentLogin.isLoading = true;
        state.concurrentLogin.error = null;
      })
      .addCase(getConcurrentLoginRequests.fulfilled, (state, action) => {
        state.concurrentLogin.isLoading = false;
        state.concurrentLogin.requests = action.payload.requests;
      })
      .addCase(getConcurrentLoginRequests.rejected, (state, action) => {
        state.concurrentLogin.isLoading = false;
        state.concurrentLogin.error = action.payload;
      })
      .addCase(handleConcurrentLoginResponse.pending, (state) => {
        state.concurrentLogin.isLoading = true;
        state.concurrentLogin.error = null;
      })
      .addCase(handleConcurrentLoginResponse.fulfilled, (state, action) => {
        state.concurrentLogin.isLoading = false;
        // Remove the handled request from the list
        state.concurrentLogin.requests = state.concurrentLogin.requests.filter(
          req => req.requestId !== action.meta.arg.requestId
        );
      })
      .addCase(handleConcurrentLoginResponse.rejected, (state, action) => {
        state.concurrentLogin.isLoading = false;
        state.concurrentLogin.error = action.payload;
      });
  },
});

export const { 
  logout, 
  clearError, 
  clearAuth, 
  updateUser, 
  clearEmailVerificationError, 
  setEmailVerified, 
  clearConcurrentLoginError 
} = authSlice.actions;
export default authSlice.reducer;