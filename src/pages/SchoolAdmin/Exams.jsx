import { useState, useEffect } from "react";
import { Award, Calendar, FileText, Plus, Trash2, Clock, MapPin, ClipboardList, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { examsApi, noticesApi, classesApi, subjectsApi } from "../../services/api";

export default function PortalExams() {
  const { schoolId } = useParams();
  const [exams, setExams] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);

  const loadExams = async () => {
    try {
      const res = await examsApi.getAll({ schoolId, limit: 100 });
      const backendExams = res.data || [];
      
      const mappedExams = backendExams.map(ex => {
        let parsedSchedules = [];
        try {
          if (ex.schedules) {
            parsedSchedules = typeof ex.schedules === 'string' ? JSON.parse(ex.schedules) : ex.schedules;
          }
        } catch (err) {
          console.error("Error parsing schedules", err);
        }
        return {
          ...ex,
          schedules: parsedSchedules
        };
      });
      const uniqueExams = [];
      const seenNames = new Set();
      mappedExams.forEach(ex => {
        const key = (ex.name || "").trim().toLowerCase();
        if (key && !seenNames.has(key)) {
          seenNames.add(key);
          uniqueExams.push(ex);
        }
      });

      setExams(uniqueExams);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const cRes = await classesApi.getAll({ schoolId, limit: 100 });
        const sRes = await subjectsApi.getAll({ schoolId, limit: 100 });
        const dbClasses = (cRes.data || []).map(c => c.name).filter(Boolean);
        const dbSubjects = (sRes.data || []).map(s => s.name).filter(Boolean);
        setAvailableClasses(Array.from(new Set(dbClasses)));
        setAvailableSubjects(Array.from(new Set(dbSubjects)));
      } catch (err) {
        console.warn("Could not load classes/subjects for exams:", err);
      }
    };
    loadExams();
    fetchDropdowns();
  }, [schoolId]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [viewingExam, setViewingExam] = useState(null);
  
  // Form fields states
  const [name, setName] = useState("");
  const [status, setStatus] = useState("Scheduled");
  const [notes, setNotes] = useState("");
  const [formClasses, setFormClasses] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [timetableFile, setTimetableFile] = useState("");
  const [timetableFileName, setTimetableFileName] = useState("");
  const [timetableMode, setTimetableMode] = useState("interactive"); // "interactive" | "document"

  const handleTimetableUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTimetableFile(reader.result);
        setTimetableFileName(file.name);
        toast.success("Timetable sheet uploaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  const addSubjectRow = () => {
    setSchedules(prev => [
      ...prev,
      { subject: "Science", date: "", startTime: "09:00 AM", endTime: "12:00 PM", maxMarks: "100", passingMarks: "33", room: `Room ${prev.length + 1}` }
    ]);
  };

  const removeSubjectRow = (index) => {
    if (schedules.length === 1) {
      toast.error("Please add at least one subject schedule!");
      return;
    }
    setSchedules(prev => prev.filter((_, i) => i !== index));
  };

  const updateSubjectRow = (index, key, val) => {
    setSchedules(prev => prev.map((item, i) => i === index ? { ...item, [key]: val } : item));
  };

  const handleOpenAdd = () => {
    setEditingExam(null);
    setName("");
    setStatus("Scheduled");
    setNotes("");
    setFormClasses([]);
    setSchedules([]);
    setTimetableFile("");
    setTimetableFileName("");
    setTimetableMode("interactive");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exm) => {
    setEditingExam(exm);
    setName(exm.name);
    setStatus(exm.status);
    setNotes(exm.notes || "");
    setFormClasses((exm.classes || "").split(", ").filter(Boolean));
    setSchedules(exm.schedules || []);
    setTimetableFile(exm.timetableFile || "");
    setTimetableFileName(exm.timetableFileName || "");
    setTimetableMode(exm.timetableFile ? "document" : "interactive");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Exam Term validation
    if (!name.trim()) {
      toast.error("Exam Term Name is required!");
      return;
    }
    if (name.length > 30) {
      toast.error("Exam Term Name must be 30 characters or less!");
      return;
    }

    if (notes && notes.length > 100) {
      toast.error("Instructions / Notes must be 100 characters or less!");
      return;
    }

    if (formClasses.length === 0) {
      toast.error("Please select at least one Target Class!");
      return;
    }

    let sortedSchedules = [];
    if (timetableMode === "document") {
      if (!timetableFile) {
        toast.error("Please upload a Timetable Sheet Document (PDF / Image)!");
        return;
      }
    } else {
      // Schedule rows validation for Interactive mode
      if (schedules.length === 0) {
        toast.error("Please add at least one subject schedule!");
        return;
      }
      for (let i = 0; i < schedules.length; i++) {
        const s = schedules[i];
        if (!s.date) {
          toast.error(`Please select a date for ${s.subject}!`);
          return;
        }
        if (!s.maxMarks || /\D/.test(s.maxMarks)) {
          toast.error(`Max Marks for ${s.subject} must be a valid number!`);
          return;
        }
        if (!s.passingMarks || /\D/.test(s.passingMarks)) {
          toast.error(`Min Pass Marks for ${s.subject} must be a valid number!`);
          return;
        }
        const mx = parseInt(s.maxMarks, 10);
        const ps = parseInt(s.passingMarks, 10);
        if (mx <= 0 || mx > 999) {
          toast.error(`Max Marks for ${s.subject} must be between 1 and 999!`);
          return;
        }
        if (ps < 0 || ps > mx) {
          toast.error(`Min Pass Marks for ${s.subject} cannot exceed Max Marks (${mx})!`);
          return;
        }
        if (!s.room.trim()) {
          toast.error(`Exam Hall is required for ${s.subject}!`);
          return;
        }
        if (s.room.length > 15 || /[^a-zA-Z0-9\s]/.test(s.room)) {
          toast.error(`Exam Hall for ${s.subject} must be alphanumeric and 15 characters or less!`);
          return;
        }
      }
      sortedSchedules = [...schedules].sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    const firstExamDate = sortedSchedules[0]?.date || new Date().toISOString().split('T')[0];
    const finalFile = timetableMode === "document" ? timetableFile : null;
    const finalFileName = timetableMode === "document" ? timetableFileName : null;
    const finalSchedules = timetableMode === "interactive" ? JSON.stringify(sortedSchedules) : null;
    const targetSubjectsStr = sortedSchedules.length > 0
      ? [...new Set(sortedSchedules.map(s => s.subject))].join(", ")
      : "Uploaded Document Datesheet";

    try {
      if (editingExam) {
        // Edit mode
        await examsApi.update(editingExam.id, {
          name,
          date: firstExamDate,
          status,
          classes: formClasses.join(", "),
          subjects: targetSubjectsStr,
          notes,
          schedules: finalSchedules,
          timetableFile: finalFile,
          timetableFileName: finalFileName,
          schoolId
        });
        toast.success("Exam schedule updated successfully!");
      } else {
        // Create mode
        await examsApi.create({
          schoolId: schoolId,
          name,
          date: firstExamDate,
          status,
          classes: formClasses.join(", "),
          subjects: targetSubjectsStr,
          notes,
          schedules: finalSchedules,
          timetableFile: finalFile,
          timetableFileName: finalFileName
        });

        // Push automated notification bulletin to Parents
        try {
          await noticesApi.create({
            title: `Exam Schedule Announced: ${name}`,
            description: `The exam schedule for ${formClasses.join(", ")} (${name}) has been published. Exam start date: ${firstExamDate}. Please check Parent Portal for full datesheet and timetable.`,
            category: "Exam Schedule",
            publishDate: new Date().toISOString().split('T')[0],
            status: "published",
            schoolId: schoolId
          });
        } catch (noticeErr) {
          console.warn("Could not publish automated exam notice:", noticeErr);
        }

        toast.success("Exam schedule registered & Notification sent to Parents!");
      }
      loadExams();
      setIsModalOpen(false);
    } catch (err) {
      toast.error("Failed to save exam schedule: " + (err.message || err));
    }

    setEditingExam(null);
    
    // Reset form fields
    setName("");
    setStatus("Scheduled");
    setNotes("");
    setFormClasses(["9th A"]);
    setSchedules([
      { subject: "Mathematics", date: "", startTime: "09:00 AM", endTime: "12:00 PM", maxMarks: "100", passingMarks: "33", room: "Room 1" }
    ]);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this examination schedule?")) return;
    try {
      await examsApi.delete(id);
      toast.success("Exam schedule deleted successfully!");
      loadExams();
    } catch (err) {
      toast.error("Failed to delete exam schedule: " + (err.message || err));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* Top Title Section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1F2333", letterSpacing: "0.2px" }}>
            🏆 Examinations Schedules
          </h2>
          <p style={{ fontSize: 13, color: "#6B7080", marginTop: 4 }}>Configure exam terms, date sheets, and syllabus targets.</p>
        </div>

        <button
          onClick={handleOpenAdd}
          style={{
            padding: "10px 20px",
            background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 13.5,
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 4px 14px rgba(2, 132, 199, 0.25)",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 6px 18px rgba(2, 132, 199, 0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(2, 132, 199, 0.25)";
          }}
        >
          <Plus size={16} /> Schedule Exam
        </button>
      </div>

      {/* Table Card */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 8 }}>
          <Award size={16} color="#0284C7" />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1F2333" }}>
            Total Examination Terms: <span style={{ color: "#0284C7" }}>{exams.length}</span>
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["S.No.", "Exam Term Name & Classes", "Start Date", "Schedules Count", "Status", "Actions"].map(col => (
                  <th key={col} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11.5, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {exams.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#94A3B8", fontSize: 14 }}>
                    No examinations scheduled yet. Click <strong>Schedule Exam</strong> to add one.
                  </td>
                </tr>
              ) : (
                exams.map((exm, idx) => (
                  <tr
                    key={exm.id || idx}
                    style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {/* S.No. */}
                    <td style={{ padding: "14px 16px", color: "#94A3B8", fontWeight: 700 }}>
                      {String(idx + 1).padStart(2, "0")}
                    </td>

                    {/* Term & Classes */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 800, color: "#1F2333", fontSize: 14.5 }}>{exm.name}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                        {(exm.classes || "").split(", ").filter(Boolean).map(c => (
                          <span key={c} style={{ fontSize: 10, fontWeight: 800, color: "#0284C7", background: "#E0F2FE", padding: "2px 6px", borderRadius: 4 }}>
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Start Date */}
                    <td style={{ padding: "14px 16px", fontWeight: 600, color: "#1F2333" }}>
                      {exm.date}
                    </td>

                    {/* Schedules Count */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700, color: "#1F2333" }}>
                        {Array.isArray(exm.schedules) ? exm.schedules.length : 0} <span style={{ fontWeight: 400, color: "#6B7080" }}>subjects</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 750,
                        background: exm.status === "Scheduled" ? "#D1FAE5" : "#F3F4F6",
                        color: exm.status === "Scheduled" ? "#065F46" : "#4B5563"
                      }}>
                        {exm.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          title="View Details"
                          onClick={() => setViewingExam(exm)}
                          style={{ padding: "6px 12px", background: "#EFF6FF", color: "#2563EB", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
                        >
                          👁️ View
                        </button>
                        <button
                          title="Edit Exam"
                          onClick={() => handleOpenEdit(exm)}
                          style={{ padding: "6px 12px", background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          title="Delete Exam"
                          onClick={() => handleDelete(exm.id)}
                          style={{ padding: "6px 12px", background: "#FEF2F2", color: "#DC2626", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exam Modal */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{
            background: "#fff", padding: 32, borderRadius: 18, width: 1150, maxWidth: "96vw",
            maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
          }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: 19, fontWeight: 900, color: "#1F2333", borderBottom: "1px solid #EEEEF4", paddingBottom: 12 }}>
              {editingExam ? "✏️ Edit Examination details" : "🗓️ Schedule New Examination"}
            </h3>
            
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* Term details */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: "#6B7080" }}>Exam Term Name</label>
                  <input
                    type="text" required placeholder="e.g. Midterm Exams 2026"
                    value={name} onChange={e => setName(e.target.value.slice(0, 30))}
                    style={{ padding: "10px 12px", border: "1px solid #EEEEF4", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: "#6B7080" }}>Status</label>
                  <select
                    value={status} onChange={e => setStatus(e.target.value)}
                    style={{ padding: "10px 12px", border: "1px solid #EEEEF4", borderRadius: 8, outline: "none", background: "#fff", fontSize: 13.5 }}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* Instructions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#6B7080" }}>General Instructions / Notice Notes</label>
                <textarea
                  value={notes} onChange={e => setNotes(e.target.value.slice(0, 100))}
                  placeholder="e.g. Carry original admit cards. No calculators allowed."
                  style={{ padding: "10px 12px", border: "1px solid #EEEEF4", borderRadius: 8, outline: "none", fontSize: 13.5, minHeight: 48, fontFamily: "inherit" }}
                />
              </div>

              {/* Target Classes Dropdown Selector (Teacher-style) */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#6B7080" }}>Target Classes <span style={{ fontWeight: 400, color: "#6B7080" }}>(Select Multiple)</span></label>
                <select
                  value=""
                  onChange={e => {
                    const val = e.target.value;
                    if (val && !formClasses.includes(val)) {
                      setFormClasses([...formClasses, val]);
                    }
                  }}
                  style={{ padding: "10px 12px", border: "1px solid #EEEEF4", borderRadius: 8, outline: "none", fontSize: 13.5, background: "#fff" }}
                >
                  <option value="">-- Add Class --</option>
                  {availableClasses.length > 0 ? (
                    availableClasses.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))
                  ) : (
                    <option value="" disabled>No classes created yet</option>
                  )}
                </select>

                {/* Selected Classes Tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                  {formClasses.map(cls => (
                    <span
                      key={cls}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 12px",
                        background: "#E0F2FE",
                        border: "1px solid #93C5FD",
                        color: "#0284C7",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {cls}
                      <button
                        type="button"
                        onClick={() => {
                          setFormClasses(formClasses.filter(c => c !== cls));
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#0284C7",
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: 13,
                          padding: "0 2px",
                          display: "inline-flex",
                          alignItems: "center"
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Target Subjects Dropdown Selector (Teacher-style) */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#6B7080" }}>Target Subjects <span style={{ fontWeight: 400, color: "#6B7080" }}>(Select Multiple)</span></label>
                <select
                  value=""
                  onChange={e => {
                    const val = e.target.value;
                    if (val && !schedules.some(s => s.subject === val)) {
                      setSchedules([...schedules, {
                        subject: val,
                        date: "",
                        startTime: "09:00 AM",
                        endTime: "12:00 PM",
                        maxMarks: "100",
                        passingMarks: "33",
                        room: `Room ${schedules.length + 1}`
                      }]);
                    }
                  }}
                  style={{ padding: "10px 12px", border: "1px solid #EEEEF4", borderRadius: 8, outline: "none", fontSize: 13.5, background: "#fff" }}
                >
                  <option value="">-- Add Subject --</option>
                  {availableSubjects.length > 0 ? (
                    availableSubjects.map(subj => (
                      <option key={subj} value={subj}>{subj}</option>
                    ))
                  ) : (
                    <option value="" disabled>No subjects created yet</option>
                  )}
                </select>

                {/* Selected Subjects Tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                  {schedules.map(row => (
                    <span
                      key={row.subject}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 12px",
                        background: "#E0F2FE",
                        border: "1px solid #93C5FD",
                        color: "#0284C7",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {row.subject}
                      <button
                        type="button"
                        onClick={() => {
                          setSchedules(schedules.filter(s => s.subject !== row.subject));
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#0284C7",
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: 13,
                          padding: "0 2px",
                          display: "inline-flex",
                          alignItems: "center"
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Timetable Format Mode Selector (Alternate) */}
              <div style={{ borderTop: "1px solid #EEEEF4", paddingTop: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 800, color: "#1E293B" }}>Timetable Format Selection (Alternate) *</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setTimetableMode("interactive")}
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: timetableMode === "interactive" ? "2px solid #0284C7" : "1px solid #D1D5DB",
                        background: timetableMode === "interactive" ? "#E0F2FE" : "#F9FAFB",
                        color: timetableMode === "interactive" ? "#0284C7" : "#4B5563",
                        fontWeight: 800,
                        fontSize: 12,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6
                      }}
                    >
                      📅 Interactive Subject-wise Timetable
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimetableMode("document")}
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: timetableMode === "document" ? "2px solid #0284C7" : "1px solid #D1D5DB",
                        background: timetableMode === "document" ? "#E0F2FE" : "#F9FAFB",
                        color: timetableMode === "document" ? "#0284C7" : "#4B5563",
                        fontWeight: 800,
                        fontSize: 12,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6
                      }}
                    >
                      📄 Upload Document (PDF / Image)
                    </button>
                  </div>
                </div>

                {/* Render File Uploader ONLY when mode === 'document' */}
                {timetableMode === "document" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, border: "1px dashed #BAE6FD", padding: 14, borderRadius: 12, background: "#F0F9FF" }}>
                    <label style={{ fontSize: 12, fontWeight: 800, color: "#0284C7" }}>Upload Timetable Sheet Document (PDF / Image)</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleTimetableUpload}
                        style={{ fontSize: 12, color: "#4B5563" }}
                      />
                      {timetableFile && (
                        <button
                          type="button"
                          onClick={() => {
                            const newTab = window.open();
                            newTab.document.write(`<iframe src="${timetableFile}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                          }}
                          style={{ padding: "4px 10px", background: "#E0F2FE", color: "#0284C7", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                        >
                          👁️ View Uploaded Document
                        </button>
                      )}
                    </div>
                    {timetableFileName && (
                      <span style={{ fontSize: 11, color: "#10B981", fontWeight: 700 }}>✓ {timetableFileName} Loaded</span>
                    )}
                  </div>
                )}

                {/* Render Subject datesheets table ONLY when mode === 'interactive' */}
                {timetableMode === "interactive" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: "#0284C7", textTransform: "uppercase", letterSpacing: "0.05em" }}>Subject-wise Timetable Sheet</h4>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {schedules.map((row, index) => (
                        <div key={index} style={{
                          display: "grid", gridTemplateColumns: "1.8fr 1.5fr 1.2fr 1.2fr 1fr 1fr 1.3fr 0.4fr", gap: 10,
                          alignItems: "center", padding: "12px 16px", border: "1px solid #EEEEF4", borderRadius: 12, background: "#F0F9FF"
                        }}>
                          {/* Subject Badge */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <label style={{ fontSize: 10, color: "#6B7080", fontWeight: 700 }}>Subject</label>
                            <span style={{
                              padding: "6px 10px",
                              background: "#E0F2FE",
                              border: "1px solid #93C5FD",
                              color: "#0284C7",
                              borderRadius: 8,
                              fontSize: 12.5,
                              fontWeight: 700,
                              textAlign: "center",
                              display: "block",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis"
                            }}>
                              {row.subject}
                            </span>
                          </div>

                          {/* Date */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <label style={{ fontSize: 10, color: "#6B7080", fontWeight: 700 }}>Exam Date</label>
                            <input
                              type="date"
                              required
                              value={row.date}
                              onChange={e => updateSubjectRow(index, "date", e.target.value)}
                              style={{ width: "100%", boxSizing: "border-box", padding: "5px 8px", border: "1px solid #EEEEF4", borderRadius: 6, fontSize: 12.5 }}
                            />
                          </div>

                          {/* Start Time */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <label style={{ fontSize: 10, color: "#6B7080", fontWeight: 700 }}>Start Time</label>
                            <input
                              type="text"
                              required
                              value={row.startTime}
                              onChange={e => updateSubjectRow(index, "startTime", e.target.value)}
                              placeholder="e.g. 09:00 AM"
                              style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", border: "1px solid #EEEEF4", borderRadius: 6, fontSize: 12.5 }}
                            />
                          </div>

                          {/* End Time */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <label style={{ fontSize: 10, color: "#6B7080", fontWeight: 700 }}>End Time</label>
                            <input
                              type="text"
                              required
                              value={row.endTime}
                              onChange={e => updateSubjectRow(index, "endTime", e.target.value)}
                              placeholder="e.g. 12:00 PM"
                              style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", border: "1px solid #EEEEF4", borderRadius: 6, fontSize: 12.5 }}
                            />
                          </div>

                          {/* Max marks */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <label style={{ fontSize: 10, color: "#6B7080", fontWeight: 700 }}>Max Marks</label>
                            <input
                              type="text"
                              required
                              value={row.maxMarks}
                              onChange={e => updateSubjectRow(index, "maxMarks", e.target.value.replace(/\D/g, '').slice(0, 3))}
                              style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", border: "1px solid #EEEEF4", borderRadius: 6, fontSize: 12.5 }}
                            />
                          </div>

                          {/* Pass marks */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <label style={{ fontSize: 10, color: "#6B7080", fontWeight: 700 }}>Min Pass</label>
                            <input
                              type="text"
                              required
                              value={row.passingMarks}
                              onChange={e => updateSubjectRow(index, "passingMarks", e.target.value.replace(/\D/g, '').slice(0, 3))}
                              style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", border: "1px solid #EEEEF4", borderRadius: 6, fontSize: 12.5 }}
                            />
                          </div>

                          {/* Room */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <label style={{ fontSize: 10, color: "#6B7080", fontWeight: 700 }}>Exam Hall</label>
                            <input
                              type="text"
                              required
                              value={row.room}
                              onChange={e => updateSubjectRow(index, "room", e.target.value.replace(/[^a-zA-Z0-9\s]/g, '').slice(0, 15))}
                              placeholder="e.g. Room 1"
                              style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", border: "1px solid #EEEEF4", borderRadius: 6, fontSize: 12.5 }}
                            />
                          </div>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => removeSubjectRow(index)}
                            style={{
                              background: "transparent", border: "none", color: "#E4574C", cursor: "pointer",
                              padding: "18px 0 0 0", display: "inline-flex", justifyContent: "center"
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10, borderTop: "1px solid #EEEEF4", paddingTop: 16 }}>
                <button
                  type="button" onClick={() => setIsModalOpen(false)}
                  style={{ padding: "10px 18px", background: "#EEEEF4", border: "none", borderRadius: 8, fontWeight: 700, color: "#6B7080", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "10px 18px", background: "#0284C7", border: "none", borderRadius: 8, fontWeight: 700, color: "#fff", cursor: "pointer" }}
                >
                  {editingExam ? "Save Changes" : "Schedule Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* View Exam Details Modal */}
      {viewingExam && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{
            background: "#fff", padding: 32, borderRadius: 18, width: 750, maxWidth: "95vw",
            maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16, borderBottom: "1px solid #EEEEF4", paddingBottom: 14 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#0284C7", background: "#E0F2FE", padding: "3px 9px", borderRadius: 8, textTransform: "uppercase" }}>
                  {viewingExam.status}
                </span>
                <h3 style={{ margin: "6px 0 0 0", fontSize: 20, fontWeight: 900, color: "#1F2333" }}>{viewingExam.name}</h3>
              </div>
              <button 
                onClick={() => setViewingExam(null)}
                style={{ background: "transparent", border: "none", fontSize: 22, cursor: "pointer", color: "#6B7080", fontWeight: 700 }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: 13.5, color: "#1F2333" }}>
              {viewingExam.notes && (
                <div style={{ fontSize: 12.5, color: "#4A7FA5", background: "#F0F9FF", padding: "12px 16px", borderRadius: 10, borderLeft: "4px solid #0284C7" }}>
                  💡 <strong>General Instructions:</strong> <em>{viewingExam.notes}</em>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <strong style={{ color: "#6B7080", display: "block", fontSize: 11, textTransform: "uppercase", marginBottom: 2 }}>Target Classes</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                    {(viewingExam.classes || "").split(", ").filter(Boolean).map(c => (
                      <span key={c} style={{ fontSize: 11, fontWeight: 800, color: "#0284C7", background: "#E0F2FE", padding: "2px 8px", borderRadius: 4 }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {viewingExam.timetableFile && (
                  <div>
                    <strong style={{ color: "#6B7080", display: "block", fontSize: 11, textTransform: "uppercase", marginBottom: 2 }}>Uploaded Timetable</strong>
                    <button
                      onClick={() => {
                        const newTab = window.open();
                        newTab.document.write(`<iframe src="${viewingExam.timetableFile}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                      }}
                      style={{ marginTop: 4, padding: "6px 12px", background: "#E0F2FE", color: "#0284C7", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                    >
                      📄 View Timetable Sheet
                    </button>
                  </div>
                )}
              </div>

              {/* Schedules Table */}
              <div style={{ borderTop: "1px solid #EEEEF4", paddingTop: 16 }}>
                <strong style={{ color: "#6B7080", display: "block", fontSize: 11, textTransform: "uppercase", marginBottom: 10 }}>
                  📅 Subject-wise Date Sheet
                </strong>
                {Array.isArray(viewingExam.schedules) && viewingExam.schedules.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {viewingExam.schedules.map((sub, sIdx) => (
                      <div 
                        key={sIdx} 
                        style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center", 
                          fontSize: 12.5, 
                          padding: "10px 14px", 
                          background: "#F8FAFC", 
                          borderRadius: 12, 
                          border: "1px solid #EEEEF4"
                        }}
                      >
                        <div>
                          <strong style={{ color: "#1F2333", display: "block", fontSize: 13.5 }}>{sub.subject}</strong>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#6B7080", fontSize: 11.5, marginTop: 4 }}>
                            <span>🕒 {sub.startTime} - {sub.endTime}</span>
                            <span style={{ color: "#E2E8F0" }}>|</span>
                            <span>📍 Room: {sub.room}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ color: "#0284C7", fontWeight: 800, fontSize: 12.5 }}>{sub.date}</span>
                          <div style={{ color: "#17A673", fontSize: 11, fontWeight: 700, marginTop: 4 }}>
                            Marks: {sub.maxMarks} (Pass: {sub.passingMarks})
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: 13, color: "#94A3B8" }}>No schedules registered.</span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid #EEEEF4", paddingTop: 18, marginTop: 18 }}>
              <button
                type="button" 
                onClick={() => {
                  setViewingExam(null);
                  handleOpenEdit(viewingExam);
                }}
                style={{ padding: "8px 16px", background: "#EFF6FF", color: "#2563EB", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
              >
                ✏️ Edit Exam
              </button>
              <button
                type="button" 
                onClick={() => setViewingExam(null)}
                style={{ padding: "8px 16px", background: "#EEEEF4", color: "#6B7080", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
