import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Users, UserPlus, UserMinus, Search, Check, FileSpreadsheet, Grid3X3, List, Filter, X } from 'lucide-react';
import axios from 'axios';
import BulkImportModal from './BulkImportModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const StudentManager = ({ classroom, onUpdate }) => {
  const { user } = useSelector(state => state.auth);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [students, setStudents] = useState(classroom?.students || []);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // New state for enhanced features
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    rollNumber: '',
    joinDate: '',
    sortBy: 'name', // 'name', 'rollNumber', 'joinDate'
    sortOrder: 'asc' // 'asc' or 'desc'
  });

  useEffect(() => {
    // Keep local students state in sync when classroom prop changes
    setStudents(classroom?.students || []);
    fetchAvailableStudents();
  }, [classroom]);

  const fetchAvailableStudents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/classrooms/students/available`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableStudents(response.data);
    } catch (error) {
      console.error('Error fetching available students:', error);
      setError('Failed to fetch available students. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStudents = async () => {
    if (selectedStudents.length === 0) return;

    try {
      setIsLoading(true);
      setError(null);
      console.log('Adding students to classroom:', { classroomId: classroom._id, studentIds: selectedStudents });

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/classrooms/${classroom._id}/students`, {
        studentIds: selectedStudents
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Students added successfully:', response.data);
      setShowAddModal(false);
      setSelectedStudents([]);
      setError(null);
      setSuccessMessage(`Successfully added ${response.data.addedStudents} student(s) to the classroom`);

      // Refresh the available students list
      await fetchAvailableStudents();

      // Notify parent component to refresh classroom data
      if (onUpdate) {
        console.log('Calling parent update callback');
        onUpdate();
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error adding students:', error);
      const errorMessage = error.response?.data?.message || 'Error adding students to classroom';
      setSuccessMessage('');
      setError(errorMessage);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to remove this student from the classroom?')) return;

    try {
      setIsLoading(true);
      setError(null);
      console.log('Removing student from classroom:', { classroomId: classroom._id, studentId });

      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/classrooms/${classroom._id}/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Student removed successfully:', response.data);
      setError(null);
      setSuccessMessage('Student removed from classroom successfully');

      // Optimistically update local students list for immediate UI feedback
      setStudents(prev => prev.filter(s => s._id !== studentId));

      // Refresh the available students list
      await fetchAvailableStudents();

      // Notify parent component to refresh classroom data
      if (onUpdate) {
        console.log('Calling parent update callback');
        onUpdate();
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error removing student:', error);
      const errorMessage = error.response?.data?.message || 'Error removing student from classroom';
      setSuccessMessage('');
      setError(errorMessage);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced filtering and sorting logic
  const getFilteredAndSortedStudents = () => {
    let filtered = students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.rollNumber && student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesRollNumber = !filters.rollNumber || 
        (student.rollNumber && student.rollNumber.toLowerCase().includes(filters.rollNumber.toLowerCase()));
      
      const matchesJoinDate = !filters.joinDate || 
        new Date(student.createdAt).toDateString() === new Date(filters.joinDate).toDateString();
      
      return matchesSearch && matchesRollNumber && matchesJoinDate;
    });

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'rollNumber':
          aValue = a.rollNumber || '';
          bValue = b.rollNumber || '';
          break;
        case 'joinDate':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default: // name
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (filters.sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    });

    return filtered;
  };

  const filteredAvailableStudents = availableStudents.filter(student => {
    const isAlreadyInClassroom = students.some(
      classStudent => classStudent._id === student._id
    );
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.rollNumber && student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    return !isAlreadyInClassroom && matchesSearch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const clearFilters = () => {
    setFilters({
      rollNumber: '',
      joinDate: '',
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  const hasActiveFilters = filters.rollNumber || filters.joinDate || filters.sortBy !== 'name' || filters.sortOrder !== 'asc';

  const filteredStudents = getFilteredAndSortedStudents();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Student Management</h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowBulkImportModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Bulk Import</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Students</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
              <svg className="fill-current h-6 w-6" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.759 3.15c.148.166.22.39.22.615a.8.8 0 0 1-.22.596z" /></svg>
            </button>
          </span>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline"> {successMessage}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <button onClick={() => setSuccessMessage('')} className="text-green-700 hover:text-green-900">
              <svg className="fill-current h-6 w-6" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.759 3.15c.148.166.22.39.22.615a.8.8 0 0 1-.22.596z" /></svg>
            </button>
          </span>
        </div>
      )}

      {/* Current Students Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Current Students ({filteredStudents.length})
          </h3>
          
          {/* View Mode Toggle and Filters */}
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Grid View"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
              title="Toggle Filters"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search students by name, email, or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4 border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Filters</h4>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                >
                  <X className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Roll Number Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Roll Number</label>
                <input
                  type="text"
                  placeholder="Filter by roll number..."
                  value={filters.rollNumber}
                  onChange={(e) => setFilters({ ...filters, rollNumber: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Join Date Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Join Date</label>
                <input
                  type="date"
                  value={filters.joinDate}
                  onChange={(e) => setFilters({ ...filters, joinDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Name</option>
                  <option value="rollNumber">Roll Number</option>
                  <option value="joinDate">Join Date</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sort Order</label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Students Display */}
        {filteredStudents.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center border">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || hasActiveFilters ? 'No students match your criteria' : 'No students enrolled'}
            </h4>
            <p className="text-gray-600 mb-6">
              {searchTerm || hasActiveFilters 
                ? 'Try adjusting your search terms or filters' 
                : 'Add students to get started with your classroom'
              }
            </p>
            {(searchTerm || hasActiveFilters) && (
              <button
                onClick={() => { setSearchTerm(''); clearFilters(); }}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors mr-2"
              >
                Clear Search & Filters
              </button>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Students
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
            : 'space-y-3'
          }>
            {filteredStudents.map((student) => (
              <div key={student._id} className={`bg-white rounded-lg border hover:shadow-md transition-shadow ${
                viewMode === 'grid' ? 'p-4' : 'p-4 flex items-center justify-between'
              }`}>
                {viewMode === 'grid' ? (
                  // Grid View
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{student.name}</h4>
                      <p className="text-sm text-gray-600">{student.email}</p>
                      {student.rollNumber && (
                        <p className="text-xs text-gray-500">Roll: {student.rollNumber}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Joined: {formatDate(student.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveStudent(student._id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove student"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  // List View
                  <>
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{student.name}</h4>
                          <p className="text-sm text-gray-600 truncate">{student.email}</p>
                          {student.rollNumber && (
                            <p className="text-xs text-gray-500">Roll: {student.rollNumber}</p>
                          )}
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>Joined: {formatDate(student.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveStudent(student._id)}
                      className="ml-4 p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                      title="Remove student"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Students Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Students to Classroom</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search students by name, email, or roll number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : filteredAvailableStudents.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No students found</h4>
                  <p className="text-gray-600">
                    {searchTerm ? 'No students match your search criteria' : 'All students are already in this classroom'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAvailableStudents.map((student) => (
                    <div
                      key={student._id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedStudents.includes(student._id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                      onClick={() => {
                        setSelectedStudents(prev =>
                          prev.includes(student._id)
                            ? prev.filter(id => id !== student._id)
                            : [...prev, student._id]
                        );
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{student.name}</h4>
                          <p className="text-sm text-gray-600">{student.email}</p>
                          {student.rollNumber && (
                            <p className="text-xs text-gray-500">Roll: {student.rollNumber}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            Joined: {formatDate(student.createdAt)}
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedStudents.includes(student._id)
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                          }`}>
                          {selectedStudents.includes(student._id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <span className="text-sm text-gray-600">
                {selectedStudents.length} student(s) selected
              </span>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStudents}
                  disabled={selectedStudents.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Selected Students
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        classroomId={classroom._id}
        onSuccess={() => {
          if (onUpdate) {
            onUpdate();
          }
        }}
      />
    </div>
  );
};

export default StudentManager;
