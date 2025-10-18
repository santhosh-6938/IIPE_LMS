const axios = require('axios');
const mongoose = require('mongoose');
const Course = require('../../server/models/Course');
const Classroom = require('../../server/models/Classroom');
const User = require('../../server/models/User');

const API_URL = 'http://localhost:3001/api';

// Test data
const testTeacher = {
  name: 'Test Teacher',
  email: 'teacher@test.com',
  password: 'teacher123',
  role: 'teacher'
};

let teacherToken = '';
let teacherId = '';

describe('Subject Auto-Fetch and Display Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iip_lms_test');
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Clear collections
    await Course.deleteMany({});
    await Classroom.deleteMany({});
    await User.deleteMany({});
  });

  describe('Setup', () => {
    test('Create test teacher', async () => {
      const user = new User(testTeacher);
      await user.save();
      teacherId = user._id;
    });

    test('Teacher login', async () => {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: testTeacher.email,
        password: testTeacher.password
      });
      expect(response.status).toBe(200);
      expect(response.data.token).toBeDefined();
      teacherToken = response.data.token;
    });

    test('Create test course', async () => {
      const course = new Course({
        courseCode: '1001',
        subject: 'Data Structures and Algorithms',
        program: 'B.Tech',
        branch: 'cse',
        semester: 'Autumn',
        credits: 4,
        description: 'Introduction to data structures and algorithms'
      });
      await course.save();
    });
  });

  describe('Subject Auto-Fetch During Classroom Creation', () => {
    test('Auto-fetch subject when course code is entered', async () => {
      const response = await axios.get(`${API_URL}/courses/subject/1001`, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.subject).toBe('Data Structures and Algorithms');
      expect(response.data.courseCode).toBe('1001');
      expect(response.data.program).toBe('B.Tech');
      expect(response.data.branch).toBe('cse');
    });

    test('Create classroom with auto-fetched subject', async () => {
      const classroomData = {
        name: 'Test Classroom',
        description: 'Test classroom description',
        subject: 'Data Structures and Algorithms', // This should be auto-fetched
        semester: 'Autumn',
        academicYear: '2024-2025',
        program: 'B.Tech',
        branch: 'cse',
        courseCode: '1001',
        section: 'a',
        startMonth: 8,
        endMonth: 12
      };

      const response = await axios.post(`${API_URL}/classrooms`, classroomData, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.subject).toBe('Data Structures and Algorithms');
      expect(response.data.courseCode).toBe('1001');
      expect(response.data.courseId).toBe('1001_0_cse_a_2425');
    });

    test('Create classroom without subject - should auto-fetch from course code', async () => {
      const classroomData = {
        name: 'Test Classroom 2',
        description: 'Test classroom without subject',
        // subject not provided - should be auto-fetched
        semester: 'Autumn',
        academicYear: '2024-2025',
        program: 'B.Tech',
        branch: 'cse',
        courseCode: '1001',
        section: 'b',
        startMonth: 8,
        endMonth: 12
      };

      const response = await axios.post(`${API_URL}/classrooms`, classroomData, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.subject).toBe('Data Structures and Algorithms');
      expect(response.data.courseCode).toBe('1001');
    });

    test('Handle invalid course code gracefully', async () => {
      const response = await axios.get(`${API_URL}/courses/subject/9999`, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });

      expect(response.status).toBe(404);
    });

    test('Create classroom with invalid course code - should not auto-fetch subject', async () => {
      const classroomData = {
        name: 'Test Classroom 3',
        description: 'Test classroom with invalid course code',
        semester: 'Autumn',
        academicYear: '2024-2025',
        program: 'B.Tech',
        branch: 'cse',
        courseCode: '9999', // Invalid course code
        section: 'c',
        startMonth: 8,
        endMonth: 12
      };

      const response = await axios.post(`${API_URL}/classrooms`, classroomData, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.subject).toBeUndefined(); // No subject auto-fetched
      expect(response.data.courseCode).toBe('9999');
    });
  });

  describe('Subject Display in Classroom Overview', () => {
    let classroomId = '';

    beforeEach(async () => {
      // Create a classroom with subject
      const classroom = new Classroom({
        name: 'Display Test Classroom',
        description: 'Test classroom for display',
        subject: 'Data Structures and Algorithms',
        semester: 'Autumn',
        academicYear: '2024-2025',
        program: 'B.Tech',
        branch: 'cse',
        courseCode: '1001',
        section: 'a',
        startMonth: 8,
        endMonth: 12,
        teacher: teacherId
      });
      await classroom.save();
      classroomId = classroom._id;
    });

    test('Get classroom details - subject should be included', async () => {
      const response = await axios.get(`${API_URL}/classrooms/${classroomId}`, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.subject).toBe('Data Structures and Algorithms');
      expect(response.data.courseCode).toBe('1001');
      expect(response.data.name).toBe('Display Test Classroom');
    });

    test('Get teacher classrooms - subject should be included', async () => {
      const response = await axios.get(`${API_URL}/classrooms`, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThan(0);
      
      const classroom = response.data.find(c => c._id === classroomId);
      expect(classroom).toBeDefined();
      expect(classroom.subject).toBe('Data Structures and Algorithms');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('Course code with special characters', async () => {
      const response = await axios.get(`${API_URL}/courses/subject/1001%20`, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });

      expect(response.status).toBe(404); // Should not find course with spaces
    });

    test('Empty course code', async () => {
      const response = await axios.get(`${API_URL}/courses/subject/`, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });

      expect(response.status).toBe(404);
    });

    test('Course code with wrong length', async () => {
      const response = await axios.get(`${API_URL}/courses/subject/123`, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });

      expect(response.status).toBe(404);
    });

    test('Network error handling', async () => {
      // Test with invalid API URL to simulate network error
      try {
        await axios.get('http://invalid-url/courses/subject/1001', {
          headers: { Authorization: `Bearer ${teacherToken}` },
          timeout: 1000
        });
      } catch (error) {
        expect(error.code).toBe('ENOTFOUND');
      }
    });

    test('Unauthorized access', async () => {
      const response = await axios.get(`${API_URL}/courses/subject/1001`);
      expect(response.status).toBe(401);
    });
  });

  describe('Subject Field Validation', () => {
    test('Subject field accepts valid input', async () => {
      const classroomData = {
        name: 'Validation Test Classroom',
        description: 'Test classroom for validation',
        subject: 'Advanced Mathematics with Special Characters!@#$%',
        semester: 'Autumn',
        academicYear: '2024-2025',
        program: 'B.Tech',
        branch: 'cse',
        courseCode: '1001',
        section: 'a',
        startMonth: 8,
        endMonth: 12
      };

      const response = await axios.post(`${API_URL}/classrooms`, classroomData, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.subject).toBe('Advanced Mathematics with Special Characters!@#$%');
    });

    test('Subject field handles empty string', async () => {
      const classroomData = {
        name: 'Empty Subject Test',
        description: 'Test classroom with empty subject',
        subject: '',
        semester: 'Autumn',
        academicYear: '2024-2025',
        program: 'B.Tech',
        branch: 'cse',
        courseCode: '1001',
        section: 'a',
        startMonth: 8,
        endMonth: 12
      };

      const response = await axios.post(`${API_URL}/classrooms`, classroomData, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.subject).toBe('Data Structures and Algorithms'); // Auto-fetched
    });

    test('Subject field handles null value', async () => {
      const classroomData = {
        name: 'Null Subject Test',
        description: 'Test classroom with null subject',
        subject: null,
        semester: 'Autumn',
        academicYear: '2024-2025',
        program: 'B.Tech',
        branch: 'cse',
        courseCode: '1001',
        section: 'a',
        startMonth: 8,
        endMonth: 12
      };

      const response = await axios.post(`${API_URL}/classrooms`, classroomData, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.subject).toBe('Data Structures and Algorithms'); // Auto-fetched
    });
  });

  describe('Performance and Concurrency', () => {
    test('Multiple simultaneous subject fetches', async () => {
      const promises = Array(10).fill().map(() => 
        axios.get(`${API_URL}/courses/subject/1001`, {
          headers: { Authorization: `Bearer ${teacherToken}` }
        })
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data.subject).toBe('Data Structures and Algorithms');
      });
    });

    test('Concurrent classroom creation with same course code', async () => {
      const classroomData = {
        name: 'Concurrent Test Classroom',
        description: 'Test classroom for concurrency',
        semester: 'Autumn',
        academicYear: '2024-2025',
        program: 'B.Tech',
        branch: 'cse',
        courseCode: '1001',
        section: 'a',
        startMonth: 8,
        endMonth: 12
      };

      const promises = Array(3).fill().map((_, index) => 
        axios.post(`${API_URL}/classrooms`, {
          ...classroomData,
          name: `${classroomData.name} ${index + 1}`,
          section: String.fromCharCode(97 + index) // a, b, c
        }, {
          headers: { Authorization: `Bearer ${teacherToken}` }
        })
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.data.subject).toBe('Data Structures and Algorithms');
      });
    });
  });
});

module.exports = {
  testTeacher
};
