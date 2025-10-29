import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteClassroom,
  archiveClassroom,
  unarchiveClassroom,
} from "../../store/slices/classroomSlice";
import {
  Users,
  Calendar,
  Settings,
  Trash2,
  ClipboardList,
  UserPlus,
} from "lucide-react";
import { format } from "date-fns";

const ClassroomCard = ({ classroom, tasksByClassroom = {} }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user?.user || state.auth?.user);

  const [showActions, setShowActions] = useState(false);

  const handleDelete = () => {
    if (
      window.confirm(
        "Are you sure you want to delete this classroom? This action cannot be undone."
      )
    ) {
      dispatch(deleteClassroom(classroom._id));
    }
  };

  const handleArchiveToggle = async () => {
    if (!classroom.isArchived) {
      if (window.confirm("Archive this classroom? It will become read-only.")) {
        await dispatch(archiveClassroom({ id: classroom._id }))
          .unwrap()
          .catch(() => {});
        setShowActions(false);
      }
    } else {
      if (window.confirm("Unarchive this classroom?")) {
        await dispatch(unarchiveClassroom({ id: classroom._id }))
          .unwrap()
          .catch(() => {});
        setShowActions(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {classroom.name}
          </h3>
          {classroom.courseId && (
            <div className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded mb-2 inline-block">
              {classroom.courseId}
            </div>
          )}
          <p className="text-gray-600 text-sm line-clamp-2">
            {classroom.description}
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
          {showActions && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-10">
              <button
                onClick={() => navigate(`/teacher/classroom/${classroom._id}`)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Manage Classroom
              </button>
              <button
                onClick={handleArchiveToggle}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {classroom.isArchived ? "Unarchive" : "Archive"}
              </button>

              <button
                onClick={handleDelete}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Classroom
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Subject Display */}
      {classroom.subject && (
        <div className="mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            📚 {classroom.subject}
          </span>
        </div>
      )}

      {/* Teacher Information */}
      {classroom.coTeacherEnabled && classroom.coTeacher && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
            <UserPlus className="w-4 h-4 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {user?.email === classroom.teacher.email
                  ? "Co-Teacher"
                  : "Main Teacher"}
              </p>
              <p className="text-xs text-gray-600">
                {user?.email === classroom.teacher.email ? (
                  <>{classroom.coTeacher.name}</>
                ) : (
                  <>{classroom.teacher.name}</>
                )}
              </p>
            </div>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
        <div className="flex items-center">
          <Users className="w-4 h-4 mr-1" />
          <span>{classroom.students?.length || 0} students</span>
        </div>
        <div className="flex items-center">
          <ClipboardList className="w-4 h-4 mr-1" />
          <span>{tasksByClassroom[classroom._id]?.length || 0} tasks</span>
        </div>
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          <span>
            Created {format(new Date(classroom.createdAt), "MMM d, yyyy")}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/teacher/classroom/${classroom._id}`)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          Manage
        </button>
        <button
          onClick={() =>
            navigate(`/teacher/classroom/${classroom._id}?tab=tasks`)
          }
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View Tasks
        </button>
      </div>
    </div>
  );
};

export default ClassroomCard;
