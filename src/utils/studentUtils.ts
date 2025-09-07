import { Student } from '@/types/student';

export const generateRollNumber = (branch: string, year: string): string => {
  // Generate a 4-digit sequential number (you might want to implement proper sequencing)
  const randomNum = Math.floor(Math.random() * 9000) + 1000; // 4-digit number
  return `SCOE${randomNum}`;
};

export const generatePersonalEmail = (name: string, rollNumber: string, branch: string = 'Computer Science Engineering'): string => {
  // Clean the name: remove extra spaces, special characters, convert to lowercase
  const cleanName = name.trim()
    .toLowerCase()
    .replace(/[^a-z\s]/g, '') // Remove non-alphabetic characters except spaces
    .replace(/\s+/g, '') // Remove all spaces
    .replace(/[^a-z]/g, ''); // Keep only letters
  
  // Map branch to department domain
  const branchToDepartment: { [key: string]: string } = {
    'Computer Science Engineering': 'computerscienceengineering',
    'Information Technology': 'informationtechnology',
    'Electronics and Communication Engineering': 'electronicsandcommunicationengineering',
    'Electrical Engineering': 'electricalengineering',
    'Mechanical Engineering': 'mechanicalengineering',
    'Civil Engineering': 'civilengineering',
    'Chemical Engineering': 'chemicalengineering',
    'Aerospace Engineering': 'aerospaceengineering',
  };
  
  const department = branchToDepartment[branch] || 'computerscienceengineering';
  
  return `${cleanName}@${department}.scoe.edu.in`;
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