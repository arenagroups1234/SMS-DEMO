import { useState, useEffect } from "react";
import { BookOpen, FileText, Plus, Save, Trash2, Calendar, Award, Clock, ArrowRight, FileUp, Info, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { assignmentsApi, usersApi, subjectsApi, noticesApi } from "../../services/api";
import { useParams } from "react-router-dom";

const ASSIGNMENT_TYPES = ["Homework", "Project", "Lab Report", "Reading Assignment", "Practical Practice", "Other"];
const SUBMISSION_MODES = ["Online PDF upload", "Offline Physical Submission", "Online Text submission", "Either"];

export default function TPortalAssignments() {
  const { teacherId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);

  // Detailed Form Fields States
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [className, setClassName] = useState("");
  const [maxMarks, setMaxMarks] = useState("100");
  const [passingMarks, setPassingMarks] = useState("33");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("11:59 PM");
  const [description, setDescription] = useState("");
  const [assignmentType, setAssignmentType] = useState("Homework");
  const [submissionMode, setSubmissionMode] = useState("Online PDF upload");
  const [allowLate, setAllowLate] = useState(false);
  const [fileName, setFileName] = useState("");

  const [teacherClasses, setTeacherClasses] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);

  const loadAssignments = async () => {
    try {
      const storedUser = (() => { try { return JSON.parse(localStorage.getItem("sms_user") || "{}"); } catch { return {}; } })();
      const schoolId = storedUser.schoolId || "";
      const myTeacherId = teacherId || storedUser.id || "";
      const myRole = storedUser.role || "";

      let myClasses = [];
      try {
        const tRes = await usersApi.getById(myTeacherId);
        const tData = tRes.data || {};
        if (Array.isArray(tData.classes)) myClasses = tData.classes;
        else if (typeof tData.classes === "string") myClasses = tData.classes.split(",").map(c => c.trim()).filter(Boolean);
        else if (tData.class) myClasses = [tData.class];
      } catch (e) {}

      try {
        const { classesApi } = await import("../../services/api");
        const cRes = await classesApi.getAll({ schoolId, limit: 100 });
        const allClasses = cRes.data || [];
        allClasses.forEach(c => {
          if (c.teacherId === myTeacherId && c.name) {
            if (!myClasses.includes(c.name)) myClasses.push(c.name);
          }
        });
      } catch (e) {}

      const res = await assignmentsApi.getAll({ schoolId, limit: 100 });
      const backendAssignments = res.data || [];

      let filtered = backendAssignments.filter(a => {
        const creatorId = a.teacherId || a.createdBy;
        return Boolean(creatorId && String(creatorId) === String(myTeacherId));
      });
      if (filtered.length === 0) {
        filtered = backendAssignments;
      }

      const mapped = filtered.map(a => ({
        ...a,
        className: a.class || a.className
      }));
      setAssignments(mapped);
    } catch (err) {
      toast.error("Failed to load assignments logs");
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const storedUser = (() => { try { return JSON.parse(localStorage.getItem("sms_user") || "{}"); } catch { return {}; } })();
        
        let teacher = {};
        try {
          const tRes = await usersApi.getById(teacherId);
          if (tRes.data) {
            teacher = tRes.data;
          }
        } catch (tErr) {
          console.warn("Could not load teacher profile from DB:", tErr);
          teacher = storedUser;
        }

        const schoolId = teacher.schoolId || "";

        let classesList = [];
        if (Array.isArray(teacher.classes) && teacher.classes.length > 0) {
          classesList = teacher.classes;
        } else if (typeof teacher.classes === "string" && teacher.classes) {
          classesList = teacher.classes.split(",").map(c => c.trim()).filter(Boolean);
        } else if (typeof teacher.className === "string" && teacher.className) {
          classesList = teacher.className.split(",").map(c => c.trim()).filter(Boolean);
        } else if (teacher.class) {
          classesList = [teacher.class];
        }
        if (!classesList || classesList.length === 0) {
          classesList = ["9th A", "9th B", "10th A", "10th B", "11th Science"];
        }
        setTeacherClasses(classesList);

        const subRes = await subjectsApi.getAll({ schoolId, limit: 1000 });
        setAllSubjects(subRes.data || []);
      } catch (err) {
        console.warn("Failed to load metadata", err);
      }
    };
    loadMetadata();
  }, [teacherId]);

  useEffect(() => {
    if (!className) {
      setFilteredSubjects([]);
      setSubject("");
      return;
    }
    const filtered = allSubjects.filter(sub => {
      const subClass = sub.className || sub.class || "";
      const targetClass = className.trim().toLowerCase();
      if (!subClass || !targetClass) return false;

      const assignedClasses = subClass.split(",").map(c => c.trim().toLowerCase());
      return assignedClasses.includes(targetClass) || 
             assignedClasses.some(ac => ac.includes(targetClass) || targetClass.includes(ac));
    });
    setFilteredSubjects(filtered);
    
    if (filtered.length > 0) {
      const exists = filtered.find(s => s.name === subject);
      if (!exists) {
        setSubject(filtered[0].name);
      }
    } else {
      setSubject("");
    }
  }, [className, allSubjects]);

  const handleOpenAdd = () => {
    setEditingAssignment(null);
    setTitle("");
    setClassName("");
    setSubject("");
    setMaxMarks("100");
    setPassingMarks("33");
    setDueDate("");
    setDueTime("11:59 PM");
    setDescription("");
    setAssignmentType("Homework");
    setSubmissionMode("Online PDF upload");
    setAllowLate(false);
    setFileName("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (assignment) => {
    setEditingAssignment(assignment);
    setTitle(assignment.title);
    setClassName(assignment.className);
    setSubject(assignment.subject || "");
    setMaxMarks(assignment.maxMarks);
    setPassingMarks(assignment.passingMarks || "33");
    setDueDate(assignment.dueDate);
    setDueTime(assignment.dueTime || "11:59 PM");
    setDescription(assignment.description || "");
    setAssignmentType(assignment.assignmentType || "Homework");
    setSubmissionMode(assignment.submissionMode || "Online PDF upload");
    setAllowLate(assignment.allowLate || false);
    setFileName(assignment.fileName || "");
    setIsFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) {
      toast.error("Assignment Title and Due Date are required!");
      return;
    }

    const storedUser = (() => { try { return JSON.parse(localStorage.getItem("sms_user") || "{}"); } catch { return {}; } })();
    const schoolId = storedUser.schoolId || "";

    const payload = {
      title,
      subject,
      class: className,
      maxMarks,
      passingMarks,
      dueDate,
      dueTime,
      description,
      assignmentType,
      submissionMode,
      allowLate,
      fileName: fileName || "",
      teacherId: teacherId || storedUser.id || "",
      createdBy: teacherId || storedUser.id || "",
      schoolId: schoolId
    };

    try {
      if (editingAssignment) {
        // Edit Mode
        await assignmentsApi.update(editingAssignment.id, payload);
        toast.success("Assignment updated successfully!");
      } else {
        // Create Mode
        await assignmentsApi.create({
          ...payload,
          submissions: 0
        });

        // Create notification notice for parents/students
        try {
          await noticesApi.create({
            title: `New Assignment: ${title} (${className})`,
            description: `A new assignment has been posted: "${description.trim() || title}". Due date is ${dueDate} @ ${dueTime}. Max Marks: ${maxMarks}.`,
            category: "All",
            schoolId: schoolId,
            publishDate: new Date().toISOString(),
            status: "published"
          });
        } catch (noticeErr) {
          console.warn("Could not create assignment notice notification:", noticeErr);
        }

        toast.success("New Assignment added successfully!");
      }
      setIsFormOpen(false);
      loadAssignments();
    } catch (err) {
      toast.error("Failed to save assignment: " + (err.message || err));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) return;
    try {
      await assignmentsApi.delete(id);
      toast.success("Assignment deleted successfully!");
      loadAssignments();
    } catch (err) {
      toast.error("Failed to delete assignment: " + (err.message || err));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1E293B" }}>Class Assignments</h2>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Manage projects, submissions, and assignment guidelines.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          style={{
            padding: "10px 18px", background: "#0284C7", color: "#fff", border: "none",
            borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.15)"
          }}
        >
          <Plus size={16} /> New Assignment
        </button>
      </div>

      {/* Assignment Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
        {assignments.map(a => (
          <div key={a.id} style={{
            background: "#fff", border: "1px solid #BAE6FD", borderRadius: 16, padding: 22,
            boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.04)", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: "#0284C7", background: "#E0F2FE", padding: "3px 9px", borderRadius: 8 }}>
                    Class {a.className}
                  </span>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: "#10B981", background: "#DCFCE7", padding: "3px 9px", borderRadius: 8 }}>
                    {a.subject}
                  </span>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: "#475569", background: "#F1F5F9", padding: "3px 9px", borderRadius: 8 }}>
                    {a.assignmentType || "Homework"}
                  </span>
                </div>
                <div style={{
                  width: 42, height: 42, background: "#E0F2FE", borderRadius: 12,
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#0284C7", flexShrink: 0
                }}>
                  <FileText size={22} />
                </div>
              </div>

              <div>
                <h3 style={{ margin: "4px 0 6px 0", fontSize: 17, fontWeight: 900, color: "#1E293B", lineHeight: 1.3 }}>{a.title}</h3>
                {a.description && (
                  <p style={{ margin: 0, fontSize: 12.5, color: "#64748B", lineHeight: 1.5 }}>{a.description}</p>
                )}
              </div>
            </div>

            {a.fileName && (
              <div style={{ fontSize: 11.5, background: "#F8FAFC", padding: "6px 12px", borderRadius: 8, border: "1px dashed #CBD5E1", display: "flex", alignItems: "center", gap: 6, color: "#64748B" }}>
                📄 Material: <strong style={{ color: "#475569" }}>{a.fileName}</strong>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid #F1F5F9", paddingTop: 14, fontSize: 12.5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#475569" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Award size={14} color="#94A3B8" /> Marks: <strong>{a.maxMarks}</strong> <span style={{ color: "#64748B", fontSize: 11 }}>(Passing: {a.passingMarks || "33"})</span>
                </span>
                <span>Mode: <strong style={{ color: "#0284C7" }}>{a.submissionMode || "Online"}</strong></span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#475569" }}>
                <span>Submissions: <strong style={{ color: "#16A34A" }}>{a.submissions}</strong></span>
                <span style={{ fontSize: 11, color: a.allowLate ? "#16A34A" : "#EF4444", fontWeight: 700 }}>
                  {a.allowLate ? "✓ Late Submission Allowed" : "✗ No Late Submission"}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #F1F5F9", paddingTop: 14 }}>
              <span style={{ fontSize: 12, color: "#EF4444", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Calendar size={13} /> Due: {a.dueDate} @ {a.dueTime || "11:59 PM"}
              </span>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  onClick={() => handleOpenEdit(a)}
                  style={{ background: "transparent", border: "none", color: "#0284C7", cursor: "pointer", padding: 2, display: "inline-flex", alignItems: "center", fontSize: 14 }}
                  title="Edit Assignment"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  style={{ background: "transparent", border: "none", color: "#EF4444", cursor: "pointer", padding: 2, display: "inline-flex", alignItems: "center" }}
                  title="Delete Assignment"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Assignment Modal overlay */}
      {isFormOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{
            background: "#fff", padding: 28, borderRadius: 16, width: 620, maxWidth: "95vw",
            maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
          }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: 19, fontWeight: 900, color: "#1E293B", borderBottom: "1px solid #BAE6FD", paddingBottom: 12 }}>
              {editingAssignment ? "✏️ Edit Class Assignment Details" : "➕ Schedule New Class Assignment"}
            </h3>
            
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* Assignment Title */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#475569" }}>Assignment Title</label>
                <input
                  type="text" placeholder="e.g. Quantum Mechanics Lab Report" required
                  value={title} onChange={e => setTitle(e.target.value)}
                  style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                />
              </div>

              {/* Class & Subject */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: "#475569" }}>Target Class</label>
                  <select
                    value={className} onChange={e => setClassName(e.target.value)} required
                    style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, background: "#fff", outline: "none", fontSize: 13.5 }}
                  >
                    <option value="">Choose Class...</option>
                    {teacherClasses.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: "#475569" }}>Subject</label>
                  <select
                    value={subject} onChange={e => setSubject(e.target.value)} required
                    disabled={!className}
                    style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, background: "#fff", outline: "none", fontSize: 13.5 }}
                  >
                    {!className ? (
                      <option value="">Choose Class First...</option>
                    ) : filteredSubjects.length === 0 ? (
                      <option value="">No subjects assigned</option>
                    ) : (
                      <>
                        <option value="">Choose Subject...</option>
                        {filteredSubjects.map(sub => (
                          <option key={sub.id || sub.name} value={sub.name}>{sub.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Scores Criteria */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: "#475569" }}>Maximum Score</label>
                  <input
                    type="number" required value={maxMarks} onChange={e => setMaxMarks(e.target.value)}
                    style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: "#475569" }}>Passing Score Target</label>
                  <input
                    type="number" required value={passingMarks} onChange={e => setPassingMarks(e.target.value)}
                    style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                  />
                </div>
              </div>

              {/* Types & Submissions */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: "#475569" }}>Assignment Type</label>
                  <select
                    value={assignmentType} onChange={e => setAssignmentType(e.target.value)}
                    style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, background: "#fff", outline: "none", fontSize: 13.5 }}
                  >
                    {ASSIGNMENT_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: "#475569" }}>Submission Mode</label>
                  <select
                    value={submissionMode} onChange={e => setSubmissionMode(e.target.value)}
                    style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, background: "#fff", outline: "none", fontSize: 13.5 }}
                  >
                    {SUBMISSION_MODES.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Due Date & Timings */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: "#475569" }}>Due Date</label>
                  <input
                    type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)}
                    style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5, background: "#fff" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: "#475569" }}>Due Time Limit</label>
                  <input
                    type="text" required placeholder="e.g. 11:59 PM"
                    value={dueTime} onChange={e => setDueTime(e.target.value)}
                    style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                  />
                </div>
              </div>

              {/* Description guidelines */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#475569" }}>Detailed Instructions / Guidelines</label>
                <textarea
                  rows="3" placeholder="Outline guidelines, list chapters covered, reference resources guidelines..."
                  value={description} onChange={e => setDescription(e.target.value)}
                  style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", resize: "vertical", fontSize: 13.5, fontFamily: "inherit" }}
                />
              </div>

              {/* Allow Late submissions check */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #BAE6FD", padding: 12, borderRadius: 10, background: "#F8FAFC" }}>
                <input
                  type="checkbox"
                  id="allow-late"
                  checked={allowLate}
                  onChange={e => setAllowLate(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: "pointer" }}
                />
                <label htmlFor="allow-late" style={{ fontSize: 12.5, fontWeight: 800, color: "#1E293B", cursor: "pointer" }}>
                  Allow Late Submissions (Late submissions will be flagged for review)
                </label>
              </div>

              {/* Attachments reference PDF */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, border: "1px solid #BAE6FD", padding: 12, borderRadius: 10, background: "#F8FAFC" }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
                  <FileUp size={15} color="#0284C7" /> Upload Reference File / Question Sheet
                </label>
                <input
                  type="file"
                  onChange={e => {
                    if (e.target.files[0]) {
                      setFileName(e.target.files[0].name);
                    }
                  }}
                  style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}
                />
                {fileName && (
                  <span style={{ fontSize: 11, color: "#10B981", fontWeight: 700 }}>✓ Attachment Added: {fileName}</span>
                )}
              </div>

              {/* Form Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10, borderTop: "1px solid #BAE6FD", paddingTop: 16 }}>
                <button
                  type="button" onClick={() => setIsFormOpen(false)}
                  style={{ padding: "10px 18px", background: "#F3F4F6", border: "none", borderRadius: 8, fontWeight: 700, color: "#4B5563", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "10px 18px", background: "#0284C7", border: "none", borderRadius: 8, fontWeight: 700, color: "#fff", cursor: "pointer" }}
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
