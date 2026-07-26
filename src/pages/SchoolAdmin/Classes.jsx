import { useState, useEffect } from "react";
import { usersApi, classesApi } from "../../services/api";
import { BookOpen, Users, UserCheck, Plus, Trash2, Eye, X, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";

export default function PortalClasses() {
  const { schoolId } = useParams();
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewClass, setViewClass] = useState(null);
  const [editingClass, setEditingClass] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const tRes = await usersApi.getAll({ role: "teacher", schoolId, limit: 100 });
      const activeTeachers = tRes.data || [];
      setTeachers(activeTeachers);

      const cRes = await classesApi.getAll({ schoolId, limit: 100 });
      const backendClasses = cRes.data || [];

      const sRes = await usersApi.getAll({ role: "student", schoolId, limit: 100 });
      const students = sRes.data || [];

      const classSizes = {};
      students.forEach(s => {
        const cName = s.className || s.class || "";
        if (cName) {
          const key = cName.trim().toLowerCase();
          classSizes[key] = (classSizes[key] || 0) + 1;
        }
      });

      const mappedClasses = backendClasses.map(c => {
        const teacher = activeTeachers.find(t => t.id === c.teacherId);
        return {
          id: c.id,
          name: c.name,
          teacherId: c.teacherId,
          teacherName: teacher ? teacher.name : "Not Assigned",
          teacherEmail: teacher ? (teacher.email || "—") : "—",
          teacherPhone: teacher ? (teacher.phone || "—") : "—",
          studentsCount: classSizes[c.name.trim().toLowerCase()] || 0
        };
      });

      const uniqueClasses = [];
      const seenNames = new Set();
      mappedClasses.forEach(c => {
        const key = (c.name || "").trim().toLowerCase();
        if (key && !seenNames.has(key)) {
          seenNames.add(key);
          uniqueClasses.push(c);
        }
      });

      setClasses(uniqueClasses);
    } catch (err) {
      toast.error("Failed to load classes directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [schoolId]);

  const handleOpenAddModal = () => {
    setEditingClass(null);
    setNewClassName("");
    setSelectedTeacherId("");
    setIsModalOpen(true);
  };

  const handleEditClick = (cls) => {
    setEditingClass(cls);
    setNewClassName(cls.name);
    setSelectedTeacherId(cls.teacherId || "");
    setIsModalOpen(true);
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    const nameVal = newClassName.trim();
    if (!nameVal) { toast.error("Class name is required!"); return; }
    if (nameVal.length < 2 || nameVal.length > 15) { toast.error("Class & Section Name must be between 2 and 15 characters!"); return; }
    const classRegex = /^[a-zA-Z0-9\s-]+$/;
    if (!classRegex.test(nameVal)) { toast.error("Class name can only contain alphanumeric characters, spaces, and hyphens!"); return; }
    try {
      if (editingClass) {
        await classesApi.update(editingClass.id, { name: nameVal, schoolId, teacherId: selectedTeacherId || null });
        toast.success(`Class ${nameVal} successfully updated!`);
      } else {
        await classesApi.create({ name: nameVal, schoolId, teacherId: selectedTeacherId || null });
        toast.success(`Class ${nameVal} successfully registered!`);
      }
      setIsModalOpen(false);
      setNewClassName("");
      setSelectedTeacherId("");
      setEditingClass(null);
      loadData();
    } catch (err) {
      toast.error("Failed to save class: " + (err.message || err));
    }
  };

  const handleDeleteClass = async (id) => {
    if (!window.confirm("Are you sure you want to delete this class?")) return;
    try {
      await classesApi.delete(id);
      toast.success("Class deleted successfully!");
      loadData();
    } catch (err) {
      toast.error("Failed to delete class: " + (err.message || err));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1E293B" }}>Classes &amp; Sections</h2>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Configure classrooms, sections, and assigned class instructors.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          style={{ padding: "10px 18px", background: "#000", color: "#fff", border: "none", borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <Plus size={16} /> Register Class
        </button>
      </div>

      {/* Table Card */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden" }}>

        {/* Stats Bar */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 8 }}>
          <BookOpen size={16} color="#2563EB" />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>
            Total Classes: <span style={{ color: "#2563EB" }}>{classes.length}</span>
          </span>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["S.No.", "Class Name", "Class Teacher", "Active Students", "Actions"].map(col => (
                  <th key={col} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11.5, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
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
                    No classes registered yet. Click <strong>Register Class</strong> to add one.
                  </td>
                </tr>
              ) : (
                classes.map((cls, idx) => (
                  <tr
                    key={cls.id}
                    style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "14px 16px", color: "#94A3B8", fontWeight: 700 }}>
                      {String(idx + 1).padStart(2, "0")}
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, background: "#EFF6FF", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <BookOpen size={16} color="#2563EB" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: "#1E293B" }}>{cls.name}</div>
                          <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>Campus Standard</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <UserCheck size={15} color={cls.teacherName === "Not Assigned" ? "#F59E0B" : "#10B981"} />
                        <span style={{ fontWeight: 600, color: cls.teacherName === "Not Assigned" ? "#F59E0B" : "#1E293B" }}>
                          {cls.teacherName}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Users size={15} color="#6366F1" />
                        <span style={{ fontWeight: 700, color: "#1E293B" }}>{cls.studentsCount}</span>
                        <span style={{ color: "#94A3B8", fontSize: 12 }}>students</span>
                      </div>
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          title="View Details"
                          onClick={() => setViewClass(cls)}
                          style={{ padding: "6px 12px", background: "#EFF6FF", color: "#2563EB", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
                          onMouseEnter={e => e.currentTarget.style.background = "#DBEAFE"}
                          onMouseLeave={e => e.currentTarget.style.background = "#EFF6FF"}
                        >
                          <Eye size={13} /> View
                        </button>
                        <button
                          title="Edit Class"
                          onClick={() => handleEditClick(cls)}
                          style={{ padding: "6px 12px", background: "#F0FDF4", color: "#16A34A", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
                          onMouseEnter={e => e.currentTarget.style.background = "#DCFCE7"}
                          onMouseLeave={e => e.currentTarget.style.background = "#F0FDF4"}
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          title="Delete Class"
                          onClick={() => handleDeleteClass(cls.id)}
                          style={{ padding: "6px 12px", background: "#FEF2F2", color: "#DC2626", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
                          onMouseEnter={e => e.currentTarget.style.background = "#FEE2E2"}
                          onMouseLeave={e => e.currentTarget.style.background = "#FEF2F2"}
                        >
                          <Trash2 size={13} /> Delete
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

      {/* Register Class Modal */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: 28, borderRadius: 16, width: "90%", maxWidth: 400, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", boxSizing: "border-box" }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: 18, fontWeight: 800, color: "#1F2937" }}>
              {editingClass ? "Edit Classroom" : "Register Classroom"}
            </h3>
            <form onSubmit={handleCreateClass} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Class &amp; Section Name</label>
                <input
                  type="text" required placeholder="e.g. 11th B" maxLength={15}
                  value={newClassName} onChange={e => setNewClassName(e.target.value)}
                  style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Assign Class Teacher</label>
                <select
                  value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)}
                  style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", background: "#fff" }}
                >
                  <option value="">Choose Instructor...</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingClass(null); }}
                  style={{ padding: "10px 18px", background: "#F3F4F6", border: "none", borderRadius: 8, fontWeight: 700, color: "#4B5563", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ padding: "10px 18px", background: "#2563EB", border: "none", borderRadius: 8, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
                  {editingClass ? "Save Changes" : "Register Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Class Modal */}
      {viewClass && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 18, width: "90%", maxWidth: 460, boxShadow: "0 20px 40px rgba(0,0,0,0.15)", overflow: "hidden", boxSizing: "border-box" }}>

            {/* Modal Header */}
            <div style={{ background: "linear-gradient(135deg, #1E40AF, #2563EB)", padding: "22px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, background: "rgba(255,255,255,0.2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BookOpen size={22} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#fff" }}>Class {viewClass.name}</h3>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>Campus Standard</span>
                </div>
              </div>
              <button onClick={() => setViewClass(null)}
                style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} color="#fff" />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>

                {[
                  { label: "Class Name", value: viewClass.name, bold: true },
                  { label: "Class Teacher", value: viewClass.teacherName, color: viewClass.teacherName === "Not Assigned" ? "#F59E0B" : "#1E293B" },
                  { label: "Teacher Email", value: viewClass.teacherEmail },
                  { label: "Teacher Phone", value: viewClass.teacherPhone },
                  { label: "Active Students", value: `${viewClass.studentsCount} Students`, color: "#6366F1" },
                ].map((row, i, arr) => (
                  <div key={row.label} style={{ display: "flex", borderBottom: i < arr.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                    <div style={{ padding: "12px 16px", width: 145, background: "#F8FAFC", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", flexShrink: 0 }}>
                      {row.label}
                    </div>
                    <div style={{ padding: "12px 16px", fontSize: 13.5, fontWeight: row.bold ? 800 : 600, color: row.color || "#475569" }}>
                      {row.value}
                    </div>
                  </div>
                ))}

                {/* Status row */}
                <div style={{ display: "flex" }}>
                  <div style={{ padding: "12px 16px", width: 145, background: "#F8FAFC", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", flexShrink: 0 }}>
                    Status
                  </div>
                  <div style={{ padding: "12px 16px" }}>
                    <span style={{ padding: "4px 12px", borderRadius: 20, background: "#D1FAE5", color: "#065F46", fontSize: 12, fontWeight: 700 }}>
                      Active
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setViewClass(null)}
                style={{ marginTop: 18, width: "100%", padding: 11, background: "#F1F5F9", border: "none", borderRadius: 10, fontSize: 13.5, fontWeight: 700, color: "#475569", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
