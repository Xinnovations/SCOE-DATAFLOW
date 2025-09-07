import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Student, BRANCHES } from '@/types/student';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Download, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

  const downloadSampleCSV = () => {
    const sampleData = [
      'Name,Address,Gender,Category,Date of Birth,Phone Number,Branch,Year,Mother Name',
      'John Doe,"123 Main St, City, State",Male,General,1999-05-15,9876543210,Computer Science Engineering,1st Year,Jane Doe',
      'Alice Smith,"456 Oak Ave, Town, State",Female,OBC,2000-03-22,9876543211,Information Technology,2nd Year,Mary Smith',
      'Bob Johnson,"789 Pine Rd, Village, State",Male,SC,1998-12-08,9876543212,Electronics and Communication Engineering,3rd Year,Sarah Johnson'
    ];
    
    const csvContent = sampleData.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'student-import-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Template downloaded",
      description: "Student import template has been downloaded",
    });
  };

  const parseCSV = (csvText: string): any[] => {
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
  };

  const validateStudentData = (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const requiredFields = [
      'Name', 'Address', 'Gender', 'Category', 'Date of Birth', 
      'Phone Number', 'Branch', 'Year', 'Mother Name'
    ];

    requiredFields.forEach(field => {
      if (!data[field] || data[field].toString().trim() === '') {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Validate gender
    const validGenders = ['Male', 'Female', 'Other'];
    if (data.Gender && !validGenders.includes(data.Gender)) {
      errors.push(`Invalid gender: ${data.Gender}. Must be Male, Female, or Other`);
    }

    // Validate category
    const validCategories = ['General', 'OBC', 'SC', 'ST', 'EWS'];
    if (data.Category && !validCategories.includes(data.Category)) {
      errors.push(`Invalid category: ${data.Category}. Must be one of: ${validCategories.join(', ')}`);
    }

    // Validate branch
    if (data.Branch && !BRANCHES.includes(data.Branch as any)) {
      errors.push(`Invalid branch: ${data.Branch}`);
    }

    // Validate year
    const validYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
    if (data.Year && !validYears.includes(data.Year)) {
      errors.push(`Invalid year: ${data.Year}. Must be one of: ${validYears.join(', ')}`);
    }

    // Validate phone number
    const phoneRegex = /^[0-9]{10}$/;
    if (data['Phone Number'] && !phoneRegex.test(data['Phone Number'].toString())) {
      errors.push(`Invalid phone number: ${data['Phone Number']}. Must be 10 digits`);
    }

    // Validate date of birth
    if (data['Date of Birth']) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data['Date of Birth'])) {
        errors.push(`Invalid date format: ${data['Date of Birth']}. Use YYYY-MM-DD format`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const processUploadedData = async (data: any[]): Promise<UploadResult> => {
    const result: UploadResult = {
      total: data.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    // Convert data to CSV format for backend
    const csvHeaders = ['Name', 'Address', 'Gender', 'Category', 'Date of Birth', 'Phone Number', 'Branch', 'Year', 'Mother Name'];
    const csvRows = data.map(row => 
      csvHeaders.map(header => {
        const value = row[header] || '';
        // Escape quotes and wrap in quotes if contains comma
        return value.includes(',') ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',')
    );
    
    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
    
    try {
      // Call backend import/save endpoint
      const formData = new FormData();
      const csvBlob = new Blob([csvContent], { type: 'text/csv' });
      formData.append('file', csvBlob, 'students.csv');
      
      const response = await fetch('http://localhost:8000/api/v1/students/import/save', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const backendResult = await response.json();
      
      result.total = backendResult.total || data.length;
      result.successful = backendResult.successful || 0;
      result.failed = backendResult.failed || 0;
      result.errors = backendResult.errors || [];
      
    } catch (error) {
      result.failed = data.length;
      result.errors.push(`Failed to import students: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setUploadResult(null);
    setParsedData(null);
    setShowPreview(false);

    try {
      const fileContent = await file.text();
      const data = parseCSV(fileContent);
      
      setParsedData(data);
      setShowPreview(true);
      
      toast({
        title: "File parsed successfully",
        description: `Found ${data.length} records. Click Preview to review data before importing.`,
      });
    } catch (error) {
      toast({
        title: "Parse error",
        description: "Failed to parse the CSV file. Please check the format.",
        variant: "destructive",
      });
      setUploadResult({
        total: 0,
        successful: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
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
        title: "Import error",
        description: "Failed to import students",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Import Students
          </CardTitle>
          <CardDescription>
            Upload a CSV file to import multiple students at once
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Upload CSV File</CardTitle>
            <CardDescription>
              Drag and drop your CSV file or click to browse
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload Area */}
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {isProcessing ? (
                <div className="space-y-2">
                  <div className="animate-spin mx-auto w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
                  <p className="text-sm text-muted-foreground">Processing CSV file...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <p className="text-lg font-medium">Upload Student Data</p>
                    <p className="text-sm text-muted-foreground">
                      Drag and drop your CSV file here, or click to browse
                    </p>
                  </div>
                  <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Choose CSV File
                  </Button>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <Separator />

            {/* Sample Download */}
            <div className="text-center">
              <Button variant="outline" onClick={downloadSampleCSV}>
                <Download className="mr-2 h-4 w-4" />
                Download Import Template
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview Placeholder */}
        <Card className="shadow-card h-full">
          <CardHeader>
            <CardTitle className="text-lg">Preview</CardTitle>
            <CardDescription>
              Upload a CSV file to preview the data
            </CardDescription>
          </CardHeader>
          <CardContent className="h-full flex items-center justify-center min-h-[400px]">
            <div className="text-center text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-30" />
              <p>Upload a CSV file to preview the data</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Preview */}
      {showPreview && parsedData && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Data Preview ({parsedData.length} records)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPreview(false);
                    setParsedData(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddStudents}
                  disabled={isAdding}
                  className="bg-gradient-primary hover:bg-primary-hover"
                >
                  {isAdding ? (
                    <>
                      <div className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Adding Students...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Add Students
                    </>
                  )}
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Review the data below before importing. Check for any validation errors.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Validation Summary */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-success/10 rounded-lg">
                  <div className="text-lg font-bold text-success">
                    {parsedData.filter(row => validateStudentData(row).isValid).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Valid Records</div>
                </div>
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <div className="text-lg font-bold text-destructive">
                    {parsedData.filter(row => !validateStudentData(row).isValid).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Invalid Records</div>
                </div>
              </div>

              {/* Data Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Name</th>
                        <th className="text-left p-3 font-medium">Phone</th>
                        <th className="text-left p-3 font-medium">Branch</th>
                        <th className="text-left p-3 font-medium">Year</th>
                        <th className="text-left p-3 font-medium">Gender</th>
                        <th className="text-left p-3 font-medium">Category</th>
                        <th className="text-left p-3 font-medium">Errors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.map((row, index) => {
                        const validation = validateStudentData(row);
                        return (
                          <tr key={index} className="border-t hover:bg-muted/20">
                            <td className="p-3">
                              {validation.isValid ? (
                                <Badge variant="secondary" className="bg-success/20 text-success">
                                  Valid
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  Invalid
                                </Badge>
                              )}
                            </td>
                            <td className="p-3 font-medium">{row.Name || 'N/A'}</td>
                            <td className="p-3">{row['Phone Number'] || 'N/A'}</td>
                            <td className="p-3">{row.Branch || 'N/A'}</td>
                            <td className="p-3">{row.Year || 'N/A'}</td>
                            <td className="p-3">{row.Gender || 'N/A'}</td>
                            <td className="p-3">{row.Category || 'N/A'}</td>
                            <td className="p-3">
                              {validation.errors.length > 0 && (
                                <div className="text-xs text-destructive max-w-48">
                                  {validation.errors.slice(0, 2).join(', ')}
                                  {validation.errors.length > 2 && '...'}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Warning for invalid records */}
              {parsedData.some(row => !validateStudentData(row).isValid) && (
                <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium text-warning">Invalid Records Found</p>
                      <p className="text-sm text-muted-foreground">
                        Only valid records will be imported. Please fix the errors in your CSV file and re-upload to import all students.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Results */}
      {uploadResult && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {uploadResult.successful > 0 ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              Upload Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{uploadResult.total}</div>
                <div className="text-sm text-muted-foreground">Total Records</div>
              </div>
              <div className="p-4 bg-success/10 rounded-lg">
                <div className="text-2xl font-bold text-success">{uploadResult.successful}</div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div className="p-4 bg-destructive/10 rounded-lg">
                <div className="text-2xl font-bold text-destructive">{uploadResult.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>

            {/* Errors */}
            {uploadResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  Errors ({uploadResult.errors.length})
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {uploadResult.errors.map((error, index) => (
                    <div key={index} className="text-sm bg-destructive/10 text-destructive p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BulkUpload;