# Bulk Import Students Feature

## Overview
The bulk import feature allows teachers to upload an Excel file containing student information and automatically add them to their classroom. This feature can create new student accounts or add existing students to the classroom.

## How to Use

### 1. Access the Feature
- Navigate to your classroom
- Go to the "Student Management" section
- Click the green "Bulk Import" button

### 2. Prepare Your Excel File
Your Excel file must have the following format:

| Name | Email |
|------|-------|
| John Doe | john.doe@example.com |
| Jane Smith | jane.smith@example.com |
| Mike Johnson | mike.johnson@example.com |

**Requirements:**
- **Header Row**: Must contain "Name" and "Email" columns
- **File Format**: .xlsx or .xls files
- **File Size**: Maximum 5MB
- **Email Format**: Valid email addresses required

### 3. Upload Process
1. Click "Download Template" to get a sample file
2. Fill in your student data in the template
3. Save the file as .xlsx format
4. Click "Upload Excel File" and select your file
5. Click "Upload and Import"

### 4. Results
The system will show you:
- **Total rows processed**: Number of rows in your file
- **New students created**: Students with new accounts
- **Existing students added**: Students already in the system
- **Already in classroom**: Students already in this classroom
- **Errors**: Any issues with specific rows

## Sample Files

### CSV Template (sample_student_import.csv)
```
Name,Email
John Doe,john.doe@example.com
Jane Smith,jane.smith@example.com
Mike Johnson,mike.johnson@example.com
Sarah Wilson,sarah.wilson@example.com
David Brown,david.brown@example.com
Emily Davis,emily.davis@example.com
Michael Garcia,michael.garcia@example.com
Lisa Martinez,lisa.martinez@example.com
Robert Anderson,robert.anderson@example.com
Jennifer Taylor,jennifer.taylor@example.com
```

### HTML Template Generator
Open `generate_excel_template.html` in your browser to download a template file.

## Features

### Automatic Account Creation
- New students get auto-generated passwords
- Accounts are created with "student" role
- Email notifications are sent (if configured)

### Duplicate Handling
- Existing students are added to the classroom
- Students already in the classroom are skipped
- No duplicate accounts are created

### Error Handling
- Invalid email formats are flagged
- Missing required fields are reported
- Detailed error messages for each row

### Notifications
- Students receive in-app notifications
- Email notifications are sent (if email service is configured)
- Teachers see success/error messages

## Technical Details

### API Endpoint
```
POST /api/classrooms/:classroomId/students/bulk-import
```

### File Processing
- Uses XLSX library for Excel parsing
- Supports .xlsx and .xls formats
- Validates file structure and data
- Processes rows sequentially

### Security
- Teacher authentication required
- Classroom ownership verification
- File size and type validation
- Input sanitization

## Troubleshooting

### Common Issues
1. **"Missing required columns"**: Ensure your file has "Name" and "Email" headers
2. **"Invalid email format"**: Check email addresses for proper format
3. **"File too large"**: Reduce file size to under 5MB
4. **"No students imported"**: Check if all students are already in the classroom

### Best Practices
1. Use the provided template
2. Validate email addresses before uploading
3. Test with a small file first
4. Check the results summary carefully
5. Keep backup of your original data

## Support
If you encounter issues:
1. Check the error messages in the results
2. Verify your file format matches the template
3. Ensure all required fields are filled
4. Contact support if problems persist
