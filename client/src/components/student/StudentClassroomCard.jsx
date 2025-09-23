import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';

const StudentClassroomCard = ({ classroom }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
         onClick={() => navigate(`/student/classroom/${classroom._id}`)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{classroom.name}</h3>
          <p className="text-gray-600 text-sm line-clamp-2">{classroom.description}</p>
        </div>
        <div className="p-2 bg-blue-100 rounded-lg ml-4">
          <BookOpen className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{classroom.students?.length || 0} students</span>
          </div>
          {classroom.subject && (
            <div className="flex items-center">
              <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{classroom.subject}</span>
            </div>
          )}
        </div>
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-1" />
          <span>Joined {format(new Date(classroom.createdAt), 'MMM d')}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Teacher: {classroom.teacher?.name}</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/student/classroom/${classroom._id}/content`);
              }}
              className="text-blue-600 text-sm font-medium hover:text-blue-700"
            >
              Course Materials
            </button>
            <span className="text-blue-600 text-sm font-medium">→</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentClassroomCard;