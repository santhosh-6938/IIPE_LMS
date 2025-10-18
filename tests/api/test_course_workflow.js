const axios = require('axios');
const mongoose = require('mongoose');
const Course = require('../../server/models/Course');

const API_URL = 'http://localhost:3001/api';

// Test data
const testAdmin = {
  email: 'admin@test.com',
  password: 'admin123'
};

const testTeacher = {
  email: 'teacher@test.com',
  password: 'teacher123'
};

let adminToken = '';
let teacherToken = '';

describe('Course Workflow Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iip_lms_test');
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Clear courses collection
    await Course.deleteMany({});
  });

  describe('Authentication', () => {
    test('Admin login', async () => {
      const response = await axios.post(`${API_URL}/auth/login`, testAdmin);
      expect(response.status).toBe(200);
      expect(response.data.token).toBeDefined();
      adminToken = response.data.token;
    });

    test('Teacher login', async () => {
      const response = await axios.post(`${API_URL}/auth/login`, testTeacher);
      expect(response.status).toBe(200);
      expect(response.data.token).toBeDefined();
      teacherToken = response.data.token;
    });
  });

  describe('Course Management', () => {
    test('Create course as admin', async () => {
      const courseData = {
        courseCode: '1001',
        subject: 'Test Course',
        program: 'B.Tech',
        branch: 'cse',
        semester: 'Autumn',
        credits: 3,
        description: 'Test course description'
      };

      const response = await axios.post(`${API_URL}/courses`, courseData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.course.courseCode).toBe('1001');
      expect(response.data.course.isAvailableForNextSemester).toBe(true);
    });

    test('Get courses with filtering', async () => {
      // Create test courses
      await Course.create([
        {
          courseCode: '1001',
          subject: 'CSE Course 1',
          program: 'B.Tech',
          branch: 'cse',
          semester: 'Autumn',
          credits: 3
        },
        {
          courseCode: '2001',
          subject: 'ECE Course 1',
          program: 'B.Tech',
          branch: 'ece',
          semester: 'Spring',
          credits: 4
        }
      ]);

      const response = await axios.get(`${API_URL}/courses?program=B.Tech&branch=cse`, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.courses).toHaveLength(1);
      expect(response.data.courses[0].courseCode).toBe('1001');
    });

    test('Flag course as unavailable', async () => {
      const course = await Course.create({
        courseCode: '1001',
        subject: 'Test Course',
        program: 'B.Tech',
        branch: 'cse',
        semester: 'Autumn',
        credits: 3
      });

      const response = await axios.put(`${API_URL}/courses/${course.courseCode}/availability`, {
        isAvailableForNextSemester: false,
        reason: 'Course under revision'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.course.isAvailableForNextSemester).toBe(false);

      // Verify in database
      const updatedCourse = await Course.findOne({ courseCode: '1001' });
      expect(updatedCourse.isAvailableForNextSemester).toBe(false);
      expect(updatedCourse.flagHistory).toHaveLength(1);
    });

    test('Bulk flag courses', async () => {
      // Create test courses
      await Course.create([
        {
          courseCode: '1001',
          subject: 'Course 1',
          program: 'B.Tech',
          branch: 'cse',
          semester: 'Autumn',
          credits: 3
        },
        {
          courseCode: '1002',
          subject: 'Course 2',
          program: 'B.Tech',
          branch: 'cse',
          semester: 'Spring',
          credits: 4
        }
      ]);

      const response = await axios.put(`${API_URL}/courses/bulk-availability`, {
        courseCodes: ['1001', '1002'],
        isAvailableForNextSemester: false,
        reason: 'Bulk flag for semester end'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.results).toHaveLength(2);
      expect(response.data.results.every(r => r.success)).toBe(true);
    });
  });

  describe('Program and Branch Filtering', () => {
    test('Get branches for program', async () => {
      const response = await axios.get(`${API_URL}/programs/B.Tech/branches`, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.branches).toContain('cse');
      expect(response.data.branches).toContain('ece');
    });

    test('Get sections for branch', async () => {
      const response = await axios.get(`${API_URL}/programs/B.Tech/branches/cse/sections`, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.sections).toContain('a');
      expect(response.data.sections).toContain('b');
    });

    test('Get available courses for branch and semester', async () => {
      // Create test courses
      await Course.create([
        {
          courseCode: '1001',
          subject: 'Available Course',
          program: 'B.Tech',
          branch: 'cse',
          semester: 'Autumn',
          credits: 3,
          isAvailableForNextSemester: true
        },
        {
          courseCode: '1002',
          subject: 'Flagged Course',
          program: 'B.Tech',
          branch: 'cse',
          semester: 'Autumn',
          credits: 3,
          isAvailableForNextSemester: false
        }
      ]);

      const response = await axios.get(`${API_URL}/programs/B.Tech/branches/cse/courses?semester=Autumn`, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.courses).toHaveLength(1);
      expect(response.data.courses[0].courseCode).toBe('1001');
    });
  });

  describe('Course Code to Subject Mapping', () => {
    test('Get subject by course code', async () => {
      await Course.create({
        courseCode: '1001',
        subject: 'Data Structures',
        program: 'B.Tech',
        branch: 'cse',
        semester: 'Autumn',
        credits: 3
      });

      const response = await axios.get(`${API_URL}/courses/subject/1001`, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.subject).toBe('Data Structures');
      expect(response.data.program).toBe('B.Tech');
      expect(response.data.branch).toBe('cse');
    });

    test('Course not found for invalid code', async () => {
      const response = await axios.get(`${API_URL}/courses/subject/9999`, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });

      expect(response.status).toBe(404);
    });

    test('Flagged course returns availability status', async () => {
      await Course.create({
        courseCode: '1001',
        subject: 'Flagged Course',
        program: 'B.Tech',
        branch: 'cse',
        semester: 'Autumn',
        credits: 3,
        isAvailableForNextSemester: false
      });

      const response = await axios.get(`${API_URL}/courses/subject/1001`, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.isAvailableForNextSemester).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('Invalid course code format', async () => {
      const response = await axios.post(`${API_URL}/courses`, {
        courseCode: '123', // Invalid - should be 4 digits
        subject: 'Test Course',
        program: 'B.Tech',
        branch: 'cse',
        semester: 'Autumn',
        credits: 3
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(400);
    });

    test('Duplicate course code', async () => {
      await Course.create({
        courseCode: '1001',
        subject: 'Existing Course',
        program: 'B.Tech',
        branch: 'cse',
        semester: 'Autumn',
        credits: 3
      });

      const response = await axios.post(`${API_URL}/courses`, {
        courseCode: '1001', // Duplicate
        subject: 'New Course',
        program: 'B.Tech',
        branch: 'cse',
        semester: 'Autumn',
        credits: 3
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(400);
    });

    test('Unauthorized access to admin functions', async () => {
      const response = await axios.post(`${API_URL}/courses`, {
        courseCode: '1001',
        subject: 'Test Course',
        program: 'B.Tech',
        branch: 'cse',
        semester: 'Autumn',
        credits: 3
      }, {
        headers: { Authorization: `Bearer ${teacherToken}` } // Teacher trying admin function
      });

      expect(response.status).toBe(403);
    });

    test('Invalid program/branch combination', async () => {
      const response = await axios.get(`${API_URL}/programs/InvalidProgram/branches`, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });

      expect(response.status).toBe(404);
    });

    test('Empty course codes in bulk operation', async () => {
      const response = await axios.put(`${API_URL}/courses/bulk-availability`, {
        courseCodes: [],
        isAvailableForNextSemester: false
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Flag History Tracking', () => {
    test('Flag history is properly recorded', async () => {
      const course = await Course.create({
        courseCode: '1001',
        subject: 'Test Course',
        program: 'B.Tech',
        branch: 'cse',
        semester: 'Autumn',
        credits: 3
      });

      // Flag the course
      await axios.put(`${API_URL}/courses/${course.courseCode}/availability`, {
        isAvailableForNextSemester: false,
        reason: 'First flag'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      // Unflag the course
      await axios.put(`${API_URL}/courses/${course.courseCode}/availability`, {
        isAvailableForNextSemester: true,
        reason: 'Unflag'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      const response = await axios.get(`${API_URL}/courses/${course.courseCode}/flag-history`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.flagHistory).toHaveLength(2);
      expect(response.data.flagHistory[0].action).toBe('flagged');
      expect(response.data.flagHistory[1].action).toBe('unflagged');
    });
  });
});

module.exports = {
  testAdmin,
  testTeacher
};
