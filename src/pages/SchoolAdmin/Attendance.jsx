import { useState, useEffect } from "react";
import { usersApi, attendanceApi, classesApi } from "../../services/api";
import { CheckCircle, XCircle, Search, Calendar, Award, Users, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function PortalAttendance() {
  const { schoolId } = useParams();
  const [students, setStudents] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [todayDate, setTodayDate] = useState(() => new Date().toISOString().split("T")[0]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all student users for this school
      const studRes = await usersApi.getAll({ schoolId, role: "student", limit: 100 });
      const studentsList = studRes.data || [];
      
      // 2. Fetch attendance logs for today
      const attRes = await attendanceApi.getAll({ schoolId, date: todayDate, limit: 100 });
      const logs = attRes.data || [];
      
      setStudents(studentsList);
      setAttendanceLogs(logs);

      try {
        const cRes = await classesApi.getAll({ schoolId, limit: 100 });
        const dbClasses = (cRes.data || []).map(c => c.name).filter(Boolean);
        const unique = Array.from(new Set(dbClasses));
        setAvailableClasses(unique);
        if (unique.length > 0 && !selectedClass) {
          setSelectedClass(unique[0]);
        }
      } catch (cErr) {
        console.warn("Could not load dynamic classes:", cErr);
      }
    } catch (err) {
      toast.error("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [schoolId, todayDate]);

  // Combine student profile with today's attendance logs
  const roster = students.map((student, idx) => {
    const log = attendanceLogs.find(l => l.studentId === student.id);
    const checkInTime = log ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-";
    return {
      id: student.id,
      name: student.name,
      email: student.email,
      class: student.className || "9th A",
      rollNo: student.rollNo || String(idx + 1),
      status: log ? log.status : "absent", // absent, present, late
      time: checkInTime,
      markedBy: log ? log.markedBy : "System"
    };
  });

  // Filter roster by selected class and search query
  const filtered = roster.filter(s =>
    s.class === selectedClass &&
    s.name.toLowerCase().includes(searchName.toLowerCase())
  );

  // Stats Calculations
  const totalInClass = roster.filter(s => s.class === selectedClass).length;
  const presentInClass = roster.filter(s => s.class === selectedClass && s.status === "present").length;
  const absentInClass = totalInClass - presentInClass;
  const presenceRate = totalInClass > 0 ? Math.round((presentInClass / totalInClass) * 100) : 0;

  // Chart Data
  const chartData = [
    { name: "Present", value: presentInClass, color: "#10b981" },
    { name: "Absent", value: absentInClass, color: "#ef4444" }
  ];

  // Manual Toggle Handler
  const handleToggleAttendance = async (studentId, currentStatus) => {
    const nextStatus = currentStatus === "present" ? "absent" : "present";
    try {
      const existingLog = attendanceLogs.find(l => l.studentId === studentId);
      if (existingLog) {
        if (nextStatus === "absent") {
          // Delete logs to mark absent
          await attendanceApi.delete(existingLog.id);
          toast.success("Marked student Absent");
        } else {
          // Update status to present
          await attendanceApi.update(existingLog.id, { status: "present", markedBy: "School Admin" });
          toast.success("Marked student Present");
        }
      } else {
        if (nextStatus === "present") {
          // Create new present log
          await attendanceApi.create({
            studentId,
            schoolId,
            date: todayDate,
            status: "present",
            markedBy: "School Admin"
          });
          toast.success("Marked student Present");
        }
      }
      loadData();
    } catch (err) {
      toast.error("Failed to update attendance status");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ─── PAGE HEADER ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold font-serif text-primary flex items-center gap-2">
            <CheckCircle className="text-secondary" size={24} />
            Daily Attendance Roster
          </h1>
          <p className="text-xs text-text-light mt-1">
            Real-time biometric attendance dashboard and daily manual overrides.
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <Calendar size={14} className="text-primary" />
          <input
            type="date"
            className="bg-transparent border-none outline-none text-xs font-bold text-primary"
            value={todayDate}
            onChange={(e) => setTodayDate(e.target.value)}
          />
        </div>
      </div>

      {/* ─── OVERVIEW METRICS & CHART CARD ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHART WIDGET */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[250px]">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-4">Class Distribution</h3>
          {totalInClass === 0 ? (
            <p className="text-xs text-text-light">No students registered in this class.</p>
          ) : (
            <div className="w-full h-44 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Students`, "Count"]} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-2xl font-black text-primary block leading-none">{presenceRate}%</span>
                <span className="text-[9px] font-bold text-text-light uppercase tracking-wider mt-1 block">Present</span>
              </div>
            </div>
          )}
        </div>

        {/* QUICK STATS CARDS */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">Total Enrolled</span>
              <div className="bg-slate-50 p-2 rounded-xl text-primary"><Users size={16} /></div>
            </div>
            <div className="mt-4">
              <h2 className="text-3xl font-black text-primary leading-none">{totalInClass}</h2>
              <p className="text-[10px] text-text-light mt-1">Students assigned to Class {selectedClass}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-success uppercase tracking-wider">Present Today</span>
              <div className="bg-success/5 p-2 rounded-xl text-success"><UserCheck size={16} /></div>
            </div>
            <div className="mt-4">
              <h2 className="text-3xl font-black text-success leading-none">{presentInClass}</h2>
              <p className="text-[10px] text-text-light mt-1">Marked present via scanner/gate</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-danger uppercase tracking-wider">Absent Today</span>
              <div className="bg-danger/5 p-2 rounded-xl text-danger"><UserX size={16} /></div>
            </div>
            <div className="mt-4">
              <h2 className="text-3xl font-black text-danger leading-none">{absentInClass}</h2>
              <p className="text-[10px] text-text-light mt-1">Remaining check-in logs missing</p>
            </div>
          </div>
        </div>

      </div>

      {/* ─── FILTERS & ROSTER LIST ─── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        
        {/* FILTER BAR */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-wrap gap-4">
          <div className="flex gap-3 flex-wrap">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-white border border-slate-200 text-xs font-bold px-3 py-2 rounded-xl outline-none focus:border-primary"
            >
              {availableClasses.length > 0 ? (
                availableClasses.map(cls => (
                  <option key={cls} value={cls}>Class {cls}</option>
                ))
              ) : (
                <option value="" disabled>No classes created</option>
              )}
            </select>
            
            <input
              type="text"
              placeholder="Search student by name..."
              className="bg-white border border-slate-200 text-xs px-4 py-2 rounded-xl outline-none focus:border-primary w-full sm:max-w-xs"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>
          
          <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">
            Today's Audit Register
          </span>
        </div>

        {/* ROSTER TABLE */}
        {loading ? (
          <div className="py-12 text-center text-text-light">Loading roster data...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-text-light">No students found matching filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-text-light uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-3.5">Roll No</th>
                  <th className="px-6 py-3.5">Student Name</th>
                  <th className="px-6 py-3.5">Check-In Time</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5 text-right">Roster Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-primary">
                      #{s.rollNo}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <h4 className="font-bold text-xs text-primary">{s.name}</h4>
                        <p className="text-[9px] text-text-light">{s.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-text-light font-medium">
                      {s.time}
                    </td>
                    <td className="px-6 py-4 text-xs text-text-light">
                      {s.status === "present" ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/5 text-primary">
                          {s.markedBy}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleAttendance(s.id, s.status)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all inline-flex items-center gap-1.5 ${
                          s.status === "present"
                            ? "bg-success/10 text-success hover:bg-danger/10 hover:text-danger"
                            : "bg-danger/10 text-danger hover:bg-success/10 hover:text-success"
                        }`}
                        title="Click to toggle status manually"
                      >
                        {s.status === "present" ? (
                          <>
                            <CheckCircle size={12} /> Present
                          </>
                        ) : (
                          <>
                            <XCircle size={12} /> Absent
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
