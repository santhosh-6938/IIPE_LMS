import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { 
  Plus, 
  Upload, 
  Edit, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  Download,
  FileSpreadsheet,
  Users,
  Calendar,
  BookOpen,
  X
} from 'lucide-react';
import { 
  fetchMidTermMarks, 
  createMidTermMarks, 
  uploadMidTermMarks, 
  updateMidTermMarks, 
  publishMidTermMarks,
  clearError 
} from '../../store/slices/marksSlice';
import ExcelTemplateGenerator from './ExcelTemplateGenerator';
import { fetchClassrooms } from '../../store/slices/classroomSlice';

const MidTermMarksManager = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { classrooms } = useSelector(state => state.classroom);
  const { midTermMarks, isLoading, error } = useSelector(state => state.marks);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedMarks, setSelectedMarks] = useState(null);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [filterTerm, setFilterTerm] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    dispatch(fetchClassrooms());
    dispatch(fetchMidTermMarks());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const filteredMarks = midTermMarks.filter(mark => {
    const termMatch = filterTerm === 'all' || mark.term === filterTerm;
    const statusMatch = filterStatus === 'all' || mark.status === filterStatus;
    return termMatch && statusMatch;
  });

  const getStatusBadge = (status) => {
    if (status === 'published') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Published
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Edit className="w-3 h-3 mr-1" />
        Draft
      </span>
    );
  };

  const handlePublish = async (marksId) => {
    if (window.confirm('Are you sure you want to publish these marks? This action cannot be undone.')) {
      try {
        await dispatch(publishMidTermMarks(marksId)).unwrap();
        toast.success('Marks published successfully!');
        dispatch(fetchMidTermMarks());
      } catch (error) {
        toast.error(error || 'Failed to publish marks');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mid Term Marks Management</h2>
          <p className="text-gray-600">Manage and publish mid term marks for your students</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Excel</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Marks</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center space-x-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
            <select
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Terms</option>
              <option value="Mid Term I">Mid Term I</option>
              <option value="Mid Term II">Mid Term II</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
      </div>

      {/* Marks List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 border animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredMarks.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center border">
          <FileSpreadsheet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No marks found</h3>
          <p className="text-gray-600 mb-6">
            {filterTerm === 'all' && filterStatus === 'all'
              ? 'Create your first mid term marks to get started'
              : `No marks found for the selected filters`
            }
          </p>
          {filterTerm === 'all' && filterStatus === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Marks
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMarks.map((mark) => (
            <div key={mark._id} className="bg-white rounded-lg p-6 border hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{mark.term}</h3>
                  <p className="text-gray-600 text-sm mb-2">{mark.subject}</p>
                  <p className="text-gray-500 text-xs">{mark.classroom?.name}</p>
                </div>
                {getStatusBadge(mark.status)}
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{mark.academicYear} - {mark.semester}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  <span>{mark.marks?.length || 0} students</span>
                </div>
                {mark.status === 'published' && mark.publishedAt && (
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span>Published: {new Date(mark.publishedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t">
                <button
                  onClick={() => {
                    setSelectedMarks(mark);
                    // Navigate to view marks details
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                {mark.status === 'draft' && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedMarks(mark);
                        setShowEditModal(true);
                      }}
                      className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handlePublish(mark._id)}
                      className="flex-1 bg-green-100 text-green-700 py-2 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Publish</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Marks Modal */}
      {showCreateModal && (
        <CreateMidTermMarksModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          classrooms={classrooms}
        />
      )}

      {/* Upload Marks Modal */}
      {showUploadModal && (
        <UploadMidTermMarksModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          classrooms={classrooms}
        />
      )}

      {/* Edit Marks Modal */}
      {showEditModal && selectedMarks && (
        <EditMidTermMarksModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedMarks(null);
          }}
          marks={selectedMarks}
        />
      )}
    </div>
  );
};

// Create Marks Modal Component
const CreateMidTermMarksModal = ({ isOpen, onClose, classrooms }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    classroomId: '',
    term: '',
    academicYear: '',
    semester: '',
    subject: ''
  });
  const [marksData, setMarksData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-populate academic year
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const academicYear = `${currentYear}-${nextYear}`;
    setFormData(prev => ({ ...prev, academicYear }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (marksData.length === 0) {
      toast.error('Please add marks for at least one student');
      return;
    }

    setIsLoading(true);
    try {
      await dispatch(createMidTermMarks({
        ...formData,
        marksData: marksData.map(mark => ({
          student: mark.student._id, // Send only the student ID to backend
          marks: mark.marks,
          remarks: mark.remarks
        }))
      })).unwrap();
      toast.success('Marks created successfully!');
      onClose();
      dispatch(fetchMidTermMarks());
    } catch (error) {
      toast.error(error || 'Failed to create marks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassroomChange = async (classroomId) => {
    setFormData(prev => ({ ...prev, classroomId }));
    if (classroomId) {
      // Fetch students for the selected classroom
      const classroom = classrooms.find(c => c._id === classroomId);
      if (classroom?.students) {
        const initialMarks = classroom.students.map(student => ({
          student: student, // Use full student object instead of just ID
          marks: 0,
          remarks: ''
        }));
        setMarksData(initialMarks);
      }
    } else {
      setMarksData([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Create Mid Term Marks</h3>
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Classroom</label>
              <select
                value={formData.classroomId}
                onChange={(e) => handleClassroomChange(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="">Select Classroom</option>
                {classrooms.map(classroom => (
                  <option key={classroom._id} value={classroom._id}>
                    {classroom.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
              <select
                value={formData.term}
                onChange={(e) => setFormData(prev => ({ ...prev, term: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="">Select Term</option>
                <option value="Mid Term I">Mid Term I</option>
                <option value="Mid Term II">Mid Term II</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                placeholder="e.g., 2024-2025"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="">Select Semester</option>
                <option value="Autumn">Autumn</option>
                <option value="Spring">Spring</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter subject name"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
          </div>

          {marksData.length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Student Marks</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {marksData.map((mark, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{mark.student.name}</p>
                      <p className="text-sm text-gray-600">{mark.student.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={mark.marks || ''}
                        onChange={(e) => {
                          const newMarksData = [...marksData];
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                          newMarksData[index].marks = value;
                          setMarksData(newMarksData);
                        }}
                        className="w-20 border border-gray-300 rounded-md px-2 py-1 text-center"
                        placeholder="0"
                      />
                      <span className="text-sm text-gray-600">/ 100</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Marks'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Upload Marks Modal Component
const UploadMidTermMarksModal = ({ isOpen, onClose, classrooms }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    classroomId: '',
    term: '',
    academicYear: '',
    semester: '',
    subject: ''
  });
  const [excelFile, setExcelFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-populate academic year
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const academicYear = `${currentYear}-${nextYear}`;
    setFormData(prev => ({ ...prev, academicYear }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!excelFile) {
      toast.error('Please select an Excel file');
      return;
    }

    setIsLoading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('excelFile', excelFile);
      uploadData.append('classroomId', formData.classroomId);
      uploadData.append('term', formData.term);
      uploadData.append('academicYear', formData.academicYear);
      uploadData.append('semester', formData.semester);
      uploadData.append('subject', formData.subject);

      await dispatch(uploadMidTermMarks(uploadData)).unwrap();
      toast.success('Marks uploaded successfully!');
      onClose();
      dispatch(fetchMidTermMarks());
    } catch (error) {
      toast.error(error || 'Failed to upload marks');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Upload Mid Term Marks</h3>
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Classroom</label>
              <select
                value={formData.classroomId}
                onChange={(e) => setFormData(prev => ({ ...prev, classroomId: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="">Select Classroom</option>
                {classrooms.map(classroom => (
                  <option key={classroom._id} value={classroom._id}>
                    {classroom.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
              <select
                value={formData.term}
                onChange={(e) => setFormData(prev => ({ ...prev, term: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="">Select Term</option>
                <option value="Mid Term I">Mid Term I</option>
                <option value="Mid Term II">Mid Term II</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                placeholder="e.g., 2024-2025"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="">Select Semester</option>
                <option value="Autumn">Autumn</option>
                <option value="Spring">Spring</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter subject name"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Excel File</label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setExcelFile(e.target.files[0])}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Excel file should contain columns: Name, Email ID, Roll Number, Marks
            </p>
          </div>

          <ExcelTemplateGenerator classroom={classrooms.find(c => c._id === formData.classroomId)} />

          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Uploading...' : 'Upload Marks'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Marks Modal Component
const EditMidTermMarksModal = ({ isOpen, onClose, marks }) => {
  const dispatch = useDispatch();
  const [marksData, setMarksData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (marks) {
      setMarksData([...marks.marks]);
    }
  }, [marks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await dispatch(updateMidTermMarks({ marksId: marks._id, marksData })).unwrap();
      toast.success('Marks updated successfully!');
      onClose();
      dispatch(fetchMidTermMarks());
    } catch (error) {
      toast.error(error || 'Failed to update marks');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !marks) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Edit Mid Term Marks</h3>
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">{marks.term} - {marks.subject}</h4>
            <p className="text-sm text-gray-600">{marks.classroom?.name} | {marks.academicYear} {marks.semester}</p>
          </div>

          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Student Marks</h4>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {marksData.map((mark, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{mark.student.name}</p>
                    <p className="text-sm text-gray-600">{mark.student.email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={mark.marks || ''}
                      onChange={(e) => {
                        const newMarksData = [...marksData];
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                        newMarksData[index].marks = value;
                        setMarksData(newMarksData);
                      }}
                      className="w-20 border border-gray-300 rounded-md px-2 py-1 text-center"
                    />
                    <span className="text-sm text-gray-600">/ 100</span>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={mark.remarks || ''}
                      onChange={(e) => {
                        const newMarksData = [...marksData];
                        newMarksData[index].remarks = e.target.value;
                        setMarksData(newMarksData);
                      }}
                      placeholder="Remarks (optional)"
                      className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Update Marks'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MidTermMarksManager;
