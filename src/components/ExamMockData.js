// High-quality Seed Data & Academic Utilities for Exam Portal

export const EXAMS_STORAGE_KEY = 'school_management_exams_v2';
export const HALLS_STORAGE_KEY = 'school_management_halls_v2';
export const MARKS_STORAGE_KEY = 'school_management_marks_v2';

export const defaultExams = [
    {
        id: 'exam-1',
        name: 'Half Yearly Examination',
        classGrade: '10th A',
        startDate: '2026-09-10',
        endDate: '2026-09-15',
        published: true,
        papers: [
            { subject: 'Mathematics', date: '2026-09-10', startTime: '09:00', endTime: '12:00', maxMarks: 100, passMarks: 33 },
            { subject: 'Science', date: '2026-09-12', startTime: '09:00', endTime: '12:00', maxMarks: 100, passMarks: 33 },
            { subject: 'English', date: '2026-09-15', startTime: '09:00', endTime: '12:00', maxMarks: 100, passMarks: 33 }
        ]
    },
    {
        id: 'exam-2',
        name: 'Periodic Unit Test I',
        classGrade: '10th A',
        startDate: '2026-07-01',
        endDate: '2026-07-03',
        published: true,
        papers: [
            { subject: 'Mathematics', date: '2026-07-01', startTime: '09:00', endTime: '10:30', maxMarks: 50, passMarks: 17 },
            { subject: 'Science', date: '2026-07-02', startTime: '09:00', endTime: '10:30', maxMarks: 50, passMarks: 17 },
            { subject: 'English', date: '2026-07-03', startTime: '09:00', endTime: '10:30', maxMarks: 50, passMarks: 17 }
        ]
    },
    {
        id: 'exam-3',
        name: 'Term II Board Mock',
        classGrade: '9th B',
        startDate: '2026-10-15',
        endDate: '2026-10-20',
        published: false,
        papers: [
            { subject: 'Social Science', date: '2026-10-15', startTime: '09:00', endTime: '12:00', maxMarks: 100, passMarks: 33 },
            { subject: 'Hindi', date: '2026-10-18', startTime: '09:00', endTime: '12:00', maxMarks: 100, passMarks: 33 },
            { subject: 'English', date: '2026-10-20', startTime: '09:00', endTime: '12:00', maxMarks: 100, passMarks: 33 }
        ]
    }
];

export const defaultStudents = [
    { id: 'stud-1', name: 'Rahul Gupta', class: '10th', section: 'A', rollNumber: '18', email: 'rahul@metro.com' },
    { id: 'stud-2', name: 'Siddharth Verma', class: '10th', section: 'A', rollNumber: '22', email: 'sid@metro.com' },
    { id: 'stud-3', name: 'Priya Singh', class: '10th', section: 'A', rollNumber: '08', email: 'priya.s@metro.com' },
    { id: 'stud-4', name: 'Aaryan Sharma', class: '10th', section: 'A', rollNumber: '12', email: 'aaryan@sunrise.com' },
    { id: 'stud-5', name: 'Kavya Nair', class: '10th', section: 'A', rollNumber: '15', email: 'kavya@metro.com' },
    { id: 'stud-6', name: 'Amit Patel', class: '9th', section: 'B', rollNumber: '02', email: 'amit@metro.com' },
    { id: 'stud-7', name: 'Sneha Reddy', class: '9th', section: 'B', rollNumber: '14', email: 'sneha@metro.com' }
];

export const defaultHallAllocations = [
    { id: 'hall-1', examId: 'exam-1', subject: 'Mathematics', roomNumber: 'Room 101', capacity: 30, supervisor: 'Mr. Ramesh Kumar' },
    { id: 'hall-2', examId: 'exam-1', subject: 'Science', roomNumber: 'Room 102', capacity: 30, supervisor: 'Mrs. Suman Lata' },
    { id: 'hall-3', examId: 'exam-1', subject: 'English', roomNumber: 'Room 104', capacity: 45, supervisor: 'Mr. David Paul' },
    { id: 'hall-4', examId: 'exam-2', subject: 'Mathematics', roomNumber: 'Room 101', capacity: 30, supervisor: 'Mr. Ramesh Kumar' },
    { id: 'hall-5', examId: 'exam-2', subject: 'Science', roomNumber: 'Room 102', capacity: 30, supervisor: 'Mrs. Suman Lata' }
];

export const defaultMarks = [
    // Half Yearly Examination for Class 10th A
    { examId: 'exam-1', studentId: 'stud-1', studentName: 'Rahul Gupta', attendance: { Mathematics: 'Present', Science: 'Present', English: 'Present' }, marks: { Mathematics: 88, Science: 92, English: 85 } },
    { examId: 'exam-1', studentId: 'stud-2', studentName: 'Siddharth Verma', attendance: { Mathematics: 'Present', Science: 'Present', English: 'Present' }, marks: { Mathematics: 74, Science: 81, English: 78 } },
    { examId: 'exam-1', studentId: 'stud-3', studentName: 'Priya Singh', attendance: { Mathematics: 'Present', Science: 'Present', English: 'Present' }, marks: { Mathematics: 95, Science: 96, English: 91 } },
    { examId: 'exam-1', studentId: 'stud-4', studentName: 'Aaryan Sharma', attendance: { Mathematics: 'Present', Science: 'Present', English: 'Present' }, marks: { Mathematics: 28, Science: 45, English: 52 } }, // Fails Mathematics
    { examId: 'exam-1', studentId: 'stud-5', studentName: 'Kavya Nair', attendance: { Mathematics: 'Present', Science: 'Present', English: 'Present' }, marks: { Mathematics: 62, Science: 58, English: 64 } },

    // Periodic Unit Test I for Class 10th A
    { examId: 'exam-2', studentId: 'stud-1', studentName: 'Rahul Gupta', attendance: { Mathematics: 'Present', Science: 'Present', English: 'Present' }, marks: { Mathematics: 45, Science: 48, English: 42 } },
    { examId: 'exam-2', studentId: 'stud-2', studentName: 'Siddharth Verma', attendance: { Mathematics: 'Present', Science: 'Present', English: 'Present' }, marks: { Mathematics: 38, Science: 40, English: 36 } },
    { examId: 'exam-2', studentId: 'stud-3', studentName: 'Priya Singh', attendance: { Mathematics: 'Present', Science: 'Present', English: 'Present' }, marks: { Mathematics: 48, Science: 49, English: 47 } }
];

export const mockNotifications = [
    { id: 1, type: 'date', message: 'Exam Date Reminder: Periodic Unit Test I starts in 3 days.', date: '2026-06-28', active: true },
    { id: 2, type: 'publish', message: 'Result Published: Half Yearly Examination report cards are now viewable.', date: '2026-09-18', active: true },
    { id: 3, type: 'date', message: 'Exam Date Reminder: Term II Board Mock schedules released.', date: '2026-10-01', active: true }
];

// Grade Calculator
export const calculateGrade = (mark, max) => {
    if (mark === undefined || mark === null || mark === '') return '-';
    const percent = (Number(mark) / Number(max)) * 100;
    if (percent >= 90) return 'A+';
    if (percent >= 80) return 'A';
    if (percent >= 70) return 'B';
    if (percent >= 60) return 'C';
    if (percent >= 50) return 'D';
    if (percent >= 33) return 'E';
    return 'F';
};

// Pass / Fail assessment
export const isPass = (mark, max, passThreshold = 33) => {
    if (mark === undefined || mark === null || mark === '') return false;
    const percent = (Number(mark) / Number(max)) * 100;
    return percent >= passThreshold;
};

// Comprehensive Rank Calculator
export const calculateStudentRank = (examId, studentId, marksList, examsList) => {
    const exam = examsList.find(e => e.id === examId);
    if (!exam) return { rank: '-', totalScored: 0, totalMax: 0, percent: 0, status: 'N/A' };

    const examMarks = marksList.filter(m => m.examId === examId);
    if (examMarks.length === 0) return { rank: '-', totalScored: 0, totalMax: 0, percent: 0, status: 'N/A' };

    // Calculate total scored and max marks for all students in this exam
    const studentTotals = examMarks.map(m => {
        let scored = 0;
        let max = 0;
        let anyFail = false;

        exam.papers.forEach(p => {
            const paperMark = m.marks[p.subject];
            const attendance = m.attendance[p.subject] || 'Present';
            
            if (attendance === 'Present' && paperMark !== undefined && paperMark !== '') {
                scored += Number(paperMark);
                if (!isPass(paperMark, p.maxMarks)) {
                    anyFail = true;
                }
            } else {
                anyFail = true; // Absent is considered failing
            }
            max += Number(p.maxMarks);
        });

        const percent = max > 0 ? (scored / max) * 100 : 0;

        return {
            studentId: m.studentId,
            scored,
            max,
            percent,
            anyFail
        };
    });

    // Sort descending by scored
    studentTotals.sort((a, b) => b.scored - a.scored);

    // Find our target student
    const index = studentTotals.findIndex(s => s.studentId === studentId);
    if (index === -1) return { rank: '-', totalScored: 0, totalMax: 0, percent: 0, status: 'N/A' };

    const info = studentTotals[index];
    return {
        rank: index + 1,
        totalStudents: studentTotals.length,
        totalScored: info.scored,
        totalMax: info.max,
        percent: info.percent.toFixed(1),
        status: info.anyFail ? 'Fail' : 'Pass'
    };
};
