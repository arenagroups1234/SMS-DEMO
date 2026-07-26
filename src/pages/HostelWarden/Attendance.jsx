import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Calendar, CheckCircle2, XCircle, Clock, Download,
  Search, Building, ChevronDown, Save, Users, RefreshCw, X, Eye
} from "lucide-react";
import { toast } from "sonner";
import { hostelStudentsApi, hostelAttendanceApi, hostelsApi } from "../../services/api";

const TODAY = new Date().toISOString().split("T")[0];

export default function HostelAttendance() {
  const { schoolId } = useParams();

  // ── State ──────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [selectedBlock, setSelectedBlock] = useState("All");
  const [blocks, setBlocks] = useState([]);
  const [allStudents, setAllStudents] = useState([]);   // all hostel students
  const [attendance, setAttendance] = useState({});     // { studentId: "Present"|"Absent"|"Leave" }
  const [existingRecords, setExistingRecords] = useState({}); // { studentId: attendanceId }
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // ── Monthly Modal State ────────────────────────────
  const [selectedMonthlyStudent, setSelectedMonthlyStudent] = useState(null);
  const [monthlyYearMonth, setMonthlyYearMonth] = useState(TODAY.substring(0, 7)); // "YYYY-MM"
  const [monthlyLogs, setMonthlyLogs] = useState([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  // ── Fetch hostel blocks ────────────────────────────
  useEffect(() => {
    hostelsApi.getAll({ schoolId }).then(res => {
      if (res?.data) setBlocks(res.data);
    }).catch(() => {});
  }, [schoolId]);

  // ── Fetch hostel students ──────────────────────────
  useEffect(() => {
    setLoadingStudents(true);
    hostelStudentsApi.getAll({ schoolId, limit: 500 }).then(res => {
      setAllStudents(res?.data || []);
    }).catch(() => {}).finally(() => setLoadingStudents(false));
  }, [schoolId]);

  // ── Fetch attendance for selected date ─────────────
  const loadAttendanceForDate = useCallback(async (date) => {
    setLoadingAttendance(true);
    try {
      const res = await hostelAttendanceApi.getAll({ schoolId, date, limit: 1000 });
      const records = res?.data || [];
      const statusMap = {};
      const idMap = {};
      records.forEach(r => {
        statusMap[r.studentId] = r.status;
        idMap[r.studentId] = r.id;
      });
      setAttendance(statusMap);
      setExistingRecords(idMap);
    } catch (e) {
      setAttendance({});
      setExistingRecords({});
    } finally {
      setLoadingAttendance(false);
    }
  }, [schoolId]);

  useEffect(() => {
    if (selectedDate) loadAttendanceForDate(selectedDate);
  }, [selectedDate, loadAttendanceForDate]);

  // ── Unique Block List ─────────────────────────────
  const availableBlocks = Array.from(
    new Set([
      ...blocks.map(b => b.name),
      ...allStudents.map(s => s.block).filter(Boolean)
    ])
  );

  // ── Filtered students ──────────────────────────────
  const filteredStudents = allStudents.filter(s => {
    const sBlock = s.block || "";
    const selBlock = selectedBlock;
    const matchBlock = selBlock === "All" ||
      sBlock === selBlock ||
      (sBlock && selBlock && (
        sBlock.toLowerCase().startsWith(selBlock.toLowerCase()) ||
        selBlock.toLowerCase().startsWith(sBlock.toLowerCase()) ||
        sBlock.toLowerCase().includes(selBlock.toLowerCase())
      ));
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || s.name?.toLowerCase().includes(q) || s.roomNumber?.includes(q);
    return matchBlock && matchSearch;
  });

  // ── Mark a student ─────────────────────────────────
  const mark = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  // ── Mark all at once ───────────────────────────────
  const markAll = (status) => {
    const updated = {};
    filteredStudents.forEach(s => { updated[s.id] = status; });
    setAttendance(prev => ({ ...prev, ...updated }));
  };

  // ── Save attendance ────────────────────────────────
  const handleSave = async () => {
    if (filteredStudents.length === 0) {
      toast.error("No students to save attendance for.");
      return;
    }
    setSaving(true);
    let saved = 0, errors = 0;
    for (const student of filteredStudents) {
      const status = attendance[student.id] || "Present";
      const payload = {
        studentId: student.id,
        studentName: student.name,
        roomNumber: student.roomNumber || "",
        hostelBlock: student.block || "",
        date: selectedDate,
        status,
        schoolId: schoolId || ""
      };
      try {
        const existingId = existingRecords[student.id];
        if (existingId) {
          await hostelAttendanceApi.update(existingId, payload);
        } else {
          const res = await hostelAttendanceApi.create(payload);
          if (res?.data?.id) {
            setExistingRecords(prev => ({ ...prev, [student.id]: res.data.id }));
          }
        }
        saved++;
      } catch (e) {
        errors++;
      }
    }
    setSaving(false);
    if (errors === 0) {
      toast.success(`✅ Attendance saved for ${saved} student${saved !== 1 ? "s" : ""} on ${formatDate(selectedDate)}`);
    } else {
      toast.error(`Saved ${saved}, failed ${errors} records.`);
    }
  };

  // ── Load Monthly Records ───────────────────────────
  const fetchMonthlyData = async (student, ymStr) => {
    if (!student) return;
    setLoadingMonthly(true);
    try {
      const res = await hostelAttendanceApi.getAll({ schoolId, studentId: student.id, limit: 1000 });
      const records = (res?.data || []).filter(r => r.date && r.date.startsWith(ymStr));
      setMonthlyLogs(records);
    } catch (e) {
      setMonthlyLogs([]);
    } finally {
      setLoadingMonthly(false);
    }
  };

  const openMonthlyModal = (student) => {
    setSelectedMonthlyStudent(student);
    fetchMonthlyData(student, monthlyYearMonth);
  };

  // ── Export CSV ─────────────────────────────────────
  const handleExport = () => {
    if (filteredStudents.length === 0) { toast.error("No records to export."); return; }
    const headers = "Name,Room,Block,Date,Status";
    const rows = filteredStudents.map(s =>
      `"${s.name}","${s.roomNumber || ""}","${s.block || ""}","${selectedDate}","${attendance[s.id] || "Unmarked"}"`
    );
    const csv = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `Hostel_Attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Attendance exported as CSV.");
  };

  // ── Stats ──────────────────────────────────────────
  const presentCount = filteredStudents.filter(s => attendance[s.id] === "Present").length;
  const absentCount  = filteredStudents.filter(s => attendance[s.id] === "Absent").length;
  const leaveCount   = filteredStudents.filter(s => attendance[s.id] === "Leave").length;
  const unmarked     = filteredStudents.filter(s => !attendance[s.id]).length;

  const formatDate = (d) => {
    if (!d) return "";
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  };

  const pct = filteredStudents.length > 0
    ? Math.round((presentCount / filteredStudents.length) * 100)
    : 0;

  // ── Colour helpers ─────────────────────────────────
  const statusColor = { Present: "#10B981", Absent: "#EF4444", Leave: "#F59E0B" };
  const statusBg    = { Present: "#ECFDF5", Absent: "#FEF2F2", Leave: "#FFFBEB" };

  // Helper to generate days matrix for month
  const getDaysInMonth = (ymStr) => {
    const [year, month] = ymStr.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    const days = [];
    while (date.getMonth() === month - 1) {
      const dStr = date.toISOString().split("T")[0];
      days.push({
        dayNum: date.getDate(),
        dateStr: dStr,
        dayName: date.toLocaleDateString("en-US", { weekday: "short" })
      });
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 48 }}>

      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.5px" }}>
            Hostel Attendance Register
          </h1>
          <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: 14 }}>
            Daily roll-call for all hostel residents • {formatDate(selectedDate)}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleExport}
            style={{ padding: "10px 18px", background: "#F1F5F9", color: "#334155", border: "1px solid #CBD5E1", borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <Download size={15} /> Export CSV
          </button>
          <button onClick={handleSave} disabled={saving || filteredStudents.length === 0}
            style={{ padding: "10px 22px", background: saving ? "#A5B4FC" : "linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(79,70,229,0.3)" }}>
            {saving ? <RefreshCw size={15} className="spin" /> : <Save size={15} />}
            {saving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>

      {/* ── Filter Bar ─────────────────────────────────── */}
      <div style={{ background: "#fff", borderRadius: 16, padding: "16px 20px", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        {/* Date Picker */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>Date</label>
          <div style={{ position: "relative" }}>
            <Calendar size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#4F46E5", pointerEvents: "none" }} />
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: "1.5px solid #C7D2FE", borderRadius: 10, fontSize: 13.5, fontWeight: 700, color: "#0F172A", outline: "none", background: "#EEF2FF", cursor: "pointer" }} />
          </div>
        </div>

        {/* Block Filter */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>Hostel Block</label>
          <div style={{ position: "relative" }}>
            <Building size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#64748B", pointerEvents: "none" }} />
            <select value={selectedBlock} onChange={e => setSelectedBlock(e.target.value)}
              style={{ paddingLeft: 32, paddingRight: 28, paddingTop: 8, paddingBottom: 8, border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 13, color: "#334155", outline: "none", background: "#fff", appearance: "none", cursor: "pointer" }}>
              <option value="All">All Blocks</option>
              {availableBlocks.map(bName => <option key={bName} value={bName}>{bName}</option>)}
            </select>
            <ChevronDown size={13} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", pointerEvents: "none" }} />
          </div>
        </div>

        {/* Search */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>Search</label>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
            <input type="text" placeholder="Search by name or room..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        {/* Mark All buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>Mark All</label>
          <div style={{ display: "flex", gap: 6 }}>
            {["Present", "Absent", "Leave"].map(s => (
              <button key={s} onClick={() => markAll(s)}
                style={{ padding: "7px 12px", background: statusBg[s], color: statusColor[s], border: `1.5px solid ${statusColor[s]}30`, borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                All {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats Bar ──────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
        {[
          { label: "Total Students", value: filteredStudents.length, color: "#4F46E5", bg: "#EEF2FF", icon: <Users size={18} /> },
          { label: "Present", value: presentCount, color: "#10B981", bg: "#ECFDF5", icon: <CheckCircle2 size={18} /> },
          { label: "Absent", value: absentCount,  color: "#EF4444", bg: "#FEF2F2", icon: <XCircle size={18} /> },
          { label: "On Leave", value: leaveCount,   color: "#F59E0B", bg: "#FFFBEB", icon: <Calendar size={18} /> },
          { label: "Unmarked", value: unmarked,     color: "#64748B", bg: "#F8FAFC", icon: <Clock size={18} /> },
        ].map(stat => (
          <div key={stat.label} style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: stat.bg, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700 }}>{stat.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: stat.color, lineHeight: 1.1 }}>{stat.value}</div>
            </div>
          </div>
        ))}

        {/* Attendance % card */}
        <div style={{ background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)", borderRadius: 14, padding: "14px 16px", color: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{pct}%</div>
          <div>
            <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 700 }}>ATTENDANCE</div>
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>of marked students</div>
          </div>
        </div>
      </div>

      {/* ── Attendance Table ────────────────────────────── */}
      <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>

        {/* Table Header */}
        <div style={{ display: "grid", gridTemplateColumns: "56px 1fr 120px 140px 160px 180px", padding: "14px 20px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", fontSize: 11.5, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          <span>#</span>
          <span>Student Name</span>
          <span>Room</span>
          <span>Block</span>
          <span>Monthly View</span>
          <span style={{ textAlign: "center" }}>Attendance</span>
        </div>

        {/* Loading */}
        {(loadingStudents || loadingAttendance) && (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748B", fontSize: 14 }}>
            <RefreshCw size={22} style={{ color: "#4F46E5", marginBottom: 8 }} />
            <div>Loading...</div>
          </div>
        )}

        {/* Empty state */}
        {!loadingStudents && !loadingAttendance && filteredStudents.length === 0 && (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#64748B" }}>
            <Users size={36} style={{ color: "#CBD5E1", marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: "#94A3B8" }}>No students found</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Add hostel students from the "Hostel Students" section first.</div>
          </div>
        )}

        {/* Student Rows */}
        {!loadingStudents && !loadingAttendance && filteredStudents.map((student, idx) => {
          const status = attendance[student.id];
          return (
            <div key={student.id}
              style={{ display: "grid", gridTemplateColumns: "56px 1fr 120px 140px 160px 180px", padding: "14px 20px", borderBottom: "1px solid #F1F5F9", alignItems: "center", transition: "background 0.12s ease" }}
              onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

              {/* Index */}
              <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 700 }}>{idx + 1}</span>

              {/* Name */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: status ? statusBg[status] : "#EEF2FF", color: status ? statusColor[status] : "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, flexShrink: 0 }}>
                  {student.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 14 }}>{student.name}</div>
                  {student.className && <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 1 }}>{student.className}</div>}
                </div>
              </div>

              {/* Room */}
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "#334155" }}>
                {student.roomNumber ? `Room ${student.roomNumber}` : <span style={{ color: "#CBD5E1" }}>—</span>}
              </span>

              {/* Block */}
              <span style={{ fontSize: 12.5, color: "#64748B" }}>
                {student.block || <span style={{ color: "#CBD5E1" }}>—</span>}
              </span>

              {/* Monthly Report View Button */}
              <div>
                <button
                  onClick={() => openMonthlyModal(student)}
                  style={{
                    padding: "6px 12px", background: "#EEF2FF", color: "#4F46E5",
                    border: "1px solid #C7D2FE", borderRadius: 8, fontSize: 12, fontWeight: 700,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 6
                  }}
                >
                  <Eye size={14} /> Monthly View
                </button>
              </div>

              {/* P / A / L Buttons */}
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                {[
                  { s: "Present", label: "P", title: "Present" },
                  { s: "Absent",  label: "A", title: "Absent"  },
                  { s: "Leave",   label: "L", title: "On Leave" },
                ].map(({ s, label, title }) => {
                  const isActive = status === s;
                  return (
                    <button key={s} onClick={() => mark(student.id, s)} title={title}
                      style={{
                        width: 38, height: 38, borderRadius: 10, border: "none",
                        background: isActive ? statusColor[s] : statusBg[s] || "#F1F5F9",
                        color: isActive ? "#fff" : statusColor[s] || "#94A3B8",
                        fontWeight: 900, fontSize: 14, cursor: "pointer",
                        transition: "all 0.15s ease",
                        transform: isActive ? "scale(1.12)" : "scale(1)",
                        boxShadow: isActive ? `0 4px 10px ${statusColor[s]}50` : "none"
                      }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Footer Summary */}
        {filteredStudents.length > 0 && (
          <div style={{ padding: "14px 20px", background: "#F8FAFC", borderTop: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 13, color: "#64748B" }}>
              Showing <strong>{filteredStudents.length}</strong> students
              {selectedBlock !== "All" && <> in <strong>{selectedBlock}</strong></>}
              {" "}• <span style={{ color: "#10B981", fontWeight: 700 }}>{presentCount} Present</span>
              {" "}• <span style={{ color: "#EF4444", fontWeight: 700 }}>{absentCount} Absent</span>
              {" "}• <span style={{ color: "#F59E0B", fontWeight: 700 }}>{leaveCount} Leave</span>
              {unmarked > 0 && <> • <span style={{ color: "#94A3B8" }}>{unmarked} Unmarked</span></>}
            </div>
            <button onClick={handleSave} disabled={saving || filteredStudents.length === 0}
              style={{ padding: "9px 20px", background: saving ? "#A5B4FC" : "linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 10px rgba(79,70,229,0.25)" }}>
              {saving ? <RefreshCw size={14} /> : <Save size={14} />}
              {saving ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        )}
      </div>

      {/* ── MONTHLY ATTENDANCE MODAL ───────────────────────── */}
      {selectedMonthlyStudent && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 720, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", border: "1px solid #E2E8F0", padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
            
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: "#0F172A", margin: 0 }}>
                  Monthly Attendance Report
                </h2>
                <p style={{ margin: "2px 0 0 0", color: "#64748B", fontSize: 13 }}>
                  Resident: <strong>{selectedMonthlyStudent.name}</strong> • Room {selectedMonthlyStudent.roomNumber} ({selectedMonthlyStudent.block})
                </p>
              </div>
              <button onClick={() => setSelectedMonthlyStudent(null)} style={{ background: "#F1F5F9", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748B" }}>
                <X size={18} />
              </button>
            </div>

            {/* Month Picker Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#F8FAFC", padding: 12, borderRadius: 12, border: "1px solid #E2E8F0" }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Select Month:</label>
              <input
                type="month"
                value={monthlyYearMonth}
                onChange={(e) => {
                  setMonthlyYearMonth(e.target.value);
                  fetchMonthlyData(selectedMonthlyStudent, e.target.value);
                }}
                style={{ padding: "8px 12px", border: "1.5px solid #CBD5E1", borderRadius: 8, fontSize: 13.5, fontWeight: 700, outline: "none", color: "#0F172A", background: "#fff" }}
              />
            </div>

            {/* Monthly Summary Cards */}
            {(() => {
              const daysInMonth = getDaysInMonth(monthlyYearMonth);
              const mLogsMap = {};
              monthlyLogs.forEach(l => { mLogsMap[l.date] = l.status; });
              let mP = 0, mA = 0, mL = 0;
              daysInMonth.forEach(d => {
                const st = mLogsMap[d.dateStr];
                if (st === "Present") mP++;
                else if (st === "Absent") mA++;
                else if (st === "Leave") mL++;
              });
              const markedTotal = mP + mA + mL;
              const mPct = markedTotal > 0 ? Math.round((mP / markedTotal) * 100) : 0;

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                    <div style={{ background: "#ECFDF5", borderRadius: 12, padding: 12, border: "1px solid #A7F3D0" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#047857" }}>PRESENT DAYS</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: "#065F46", marginTop: 2 }}>{mP} Days</div>
                    </div>
                    <div style={{ background: "#FEF2F2", borderRadius: 12, padding: 12, border: "1px solid #FECACA" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#B91C1C" }}>ABSENT DAYS</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: "#991B1B", marginTop: 2 }}>{mA} Days</div>
                    </div>
                    <div style={{ background: "#FFFBEB", borderRadius: 12, padding: 12, border: "1px solid #FDE68A" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#B45309" }}>LEAVE DAYS</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: "#92400E", marginTop: 2 }}>{mL} Days</div>
                    </div>
                    <div style={{ background: "linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)", borderRadius: 12, padding: 12, color: "#fff" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.9 }}>MONTHLY %</div>
                      <div style={{ fontSize: 22, fontWeight: 900, marginTop: 2 }}>{mPct}%</div>
                    </div>
                  </div>

                  {/* Calendar Matrix Grid */}
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: "#334155", marginBottom: 12 }}>Daily Attendance Calendar ({monthlyYearMonth})</h3>
                    {loadingMonthly ? (
                      <div style={{ padding: 30, textAlign: "center", color: "#64748B" }}>Loading monthly logs...</div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
                        {daysInMonth.map(d => {
                          const status = mLogsMap[d.dateStr];
                          return (
                            <div key={d.dateStr} style={{
                              background: status ? statusBg[status] : "#F8FAFC",
                              border: `1px solid ${status ? statusColor[status] + '40' : '#E2E8F0'}`,
                              borderRadius: 10, padding: "8px 6px", textAlign: "center"
                            }}>
                              <div style={{ fontSize: 10, color: "#64748B", fontWeight: 700 }}>{d.dayName}</div>
                              <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A", margin: "2px 0" }}>{d.dayNum}</div>
                              <div style={{
                                fontSize: 10, fontWeight: 800,
                                color: status ? statusColor[status] : "#94A3B8"
                              }}>
                                {status ? status : "—"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Modal Footer */}
            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 12, borderTop: "1px solid #E2E8F0" }}>
              <button onClick={() => setSelectedMonthlyStudent(null)} style={{ padding: "10px 20px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Close Report
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
