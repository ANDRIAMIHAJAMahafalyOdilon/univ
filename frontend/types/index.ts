// Types for the university grade management system

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'teacher' | 'student';
  avatar?: string;
}

export interface Student {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  gender: 'M' | 'F';
  phone?: string;
  address?: string;
  enrollmentDate: string;
  level: string;
  department: string;
  status: 'active' | 'inactive' | 'graduated' | 'suspended';
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Teacher {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: string;
  specialization: string;
  hireDate: string;
  status: 'active' | 'inactive' | 'on_leave';
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  code: string;
  name: string;
  description?: string;
  credits: number;
  coefficient: number;
  semester: number;
  department: string;
  teacherId: string;
  teacher?: Teacher;
  status: 'active' | 'inactive';
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Grade {
  id: string;
  studentId: string;
  student?: Student;
  moduleId: string;
  module?: Module;
  controlNote: number;
  examNote: number;
  finalNote: number;
  semester: number;
  academicYear: string;
  status: 'pending' | 'validated' | 'rejected';
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalModules: number;
  totalGrades: number;
  averageGrade: number;
  successRate: number;
  recentActivities: Activity[];
}

export interface Activity {
  id: string;
  type: 'student_added' | 'grade_added' | 'module_created' | 'teacher_added';
  description: string;
  timestamp: string;
  user: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
}

export interface Mention {
  id: string;
  code: string;
  name: string;
  description?: string;
  minScore: number;
  maxScore: number;
  color: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Parcours {
  id: string;
  code: string;
  name: string;
  description?: string;
  department: string;
  level: string;
  duration: number; // in years
  totalCredits: number;
  status: 'active' | 'inactive';
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
