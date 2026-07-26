import React, { useState } from 'react';
import { Award, BarChart3, TrendingUp, AlertTriangle, Bell, Clock, Info, CheckCircle, CalendarDays } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import Calendar from 'react-calendar';
import { calculateStudentRank } from './ExamMockData';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

export const ExamAnalytics = ({ exams, students, marks }) => {
    const [selectedExamId, setSelectedExamId] = useState(exams[0]?.id || '');
    const activeExam = exams.find(e => e.id === selectedExamId);

    // Compute stats for selected exam
    const examMarks = marks.filter(m => m.examId === selectedExamId);
    
    // 1. Calculate General Aggregates
    let totalExamsScheduled = exams.length;
    let upcomingCount = exams.filter(e => new Date(e.startDate) > new Date()).length;
    let ongoingCount = exams.filter(e => {
        const today = new Date().toISOString().split('T')[0];
        return today >= e.startDate && today <= e.endDate;
    }).length;
    let completedCount = exams.filter(e => new Date(e.endDate) < new Date()).length;

    // 2. Class Toppers List
    const candidatesPerformance = students
        .filter(s => {
            if (!activeExam) return true;
            return activeExam.classGrade.toLowerCase().includes(s.class.toLowerCase());
        })
        .map(student => {
            const rankInfo = calculateStudentRank(selectedExamId, student.id, marks, exams);
            return {
                student,
                ...rankInfo
            };
        })
        .filter(perf => perf.rank !== '-') // only those with marks compiled
        .sort((a, b) => Number(a.rank) - Number(b.rank));

    const classTopper = candidatesPerformance[0] || null;

    // 3. Subject-wise Average Scores
    const subjectAveragesData = [];
    let passedCount = 0;
    let failedCount = 0;

    if (activeExam) {
        activeExam.papers.forEach(paper => {
            let totalScored = 0;
            let studentCount = 0;

            examMarks.forEach(mRecord => {
                const paperMark = mRecord.marks[paper.subject];
                const attendance = mRecord.attendance?.[paper.subject] || 'Present';

                if (attendance === 'Present' && paperMark !== undefined && paperMark !== '') {
                    totalScored += Number(paperMark);
                    studentCount++;
                }
            });

            const avgPercent = studentCount > 0 ? (totalScored / (studentCount * Number(paper.maxMarks))) * 100 : 0;
            subjectAveragesData.push({
                subject: paper.subject,
                Average: Math.round(avgPercent),
                Passing: Math.round((Number(paper.passMarks) / Number(paper.maxMarks)) * 100)
            });
        });

        // 4. Pass / Fail Aggregates
        candidatesPerformance.forEach(perf => {
            if (perf.status === 'Pass') {
                passedCount++;
            } else {
                failedCount++;
            }
        });
    }

    const passFailPieData = [
        { name: 'Passed', value: passedCount },
        { name: 'Failed', value: failedCount }
    ].filter(d => d.value > 0);

    // 5. Failed Students List (score < passing threshold in any subject)
    const failedCandidates = candidatesPerformance.filter(perf => perf.status === 'Fail');

    // Overall School Passing Percentage
    const passPercentage = candidatesPerformance.length > 0 
        ? Math.round((passedCount / candidatesPerformance.length) * 100) 
        : 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Upper Stat Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white border border-border p-5 rounded-2xl flex items-center justify-between shadow-xs">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Exams</p>
                        <p className="text-2xl font-black text-slate-800 mt-1">{totalExamsScheduled}</p>
                    </div>
                    <span className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center font-bold">
                        {totalExamsScheduled}
                    </span>
                </div>

                <div className="bg-white border border-border p-5 rounded-2xl flex items-center justify-between shadow-xs">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Upcoming</p>
                        <p className="text-2xl font-black text-[#1e40af] mt-1">{upcomingCount}</p>
                    </div>
                    <span className="w-10 h-10 bg-blue-50 text-[#1e40af] rounded-xl flex items-center justify-center font-bold">
                        {upcomingCount}
                    </span>
                </div>

                <div className="bg-white border border-border p-5 rounded-2xl flex items-center justify-between shadow-xs">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ongoing</p>
                        <p className="text-2xl font-black text-emerald-700 mt-1 animate-pulse">{ongoingCount}</p>
                    </div>
                    <span className="w-10 h-10 bg-emerald-50 text-emerald-800 rounded-xl flex items-center justify-center font-bold">
                        {ongoingCount}
                    </span>
                </div>

                <div className="bg-white border border-border p-5 rounded-2xl flex items-center justify-between shadow-xs">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Completed</p>
                        <p className="text-2xl font-black text-gray-500 mt-1">{completedCount}</p>
                    </div>
                    <span className="w-10 h-10 bg-gray-50 text-gray-500 rounded-xl flex items-center justify-center font-bold">
                        {completedCount}
                    </span>
                </div>
            </div>

            {/* Exam Calendar View */}
            <div className="bg-white border border-border p-6 rounded-2xl shadow-sm">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <CalendarDays size={16} className="text-primary" />
                    Exam Calendar Visualization
                </h3>
                <div className="flex justify-center">
                    <Calendar className="!border-none !text-xs !font-sans" />
                </div>
            </div>

            {/* Selector panel for Analytics focus */}
            <div className="bg-white rounded-2xl border border-border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-0.5">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Interactive Exam Analytics Desk</h3>
                    <p className="text-xs text-text-light">Select an exam below to inspect subject breakdowns, failing reports, and topper rankings.</p>
                </div>
                
                <select 
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                    className="px-4 py-2 bg-gray-50 border border-border rounded-xl text-xs font-bold text-gray-800 focus:outline-none w-full md:w-64"
                >
                    {exams.map(e => (
                        <option key={e.id} value={e.id}>{e.name} ({e.classGrade})</option>
                    ))}
                </select>
            </div>

            {/* Graphs Grid */}
            {activeExam && examMarks.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Subject-wise Average Marks */}
                    <div className="bg-white rounded-2xl border border-border p-6 shadow-sm lg:col-span-8">
                        <div className="border-b border-gray-100 pb-3 mb-6 flex items-center justify-between">
                            <span className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                                <BarChart3 size={16} className="text-primary" />
                                Subject Performance Breakdown (%)
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">Class Average vs Passing Marks</span>
                        </div>

                        <div className="h-72 w-full text-xs">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={subjectAveragesData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="subject" tickLine={false} />
                                    <YAxis tickLine={false} domain={[0, 100]} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                                    <Legend />
                                    <Bar dataKey="Average" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={25} />
                                    <Bar dataKey="Passing" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={25} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Pass / Fail Pie Distribution */}
                    <div className="bg-white rounded-2xl border border-border p-6 shadow-sm lg:col-span-4 flex flex-col justify-between">
                        <div>
                            <div className="border-b border-gray-100 pb-3 mb-6">
                                <span className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                                    <TrendingUp size={16} className="text-emerald-700" />
                                    Statement Promotion Ratios
                                </span>
                            </div>

                            <div className="h-44 w-full flex items-center justify-center relative">
                                {passFailPieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={passFailPieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={65}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {passFailPieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-xs text-gray-400 italic">No marks data found</p>
                                )}
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-lg font-black text-slate-800">{passPercentage}%</span>
                                    <span className="text-[8px] text-gray-400 uppercase tracking-widest font-bold">Passed</span>
                                </div>
                            </div>
                        </div>

                        {/* Pie Legend List */}
                        <div className="space-y-2 pt-4 border-t border-gray-100">
                            <div className="flex justify-between text-xs font-medium text-gray-500">
                                <span className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
                                    Total Passed Candidates
                                </span>
                                <span className="font-extrabold text-slate-800">{passedCount} Student(s)</span>
                            </div>
                            <div className="flex justify-between text-xs font-medium text-gray-500">
                                <span className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block"></span>
                                    Failed (At least 1 subject)
                                </span>
                                <span className="font-extrabold text-slate-800">{failedCount} Student(s)</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-border py-12 text-center text-xs text-gray-400">
                    No compiling marks found for the selected exam. Head over to <b>Result Entry</b> to input marks first.
                </div>
            )}

            {/* Lower Row: Toppers vs Failing students list */}
            {activeExam && examMarks.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Class Toppers Leaderboard */}
                    <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                        <div className="border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
                            <span className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                                <Award size={16} className="text-[#ffd700]" />
                                Academic Leaderboard (Toppers)
                            </span>
                            <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">Top Candidates</span>
                        </div>

                        <div className="space-y-2.5">
                            {candidatesPerformance.slice(0, 3).map((candidate, idx) => (
                                <div key={candidate.studentId} className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-100 rounded-xl hover:bg-slate-100/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                                            idx === 0 ? 'bg-amber-100 text-amber-700' :
                                            idx === 1 ? 'bg-slate-200 text-slate-700' :
                                            'bg-orange-100 text-orange-700'
                                        }`}>
                                            #{idx + 1}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-gray-900">{candidate.student.name}</p>
                                            <p className="text-[10px] text-gray-400">Roll #{candidate.student.rollNumber} • Class {candidate.student.class} {candidate.student.section}</p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-xs font-extrabold text-primary">{candidate.totalScored} / {candidate.totalMax} Marks</p>
                                        <p className="text-[10px] text-emerald-600 font-bold">{candidate.percent}% Score</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Failing / Needing Attention Students */}
                    <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                        <div className="border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
                            <span className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                                <AlertTriangle size={16} className="text-rose-500 animate-bounce" />
                                Remedial Support Radar (Failed Students)
                            </span>
                            <span className="text-[9px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md uppercase">Re-exam Required</span>
                        </div>

                        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                            {failedCandidates.length > 0 ? (
                                failedCandidates.map((candidate) => (
                                    <div key={candidate.studentId} className="flex items-center justify-between p-3.5 bg-rose-50/20 border border-rose-100/40 rounded-xl hover:bg-rose-50/50 transition-colors">
                                        <div>
                                            <p className="text-xs font-black text-gray-900">{candidate.student.name}</p>
                                            <p className="text-[10px] text-gray-400">Roll #{candidate.student.rollNumber} • Standard {candidate.student.class}</p>
                                        </div>

                                        <div className="text-right">
                                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded text-[9px] uppercase tracking-wider">
                                                Failing Grade
                                            </span>
                                            <p className="text-[10px] text-gray-400 font-semibold mt-1">Aggregate: {candidate.percent}%</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-1.5">
                                    <CheckCircle size={24} className="text-emerald-500" />
                                    <p className="font-bold text-gray-600">Zero Academic Failures!</p>
                                    <p className="font-medium text-gray-400">All students passed the minimum grading scores.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* School Exam Reminders & Alerts Log */}
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Bell size={16} className="text-amber-500" />
                    EXAM DESK NOTIFICATIONS & REMINDERS LOG
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-xs space-y-1">
                        <span className="text-[9px] font-black uppercase text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md tracking-wider">Exam Date Alert</span>
                        <p className="font-bold text-gray-800">Periodic Unit Test I starts tomorrow.</p>
                        <p className="text-[10px] text-gray-400 font-medium">Alert sent to Class 10th A Parents</p>
                    </div>

                    <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs space-y-1">
                        <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md tracking-wider">Results Published</span>
                        <p className="font-bold text-gray-800">Half Yearly Examination transcripts are active.</p>
                        <p className="text-[10px] text-gray-400 font-medium">Students can print statements of marks.</p>
                    </div>

                    <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl text-xs space-y-1">
                        <span className="text-[9px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md tracking-wider">Academic Reminder</span>
                        <p className="font-bold text-gray-800">Room allocations for Mock Term II configured.</p>
                        <p className="text-[10px] text-gray-400 font-medium">Invigilators assigned to classrooms.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
