import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Student } from '@/types/student';
import { downloadCSV } from '@/utils/studentUtils';
import { Search, Download, Users, Trash2, Eye, Filter } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const StudentList = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/students');
      if (response.ok) {
        const studentData = await response.json();
        setStudents(studentData);
      } else {
        console.error('Failed to fetch students:', response.statusText);
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = 
        student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.roll_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase());
        

      const matchesBranch = filterBranch === 'all' || student.department === filterBranch;
      const matchesYear = filterYear === 'all' || student.state === filterYear;

      return matchesSearch && matchesBranch && matchesYear;
    });
  }, [students, searchTerm, filterBranch, filterYear]);

  const handleDeleteStudent = async (studentId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/students/${studentId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await loadStudents();
        toast({
          title: "Student deleted",
          description: "Student record has been removed successfully",
        });
      } else {
        toast({
          title: "Delete failed",
          description: "Failed to delete student record",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete student record",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = async () => {
    if (filteredStudents.length === 0) {
      toast({
        title: "No data to export",
        description: "Please add some students first",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/v1/students/export/csv');
      if (response.ok) {
        const csvContent = await response.text();
        downloadCSV(csvContent, 'student-list.csv');
        
        toast({
          title: "Export successful",
          description: `Exported ${filteredStudents.length} student records`,
        });
      } else {
        toast({
          title: "Export failed",
          description: "Failed to export student data",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export student data",
        variant: "destructive",
      });
    }
  };

  const uniqueBranches = [...new Set(students.map(s => s.department))];
  const uniqueYears = [...new Set(students.map(s => s.state))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Student Management
          </CardTitle>
          <CardDescription>
            View, search, and manage all registered students ({students.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1">
              <Label htmlFor="search">Search Students</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, roll number, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <div>
                <Label>Branch</Label>
                <Select value={filterBranch} onValueChange={setFilterBranch}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {uniqueBranches.map(branch => (
                      <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Year</Label>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {uniqueYears.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Export Button */}
            <div className="self-end">
              <Button 
                onClick={handleExportCSV}
                variant="outline"
                className="hover:bg-success/10 hover:text-success hover:border-success"
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredStudents.length} of {students.length} students
            </p>
            {(searchTerm || filterBranch !== 'all' || filterYear !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterBranch('all');
                  setFilterYear('all');
                }}
              >
                <Filter className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Student Cards */}
      {filteredStudents.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {students.length === 0 ? 'No students registered yet' : 'No students match your filters'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {students.length === 0 
                ? 'Add your first student to get started with student management.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="group hover:shadow-hover transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {student.photo ? (
                      <img 
                        src={student.photo} 
                        alt={student.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-medium">
                          {(student.first_name + ' ' + student.last_name).split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{student.first_name} {student.last_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{student.roll_number}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {student.state}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Branch:</span>
                    <p className="font-medium truncate" title={student.department}>
                      {student.department}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Year:</span>
                    <p className="font-medium">{student.state}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <p className="font-medium">{student.phone}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gender:</span>
                    <p className="font-medium">{student.gender}</p>
                  </div>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium text-primary truncate" title={student.email}>
                    {student.email}
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <Eye className="mr-2 h-3 w-3" />
                    View
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Student</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {student.first_name} {student.last_name}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteStudent(student.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Student Details
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4 mb-6">
                {selectedStudent.photo ? (
                  <img 
                    src={selectedStudent.photo} 
                    alt={selectedStudent.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-medium text-lg">
                      {(selectedStudent.first_name + ' ' + selectedStudent.last_name).split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-bold">{selectedStudent.first_name} {selectedStudent.last_name}</h3>
                  <p className="text-muted-foreground">{selectedStudent.roll_number}</p>
                  <p className="text-primary">{selectedStudent.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <p className="font-medium">{selectedStudent.phone}</p>
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <p className="font-medium">{new Date(selectedStudent.date_of_birth).toLocaleDateString()}</p>
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <p className="font-medium">{selectedStudent.gender}</p>
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <p className="font-medium">{selectedStudent.state}</p>
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <p className="font-medium">{selectedStudent.department}</p>
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <p className="font-medium">{selectedStudent.city}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <p className="font-medium">{selectedStudent.address}</p>
              </div>

              <div className="space-y-2">
                <Label>Institutional Email</Label>
                <p className="font-medium text-primary">{selectedStudent.institutional_email}</p>
              </div>

              <div className="space-y-2">
                <Label>Created</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedStudent.created_at).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StudentList;