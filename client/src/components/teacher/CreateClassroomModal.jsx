import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createClassroom } from '../../store/slices/classroomSlice';
import { X, BookOpen } from 'lucide-react';

const CreateClassroomModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
  });
  const WORD_LIMIT_DESC = 60;
  const [descCount, setDescCount] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createClassroom(formData)).then(() => {
      setFormData({ name: '', description: '', subject: '' });
      onClose();
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