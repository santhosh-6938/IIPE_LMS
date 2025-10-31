import React, { useState, useEffect } from 'react';
import { Flag, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';

// helper to get uniq/distinct (case insensitive)
function uniq(arr) {
  return [...new Set(arr.filter(Boolean).map(b=>b.trim()))];
}

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed z-40 inset-0 bg-black bg-opacity-40 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full relative"
        onClick={e => { e.stopPropagation(); }}
      >
        <button className="absolute right-4 top-3 text-gray-500 hover:text-black text-2xl font-bold" onClick={onClose} aria-label="Close modal">×</button>
        {children}
      </div>
    </div>
  );
}

const CourseFlagManager = () => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const { user } = useSelector(state => state.auth);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({ program: '', branch: '', semester: '', isAvailableForNextSemester: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkReason, setBulkReason] = useState('');
  // MODAL course form state
  const defaultForm = { courseCode: '', subject: '', program: '', branch: '', semester: '', credits: '' };
  const [newCourse, setNewCourse] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [allCourses, setAllCourses] = useState([]);

  useEffect(() => {
    fetchCourses();
  }, [filters]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await axios.get(`${API_URL}/courses?${queryParams}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      setCourses(response.data.courses || []);
    } catch (error) {
      setError('Failed to fetch courses');
      console.error('Fetch courses error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFlagToggle = async (courseCode, currentStatus, reason = '') => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = !currentStatus;
      
      await axios.put(`${API_URL}/courses/${courseCode}/availability`, {
        isAvailableForNextSemester: newStatus,
        reason: reason || (newStatus ? 'Made available for next semester' : 'Flagged for next semester')
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      setCourses(prev => prev.map(course => 
        course.courseCode === courseCode 
          ? { ...course, isAvailableForNextSemester: newStatus }
          : course
      ));
      
      setSuccess(`Course ${courseCode} ${newStatus ? 'unflagged' : 'flagged'} successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(`Failed to update course ${courseCode}`);
      console.error('Flag toggle error:', error);
    }
  };

  const handleBulkAction = async () => {
    if (selectedCourses.length === 0 || !bulkAction) {
      setError('Please select courses and an action');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const isAvailable = bulkAction === 'unflag';
      
      await axios.put(`${API_URL}/courses/bulk-availability`, {
        courseCodes: selectedCourses,
        isAvailableForNextSemester: isAvailable,
        reason: bulkReason || `Bulk ${bulkAction}`
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      setCourses(prev => prev.map(course => 
        selectedCourses.includes(course.courseCode)
          ? { ...course, isAvailableForNextSemester: isAvailable }
          : course
      ));
      
      setSelectedCourses([]);
      setBulkAction('');
      setBulkReason('');
      setSuccess(`Bulk ${bulkAction} completed for ${selectedCourses.length} courses`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to perform bulk action');
      console.error('Bulk action error:', error);
    }
  };

  // Validation helpers (should match backend)
  const validateForm = () => {
    const errs = {};
    if (!/^[0-9]{4}$/.test(newCourse.courseCode)) errs.courseCode = "Must be exactly 4 digits";
    if (!newCourse.subject?.trim()) errs.subject = "Required";
    if (!['B.Tech', 'M.Tech', 'M.Sc'].includes(newCourse.program)) errs.program = "Choose program";
    if (!newCourse.branch?.trim()) errs.branch = "Required";
    if (!['Autumn', 'Spring', 'Both'].includes(newCourse.semester)) errs.semester = "Choose";
    if (!String(newCourse.credits).trim() || isNaN(Number(newCourse.credits)) || Number(newCourse.credits) < 1 || Number(newCourse.credits) > 10) errs.credits = "1-10";
    return errs;
  };

  const handleCourseChange = e => {
    const { name, value } = e.target;
    setNewCourse(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
    setModalError('');
  };

  const fetchCourseOptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/courses`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setAllCourses(res.data.courses || []);
    } catch(e) {
      setAllCourses([]);
    }
  };

  const openAddModal = () => {
    setNewCourse(defaultForm);
    setFormErrors({});
    setModalError('');
    setModalSuccess('');
    fetchCourseOptions();
    setAddModalOpen(true);
  };
  const closeAddModal = () => {
    if (submitting) return;
    setAddModalOpen(false);
    setNewCourse(defaultForm);
    setFormErrors({});
    setModalError('');
    setModalSuccess('');
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');
    const errs = validateForm();
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/courses`, {
        ...newCourse,
        credits: Number(newCourse.credits)
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setModalSuccess(response.data.message || 'Course created successfully');
      setModalError('');
      setNewCourse(defaultForm);
      setFormErrors({});
      fetchCourses();
      // Close modal after short delay to show success
      setTimeout(() => {
        setModalSuccess('');
        setAddModalOpen(false);
      }, 1000);
    } catch (err) {
      setModalError((err.response && (err.response.data?.errors?.join('; ') || err.response.data?.message)) || 'Failed to add course');
      setModalSuccess('');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = searchTerm === '' || 
      course.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleSelectCourse = (courseCode) => {
    setSelectedCourses(prev => 
      prev.includes(courseCode)
        ? prev.filter(code => code !== courseCode)
        : [...prev, courseCode]
    );
  };

  const handleSelectAll = () => {
    if (selectedCourses.length === filteredCourses.length) {
      setSelectedCourses([]);
    } else {
      setSelectedCourses(filteredCourses.map(course => course.courseCode));
    }
  };

  // Gather possible values for stepwise selects
  const allSemesters = uniq(allCourses.map(c => c.semester));
  // Filter branches to those with the currently selected semester or all if not yet selected
  const branchOptions = uniq(allCourses.filter(c => !newCourse.semester || c.semester === newCourse.semester).map(c => c.branch));
  // Programs for current branch (if selected)
  const programOptions = uniq(
    allCourses.filter(c =>
      (!newCourse.semester || c.semester === newCourse.semester) &&
      (!newCourse.branch || c.branch === newCourse.branch)).map(c => c.program)
  );

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
            <Flag className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Course Flag Manager</h2>
            <p className="text-sm text-gray-600">Add new courses and manage availability/flags. Only admins can create courses.</p>
          </div>
        </div>
        {user && user.role === 'admin' && (
          <button onClick={openAddModal} className="ml-4 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">+ Add Course</button>
        )}
      </div>
      {/* --- ADD COURSE MODAL --- */}
      <Modal open={addModalOpen} onClose={closeAddModal}>
        <h2 className="text-xl mb-4 font-semibold text-gray-900">Add New Course</h2>
        <form onSubmit={handleCourseSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1 font-medium text-gray-700">Semester*</label>
              <select name="semester" value={newCourse.semester} onChange={handleCourseChange} className="w-full border px-3 py-2 rounded-lg" disabled={submitting}>
                <option value="">Select</option>
                {['Autumn','Spring','Both'].map(s => <option key={s} value={s}>{s}</option>)}
                {/* admin may want a new value */}
              </select>
              {formErrors.semester && <span className="text-xs text-red-600">{formErrors.semester}</span>}
            </div>
            <div>
              <label className="block text-xs mb-1 font-medium text-gray-700">Branch* (from courses or enter new)</label>
              <input
                name="branch"
                value={newCourse.branch}
                onChange={e=>{
                  handleCourseChange(e);
                }}
                list="branchOptions"
                className="w-full border px-3 py-2 rounded-lg" disabled={!newCourse.semester || submitting} autoComplete="off"
              />
              <datalist id="branchOptions">
                {branchOptions.map((b,idx)=>(<option key={idx} value={b} />))}
              </datalist>
              {formErrors.branch && <span className="text-xs text-red-600">{formErrors.branch}</span>}
            </div>
            <div>
              <label className="block text-xs mb-1 font-medium text-gray-700">Program* (from courses or enter new)</label>
              <input
                name="program"
                value={newCourse.program}
                onChange={handleCourseChange}
                list="programOptions"
                className="w-full border px-3 py-2 rounded-lg" disabled={!newCourse.branch || submitting} autoComplete="off"
              />
              <datalist id="programOptions">
                {programOptions.map((p,idx)=>(<option key={idx} value={p} />))}
              </datalist>
              {formErrors.program && <span className="text-xs text-red-600">{formErrors.program}</span>}
            </div>
            <div>
              <label className="block text-xs mb-1 font-medium text-gray-700">Course Code*</label>
              <input name="courseCode" value={newCourse.courseCode} onChange={handleCourseChange} className="w-full border px-3 py-2 rounded-lg" maxLength={4} disabled={!newCourse.program || submitting} />
              {formErrors.courseCode && <span className="text-xs text-red-600">{formErrors.courseCode}</span>}
            </div>
            <div>
              <label className="block text-xs mb-1 font-medium text-gray-700">Subject*</label>
              <input name="subject" value={newCourse.subject} onChange={handleCourseChange} className="w-full border px-3 py-2 rounded-lg" disabled={!newCourse.courseCode || submitting} />
              {formErrors.subject && <span className="text-xs text-red-600">{formErrors.subject}</span>}
            </div>
            <div>
              <label className="block text-xs mb-1 font-medium text-gray-700">Credits (1-10)*</label>
              <input name="credits" value={newCourse.credits} onChange={handleCourseChange} className="w-full border px-3 py-2 rounded-lg" type="number" min="1" max="10" disabled={!newCourse.subject || submitting} />
              {formErrors.credits && <span className="text-xs text-red-600">{formErrors.credits}</span>}
            </div>
          </div>
          {modalError && <div className="text-red-700 font-medium text-sm">{modalError}</div>}
          {modalSuccess && <div className="text-green-700 font-medium text-sm">{modalSuccess}</div>}
          <div className="flex gap-2 mt-2 justify-end">
            <button type="button" onClick={closeAddModal} className="px-4 py-2 border rounded-lg" disabled={submitting}>Cancel</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-w-[110px] flex items-center justify-center" disabled={submitting}>{submitting ? <span className="inline-block animate-spin mr-1 h-5 w-5 border-2 border-white border-t-blue-600 rounded-full"></span> : null} Add Course</button>
          </div>
        </form>
      </Modal>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
          <select
            value={filters.program}
            onChange={(e) => setFilters(prev => ({ ...prev, program: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Programs</option>
            <option value="B.Tech">B.Tech</option>
            <option value="M.Tech">M.Tech</option>
            <option value="M.Sc">M.Sc</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
          <input
            type="text"
            value={filters.branch}
            onChange={(e) => setFilters(prev => ({ ...prev, branch: e.target.value }))}
            placeholder="Filter by branch"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
          <select
            value={filters.semester}
            onChange={(e) => setFilters(prev => ({ ...prev, semester: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Semesters</option>
            <option value="Autumn">Autumn</option>
            <option value="Spring">Spring</option>
            <option value="Both">Both</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
          <select
            value={filters.isAvailableForNextSemester}
            onChange={(e) => setFilters(prev => ({ ...prev, isAvailableForNextSemester: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All</option>
            <option value="true">Available</option>
            <option value="false">Flagged</option>
          </select>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by course code or subject..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCourses.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">
              {selectedCourses.length} course(s) selected
            </span>
            <div className="flex items-center space-x-2">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Action</option>
                <option value="flag">Flag (Make Unavailable)</option>
                <option value="unflag">Unflag (Make Available)</option>
              </select>
              <input
                type="text"
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                placeholder="Reason (optional)"
                className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleBulkAction}
                className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Courses Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedCourses.length === filteredCourses.length && filteredCourses.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Course Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Program
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Branch
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Semester
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Credits
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                  Loading courses...
                </td>
              </tr>
            ) : filteredCourses.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                  No courses found
                </td>
              </tr>
            ) : (
              filteredCourses.map((course) => (
                <tr key={course.courseCode} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedCourses.includes(course.courseCode)}
                      onChange={() => handleSelectCourse(course.courseCode)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {course.courseCode}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {course.subject}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {course.program}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {course.branch}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {course.semester}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {course.credits}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      course.isAvailableForNextSemester
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {course.isAvailableForNextSemester ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Available
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Flagged
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleFlagToggle(course.courseCode, course.isAvailableForNextSemester)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        course.isAvailableForNextSemester
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {course.isAvailableForNextSemester ? 'Flag' : 'Unflag'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CourseFlagManager;
