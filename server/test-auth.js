const mongoose = require('mongoose');
const Task = require('./models/Task');
const File = require('./models/File');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/classroom_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testAuth() {
  try {
    console.log('Testing authentication and file access...');
    
    // Get a task
    const task = await Task.findById('689c5ebf164a825c656200cb').populate('teacher', 'name').populate('classroom');
    console.log('Task found:', {
      id: task._id,
      title: task.title,
      teacher: task.teacher,
      submissions: task.submissions?.length || 0
    });

    // Get files for this task
    const files = await File.find({ taskId: task._id });
    console.log('Files found:', files.length);
    files.forEach(f => {
      console.log('- File:', {
        id: f._id,
        filename: f.filename,
        originalName: f.originalName,
        fileType: f.fileType,
        uploadedBy: f.uploadedBy
      });
    });

    // Get a teacher user
    const teacher = await User.findOne({ role: 'teacher' });
    console.log('Teacher found:', {
      id: teacher._id,
      name: teacher.name,
      role: teacher.role
    });

    // Test authentication logic
    const isTeacher = teacher.role === 'teacher' && task.teacher._id.toString() === teacher._id.toString();
    console.log('Teacher authentication test:', {
      teacherRole: teacher.role,
      taskTeacherId: task.teacher._id.toString(),
      teacherId: teacher._id.toString(),
      isTeacher
    });

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testAuth();
