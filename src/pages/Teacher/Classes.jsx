import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { usersApi, timetableApi } from "../../services/api";
import { BookOpen, Users, Clock, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function TPortalClasses() {
  const { teacherId } = useParams();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadClasses = async () => {
      setLoading(true);
      try {
        let teacher = {};
        try {
          const tRes = await usersApi.getById(teacherId);
          if (tRes.data) {
            teacher = tRes.data;
          }
        } catch (tErr) {
          console.warn("Could not load teacher profile from DB:", tErr);
          teacher = (() => { try { return JSON.parse(localStorage.getItem("sms_user") || "{}"); } catch { return {}; } })();
        }

        const schoolId = teacher.schoolId || "";
        
        let teacherClasses = [];
        if (Array.isArray(teacher.classes) && teacher.classes.length > 0) {
          teacherClasses = teacher.classes;
        } else if (typeof teacher.classes === "string" && teacher.classes) {
          teacherClasses = teacher.classes.split(",").map(c => c.trim()).filter(Boolean);
        } else if (typeof teacher.className === "string" && teacher.className) {
          teacherClasses = teacher.className.split(",").map(c => c.trim()).filter(Boolean);
        } else if (teacher.class) {
          teacherClasses = [teacher.class];
        }
        if (!teacherClasses || teacherClasses.length === 0) {
          teacherClasses = ["9th A", "9th B", "10th A", "10th B", "11th Science"];
        }

        const res = await usersApi.getAll({ role: "student", schoolId, limit: 100 });
        const students = res.data || [];

        // Fetch real timetable slots for this school
        let timetableSlots = [];
        try {
          const tRes = await timetableApi.getAll({ schoolId, limit: 100 });
          timetableSlots = tRes.data || [];
        } catch (tErr) {
          console.warn("Could not load timetables for classes:", tErr);
        }

        const classList = teacherClasses.map(cName => {
          const matchCount = students.filter(s => {
            const studentClass = s.className || s.class || "";
            return studentClass.trim().toLowerCase() === cName.trim().toLowerCase();
          }).length;
          
          // Find lectures scheduled for this specific class
          const classSlots = timetableSlots.filter(s => {
            const slotClass = s.className || s.class || "";
            return slotClass.trim().toLowerCase() === cName.trim().toLowerCase();
          });
          let scheduleText = "No lectures scheduled";
          if (classSlots.length > 0) {
            const schedules = classSlots.map(s => `${s.day.slice(0, 3)} (${s.time.split(" - ")[0]})`);
            scheduleText = schedules.slice(0, 2).join(", ");
            if (schedules.length > 2) {
              scheduleText += "...";
            }
          }

          return {
            name: cName,
            studentsCount: matchCount,
            subject: teacher.subject || "General Education",
            schedule: scheduleText
          };
        });

        setClasses(classList);
      } catch (err) {
        toast.error("Failed to load classes from database");
      } finally {
        setLoading(false);
      }
    };
    loadClasses();
  }, [teacherId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1E293B" }}>My Assigned Classes</h2>
        <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Access schedules and class rosters assigned to you.</p>
      </div>

      {/* Table Card */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["S.No.", "Class Name", "Assigned Subject", "Enrolled Students", "Class Timetable"].map(col => (
                  <th key={col} style={{ padding: "14px 20px", textAlign: "left", fontSize: 11.5, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#94A3B8", fontSize: 14 }}>
                    Loading classes...
                  </td>
                </tr>
              ) : classes.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#94A3B8", fontSize: 14 }}>
                    No classes assigned yet.
                  </td>
                </tr>
              ) : (
                classes.map((cls, idx) => (
                  <tr
                    key={idx}
                    style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "16px 20px", color: "#94A3B8", fontWeight: 700 }}>
                      {String(idx + 1).padStart(2, "0")}
                    </td>

                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, background: "#EFF6FF", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <BookOpen size={16} color="#2563EB" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: "#1E293B" }}>Class {cls.name}</div>
                          <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>Campus Standard</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "16px 20px" }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#0284C7", background: "#E0F2FE", padding: "4px 8px", borderRadius: 6 }}>
                        {cls.subject}
                      </span>
                    </td>

                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Users size={15} color="#6366F1" />
                        <span style={{ fontWeight: 700, color: "#1E293B" }}>{cls.studentsCount}</span>
                        <span style={{ color: "#94A3B8", fontSize: 12 }}>students</span>
                      </div>
                    </td>

                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Clock size={15} color="#475569" />
                        <span style={{ fontWeight: 600, color: "#475569" }}>{cls.schedule}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
