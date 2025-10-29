import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle, XCircle, AlertCircle, UserPlus, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { 
  fetchCoTeacherInvitationDetails,
  acceptCoTeacherInvitation,
  declineCoTeacherInvitation,
  clearError 
} from '../../store/slices/coTeacherSlice';

const CoTeacherInvitationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentInvitation, isLoading, error } = useSelector(state => state.coTeacher);
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  useEffect(() => {
    if (token) {
      dispatch(fetchCoTeacherInvitationDetails(token));
    }
  }, [token, dispatch]);

  useEffect(() => {
    if (error) {
      alert(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleAcceptInvitation = async () => {
    try {
      const result = await dispatch(acceptCoTeacherInvitation(token)).unwrap();
      
      if (result.message) {
        alert(result.message);
        navigate('/teacher/dashboard');
      }
    } catch (error) {
      console.error('Failed to accept invitation:', error);
    }
  };

  const handleDeclineInvitation = async () => {
    if (showDeclineForm) {
      // Submit decline with reason
      try {
        const result = await dispatch(declineCoTeacherInvitation({
          token,
          declineReason: declineReason.trim()
        })).unwrap();
        
        if (result.message) {
          alert(result.message);
          navigate('/teacher/dashboard');
        }
      } catch (error) {
        console.error('Failed to decline invitation:', error);
      }
    } else {
      // Show decline form
      setShowDeclineForm(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/teacher/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!currentInvitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation Not Found</h2>
          <p className="text-gray-600 mb-6">The invitation you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/teacher/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isExpired = new Date(currentInvitation.expiresAt) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-sm p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Co-Teacher Invitation</h1>
          <p className="text-gray-600">You've been invited to collaborate as a co-teacher</p>
        </div>

        {/* Classroom Information */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Classroom Details</h2>
          <div className="space-y-3">
            <div>
              <h3 className="font-medium text-gray-900">{currentInvitation.classroom.name}</h3>
              {currentInvitation.classroom.subject && (
                <p className="text-sm text-gray-600">Subject: {currentInvitation.classroom.subject}</p>
              )}
            </div>
            {currentInvitation.classroom.description && (
              <p className="text-gray-600 text-sm">{currentInvitation.classroom.description}</p>
            )}
          </div>
        </div>

        {/* Invitation Details */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invitation Details</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Invited by</p>
                <p className="text-sm text-gray-600">{currentInvitation.mainTeacher.name}</p>
                <p className="text-sm text-gray-600">{currentInvitation.mainTeacher.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Invited on</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(currentInvitation.invitedAt), 'MMMM d, yyyy \'at\' h:mm a')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Expires on</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(currentInvitation.expiresAt), 'MMMM d, yyyy \'at\' h:mm a')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Invitation Message */}
        {currentInvitation.invitationMessage && (
          <div className="bg-yellow-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Personal Message</h2>
            <p className="text-gray-700">{currentInvitation.invitationMessage}</p>
          </div>
        )}

        {/* Co-Teacher Benefits */}
        <div className="bg-green-50 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">As a Co-Teacher, you'll have access to:</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Manage students and attendance</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Create and grade assignments</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Upload course materials</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>View and manage classroom activities</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        {isExpired ? (
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Invitation Expired</h3>
            <p className="text-gray-600 mb-6">This invitation has expired. Please contact the main teacher for a new invitation.</p>
            <button
              onClick={() => navigate('/teacher/dashboard')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {showDeclineForm ? (
              <div className="bg-red-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Decline Invitation</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="declineReason" className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for declining (optional)
                    </label>
                    <textarea
                      id="declineReason"
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      placeholder="Please provide a reason for declining this invitation..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      rows={4}
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={handleDeclineInvitation}
                      disabled={isLoading}
                      className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <XCircle className="w-5 h-5" />
                      <span>{isLoading ? 'Declining...' : 'Confirm Decline'}</span>
                    </button>
                    <button
                      onClick={() => setShowDeclineForm(false)}
                      disabled={isLoading}
                      className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex space-x-4">
                <button
                  onClick={handleAcceptInvitation}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>{isLoading ? 'Accepting...' : 'Accept Invitation'}</span>
                </button>
                <button
                  onClick={handleDeclineInvitation}
                  disabled={isLoading}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <XCircle className="w-5 h-5" />
                  <span>{isLoading ? 'Declining...' : 'Decline Invitation'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoTeacherInvitationPage;
