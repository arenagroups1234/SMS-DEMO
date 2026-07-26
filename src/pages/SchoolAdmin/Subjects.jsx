import { useState, useEffect } from "react";
import { BookOpen, Plus, Trash2, Eye, Edit2, X } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { subjectsApi, classesApi } from "../../services/api";

export default function PortalSubjects() {
  const { schoolId } = useParams();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [viewSubject, setViewSubject] = useState(null);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const res = await subjectsApi.getAll({ schoolId, limit: 100 });
      const backendSubjects = res.data || [];
      const uniqueSubjects = [];
      const seenNames = new Set();
      backendSubjects.forEach(s => {
        const key = (s.name || "").trim().toLowerCase();
        if (key && !seenNames.has(key)) {
          seenNames.add(key);
          uniqueSubjects.push(s);
        }
      });

      setSubjects(uniqueSubjects);
    } catch (err) {
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const cRes = await classesApi.getAll({ schoolId, limit: 100 });
        const dbClasses = (cRes.data || []).map(c => c.name).filter(Boolean);
        setAvailableClasses(Array.from(new Set(dbClasses)));
      } catch (err) {
        console.warn("Could not load dynamic classes:", err);
      }
    };

    loadSubjects();
    fetchClasses();
  }, [schoolId]);

  const handleOpenCreate = () => {
    setEditingSubject(null);
    setName("");
    setCode("");
    setSelectedClasses([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub) => {
    setEditingSubject(sub);
    setName(sub.name || "");
    setCode(sub.code || "");
    
    const classList = sub.class ? sub.class.split(", ") : [];
    const typeList = sub.type ? sub.type.split(", ") : [];
    const parsedClasses = classList.map((clsName, idx) => ({
      name: clsName,
      type: typeList[idx] || typeList[0] || "Core"
    }));

    setSelectedClasses(parsedClasses);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const nameVal = name.trim();
    const codeVal = code.trim();
    if (!nameVal) {
      toast.error("Subject Name is required!");
      return;
    }
    if (nameVal.length < 2 || nameVal.length > 30) {
      toast.error("Subject Name must be between 2 and 30 characters!");
      return;
    }
    const nameRegex = /^[a-zA-Z0-9\s-]+$/;
    if (!nameRegex.test(nameVal)) {
      toast.error("Subject Name can only contain letters, numbers, spaces, and hyphens!");
      return;
    }
    if (!codeVal) {
      toast.error("Subject Code is required!");
      return;
    }
    if (codeVal.length < 2 || codeVal.length > 20) {
      toast.error("Subject Code must be between 2 and 20 characters!");
      return;
    }
    const codeRegex = /^[a-zA-Z0-9-]+$/;
    if (!codeRegex.test(codeVal)) {
      toast.error("Subject Code can only contain alphanumeric characters and hyphens!");
      return;
    }

    if (selectedClasses.length === 0) {
      toast.error("At least one Assigned Class is required!");
      return;
    }

    try {
      const payload = {
        name: nameVal,
        code: codeVal,
        type: selectedClasses.map(c => c.type).join(", "),
        class: selectedClasses.map(c => c.name).join(", "),
        schoolId: schoolId
      };

      if (editingSubject) {
        await subjectsApi.update(editingSubject.id, payload);
        toast.success("Subject updated successfully!");
      } else {
        await subjectsApi.create(payload);
        toast.success("Subject successfully registered!");
      }
      
      setIsModalOpen(false);
      setEditingSubject(null);
      setName("");
      setCode("");
      setSelectedClasses([]);
      loadSubjects();
    } catch (err) {
      toast.error("Failed to save subject: " + (err.message || err));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    try {
      await subjectsApi.delete(id);
      toast.success("Subject deleted successfully!");
      loadSubjects();
    } catch (err) {
      toast.error("Failed to delete subject: " + (err.message || err));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1E293B" }}>Course Subjects</h2>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Define subjects catalog codes and maps them to classes.</p>
        </div>

        <button
          onClick={handleOpenCreate}
          style={{
            padding: "10px 18px", background: "#000", color: "#fff", border: "none",
            borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6
          }}
        >
          <Plus size={16} /> Create Subject
        </button>
      </div>

      {/* Table Card */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 8 }}>
          <BookOpen size={16} color="#2563EB" />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>
            Total Subjects: <span style={{ color: "#2563EB" }}>{subjects.length}</span>
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["S.No.", "Subject Name", "Subject Code", "Assigned Classes & Types", "Actions"].map(col => (
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
                    Loading subjects...
                  </td>
                </tr>
              ) : subjects.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#94A3B8", fontSize: 14 }}>
                    No subjects registered yet. Click <strong>Create Subject</strong> to add one.
                  </td>
                </tr>
              ) : (
                subjects.map((sub, idx) => (
                  <tr
                    key={sub.id}
                    style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "14px 16px", color: "#94A3B8", fontWeight: 700 }}>
                      {String(idx + 1).padStart(2, "0")}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 800, color: "#1E293B" }}>{sub.name}</div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#2563EB", background: "#D8EEFF", padding: "3px 8px", borderRadius: 6 }}>
                        {sub.code}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {(sub.class ? sub.class.split(", ") : []).map((cls, classIdx) => {
                          const types = sub.type ? sub.type.split(", ") : [];
                          const t = types[classIdx] || types[0] || "Core";
                          return (
                            <div key={classIdx} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#F1F5F9", padding: "4px 8px", borderRadius: 8, fontSize: 11.5 }}>
                              <span style={{ fontWeight: 800, color: "#334155" }}>{cls}</span>
                              <span style={{
                                fontSize: 9.5,
                                fontWeight: 900,
                                color: t === "Core" ? "#15803D" : "#C2410C",
                                background: t === "Core" ? "#DCFCE7" : "#FFEDD5",
                                padding: "1px 5px",
                                borderRadius: 4
                              }}>
                                {t}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          title="View Details"
                          onClick={() => setViewSubject(sub)}
                          style={{ padding: "6px 12px", background: "#EFF6FF", color: "#2563EB", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
                          onMouseEnter={e => e.currentTarget.style.background = "#DBEAFE"}
                          onMouseLeave={e => e.currentTarget.style.background = "#EFF6FF"}
                        >
                          <Eye size={13} /> View
                        </button>
                        <button
                          title="Edit Subject"
                          onClick={() => handleOpenEdit(sub)}
                          style={{ padding: "6px 12px", background: "#FEF3C7", color: "#D97706", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
                          onMouseEnter={e => e.currentTarget.style.background = "#FDE68A"}
                          onMouseLeave={e => e.currentTarget.style.background = "#FEF3C7"}
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          title="Delete Subject"
                          onClick={() => handleDelete(sub.id)}
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

      {/* Subject Modal */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: 28, borderRadius: 16, width: "90%", maxWidth: 400, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", boxSizing: "border-box" }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: 18, fontWeight: 800, color: "#1F2937" }}>{editingSubject ? "Edit Subject" : "Register Subject"}</h3>
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Subject Name</label>
                <input
                  type="text" required placeholder="e.g. Science" maxLength={15}
                  value={name} onChange={e => setName(e.target.value)}
                  style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Subject Code</label>
                <input
                  type="text" required placeholder="e.g. SCI-09" maxLength={15}
                  value={code} onChange={e => setCode(e.target.value)}
                  style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Class Assigned *</label>
                <select
                  value=""
                  onChange={e => {
                    const val = e.target.value;
                    if (val && !selectedClasses.some(c => c.name === val)) {
                      setSelectedClasses([...selectedClasses, { name: val, type: "Core" }]);
                    }
                  }}
                  style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", background: "#fff", fontSize: 13.5 }}
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
                
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                  {selectedClasses.map(cls => (
                    <div
                      key={cls.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        background: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        padding: "6px 12px",
                        borderRadius: 8
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>{cls.name}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <select
                          value={cls.type}
                          onChange={e => {
                            const updated = selectedClasses.map(c => c.name === cls.name ? { ...c, type: e.target.value } : c);
                            setSelectedClasses(updated);
                          }}
                          style={{ padding: "4px 8px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 11.5, outline: "none", background: "#fff" }}
                        >
                          <option value="Core">Core</option>
                          <option value="Elective">Elective</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setSelectedClasses(selectedClasses.filter(c => c.name !== cls.name))}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#EF4444",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: 16,
                            padding: "0 4px",
                            display: "inline-flex",
                            alignItems: "center"
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button" onClick={() => {
                    setIsModalOpen(false);
                    setSelectedClasses([]);
                  }}
                  style={{ padding: "10px 18px", background: "#F3F4F6", border: "none", borderRadius: 8, fontWeight: 700, color: "#4B5563", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "10px 18px", background: "#2563EB", border: "none", borderRadius: 8, fontWeight: 700, color: "#fff", cursor: "pointer" }}
                >
                  {editingSubject ? "Save Changes" : "Register Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Subject Modal */}
      {viewSubject && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 18, width: "90%", maxWidth: 460, boxShadow: "0 20px 40px rgba(0,0,0,0.15)", overflow: "hidden", boxSizing: "border-box" }}>
            <div style={{ background: "linear-gradient(135deg, #1E40AF, #2563EB)", padding: "22px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, background: "rgba(255,255,255,0.2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BookOpen size={22} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#fff" }}>{viewSubject.name}</h3>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>Subject Code: {viewSubject.code}</span>
                </div>
              </div>
              <button onClick={() => setViewSubject(null)}
                style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} color="#fff" />
              </button>
            </div>

            <div style={{ padding: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ display: "flex", borderBottom: "1px solid #F1F5F9" }}>
                  <div style={{ padding: "12px 16px", width: 145, background: "#F8FAFC", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", flexShrink: 0 }}>
                    Subject Name
                  </div>
                  <div style={{ padding: "12px 16px", fontSize: 13.5, fontWeight: 800, color: "#1E293B" }}>
                    {viewSubject.name}
                  </div>
                </div>

                <div style={{ display: "flex", borderBottom: "1px solid #F1F5F9" }}>
                  <div style={{ padding: "12px 16px", width: 145, background: "#F8FAFC", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", flexShrink: 0 }}>
                    Subject Code
                  </div>
                  <div style={{ padding: "12px 16px", fontSize: 13.5, fontWeight: 600, color: "#2563EB" }}>
                    {viewSubject.code}
                  </div>
                </div>

                <div style={{ display: "flex" }}>
                  <div style={{ padding: "12px 16px", width: 145, background: "#F8FAFC", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", flexShrink: 0 }}>
                    Assigned Classes
                  </div>
                  <div style={{ padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {(viewSubject.class ? viewSubject.class.split(", ") : []).map((cls, idx) => {
                      const types = viewSubject.type ? viewSubject.type.split(", ") : [];
                      const t = types[idx] || types[0] || "Core";
                      return (
                        <div key={idx} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#F1F5F9", padding: "4px 8px", borderRadius: 8, fontSize: 11.5 }}>
                          <span style={{ fontWeight: 800, color: "#334155" }}>{cls}</span>
                          <span style={{
                            fontSize: 9.5,
                            fontWeight: 900,
                            color: t === "Core" ? "#15803D" : "#C2410C",
                            background: t === "Core" ? "#DCFCE7" : "#FFEDD5",
                            padding: "1px 5px",
                            borderRadius: 4
                          }}>
                            {t}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setViewSubject(null)}
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
