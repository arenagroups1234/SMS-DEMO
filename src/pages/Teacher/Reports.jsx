import { useState, useEffect } from "react";
import { usersApi, attendanceApi, examMarksApi } from "../../services/api";
import { BarChart3, TrendingUp, Users, Award } from "lucide-react";

export default function TPortalReports() {
  const [attendanceAvg, setAttendanceAvg] = useState("0.0%");
  const [passRate, setPassRate] = useState("0.0%");
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReportsData = async () => {
      setLoading(true);
      try {
        const storedUser = (() => { try { return JSON.parse(localStorage.getItem("sms_user") || "{}"); } catch { return {}; } })();
        const schoolId = storedUser.schoolId || "";

        // Parse assigned classes
        let teacherClasses = [];
        if (Array.isArray(storedUser.classes)) {
          teacherClasses = storedUser.classes;
        } else if (typeof storedUser.classes === "string") {
          teacherClasses = storedUser.classes.split(",").map(c => c.trim()).filter(Boolean);
        } else if (storedUser.class) {
          teacherClasses = [storedUser.class];
        }

        // Fetch students & filter by teacher classes
        const sRes = await usersApi.getAll({ role: "student", schoolId, limit: 100 });
        const allStudents = sRes.data || [];
        const teacherClassesNormalized = teacherClasses.map(c => c.trim().toLowerCase());
        const assignedStudents = allStudents.filter(s => {
          const studentClass = s.className || s.class || "";
          return teacherClassesNormalized.includes(studentClass.trim().toLowerCase());
        });
        setTotalStudents(assignedStudents.length);

        if (assignedStudents.length > 0) {
          const assignedStudentIds = new Set(assignedStudents.map(s => s.id));

          // 1. Calculate Real Attendance Average
          try {
            const attRes = await attendanceApi.getAll({ schoolId });
            const allAttendance = attRes.data || [];
            const relevantAttendance = allAttendance.filter(a => assignedStudentIds.has(a.studentId));
            
            if (relevantAttendance.length > 0) {
              const present = relevantAttendance.filter(a => a.status?.toLowerCase() === "present").length;
              setAttendanceAvg(((present / relevantAttendance.length) * 100).toFixed(1) + "%");
            } else {
              setAttendanceAvg("N/A");
            }
          } catch (attErr) {
            console.warn(attErr);
          }

          // 2. Calculate Real Exam Performance (Pass Rate = Marks >= 33)
          try {
            const marksRes = await examMarksApi.getAll({ limit: 1000 });
            const allMarks = marksRes.data || [];
            const relevantMarks = allMarks.filter(m => assignedStudentIds.has(m.studentId));
            
            if (relevantMarks.length > 0) {
              const passed = relevantMarks.filter(m => {
                const num = parseFloat(m.marks);
                return !isNaN(num) && num >= 33;
              }).length;
              setPassRate(((passed / relevantMarks.length) * 100).toFixed(1) + "%");
            } else {
              setPassRate("0.0%");
            }
          } catch (marksErr) {
            console.warn(marksErr);
          }
        }
      } catch (err) {
        console.warn("Error loading reports data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadReportsData();
  }, []);

  const reports = [
    { title: "Class Attendance Report", value: attendanceAvg + " Present Average", trend: "Based on dynamic student registers", icon: <Users size={20} /> },
    { title: "Class Exam Performance Summary", value: passRate + " Pass Rate", trend: "Real marks scoring above passing threshold (33)", icon: <Award size={20} /> },
    { title: "Total Assigned Students", value: totalStudents + " Enrolled Students", trend: "Real database student count for your classes", icon: <BarChart3 size={20} /> }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1E293B" }}>Performance & Progress Reports</h2>
        <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Review student growth charts, class performance averages, and term audits.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        {reports.map((rep, idx) => (
          <div key={idx} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, background: "#E0F2FE", color: "#0284C7", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {rep.icon}
              </div>
              <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: "#1E293B" }}>{rep.title}</h4>
            </div>

            <div style={{ fontSize: 22, fontWeight: 900, color: "#0284C7", marginBottom: 6 }}>{rep.value}</div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#16A34A", fontWeight: 700 }}>
              <TrendingUp size={14} /> {rep.trend}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
