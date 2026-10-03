import * as xlsx from 'xlsx';

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getValue(row: Record<string, any>, possibleKeys: string[]): string {
  const normalizedTargets = possibleKeys.map(normalizeKey);
  for (const [key, val] of Object.entries(row)) {
    if (val === null || val === undefined) continue;
    const normKey = normalizeKey(key);
    if (normalizedTargets.includes(normKey)) {
      const strVal = String(val).trim();
      if (strVal) return strVal;
    }
  }
  return '';
}

/**
 * Extracts raw data from the first non-empty worksheet, automatically
 * detecting the header row even if there are title/banner rows at the top.
 */
function extractSheetRows(workbook: xlsx.WorkBook, expectedKeyWords: string[]): Record<string, any>[] {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];

  // First try default 0-indexed header
  const rawRows = xlsx.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
  if (rawRows.length === 0) return [];

  // Check if first row already has any matching keys
  const normExpected = expectedKeyWords.map(normalizeKey);
  const firstRowKeys = Object.keys(rawRows[0]).map(normalizeKey);
  const hasMatchingHeader = firstRowKeys.some((k) => normExpected.some((e) => k.includes(e) || e.includes(k)));

  if (hasMatchingHeader) {
    return rawRows;
  }

  // Otherwise, read sheet as an array of arrays to find the real header row (within first 10 rows)
  const rowsAsArrays = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
  let headerIndex = -1;

  for (let i = 0; i < Math.min(rowsAsArrays.length, 10); i++) {
    const row = rowsAsArrays[i];
    if (Array.isArray(row)) {
      const rowNorm = row.map((cell) => normalizeKey(String(cell || '')));
      const matchCount = rowNorm.filter((cell) => normExpected.some((e) => cell.includes(e) || e.includes(cell))).length;
      if (matchCount >= 1) {
        headerIndex = i;
        break;
      }
    }
  }

  if (headerIndex > 0) {
    return xlsx.utils.sheet_to_json<Record<string, any>>(sheet, { range: headerIndex, defval: '' });
  }

  return rawRows;
}

export interface ParsedStudentRow {
  registerNumber: string;
  name: string;
  departmentName: string;
  batch: string;
  currentYear: string;
  email?: string;
  phone?: string;
}

export async function parseExcelFile(file: File): Promise<ParsedStudentRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = xlsx.read(data, { type: 'array' });
        const rawData = extractSheetRows(workbook, ['name', 'student', 'regno', 'register', 'rollno', 'dept', 'department']);

        const mappedData: ParsedStudentRow[] = rawData
          .map((row, index) => {
            let registerNumber = getValue(row, [
              'registerno', 'registernumber', 'regno', 'rollno', 'rollnumber', 
              'studentid', 'id', 'studentno', 'registrationno', 'admno', 'admissionno'
            ]);
            const name = getValue(row, [
              'studentname', 'name', 'fullname', 'student', 'nameofstudent', 'candidatename'
            ]);
            const departmentName = getValue(row, [
              'department', 'dept', 'departmentname', 'branch', 'deptname', 'course', 'discipline'
            ]) || 'General Engineering';
            const batch = getValue(row, ['batch', 'batchyear', 'academicbatch', 'session']) || '2024-2028';
            let currentYear = getValue(row, ['year', 'currentyear', 'classyear', 'class', 'yr']) || 'I';
            
            // Normalize Roman/Integer Year
            const yrLower = currentYear.toLowerCase();
            if (currentYear === '1' || yrLower.includes('1st') || yrLower.includes('first') || yrLower === 'i') currentYear = 'I';
            else if (currentYear === '2' || yrLower.includes('2nd') || yrLower.includes('second') || yrLower.includes('iind') || yrLower === 'ii') currentYear = 'II';
            else if (currentYear === '3' || yrLower.includes('3rd') || yrLower.includes('third') || yrLower.includes('iiird') || yrLower === 'iii') currentYear = 'III';
            else if (currentYear === '4' || yrLower.includes('4th') || yrLower.includes('fourth') || yrLower.includes('ivth') || yrLower === 'iv') currentYear = 'IV';

            // Auto-generate register number if missing but name exists
            if (!registerNumber && name) {
              registerNumber = `REG-${String(index + 1001)}`;
            }

            const email = getValue(row, ['email', 'emailid', 'mail', 'emailaddress', 'studentemail']);
            const phone = getValue(row, ['phone', 'mobile', 'contact', 'phonenumber', 'mobileno', 'studentphone']);

            return {
              registerNumber,
              name,
              departmentName,
              batch,
              currentYear,
              email: email || undefined,
              phone: phone || undefined,
            };
          })
          .filter((r) => r.registerNumber && r.name);

        if (mappedData.length === 0) {
          throw new Error("No student records could be detected. Please ensure your Excel file contains 'Name' or 'Register Number' columns.");
        }

        resolve(mappedData);
      } catch (error: any) {
        reject(new Error(error.message || "Failed to parse the student Excel file. Ensure it is a valid .xlsx or .csv format."));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read the file."));
    reader.readAsArrayBuffer(file);
  });
}

export interface ParsedStaffRow {
  staffId: string;
  name: string;
  departmentName: string;
  designation: string;
  email?: string;
  phone?: string;
}

export async function parseStaffExcelFile(file: File): Promise<ParsedStaffRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = xlsx.read(data, { type: 'array' });
        const rawData = extractSheetRows(workbook, ['name', 'faculty', 'staff', 'teacher', 'dept', 'department', 'designation', 'empid', 'staffid']);

        const mappedData: ParsedStaffRow[] = rawData
          .map((row, index) => {
            let staffId = getValue(row, [
              'staffid', 'id', 'empid', 'staffno', 'facultyid', 'facultycode', 
              'code', 'empcode', 'teacherid', 'sno', 'slno', 'serialno', 'no'
            ]);
            const name = getValue(row, [
              'staffname', 'facultyname', 'teachername', 'name', 'fullname', 
              'faculty', 'teacher', 'nameofthefaculty', 'nameofthestaff', 'staff', 'professor'
            ]);
            const departmentName = getValue(row, [
              'department', 'dept', 'departmentname', 'branch', 'deptname', 'discipline'
            ]) || 'General Engineering';
            const designation = getValue(row, [
              'designation', 'role', 'position', 'title', 'post', 'cadre', 'designationname'
            ]) || 'Assistant Professor';
            const email = getValue(row, [
              'email', 'emailid', 'mail', 'emailaddress', 'officialmail', 'personalmail'
            ]);
            const phone = getValue(row, [
              'phone', 'mobile', 'contact', 'phonenumber', 'mobileno', 'contactno', 'cellno', 'cell'
            ]);

            // If staffId is missing or is just a row index number, generate a clean STF ID
            if (!staffId && name) {
              staffId = `STF-${String(index + 101).padStart(4, '0')}`;
            } else if (staffId && /^\d+$/.test(staffId) && Number(staffId) < 500) {
              // If it's just S.No 1, 2, 3...
              staffId = `STF-${String(staffId).padStart(4, '0')}`;
            }

            return {
              staffId,
              name,
              departmentName,
              designation,
              email: email || undefined,
              phone: phone || undefined,
            };
          })
          .filter((r) => r.staffId && r.name);

        if (mappedData.length === 0) {
          throw new Error("No staff records could be detected. Please ensure your Excel file contains faculty 'Name' or 'Department' columns.");
        }

        resolve(mappedData);
      } catch (error: any) {
        reject(new Error(error.message || "Failed to parse the Staff Excel file. Ensure valid columns like 'Staff Name' and 'Department'."));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read the file."));
    reader.readAsArrayBuffer(file);
  });
}

export interface ParsedAttendanceRow {
  identifier: string; // Register No (Student) or Staff ID (Staff)
  name: string;
  date: Date;
  status: 'P' | 'A';
  departmentName?: string;
  year?: string;
}

export async function parseAttendanceExcelFile(file: File, fallbackDate?: string): Promise<ParsedAttendanceRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = xlsx.read(data, { type: 'array', cellDates: true });
        const rawData = extractSheetRows(workbook, ['identifier', 'regno', 'registerno', 'rollno', 'status', 'attendance', 'date', 'name']);

        const defaultDate = fallbackDate ? new Date(fallbackDate) : new Date();

        const mappedData = rawData
          .map((row) => {
            let parsedDate = defaultDate;
            const rawDate = row['Date'] || row['date'] || row['DATE'] || row['Attendance Date'];
            if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
              parsedDate = rawDate;
            } else if (typeof rawDate === 'string' && rawDate.trim()) {
              const d = new Date(rawDate);
              if (!isNaN(d.getTime())) parsedDate = d;
            }

            const rawStatus = getValue(row, ['status', 'attendance', 'present', 'attendancestatus', 'pa', 'state']).toUpperCase();
            const validStatus: 'P' | 'A' = (rawStatus === 'P' || rawStatus === 'PRESENT' || rawStatus === '1' || rawStatus === 'YES' || rawStatus === 'TRUE') ? 'P' : 'A';

            const identifier = getValue(row, ['registerno', 'regno', 'rollno', 'studentid', 'staffid', 'empid', 'id', 'identifier']);
            const name = getValue(row, ['name', 'studentname', 'staffname', 'fullname', 'student', 'faculty']);
            const departmentName = getValue(row, ['department', 'dept', 'branch']);
            const year = getValue(row, ['year', 'class', 'currentyear']);

            return {
              identifier,
              name: name || identifier,
              date: parsedDate,
              status: validStatus,
              departmentName: departmentName || undefined,
              year: year || undefined,
            };
          })
          .filter((r) => r.identifier && !isNaN(r.date.getTime()));

        if (mappedData.length === 0) {
          throw new Error("No attendance records detected. Please ensure your file contains 'Register No' / 'Identifier' and 'Status' columns.");
        }

        resolve(mappedData as ParsedAttendanceRow[]);
      } catch (error: any) {
        reject(new Error(error.message || "Failed to parse the Attendance Excel file."));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read the file."));
    reader.readAsArrayBuffer(file);
  });
}