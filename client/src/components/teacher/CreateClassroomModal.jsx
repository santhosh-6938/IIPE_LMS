import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { createClassroom } from '../../store/slices/classroomSlice';
import axios from 'axios';
import { X, BookOpen } from 'lucide-react';

const CreateClassroomModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
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
  });
  const WORD_LIMIT_DESC = 60;
  const [descCount, setDescCount] = useState(0);
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [error, setError] = useState('');

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
    const required = ['name', 'semester', 'academicYear', 'program', 'branch', 'startMonth', 'endMonth'];
    for (const key of required) {
      if (!formData[key]) {
        setError('Please fill all required fields.');
        return;
      }
    }
    dispatch(createClassroom(formData))
      .unwrap()
      .then(() => {
        setFormData({ name: '', description: '', subject: '', semester: '', academicYear: calculateAcademicYear(), program: '', branch: '', startMonth: '', endMonth: '' });
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
      setFormData(prev => ({ ...prev, branch: '' }));
      if (value) {
        setLoadingBranches(true);
        const token = localStorage.getItem('token');
        axios.get(`${API_URL}/programs/${encodeURIComponent(value)}/branches`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        .then(res => {
          setBranches(res.data.branches || []);
        })
        .catch(() => {
          setBranches([]);
        })
        .finally(() => setLoadingBranches(false));
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-2 text-sm rounded bg-red-50 text-red-700 border border-red-200">{error}</div>
          )}
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

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Mathematics"
            />
          </div>

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