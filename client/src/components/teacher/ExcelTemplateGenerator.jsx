import React from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

const ExcelTemplateGenerator = ({ classroom }) => {
  const generateTemplate = () => {
    // Create sample data
    const sampleData = [
      { 'Name': 'John Doe', 'Email ID': 'john.doe@example.com', 'Roll Number': 'CS2024001', 'Marks': 85 },
      { 'Name': 'Jane Smith', 'Email ID': 'jane.smith@example.com', 'Roll Number': 'CS2024002', 'Marks': 92 },
      { 'Name': 'Bob Johnson', 'Email ID': 'bob.johnson@example.com', 'Roll Number': 'CS2024003', 'Marks': 78 }
    ];

    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Create a worksheet from the data
    const ws = XLSX.utils.json_to_sheet(sampleData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // Name
      { wch: 25 }, // Email ID
      { wch: 15 }, // Roll Number
      { wch: 10 }  // Marks
    ];

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Marks Template');
    
    // Generate filename
    const filename = `Mid_Term_Marks_Template_${classroom?.name?.replace(/\s+/g, '_') || 'Classroom'}.xlsx`;
    
    // Save the file
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <div className="flex items-center space-x-3">
        <FileSpreadsheet className="w-6 h-6 text-blue-600" />
        <div className="flex-1">
          <h4 className="font-medium text-blue-900 mb-1">Excel Template</h4>
          <p className="text-sm text-blue-800">
            Download a sample Excel template to see the required format for uploading marks.
          </p>
        </div>
        <button
          onClick={generateTemplate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Download Template</span>
        </button>
      </div>
      
      <div className="mt-3 text-xs text-blue-700">
        <p><strong>Required columns:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Name - Student's full name</li>
          <li>Email ID - Student's email address</li>
          <li>Roll Number - Student's roll number</li>
          <li>Marks - Marks out of 100</li>
        </ul>
      </div>
    </div>
  );
};

export default ExcelTemplateGenerator;
