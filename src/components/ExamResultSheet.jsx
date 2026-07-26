import React, { useState } from 'react';
import { ClipboardList, ShieldCheck, Download, Printer, UserCheck, Eye, Search, CheckCircle, AlertCircle, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { calculateGrade, isPass, calculateStudentRank } from './ExamMockData';

export const ExamResultSheet = ({ exams, students, marks, onSaveMarks, onTogglePublish }) => {
    // Selection state
    const [selectedExamId, setSelectedExamId] = useState(exams[0]?.id || '');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [studentSearch, setStudentSearch] = useState('');

    // Active records
    const selectedExam = exams.find(e => e.id === selectedExamId);
    const availableSubjects = selectedExam?.papers.map(p => p.subject) || [];
    const activePaper = selectedExam?.papers.find(p => p.subject === selectedSubject);

    // Filtered students who match the selected exam's target class
    const activeStudents = students.filter(s => {
        if (!selectedExam) return true;
        // Check if student belongs to the class of the exam (e.g. "10th A" matches "10th" + "A")
        return selectedExam.classGrade.toLowerCase().includes(s.class.toLowerCase());
    });

    // Marks entry state (keyed by studentId)
    const [tempMarks, setTempMarks] = useState({});
    const [tempAttendance, setTempAttendance] = useState({});

    // Load existing marks into state when exam/subject changes
    React.useEffect(() => {
        if (selectedExamId && selectedSubject) {
            const initialMarks = {};
            const initialAttendance = {};

            activeStudents.forEach(student => {
                const existing = marks.find(m => m.examId === selectedExamId && m.studentId === student.id);
                if (existing) {
                    initialMarks[student.id] = existing.marks[selectedSubject] !== undefined ? existing.marks[selectedSubject] : '';
                    initialAttendance[student.id] = existing.attendance?.[selectedSubject] || 'Present';
                } else {
                    initialMarks[student.id] = '';
                    initialAttendance[student.id] = 'Present';
                }
            });

            setTempMarks(initialMarks);
            setTempAttendance(initialAttendance);
        }
    }, [selectedExamId, selectedSubject, marks]);

    const handleMarkChange = (studentId, value) => {
        const maxMarks = Number(activePaper?.maxMarks || 100);
        if (value !== '' && (Number(value) < 0 || Number(value) > maxMarks)) {
            toast.error(`Marks cannot be less than 0 or greater than Maximum Marks (${maxMarks})!`);
            return;
        }
        setTempMarks(prev => ({ ...prev, [studentId]: value }));
    };

    const handleAttendanceChange = (studentId, status) => {
        setTempAttendance(prev => ({ ...prev, [studentId]: status }));
        if (status === 'Absent') {
            // Automatically set marks to 0 if absent
            setTempMarks(prev => ({ ...prev, [studentId]: 0 }));
        }
    };

    const handleSave = () => {
        if (!selectedExamId || !selectedSubject) {
            toast.error("Please select an Exam and Subject first!");
            return;
        }

        // Validate values
        const finalMarksList = activeStudents.map(student => {
            const score = tempMarks[student.id];
            const att = tempAttendance[student.id] || 'Present';
            return {
                studentId: student.id,
                studentName: student.name,
                score: score === '' ? null : Number(score),
                attendance: att
            };
        });

        onSaveMarks(selectedExamId, selectedSubject, finalMarksList);
        toast.success(`Marks sheet for ${selectedSubject} successfully compiled & saved!`);
    };

    // Printable Marksheet State
    const [reportStudent, setReportStudent] = useState(null);
    const [reportExam, setReportExam] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);

    const handleShowReportCard = (student) => {
        setReportStudent(student);
        setReportExam(selectedExam);
        setShowReportModal(true);
    };

    const handlePrintReportCard = () => {
        const printContent = document.getElementById('report-card-printable-area');
        if (!printContent) return;

        const printableHTML = `
            <html>
            <head>
                <title>Academic Transcript - ${reportStudent?.name}</title>
                <style>
                    body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; line-height: 1.5; }
                    .header { text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 20px; margin-bottom: 20px; }
                    .title { font-size: 26px; font-weight: 800; color: #0b4d3e; text-transform: uppercase; letter-spacing: 0.5px; }
                    .subtitle { font-size: 13px; color: #666; margin-top: 4px; }
                    .report-title { font-size: 18px; font-weight: bold; text-align: center; text-transform: uppercase; margin: 20px 0; background: #f1f5f9; padding: 6px; border-radius: 6px; }
                    .info-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; margin-bottom: 30px; border: 1px solid #BAE6FD; padding: 15px; border-radius: 8px; }
                    .info-label { font-weight: bold; text-transform: uppercase; font-size: 10px; color: #64748b; }
                    .info-val { font-size: 14px; font-weight: 600; margin-top: 2px; color: #1e293b; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; font-size: 13px; }
                    th { background-color: #f8fafc; font-weight: bold; text-transform: uppercase; color: #475569; }
                    .summary-box { margin-top: 30px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; display: grid; grid-template-cols: repeat(4, 1fr); text-align: center; }
                    .summary-val { font-size: 18px; font-weight: 800; color: #0b4d3e; }
                    .summary-lbl { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-top: 3px; }
                    .footer { margin-top: 60px; display: flex; justify-content: space-between; font-size: 13px; }
                    .sig-line { border-top: 1px solid #64748b; width: 180px; text-align: center; padding-top: 5px; margin-top: 40px; }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
                <script>window.print();</script>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.open();
            printWindow.document.write(printableHTML);
            printWindow.document.close();
        } else {
            window.print();
        }
    };

    const handleExportCSV = () => {
        if (!selectedExam) {
            toast.error("No exam selected for export!");
            return;
        }

        const headers = ["Roll No", "Student Name", "Class", ...availableSubjects.map(s => `${s} Marks`), "Total Scored", "Total Max", "Percentage", "Class Rank", "Overall Status"];
        const rows = activeStudents.map(student => {
            const performance = calculateStudentRank(selectedExam.id, student.id, marks, exams);
            const studentRow = [
                student.rollNumber,
                student.name,
                `${student.class} ${student.section}`,
            ];
            
            // Add subject marks
            availableSubjects.forEach(sub => {
                const mRecord = marks.find(mr => mr.examId === selectedExam.id && mr.studentId === student.id);
                studentRow.push(mRecord?.marks[sub] !== undefined ? mRecord.marks[sub] : '-');
            });

            studentRow.push(
                performance.totalScored,
                performance.totalMax,
                `${performance.percent}%`,
                performance.rank,
                performance.status
            );

            return studentRow.map(v => `"${v}"`);
        });

        const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        
        try {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `marks_report_${selectedExam.name.replace(/\s+/g, '_')}.csv`);
            link.setAttribute("target", "_blank");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success(`Successfully exported marksheets to CSV!`);
        } catch (err) {
            console.error("Export download failed", err);
            toast.error("Export failed. See console logs.");
        }
    };

    return (
        <div className="space-y-6">
            
            {/* Header / Selection Control Panel */}
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">Select Examination</label>
                        <select 
                            value={selectedExamId}
                            onChange={(e) => {
                                setSelectedExamId(e.target.value);
                                setSelectedSubject('');
                            }}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-xs font-bold text-gray-800 focus:outline-none"
                        >
                            <option value="">-- Choose Exam --</option>
                            {exams.map(e => (
                                <option key={e.id} value={e.id}>{e.name} ({e.classGrade})</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 w-full">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">Select Subject Paper</label>
                        <select 
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-xs font-bold text-gray-800 focus:outline-none"
                            disabled={!selectedExamId}
                        >
                            <option value="">-- Choose Subject --</option>
                            {availableSubjects.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto shrink-0">
                        {selectedExam && (
                            <button 
                                onClick={() => onTogglePublish(selectedExam.id)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all flex-1 md:flex-none ${
                                    selectedExam.published 
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                }`}
                            >
                                {selectedExam.published ? '✅ Results Published' : '🛑 Results Unpublished'}
                            </button>
                        )}
                        <button 
                            onClick={handleExportCSV}
                            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex-1 md:flex-none"
                            disabled={!selectedExam}
                        >
                            Excel CSV Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Result Sheet Table */}
            {selectedExamId && selectedSubject ? (
                <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
                    {/* Header bar of Table */}
                    <div className="bg-slate-900 text-white p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                            <h4 className="font-bold text-sm tracking-tight uppercase flex items-center gap-2">
                                <ClipboardList size={18} className="text-[#ffd700]" />
                                MARKS & EVALUATION ENTRY FOR {selectedSubject}
                            </h4>
                            <p className="text-xs text-gray-300">
                                Target Class: {selectedExam?.classGrade} • Maximum Marks: {activePaper?.maxMarks || 100} • Passing Marks: {activePaper?.passMarks || 33}
                            </p>
                        </div>
                        
                        <div className="relative w-full md:w-64">
                            <input 
                                type="text"
                                placeholder="Filter student list..."
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-white text-white placeholder-gray-400"
                            />
                        </div>
                    </div>

                    {/* Table of students */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-400 border-b border-border uppercase font-black text-[9px] tracking-wider">
                                    <th className="py-3 px-6">Roll No</th>
                                    <th className="py-3 px-4">Student Name</th>
                                    <th className="py-3 px-4 text-center">Attendance Status</th>
                                    <th className="py-3 px-4 text-center">Marks Obtained</th>
                                    <th className="py-3 px-4 text-center">Auto-Grade</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                    <th className="py-3 px-6 text-right">Academic Report</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeStudents
                                    .filter(st => st.name.toLowerCase().includes(studentSearch.toLowerCase()))
                                    .map(student => {
                                        const scoreValue = tempMarks[student.id];
                                        const attendanceValue = tempAttendance[student.id] || 'Present';
                                        const maxScore = Number(activePaper?.maxMarks || 100);
                                        const passScore = Number(activePaper?.passMarks || 33);
                                        const isAbsent = attendanceValue === 'Absent';

                                        // dynamically compute grade & status
                                        const currentGrade = isAbsent ? 'F' : calculateGrade(scoreValue, maxScore);
                                        const passed = isAbsent ? false : isPass(scoreValue, maxScore, passScore);

                                        return (
                                            <tr key={student.id} className="border-b border-border hover:bg-slate-50 transition-colors">
                                                <td className="py-3.5 px-6 font-mono font-bold text-gray-900">#{student.rollNumber}</td>
                                                <td className="py-3.5 px-4 font-bold text-gray-800">{student.name}</td>
                                                
                                                <td className="py-3.5 px-4 text-center">
                                                    <div className="inline-flex rounded-lg p-0.5 bg-gray-100 border border-gray-200">
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleAttendanceChange(student.id, 'Present')}
                                                            className={`px-3 py-1 text-[10px] font-bold rounded-md uppercase transition-all ${
                                                                attendanceValue === 'Present' 
                                                                ? 'bg-white text-emerald-800 shadow-xs border border-emerald-100' 
                                                                : 'text-gray-400 hover:text-gray-600'
                                                            }`}
                                                        >
                                                            Present
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleAttendanceChange(student.id, 'Absent')}
                                                            className={`px-3 py-1 text-[10px] font-bold rounded-md uppercase transition-all ${
                                                                attendanceValue === 'Absent' 
                                                                ? 'bg-rose-50 text-rose-700 shadow-xs border border-rose-100' 
                                                                : 'text-gray-400 hover:text-gray-600'
                                                            }`}
                                                        >
                                                            Absent
                                                        </button>
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-4 text-center">
                                                    <input 
                                                        type="number" 
                                                        disabled={isAbsent}
                                                        value={isAbsent ? 0 : (scoreValue !== undefined && scoreValue !== null ? scoreValue : '')}
                                                        onChange={(e) => handleMarkChange(student.id, e.target.value)}
                                                        className={`w-20 px-2 py-1 border rounded-lg text-center font-bold text-xs focus:outline-none ${
                                                            isAbsent ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white border-border focus:border-primary focus:ring-1 focus:ring-primary/20'
                                                        }`}
                                                        placeholder={`/ ${maxScore}`}
                                                    />
                                                </td>

                                                <td className="py-3.5 px-4 text-center">
                                                    <span className={`inline-block w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                                                        currentGrade === 'A+' || currentGrade === 'A' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                                                        currentGrade === 'B' || currentGrade === 'C' ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' :
                                                        currentGrade === 'D' || currentGrade === 'E' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                                                        'bg-rose-50 text-rose-800 border border-rose-200'
                                                    }`}>
                                                        {isAbsent ? 'Abs' : currentGrade}
                                                    </span>
                                                </td>

                                                <td className="py-3.5 px-4 text-center">
                                                    {scoreValue !== '' || isAbsent ? (
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                                            passed 
                                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                                                            : 'bg-rose-50 text-rose-800 border-rose-100'
                                                        }`}>
                                                            {passed ? 'Pass' : 'Fail'}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 font-medium italic">Pending</span>
                                                    )}
                                                </td>

                                                <td className="py-3.5 px-6 text-right">
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleShowReportCard(student)}
                                                        className="p-1.5 text-[#0b4d3e] bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all"
                                                        title="Print Marksheet"
                                                    >
                                                        <Printer size={15} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer Actions */}
                    <div className="bg-gray-50 border-t border-border p-5 flex justify-between items-center">
                        <span className="text-xs text-text-light font-medium flex items-center gap-1.5">
                            <InfoIcon size={14} className="text-primary" />
                            Auto-ranks are compiled dynamically upon final saving.
                        </span>
                        
                        <button 
                            type="button" 
                            onClick={handleSave}
                            className="bg-success hover:bg-success-dark text-white text-xs font-black uppercase tracking-wider py-3 px-8 rounded-xl transition-all shadow-md hover:scale-[1.01] active:scale-[0.99]"
                        >
                            Save & Compile Results
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-border py-16 text-center shadow-sm">
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <ClipboardList size={48} className="text-gray-200" />
                        <h3 className="text-lg font-bold text-gray-800">Gradebook Entry Desk</h3>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto">Please select an Exam and specific subject paper from the controls above to upload grades, marks, and track student attendance.</p>
                    </div>
                </div>
            )}

            {/* High-Fidelity Printable Marksheet / Transcript Modal */}
            {showReportModal && reportStudent && reportExam && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-3xl w-full border border-border overflow-hidden shadow-2xl relative flex flex-col my-8">
                        
                        {/* Modal Header */}
                        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                            <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck size={16} className="text-[#ffd700]" />
                                Academic Transcript Compiler
                            </span>
                            <button 
                                onClick={() => setShowReportModal(false)}
                                className="text-gray-400 hover:text-white transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body Area */}
                        <div className="p-6 md:p-8 overflow-y-auto max-h-[70vh]">
                            <div id="report-card-printable-area" className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-sm relative overflow-hidden text-left">
                                <div className="absolute right-[-20px] bottom-[-20px] text-slate-100/40 pointer-events-none select-none">
                                    <ShieldCheck size={300} />
                                </div>

                                <div className="relative space-y-6">
                                    {/* School Letterhead */}
                                    <div className="border-b-2 border-slate-900 pb-4 text-center">
                                        <h2 className="font-serif text-2xl font-black text-slate-900 uppercase tracking-wide">Green Valley International School</h2>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Sector 12, Dwarka, New Delhi • Affiliated to CBSE Delhi</p>
                                        <p className="text-[10px] text-gray-500 font-medium">Phone: +91 11 29110444 • email: portal@greenvalley.com</p>
                                        
                                        <div className="mt-3 inline-block bg-slate-900 text-[#ffd700] text-xs font-black uppercase px-6 py-1 rounded-full tracking-wider">
                                            Official Statement of Grades
                                        </div>
                                    </div>

                                    {/* Student Info Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs">
                                        <div>
                                            <p className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Student Name</p>
                                            <p className="font-extrabold text-slate-800 mt-0.5">{reportStudent.name}</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Academic Standard</p>
                                            <p className="font-extrabold text-slate-800 mt-0.5">{reportStudent.class} {reportStudent.section}</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Enrollment Roll No</p>
                                            <p className="font-extrabold text-slate-800 mt-0.5">#{reportStudent.rollNumber}</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Examination Series</p>
                                            <p className="font-extrabold text-slate-800 mt-0.5 uppercase">{reportExam.name}</p>
                                        </div>
                                    </div>

                                    {/* Mark Details Table */}
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">Subject-wise Performance Record</h4>
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                                                    <th className="py-2.5 px-3 rounded-l-lg border-b-2 border-slate-950">Subject Paper</th>
                                                    <th className="py-2.5 px-2 border-b-2 border-slate-950 text-center">Exam Date</th>
                                                    <th className="py-2.5 px-2 border-b-2 border-slate-950 text-center">Marks Scored</th>
                                                    <th className="py-2.5 px-2 border-b-2 border-slate-950 text-center">Max Marks</th>
                                                    <th className="py-2.5 px-2 border-b-2 border-slate-950 text-center">Passing Marks</th>
                                                    <th className="py-2.5 px-3 rounded-r-lg border-b-2 border-slate-950 text-center">Letter Grade</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportExam.papers.map((paper, index) => {
                                                    const mRecord = marks.find(mr => mr.examId === reportExam.id && mr.studentId === reportStudent.id);
                                                    const mark = mRecord?.marks[paper.subject];
                                                    const attendance = mRecord?.attendance?.[paper.subject] || 'Present';
                                                    const isAbsent = attendance === 'Absent';
                                                    const scoreLabel = isAbsent ? 'Absent' : (mark !== undefined ? mark : '-');
                                                    const currentGrade = isAbsent ? 'F' : calculateGrade(mark, paper.maxMarks);

                                                    return (
                                                        <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                            <td className="py-3 px-3 font-bold text-slate-800 uppercase text-[11px]">{paper.subject}</td>
                                                            <td className="py-3 px-2 text-center text-gray-500 font-mono">{paper.date}</td>
                                                            <td className={`py-3 px-2 text-center font-extrabold ${isAbsent ? 'text-rose-600' : 'text-slate-900 font-mono'}`}>{scoreLabel}</td>
                                                            <td className="py-3 px-2 text-center text-slate-700 font-mono">{paper.maxMarks}</td>
                                                            <td className="py-3 px-2 text-center text-slate-400 font-mono">{paper.passMarks}</td>
                                                            <td className="py-3 px-3 text-center">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                                                    currentGrade === 'A+' || currentGrade === 'A' ? 'text-emerald-800 bg-emerald-50' :
                                                                    currentGrade === 'B' || currentGrade === 'C' ? 'text-indigo-800 bg-indigo-50' :
                                                                    'text-rose-800 bg-rose-50'
                                                                }`}>{currentGrade}</span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Report Summary Details (Rank, Percent, Pass/Fail) */}
                                    {(() => {
                                        const rankInfo = calculateStudentRank(reportExam.id, reportStudent.id, marks, exams);
                                        return (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900 text-[#ffd700] rounded-xl p-5 text-center">
                                                <div>
                                                    <p className="text-[18px] font-black">{rankInfo.totalScored} / {rankInfo.totalMax}</p>
                                                    <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-0.5">Aggregate Marks</p>
                                                </div>
                                                <div>
                                                    <p className="text-[18px] font-black">{rankInfo.percent}%</p>
                                                    <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-0.5">Grade Percentage</p>
                                                </div>
                                                <div>
                                                    <p className="text-[18px] font-black">Rank #{rankInfo.rank}</p>
                                                    <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-0.5">Standard Class Rank</p>
                                                </div>
                                                <div>
                                                    <p className={`text-[18px] font-black ${rankInfo.status === 'Pass' ? 'text-emerald-400' : 'text-rose-400'}`}>{rankInfo.status}</p>
                                                    <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-0.5">Statement Result</p>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Signatures */}
                                    <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-slate-200">
                                        <div className="text-left">
                                            <div className="sig-line">
                                                <p className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Class Teacher</p>
                                                <p className="text-[8px] text-gray-400">Priya Verma, Senior Advisor</p>
                                            </div>
                                        </div>
                                        <div className="text-center flex items-center justify-center">
                                            <span className="text-[10px] font-bold font-mono text-slate-300 border border-slate-200 p-2 uppercase tracking-widest">Green Valley Seal</span>
                                        </div>
                                        <div className="flex flex-col items-end justify-end">
                                            <div className="sig-line">
                                                <p className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Academic Registrar</p>
                                                <p className="text-[8px] text-gray-400">Official Principal Board Sign</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-gray-50 border-t border-border px-6 py-4 flex justify-between">
                            <span className="text-[10px] font-medium text-text-light flex items-center">
                                Compiled live on {new Date().toISOString().split('T')[0]} via Academic Portal.
                            </span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setShowReportModal(false)}
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold uppercase rounded-lg transition-all"
                                >
                                    Close Sheet
                                </button>
                                <button 
                                    onClick={handlePrintReportCard}
                                    className="px-4 py-2 bg-success hover:bg-success-dark text-white text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                                >
                                    <Printer size={14} />
                                    Print Transcript
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper Icon
const InfoIcon = ({ size, className }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);
