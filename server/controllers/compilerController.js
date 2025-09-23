const compilerService = require('../services/compilerService');
const CompiledCode = require('../models/CompiledCode');
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const { logActivity } = require('../middleware/activity');

// Get supported languages
const getLanguages = async (req, res) => {
  try {
    const languages = compilerService.getSupportedLanguages();
    return res.json({ languages });
  } catch (error) {
    console.error('Languages error:', error);
    return res.status(500).json({ message: 'Failed to get languages' });
  }
};

// Get compiler status
const getStatus = async (req, res) => {
  try {
    const status = compilerService.getCompilerStatus();
    return res.json({ status });
  } catch (error) {
    console.error('Status error:', error);
    return res.status(500).json({ message: 'Failed to get compiler status' });
  }
};

// Run code (no save)
const runCode = async (req, res) => {
  try {
    const { language, code, input, filename } = req.body;

    if (!language || !code) {
      return res.status(400).json({ message: 'Language and code are required' });
    }

    const validation = compilerService.validateCode(code, language);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    const languages = compilerService.getSupportedLanguages();
    const langConfig = languages.find(l => l.value === language);
    if (!langConfig) {
      return res.status(400).json({ message: 'Unsupported language' });
    }

    const result = await compilerService.compileAndRun(language, code, input, filename || 'main');
    try { await logActivity(req, 'compiler.run', 'code', '', { language }); } catch {}

    return res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Run error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to run code' });
  }
};

// Compile, run and SAVE code (students only)
const runAndSave = async (req, res) => {
  try {
    const { language, code, input } = req.body;

    // Only students can save code
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can save code' });
    }

    if (!language || !code) {
      return res.status(400).json({ message: 'Language and code are required' });
    }

    const validation = compilerService.validateCode(code, language);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    const languages = compilerService.getSupportedLanguages();
    const langConfig = languages.find(l => l.value === language);
    if (!langConfig) {
      return res.status(400).json({ message: 'Unsupported language' });
    }

    // Compile and run
    const result = await compilerService.compileAndRun(language, code, input, 'main');

    // Save record
    const record = new CompiledCode({
      user: req.user._id,
      language,
      filename: 'main',
      extension: langConfig.extension,
      code,
      input: input || '',
      output: (result && result.output) ? result.output : '',
      error: (result && result.error) ? result.error : ''
    });
    await record.save();
    try { await logActivity(req, 'compiler.runAndSave', 'code', record._id, { language }); } catch {}

    return res.json({
      success: true,
      result,
      saved: {
        id: record._id,
        createdAt: record.createdAt
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Run-and-save error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to run and save code' });
  }
};

// Download code as file
const downloadCode = (req, res) => {
  try {
    const { language, code, filename } = req.body;

    if (!language || !code) {
      return res.status(400).json({ message: 'Language and code are required' });
    }

    const languages = compilerService.getSupportedLanguages();
    const langConfig = languages.find(l => l.value === language);
    if (!langConfig) {
      return res.status(400).json({ message: 'Unsupported language' });
    }

    const fullFilename = `${filename || 'main'}${langConfig.extension}`;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${fullFilename}"`);
    return res.send(code);
  } catch (error) {
    console.error('Download error:', error);
    return res.status(500).json({ message: 'Failed to download code' });
  }
};

// Get code templates
const getTemplates = async (req, res) => {
  try {
    const { language } = req.params;
    const templates = {
      javascript: 'console.log("Hello, World!");',
      python: 'print("Hello, World!")',
      cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
      c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
      java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
      php: '<?php\necho "Hello, World!";\n?>',
      ruby: 'puts "Hello, World!"',
      go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}'
    };

    const template = templates[language] || '// Start coding here';
    return res.json({ template: { code: template } });
  } catch (error) {
    console.error('Template error:', error);
    return res.status(500).json({ message: 'Failed to get template' });
  }
};

// Health check
const healthCheck = async (req, res) => {
  try {
    const { exec } = require('child_process');
    exec('node --version', (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ status: 'error', message: 'Node.js not available' });
      }
      return res.json({ status: 'healthy', nodeVersion: stdout.trim() });
    });
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({ status: 'error', message: 'Health check failed' });
  }
};

// List authenticated user's compiled code history (students only)
const getHistory = async (req, res) => {
  try {
    // Only students can view their own history
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can view their code history' });
    }

    const items = await CompiledCode.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('_id language filename extension createdAt error')
      .lean();
    return res.json({ items });
  } catch (error) {
    console.error('History error:', error);
    return res.status(500).json({ message: 'Failed to get history' });
  }
};

// List student code for a specific classroom (teachers and admins only)
const getAllStudentCode = async (req, res) => {
  try {
    // Only teachers and admins can view all student code
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { classroom: classroomId } = req.query;
    if (!classroomId) {
      return res.status(400).json({ message: 'classroom query parameter is required' });
    }

    const classroom = await Classroom.findById(classroomId).populate('students', '_id name email');
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Teachers can only view their own classroom
    if (req.user.role === 'teacher' && classroom.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const studentIds = classroom.students.map(s => s._id);
    const items = await CompiledCode.find({ user: { $in: studentIds } })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .select('_id language filename extension createdAt error user')
      .lean();

    const itemsWithStudentName = items.map(item => ({
      ...item,
      studentName: item.user ? item.user.name : 'Unknown Student',
      user: undefined
    }));

    return res.json({ items: itemsWithStudentName, classroom: { id: classroom._id, name: classroom.name } });
  } catch (error) {
    console.error('All student code error:', error);
    return res.status(500).json({ message: 'Failed to get student code' });
  }
};

// Get a specific code entry (owner only; teachers/admins must pass classroom and have access)
const getCodeById = async (req, res) => {
  try {
    let item;
    const { classroom: classroomId } = req.query;
    if (req.user.role === 'student') {
      // Students can only view their own code
      item = await CompiledCode.findOne({ _id: req.params.id, user: req.user._id })
        .populate('user', 'name email')
        .lean();
    } else if (req.user.role === 'teacher' || req.user.role === 'admin') {
      if (!classroomId) {
        return res.status(400).json({ message: 'classroom query parameter is required' });
      }
      const classroom = await Classroom.findById(classroomId);
      if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
      if (req.user.role === 'teacher' && classroom.teacher.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
      item = await CompiledCode.findOne({ _id: req.params.id })
        .populate('user', 'name email')
        .lean();
      if (!item) return res.status(404).json({ message: 'Not found' });
      // Ensure the code owner is in the classroom
      const isMember = classroom.students.some(s => s.toString() === (item.user?._id?.toString() || item.user?.toString()));
      if (!isMember) return res.status(403).json({ message: 'Access denied' });
    }

    if (!item) return res.status(404).json({ message: 'Not found' });

    // Add student name for teachers/admins
    if (req.user.role === 'teacher' || req.user.role === 'admin') {
      item.studentName = item.user ? item.user.name : 'Unknown Student';
    }

    return res.json({ item });
  } catch (error) {
    console.error('Get code error:', error);
    return res.status(500).json({ message: 'Failed to get code' });
  }
};

// Download saved code by id (owner only; teachers/admins restricted by classroom)
const downloadCodeById = async (req, res) => {
  try {
    let item;
    const { classroom: classroomId } = req.query;
    if (req.user.role === 'student') {
      // Students can only download their own code
      item = await CompiledCode.findOne({ _id: req.params.id, user: req.user._id }).lean();
    } else if (req.user.role === 'teacher' || req.user.role === 'admin') {
      if (!classroomId) {
        return res.status(400).json({ message: 'classroom query parameter is required' });
      }
      const classroom = await Classroom.findById(classroomId);
      if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
      if (req.user.role === 'teacher' && classroom.teacher.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
      item = await CompiledCode.findOne({ _id: req.params.id, user: { $in: classroom.students } }).lean();
    }

    if (!item) return res.status(404).json({ message: 'Not found' });

    const fullFilename = `${item.filename}${item.extension}`;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${fullFilename}"`);
    return res.send(item.code);
  } catch (error) {
    console.error('Download by id error:', error);
    return res.status(500).json({ message: 'Failed to download code' });
  }
};

module.exports = {
  getLanguages,
  getStatus,
  runCode,
  runAndSave,
  downloadCode,
  getTemplates,
  healthCheck,
  getHistory,
  getAllStudentCode,
  getCodeById,
  downloadCodeById
};
