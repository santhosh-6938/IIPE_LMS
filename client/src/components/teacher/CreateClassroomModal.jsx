import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { createClassroom } from '../../store/slices/classroomSlice';
import axios from 'axios';
import { X, BookOpen } from 'lucide-react';

const CreateClassroomModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    semester: '',
    academicYear: '',
    program: '',
    branch: '',
    startMonth: '',
    endMonth: '',
    courseCode: '',
    section: '',
  });
  const WORD_LIMIT_DESC = 60;
  const [descCount, setDescCount] = useState(0);
  const [branches, setBranches] = useState([]);
  const [sections, setSections] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [error, setError] = useState('');

  // Generate course ID preview
  const generateCourseIdPreview = () => {
    if (!formData.courseCode || !formData.semester || !formData.branch || !formData.section || !formData.academicYear) {
      return '';
    }
    const semIndicator = formData.semester === 'Autumn' ? '0' : '1';
    const academicYearShort = formData.academicYear.split('-').map(year => year.slice(-2)).join('');
    // Replace spaces with underscores in branch name to match backend
    const branchFormatted = formData.branch.toLowerCase().replace(/\s+/g, '_');
    return `${formData.courseCode}_${semIndicator}_${branchFormatted}_${formData.section.toLowerCase()}_${academicYearShort}`;
  };

  const calculateAcademicYear = useMemo(() => {
    return () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1; // 1-12
      // Academic year typically starts in July/Aug (assume July = start)
      // If month >= 7 (Jul-Dec): AY is year-year+1; else year-1-year
      if (month >= 7) {
        return `${year}-${year + 1}`;
      } else {
        return `${year - 1}-${year}`;
      }
    };
  }, []);

  useEffect(() => {
    // Set academic year on open
    if (isOpen) {
      setFormData(prev => ({ ...prev, academicYear: calculateAcademicYear() }));
    }
  }, [isOpen, calculateAcademicYear]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    // Basic validation
    const required = ['name', 'semester', 'academicYear', 'program', 'branch', 'startMonth', 'endMonth', 'courseCode', 'section'];
    for (const key of required) {
      if (!formData[key]) {
        setError('Please fill all required fields.');
        return;
      }
    }
    
    // Validate course code format
    if (!/^[0-9]{4}$/.test(formData.courseCode)) {
      setError('Course code must be exactly 4 digits.');
      return;
    }
    
    // Validate section format
    if (!/^[a-zA-Z0-9]+$/.test(formData.section) || formData.section.length < 1) {
      setError('Section must contain only alphanumeric characters and be at least 1 character long.');
      return;
    }
    dispatch(createClassroom(formData))
      .unwrap()
      .then(() => {
        setFormData({ name: '', description: '', subject: '', semester: '', academicYear: calculateAcademicYear(), program: '', branch: '', startMonth: '', endMonth: '', courseCode: '', section: '' });
        setBranches([]);
        onClose();
      })
      .catch(err => {
        setError(typeof err === 'string' ? err : 'Failed to create classroom');
      });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'description') {
      const words = (value.trim() ? value.trim().split(/\s+/) : []);
      if (words.length <= WORD_LIMIT_DESC) {
        setFormData(prev => ({ ...prev, [name]: value }));
        setDescCount(words.length);
      } else {
        const trimmed = words.slice(0, WORD_LIMIT_DESC).join(' ');
        setFormData(prev => ({ ...prev, [name]: trimmed }));
        setDescCount(WORD_LIMIT_DESC);
      }
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));

    // When program changes, fetch branches
    if (name === 'program') {
      setBranches([]);
      setSections([]);
      setFormData(prev => ({ ...prev, branch: '', section: '' }));
      if (value) {
        setLoadingBranches(true);
        const token = localStorage.getItem('token');
        axios.get(`${API_URL}/programs/${encodeURIComponent(value)}/branches`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        .then(res => {
          const list = res.data.branches || [];
          setBranches(list);
          // If only one branch, select it by default
          if (list.length === 1) {
            setFormData(prev => ({ ...prev, branch: list[0] }));
          }
        })
        .catch(() => {
          setBranches([]);
        })
        .finally(() => setLoadingBranches(false));
      }
    }

    // When courseCode changes, try to auto-fetch subject and check availability
    if (name === 'courseCode') {
      const code = value.trim();
      if (/^[0-9]{4}$/.test(code)) {
        const token = localStorage.getItem('token');
        console.log('🔍 Fetching subject for course code:', code);
        console.log('🔍 Token available:', !!token);

        // Helper function to handle successful subject response
        const handleSubjectResponse = (data) => {
          const { subject, program, branch, semester, isAvailableForNextSemester } = data;
          if (subject) {
            setFormData(prev => ({ 
              ...prev, 
              subject,
              // Auto-populate program and branch if they match
              ...(program && !prev.program && { program }),
              ...(branch && !prev.branch && { branch })
            }));
            
            // Check if course is available for next semester
            if (!isAvailableForNextSemester) {
              setError('This course is flagged and not available for the next semester. Please contact admin.');
            } else {
              setError(''); // Clear any previous error
            }
          } else {
            // Course code exists but no subject found
            setFormData(prev => ({ ...prev, subject: '' }));
            setError('Course code found but subject information is missing. Please enter subject manually.');
          }
        };

        // Helper function to handle errors
        const handleSubjectError = (error) => {
          console.log('❌ Subject fetch error:', error.response?.status, error.response?.data?.message || error.message);
          if (error.response?.status === 401) {
            setFormData(prev => ({ ...prev, subject: '' }));
            setError('Authentication required. Please log in again.');
          } else if (error.response?.status === 404) {
            setFormData(prev => ({ ...prev, subject: '' }));
            setError('Course code not found in the system. Please verify the code or enter subject manually.');
          } else {
            setFormData(prev => ({ ...prev, subject: '' }));
            setError('Unable to fetch course information. Please enter subject manually.');
          }
        };

        // Try authenticated endpoint first
        const tryAuthenticatedFetch = () => {
          return axios.get(`${API_URL}/courses/subject/${encodeURIComponent(code)}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
        };

        // Try unauthenticated endpoint as fallback
        const tryUnauthenticatedFetch = () => {
          console.log('🔄 Trying unauthenticated endpoint as fallback...');
          return axios.get(`${API_URL}/courses/public/subject/${encodeURIComponent(code)}`);
        };

        // First try authenticated, then fallback to unauthenticated
        tryAuthenticatedFetch()
          .then(res => {
            console.log('✅ Subject fetch successful (authenticated):', res.data);
            handleSubjectResponse(res.data);
          })
          .catch((error) => {
            console.log('❌ Authenticated fetch failed:', error.response?.status, error.response?.data?.message || error.message);
            
            // If 401 or 404, try unauthenticated endpoint
            if (error.response?.status === 401 || error.response?.status === 404) {
              tryUnauthenticatedFetch()
                .then(res => {
                  console.log('✅ Subject fetch successful (unauthenticated):', res.data);
                  handleSubjectResponse(res.data);
                })
                .catch((fallbackError) => {
                  console.log('❌ Both endpoints failed:', fallbackError.response?.status, fallbackError.response?.data?.message || fallbackError.message);
                  handleSubjectError(fallbackError);
                });
            } else {
              handleSubjectError(error);
            }
          });
      } else {
        // Clear subject if course code is not valid
        setFormData(prev => ({ ...prev, subject: '' }));
        setError('');
      }
    }

    // When branch changes, load sections for that branch and available courses
    if (name === 'branch') {
      setSections([]);
      setAvailableCourses([]);
      setFormData(prev => ({ ...prev, section: '', courseCode: '', subject: '' }));
      const program = formData.program || '';
      if (program && value) {
        setLoadingSections(true);
        setLoadingCourses(true);
        const token = localStorage.getItem('token');
        
        // Fetch sections
        axios.get(`${API_URL}/programs/${encodeURIComponent(program)}/branches/${encodeURIComponent(value)}/sections`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        .then(res => {
          const secs = res?.data?.sections || [];
          setSections(secs);
          if (secs.length > 0) {
            setFormData(prev => ({ ...prev, section: secs[0] }));
          }
        })
        .catch(() => setSections([]))
        .finally(() => setLoadingSections(false));
        
        // Fetch available courses
        const semester = formData.semester || '';
        if (semester) {
          axios.get(`${API_URL}/programs/${encodeURIComponent(program)}/branches/${encodeURIComponent(value)}/courses?semester=${encodeURIComponent(semester)}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          })
          .then(res => {
            const courses = res?.data?.courses || [];
            setAvailableCourses(courses);
          })
          .catch(() => setAvailableCourses([]))
          .finally(() => setLoadingCourses(false));
        } else {
          setLoadingCourses(false);
        }
      }
    }

    // When semester changes, reload available courses if branch is selected
    if (name === 'semester') {
      setAvailableCourses([]);
      setFormData(prev => ({ ...prev, courseCode: '', subject: '' }));
      const program = formData.program || '';
      const branch = formData.branch || '';
      if (program && branch && value) {
        setLoadingCourses(true);
        const token = localStorage.getItem('token');
        axios.get(`${API_URL}/programs/${encodeURIComponent(program)}/branches/${encodeURIComponent(branch)}/courses?semester=${encodeURIComponent(value)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        .then(res => {
          const courses = res?.data?.courses || [];
          setAvailableCourses(courses);
        })
        .catch(() => setAvailableCourses([]))
        .finally(() => setLoadingCourses(false));
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-5xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Create New Classroom</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-2 text-sm rounded bg-red-50 text-red-700 border border-red-200">{error}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Classroom Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Mathematics Grade 10"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formData.subject ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}
                placeholder="e.g., Mathematics"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Semester *</label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Semester</option>
                <option value="Autumn">Autumn</option>
                <option value="Spring">Spring</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year *</label>
              <input
                type="text"
                name="academicYear"
                value={formData.academicYear}
                readOnly
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Month *</label>

              <select
                name="startMonth"
                value={formData.startMonth}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Month</option>
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, idx) => (
                  <option key={m} value={idx+1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Month *</label>
              <select
                name="endMonth"
                value={formData.endMonth}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Month</option>
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, idx) => (
                  <option key={m} value={idx+1}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Program *</label>
              <select
                name="program"
                value={formData.program}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Program</option>
                <option value="B.Tech">B.Tech</option>
                <option value="M.Tech">M.Tech</option>
                <option value="M.Sc">M.Sc</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Branch *</label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                disabled={!formData.program || loadingBranches}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
                required
              >
                <option value="">{loadingBranches ? 'Loading...' : 'Select Branch'}</option>
                {branches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Available Courses Selection */}
          {availableCourses.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-800 mb-2">Available Courses for {formData.branch} - {formData.semester}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableCourses.map(course => (
                  <button
                    key={course.courseCode}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ 
                        ...prev, 
                        courseCode: course.courseCode,
                        subject: course.subject
                      }));
                    }}
                    className={`p-2 text-left rounded border transition-colors ${
                      formData.courseCode === course.courseCode
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-sm">{course.courseCode}</div>
                    <div className="text-xs text-gray-600">{course.subject}</div>
                    <div className="text-xs text-gray-500">{course.credits} credits</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700 mb-2">
                Course Code *
              </label>
              <input
                type="text"
                id="courseCode"
                name="courseCode"
                value={formData.courseCode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 1011"
                maxLength="4"
                pattern="[0-9]{4}"
                required
              />
              <div className="mt-1 text-xs text-gray-500">
                4-digit unique course code {availableCourses.length > 0 && '(or select from available courses above)'}
              </div>
            </div>
            <div>
              <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-2">
                Section *
              </label>
              <select
                id="section"
                name="section"
                value={formData.section}
                onChange={handleChange}
                disabled={!formData.branch || loadingSections}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
                required
              >
                <option value="">{loadingSections ? 'Loading...' : (sections.length ? 'Select Section' : 'No Sections')}</option>
                {sections.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <div className="mt-1 text-xs text-gray-500">Auto-loaded by branch</div>
            </div>
          </div>

          {/* Course ID Preview */}
          {generateCourseIdPreview() && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm font-medium text-blue-800 mb-1">Generated Course ID:</div>
              <div className="text-lg font-mono text-blue-900 bg-white px-2 py-1 rounded border">
                {generateCourseIdPreview()}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Format: &lt;course_code&gt;_&lt;sem_indicator&gt;_&lt;branch&gt;_&lt;section&gt;_&lt;academic_year&gt;
              </div>
            </div>
          )}

          {/* Move subject alongside name above; keep helper here */}
          {formData.subject && (
            <div className="mt-1 text-xs text-green-600">Subject automatically fetched from course code</div>
          )}

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of the classroom..."
            />
            <div className="mt-1 text-xs text-gray-500 text-right">{descCount}/{WORD_LIMIT_DESC} words</div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Classroom
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateClassroomModal;