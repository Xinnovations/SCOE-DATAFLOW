import { Student } from '@/types/student';

export const generateRollNumber = (branch: string, year: string): string => {
  const branchCode = {
    'Computer Science Engineering': 'CSE',
    'Information Technology': 'IT',
    'Electronics and Communication Engineering': 'ECE',
    'Electrical Engineering': 'EE',
    'Mechanical Engineering': 'ME',  
    'Civil Engineering': 'CE',
    'Chemical Engineering': 'CHE',
    'Aerospace Engineering': 'AE',
  }[branch] || 'GEN';
  
  const yearCode = year.charAt(0);
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const randomNum = Math.floor(Math.random() * 9000) + 1000;
  
  return `${currentYear}${branchCode}${yearCode}${randomNum}`;
};

export const generatePersonalEmail = (name: string, rollNumber: string): string => {
  const cleanName = name.toLowerCase().replace(/\s+/g, '.');
  const rollSuffix = rollNumber.slice(-4);
  return `${cleanName}.${rollSuffix}@student.college.edu`;
};

export const saveStudentToStorage = (student: Student): void => {
  const students = getStudentsFromStorage();
  const existingIndex = students.findIndex(s => s.id === student.id);
  
  if (existingIndex >= 0) {
    students[existingIndex] = { ...student, updatedAt: new Date().toISOString() };
  } else {
    students.push({ ...student, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  
  localStorage.setItem('campus_students', JSON.stringify(students));
};

export const getStudentsFromStorage = (): Student[] => {
  try {
    const stored = localStorage.getItem('campus_students');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading students from storage:', error);
    return [];
  }
};

export const deleteStudentFromStorage = (studentId: string): void => {
  const students = getStudentsFromStorage();
  const filtered = students.filter(s => s.id !== studentId);
  localStorage.setItem('campus_students', JSON.stringify(filtered));
};

export const exportStudentsToCSV = (students: Student[]): string => {
  const headers = [
    'Roll Number',
    'Name', 
    'Personal Email',
    'Phone Number',
    'Address',
    'Gender',
    'Category',
    'Date of Birth',
    'Branch',
    'Year',
    'Mother Name',
    'Subjects',
    'Created At'
  ];
  
  const csvContent = [
    headers.join(','),
    ...students.map(student => [
      student.rollNumber,
      `"${student.name}"`,
      student.personalEmail,
      student.phoneNumber,
      `"${student.address}"`,
      student.gender,
      student.category,
      student.dateOfBirth,
      `"${student.branch}"`,
      student.year,
      `"${student.motherName}"`,
      `"${student.subjects.join('; ')}"`,
      student.createdAt
    ].join(','))
  ].join('\n');
  
  return csvContent;
};

export const downloadCSV = (csvContent: string, filename: string = 'students.csv'): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};