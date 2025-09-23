const Problem = require('../models/Problem');
const TestCase = require('../models/TestCase');
const Submission = require('../models/Submission');
const compilerService = require('../services/compilerService');

// Utility to execute one test
async function executeOneTest(language, code, input, expected, timeoutMs) {
  const started = Date.now();
  const result = await compilerService.compileAndRun(language, code, input, 'main');
  const runtimeMs = Date.now() - started;
  const output = (result && result.output) ? result.output.trim() : '';
  const expectedTrim = (expected || '').trim();
  const passed = output === expectedTrim;
  return { output, expectedOutput: expectedTrim, passed, runtimeMs, error: (result && result.error) ? result.error : '' };
}

// Teachers/Admin: create problem
const createProblem = async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { title, slug, statement, constraints, difficulty, allowedLanguages, samples, defaultTemplates, classroom } = req.body;
    const exists = await Problem.findOne({ slug });
    if (exists) return res.status(400).json({ message: 'Slug already exists' });

    const problem = new Problem({
      title, slug, statement, constraints: constraints || '', difficulty: difficulty || 'easy',
      allowedLanguages: allowedLanguages && allowedLanguages.length ? allowedLanguages : Object.keys(compilerService.supportedLanguages),
      samples: samples || [],
      defaultTemplates: defaultTemplates || {},
      classroom: classroom || null,
      createdBy: req.user._id
    });
    await problem.save();
    return res.status(201).json({ problem });
  } catch (e) {
    console.error('createProblem error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Teachers/Admin: add test cases (hidden by default)
const addTestCases = async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { id } = req.params;
    const { cases } = req.body; // [{ input, expectedOutput, isHidden, pointWeight }]
    const problem = await Problem.findById(id);
    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    const docs = (cases || []).map(tc => ({
      problem: problem._id,
      isHidden: tc.isHidden !== false,
      input: tc.input || '',
      expectedOutput: tc.expectedOutput || '',
      pointWeight: tc.pointWeight || 1,
      timeoutMs: tc.timeoutMs || 5000
    }));
    const inserted = await TestCase.insertMany(docs);

    // update hidden count
    const hiddenCount = await TestCase.countDocuments({ problem: problem._id, isHidden: true });
    problem.hiddenTestCount = hiddenCount;
    await problem.save();

    return res.json({ added: inserted.length });
  } catch (e) {
    console.error('addTestCases error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Public: get problem (visible samples only)
const getProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const problem = await Problem.findById(id).lean();
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    return res.json({ problem });
  } catch (e) {
    console.error('getProblem error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Student: run on visible samples
const runSamples = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Students only' });
    }
    const { id } = req.params;
    const { language, code } = req.body;
    const problem = await Problem.findById(id).lean();
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    if (problem.allowedLanguages && problem.allowedLanguages.length && !problem.allowedLanguages.includes(language)) {
      return res.status(400).json({ message: 'Language not allowed for this problem' });
    }

    const results = [];
    for (const sample of problem.samples || []) {
      const exec = await executeOneTest(language, code, sample.input || '', sample.expectedOutput || '', 5000);
      results.push({ ...exec, isHidden: false });
    }
    const passedAll = results.every(r => r.passed);
    return res.json({ passedAll, results });
  } catch (e) {
    console.error('runSamples error:', e);
    return res.status(500).json({ message: e.message || 'Server error' });
  }
};

// Student: submit against hidden tests
const submitSolution = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Students only' });
    }
    const { id } = req.params;
    const { language, code } = req.body;

    const problem = await Problem.findById(id).lean();
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    if (problem.allowedLanguages && problem.allowedLanguages.length && !problem.allowedLanguages.includes(language)) {
      return res.status(400).json({ message: 'Language not allowed for this problem' });
    }

    const tests = await TestCase.find({ problem: id }).lean();

    let totalPoints = 0;
    let score = 0;
    const testResults = [];

    for (const tc of tests) {
      totalPoints += tc.pointWeight || 1;
      const exec = await executeOneTest(language, code, tc.input || '', tc.expectedOutput || '', tc.timeoutMs || 5000);
      const passed = exec.passed;
      if (passed) score += tc.pointWeight || 1;
      testResults.push({
        testCase: tc._id,
        isHidden: !!tc.isHidden,
        passed,
        output: tc.isHidden ? '' : exec.output,
        expectedOutput: tc.isHidden ? '' : exec.expectedOutput,
        runtimeMs: exec.runtimeMs,
        error: exec.error
      });
    }

    const status = score === totalPoints ? 'success' : 'failed';

    const submission = new Submission({
      problem: id,
      student: req.user._id,
      language,
      code,
      status,
      score,
      totalPoints,
      testResults
    });
    await submission.save();

    return res.json({
      status,
      score,
      totalPoints,
      submissionId: submission._id
    });
  } catch (e) {
    console.error('submitSolution error:', e);
    return res.status(500).json({ message: e.message || 'Server error' });
  }
};

// Student: list my submissions (optional filter by problem)
const listMySubmissions = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Students only' });
    }
    const { problem } = req.query;
    const filter = { student: req.user._id };
    if (problem) filter.problem = problem;
    const items = await Submission.find(filter)
      .sort({ createdAt: -1 })
      .select('problem language status score totalPoints createdAt')
      .populate('problem', 'title slug')
      .lean();
    return res.json({ items });
  } catch (e) {
    console.error('listMySubmissions error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createProblem,
  addTestCases,
  getProblem,
  runSamples,
  submitSolution,
  listMySubmissions
};
