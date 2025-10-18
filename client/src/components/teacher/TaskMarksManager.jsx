import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { 
  Edit, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  Users,
  Calendar,
  FileText,
  Award,
  X
} from 'lucide-react';
import { 
  fetchTaskMarks, 
  updateTaskMarks, 
  publishTaskMarks
} from '../../store/slices/marksSlice';

const TaskMarksManager = ({ taskId, onClose }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { tasks } = useSelector(state => state.task);
  const { taskMarks, isLoading, error } = useSelector(state => state.marks);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    if (taskId) {
      dispatch(fetchTaskMarks(taskId));
      const task = tasks.find(t => t._id === taskId);
      setSelectedTask(task);
    }
  }, [dispatch, taskId, tasks]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const currentTaskMarks = taskMarks[taskId];

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

  const handlePublish = async () => {
    if (window.confirm('Are you sure you want to publish these marks? This action cannot be undone.')) {
      try {
        await dispatch(publishTaskMarks(taskId)).unwrap();
        toast.success('Task marks published successfully!');
        dispatch(fetchTaskMarks(taskId));
      } catch (error) {
        toast.error(error || 'Failed to publish marks');
      }
    }
  };

  if (!selectedTask) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading task...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{selectedTask.title}</h2>
            <p className="text-gray-600">{selectedTask.description}</p>
          </div>
          <div className="flex items-center space-x-3">
            {currentTaskMarks?.status === 'draft' && (
              <button
                onClick={() => setShowEditModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Marks</span>
              </button>
            )}
            {currentTaskMarks?.status === 'draft' && (
              <button
                onClick={handlePublish}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Publish Marks</span>
              </button>
            )}
            {currentTaskMarks?.status === 'published' && (
              <div className="text-sm text-gray-600">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Published
                </span>
              </div>
            )}
            {!currentTaskMarks && (
              <button
                onClick={() => setShowEditModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Award className="w-4 h-4" />
                <span>Assign Marks</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>
              {selectedTask.deadline 
                ? `Deadline: ${new Date(selectedTask.deadline).toLocaleDateString()}`
                : 'No deadline set'
              }
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-2" />
            <span>{selectedTask.submissions?.length || 0} submissions</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <FileText className="w-4 h-4 mr-2" />
            <span>
              {currentTaskMarks ? getStatusBadge(currentTaskMarks.status) : 'No marks yet'}
            </span>
          </div>
        </div>
      </div>

      {/* Marks Status */}
      {currentTaskMarks ? (
        <div className="bg-white rounded-lg p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Task Marks</h3>
            {getStatusBadge(currentTaskMarks.status)}
          </div>

          {currentTaskMarks.status === 'published' && currentTaskMarks.publishedAt && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Published:</strong> {new Date(currentTaskMarks.publishedAt).toLocaleString()}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {currentTaskMarks.marks?.map((mark, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{mark.student.name}</h4>
                  <p className="text-sm text-gray-600">{mark.student.email}</p>
                  {mark.feedback && (
                    <p className="text-sm text-gray-700 mt-1 italic">"{mark.feedback}"</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{mark.marks}/100</div>
                  <div className="text-xs text-gray-500">
                    Graded: {new Date(mark.gradedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg p-12 text-center border">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No marks assigned yet</h3>
          <p className="text-gray-600 mb-6">
            Start grading student submissions by assigning marks
          </p>
          <button
            onClick={() => setShowEditModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Assign Marks
          </button>
        </div>
      )}

      {/* Edit Marks Modal */}
      {showEditModal && (
        <EditTaskMarksModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          task={selectedTask}
          existingMarks={currentTaskMarks}
        />
      )}
    </div>
  );
};

// Edit Task Marks Modal Component
const EditTaskMarksModal = ({ isOpen, onClose, task, existingMarks }) => {
  const dispatch = useDispatch();
  const [marksData, setMarksData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (task?.submissions) {
      // Initialize marks data from submissions
      const initialMarks = task.submissions
        .filter(sub => sub.status === 'submitted')
        .map(submission => {
          const existingMark = existingMarks?.marks?.find(
            mark => mark.student.toString() === submission.student._id.toString()
          );
          
          return {
            student: submission.student,
            submission: submission._id,
            marks: existingMark?.marks || 0,
            feedback: existingMark?.feedback || ''
          };
        });
      setMarksData(initialMarks);
    }
  }, [task, existingMarks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Transform data to match backend expectations
      const transformedMarksData = marksData.map(mark => ({
        student: mark.student._id || mark.student,
        submission: mark.submission,
        marks: mark.marks,
        feedback: mark.feedback
      }));
      
      await dispatch(updateTaskMarks({ taskId: task._id, marksData: transformedMarksData })).unwrap();
      toast.success('Marks updated successfully!');
      onClose();
      dispatch(fetchTaskMarks(task._id));
    } catch (error) {
      toast.error(error || 'Failed to update marks');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Assign Task Marks</h3>
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
            <p className="text-sm text-gray-600">
              {marksData.length} student{marksData.length !== 1 ? 's' : ''} submitted
            </p>
          </div>

          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Student Marks</h4>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {marksData.map((mark, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{mark.student.name}</h5>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
                    <textarea
                      value={mark.feedback}
                      onChange={(e) => {
                        const newMarksData = [...marksData];
                        newMarksData[index].feedback = e.target.value;
                        setMarksData(newMarksData);
                      }}
                      placeholder="Add feedback for the student..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      rows={2}
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

export default TaskMarksManager;
