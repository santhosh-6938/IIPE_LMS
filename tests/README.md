# Tests Directory

This directory contains test files for the education platform.

## Structure

```
tests/
├── api/                    # API integration tests
│   ├── test_submission_status.js    # Tests submission status functionality
│   └── test_bulk_import.js          # Tests bulk import functionality
└── README.md              # This file
```

## Running Tests

### API Tests

To run the submission status test:
```bash
cd tests/api
node test_submission_status.js
```

To run the bulk import test:
```bash
cd tests/api
node test_bulk_import.js
```

## Test Requirements

- Server must be running on `http://localhost:8000`
- Client must be running (for full integration tests)
- Test user accounts must exist in the database

## Test Data

The tests use the following test accounts:
- Student: `student@test.com` / `password123`
- Teacher: `teacher@test.com` / `password123`

Make sure these accounts exist before running tests.

## What Tests Cover

### Submission Status Test
- ✅ Login functionality
- ✅ Task fetching
- ✅ Submission status checking
- ✅ Task submission
- ✅ Prevention of duplicate submissions
- ✅ Real-time status updates
- ✅ Task list accuracy

### Bulk Import Test
- ✅ Teacher login
- ✅ Bulk student import
- ✅ Classroom management
- ✅ Data validation
