import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { homeworkApi, assignmentsApi, usersApi } from "../../services/api";

const TAB_HW   = "homework";
const TAB_ASMT = "assignments";

function getDueStatus(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due   = new Date(dateStr); due.setHours(0, 0, 0, 0);
  const diff  = Math.ceil((due - today) / 86400000);
  if (diff < 0)  return { label: "Overdue",   bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" };
  if (diff === 0) return { label: "Due Today", bg: "#FFF7ED", color: "#D97706", border: "#FDE68A" };
  if (diff === 1) return { label: "Due Tomorrow", bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" };
  return { label: `Due in ${diff} days`, bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" };
}

function Tag({ text, bg, color, border }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 8,
      background: bg || "#F8FAFC", color: color || "#64748B",
      border: `1px solid ${border || "#E2E8F0"}`,
      textTransform: "uppercase", letterSpacing: "0.4px", whiteSpace: "nowrap"
    }}>
      {text}
    </span>
  );
}

function InfoRow({ icon, label, value, valueStyle }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#475569" }}>
      <span>{icon}</span>
      <span style={{ fontWeight: 600 }}>{label}:</span>
      <span style={{ fontWeight: 700, color: "#1E293B", ...valueStyle }}>{value}</span>
    </div>
  );
}

export default function PPortalHomework() {
  const { studentId } = useParams();
  const [tab, setTab]          = useState(TAB_HW);
  const [homeworks, setHW]     = useState([]);
  const [assignments, setAsmt] = useState([]);
  const [studentClass, setCls] = useState("");
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    usersApi.getById(studentId)
      .then(res => {
        const u = res.data || {};
        setCls(u.className || u.class || "");
      })
      .catch(e => console.warn("student profile load error:", e));
  }, [studentId]);

  useEffect(() => {
    // studentClass fallback enabled
    const load = async () => {
      setLoading(true);
      try {
        const storedUser = (() => { try { return JSON.parse(localStorage.getItem("sms_user") || "{}"); } catch { return {}; } })();
        const schoolId = storedUser.schoolId || "";
        const cls = studentClass.trim().toLowerCase();

        const [hwRes, asmtRes] = await Promise.all([
          homeworkApi.getAll({ schoolId, limit: 500 }),
          assignmentsApi.getAll({ schoolId, limit: 500 }),
        ]);

        const hw = (hwRes.data || []).filter(h =>
          (h.className || h.class || "").trim().toLowerCase() === cls
        ).sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

        const asmt = (asmtRes.data || []).filter(a =>
          (a.className || a.class || "").trim().toLowerCase() === cls
        ).sort((a, b) => new Date(b.createdAt || b.dueDate) - new Date(a.createdAt || a.dueDate));

        setHW(hw);
        setAsmt(asmt);
      } catch (e) {
        console.error("load error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentClass]);

  const overdue   = [...homeworks, ...assignments].filter(i => getDueStatus(i.date || i.dueDate)?.label === "Overdue").length;
  const dueToday  = [...homeworks, ...assignments].filter(i => getDueStatus(i.date || i.dueDate)?.label === "Due Today").length;

  const tabStyle = (active) => ({
    padding: "12px 28px", border: "none",
    borderBottom: `3px solid ${active ? "#4F46E5" : "transparent"}`,
    background: "transparent", color: active ? "#4F46E5" : "#64748B",
    fontWeight: active ? 800 : 600, fontSize: 13.5,
    cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>

      {/* Header */}
      <div>
        <h2 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "#1E293B" }}>
          📚 Homework &amp; Assignments
        </h2>
        <p style={{ margin: "5px 0 0 0", fontSize: 13, color: "#64748B" }}>
          All tasks assigned by teachers for{" "}
          <strong style={{ color: "#4F46E5" }}>Class {studentClass || "—"}</strong>
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
        {[
          { label: "HOMEWORK",    val: homeworks.length,   bg: "#EFF6FF", border: "#BFDBFE", color: "#1D4ED8" },
          { label: "ASSIGNMENTS", val: assignments.length, bg: "#ECFDF5", border: "#A7F3D0", color: "#047857" },
          { label: "OVERDUE",     val: overdue,            bg: "#FEF2F2", border: "#FECACA", color: "#B91C1C" },
          { label: "DUE TODAY",   val: dueToday,           bg: "#FFF7ED", border: "#FDE68A", color: "#B45309" },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 16, padding: "16px 20px", textAlign: "center"
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: s.color, letterSpacing: "0.6px" }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color, marginTop: 4 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Tabs + content */}
      <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: "1px solid #E2E8F0" }}>
          <button style={tabStyle(tab === TAB_HW)}   onClick={() => setTab(TAB_HW)}>
            📖 Homework ({homeworks.length})
          </button>
          <button style={tabStyle(tab === TAB_ASMT)} onClick={() => setTab(TAB_ASMT)}>
            📋 Assignments ({assignments.length})
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "50px 0", color: "#94A3B8", fontWeight: 700 }}>
              Loading tasks...
            </div>
          ) : tab === TAB_HW ? (

            /* ─── HOMEWORK LIST ─── */
            homeworks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 0" }}>
                <div style={{ fontSize: 40 }}>📭</div>
                <div style={{ marginTop: 10, color: "#94A3B8", fontWeight: 700, fontSize: 14 }}>
                  No homework assigned yet.
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {homeworks.map((hw, idx) => {
                  const ds = getDueStatus(hw.date);
                  const cls = hw.className || hw.class || studentClass;
                  return (
                    <div key={hw.id || idx} style={{
                      border: "1px solid #E2E8F0", borderRadius: 14,
                      background: "#FAFBFF", overflow: "hidden"
                    }}>
                      {/* Card Header */}
                      <div style={{
                        padding: "14px 20px",
                        background: "linear-gradient(90deg, #EFF6FF, #F0F9FF)",
                        borderBottom: "1px solid #DBEAFE",
                        display: "flex", justifyContent: "space-between",
                        alignItems: "center", flexWrap: "wrap", gap: 10
                      }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                          <Tag text={hw.subject || "General"} bg="#EFF6FF" color="#1D4ED8" border="#BFDBFE" />
                          <Tag text={`Class ${cls}`}          bg="#F5F3FF" color="#5B21B6" border="#DDD6FE" />
                          {ds && <Tag text={ds.label} bg={ds.bg} color={ds.color} border={ds.border} />}
                        </div>
                        <span style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>
                          📅 Due Date: <strong style={{ color: "#1E293B" }}>{hw.date || "—"}</strong>
                        </span>
                      </div>

                      {/* Card Body */}
                      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                        {/* Label */}
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                          📝 Homework Instructions
                        </div>

                        {/* Content */}
                        <div style={{
                          fontSize: 14.5, fontWeight: 600, color: "#1E293B",
                          lineHeight: 1.7, padding: "12px 16px",
                          background: "#fff", border: "1px solid #E2E8F0",
                          borderRadius: 10, whiteSpace: "pre-wrap"
                        }}>
                          {hw.content || "—"}
                        </div>

                        {/* Meta */}
                        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", paddingTop: 4 }}>
                          <InfoRow icon="📚" label="Subject"  value={hw.subject || "—"} />
                          <InfoRow icon="🏫" label="Class"    value={`Class ${cls}`} />
                          <InfoRow icon="📅" label="Due"      value={hw.date || "—"} />
                        </div>

                        <div style={{ fontSize: 11, color: "#CBD5E1", fontWeight: 600, marginTop: 2 }}>
                          🕐 Posted on:{" "}
                          {hw.createdAt
                            ? new Date(hw.createdAt).toLocaleString("en-IN", {
                                day: "numeric", month: "short", year: "numeric",
                                hour: "2-digit", minute: "2-digit"
                              })
                            : "—"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )

          ) : (

            /* ─── ASSIGNMENTS LIST ─── */
            assignments.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 0" }}>
                <div style={{ fontSize: 40 }}>📭</div>
                <div style={{ marginTop: 10, color: "#94A3B8", fontWeight: 700, fontSize: 14 }}>
                  No assignments given yet.
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {assignments.map((a, idx) => {
                  const ds  = getDueStatus(a.dueDate);
                  const cls = a.className || a.class || studentClass;
                  return (
                    <div key={a.id || idx} style={{
                      border: "1px solid #E2E8F0", borderRadius: 14,
                      background: "#FAFBFF", overflow: "hidden"
                    }}>
                      {/* Card Header */}
                      <div style={{
                        padding: "14px 20px",
                        background: "linear-gradient(90deg, #F5F3FF, #FAF5FF)",
                        borderBottom: "1px solid #DDD6FE",
                        display: "flex", justifyContent: "space-between",
                        alignItems: "center", flexWrap: "wrap", gap: 10
                      }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                          <Tag text={a.assignmentType || "Assignment"} bg="#F5F3FF" color="#5B21B6" border="#DDD6FE" />
                          <Tag text={a.subject || "General"}           bg="#ECFDF5" color="#047857" border="#A7F3D0" />
                          <Tag text={`Class ${cls}`}                   bg="#EFF6FF" color="#1D4ED8" border="#BFDBFE" />
                          {ds && <Tag text={ds.label} bg={ds.bg} color={ds.color} border={ds.border} />}
                        </div>
                        <span style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>
                          ⏰ Due: <strong style={{ color: "#1E293B" }}>
                            {a.dueDate || "—"}{a.dueTime ? ` @ ${a.dueTime}` : ""}
                          </strong>
                        </span>
                      </div>

                      {/* Card Body */}
                      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                        {/* Title */}
                        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "#1E293B" }}>
                          {a.title}
                        </h3>

                        {/* Description */}
                        {a.description && (
                          <div style={{
                            fontSize: 13.5, color: "#334155", lineHeight: 1.7,
                            padding: "12px 16px", background: "#fff",
                            border: "1px solid #E2E8F0", borderRadius: 10, whiteSpace: "pre-wrap"
                          }}>
                            {a.description}
                          </div>
                        )}

                        {/* Info Grid */}
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                          gap: "10px 24px",
                          background: "#F8FAFC",
                          border: "1px solid #E2E8F0",
                          borderRadius: 10, padding: "14px 18px"
                        }}>
                          <InfoRow icon="🏆" label="Max Marks"       value={a.maxMarks} />
                          <InfoRow icon="✅" label="Passing Marks"   value={a.passingMarks || "—"} />
                          <InfoRow icon="📤" label="Submission Mode" value={a.submissionMode || "—"} />
                          <InfoRow icon="📋" label="Type"            value={a.assignmentType || "—"} />
                          <InfoRow icon="📚" label="Subject"         value={a.subject || "—"} />
                          <InfoRow icon="🏫" label="Class"           value={`Class ${cls}`} />
                          <InfoRow icon="📅" label="Due Date"        value={a.dueDate || "—"} />
                          {a.dueTime && <InfoRow icon="🕐" label="Due Time" value={a.dueTime} />}
                          <InfoRow
                            icon={a.allowLate ? "✅" : "❌"}
                            label="Late Submission"
                            value={a.allowLate ? "Allowed" : "Not Allowed"}
                            valueStyle={{ color: a.allowLate ? "#059669" : "#DC2626" }}
                          />
                        </div>

                        {/* Attachment */}
                        {a.fileName && (
                          <div style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "10px 14px", background: "#F0FDF4",
                            border: "1px dashed #86EFAC", borderRadius: 10
                          }}>
                            <span style={{ fontSize: 16 }}>📎</span>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 800, color: "#15803D", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                                Reference Attachment
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginTop: 2 }}>
                                {a.fileName}
                              </div>
                            </div>
                          </div>
                        )}

                        <div style={{ fontSize: 11, color: "#CBD5E1", fontWeight: 600, marginTop: 2 }}>
                          🕐 Posted on:{" "}
                          {a.createdAt
                            ? new Date(a.createdAt).toLocaleString("en-IN", {
                                day: "numeric", month: "short", year: "numeric",
                                hour: "2-digit", minute: "2-digit"
                              })
                            : "—"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
