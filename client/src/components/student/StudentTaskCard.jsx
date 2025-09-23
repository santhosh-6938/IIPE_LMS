import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Calendar, Clock, AlertCircle, FileText, CheckCircle } from 'lucide-react';
import { format, isAfter, differenceInDays } from 'date-fns';
import { isTaskCompletedForUser } from '../../store/slices/taskSlice';

const StudentTaskCard = ({ task, isOverdue, isDueSoon }) => {
  const navigate = useNavigate();

  const currentUserId = useSelector(state => state.auth.user?._id);
  const daysUntilDue = task.deadline ? differenceInDays(new Date(task.deadline), new Date()) : null;
  const hasSubmitted = isTaskCompletedForUser(task, currentUserId);

  const hasDraft = task.submissions?.some(sub => {
    const subStudentId = typeof sub.student === 'object' ? sub.student?._id : sub.student;
    const isMine = subStudentId && currentUserId && subStudentId.toString() === currentUserId;
    if (!isMine) return false;
    return sub.status === 'draft';
  });

  const getStatusColor = () => {
    if (hasSubmitted) return 'bg-green-100 text-green-800';
    if (hasDraft) return 'bg-yellow-100 text-yellow-800';
    if (isOverdue) return 'bg-red-100 text-red-800';
    if (isDueSoon) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getStatusIcon = () => {
    if (hasSubmitted) return <CheckCircle className="w-4 h-4" />;
    if (hasDraft) return <Clock className="w-4 h-4" />;
    if (isOverdue) return <AlertCircle className="w-4 h-4" />;
    if (isDueSoon) return <Clock className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (hasSubmitted) return 'Completed';
    if (hasDraft) return 'Draft';
    if (isOverdue) return 'Overdue';
    if (isDueSoon) return `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`;
    return 'Pending';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
         onClick={() => navigate(`/student/task/${task._id}`)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()} flex items-center space-x-1`}>
              {getStatusIcon()}
              <span>{getStatusText()}</span>
            </span>
          </div>
          <p className="text-gray-600 text-sm line-clamp-2">{task.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{task.classroom?.name}</span>
          </div>
          {task.deadline && (
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>Due {format(new Date(task.deadline), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>
        <span className="text-blue-600 font-medium">
          {hasSubmitted ? 'View Completed Task' : hasDraft ? 'Continue with Draft' : 'Submit Task'} →
        </span>
      </div>
    </div>
  );
};

export default StudentTaskCard;