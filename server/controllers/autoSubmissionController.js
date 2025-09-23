const autoSubmissionService = require('../services/autoSubmissionService');
const Task = require('../models/Task');
const { auth, authorize } = require('../middleware/auth');

/**
 * Get auto-submission statistics
 * GET /api/auto-submission/stats
 */
const getAutoSubmissionStats = async (req, res) => {
  try {
    const stats = await autoSubmissionService.getAutoSubmissionStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting auto-submission stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get auto-submission statistics',
      error: error.message
    });
  }
};

/**
 * Manually trigger auto-submission for all tasks with passed deadlines
 * POST /api/auto-submission/trigger
 * Admin only
 */
const triggerAutoSubmission = async (req, res) => {
  try {
    const result = await autoSubmissionService.processAutoSubmissions();
    
    res.json({
      success: true,
      message: 'Auto-submission process completed',
      data: result
    });
  } catch (error) {
    console.error('Error triggering auto-submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger auto-submission',
      error: error.message
    });
  }
};

/**
 * Manually trigger auto-submission for a specific task
 * POST /api/auto-submission/trigger/:taskId
 * Admin only
 */
const triggerAutoSubmissionForTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is required'
      });
    }

    const result = await autoSubmissionService.triggerAutoSubmissionForTask(taskId);
    
    res.json({
      success: true,
      message: 'Auto-submission triggered for task',
      data: result
    });
  } catch (error) {
    console.error('Error triggering auto-submission for task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger auto-submission for task',
      error: error.message
    });
  }
};

/**
 * Get tasks with pending auto-submissions (draft submissions past deadline)
 * GET /api/auto-submission/pending
 * Admin only
 */
const getPendingAutoSubmissions = async (req, res) => {
  try {
    const now = new Date();
    
    const pendingTasks = await Task.find({
      isActive: true,
      status: 'active',
      deadline: { $lt: now },
      'submissions.status': 'draft'
    })
    .populate('classroom', 'name')
    .populate('teacher', 'name email')
    .populate('submissions.student', 'name email')
    .select('title deadline classroom teacher submissions')
    .lean();

    // Filter and format the data
    const formattedTasks = pendingTasks.map(task => {
      const draftSubmissions = task.submissions.filter(sub => sub.status === 'draft');
      
      return {
        taskId: task._id,
        title: task.title,
        deadline: task.deadline,
        classroom: {
          id: task.classroom._id,
          name: task.classroom.name
        },
        teacher: {
          id: task.teacher._id,
          name: task.teacher.name,
          email: task.teacher.email
        },
        draftSubmissions: draftSubmissions.map(sub => ({
          studentId: sub.student._id,
          studentName: sub.student.name,
          studentEmail: sub.student.email,
          draftedAt: sub.draftedAt,
          content: sub.content ? sub.content.substring(0, 100) + '...' : 'No content'
        })),
        draftCount: draftSubmissions.length
      };
    });

    res.json({
      success: true,
      data: {
        totalTasks: formattedTasks.length,
        totalDraftSubmissions: formattedTasks.reduce((sum, task) => sum + task.draftCount, 0),
        tasks: formattedTasks
      }
    });
  } catch (error) {
    console.error('Error getting pending auto-submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending auto-submissions',
      error: error.message
    });
  }
};

/**
 * Get auto-submission history for a specific task
 * GET /api/auto-submission/history/:taskId
 * Admin or Teacher only
 */
const getAutoSubmissionHistory = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is required'
      });
    }

    const task = await Task.findById(taskId)
      .populate('classroom', 'name')
      .populate('teacher', 'name')
      .populate('submissions.student', 'name email')
      .select('title deadline classroom teacher submissions');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has permission to view this task
    const isAdmin = req.user.role === 'admin';
    const isTeacher = req.user.role === 'teacher' && task.teacher._id.toString() === req.user._id.toString();
    
    if (!isAdmin && !isTeacher) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const autoSubmittedSubmissions = task.submissions.filter(sub => sub.isAutoSubmitted);
    
    const history = {
      taskId: task._id,
      title: task.title,
      deadline: task.deadline,
      classroom: {
        id: task.classroom._id,
        name: task.classroom.name
      },
      teacher: {
        id: task.teacher._id,
        name: task.teacher.name
      },
      autoSubmittedSubmissions: autoSubmittedSubmissions.map(sub => ({
        studentId: sub.student._id,
        studentName: sub.student.name,
        studentEmail: sub.student.email,
        autoSubmittedAt: sub.autoSubmittedAt,
        submittedAt: sub.submittedAt,
        content: sub.content ? sub.content.substring(0, 100) + '...' : 'No content'
      })),
      totalAutoSubmitted: autoSubmittedSubmissions.length
    };

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error getting auto-submission history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get auto-submission history',
      error: error.message
    });
  }
};

module.exports = {
  getAutoSubmissionStats,
  triggerAutoSubmission,
  triggerAutoSubmissionForTask,
  getPendingAutoSubmissions,
  getAutoSubmissionHistory
};
