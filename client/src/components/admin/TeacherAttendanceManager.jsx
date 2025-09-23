import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTeacherAttendance,
  updateTeacherAttendance,
  fetchTeacherAttendanceHistory,
  fetchTeacherAttendanceStatistics,
  downloadTeacherAttendanceReport,
  clearError,
  clearSuccessMessage
} from '../../store/slices/adminTeacherAttendanceSlice';
import { toast } from 'react-toastify';
import { Calendar, Download, BarChart3, History, CheckCircle, XCircle, Users } from 'lucide-react';

const TeacherAttendanceManager = () => {
  const dispatch = useDispatch();
  const { currentAttendance, attendanceHistory, statistics, dailyData, isLoading, error, successMessage } = useSelector(state => state.adminTeacherAttendance);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('today');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadTeacherAttendance();
  }, [selectedDate]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadTeacherAttendanceHistory();
    } else if (activeTab === 'statistics') {
      loadTeacherStatistics();
    }
  }, [activeTab, startDate, endDate, currentPage]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearSuccessMessage());
    }
  }, [error, successMessage, dispatch]);

  const loadTeacherAttendance = () => {
    dispatch(fetchTeacherAttendance({ date: selectedDate }));
  };

  const loadTeacherAttendanceHistory = () => {
    dispatch(fetchTeacherAttendanceHistory({
      startDate,
      endDate,
      page: currentPage,
      limit: 10
    }));
  };

  const loadTeacherStatistics = () => {
    dispatch(fetchTeacherAttendanceStatistics({ startDate, endDate }));
  };

  const handleTeacherAttendanceChange = async (teacherId, status) => {
    try {
      await dispatch(updateTeacherAttendance({
        teacherId,
        status,
        date: selectedDate
      })).unwrap();
    } catch (error) {
      console.error('Failed to update teacher attendance:', error);
    }
  };

  const handleDownloadTeacherReport = async () => {
    try {
      await dispatch(downloadTeacherAttendanceReport({
        startDate,
        endDate
      })).unwrap();
    } catch (error) {
      console.error('Failed to download teacher report:', error);
    }
  };

  const getStatusColor = (status) => {
    return status === 'present' ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (status) => {
    return status === 'present' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />;
  };

  const tabs = [
    { id: 'today', name: 'Today\'s Teacher Attendance', icon: <Calendar className="w-4 h-4" /> },
    { id: 'history', name: 'Teacher Attendance History', icon: <History className="w-4 h-4" /> },
    { id: 'statistics', name: 'Teacher Statistics & Reports', icon: <BarChart3 className="w-4 h-4" /> }
  ];

  const renderTodayTeacherAttendance = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Today's Teacher Attendance</h2>
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={loadTeacherAttendance}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Load Teacher Attendance
          </button>
        </div>
      </div>

      {currentAttendance && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Teacher Attendance for {new Date(selectedDate).toLocaleDateString()}
              </h3>
              <div className="text-sm text-gray-600">
                {currentAttendance.presentCount} Present • {currentAttendance.absentCount} Absent • {currentAttendance.totalTeachers} Total Teachers
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {currentAttendance.records.map((record) => (
                <div key={record.teacher._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-700">
                        {record.teacher.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{record.teacher.name}</p>
                      <p className="text-xs text-gray-500">{record.teacher.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center space-x-2 ${getStatusColor(record.status)}`}>
                      {getStatusIcon(record.status)}
                      <span className="text-sm font-medium capitalize">{record.status}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleTeacherAttendanceChange(record.teacher._id, 'present')}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${record.status === 'present'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-800'
                          }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => handleTeacherAttendanceChange(record.teacher._id, 'absent')}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${record.status === 'absent'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-800'
                          }`}
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTeacherAttendanceHistory = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Teacher Attendance History</h2>
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
            onClick={loadTeacherAttendanceHistory}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Load History
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Present
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Absent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Percentage
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attendanceHistory.map((record) => (
              <tr key={record._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(record.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                  {record.presentCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                  {record.absentCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.totalTeachers}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.attendancePercentage}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTeacherStatistics = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Teacher Statistics & Reports</h2>
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
            onClick={loadTeacherStatistics}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Load Statistics
          </button>
          <button
            onClick={handleDownloadTeacherReport}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Teacher Report</span>
          </button>
        </div>
      </div>

      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Days</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.totalDays}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Present</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.totalPresent}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <XCircle className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Absent</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.totalAbsent}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <Users className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Attendance</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.averageAttendance}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {dailyData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Teacher Attendance Trend</h3>
          <div className="space-y-4">
            {dailyData.map((day, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-24 text-sm text-gray-600">
                  {new Date(day.date).toLocaleDateString()}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${day.percentage}%` }}
                  ></div>
                </div>
                <div className="w-16 text-sm text-gray-900 text-right">
                  {day.percentage}%
                </div>
                <div className="w-20 text-xs text-gray-500 text-right">
                  {day.present}/{day.total}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'today':
        return renderTodayTeacherAttendance();
      case 'history':
        return renderTeacherAttendanceHistory();
      case 'statistics':
        return renderTeacherStatistics();
      default:
        return renderTodayTeacherAttendance();
    }
  };

  if (isLoading && !currentAttendance) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teacher attendance data...</p>
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
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
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

export default TeacherAttendanceManager;
