const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { logActivity } = require('../middleware/activity');
const { sendPasswordResetEmail } = require('../services/emailService');

// Register new user
const register = async (req, res) => {
  try {
    const { name, email, password, role, rollNumber, adminCode } = req.body;

    // Check if user already exists by email
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Check if roll number already exists (for students)
    if (role === 'student' && rollNumber) {
      const existingUserByRoll = await User.findOne({ rollNumber: rollNumber.toUpperCase() });
      if (existingUserByRoll) {
        return res.status(400).json({ message: 'User with this roll number already exists' });
      }
    }

    // Determine role safely: allow self-signup as student or admin.
    // Admin self-signup is now allowed without access code requirement.
    let safeRole = 'student';
    if (role === 'admin') {
      safeRole = 'admin';
    }

    // Create user (password will be hashed by User model middleware)
    const userData = {
      name,
      email,
      password: password, // Don't hash here - User model will handle it
      role: safeRole,
      createdBy: null, // Self-registered
      updatedBy: null
    };

    // Add roll number for students
    if (safeRole === 'student' && rollNumber) {
      userData.rollNumber = rollNumber.toUpperCase();
    }

    const user = new User(userData);
    await user.save();
    try { await logActivity({ user }, 'auth.register', 'user', user._id, { role: user.role }); } catch {}

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        rollNumber: user.rollNumber,
        role: user.role,
        isFirstLogin: user.isFirstLogin
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, rollNumber, password } = req.body;

    // Determine login method and find user
    let user;
    if (email) {
      const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : email;
      user = await User.findOne({ email: normalizedEmail });
    } else if (rollNumber) {
      user = await User.findOne({ rollNumber: rollNumber.toUpperCase() });
    } else {
      return res.status(400).json({ message: 'Please provide email or roll number' });
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user account is blocked
    if (user.isBlocked) {
      console.log('Login blocked: User account is blocked', { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        blockedAt: user.blockedAt,
        blockedBy: user.blockedBy,
        blockedReason: user.blockedReason
      });
      return res.status(403).json({ 
        message: 'Your account has been blocked. Please contact admin.',
        code: 'ACCOUNT_BLOCKED'
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      console.log('Login blocked: User account is inactive', { 
        userId: user._id, 
        email: user.email, 
        role: user.role
      });
      return res.status(403).json({ 
        message: 'Your account is inactive. Please contact admin.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Login password comparison:', {
      userId: user._id,
      email: user.email,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0,
      inputPasswordLength: password ? password.length : 0,
      isMatch: isMatch
    });
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        rollNumber: user.rollNumber,
        role: user.role,
        isFirstLogin: user.isFirstLogin
      }
    });
    try { await logActivity(req, 'auth.login', 'user', user._id, {}); } catch {}
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change password on first login
const changePasswordFirstLogin = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isFirstLogin) {
      return res.status(400).json({ message: 'Password change not required' });
    }

    // Debug information
    console.log('Password change attempt:', {
      userId: user._id,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0,
      currentPasswordLength: currentPassword ? currentPassword.length : 0,
      isFirstLogin: user.isFirstLogin
    });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    console.log('Password comparison result:', isMatch);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Enforce: new password must not match any of last 3 hashes
    const historyToCheck = [...(user.passwordHistory || []), user.password].slice(-3);
    for (const prevHash of historyToCheck) {
      const sameAsPrev = await bcrypt.compare(newPassword, prevHash);
      if (sameAsPrev) {
        return res.status(400).json({ message: 'New password cannot be same as any of the last 3 passwords' });
      }
    }

    // Push previous password into history and cap to last 3
    const updatedHistory = [...(user.passwordHistory || []), user.password];
    user.passwordHistory = updatedHistory.slice(-3);

    // Update user (let mongoose pre-save hook hash it)
    user.password = newPassword;
    user.isFirstLogin = false;
    user.updatedBy = user._id;
    user.passwordChangeHistory.push({
      changedAt: new Date(),
      changedBy: user._id
    });
    user.passwordChangeCount = (user.passwordChangeCount || 0) + 1;

    await user.save();

    // Return updated user (without password)
    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      rollNumber: user.rollNumber,
      role: user.role,
      isFirstLogin: user.isFirstLogin
    };

    res.json({ message: 'Password changed successfully', user: safeUser });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Forgot password - issue OTP and reset link
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Always respond success to avoid user enumeration
    if (!user) {
      return res.json({ message: 'If the email exists, reset instructions were sent' });
    }

    // Generate 6-digit OTP and random token
    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
    const rawToken = crypto.randomBytes(32).toString('hex');

    // Hash OTP for storage
    const otpSalt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, otpSalt);

    // Optionally hash token for storage as well
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Set expiry (5 minutes)
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    user.resetPasswordOTP = hashedOtp;
    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = expires;
    await user.save();

    // Build reset link with token and iat
    const clientBase = process.env.CLIENT_URL || process.env.APP_URL || 'http://localhost:5173';
    const signed = jwt.sign({ uid: user._id.toString(), t: rawToken }, process.env.JWT_SECRET, { expiresIn: '5m' });
    const resetLink = `${clientBase}/reset-password?token=${encodeURIComponent(signed)}`;

    // Send email (best-effort)
    try {
      await sendPasswordResetEmail(user.email, user.name || 'User', otp, resetLink);
    } catch (e) {
      // Log and still return success to avoid leaking config
      console.error('sendPasswordResetEmail error:', e);
    }

    return res.json({ message: 'If the email exists, reset instructions were sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset password (via signed token or email + OTP)
const resetPassword = async (req, res) => {
  try {
    const { token, email, otp, newPassword } = req.body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    let user = null;

    if (token) {
      // Validate signed token
      let decoded = null;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }
      const { uid, t } = decoded || {};
      if (!uid || !t) {
        return res.status(400).json({ message: 'Invalid token payload' });
      }
      const tokenHash = crypto.createHash('sha256').update(t).digest('hex');
      user = await User.findById(uid);
      if (!user || !user.resetPasswordToken) {
        return res.status(400).json({ message: 'Invalid reset request' });
      }
      if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
        return res.status(400).json({ message: 'Reset token expired' });
      }
      if (user.resetPasswordToken !== tokenHash) {
        return res.status(400).json({ message: 'Invalid reset token' });
      }
    } else {
      // Email + OTP flow
      if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
      }
      user = await User.findOne({ email: (email || '').toLowerCase().trim() });
      if (!user || !user.resetPasswordOTP) {
        return res.status(400).json({ message: 'Invalid reset request' });
      }
      if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
        return res.status(400).json({ message: 'OTP expired' });
      }
      const otpMatches = await bcrypt.compare(String(otp), user.resetPasswordOTP);
      if (!otpMatches) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }
    }

    // Enforce: new password must not match any of last 3 hashes
    const historyToCheck = [...(user.passwordHistory || []), user.password].slice(-3);
    for (const prevHash of historyToCheck) {
      const sameAsPrev = await bcrypt.compare(newPassword, prevHash);
      if (sameAsPrev) {
        return res.status(400).json({ message: 'New password cannot be same as any of the last 3 passwords' });
      }
    }

    // Push previous password into history and cap to last 3
    const updatedHistory = [...(user.passwordHistory || []), user.password];
    user.passwordHistory = updatedHistory.slice(-3);

    // Update password and clear reset artifacts
    user.password = newPassword;
    user.updatedBy = user._id;
    user.passwordChangeHistory.push({ changedAt: new Date(), changedBy: user._id });
    user.passwordChangeCount = (user.passwordChangeCount || 0) + 1;
    user.resetPasswordOTP = null;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    return res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  changePasswordFirstLogin,
  forgotPassword,
  resetPassword
};
