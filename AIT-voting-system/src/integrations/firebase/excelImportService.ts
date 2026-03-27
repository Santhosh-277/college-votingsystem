import * as XLSX from 'xlsx';
import { database } from './config';
import { ref, set, get } from 'firebase/database';

export interface StudentImportData {
  rollNo: string;
  name: string;
  email?: string;
  department?: string;
  password?: string; // Optional, will generate if not provided
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
  duplicates: string[];
}

/**
 * Import students from Excel file
 * Expected Excel format:
 * Column A: Roll Number (required)
 * Column B: Name (required)
 * Column C: Email (optional)
 * Column D: Department (optional)
 * Column E: Password (optional - will generate if empty)
 */
export const importStudentsFromExcel = async (file: File): Promise<ImportResult> => {
  const result: ImportResult = {
    success: false,
    imported: 0,
    failed: 0,
    errors: [],
    duplicates: []
  };

  try {
    // Read the Excel file
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });

    // Get the first worksheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    // Remove header row
    jsonData.shift();

    // Process each row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;

      try {
        const studentData: StudentImportData = {
          rollNo: String(row[0] || '').trim(),
          name: String(row[1] || '').trim(),
          email: row[2] ? String(row[2]).trim() : undefined,
          department: row[3] ? String(row[3]).trim() : undefined,
          password: row[4] ? String(row[4]).trim() : undefined
        };

        // Validate required fields
        if (!studentData.rollNo || !studentData.name) {
          result.errors.push(`Row ${i + 2}: Missing roll number or name`);
          result.failed++;
          continue;
        }

        // Check for duplicates
        const isDuplicate = await checkDuplicateRollNo(studentData.rollNo);
        if (isDuplicate) {
          result.duplicates.push(`Row ${i + 2}: ${studentData.rollNo} (${studentData.name})`);
          result.failed++;
          continue;
        }

        // Generate password if not provided
        if (!studentData.password) {
          studentData.password = generateDefaultPassword(studentData.rollNo);
        }

        // Register student
        await registerStudentFromImport(studentData);
        result.imported++;

      } catch (error) {
        result.errors.push(`Row ${i + 2}: ${error.message}`);
        result.failed++;
      }
    }

    result.success = result.failed === 0;

  } catch (error) {
    result.errors.push(`File processing error: ${error.message}`);
  }

  return result;
};

/**
 * Check if roll number already exists
 */
const checkDuplicateRollNo = async (rollNo: string): Promise<boolean> => {
  try {
    const studentsRef = ref(database, 'students');
    const snapshot = await get(studentsRef);

    if (snapshot.exists()) {
      const students = snapshot.val();
      return Object.values(students).some((student: any) => student.rollNo === rollNo);
    }
    return false;
  } catch (error) {
    console.error('Error checking duplicate:', error);
    return false;
  }
};

/**
 * Register student from import data
 */
const registerStudentFromImport = async (studentData: StudentImportData): Promise<void> => {
  const studentId = `student_${studentData.rollNo}_${Date.now()}`;

  const firebaseData = {
    id: studentId,
    rollNo: studentData.rollNo,
    name: studentData.name,
    email: studentData.email || null,
    department: studentData.department || null,
    password: btoa(studentData.password!), // Encode password
    createdAt: new Date().toISOString(),
    role: 'student'
  };

  const studentRef = ref(database, `students/${studentId}`);
  await set(studentRef, firebaseData);
};

/**
 * Generate default password for student
 */
const generateDefaultPassword = (rollNo: string): string => {
  // Generate password: rollNo + @ + last 4 digits of current year
  const year = new Date().getFullYear().toString().slice(-2);
  return `${rollNo}@${year}`;
};

/**
 * Export students to Excel file
 */
export const exportStudentsToExcel = async (): Promise<void> => {
  try {
    const studentsRef = ref(database, 'students');
    const snapshot = await get(studentsRef);

    if (!snapshot.exists()) {
      throw new Error('No student data found');
    }

    const students = snapshot.val();
    const exportData = Object.values(students).map((student: any) => ({
      'Roll Number': student.rollNo,
      'Name': student.name,
      'Email': student.email || '',
      'Department': student.department || '',
      'Created At': new Date(student.createdAt).toLocaleDateString()
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `students_export_${timestamp}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, filename);

  } catch (error) {
    console.error('Error exporting students:', error);
    throw error;
  }
};

/**
 * Get sample Excel template
 */
export const downloadStudentTemplate = (): void => {
  const templateData = [
    {
      'Roll Number': 'AIT001',
      'Name': 'John Doe',
      'Email': 'john.doe@college.edu',
      'Department': 'Computer Science',
      'Password': '' // Leave empty to auto-generate
    },
    {
      'Roll Number': 'AIT002',
      'Name': 'Jane Smith',
      'Email': 'jane.smith@college.edu',
      'Department': 'Information Technology',
      'Password': ''
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Template');

  XLSX.writeFile(workbook, 'student_import_template.xlsx');
};