import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UserPlus, UserMinus, Mail, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { 
  inviteCoTeacher, 
  removeCoTeacher, 
  fetchCoTeacherInvitations,
  clearError 
} from '../../store/slices/coTeacherSlice';

const CoTeacherManager = ({ classroom, onUpdate }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { invitations, isLoading, error } = useSelector(state => state.coTeacher);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

  // Check if current user is main teacher
  const isMainTeacher = classroom.teacher._id === (user?._id || user?.id);

  useEffect(() => {
    if (isMainTeacher && classroom._id) {
      dispatch(fetchCoTeacherInvitations(classroom._id));
    }
  }, [classroom._id, isMainTeacher, dispatch]);

  useEffect(() => {
    if (error) {
      alert(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleInviteCoTeacher = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      const result = await dispatch(inviteCoTeacher({
        classroomId: classroom._id,
        coTeacherEmail: inviteEmail.trim(),
        invitationMessage: inviteMessage.trim()
      })).unwrap();

      if (result.message) {
        alert(result.message);
        setInviteEmail('');
        setInviteMessage('');
        setShowInviteForm(false);
        // Refresh invitations
        dispatch(fetchCoTeacherInvitations(classroom._id));
      }
    } catch (error) {
      console.error('Failed to invite co-teacher:', error);
    }
  };

  const handleRemoveCoTeacher = async () => {
    if (!window.confirm('Are you sure you want to remove the co-teacher from this classroom?')) {
      return;
    }

    try {
      const result = await dispatch(removeCoTeacher(classroom._id)).unwrap();
      
      if (result.message) {
        alert(result.message);
        onUpdate(); // Refresh classroom data
        dispatch(fetchCoTeacherInvitations(classroom._id)); // Refresh invitations
      }
    } catch (error) {
      console.error('Failed to remove co-teacher:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'declined':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'accepted':
        return 'text-green-600 bg-green-50';
      case 'declined':
        return 'text-red-600 bg-red-50';
      case 'expired':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (!isMainTeacher) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Classroom Owner</h3>
        {classroom.teacher ? (
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{classroom.teacher.name}</p>
              <p className="text-sm text-gray-600">{classroom.teacher.email}</p>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Main Teacher
              </span>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">Teacher information is unavailable.</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Co-Teacher Management</h3>
        {!showInviteForm && (
          <button
            onClick={() => setShowInviteForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Co-Teacher</span>
          </button>
        )}
      </div>

      {/* Current Co-Teacher */}
      {classroom.coTeacherEnabled && classroom.coTeacher && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{classroom.coTeacher.name}</p>
                <p className="text-sm text-gray-600">{classroom.coTeacher.email}</p>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active Co-Teacher
                </span>
              </div>
            </div>
            <button
              onClick={handleRemoveCoTeacher}
              className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
              title="Remove Co-Teacher"
            >
              <UserMinus className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Invite Form */}
      {showInviteForm && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-gray-900 mb-4">Invite Co-Teacher</h4>
          <form onSubmit={handleInviteCoTeacher} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teacher Email Address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teacher@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invitation Message (Optional)
              </label>
              <textarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Add a personal message to the invitation..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : 'Send Invitation'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowInviteForm(false);
                  setInviteEmail('');
                  setInviteMessage('');
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invitations History */}
      {invitations.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Invitation History</h4>
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div key={invitation._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(invitation.status)}
                  <div>
                    <p className="font-medium text-gray-900">
                      {invitation.coTeacher?.name || invitation.invitationEmail}
                    </p>
                    <p className="text-sm text-gray-600">
                      {invitation.coTeacher?.email || invitation.invitationEmail}
                    </p>
                    <p className="text-xs text-gray-500">
                      Invited {format(new Date(invitation.invitedAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                  {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {invitations.length === 0 && !isLoading && (
        <p className="text-gray-600 text-center py-4">No invitations sent yet.</p>
      )}
    </div>
  );
};

export default CoTeacherManager;
