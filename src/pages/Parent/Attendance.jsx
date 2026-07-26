import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle, XCircle, Clock, Calendar } from "lucide-react";
import { attendanceApi } from "../../services/api";

export default function PPortalAttendance() {
  const { studentId } = useParams();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        let list = [];
        try {
          const res = await attendanceApi.getAll({ studentId, limit: 1000 });
          list = res.data || [];
        } catch (e) {
          console.warn("Could not load attendance logs from API", e);
        }

        const localAttStr = localStorage.getItem("school_management_attendances") || localStorage.getItem(`sms_${studentId}_attendances`);
        if (localAttStr) {
          try {
            const parsedLocal = JSON.parse(localAttStr);
            if (Array.isArray(parsedLocal)) {
              parsedLocal.forEach(la => {
                if (String(la.studentId) === String(studentId) && !list.some(item => String(item.id) === String(la.id))) {
                  list.push(la);
                }
              });
            }
          } catch (e) {}
        }

        const studentLogs = list.filter(l => String(l.studentId) === String(studentId));
        studentLogs.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
        setLogs(studentLogs);
      } catch (err) {
        console.warn("Could not load attendance logs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [studentId]);

  const stats = (() => {
    if (logs.length === 0) {
      return { present: 0, late: 0, absent: 0, rate: "N/A" };
    }
    const present = logs.filter(l => l.status?.toLowerCase() === "present").length;
    const late = logs.filter(l => l.status?.toLowerCase() === "late").length;
    const absent = logs.filter(l => l.status?.toLowerCase() === "absent").length;
    const total = logs.length;
    const rate = (((present + late) / total) * 100).toFixed(1) + "%";
    return { present, late, absent, rate };
  })();

  if (loading) {
    return <div style={{ padding: 24 }}>Loading attendance register...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1E293B" }}>Attendance Register</h2>
        <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Monitor your child's daily class attendance logs.</p>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 18, textAlign: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#9CA3AF" }}>ATTENDANCE RATE</span>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#16A34A", marginTop: 4 }}>{stats.rate}</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 18, textAlign: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#9CA3AF" }}>DAYS PRESENT</span>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#0284C7", marginTop: 4 }}>{stats.present} Days</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 18, textAlign: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#9CA3AF" }}>DAYS ABSENT</span>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#DC2626", marginTop: 4 }}>{stats.absent} Day{stats.absent !== 1 && 's'}</div>
        </div>
      </div>

      {/* Attendance logs list */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        {logs.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "#64748B" }}>No attendance logs registered for this child.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "2px solid #E5E7EB" }}>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "#4B5563" }}>Date</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "#4B5563" }}>Attendance Status</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "#4B5563" }}>Remarks / Notes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td style={{ padding: "14px 20px", fontSize: 13.5, fontWeight: 700, color: "#4B5563" }}>{log.date}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700,
                      color: log.status === "Present" ? "#03543F" : log.status === "Late" ? "#92400E" : "#9B1C1C",
                      background: log.status === "Present" ? "#DEF7EC" : log.status === "Late" ? "#FEF3C7" : "#FDE2E2",
                      padding: "4px 10px", borderRadius: 6
                    }}>
                      {log.status === "Present" ? <CheckCircle size={14} /> : log.status === "Late" ? <Clock size={14} /> : <XCircle size={14} />}
                      {log.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 13, color: "#64748B" }}>{log.remark || "On Time"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
