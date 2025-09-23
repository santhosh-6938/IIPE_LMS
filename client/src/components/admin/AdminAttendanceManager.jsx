import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTeacherAttendance,
  updateTeacherAttendance,
  fetchTeacherAttendanceHistory,
  fetchTeacherAttendanceStatistics,
  downloadTeacherAttendanceReport,
  clearError as clearTeacherError,
  clearSuccessMessage as clearTeacherSuccessMessage
} from '../../store/slices/adminTeacherAttendanceSlice';
import {
  fetchAttendanceHistory,
  fetchAttendanceStatistics,
  downloadAttendanceReport,
  fetchAllStudentAttendance,
  fetchAllStudentAttendanceStatistics,
  downloadAllStudentAttendanceReport,
  clearError as clearStudentError,
  clearSuccessMessage as clearStudentSuccessMessage
} from '../../store/slices/attendanceSlice';
import { toast } from 'react-toastify';
import { Calendar, Download, BarChart3, History, CheckCircle, XCircle, Users, GraduationCap } from 'lucide-react';

const AdminAttendanceManager = () => {
  const dispatch = useDispatch();

  // Teacher attendance state
  const {
    currentAttendance: teacherAttendance,
    attendanceHistory: teacherHistory,
    statistics: teacherStats,
    dailyData: teacherDailyData,
    isLoading: teacherLoading,
    error: teacherError,
    successMessage: teacherSuccessMessage
  } = useSelector(state => state.adminTeacherAttendance);

  // Student attendance state
  const {
    attendanceHistory: studentHistory,
    statistics: studentStats,
    dailyData: studentDailyData,
    isLoading: studentLoading,
    error: studentError,
    successMessage: studentSuccessMessage
  } = useSelector(state => state.attendance);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeSection, setActiveSection] = useState('teachers'); // 'teachers' or 'students'
  const [activeTab, setActiveTab] = useState('today');

  useEffect(() => {
    if (activeSection === 'teachers') {
      loadTeacherAttendance();
    }
  }, [selectedDate, activeSection]);

  useEffect(() => {
    if (activeSection === 'teachers' && activeTab === 'history') {
      loadTeacherAttendanceHistory();
    } else if (activeSection === 'teachers' && activeTab === 'statistics') {
      loadTeacherStatistics();
    } else if (activeSection === 'students' && activeTab === 'history') {
      loadStudentAttendanceHistory();
    } else if (activeSection === 'students' && activeTab === 'statistics') {
      loadStudentStatistics();
    }
  }, [activeSection, activeTab, startDate, endDate, currentPage]);

  useEffect(() => {
    if (teacherError) {
      toast.error(teacherError);
      dispatch(clearTeacherError());
    }
    if (teacherSuccessMessage) {
      toast.success(teacherSuccessMessage);
      dispatch(clearTeacherSuccessMessage());
    }
    if (studentError) {
      toast.error(studentError);
      dispatch(clearStudentError());
    }
    if (studentSuccessMessage) {
      toast.success(studentSuccessMessage);
      dispatch(clearStudentSuccessMessage());
    }
  }, [teacherError, teacherSuccessMessage, studentError, studentSuccessMessage, dispatch]);

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

  const loadStudentAttendanceHistory = () => {
    dispatch(fetchAllStudentAttendance({
      startDate,
      endDate,
      page: currentPage,
      limit: 10
    }));
  };

  const loadStudentStatistics = () => {
    dispatch(fetchAllStudentAttendanceStatistics({ startDate, endDate }));
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

  const handleDownloadStudentReport = async () => {
    try {
      await dispatch(downloadAllStudentAttendanceReport({
        startDate,
        endDate
      })).unwrap();
    } catch (error) {
      console.error('Failed to download student report:', error);
    }
  };

  const getStatusColor = (status) => {
    return status === 'present' ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (status) => {
    return status === 'present' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />;
  };

  const sections = [
    { id: 'teachers', name: 'Teacher Attendance', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'students', name: 'Student Attendance', icon: <Users className="w-4 h-4" /> }
  ];

  const tabs = [
    { id: 'today', name: 'Today\'s Attendance', icon: <Calendar className="w-4 h-4" /> },
    { id: 'history', name: 'Attendance History', icon: <History className="w-4 h-4" /> },
    { id: 'statistics', name: 'Statistics & Reports', icon: <BarChart3 className="w-4 h-4" /> }
  ];

  const renderTeacherTodayAttendance = () => (
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

      {teacherAttendance && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Teacher Attendance for {new Date(selectedDate).toLocaleDateString()}
              </h3>
              <div className="text-sm text-gray-600">
                {teacherAttendance.presentCount} Present • {teacherAttendance.absentCount} Absent • {teacherAttendance.totalTeachers} Total Teachers
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Array.isArray(teacherAttendance.records) && teacherAttendance.records.map((record, idx) => {
                const teacher = record?.teacher || null;
                const teacherId = teacher?._id || `${idx}`;
                const teacherName = teacher?.name || 'Unknown Teacher';
                const teacherEmail = teacher?.email || 'N/A';
                const initial = (teacher?.name?.charAt(0) || '?').toUpperCase();
                return (
                  <div key={teacherId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-700">{initial}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{teacherName}</p>
                        <p className="text-xs text-gray-500">{teacherEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center space-x-2 ${getStatusColor(record.status)}`}>
                        {getStatusIcon(record.status)}
                        <span className="text-sm font-medium capitalize">{record.status}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => teacher?._id && handleTeacherAttendanceChange(teacher._id, 'present')}
                          disabled={!teacher?._id}
                          className={`px-3 py-1 text-xs rounded-md transition-colors ${record.status === 'present'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-800'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => teacher?._id && handleTeacherAttendanceChange(teacher._id, 'absent')}
                          disabled={!teacher?._id}
                          className={`px-3 py-1 text-xs rounded-md transition-colors ${record.status === 'absent'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-800'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          Absent
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStudentTodayAttendance = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Today's Student Attendance</h2>
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => toast.info('Today\'s student attendance viewing feature coming soon...')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Load Student Attendance
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Today's Student Attendance</h3>
          <p className="text-gray-600 mb-4">
            View today's student attendance across all classrooms.
          </p>
          <p className="text-sm text-gray-500">
            This feature will show all student attendance for the selected date across all classrooms.
          </p>
        </div>
      </div>
    </div>
  );

  const renderAttendanceHistory = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {activeSection === 'teachers' ? 'Teacher' : 'Student'} Attendance History
        </h2>
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
            onClick={activeSection === 'teachers' ? loadTeacherAttendanceHistory : loadStudentAttendanceHistory}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Load History
          </button>
        </div>
      </div>

      {activeSection === 'teachers' && teacherHistory && (
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
              {teacherHistory.map((record) => (
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
      )}

      {activeSection === 'students' && studentHistory && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Classroom
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
              {studentHistory.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.classroom?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                    {record.presentCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                    {record.absentCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.totalStudents}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.attendancePercentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderStatistics = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {activeSection === 'teachers' ? 'Teacher' : 'Student'} Statistics & Reports
        </h2>
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
            onClick={activeSection === 'teachers' ? loadTeacherStatistics : loadStudentStatistics}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Load Statistics
          </button>
          <button
            onClick={activeSection === 'teachers' ? handleDownloadTeacherReport : handleDownloadStudentReport}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download {activeSection === 'teachers' ? 'Teacher' : 'Student'} Report</span>
          </button>
        </div>
      </div>

      {activeSection === 'teachers' && teacherStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Days</p>
                <p className="text-2xl font-semibold text-gray-900">{teacherStats.totalDays}</p>
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
                <p className="text-2xl font-semibold text-gray-900">{teacherStats.totalPresent}</p>
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
                <p className="text-2xl font-semibold text-gray-900">{teacherStats.totalAbsent}</p>
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
                <p className="text-2xl font-semibold text-gray-900">{teacherStats.averageAttendance}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'students' && studentStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Classes</p>
                <p className="text-2xl font-semibold text-gray-900">{studentStats.totalClasses}</p>
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
                <p className="text-2xl font-semibold text-gray-900">{studentStats.totalPresent}</p>
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
                <p className="text-2xl font-semibold text-gray-900">{studentStats.totalAbsent}</p>
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
                <p className="text-2xl font-semibold text-gray-900">{studentStats.averageAttendance}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'teachers' && teacherDailyData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Teacher Attendance Trend</h3>
          <div className="space-y-4">
            {teacherDailyData.map((day, index) => (
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

      {activeSection === 'students' && studentDailyData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Student Attendance Trend</h3>
          <div className="space-y-4">
            {studentDailyData.map((day, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-24 text-sm text-gray-600">
                  {new Date(day.date).toLocaleDateString()}
                </div>
                <div className="w-32 text-sm text-gray-600">
                  {day.classroom}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-green-600 h-4 rounded-full transition-all duration-300"
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
    if (activeSection === 'teachers') {
      switch (activeTab) {
        case 'today':
          return renderTeacherTodayAttendance();
        case 'history':
          return renderAttendanceHistory();
        case 'statistics':
          return renderStatistics();
        default:
          return renderTeacherTodayAttendance();
      }
    } else {
      switch (activeTab) {
        case 'today':
          return renderStudentTodayAttendance();
        case 'history':
          return renderAttendanceHistory();
        case 'statistics':
          return renderStatistics();
        default:
          return renderStudentTodayAttendance();
      }
    }
  };

  const isLoading = teacherLoading || studentLoading;

  if (isLoading && !teacherAttendance) {
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
        {/* Section Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeSection === section.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
              >
                {section.icon}
                <span>{section.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                    ? 'bg-green-100 text-green-700'
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

export default AdminAttendanceManager;
