export interface StudentBase {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code?: string;
  admission_number: string;
  roll_number: string;
  institutional_email: string;
  department: string;
  created_at: string;
  updated_at: string;
  // Additional fields
  category?: string;
  branch?: string;
  year?: string;
  mother_name?: string;
  photo?: string;
  subjects?: string[];
}

export interface Student extends StudentBase {
  // Legacy fields for compatibility
  rollNumber?: string;
  personalEmail?: string;
  name?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  motherName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentCreate {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  address: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  admission_number: string;
  roll_number: string;
  institutional_email?: string;
  department?: string;
  category?: string;
  branch?: string;
  year?: string;
  mother_name?: string;
  photo?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
}

export const BRANCHES = [
  'Computer Science Engineering',
  'Information Technology',
  'Electronics and Communication Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Aerospace Engineering',
] as const;

export const SUBJECTS = [
  { id: '1', name: 'Data Structures and Algorithms', code: 'CS201', credits: 4 },
  { id: '2', name: 'Database Management Systems', code: 'CS202', credits: 3 },
  { id: '3', name: 'Computer Networks', code: 'CS203', credits: 3 },
  { id: '4', name: 'Operating Systems', code: 'CS204', credits: 4 },
  { id: '5', name: 'Software Engineering', code: 'CS205', credits: 3 },
  { id: '6', name: 'Web Technologies', code: 'CS206', credits: 3 },
  { id: '7', name: 'Machine Learning', code: 'CS207', credits: 4 },
  { id: '8', name: 'Artificial Intelligence', code: 'CS208', credits: 4 },
] as const;