import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { 
  FileSpreadsheet,
  FileText,
  Calendar,
  BookOpen,
  Award,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { 
  fetchStudentMidTermMarks,
  fetchStudentTaskMarks,
  clearError 
} from '../../store/slices/marksSlice';

const StudentMarksView = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { studentMidTermMarks, studentTaskMarks, isLoading, error } = useSelector(state => state.marks);
  const { tasks } = useSelector(state => state.task);
  
  const [activeTab, setActiveTab] = useState('midterm');

  useEffect(() => {
    dispatch(fetchStudentMidTermMarks());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const tabs = [
    { id: 'midterm', label: 'Mid Term Marks', icon: FileSpreadsheet },
    { id: 'tasks', label: 'Task Marks', icon: FileText },
  ];

  const getGradeColor = (marks) => {
    if (marks >= 90) return 'text-green-600';
    if (marks >= 80) return 'text-blue-600';
    if (marks >= 70) return 'text-yellow-600';
    if (marks >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeLabel = (marks) => {
    if (marks >= 90) return 'Excellent';
    if (marks >= 80) return 'Good';
    if (marks >= 70) return 'Satisfactory';
    if (marks >= 60) return 'Pass';
    return 'Fail';
  };

  const renderMidTermMarks = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 border animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      );
    }

    if (studentMidTermMarks.length === 0) {
      return (
        <div className="bg-white rounded-lg p-12 text-center border">
          <FileSpreadsheet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No mid term marks available</h3>
          <p className="text-gray-600">Your mid term marks will appear here once published by your teachers.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {studentMidTermMarks.map((mark) => (
          <div key={mark._id} className="bg-white rounded-lg p-6 border hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{mark.term}</h3>
                <p className="text-gray-600 mb-1">{mark.subject}</p>
                <p className="text-sm text-gray-500">{mark.classroom?.name}</p>
              </div>
              <div className="text-right">
                {mark.marks && mark.marks.length > 0 ? (
                  <div>
                    <div className={`text-3xl font-bold ${getGradeColor(mark.marks[0].marks)}`}>
                      {mark.marks[0].marks}/100
                    </div>
                    <div className={`text-sm font-medium ${getGradeColor(mark.marks[0].marks)}`}>
                      {getGradeLabel(mark.marks[0].marks)}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400">No marks</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{mark.academicYear} - {mark.semester}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <BookOpen className="w-4 h-4 mr-2" />
                <span>{mark.subject}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Published: {new Date(mark.publishedAt).toLocaleDateString()}</span>
              </div>
            </div>

            {mark.marks && mark.marks.length > 0 && mark.marks[0].remarks && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Teacher's Remarks:</h4>
                <p className="text-sm text-gray-600">{mark.marks[0].remarks}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderTaskMarks = () => {
    const publishedTasks = tasks.filter(task => {
      const taskMark = studentTaskMarks[task._id];
      return taskMark && taskMark.status === 'published';
    });

    if (publishedTasks.length === 0) {
      return (
        <div className="bg-white rounded-lg p-12 text-center border">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No task marks available</h3>
          <p className="text-gray-600">Your task marks will appear here once published by your teachers.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {publishedTasks.map((task) => {
          const taskMark = studentTaskMarks[task._id];
          const studentMark = taskMark?.marks?.[0];

          return (
            <div key={task._id} className="bg-white rounded-lg p-6 border hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{task.title}</h3>
                  <p className="text-gray-600 mb-1">{task.description}</p>
                  <p className="text-sm text-gray-500">{task.classroom?.name}</p>
                </div>
                <div className="text-right">
                  {studentMark ? (
                    <div>
                      <div className={`text-3xl font-bold ${getGradeColor(studentMark.marks)}`}>
                        {studentMark.marks}/100
                      </div>
                      <div className={`text-sm font-medium ${getGradeColor(studentMark.marks)}`}>
                        {getGradeLabel(studentMark.marks)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400">No marks</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>
                    {task.deadline 
                      ? `Deadline: ${new Date(task.deadline).toLocaleDateString()}`
                      : 'No deadline'
                    }
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Award className="w-4 h-4 mr-2" />
                  <span>
                    Graded: {studentMark ? new Date(studentMark.gradedAt).toLocaleDateString() : 'Not graded'}
                  </span>
                </div>
              </div>

              {studentMark && studentMark.feedback && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Teacher's Feedback:</h4>
                  <p className="text-sm text-gray-600">{studentMark.feedback}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Marks</h2>
        <p className="text-gray-600">View your academic performance and feedback</p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'tasks') {
                    // Fetch task marks when switching to tasks tab
                    tasks.forEach(task => {
                      dispatch(fetchStudentTaskMarks(task._id));
                    });
                  }
                }}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'midterm' && renderMidTermMarks()}
        {activeTab === 'tasks' && renderTaskMarks()}
      </div>
    </div>
  );
};

export default StudentMarksView;
