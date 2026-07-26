import React, { useState } from 'react';
import { Printer, MapPin, BookOpen, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export const ExamAdmitCard = ({ exams, students, allocations, onAddAllocation }) => {
    const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
    const [selectedExamId, setSelectedExamId] = useState(exams[0]?.id || '');
    const [examClassFilter, setExamClassFilter] = useState('All');
    
    // Hall Allocation Form State
    const [allocExamId, setAllocExamId] = useState(exams[0]?.id || '');
    const [allocClass, setAllocClass] = useState('1st');
    const [allocSection, setAllocSection] = useState('A');
    const [allocSubject, setAllocSubject] = useState('');
    const [allocRoom, setAllocRoom] = useState('');
    const [allocCapacity, setAllocCapacity] = useState('30');
    const [allocSupervisor, setAllocSupervisor] = useState('');

    const currentExamPapers = exams.find(e => e.id === allocExamId)?.papers || [];

    const handleSaveAllocation = (e) => {
        e.preventDefault();
        if (!allocExamId || !allocSubject || !allocRoom.trim() || !allocSupervisor.trim()) {
            toast.error("Please fill out all hall allocation fields!");
            return;
        }

        const newAllocation = {
            id: `hall-${Date.now()}`,
            examId: allocExamId,
            classGrade: allocClass,
            subject: allocSubject,
            roomNumber: allocRoom,
            capacity: Number(allocCapacity),
            supervisor: allocSupervisor
        };

        onAddAllocation(newAllocation);
        toast.success(`Allocated ${allocRoom} for ${allocSubject} successfully!`);
        
        setAllocSubject('');
        setAllocRoom('');
        setAllocSupervisor('');
    };

    const handlePrint = () => {
        const printContent = document.getElementById('admit-card-printable-area');
        if (!printContent) return;

        const printableHTML = `
            <html>
            <head>
                <title>Admit Card - ${activeStudent?.name || 'Student'}</title>
                <style>
                    body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; }
                </style>
            </head>
            <body>${printContent.innerHTML}</body>
            </html>
        `;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.open();
            printWindow.document.write(printableHTML);
            printWindow.document.close();
            printWindow.print();
        }
    };

    const filteredExams = examClassFilter === 'All' 
        ? exams 
        : exams.filter(e => e.classGrade.split(' ')[0].toLowerCase() === examClassFilter.toLowerCase());

    const activeExam = exams.find(e => e.id === selectedExamId) || filteredExams[0] || null;

    const filteredStudents = students.filter(s => {
        const studentClass = s.class.toLowerCase();
        
        if (activeExam) {
            const examClass = activeExam.classGrade.split(' ')[0].toLowerCase();
            return examClass === studentClass;
        }
        
        if (examClassFilter !== 'All') {
            return studentClass === examClassFilter.toLowerCase();
        }
        
        return true;
    });

    const activeStudent = students.find(s => s.id === selectedStudentId) || filteredStudents[0] || null;

    // Remove the two useEffects that were causing race conditions

    const handleExamClassFilterChange = (e) => {
        const newFilter = e.target.value;
        setExamClassFilter(newFilter);
        
        const newFilteredExams = newFilter === 'All' 
            ? exams 
            : exams.filter(ex => ex.classGrade.split(' ')[0].toLowerCase() === newFilter.toLowerCase());
            
        if (newFilteredExams.length > 0) {
            setSelectedExamId(newFilteredExams[0].id);
        } else {
            setSelectedExamId('');
        }
        
        // Also reset student id
        setSelectedStudentId('');
    };

    const handleExamChange = (e) => {
        setSelectedExamId(e.target.value);
        setSelectedStudentId(''); // reset student when exam changes
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <MapPin size={16} className="text-primary" />
                        Room / Hall Allocation
                    </h3>
                    <form onSubmit={handleSaveAllocation} className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Select Exam</label>
                            <select 
                                value={allocExamId} 
                                onChange={(e) => {
                                    setAllocExamId(e.target.value);
                                    const exam = exams.find(ex => ex.id === e.target.value);
                                    if (exam && exam.papers.length > 0) setAllocSubject(exam.papers[0].subject);
                                }}
                                className="w-full px-3.5 py-2.5 bg-gray-50 border border-border rounded-xl text-xs font-semibold focus:outline-none"
                            >
                                {exams.map(e => <option key={e.id} value={e.id}>{e.name} ({e.classGrade})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Select Class</label>
                            <select value={allocClass} onChange={(e) => setAllocClass(e.target.value)} className="w-full px-3.5 py-2.5 bg-gray-50 border border-border rounded-xl text-xs font-semibold focus:outline-none">
                                {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Select Section</label>
                            <select value={allocSection} onChange={(e) => setAllocSection(e.target.value)} className="w-full px-3.5 py-2.5 bg-gray-50 border border-border rounded-xl text-xs font-semibold focus:outline-none">
                                {['A', 'B', 'C', 'D'].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Subject Paper</label>
                            <select value={allocSubject} onChange={(e) => setAllocSubject(e.target.value)} className="w-full px-3.5 py-2.5 bg-gray-50 border border-border rounded-xl text-xs font-semibold focus:outline-none">
                                <option value="">-- Choose Subject --</option>
                                {currentExamPapers.map(p => <option key={p.subject} value={p.subject}>{p.subject}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Room No.</label>
                                <input type="text" placeholder="e.g. Room 102" value={allocRoom} onChange={(e) => setAllocRoom(e.target.value)} className="w-full px-3.5 py-2.5 bg-gray-50 border border-border rounded-xl text-xs font-semibold focus:outline-none" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Seating Capacity</label>
                                <input type="number" value={allocCapacity} onChange={(e) => setAllocCapacity(e.target.value)} className="w-full px-3.5 py-2.5 bg-gray-50 border border-border rounded-xl text-xs font-semibold focus:outline-none text-center font-bold" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Supervisor / Invigilator</label>
                            <input type="text" placeholder="e.g. Mr. S. K. Sharma" value={allocSupervisor} onChange={(e) => setAllocSupervisor(e.target.value)} className="w-full px-3.5 py-2.5 bg-gray-50 border border-border rounded-xl text-xs font-semibold focus:outline-none" />
                        </div>
                        <button type="submit" className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all">Save Hall Allocation</button>
                    </form>
                </div>
                <div className="bg-white rounded-2xl border border-border p-6 shadow-sm overflow-hidden">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3">Allocated Seats List</h3>
                    <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
                        {allocations.map(alloc => {
                            const exam = exams.find(e => e.id === alloc.examId);
                            return (
                                <div key={alloc.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-[11px] space-y-1">
                                    <div className="flex justify-between font-bold text-gray-900">
                                        <span>{alloc.subject}</span>
                                        <span className="text-primary bg-primary/5 px-2 py-0.5 rounded-md text-[10px] font-mono">{alloc.roomNumber}</span>
                                    </div>
                                    <p className="text-gray-500 font-medium">{exam?.name || 'Exam'} ({exam?.classGrade}) - <span className="font-bold text-gray-700">{alloc.classGrade}</span></p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <div className="lg:col-span-8 space-y-6">
                <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border">
                        <div>
                            <h3 className="text-base font-black text-gray-900 uppercase tracking-widest">ADMIT CARD GENERATOR (HALL TICKET)</h3>
                            <p className="text-xs text-text-light">Select a student and exam to compile their official hall ticket.</p>
                        </div>
                        <button onClick={handlePrint} className="bg-[#0b4d3e] hover:bg-[#073026] text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs">
                            <Printer size={15} /> Print Admit Card
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Filter Exam Class</label>
                            <select value={examClassFilter} onChange={handleExamClassFilterChange} className="w-full px-3 py-2 bg-white border border-border rounded-lg text-xs font-semibold focus:outline-none">
                                <option value="All">All Classes</option>
                                {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Select Examination</label>
                            <select 
                                value={selectedExamId} 
                                onChange={handleExamChange}
                                className="w-full px-3 py-2 bg-white border border-border rounded-lg text-xs font-semibold focus:outline-none"
                                disabled={filteredExams.length === 0}
                            >
                                {filteredExams.length > 0 ? (
                                    filteredExams.map(e => <option key={e.id} value={e.id}>{e.name} ({e.classGrade})</option>)
                                ) : (
                                    <option value="">No Exams Available</option>
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Select Student</label>
                            <select 
                                value={selectedStudentId || activeStudent?.id || ''} 
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-border rounded-lg text-xs font-semibold focus:outline-none"
                                disabled={filteredStudents.length === 0 || !activeExam}
                            >
                                {!activeExam ? (
                                    <option value="">Select an exam first</option>
                                ) : filteredStudents.length > 0 ? (
                                    filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name} (Roll #{s.rollNumber} - Class {s.class} {s.section})</option>)
                                ) : (
                                    <option value="">No Students Found</option>
                                )}
                            </select>
                        </div>
                    </div>
                    <div className="border border-border rounded-2xl overflow-hidden bg-gray-50/50 p-6 md:p-8">
                        {!activeExam || !activeStudent ? (
                            <div className="text-center py-12 px-4">
                                <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                                <h4 className="text-sm font-bold text-gray-800">No Admit Card Available</h4>
                                <p className="text-xs text-gray-500 mt-1">Please select an examination and a student to preview their admit card.</p>
                            </div>
                        ) : (
                            <div id="admit-card-printable-area" className="bg-white border-2 border-slate-300 rounded-xl p-6 shadow-sm max-w-2xl mx-auto relative overflow-hidden">
                                <div className="absolute right-[-20px] bottom-[-20px] text-slate-100/40 pointer-events-none select-none">
                                    <ShieldCheck size={260} />
                                </div>
                                <div className="relative space-y-6">
                                    <div className="border-b-2 border-double border-slate-900 pb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-sm">GV</div>
                                            <div className="text-left">
                                                <h4 className="font-extrabold text-sm text-slate-900 tracking-tight uppercase">Green Valley International School</h4>
                                                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Affiliation Board: CBSE Delhi Secondary School Code 29110</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-white bg-slate-900 px-3 py-1 rounded-md tracking-wider">Admit Card</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Student Name</p>
                                            <p className="text-xs font-bold text-slate-800 mt-0.5">{activeStudent.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Class & Section</p>
                                            <p className="text-xs font-bold text-slate-800 mt-0.5">{activeStudent.class} {activeStudent.section}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Roll Number</p>
                                            <p className="text-xs font-bold text-slate-800 mt-0.5">#{activeStudent.rollNumber}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
