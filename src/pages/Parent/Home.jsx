import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usersApi, noticesApi, attendanceApi, examMarksApi, eventsApi, examsApi } from "../../services/api";
import { CheckCircle, Award, Bell, BookOpen, Mail, Phone, Calendar, MapPin, Clock, FileText } from "lucide-react";
import { toast } from "sonner";

const CARD = {
  background: "#FFFFFF",
  border: "1px solid #BAE6FD",
  borderRadius: 18,
  boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.04)",
  padding: 24,
};

function StatCard({ icon, label, val, color }) {
  const colors = {
    blue:   { bg: "#E0F2FE", text: "#0284C7" },
    green:  { bg: "#DCFCE7", text: "#16A34A" },
    orange: { bg: "#FFEDD5", text: "#EA580C" },
  };
  const c = colors[color] || colors.blue;
  return (
    <div style={{
      ...CARD,
      flex: 1,
      minWidth: 200,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      transition: "transform 0.18s, box-shadow 0.18s",
      cursor: "default",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 36px -8px rgba(0, 0, 0, 0.07)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 10px 30px -10px rgba(0, 0, 0, 0.04)"; }}
    >
      <div style={{
        width: 44, height: 44,
        borderRadius: 12,
        background: c.bg,
        color: c.text,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 900, color: "#1E293B", marginBottom: 2 }}>{val}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#64748B" }}>{label}</div>
      </div>
    </div>
  );
}

export default function ParentPortalHome() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [notices, setNotices] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [scheduledExams, setScheduledExams] = useState([]);
  const [attendanceRate, setAttendanceRate] = useState("100.0%");
  const [recentGrade, setRecentGrade] = useState("N/A");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const storedUser = (() => { try { return JSON.parse(localStorage.getItem("sms_user") || "{}"); } catch { return {}; } })();
        let match = null;
        try {
          const res = await usersApi.getAll({ role: "student", limit: 100 });
          const list = res.data || [];
          match = list.find(s => String(s.id) === String(studentId));
        } catch (e) {}

        if (!match && storedUser && (String(storedUser.id) === String(studentId) || storedUser.role === "student" || storedUser.role === "parent")) {
          match = storedUser;
        }

        if (match) {
          setStudent({
            id: match.id,
            name: match.name || match.studentName || "Student",
            email: match.email || "student@school.com",
            phone: match.phone || match.studentPhone || "",
            class: match.className || match.class || "N/A",
            rollNo: match.rollNumber || match.rollNo || "N/A"
          });
        } else {
          setStudent({
            id: studentId,
            name: "Registered Student",
            email: "student@school.com",
            phone: "",
            class: "N/A",
            rollNo: "N/A"
          });
        }

        const resolvedName = match ? (match.name || match.studentName || "") : "";

        // Fetch notices for student's school only
        const studentSchoolId = match?.schoolId || storedUser?.schoolId || "";
        const queryParams = { limit: 100 };
        if (studentSchoolId && String(studentSchoolId).trim()) {
          queryParams.schoolId = studentSchoolId;
        }
        const nRes = await noticesApi.getAll(queryParams);
        const rawNotices = nRes.data || [];
        const filtered = rawNotices.filter(n => {
          // Exclude draft notices for parents/students
          if ((n.status || "").toLowerCase() === "draft") {
            return false;
          }

          const catLower = (n.category || "").toLowerCase();

          // Exclude notices targeted exclusively at Teachers
          if (catLower.includes("teacher")) {
            return false;
          }

          // Exclude class-specific announcements that do not match student's class
          const genericCategories = ["all", "all users", "students", "students only", "general", "academic", "exam", "holiday", "event", "urgent", "fee", "notice"];
          if (n.category && !genericCategories.includes(catLower)) {
            if (studentClass) {
              const normStudentClass = studentClass.toLowerCase().replace(/class/g, "").trim();
              const normNoticeClass = catLower.replace(/class/g, "").trim();
              if (normNoticeClass && !normNoticeClass.includes(normStudentClass) && !normStudentClass.includes(normNoticeClass)) {
                return false;
              }
            }
          }

          const isFeeNotice = n.title && (
            n.title.includes("Fee Deposition") || 
            n.title.includes("Alert") || 
            n.title.includes("Reminder")
          );
          if (isFeeNotice) {
            const firstName = resolvedName.split(" ")[0];
            return n.title.toLowerCase().includes(resolvedName.toLowerCase()) || 
                   (firstName && n.title.toLowerCase().includes(firstName.toLowerCase()));
          }
          return true;
        });
        setNotices(filtered.slice(0, 4));

        // Fetch upcoming events
        try {
          const evRes = await eventsApi.getAll({ limit: 10 });
          setUpcomingEvents(evRes.data || []);
        } catch (e) {
          console.warn("Failed to fetch events for parent dashboard", e);
        }

        // Fetch scheduled exams
        try {
          const exRes = await examsApi.getAll({ limit: 10 });
          const allExams = exRes.data || [];
          const studentClass = match ? (match.className || match.class || "") : "";
          
          const classExams = allExams.filter(e => {
            if (!studentClass) return true;
            const examClasses = e.classes || "";
            if (!examClasses || examClasses.toLowerCase().includes("all")) return true;
            
            const normStudentClass = studentClass.toLowerCase().replace(/class/g, "").trim();
            const targetClasses = examClasses.split(",").map(c => c.toLowerCase().replace(/class/g, "").trim());
            return targetClasses.some(c => normStudentClass.includes(c) || c.includes(normStudentClass));
          });

          setScheduledExams(classExams);
        } catch (e) {
          console.warn("Failed to fetch exams for parent dashboard", e);
        }

        // Fetch attendance rate
        let attRate = "100.0%";
        try {
          const attRes = await attendanceApi.getAll({ studentId, limit: 1000 });
          const attList = attRes.data || [];
          if (attList.length > 0) {
            const present = attList.filter(a => a.status?.toLowerCase() === "present" || a.status?.toLowerCase() === "late").length;
            attRate = ((present / attList.length) * 100).toFixed(1) + "%";
          }
        } catch (e) {
          console.warn("Failed to fetch attendance for dashboard", e);
        }
        setAttendanceRate(attRate);

        // Fetch exam marks
        let gradeStr = "N/A";
        try {
          const marksRes = await examMarksApi.getAll({ studentId, limit: 100 });
          const marksList = marksRes.data || [];
          if (marksList.length > 0) {
            let totalPercentage = 0;
            marksList.forEach(m => {
              let score = m.marks || "0";
              let maxVal = 100;
              if (typeof score === 'string' && score.includes("/")) {
                const parts = score.split("/");
                score = parseFloat(parts[0]) || 0;
                maxVal = parseFloat(parts[1]) || 100;
              } else {
                score = parseFloat(score) || 0;
              }
              totalPercentage += (score / maxVal) * 100;
            });
            const avgPercentage = totalPercentage / marksList.length;
            
            let letter = "F";
            if (avgPercentage >= 90) letter = "A+";
            else if (avgPercentage >= 80) letter = "A";
            else if (avgPercentage >= 70) letter = "B";
            else if (avgPercentage >= 60) letter = "C";
            else if (avgPercentage >= 33) letter = "D";
            
            const cgpa = ((avgPercentage / 100) * 4).toFixed(1);
            gradeStr = `${letter} (CGPA ${cgpa})`;
          }
        } catch (e) {
          console.warn("Failed to fetch exam marks for dashboard", e);
        }
        setRecentGrade(gradeStr);

      } catch (err) {
        console.warn("Could not load dashboard data from SQLite", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [studentId]);

  if (loading || !student) {
    return <div style={{ padding: 24 }}>Loading child information dashboard...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* Welcome Banner */}
      <div style={{
        background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
        borderRadius: 18,
        padding: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
        flexWrap: "wrap",
        boxShadow: "0 10px 25px -5px rgba(2, 132, 199, 0.15)"
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#E0F2FE", background: "rgba(255,255,255,0.15)", padding: "4px 10px", borderRadius: 999, width: "fit-content" }}>
            PARENT MONITORING TERMINAL
          </span>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: "#FFFFFF", margin: 0 }}>Welcome, {student?.name || "Parent"} 👋</h2>
          <p style={{ fontSize: 13.5, color: "#E0F2FE", margin: 0 }}>Track academic marks reports, upcoming exam schedules, school events, and circulars.</p>
        </div>
      </div>

      {/* Stats Counters */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard icon={<CheckCircle size={20} />} label="Attendance Average" val={attendanceRate} color="green" />
        <StatCard icon={<Award size={20} />} label="Recent Term Grade" val={recentGrade} color="blue" />
        <StatCard icon={<Bell size={20} />} label="Circular Notices" val={`${notices.length} Bulletins`} color="orange" />
      </div>

      {/* Details Roster Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        
        {/* Child Roster Details */}
        <div style={{ ...CARD }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: 15, fontWeight: 900, color: "#1E293B" }}>Child Academic Profile</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid #F1F5F9", fontSize: 13.5 }}>
              <span style={{ color: "#94A3B8", fontWeight: 700 }}>NAME:</span>
              <strong style={{ color: "#1E293B" }}>{student.name}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid #F1F5F9", fontSize: 13.5 }}>
              <span style={{ color: "#94A3B8", fontWeight: 700 }}>CLASSROOM:</span>
              <span style={{ background: "#E0F2FE", color: "#0284C7", padding: "2px 8px", borderRadius: 6, fontWeight: 800 }}>
                {student.class}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid #F1F5F9", fontSize: 13.5 }}>
              <span style={{ color: "#94A3B8", fontWeight: 700 }}>ROLL NUMBER:</span>
              <strong style={{ color: "#1E293B" }}>#{student.rollNo}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
              <span style={{ color: "#94A3B8", fontWeight: 700 }}>REGISTERED MOBILE:</span>
              <strong style={{ color: "#1E293B" }}>{student.phone}</strong>
            </div>
          </div>
        </div>

        {/* Notices bulletins board preview */}
        <div style={{ ...CARD }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#1E293B" }}>Notice Boards & Bulletins</h3>
            <button 
              onClick={() => navigate(`/parent-portal/${studentId}/notifications`)}
              style={{ background: "transparent", border: "none", color: "#0284C7", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
            >
              View All
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {notices.length === 0 ? (
              <div style={{ padding: 12, background: "#F8FAFC", borderRadius: 8, fontSize: 12.5 }}>
                <strong style={{ color: "#1E293B" }}>No bulletins broadcasts found</strong>
              </div>
            ) : (
              notices.map(n => (
                <div key={n.id} style={{ padding: "10px 12px", background: "#F8FAFC", border: "1px solid #BAE6FD", borderRadius: 8, fontSize: 12.5 }}>
                  <strong style={{ color: "#1E293B" }}>{n.title}</strong>
                  <p style={{ margin: "2px 0 0 0", color: "#64748B" }}>{n.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Row 2: Scheduled Exams & Upcoming Events Sections */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>

        {/* Scheduled Examination Timetables */}
        <div style={{ ...CARD }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#1E293B", display: "flex", alignItems: "center", gap: 6 }}>
              <Calendar size={18} color="#0284C7" /> Scheduled Examinations
            </h3>
            <button 
              onClick={() => navigate(`/parent-portal/${studentId}/marks`)}
              style={{ background: "transparent", border: "none", color: "#0284C7", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
            >
              View Datesheet
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {scheduledExams.length === 0 ? (
              <div style={{ padding: 16, background: "#F8FAFC", borderRadius: 10, fontSize: 12.5, color: "#64748B", textAlign: "center" }}>
                No active exam schedules posted yet.
              </div>
            ) : (
              scheduledExams.slice(0, 3).map(exm => (
                <div key={exm.id} style={{ padding: "12px 14px", background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: "#0369A1" }}>{exm.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#16A34A", background: "#DCFCE7", padding: "2px 8px", borderRadius: 6 }}>
                      {exm.status || "Scheduled"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748B", display: "flex", gap: 12 }}>
                    <span>📅 Starts: <strong>{exm.date || "TBD"}</strong></span>
                    <span>🏫 Classes: <strong>{exm.classes || "All"}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Events & Activities */}
        <div style={{ ...CARD }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#1E293B", display: "flex", alignItems: "center", gap: 6 }}>
              <Calendar size={18} color="#EA580C" /> Upcoming Events & Activities
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {upcomingEvents.length === 0 ? (
              <div style={{ padding: 16, background: "#F8FAFC", borderRadius: 10, fontSize: 12.5, color: "#64748B", textAlign: "center" }}>
                No upcoming school events scheduled.
              </div>
            ) : (
              upcomingEvents.slice(0, 3).map(ev => (
                <div key={ev.id} style={{ padding: "12px 14px", background: "#FFF7ED", border: "1px solid #FFEDD5", borderRadius: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: "#C2410C" }}>{ev.title}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: "#EA580C", background: "#FFEDD5", padding: "2px 8px", borderRadius: 6 }}>
                      {ev.category || "General"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#4B5563", display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Calendar size={12} color="#EA580C" /> {ev.startDate ? ev.startDate.split("T")[0] : "TBD"}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={12} color="#EA580C" /> {ev.venue || "Campus"}
                    </span>
                  </div>
                  {ev.description && <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748B" }}>{ev.description}</p>}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
