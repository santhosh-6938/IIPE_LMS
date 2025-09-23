import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchStudentOwnAttendance, clearError, clearSuccessMessage } from '../../store/slices/attendanceSlice';
import { toast } from 'react-toastify';
import { Calendar, BarChart3, TrendingUp, CheckCircle, XCircle } from 'lucide-react';

const StudentAttendanceView = () => {
  const dispatch = useDispatch();
  const { classroomId } = useParams();
  const { studentSummary, isLoading, error } = useSelector(state => state.attendance);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    loadAttendance();
  }, [startDate, endDate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const loadAttendance = () => {
    dispatch(fetchStudentOwnAttendance({ classroomId, startDate, endDate }));
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceStatus = (percentage) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 75) return 'Good';
    if (percentage >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  const tabs = [
    { id: 'summary', name: 'Attendance Summary', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'details', name: 'Detailed View', icon: <Calendar className="w-4 h-4" /> }
  ];

  const renderSummary = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Attendance Summary</h2>
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={loadAttendance}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Update
          </button>
        </div>
      </div>

      {studentSummary && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            You attended <span className="font-semibold">{studentSummary.presentCount}</span> out of <span className="font-semibold">{studentSummary.totalClasses}</span> classes
            (<span className="font-semibold">{studentSummary.attendancePercentage}%</span>) in this period.
          </p>
        </div>
      )}

      {studentSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Classes</p>
                <p className="text-2xl font-semibold text-gray-900">{studentSummary.totalClasses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Present</p>
                <p className="text-2xl font-semibold text-gray-900">{studentSummary.presentCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <XCircle className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Absent</p>
                <p className="text-2xl font-semibold text-gray-900">{studentSummary.absentCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                <p className={`text-2xl font-semibold ${getAttendanceColor(studentSummary.attendancePercentage)}`}>
                  {studentSummary.attendancePercentage}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {studentSummary && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Overview</h3>
          <div className="space-y-6">
            {/* Attendance Progress Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Attendance</span>
                <span className={`text-sm font-medium ${getAttendanceColor(studentSummary.attendancePercentage)}`}>
                  {studentSummary.attendancePercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all duration-300 ${
                    studentSummary.attendancePercentage >= 90 ? 'bg-green-500' :
                    studentSummary.attendancePercentage >= 75 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${studentSummary.attendancePercentage}%` }}
                ></div>
              </div>
              <p className={`text-sm mt-2 ${getAttendanceColor(studentSummary.attendancePercentage)}`}>
                Status: {getAttendanceStatus(studentSummary.attendancePercentage)}
              </p>
            </div>

            {/* Attendance Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{studentSummary.presentCount}</p>
                <p className="text-sm text-gray-600">Classes Attended</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{studentSummary.absentCount}</p>
                <p className="text-sm text-gray-600">Classes Missed</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {studentSummary.totalClasses > 0 ? Math.round((studentSummary.presentCount / studentSummary.totalClasses) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-600">Success Rate</p>
              </div>
            </div>

            {/* Attendance Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Attendance Tips</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {studentSummary.attendancePercentage < 90 && (
                  <li>• Try to attend all classes to maintain good attendance</li>
                )}
                {studentSummary.attendancePercentage < 75 && (
                  <li>• Consider reaching out to your teacher if you're having trouble attending</li>
                )}
                {studentSummary.attendancePercentage >= 90 && (
                  <li>• Great job! Keep up the excellent attendance record</li>
                )}
                <li>• Regular attendance helps with better understanding and grades</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDetails = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Attendance Details</h2>
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={loadAttendance}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Update
          </button>
        </div>
      </div>

      {studentSummary && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Period: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Attendance Breakdown</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Classes Attended:</span>
                    <span className="text-sm font-medium text-green-600">{studentSummary.presentCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Classes Missed:</span>
                    <span className="text-sm font-medium text-red-600">{studentSummary.absentCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Classes:</span>
                    <span className="text-sm font-medium text-gray-900">{studentSummary.totalClasses}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Attendance Rate:</span>
                    <span className={`text-sm font-medium ${getAttendanceColor(studentSummary.attendancePercentage)}`}>
                      {studentSummary.attendancePercentage}%
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Performance Analysis</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`text-sm font-medium ${getAttendanceColor(studentSummary.attendancePercentage)}`}>
                      {getAttendanceStatus(studentSummary.attendancePercentage)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Success Rate:</span>
                    <span className="text-sm font-medium text-blue-600">
                      {studentSummary.totalClasses > 0 ? Math.round((studentSummary.presentCount / studentSummary.totalClasses) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Missed Rate:</span>
                    <span className="text-sm font-medium text-red-600">
                      {studentSummary.totalClasses > 0 ? Math.round((studentSummary.absentCount / studentSummary.totalClasses) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Visualization */}
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Attendance Visualization</h4>
              <div className="flex items-center space-x-4">
                <div className="flex-1 bg-gray-200 rounded-full h-8">
                  <div
                    className="bg-green-500 h-8 rounded-l-full transition-all duration-300"
                    style={{ 
                      width: `${studentSummary.totalClasses > 0 ? (studentSummary.presentCount / studentSummary.totalClasses) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <div className="text-sm text-gray-600">
                  {studentSummary.presentCount} present / {studentSummary.totalClasses} total
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'summary':
        return renderSummary();
      case 'details':
        return renderDetails();
      default:
        return renderSummary();
    }
  };

  if (isLoading && !studentSummary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendanceView;
