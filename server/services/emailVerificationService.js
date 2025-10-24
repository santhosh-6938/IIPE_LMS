const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const EmailVerification = require('../models/EmailVerification');
const { sendEmail } = require('./emailService');
const { renderEmailTemplate } = require('./emailTemplateService');

// Generate 4-digit OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Send OTP email using database template
const sendOTPEmail = async (email, otp, purpose) => {
  try {
    const templateName = purpose === 'signup' 
      ? 'email_verification_signup' 
      : 'email_verification_login';

    const template = await renderEmailTemplate(templateName, {
      userName: 'User', // We don't have user name at this point
      otp: otp
    });

    return await sendEmail(email, template.subject, template.bodyHtml, template.bodyText);
  } catch (error) {
    console.error('Error rendering email template:', error);
    throw error;
  }
};

// Send email verification OTP
const sendEmailVerificationOTP = async (email, purpose = 'signup') => {
  try {
    // Check if there's already a pending verification for this email
    const existingVerification = await EmailVerification.findOne({
      email: email.toLowerCase(),
      purpose,
      isVerified: false,
      expiresAt: { $gt: new Date() }
    });

    if (existingVerification) {
      // Delete existing verification to create a new one (no limits as per requirements)
      await EmailVerification.findByIdAndDelete(existingVerification._id);
    }

    // Generate OTP and hash it
    const otp = generateOTP();
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    // Create verification record
    const verification = new EmailVerification({
      email: email.toLowerCase(),
      otp: otp, // Store plain OTP for email sending
      hashedOtp: hashedOtp, // Store hashed OTP for verification
      purpose,
      expiresAt: new Date(Date.now() + 2 * 60 * 1000) // 2 minutes
    });

    await verification.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, purpose);
    
    if (!emailResult.success) {
      // If email sending fails, delete the verification record
      await EmailVerification.findByIdAndDelete(verification._id);
      return {
        success: false,
        message: 'Failed to send verification email. Please try again.',
        code: 'EMAIL_SEND_FAILED'
      };
    }

    return {
      success: true,
      message: 'Verification code sent to your email',
      expiresIn: 120 // 2 minutes in seconds
    };

  } catch (error) {
    console.error('Send email verification OTP error:', error);
    return {
      success: false,
      message: 'Failed to send verification code. Please try again.',
      code: 'INTERNAL_ERROR'
    };
  }
};

// Verify email OTP
const verifyEmailOTP = async (email, otp, purpose = 'signup') => {
  try {
    const verification = await EmailVerification.findOne({
      email: email.toLowerCase(),
      purpose,
      isVerified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!verification) {
      return {
        success: false,
        message: 'Invalid or expired verification code',
        code: 'INVALID_OR_EXPIRED'
      };
    }

    // No attempt limits as per requirements - allow unlimited verification attempts

    // Verify OTP
    const isOtpValid = await bcrypt.compare(otp, verification.hashedOtp);
    
    if (!isOtpValid) {
      // Increment attempts for tracking but no blocking
      verification.attempts += 1;
      await verification.save();

      return {
        success: false,
        message: 'Invalid verification code. Please try again.',
        code: 'INVALID_OTP'
      };
    }

    // Mark as verified
    verification.isVerified = true;
    verification.verifiedAt = new Date();
    await verification.save();

    return {
      success: true,
      message: 'Email verified successfully'
    };

  } catch (error) {
    console.error('Verify email OTP error:', error);
    return {
      success: false,
      message: 'Failed to verify code. Please try again.',
      code: 'INTERNAL_ERROR'
    };
  }
};

// Check if email is verified
const isEmailVerified = async (email, purpose = 'signup') => {
  try {
    const verification = await EmailVerification.findOne({
      email: email.toLowerCase(),
      purpose,
      isVerified: true,
      expiresAt: { $gt: new Date() }
    });

    return !!verification;
  } catch (error) {
    console.error('Check email verification error:', error);
    return false;
  }
};

// Clean up expired verifications
const cleanupExpiredVerifications = async () => {
  try {
    const result = await EmailVerification.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    console.log(`Cleaned up ${result.deletedCount} expired email verifications`);
  } catch (error) {
    console.error('Cleanup expired verifications error:', error);
  }
};

module.exports = {
  sendEmailVerificationOTP,
  verifyEmailOTP,
  isEmailVerified,
  cleanupExpiredVerifications
};
