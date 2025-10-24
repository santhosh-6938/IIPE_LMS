import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  sendEmailVerificationOTP, 
  verifyEmailOTP, 
  clearEmailVerificationError,
  setEmailVerified 
} from '../../store/slices/authSlice';
import { Mail, Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const EmailVerification = ({ 
  email, 
  purpose = 'signup', 
  onVerified, 
  onCancel,
  isVisible = true 
}) => {
  const dispatch = useDispatch();
  const { emailVerification } = useSelector(state => state.auth);
  
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [step, setStep] = useState('send'); // 'send', 'verify', 'verified'

  useEffect(() => {
    if (emailVerification.expiresIn) {
      setTimeLeft(emailVerification.expiresIn);
      setStep('verify');
    }
  }, [emailVerification.expiresIn]);

  useEffect(() => {
    if (emailVerification.isVerified) {
      setStep('verified');
      if (onVerified) {
        onVerified();
      }
    }
  }, [emailVerification.isVerified, onVerified]);

  useEffect(() => {
    let timer;
    if (timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && step === 'verify') {
      setStep('send');
    }
    return () => clearTimeout(timer);
  }, [timeLeft, step]);

  const handleSendOTP = async () => {
    if (!email) return;
    
    dispatch(clearEmailVerificationError());
    const result = await dispatch(sendEmailVerificationOTP({ email, purpose }));
    
    if (result.type.endsWith('/fulfilled')) {
      setStep('verify');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 4) return;
    
    dispatch(clearEmailVerificationError());
    const result = await dispatch(verifyEmailOTP({ email, otp, purpose }));
    
    if (result.type.endsWith('/fulfilled')) {
      setStep('verified');
      dispatch(setEmailVerified(true));
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          {step === 'verified' ? (
            <CheckCircle className="w-8 h-8 text-green-600" />
          ) : (
            <Shield className="w-8 h-8 text-blue-600" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {step === 'send' && 'Verify Your Email'}
          {step === 'verify' && 'Enter Verification Code'}
          {step === 'verified' && 'Email Verified!'}
        </h3>
        <p className="text-sm text-gray-600">
          {step === 'send' && `We'll send a 4-digit code to ${email}`}
          {step === 'verify' && `Enter the code sent to ${email}`}
          {step === 'verified' && 'Your email has been successfully verified'}
        </p>
      </div>

      {step === 'send' && (
        <div className="space-y-4">
          <button
            onClick={handleSendOTP}
            disabled={emailVerification.isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {emailVerification.isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send Verification Code
              </>
            )}
          </button>
          
          {onCancel && (
            <button
              onClick={onCancel}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {step === 'verify' && (
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Clock className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-orange-600 font-medium">
              Code expires in {formatTime(timeLeft)}
            </span>
          </div>

          <div className="flex justify-center space-x-2">
            {[0, 1, 2, 3].map((index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={otp[index] || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 1) {
                    const newOtp = otp.split('');
                    newOtp[index] = value;
                    setOtp(newOtp.join(''));
                    
                    // Auto-focus next input
                    if (value && index < 3) {
                      const nextInput = e.target.parentElement.children[index + 1];
                      if (nextInput) nextInput.focus();
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !otp[index] && index > 0) {
                    const prevInput = e.target.parentElement.children[index - 1];
                    if (prevInput) prevInput.focus();
                  }
                }}
                className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              />
            ))}
          </div>

          <button
            onClick={handleVerifyOTP}
            disabled={emailVerification.isLoading || otp.length !== 4}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {emailVerification.isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Verify Code'
            )}
          </button>

          <div className="text-center">
            <button
              onClick={handleSendOTP}
              disabled={emailVerification.isLoading}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Resend Code
            </button>
          </div>
        </div>
      )}

      {step === 'verified' && (
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-green-600 font-medium mb-4">
            Email verification completed successfully!
          </p>
          {onVerified && (
            <button
              onClick={onVerified}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Continue
            </button>
          )}
        </div>
      )}

      {emailVerification.error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
          <p className="text-sm text-red-700">{emailVerification.error}</p>
        </div>
      )}
    </div>
  );
};

export default EmailVerification;
