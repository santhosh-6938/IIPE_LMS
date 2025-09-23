const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logActivity } = require('../middleware/activity');

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

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user (let mongoose pre-save hook hash it)
    user.password = newPassword;
    user.updatedBy = user._id;
    user.passwordChangeHistory.push({
      changedAt: new Date(),
      changedBy: user._id
    });

    await user.save();

    res.json({ message: 'Password reset successfully' });
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
  resetPassword
};
