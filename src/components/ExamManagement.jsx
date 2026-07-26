import React, { useState, useEffect } from 'react';
import { 
    Plus, Trash2, Edit2, Calendar, Clock, BookOpen, ChevronDown, ChevronUp, 
    CheckCircle, AlertCircle, Sparkles, PlusCircle, Award, ClipboardList, 
    MapPin, BarChart3, Bell, Search, Printer, Info, RefreshCw, X, HelpCircle,
    User, CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';

// Modular Imports
import { 
    EXAMS_STORAGE_KEY, 
    HALLS_STORAGE_KEY, 
    MARKS_STORAGE_KEY, 
    defaultExams, 
    defaultStudents, 
    defaultHallAllocations, 
    defaultMarks,
    calculateGrade,
    isPass,
    calculateStudentRank
} from './ExamMockData';

import { ExamAdmitCard } from './ExamAdmitCard';
import { ExamResultSheet } from './ExamResultSheet';
import { ExamAnalytics } from './ExamAnalytics';

export const ExamManagement = ({ role = 'school_admin', activeSchool, currentUser, users = [] }) => {
    // Primary Persistent States
    const [exams, setExams] = useState([]);
    const [allocations, setAllocations] = useState([]);
    const [marks, setMarks] = useState([]);
    const [students, setStudents] = useState([]);

    // UI/Nav States
    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, schedule, hall-admit, marks-entry, calendar
    const [isAdding, setIsAdding] = useState(false);
    const [editingExamId, setEditingExamId] = useState(null);
    const [expandedExam, setExpandedExam] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [classFilter, setClassFilter] = useState('All');

    // Calendar view states
    const [calendarMonth, setCalendarMonth] = useState(8); // September (Index 8)
    const [calendarYear, setCalendarYear] = useState(2026);

    // Exam Form state
    const [examName, setExamName] = useState('');
    const [classGrade, setClassGrade] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [papers, setPapers] = useState([
        { subject: '', date: '', startTime: '09:00', endTime: '12:00', maxMarks: 100, passMarks: 33 }
    ]);

    // Initialize state from LocalStorage on mount
    useEffect(() => {
        const storedExams = localStorage.getItem(EXAMS_STORAGE_KEY);
        const storedHalls = localStorage.getItem(HALLS_STORAGE_KEY);
        const storedMarks = localStorage.getItem(MARKS_STORAGE_KEY);

        // Load or seed Exams
        if (storedExams) {
            try { setExams(JSON.parse(storedExams)); } catch(e) { setExams(defaultExams); }
        } else {
            setExams(defaultExams);
            localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(defaultExams));
        }

        // Load or seed Hall Allocations
        if (storedHalls) {
            try { setAllocations(JSON.parse(storedHalls)); } catch(e) { setAllocations(defaultHallAllocations); }
        } else {
            setAllocations(defaultHallAllocations);
            localStorage.setItem(HALLS_STORAGE_KEY, JSON.stringify(defaultHallAllocations));
        }

        // Load or seed Student Marks
        if (storedMarks) {
            try { setMarks(JSON.parse(storedMarks)); } catch(e) { setMarks(defaultMarks); }
        } else {
            setMarks(defaultMarks);
            localStorage.setItem(MARKS_STORAGE_KEY, JSON.stringify(defaultMarks));
        }

        // Build list of students from App users list if possible, otherwise use defaultStudents seed
        const appStudents = users.filter(u => u.role === 'Student');
        if (appStudents.length > 0) {
            // Map App user format to exam students format
            const mapped = appStudents.map(s => ({
                id: s.id,
                name: s.name,
                class: s.class || '10th',
                section: s.section || 'A',
                rollNumber: s.rollNumber || '01',
                email: s.email || `${s.name.toLowerCase().replace(/\s+/g, '')}@school.com`
            }));
            setStudents(mapped);
        } else {
            setStudents(defaultStudents);
        }
    }, [users]);

    // Save helpers
    const saveExams = (updated) => {
        setExams(updated);
        localStorage.setItem(EXAMS_STORAGE_KEY, JSON.stringify(updated));
    };

    const saveAllocations = (updated) => {
        setAllocations(updated);
        localStorage.setItem(HALLS_STORAGE_KEY, JSON.stringify(updated));
    };

    const saveMarks = (updated) => {
        setMarks(updated);
        localStorage.setItem(MARKS_STORAGE_KEY, JSON.stringify(updated));
    };

    // --- Core Action: Add/Edit Exam ---
    const handleAddPaperRow = () => {
        setPapers([...papers, { subject: '', date: '', startTime: '09:00', endTime: '12:00', maxMarks: 100, passMarks: 33 }]);
    };

    const handleRemovePaperRow = (index) => {
        if (papers.length === 1) {
            toast.error("At least one exam paper schedule is required!");
            return;
        }
        setPapers(papers.filter((_, i) => i !== index));
    };

    const handlePaperChange = (index, field, value) => {
        const updated = [...papers];
        updated[index][field] = value;
        // Auto-generate passing mark to 33% of max marks as default
        if (field === 'maxMarks') {
            updated[index]['passMarks'] = Math.round(Number(value) * 0.33);
        }
        setPapers(updated);
    };

    const handleSaveExam = (e) => {
        e.preventDefault();
        const nameVal = examName.trim();
        const gradeVal = classGrade.trim();

        if (!nameVal) {
            toast.error("Exam Name is required!");
            return;
        }
        if (nameVal.length < 3 || nameVal.length > 100) {
            toast.error("Exam Name must be between 3 and 100 characters!");
            return;
        }
        if (!gradeVal) {
            toast.error("Class Grade is required!");
            return;
        }
        if (gradeVal.length < 2 || gradeVal.length > 20) {
            toast.error("Class Grade must be between 2 and 20 characters!");
            return;
        }
        if (!startDate || !endDate) {
            toast.error("Start Date and End Date are required!");
            return;
        }
        if (new Date(endDate) < new Date(startDate)) {
            toast.error("End Date cannot be before Start Date!");
            return;
        }

        // Validate papers list
        for (let i = 0; i < papers.length; i++) {
            const p = papers[i];
            const subVal = p.subject.trim();
            if (!subVal || !p.date || !p.startTime || !p.endTime) {
                toast.error(`Subject and timing details are missing for paper #${i+1}!`);
                return;
            }
            if (subVal.length < 2 || subVal.length > 50) {
                toast.error(`Subject name must be between 2 and 50 characters for paper #${i+1}!`);
                return;
            }
            const maxM = Number(p.maxMarks);
            const passM = Number(p.passMarks);
            if (isNaN(maxM) || maxM <= 0 || maxM > 500) {
                toast.error(`Max Marks must be a positive integer between 1 and 500 for paper #${i+1}!`);
                return;
            }
            if (isNaN(passM) || passM <= 0 || passM > maxM) {
                toast.error(`Pass Marks must be a positive integer between 1 and Max Marks for paper #${i+1}!`);
                return;
            }
            if (new Date(p.date) < new Date(startDate) || new Date(p.date) > new Date(endDate)) {
                toast.error(`Date for paper #${i+1} must be within the exam period (${startDate} to ${endDate})!`);
                return;
            }
        }

        let updatedExams = [];
        if (editingExamId) {
            // Edit existing exam
            updatedExams = exams.map(ex => ex.id === editingExamId ? {
                ...ex,
                name: nameVal,
                classGrade: gradeVal,
                startDate,
                endDate,
                papers: [...papers].sort((a,b) => new Date(a.date) - new Date(b.date))
            } : ex);
            toast.success(`Exam schedule "${nameVal}" successfully updated!`);
        } else {
            // Create new exam
            const newExam = {
                id: `exam-${Date.now()}`,
                name: nameVal,
                classGrade: gradeVal,
                startDate,
                endDate,
                published: false,
                papers: [...papers].sort((a,b) => new Date(a.date) - new Date(b.date))
            };
            updatedExams = [newExam, ...exams];
            toast.success(`Exam schedule "${nameVal}" successfully published!`);
        }

        saveExams(updatedExams);
        resetExamForm();
    };

    const handleEditExamClick = (exam) => {
        setExamName(exam.name || '');
        setClassGrade(exam.classGrade || '');
        setStartDate(exam.startDate || '');
        setEndDate(exam.endDate || '');
        setPapers(exam.papers || [{ subject: '', date: '', startTime: '09:00', endTime: '12:00', maxMarks: 100, passMarks: 33 }]);
        setEditingExamId(exam.id);
        setIsAdding(true);
    };

    const handleDeleteExam = (id) => {
        if (window.confirm("Are you sure you want to permanently delete this examination schedule and date sheet?")) {
            const updated = exams.filter(e => e.id !== id);
            saveExams(updated);
            
            // Clean up related marks and allocations
            const filteredAlloc = allocations.filter(a => a.examId !== id);
            saveAllocations(filteredAlloc);
            const filteredMarks = marks.filter(m => m.examId !== id);
            saveMarks(filteredMarks);

            toast.success("Exam schedule and related grades deleted.");
        }
    };

    const resetExamForm = () => {
        setExamName('');
        setClassGrade('');
        setStartDate('');
        setEndDate('');
        setPapers([{ subject: '', date: '', startTime: '09:00', endTime: '12:00', maxMarks: 100, passMarks: 33 }]);
        setEditingExamId(null);
        setIsAdding(false);
    };

    // --- Core Action: Hall Allocations ---
    const handleAddAllocation = (newAlloc) => {
        const updated = [newAlloc, ...allocations];
        saveAllocations(updated);
    };

    // --- Core Action: Marks Compilation & Results Publishing ---
    const handleSaveMarksList = (examId, subject, list) => {
        let updatedMarks = [...marks];

        list.forEach(item => {
            const index = updatedMarks.findIndex(m => m.examId === examId && m.studentId === item.studentId);
            if (index !== -1) {
                // Update existing record
                updatedMarks[index].marks[subject] = item.score;
                if (!updatedMarks[index].attendance) {
                    updatedMarks[index].attendance = {};
                }
                updatedMarks[index].attendance[subject] = item.attendance;
            } else {
                // Create new record
                const newRecord = {
                    examId,
                    studentId: item.studentId,
                    studentName: item.studentName,
                    attendance: { [subject]: item.attendance },
                    marks: { [subject]: item.score }
                };
                updatedMarks.push(newRecord);
            }
        });

        saveMarks(updatedMarks);
    };

    const handleTogglePublishResults = (examId) => {
        const updated = exams.map(e => {
            if (e.id === examId) {
                const newStatus = !e.published;
                toast.success(newStatus ? `Results for ${e.name} are now published to Students!` : `Results for ${e.name} are now unpublished.`);
                return { ...e, published: newStatus };
            }
            return e;
        });
        saveExams(updated);
    };

    // --- Search & Filter Computations (Schedules) ---
    const uniqueClasses = ['All', ...new Set(exams.map(e => e.classGrade))];
    const filteredExams = exams.filter(exam => {
        const matchesSearch = exam.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              exam.classGrade.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesClass = classFilter === 'All' || exam.classGrade === classFilter;
        return matchesSearch && matchesClass;
    });

    // --- Calendar View Builder helper ---
    const getDaysInMonth = (month, year) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month, year) => {
        return new Date(year, month, 1).getDay();
    };

    const handleMonthChange = (direction) => {
        if (direction === 'prev') {
            if (calendarMonth === 0) {
                setCalendarMonth(11);
                setCalendarYear(calendarYear - 1);
            } else {
                setCalendarMonth(calendarMonth - 1);
            }
        } else {
            if (calendarMonth === 11) {
                setCalendarMonth(0);
                setCalendarYear(calendarYear + 1);
            } else {
                setCalendarMonth(calendarMonth + 1);
            }
        }
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];

    // Build lists of papers on calendar day
    const getPapersOnDate = (day) => {
        const formattedDate = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const matchingPapers = [];
        
        exams.forEach(exam => {
            exam.papers.forEach(p => {
                if (p.date === formattedDate) {
                    matchingPapers.push({
                        examName: exam.name,
                        classGrade: exam.classGrade,
                        subject: p.subject,
                        time: `${p.startTime} - ${p.endTime}`
                    });
                }
            });
        });

        return matchingPapers;
    };

    // ==========================================
    // 👨🎓 STUDENT VIEW
    // ==========================================
    const renderStudentView = () => {
        // Find current student in database (fall back to Rahul Gupta)
        const targetStudent = students.find(
            s => s.email?.toLowerCase() === currentUser?.email?.toLowerCase() || s.id === 'stud-1'
        );

        if (!targetStudent) {
            return (
                <div className="bg-white rounded-2xl border border-border p-12 text-center text-gray-500">
                    Student profile not found. Please log in as a student to access the results dashboard.
                </div>
            );
        }

        // Get exams corresponding to student's class
        const studentExams = exams.filter(e => 
            e.classGrade.toLowerCase().includes(targetStudent.class.toLowerCase())
        );

        // Filter published results
        const publishedExams = studentExams.filter(e => e.published);

        // Prepare charts comparison data for their latest published exam results
        const latestExam = publishedExams[0];
        const studentMarksRecord = marks.find(
            m => m.examId === latestExam?.id && m.studentId === targetStudent.id
        );

        const comparisonChartData = [];
        if (latestExam && studentMarksRecord) {
            latestExam.papers.forEach(p => {
                const mark = studentMarksRecord.marks[p.subject] || 0;
                
                // Calculate class average
                const subjectMarks = marks.filter(m => m.examId === latestExam.id);
                let total = 0, count = 0;
                subjectMarks.forEach(sm => {
                    const sc = sm.marks[p.subject];
                    if (sc !== undefined && sc !== '') {
                        total += Number(sc);
                        count++;
                    }
                });
                const average = count > 0 ? Math.round(total / count) : 0;

                comparisonChartData.push({
                    subject: p.subject,
                    'My Score': mark,
                    'Class Average': average,
                    'Passing Mark': p.passMarks
                });
            });
        }

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Header Welcome banner */}
                <div className="bg-gradient-to-r from-[#0b4d3e] to-indigo-900 text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md">
                    <div className="space-y-1">
                        <span className="bg-white/25 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-200">Student Examination Desk</span>
                        <h2 className="text-2xl font-serif font-bold">Welcome Back, {targetStudent.name}!</h2>
                        <p className="text-gray-200 text-xs font-medium">Standard Class: {targetStudent.class} {targetStudent.section} • Roll Registration No: #{targetStudent.rollNumber}</p>
                    </div>
                    
                    <span className="bg-white/10 px-4 py-2 border border-white/10 text-xs font-bold rounded-xl flex items-center gap-2">
                        <Award size={15} className="text-[#ffd700]" />
                        CGPA Evaluation Active
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Student Date Sheet */}
                    <div className="bg-white rounded-2xl border border-border p-6 shadow-sm lg:col-span-7 space-y-4">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3 flex items-center gap-2">
                            <CalendarDays size={16} className="text-primary" />
                            My Exam Schedules & Date sheets
                        </h3>

                        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                            {studentExams.map(ex => (
                                <div key={ex.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="font-extrabold text-xs text-gray-900 uppercase">{ex.name}</span>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                            ex.published ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                                        }`}>
                                            {ex.published ? 'Results Live' : 'Schedules Released'}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {ex.papers.map((p, idx) => {
                                            const matchedAlloc = allocations.find(
                                                a => a.examId === ex.id && a.subject.toLowerCase() === p.subject.toLowerCase()
                                            );
                                            return (
                                                <div key={idx} className="bg-white border border-gray-100 p-3 rounded-lg text-[11px] space-y-1">
                                                    <p className="font-bold text-slate-800 uppercase">{p.subject}</p>
                                                    <p className="text-gray-400 font-medium">{p.date}</p>
                                                    <p className="text-gray-400 font-medium">{p.startTime} - {p.endTime}</p>
                                                    <div className="pt-1.5 border-t border-dashed border-gray-100 flex justify-between text-[10px]">
                                                        <span className="text-primary font-bold">Max: {p.maxMarks}M</span>
                                                        <span className="text-emerald-700 bg-emerald-50 px-1.5 rounded font-bold font-mono">
                                                            {matchedAlloc?.roomNumber || 'TBD'}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {studentExams.length === 0 && (
                                <p className="text-xs text-gray-400 italic text-center py-6">No schedules configured for class {targetStudent.class}.</p>
                            )}
                        </div>
                    </div>

                    {/* Student Admit Card Generator Shortcut */}
                    <div className="bg-white rounded-2xl border border-border p-6 shadow-sm lg:col-span-5 flex flex-col justify-between">
                        <div className="space-y-3">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3 flex items-center gap-2">
                                <Printer size={16} className="text-primary" />
                                Hall Tickets / Admit Cards
                            </h3>
                            <p className="text-xs text-text-light leading-relaxed">Download and print your official hall entry slips for scheduled examinations. Entry requires physical signature verification.</p>
                        </div>

                        {studentExams.length > 0 ? (
                            <div className="mt-4 p-4 bg-[#0b4d3e]/5 rounded-xl border border-[#0b4d3e]/15 flex items-center justify-between gap-3">
                                <div className="space-y-1 text-left">
                                    <p className="text-xs font-black text-[#0b4d3e] uppercase">{studentExams[0].name}</p>
                                    <p className="text-[10px] text-gray-500 font-medium">Standard Class: {targetStudent.class}</p>
                                </div>
                                
                                <button 
                                    onClick={() => {
                                        // Change tab and load student admit card view
                                        setActiveTab('hall-admit');
                                    }}
                                    className="bg-[#0b4d3e] hover:bg-[#073026] text-white font-black text-[10px] uppercase tracking-wider py-2 px-4 rounded-lg transition-all shadow-xs shrink-0"
                                >
                                    Get Slips
                                </button>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 italic text-center py-6 mt-4">No exams scheduled.</p>
                        )}
                    </div>
                </div>

                {/* My Latest Results & Performance Chart */}
                {latestExam && studentMarksRecord ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* Comparison Recharts Chart */}
                        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm lg:col-span-8">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3 mb-6 flex items-center gap-2">
                                <BarChart3 size={16} className="text-emerald-700" />
                                Performance Radar compared to Class Average
                            </h3>
                            
                            <div className="h-64 w-full text-xs">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={comparisonChartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="subject" tickLine={false} />
                                        <YAxis tickLine={false} />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="My Score" stroke="#0b4d3e" strokeWidth={3} activeDot={{ r: 8 }} />
                                        <Line type="monotone" dataKey="Class Average" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" />
                                        <Line type="monotone" dataKey="Passing Mark" stroke="#ef4444" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Statement of Marks Cards */}
                        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm lg:col-span-4 space-y-4">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3 flex items-center gap-2">
                                <Award size={16} className="text-[#ffd700]" />
                                Latest Transcripts Result Cards
                            </h3>

                            <div className="space-y-2.5">
                                {comparisonChartData.map((data, idx) => {
                                    const passed = data['My Score'] >= data['Passing Mark'];
                                    return (
                                        <div key={idx} className="flex justify-between items-center p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
                                            <div>
                                                <p className="text-xs font-black text-gray-900 uppercase">{data.subject}</p>
                                                <p className="text-[10px] text-gray-400">Class Average: {data['Class Average']}M</p>
                                            </div>
                                            
                                            <div className="text-right flex items-center gap-3">
                                                <div className="text-right">
                                                    <p className="text-xs font-black text-[#0b4d3e]">{data['My Score']} Marks</p>
                                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${
                                                        passed ? 'text-emerald-700' : 'text-rose-700'
                                                    }`}>
                                                        {passed ? 'Pass' : 'Fail'}
                                                    </span>
                                                </div>
                                                
                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[11px] ${
                                                    passed ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                                                }`}>
                                                    {calculateGrade(data['My Score'], latestExam.papers[idx]?.maxMarks || 100)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Quick Printable Sheet Trigger */}
                                <div className="pt-4 border-t border-gray-100 flex justify-end">
                                    <button 
                                        onClick={() => {
                                            // Activate Result sheet compilation report modal preview
                                            setActiveTab('marks-entry');
                                        }}
                                        className="text-[#0b4d3e] hover:underline font-bold text-xs uppercase flex items-center gap-1"
                                    >
                                        <Printer size={13} />
                                        Print Full Transcript Report
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-border py-12 text-center text-xs text-gray-400 shadow-sm">
                        No results have been published yet for class {targetStudent.class}.
                    </div>
                )}
            </div>
        );
    };

    // ==========================================
    // 👨🏫 TEACHER VIEW
    // ==========================================
    const renderTeacherView = () => {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Greeting Banner */}
                <div className="bg-gradient-to-r from-blue-900 to-[#0b4d3e] text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md">
                    <div className="space-y-1">
                        <span className="bg-white/25 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-200">Teacher Evaluation Center</span>
                        <h2 className="text-2xl font-serif font-bold">Welcome Back, Priya Verma!</h2>
                        <p className="text-gray-200 text-xs font-medium">Senior Board Evaluator • Green Valley Physics & Science Faculty</p>
                    </div>
                    
                    <span className="bg-white/10 px-4 py-2 border border-white/10 text-xs font-bold rounded-xl flex items-center gap-2">
                        <ClipboardList size={15} className="text-[#ffd700]" />
                        Grading Desk Active
                    </span>
                </div>

                {/* Sub tab selections */}
                <div className="flex border-b border-border gap-6">
                    <button 
                        onClick={() => setActiveTab('marks-entry')}
                        className={`pb-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                            activeTab === 'marks-entry' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        Gradebook Marks Uploading
                    </button>
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`pb-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                            activeTab === 'dashboard' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        Student Performance Analytics
                    </button>
                    <button 
                        onClick={() => setActiveTab('schedule')}
                        className={`pb-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                            activeTab === 'schedule' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        School Date sheets
                    </button>
                </div>

                {/* Main Teacher Content Router */}
                <div>
                    {activeTab === 'marks-entry' && (
                        <ExamResultSheet 
                            exams={exams} 
                            students={students} 
                            marks={marks} 
                            onSaveMarks={handleSaveMarksList} 
                            onTogglePublish={handleTogglePublishResults} 
                        />
                    )}
                    {activeTab === 'dashboard' && (
                        <ExamAnalytics 
                            exams={exams} 
                            students={students} 
                            marks={marks} 
                        />
                    )}
                    {activeTab === 'schedule' && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Global Examination Date-Sheets</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {exams.map(exam => (
                                    <div key={exam.id} className="bg-white border border-border p-5 rounded-2xl shadow-xs space-y-3">
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="font-bold text-xs text-gray-900 uppercase">{exam.name}</span>
                                            <span className="text-[10px] font-black text-primary uppercase bg-primary/5 px-2 py-0.5 rounded">{exam.classGrade}</span>
                                        </div>
                                        <div className="space-y-2">
                                            {exam.papers.map((p, index) => (
                                                <div key={index} className="flex justify-between items-center text-xs">
                                                    <span className="font-semibold text-gray-700">{p.subject}</span>
                                                    <span className="text-gray-400">{p.date} • {p.startTime} - {p.endTime}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // ==========================================
    // 📊 SCHOOL ADMIN / SUPER ADMIN SUITE
    // ==========================================
    const renderAdminSuite = () => {
        return (
            <div className="space-y-8">
                
                {/* Elegant Top Tab Navigation panel */}
                <div className="flex flex-wrap border-b border-border gap-x-8 gap-y-2.5 pb-0.5">
                    <button 
                        onClick={() => { setActiveTab('dashboard'); setIsAdding(false); }}
                        className={`pb-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 ${
                            activeTab === 'dashboard' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        <BarChart3 size={15} />
                        📊 Dashboard & Analytics
                    </button>
                    <button 
                        onClick={() => { setActiveTab('schedule'); }}
                        className={`pb-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 ${
                            activeTab === 'schedule' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        <Calendar size={15} />
                        📅 Exam Schedules (Date Sheet)
                    </button>
                    <button 
                        onClick={() => { setActiveTab('calendar'); setIsAdding(false); }}
                        className={`pb-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 ${
                            activeTab === 'calendar' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        <CalendarDays size={15} />
                        🗓️ Calendar View
                    </button>
                    <button 
                        onClick={() => { setActiveTab('hall-admit'); setIsAdding(false); }}
                        className={`pb-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 ${
                            activeTab === 'hall-admit' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        <MapPin size={15} />
                        🎟️ Room Allocations & Slips
                    </button>
                    <button 
                        onClick={() => { setActiveTab('marks-entry'); setIsAdding(false); }}
                        className={`pb-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 ${
                            activeTab === 'marks-entry' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        <ClipboardList size={15} />
                        📋 Result Grades Entry
                    </button>
                </div>

                {/* Sub Tab Routing content */}
                <div className="animate-in fade-in duration-200">
                    
                    {/* Tab 1: Dashboard & Analytics */}
                    {activeTab === 'dashboard' && (
                        <ExamAnalytics 
                            exams={exams} 
                            students={students} 
                            marks={marks} 
                        />
                    )}

                    {/* Tab 2: Exam Schedules & Forms */}
                    {activeTab === 'schedule' && (
                        <div className="space-y-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
                                <div className="space-y-1 text-left">
                                    <h3 className="text-base font-black text-slate-900 uppercase tracking-widest">
                                        Academic Examination Date sheets & Timetable
                                    </h3>
                                    <p className="text-xs text-text-light">Create, edit, and schedule official syllabus paper dates and maximum marks threshold.</p>
                                </div>
                                <button 
                                    onClick={() => {
                                        if (isAdding) resetExamForm();
                                        else setIsAdding(true);
                                    }} 
                                    className="bg-primary hover:bg-primary-dark text-white font-black text-xs uppercase tracking-widest py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shrink-0 border-2 border-transparent hover:scale-[1.01] active:scale-[0.99]"
                                >
                                    <Plus size={15} />
                                    {isAdding ? 'Cancel / Show List' : 'Add New Exam'}
                                </button>
                            </div>

                            <AnimatePresence mode="wait">
                                {isAdding ? (
                                    // Add/Edit Exam Form Panel
                                    <motion.div 
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -15 }}
                                        className="bg-white rounded-3xl border border-border shadow-md p-6 md:p-8"
                                    >
                                        <h3 className="text-sm font-black text-gray-900 flex items-center gap-2 mb-6 border-b border-border pb-3 uppercase">
                                            <Sparkles size={18} className="text-primary animate-bounce" />
                                            {editingExamId ? 'Update Exam Schedule Configuration' : 'Configure New Examination Schedule'}
                                        </h3>

                                        <form onSubmit={handleSaveExam} className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div className="space-y-1.5 md:col-span-2 text-left">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Exam Name</label>
                                                    <input 
                                                        type="text"
                                                        placeholder="e.g. Mid-Term Assessment, Final Exams"
                                                        value={examName}
                                                        onChange={(e) => setExamName(e.target.value)}
                                                        className="w-full px-4 py-3 bg-gray-50 border border-border rounded-xl text-xs font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                                    />
                                                </div>

                                                <div className="space-y-1.5 text-left">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Target Class</label>
                                                    <select 
                                                        value={classGrade}
                                                        onChange={(e) => setClassGrade(e.target.value)}
                                                        className="w-full px-4 py-3 bg-gray-50 border border-border rounded-xl text-xs font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                                    >
                                                        <option value="">Select Class</option>
                                                        {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(c => (
                                                            <option key={c} value={c}>{c}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-left">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Start Date</label>
                                                        <input 
                                                            type="date"
                                                            value={startDate}
                                                            onChange={(e) => setStartDate(e.target.value)}
                                                            className="w-full px-3 py-3 bg-gray-50 border border-border rounded-xl text-xs font-bold focus:outline-none focus:border-primary"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">End Date</label>
                                                        <input 
                                                            type="date"
                                                            value={endDate}
                                                            onChange={(e) => setEndDate(e.target.value)}
                                                            className="w-full px-3 py-3 bg-gray-50 border border-border rounded-xl text-xs font-bold focus:outline-none focus:border-primary"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Date Sheet Papers Configurator */}
                                            <div className="border border-border rounded-2xl overflow-hidden bg-gray-50/50">
                                                <div className="bg-gray-100/80 px-6 py-4 flex items-center justify-between border-b border-border">
                                                    <span className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                                        <BookOpen size={14} className="text-primary" />
                                                        Scheduled Papers Details
                                                    </span>
                                                    <button 
                                                        type="button" 
                                                        onClick={handleAddPaperRow}
                                                        className="text-primary hover:text-primary-dark font-black text-xs flex items-center gap-1 hover:underline uppercase tracking-wider"
                                                    >
                                                        <PlusCircle size={14} />
                                                        Add Subject Paper
                                                    </button>
                                                </div>

                                                <div className="p-4 md:p-6 space-y-4">
                                                    {papers.map((paper, index) => (
                                                        <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-white p-4 rounded-xl border border-border shadow-xs text-left">
                                                            <div className="md:col-span-3 space-y-1">
                                                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Subject Name</label>
                                                                <input 
                                                                    type="text"
                                                                    placeholder="e.g. Mathematics"
                                                                    value={paper.subject}
                                                                    onChange={(e) => handlePaperChange(index, 'subject', e.target.value)}
                                                                    className="w-full px-3 py-2 border border-border rounded-lg text-xs font-medium focus:outline-none focus:border-primary"
                                                                />
                                                            </div>

                                                            <div className="md:col-span-3 space-y-1">
                                                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Exam Date</label>
                                                                <input 
                                                                    type="date"
                                                                    value={paper.date}
                                                                    onChange={(e) => handlePaperChange(index, 'date', e.target.value)}
                                                                    className="w-full px-3 py-2 border border-border rounded-lg text-xs font-bold focus:outline-none font-mono"
                                                                />
                                                            </div>

                                                            <div className="md:col-span-2 space-y-1">
                                                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Start Time</label>
                                                                <input 
                                                                    type="time"
                                                                    value={paper.startTime}
                                                                    onChange={(e) => handlePaperChange(index, 'startTime', e.target.value)}
                                                                    className="w-full px-3 py-2 border border-border rounded-lg text-xs font-medium focus:outline-none"
                                                                />
                                                            </div>

                                                            <div className="md:col-span-2 space-y-1">
                                                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">End Time</label>
                                                                <input 
                                                                    type="time"
                                                                    value={paper.endTime}
                                                                    onChange={(e) => handlePaperChange(index, 'endTime', e.target.value)}
                                                                    className="w-full px-3 py-2 border border-border rounded-lg text-xs font-medium focus:outline-none"
                                                                />
                                                            </div>

                                                            <div className="md:col-span-1 space-y-1">
                                                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Max Marks</label>
                                                                <input 
                                                                    type="number"
                                                                    value={paper.maxMarks}
                                                                    onChange={(e) => handlePaperChange(index, 'maxMarks', e.target.value)}
                                                                    className="w-full px-2 py-2 border border-border rounded-lg text-xs font-bold text-center focus:outline-none"
                                                                />
                                                            </div>

                                                            <div className="md:col-span-1 text-right">
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => handleRemovePaperRow(index)}
                                                                    className="p-2 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 rounded-lg transition-all w-full flex items-center justify-center h-9"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <button 
                                                    type="button"
                                                    onClick={resetExamForm}
                                                    className="w-1/3 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase rounded-xl transition-all"
                                                >
                                                    Cancel / Back
                                                </button>
                                                <button 
                                                    type="submit" 
                                                    className="w-2/3 py-3.5 bg-success hover:bg-success-dark text-white font-black text-xs rounded-xl transition-all shadow-md uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99]"
                                                >
                                                    {editingExamId ? 'Update Timetable & Save' : 'Publish & Finalize Exam Schedules'}
                                                </button>
                                            </div>
                                        </form>
                                    </motion.div>
                                ) : (
                                    // List View
                                    <div className="space-y-6">
                                        {/* Search Filter board */}
                                        <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row gap-4 items-center">
                                            <div className="relative flex-1 w-full">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                                                <input 
                                                    type="text" 
                                                    placeholder="Search exams by name, code or section..." 
                                                    value={searchQuery} 
                                                    onChange={(e) => setSearchQuery(e.target.value)} 
                                                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-border rounded-xl text-xs font-semibold focus:outline-none focus:border-primary transition-all"
                                                />
                                            </div>

                                            <div className="w-full md:w-64">
                                                <select 
                                                    value={classFilter} 
                                                    onChange={(e) => setClassFilter(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-xs font-bold text-gray-800 focus:outline-none"
                                                >
                                                    {uniqueClasses.map(cls => (
                                                        <option key={cls} value={cls}>{cls === 'All' ? 'All Classes' : `Class ${cls}`}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Lists */}
                                        <div className="space-y-4">
                                            {filteredExams.map(exam => {
                                                const isExpanded = expandedExam === exam.id;
                                                const today = new Date().toISOString().split('T')[0];
                                                let statusBadge = <span className="bg-primary/5 text-primary border border-primary/20 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">Upcoming</span>;
                                                if (today >= exam.startDate && today <= exam.endDate) {
                                                    statusBadge = <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider animate-pulse">Ongoing</span>;
                                                } else if (today > exam.endDate) {
                                                    statusBadge = <span className="bg-gray-100 text-gray-500 border border-gray-200 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">Completed</span>;
                                                }

                                                return (
                                                    <div key={exam.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-all border-l-4 border-l-primary">
                                                        <div 
                                                            onClick={() => setExpandedExam(isExpanded ? null : exam.id)}
                                                            className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-11 h-11 bg-primary/5 text-primary rounded-xl flex items-center justify-center shrink-0">
                                                                    <Calendar size={18} />
                                                                </div>
                                                                <div className="text-left">
                                                                    <div className="flex items-center gap-2">
                                                                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{exam.name}</h4>
                                                                        {statusBadge}
                                                                    </div>
                                                                    <p className="text-[11px] text-gray-500 font-medium mt-1">
                                                                        Class: <b className="text-gray-700">{exam.classGrade}</b> • {exam.startDate} to {exam.endDate} • <span className="text-primary font-bold">{exam.papers.length} Papers Scheduled</span>
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-3 self-end md:self-auto">
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleEditExamClick(exam); }}
                                                                    className="p-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"
                                                                    title="Edit Exam"
                                                                >
                                                                    <Edit2 size={14} />
                                                                </button>
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteExam(exam.id); }}
                                                                    className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all"
                                                                    title="Delete Exam"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                                <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Expanded syllabus papers details */}
                                                        {isExpanded && (
                                                            <div className="bg-gray-50 border-t border-border p-5 text-left space-y-4">
                                                                <h5 className="text-[10px] font-black text-gray-900 uppercase tracking-wider border-b border-dashed border-gray-200 pb-1 flex items-center gap-1">
                                                                    <BookOpen size={13} className="text-primary" />
                                                                    Syllabus Papers details & Maximum passing threshold
                                                                </h5>
                                                                
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    {exam.papers.map((paper, idx) => (
                                                                        <div key={idx} className="bg-white p-3.5 rounded-xl border border-border shadow-xs flex justify-between items-center text-xs">
                                                                            <div className="space-y-0.5">
                                                                                <p className="font-extrabold text-slate-800 uppercase text-[11px]">{paper.subject}</p>
                                                                                <p className="text-gray-400 font-medium font-mono">{paper.date} • {paper.startTime} - {paper.endTime}</p>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <p className="font-bold text-gray-900">Max: {paper.maxMarks} M</p>
                                                                                <p className="text-[10px] text-gray-400">Pass: {paper.passMarks} M (33%)</p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {filteredExams.length === 0 && (
                                                <div className="bg-white p-12 border border-border rounded-2xl text-center text-gray-400 italic">No exams found. Click "Add New Exam" to create schedules.</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Tab 3: Calendar View */}
                    {activeTab === 'calendar' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                                {/* Calendar Header Navigation */}
                                <div className="flex justify-between items-center mb-6">
                                    <div className="text-left">
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                                            <CalendarDays size={16} className="text-primary" />
                                            Schedules Calendar View
                                        </h3>
                                        <p className="text-xs text-text-light font-medium mt-0.5">Visually track paper dates across scheduled school months.</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => handleMonthChange('prev')}
                                            className="p-2 border border-border rounded-xl bg-gray-50 hover:bg-gray-100 transition-all font-bold text-xs"
                                        >
                                            Prev Month
                                        </button>
                                        <span className="text-sm font-black uppercase text-slate-900 font-mono">
                                            {monthNames[calendarMonth]} {calendarYear}
                                        </span>
                                        <button 
                                            onClick={() => handleMonthChange('next')}
                                            className="p-2 border border-border rounded-xl bg-gray-50 hover:bg-gray-100 transition-all font-bold text-xs"
                                        >
                                            Next Month
                                        </button>
                                    </div>
                                </div>

                                {/* Calendar grid */}
                                <div className="grid grid-cols-7 gap-2 text-center text-xs">
                                    {/* Day Labels */}
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                        <div key={d} className="font-black text-gray-400 uppercase text-[10px] tracking-widest py-2 border-b border-gray-100">
                                            {d}
                                        </div>
                                    ))}

                                    {/* Empty offsets for first day of month */}
                                    {Array.from({ length: getFirstDayOfMonth(calendarMonth, calendarYear) }).map((_, idx) => (
                                        <div key={`empty-${idx}`} className="p-4 bg-gray-50/20 border border-transparent"></div>
                                    ))}

                                    {/* Calendar Days */}
                                    {Array.from({ length: getDaysInMonth(calendarMonth, calendarYear) }).map((_, idx) => {
                                        const day = idx + 1;
                                        const papersOnDate = getPapersOnDate(day);
                                        const isToday = new Date().getDate() === day && new Date().getMonth() === calendarMonth && new Date().getFullYear() === calendarYear;

                                        return (
                                            <div 
                                                key={`day-${day}`}
                                                className={`p-3 min-h-24 border border-gray-100 rounded-xl flex flex-col justify-between hover:border-primary/40 transition-colors ${
                                                    isToday ? 'bg-primary/5 border-primary/20' : 'bg-white'
                                                }`}
                                            >
                                                <span className={`text-[11px] font-mono font-black ${
                                                    isToday ? 'text-primary' : 'text-slate-800'
                                                }`}>
                                                    {day}
                                                </span>

                                                <div className="space-y-1 mt-1">
                                                    {papersOnDate.map((paper, pIdx) => (
                                                        <div 
                                                            key={pIdx} 
                                                            className="p-1 bg-indigo-50 border border-indigo-100 rounded text-left text-[8px] font-bold text-indigo-800 truncate"
                                                            title={`${paper.examName}: ${paper.subject} (${paper.time})`}
                                                        >
                                                            {paper.subject} ({paper.classGrade})
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 4: Room Allocations & Admit Card Slips */}
                    {activeTab === 'hall-admit' && (
                        <ExamAdmitCard 
                            exams={exams} 
                            students={students} 
                            allocations={allocations} 
                            onAddAllocation={handleAddAllocation} 
                        />
                    )}

                    {/* Tab 5: Result Marks Entry & Statement compiler */}
                    {activeTab === 'marks-entry' && (
                        <ExamResultSheet 
                            exams={exams} 
                            students={students} 
                            marks={marks} 
                            onSaveMarks={handleSaveMarksList} 
                            onTogglePublish={handleTogglePublishResults} 
                        />
                    )}
                </div>
            </div>
        );
    };

    // ==========================================
    // master router based on User Role
    // ==========================================
    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-300 text-left">
            {role === 'student' && renderStudentView()}
            {role === 'teacher' && renderTeacherView()}
            {(role === 'school_admin' || role === 'super_admin' || role === 'Admin') && renderAdminSuite()}
        </div>
    );
};
