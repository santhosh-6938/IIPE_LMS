import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createTask } from '../../store/slices/taskSlice';
import { toast } from 'react-toastify';
import { X, Upload, FileText, Calendar, Clock } from 'lucide-react';

const CreateTaskModal = ({ isOpen, onClose, classroomId }) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    instructions: '',
    maxSubmissions: 1
  });
  const [attachments, setAttachments] = useState([]);
  const WORD_LIMIT_DESC = 100;
  const WORD_LIMIT_INSTR = 200;
  const [descCount, setDescCount] = useState(0);
  const [instrCount, setInstrCount] = useState(0);

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
    if (name === 'instructions') {
      const words = (value.trim() ? value.trim().split(/\s+/) : []);
      if (words.length <= WORD_LIMIT_INSTR) {
        setFormData(prev => ({ ...prev, [name]: value }));
        setInstrCount(words.length);
      } else {
        const trimmed = words.slice(0, WORD_LIMIT_INSTR).join(' ');
        setFormData(prev => ({ ...prev, [name]: trimmed }));
        setInstrCount(WORD_LIMIT_INSTR);
      }
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const taskData = new FormData();
      taskData.append('title', formData.title);
      taskData.append('description', formData.description);
      taskData.append('classroom', classroomId);
      taskData.append('deadline', formData.deadline);
      taskData.append('instructions', formData.instructions);
      taskData.append('maxSubmissions', formData.maxSubmissions);

      attachments.forEach(file => {
        taskData.append('attachments', file);
      });

      await dispatch(createTask(taskData)).unwrap();
      onClose();
      toast.success('Task created');
      setFormData({
        title: '',
        description: '',
        deadline: '',
        instructions: '',
        maxSubmissions: 1
      });
      setAttachments([]);
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(typeof error === 'string' ? error : 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Create New Task</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter task title"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter task description"
              required
            />
            <div className="mt-1 text-xs text-gray-500 text-right">{descCount}/{WORD_LIMIT_DESC} words</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                Deadline
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  id="deadline"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="maxSubmissions" className="block text-sm font-medium text-gray-700 mb-2">
                Max Submissions
              </label>
              <input
                type="number"
                id="maxSubmissions"
                name="maxSubmissions"
                value={formData.maxSubmissions}
                onChange={handleChange}
                min="1"
                max="10"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
              Instructions
            </label>
            <textarea
              id="instructions"
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter detailed instructions for students"
            />
            <div className="mt-1 text-xs text-gray-500 text-right">{instrCount}/{WORD_LIMIT_INSTR} words</div>
          </div>

          <div>
            <label htmlFor="attachments" className="block text-sm font-medium text-gray-700 mb-2">
              Attachments
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                id="attachments"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif"
              />
              <label htmlFor="attachments" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Click to upload files or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, DOC, DOCX, TXT, ZIP, RAR, JPG, PNG, GIF (max 10MB each)
                </p>
              </label>
            </div>
            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">Selected files:</p>
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    <span>{file.name}</span>
                    <span className="text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4" />
                  <span>Create Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal; 