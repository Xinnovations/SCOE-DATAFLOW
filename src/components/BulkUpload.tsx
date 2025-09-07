import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Student, BRANCHES } from '@/types/student';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Download, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import * as XLSX from 'xlsx';

interface BulkUploadProps {
  onStudentsUploaded: () => void;
}

interface UploadResult {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}

const BulkUpload = ({ onStudentsUploaded }: BulkUploadProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const downloadSampleExcel = () => {
    const sampleData = [
      {
        'Name': 'John Doe',
        'Address': '123 Main St, City, State',
        'Gender': 'Male',
        'Category': 'General',
        'Date of Birth': '1999-05-15',
        'Phone Number': '9876543210',
        'Branch': 'Computer Science Engineering',
        'Year': '1st Year',
        'Mother Name': 'Jane Doe'
      },
      {
        'Name': 'Alice Smith',
        'Address': '456 Oak Ave, Town, State',
        'Gender': 'Female',
        'Category': 'OBC',
        'Date of Birth': '2000-03-22',
        'Phone Number': '9876543211',
        'Branch': 'Information Technology',
        'Year': '2nd Year',
        'Mother Name': 'Mary Smith'
      },
      {
        'Name': 'Bob Johnson',
        'Address': '789 Pine Rd, Village, State',
        'Gender': 'Male',
        'Category': 'SC',
        'Date of Birth': '1998-12-08',
        'Phone Number': '9876543212',
        'Branch': 'Electronics and Communication Engineering',
        'Year': '3rd Year',
        'Mother Name': 'Sarah Johnson'
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    
    // Set column widths for better formatting
    const columnWidths = [
      { wch: 20 }, // Name
      { wch: 35 }, // Address
      { wch: 10 }, // Gender
      { wch: 12 }, // Category
      { wch: 15 }, // Date of Birth
      { wch: 15 }, // Phone Number
      { wch: 40 }, // Branch
      { wch: 12 }, // Year
      { wch: 20 }  // Mother Name
    ];
    worksheet['!cols'] = columnWidths;
    
    // Style the header row
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "366092" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };
    
    // Apply header styling
    const headers = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1'];
    headers.forEach(cell => {
      if (worksheet[cell]) {
        worksheet[cell].s = headerStyle;
      }
    });
    
    // Add data validation and formatting for data rows
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:I4');
    for (let row = 2; row <= range.e.r + 1; row++) {
      for (let col = 0; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row - 1, c: col });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            border: {
              top: { style: "thin", color: { rgb: "CCCCCC" } },
              bottom: { style: "thin", color: { rgb: "CCCCCC" } },
              left: { style: "thin", color: { rgb: "CCCCCC" } },
              right: { style: "thin", color: { rgb: "CCCCCC" } }
            },
            alignment: { vertical: "center", wrapText: true }
          };
        }
      }
    }
    
    // Add instructions sheet
    const instructionsData = [
      ['STUDENT IMPORT TEMPLATE - INSTRUCTIONS'],
      [''],
      ['Required Columns:', 'Valid Values'],
      ['Name', 'Full name (e.g., John Doe)'],
      ['Address', 'Complete address'],
      ['Gender', 'Male or Female'],
      ['Category', 'General, OBC, SC, ST'],
      ['Date of Birth', 'YYYY-MM-DD format (e.g., 1999-05-15)'],
      ['Phone Number', '10-digit number (e.g., 9876543210)'],
      ['Branch', 'See department list below'],
      ['Year', '1st Year, 2nd Year, 3rd Year, 4th Year'],
      ['Mother Name', 'Full name'],
      [''],
      ['Available Departments:'],
      ...BRANCHES.map(branch => [branch])
    ];
    
    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
    instructionsSheet['!cols'] = [{ wch: 30 }, { wch: 50 }];
    
    // Style instructions header
    if (instructionsSheet['A1']) {
      instructionsSheet['A1'].s = {
        font: { bold: true, size: 14, color: { rgb: "366092" } },
        alignment: { horizontal: "center" }
      };
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Data');
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');
    
    XLSX.writeFile(workbook, 'student-import-template.xlsx');
    
    toast({
      title: "Template downloaded",
      description: "Enhanced Excel template with formatting and instructions downloaded",
    });
  };

  const parseFile = async (file: File): Promise<any[]> => {
    if (file.name.endsWith('.xlsx')) {
      // Parse Excel file
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      return data;
    } else {
      // Parse CSV file
      const csvText = await file.text();
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV file must contain headers and at least one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const values = [];
        let current = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        data.push(row);
      }

      return data;
    }
  };

  const validateStudentData = (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const requiredFields = [
      'Name', 'Address', 'Gender', 'Category', 'Date of Birth', 
      'Phone Number', 'Branch', 'Year', 'Mother Name'
    ];

    requiredFields.forEach(field => {
      if (!data[field] || data[field].toString().trim() === '') {
        errors.push(`Missing ${field}`);
      }
    });

    // Validate gender
    if (data.Gender && !['Male', 'Female', 'male', 'female'].includes(data.Gender)) {
      errors.push('Gender must be Male or Female');
    }

    // Validate year
    if (data.Year && !['1st Year', '2nd Year', '3rd Year', '4th Year'].includes(data.Year)) {
      errors.push('Year must be 1st Year, 2nd Year, 3rd Year, or 4th Year');
    }

    // Validate branch
    if (data.Branch && !BRANCHES.includes(data.Branch)) {
      errors.push(`Branch must be one of: ${BRANCHES.join(', ')}`);
    }

    // Validate phone number format
    if (data['Phone Number'] && !/^\d{10}$/.test(data['Phone Number'].toString())) {
      errors.push('Phone Number must be 10 digits');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const processUploadedData = async (data: any[]): Promise<UploadResult> => {
    const formData = new FormData();
    
    if (data.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        errors: ['No data to process']
      };
    }

    // Create a temporary file with the data
    let fileContent: string | Blob;
    let fileName: string;
    
    // Check if original file was Excel by looking at the first few rows
    // If it has consistent structure, assume it came from Excel
    const hasConsistentStructure = data.every(row => 
      typeof row === 'object' && 
      Object.keys(row).length > 0
    );
    
    if (hasConsistentStructure) {
      // Create Excel file
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      fileContent = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fileName = 'upload.xlsx';
    } else {
      // Create CSV file (fallback)
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header] || '';
          return `"${value.toString().replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
      });
      fileContent = csvRows.join('\n');
      fileName = 'upload.csv';
    }

    const file = new File([fileContent], fileName);
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/v1/students/import/save', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload students');
      }

      const result = await response.json();
      return {
        total: result.total || data.length,
        successful: result.successful || 0,
        failed: result.failed || 0,
        errors: result.errors || []
      };
    } catch (error) {
      return {
        total: data.length,
        successful: 0,
        failed: data.length,
        errors: [`Failed to import students: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV or Excel (.xlsx) file",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setUploadResult(null);
    setParsedData(null);
    setShowPreview(false);

    try {
      const data = await parseFile(file);
      
      // Validate the data structure
      if (data.length === 0) {
        throw new Error('No data found in file');
      }

      // Check if required columns exist
      const requiredColumns = ['Name', 'Address', 'Gender', 'Category', 'Date of Birth', 'Phone Number', 'Branch', 'Year', 'Mother Name'];
      const headers = Object.keys(data[0]);
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));
      
      if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
      }

      setParsedData(data);
      
      toast({
        title: "File parsed successfully",
        description: `Found ${data.length} student records`,
      });
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: "Error parsing file",
        description: error instanceof Error ? error.message : "Failed to parse file",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddStudents = async () => {
    if (!parsedData) return;

    setIsAdding(true);
    setUploadResult(null);

    try {
      const result = await processUploadedData(parsedData);
      setUploadResult(result);
      
      if (result.successful > 0) {
        toast({
          title: "Students added successfully",
          description: `Successfully imported ${result.successful} students`,
        });
        onStudentsUploaded();
        setParsedData(null);
        setShowPreview(false);
      } else {
        toast({
          title: "Import failed",
          description: "No students were successfully imported",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error importing students",
        description: error instanceof Error ? error.message : "Failed to import students",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Student Upload
          </CardTitle>
          <CardDescription>
            Upload student data from Excel (.xlsx) or CSV files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-lg font-medium">Drop your file here</p>
                <p className="text-sm text-gray-500">or click to browse</p>
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                variant="outline"
              >
                {isProcessing ? "Processing..." : "Choose File"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Supported formats: Excel (.xlsx), CSV (.csv)
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadSampleExcel}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>
        </CardContent>
      </Card>


      {/* Preview Section */}
      {showPreview && parsedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Data Preview ({parsedData.length} records)
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => setShowPreview(false)} variant="outline" size="sm">
                Hide Preview
              </Button>
              <Button onClick={() => setParsedData(null)} variant="outline" size="sm">
                Clear Data
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Showing first 5 records. Total: {parsedData.length}
              </div>
              
              {/* Validation Summary */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="font-medium text-blue-700">Total Records</div>
                  <div className="text-xl font-bold text-blue-900">{parsedData.length}</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="font-medium text-green-700">Valid Records</div>
                  <div className="text-xl font-bold text-green-900">
                    {parsedData.filter(row => validateStudentData(row).isValid).length}
                  </div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded">
                  <div className="font-medium text-red-700">Invalid Records</div>
                  <div className="text-xl font-bold text-red-900">
                    {parsedData.filter(row => !validateStudentData(row).isValid).length}
                  </div>
                </div>
              </div>

              {/* Sample Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      {Object.keys(parsedData[0]).map(header => (
                        <th key={header} className="border border-gray-300 px-2 py-1 text-left font-medium">
                          {header}
                        </th>
                      ))}
                      <th className="border border-gray-300 px-2 py-1 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 5).map((row, index) => {
                      const validation = validateStudentData(row);
                      return (
                        <tr key={index} className={validation.isValid ? '' : 'bg-red-50'}>
                          {Object.values(row).map((value, cellIndex) => (
                            <td key={cellIndex} className="border border-gray-300 px-2 py-1">
                              {String(value)}
                            </td>
                          ))}
                          <td className="border border-gray-300 px-2 py-1">
                            {validation.isValid ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">Valid</Badge>
                            ) : (
                              <Badge variant="destructive">Invalid</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Button 
                onClick={handleAddStudents} 
                className="w-full" 
                disabled={isAdding || parsedData.filter(row => validateStudentData(row).isValid).length === 0}
              >
                {isAdding ? "Adding Students..." : `Add ${parsedData.filter(row => validateStudentData(row).isValid).length} Valid Students`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {uploadResult.successful > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Upload Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="font-medium text-blue-700">Total</div>
                <div className="text-xl font-bold text-blue-900">{uploadResult.total}</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="font-medium text-green-700">Successful</div>
                <div className="text-xl font-bold text-green-900">{uploadResult.successful}</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded">
                <div className="font-medium text-red-700">Failed</div>
                <div className="text-xl font-bold text-red-900">{uploadResult.failed}</div>
              </div>
            </div>
            
            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Errors:
                </h4>
                <ul className="text-sm text-red-600 space-y-1">
                  {uploadResult.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Show preview button when data is parsed */}
      {parsedData && !showPreview && (
        <div className="text-center">
          <Button onClick={() => setShowPreview(true)} variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Preview Data ({parsedData.length} records)
          </Button>
        </div>
      )}
    </div>
  );
};

export default BulkUpload;
