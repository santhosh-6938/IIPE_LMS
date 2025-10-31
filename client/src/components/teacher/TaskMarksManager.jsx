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
            {/* Show NOTHING if published except badge. Only show buttons for draft/incomplete. */}
            {currentTaskMarks?.status === 'published' ? null : (
              <>
               {/* Assign Marks only if no marks and not published */}
                {(!currentTaskMarks || (currentTaskMarks?.marks?.length || 0) === 0) && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Award className="w-4 h-4" />
                    <span>Assign Marks</span>
                  </button>
                )}
                {/* Edit/Publish only if marks exist and draft */}
                {currentTaskMarks?.status === 'draft' && (currentTaskMarks?.marks?.length || 0) > 0 && (
                  <>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Draft</span>
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={!currentTaskMarks?.marks || currentTaskMarks.marks.length === 0}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 text-white ${(!currentTaskMarks?.marks || currentTaskMarks.marks.length === 0) ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Submit</span>
                  </button>
                  </>
                )}
              </>
            )}
            {/* Always show Published badge if published */}
            {currentTaskMarks?.status === 'published' && (
              <div className="text-sm text-gray-600">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Published
                </span>
              </div>
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

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {(() => {
              const denom = currentTaskMarks?.maxMarks || 100;
              const graded = currentTaskMarks?.marks?.length || 0;
              const totalStudents = selectedTask.submissions?.length || 0;
              const average = graded > 0
                ? Math.round((currentTaskMarks.marks.reduce((sum, m) => sum + (m.marks || 0), 0) / graded) * 100) / 100
                : 0;
              return (
                <>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">Graded</div>
                    <div className="text-xl font-semibold text-gray-900">{graded} / {totalStudents}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">Average</div>
                    <div className="text-xl font-semibold text-gray-900">{average}{denom ? ` / ${denom}` : ''}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">Out of</div>
                    <div className="text-xl font-semibold text-gray-900">{denom}</div>
                  </div>
                </>
              );
            })()}
          </div>

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
                  <div className="text-2xl font-bold text-blue-600">{mark.marks}/{currentTaskMarks?.maxMarks || 100}</div>
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
  const [maxMarks, setMaxMarks] = useState(100);
  const [initialized, setInitialized] = useState(false);

  // Reset initialization flag on open
  useEffect(() => {
    if (isOpen) {
      setInitialized(false);
    }
  }, [isOpen]);

  // Initialize marks only once per open, avoid overwriting while typing
  useEffect(() => {
    if (!initialized && task?.submissions) {
      const initialMarks = task.submissions
        .filter(sub => sub.status === 'submitted')
        .map(submission => {
          const existingMark = existingMarks?.marks?.find(
            mark => (mark.student._id || mark.student).toString() === submission.student._id.toString()
          );
          const initialMarksValue = typeof existingMark?.marks === 'number' ? existingMark.marks : '';
          return {
            student: submission.student,
            submission: submission._id,
            submittedAt: submission.submittedAt,
            marksInput: initialMarksValue === '' ? '' : String(initialMarksValue),
            feedback: existingMark?.feedback || ''
          };
        });
      setMarksData(initialMarks);
      setInitialized(true);
    }
  }, [initialized, task, existingMarks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (existingMarks && existingMarks.status === 'published') {
      toast.error('Marks have been published. You cannot update marks after publication.');
      return;
    }
    if (!marksData || marksData.length === 0) {
      toast.error('No students or marks to update.');
      return;
    }
    setIsLoading(true);
    try {
      // Transform data to match backend expectations
      const parsedMax = parseInt(maxMarks, 10);
      const effectiveMax = Number.isFinite(parsedMax) && parsedMax > 0 ? parsedMax : undefined;
      const transformedMarksData = marksData.map(mark => {
        const numeric = parseInt(mark.marksInput, 10);
        let safeMarks = Number.isFinite(numeric) ? Math.max(0, numeric) : 0;
        if (Number.isFinite(effectiveMax)) {
          safeMarks = Math.min(effectiveMax, safeMarks);
        }
        return {
          student: mark.student._id || mark.student,
          submission: mark.submission,
          marks: safeMarks,
          feedback: mark.feedback
        };
      });

      await dispatch(updateTaskMarks({ taskId: task._id, marksData: transformedMarksData, maxMarks: effectiveMax })).unwrap();
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
            <div className="mt-3 flex items-center space-x-3">
              <label className="text-sm text-gray-700">Out of</label>
              <input
                type="text"
                inputMode="numeric"
                value={maxMarks}
                onChange={(e) => {
                  const digitsOnly = (e.target.value || '').replace(/[^\d]/g, '');
                  setMaxMarks(digitsOnly);
                }}
                className="w-20 border border-gray-300 rounded-md px-2 py-1 text-center"
              />
            </div>
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
                      {(() => {
                        const deadline = task.deadline ? new Date(task.deadline) : null;
                        const extended = task.extendedDeadline ? new Date(task.extendedDeadline) : null;
                        const submitted = mark.submittedAt ? new Date(mark.submittedAt) : null;
                        if (!submitted || !deadline) return null;
                        let label = 'On time';
                        let classes = 'bg-green-100 text-green-800';
                        if (submitted > deadline) {
                          if (extended && submitted <= extended) {
                            label = 'Late (within extension)';
                            classes = 'bg-yellow-100 text-yellow-800';
                          } else {
                            label = 'Late (after extension)';
                            classes = 'bg-red-100 text-red-800';
                          }
                        }
                        return (
                          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded ${classes}`}>
                            {label}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={mark.marksInput}
                        onChange={(e) => {
                          const digitsOnly = (e.target.value || '').replace(/[^\d]/g, '');
                          const max = parseInt(maxMarks, 10);
                          let nextValue = digitsOnly;
                          if (Number.isFinite(max) && max > 0) {
                            const asNum = parseInt(digitsOnly, 10);
                            if (Number.isFinite(asNum) && asNum > max) {
                              nextValue = String(max);
                            }
                          }
                          setMarksData((prev) => {
                            const next = [...prev];
                            next[index] = { ...next[index], marksInput: nextValue };
                            return next;
                          });
                        }}
                        className="w-20 border border-gray-300 rounded-md px-2 py-1 text-center"
                        placeholder="0"
                      />
                      <span className="text-sm text-gray-600">/ {maxMarks || 100}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
                    <textarea
                      value={mark.feedback}
                      onChange={(e) => {
                        const value = e.target.value;
                        setMarksData((prev) => {
                          const next = [...prev];
                          next[index] = { ...next[index], feedback: value };
                          return next;
                        });
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
              {isLoading ? 'Saving...' : 'Save Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskMarksManager;
