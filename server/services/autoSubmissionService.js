const Task = require('../models/Task');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendTaskSubmissionEmail, sendAutoSubmissionNotificationEmail } = require('./emailService');

class AutoSubmissionService {
  constructor() {
    this.isProcessing = false;
  }

  /**
   * Process auto-submissions for all tasks with passed deadlines
   * This method should be called by the cron job
   */
  async processAutoSubmissions() {
    if (this.isProcessing) {
      console.log('Auto-submission already in progress, skipping...');
      return;
    }

    this.isProcessing = true;
    console.log('Starting auto-submission process...');

    try {
      const now = new Date();
      
      // Find all active tasks with deadlines that have passed
      const tasksWithPassedDeadlines = await Task.find({
        isActive: true,
        status: 'active',
        deadline: { $lt: now },
        'submissions.status': 'draft'
      }).populate('classroom', 'name students')
        .populate('teacher', 'name email')
        .populate('submissions.student', 'name email');

      console.log(`Found ${tasksWithPassedDeadlines.length} tasks with passed deadlines`);

      let totalAutoSubmitted = 0;
      const results = [];

      for (const task of tasksWithPassedDeadlines) {
        try {
          const result = await this.processTaskAutoSubmissions(task);
          results.push(result);
          totalAutoSubmitted += result.autoSubmittedCount;
        } catch (error) {
          console.error(`Error processing auto-submission for task ${task._id}:`, error);
          results.push({
            taskId: task._id,
            taskTitle: task.title,
            error: error.message,
            autoSubmittedCount: 0
          });
        }
      }

      console.log(`Auto-submission process completed. Total auto-submitted: ${totalAutoSubmitted}`);
      
      return {
        success: true,
        totalTasks: tasksWithPassedDeadlines.length,
        totalAutoSubmitted,
        results
      };

    } catch (error) {
      console.error('Error in auto-submission process:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process auto-submissions for a specific task
   * @param {Object} task - The task object with populated fields
   */
  async processTaskAutoSubmissions(task) {
    const now = new Date();
    const autoSubmittedStudents = [];
    const errors = [];

    console.log(`Processing auto-submissions for task: ${task.title} (ID: ${task._id})`);

    // Find all draft submissions for this task
    const draftSubmissions = task.submissions.filter(sub => sub.status === 'draft');
    
    console.log(`Found ${draftSubmissions.length} draft submissions for task ${task._id}`);

    for (const submission of draftSubmissions) {
      try {
        // Update submission status to submitted
        submission.status = 'submitted';
        submission.submittedAt = now;
        submission.updatedAt = now;

        // Add auto-submission flag
        submission.isAutoSubmitted = true;
        submission.autoSubmittedAt = now;

        autoSubmittedStudents.push({
          studentId: submission.student._id,
          studentName: submission.student.name,
          studentEmail: submission.student.email
        });

        console.log(`Auto-submitted for student: ${submission.student.name} (${submission.student.email})`);

      } catch (error) {
        console.error(`Error auto-submitting for student ${submission.student._id}:`, error);
        errors.push({
          studentId: submission.student._id,
          studentName: submission.student.name,
          error: error.message
        });
      }
    }

    // Save the task with updated submissions
    if (autoSubmittedStudents.length > 0) {
      await task.save();
      console.log(`Saved ${autoSubmittedStudents.length} auto-submissions for task ${task._id}`);

      // Send notifications to teacher
      await this.sendAutoSubmissionNotifications(task, autoSubmittedStudents);
    }

    return {
      taskId: task._id,
      taskTitle: task.title,
      autoSubmittedCount: autoSubmittedStudents.length,
      autoSubmittedStudents,
      errors
    };
  }

  /**
   * Send notifications for auto-submitted tasks
   * @param {Object} task - The task object
   * @param {Array} autoSubmittedStudents - Array of auto-submitted students
   */
  async sendAutoSubmissionNotifications(task, autoSubmittedStudents) {
    try {
      // Create notification for teacher
      const notification = new Notification({
        recipient: task.teacher._id,
        sender: null, // System notification
        type: 'auto_submission',
        title: 'Auto-Submission Completed',
        message: `${autoSubmittedStudents.length} student(s) had their draft submissions automatically submitted for "${task.title}"`,
        data: {
          classroomId: task.classroom._id,
          taskId: task._id,
          autoSubmittedCount: autoSubmittedStudents.length,
          autoSubmittedStudents: autoSubmittedStudents.map(s => ({
            id: s.studentId,
            name: s.studentName
          }))
        }
      });

      await notification.save();
      console.log(`Created notification for teacher ${task.teacher.name}`);

      // Send email notification to teacher
      try {
        await sendTaskSubmissionEmail(
          task.teacher.email,
          task.teacher.name,
          `System (${autoSubmittedStudents.length} students)`,
          task.title,
          true // isAutoSubmission flag
        );
        console.log(`Sent email notification to teacher ${task.teacher.email}`);
      } catch (emailError) {
        console.error('Failed to send email notification to teacher:', emailError);
      }

      // Create notifications and send emails for students
      for (const student of autoSubmittedStudents) {
        try {
          const studentNotification = new Notification({
            recipient: student.studentId,
            sender: null, // System notification
            type: 'auto_submission',
            title: 'Task Auto-Submitted',
            message: `Your draft submission for "${task.title}" has been automatically submitted due to the deadline.`,
            data: {
              classroomId: task.classroom._id,
              taskId: task._id,
              isAutoSubmitted: true
            }
          });

          await studentNotification.save();
          console.log(`Created notification for student ${student.studentName}`);

          // Send email notification to student
          try {
            await sendAutoSubmissionNotificationEmail(
              student.studentEmail,
              student.studentName,
              task.title,
              task.classroom.name
            );
            console.log(`Sent email notification to student ${student.studentEmail}`);
          } catch (emailError) {
            console.error(`Failed to send email notification to student ${student.studentEmail}:`, emailError);
          }

        } catch (error) {
          console.error(`Failed to create notification for student ${student.studentId}:`, error);
        }
      }

    } catch (error) {
      console.error('Error sending auto-submission notifications:', error);
    }
  }

  /**
   * Get statistics about auto-submissions
   */
  async getAutoSubmissionStats() {
    try {
      const now = new Date();
      
      // Count tasks with auto-submitted submissions
      const tasksWithAutoSubmissions = await Task.aggregate([
        {
          $match: {
            'submissions.isAutoSubmitted': true
          }
        },
        {
          $project: {
            title: 1,
            deadline: 1,
            autoSubmittedCount: {
              $size: {
                $filter: {
                  input: '$submissions',
                  cond: { $eq: ['$$this.isAutoSubmitted', true] }
                }
              }
            }
          }
        }
      ]);

      const totalAutoSubmissions = tasksWithAutoSubmissions.reduce(
        (sum, task) => sum + task.autoSubmittedCount, 0
      );

      return {
        totalTasksWithAutoSubmissions: tasksWithAutoSubmissions.length,
        totalAutoSubmissions,
        tasksWithAutoSubmissions
      };

    } catch (error) {
      console.error('Error getting auto-submission stats:', error);
      throw error;
    }
  }

  /**
   * Manually trigger auto-submission for a specific task (for testing)
   * @param {string} taskId - The task ID
   */
  async triggerAutoSubmissionForTask(taskId) {
    try {
      const task = await Task.findById(taskId)
        .populate('classroom', 'name students')
        .populate('teacher', 'name email')
        .populate('submissions.student', 'name email');

      if (!task) {
        throw new Error('Task not found');
      }

      if (!task.deadline) {
        throw new Error('Task has no deadline set');
      }

      const result = await this.processTaskAutoSubmissions(task);
      return result;

    } catch (error) {
      console.error(`Error triggering auto-submission for task ${taskId}:`, error);
      throw error;
    }
  }
}

module.exports = new AutoSubmissionService();
