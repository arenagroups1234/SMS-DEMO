import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Search, Plus, Calendar, Clock, UserCheck, UserMinus, ShieldAlert, Edit2, Trash2, Download, Eye } from "lucide-react";
import { toast } from "sonner";
import { hostelVisitorsApi, hostelStudentsApi } from "../../services/api";

export default function Visitors() {
  const { schoolId } = useParams();
  const [visitors, setVisitors] = useState(() => {
    const saved = localStorage.getItem(`sms_${schoolId}_hostel_visitors`);
    if (saved && saved !== "[]") {
      try {
        const parsed = JSON.parse(saved);
        return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [students, setStudents] = useState([]);

  useEffect(() => {
    hostelVisitorsApi.getAll({ schoolId }).then(res => {
      if (res && res.data) {
        setVisitors(res.data);
      }
    }).catch(() => {});

    hostelStudentsApi.getAll({ schoolId }).then(res => {
      if (res && res.data) {
        setStudents(res.data);
      }
    }).catch(() => {});
  }, [schoolId]);

  useEffect(() => {
    localStorage.setItem(`sms_${schoolId}_hostel_visitors`, JSON.stringify(visitors));
  }, [visitors, schoolId]);

  // View state: "list" or "log"
  const [currentView, setCurrentView] = useState("list");

  // View Visitor Pass Modal State
  const [showViewVisitorModal, setShowViewVisitorModal] = useState(false);
  const [viewingVisitor, setViewingVisitor] = useState(null);

  // Edit Visitor Modal State
  const [showEditVisitorModal, setShowEditVisitorModal] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState(null);
  const [editVisName, setEditVisName] = useState("");
  const [editVisPhone, setEditVisPhone] = useState("");
  const [editVisRelation, setEditVisRelation] = useState("Father");
  const [editVisPurpose, setEditVisPurpose] = useState("");
  const [editVisStatus, setEditVisStatus] = useState("Inside");

  // Form State
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRelation, setNewRelation] = useState("Father");
  const [newStudent, setNewStudent] = useState("");
  const [newPurpose, setNewPurpose] = useState("");

  const handleCreateVisitor = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newStudent) {
      toast.error("Please fill in Visitor Name and select a Resident Student.");
      return;
    }
    const nameRegex = /^[A-Za-z\s.]+$/;
    if (!nameRegex.test(newName.trim())) {
      toast.error("Visitor Name should contain only letters and spaces. Numbers and special characters are not allowed.");
      return;
    }
    if (!/^\d{10}$/.test(newPhone.trim())) {
      toast.error("Visitor Contact Phone must be exactly 10 digits without spaces or special characters.");
      return;
    }
    
    const now = new Date();
    const entryTimeString = now.toLocaleDateString('en-GB') + " " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const newV = {
      id: String(Date.now()),
      name: newName.trim(),
      phone: "+91 " + newPhone.trim(),
      relation: newRelation,
      studentName: newStudent,
      purpose: newPurpose.trim(),
      entryTime: entryTimeString,
      exitTime: "",
      status: "Inside",
      schoolId: schoolId || ""
    };

    try {
      await hostelVisitorsApi.create(newV);
    } catch (err) {}

    setVisitors([newV, ...visitors]);
    
    // Reset
    setNewName("");
    setNewPhone("");
    setNewStudent("");
    setNewPurpose("");
    setCurrentView("list");
    toast.success(`Visitor log entry created for ${newName}.`);
  };

  const handleCheckoutVisitor = async (id) => {
    const now = new Date();
    const exitTimeString = now.toLocaleDateString('en-GB') + " " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const updatedVisitors = visitors.map(v => v.id === id ? { ...v, status: "Checked Out", exitTime: exitTimeString } : v);
    setVisitors(updatedVisitors);
    const target = updatedVisitors.find(v => v.id === id);
    if (target) {
      try {
        await hostelVisitorsApi.update(id, target);
      } catch (err) {}
    }
    toast.success("Visitor logged out successfully.");
  };

  const handleDeleteVisitor = async (vis) => {
    if (window.confirm(`Are you sure you want to delete visitor log for ${vis.name}?`)) {
      setVisitors(visitors.filter(v => v.id !== vis.id));
      try { await hostelVisitorsApi.delete(vis.id); } catch (err) {}
      toast.success("Visitor record deleted.");
    }
  };

  const handleEditVisitorSubmit = async (e) => {
    e.preventDefault();
    if (!editVisName.trim() || editVisPhone.length !== 10) {
      toast.error("Please fill in valid name and exactly 10-digit phone number.");
      return;
    }
    const updated = visitors.map(v => v.id === editingVisitor.id ? {
      ...v,
      name: editVisName.trim(),
      phone: "+91 " + editVisPhone.trim(),
      relation: editVisRelation,
      purpose: editVisPurpose.trim(),
      status: editVisStatus
    } : v);
    setVisitors(updated);
    try { await hostelVisitorsApi.update(editingVisitor.id, updated.find(v => v.id === editingVisitor.id)); } catch (err) {}
    setShowEditVisitorModal(false);
    setEditingVisitor(null);
    toast.success("Visitor details updated.");
  };

  const handleExportVisitorsCSV = () => {
    if (visitors.length === 0) {
      toast.error("No visitor logs available to export.");
      return;
    }
    toast.success("Exporting visitor logs CSV report...");
    const headers = ["ID,Visitor Name,Phone,Relation,Student Visited,Purpose,Entry Time,Exit Time,Status"];
    const rows = visitors.map(v => `"${v.id}","${v.name}","${v.phone || ''}","${v.relation}","${v.studentName}","${v.purpose}","${v.entryTime}","${v.exitTime || 'Inside'}","${v.status}"`);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Hostel_Visitor_Logs_${schoolId || 'portal'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadVisitorPass = (vis) => {
    toast.success(`Downloading gate pass / entry slip for ${vis.name}...`);
    const headers = ["Gate Pass ID,Visitor Name,Phone,Relation,Student Visited,Purpose,Entry Time,Exit Time,Status"];
    const rows = [`"${vis.id}","${vis.name}","${vis.phone || ''}","${vis.relation}","${vis.studentName}","${vis.purpose}","${vis.entryTime}","${vis.exitTime || 'Inside'}","${vis.status}"`];
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Visitor_Gate_Pass_${vis.id}_${vis.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (currentView === "log") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
        {/* Header with Back button */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => setCurrentView("list")}
            style={{
              padding: "8px 16px",
              background: "#F1F5F9",
              color: "#475569",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            ← Back to Visitors
          </button>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", margin: 0 }}>Log Visitor Entry</h2>
        </div>

        <div style={{ background: "#fff", padding: 32, borderRadius: 20, border: "1px solid #E2E8F0", maxWidth: 600, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
          <form onSubmit={handleCreateVisitor}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 28 }}>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Visitor Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Phone Number (10 digits) *</label>
                  <input
                    required
                    type="text"
                    placeholder="10-digit mobile number"
                    value={newPhone}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setNewPhone(cleaned);
                    }}
                    style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Relation to Student</label>
                  <select
                    value={newRelation}
                    onChange={(e) => setNewRelation(e.target.value)}
                    style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none", background: "#fff" }}
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Local Guardian">Local Guardian</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Select Visited Student *</label>
                  <select
                    required
                    value={newStudent}
                    onChange={(e) => setNewStudent(e.target.value)}
                    style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none", background: "#fff" }}
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map(st => (
                      <option key={st.id} value={`${st.name} (${st.id})`}>
                        {st.name} ({st.id}) — Room {st.roomNumber}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Purpose of Visit</label>
                <textarea
                  placeholder="e.g. Delivering home food and emergency medicine..."
                  value={newPurpose}
                  onChange={(e) => setNewPurpose(e.target.value)}
                  rows="4"
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "inherit", resize: "none" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={() => setCurrentView("list")}
                style={{ flex: 1, padding: "12px", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 14, cursor: "pointer", background: "none", color: "#64748B", fontWeight: 700 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ flex: 1, padding: "12px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, cursor: "pointer", fontWeight: 700 }}
              >
                Log Entry
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, paddingBottom: 40 }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.5px" }}>Visitor Logs</h1>
          <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: 14 }}>Track campus security entries and exit timestamps of hostel guests.</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={handleExportVisitorsCSV}
            style={{
              padding: "11px 18px",
              background: "#F1F5F9",
              color: "#334155",
              border: "1px solid #CBD5E1",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 13.5,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
            title="Export Visitor Logs"
          >
            <Download size={16} /> <span>Export CSV</span>
          </button>
          <button
            onClick={() => setCurrentView("log")}
            style={{
              padding: "11px 20px",
              background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 13.5,
              cursor: "pointer",
              boxShadow: "0 4px 12px -2px rgba(79, 70, 229, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.15s ease"
            }}
          >
            <Plus size={16} /> <span>Log Entry</span>
          </button>
        </div>
      </div>

      {/* Visitor list table */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
              <th style={{ padding: "18px 24px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>Visitor Details</th>
              <th style={{ padding: "18px 24px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>Relation</th>
              <th style={{ padding: "18px 24px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>Student Visited</th>
              <th style={{ padding: "18px 24px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>Purpose</th>
              <th style={{ padding: "18px 24px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>Entry / Exit</th>
              <th style={{ padding: "18px 24px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</th>
              <th style={{ padding: "18px 24px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visitors.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>No visitors logged today.</td>
              </tr>
            ) : (
              visitors.map(vis => (
                <tr key={vis.id} style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.15s" }}>
                  <td style={{ padding: "18px 24px" }}>
                    <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 14.5 }}>{vis.name}</div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{vis.phone}</div>
                  </td>
                  <td style={{ padding: "18px 24px", fontSize: 14, color: "#334155" }}>{vis.relation}</td>
                  <td style={{ padding: "18px 24px", fontSize: 14, fontWeight: 700, color: "#1E293B" }}>{vis.studentName}</td>
                  <td style={{ padding: "18px 24px", fontSize: 13.5, color: "#475569", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={vis.purpose}>{vis.purpose}</td>
                  <td style={{ padding: "18px 24px" }}>
                    <div style={{ fontSize: 12.5, color: "#1E293B", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={12} style={{ color: "#2563EB" }} /> In: {vis.entryTime}
                    </div>
                    {vis.exitTime ? (
                      <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={12} style={{ color: "#94A3B8" }} /> Out: {vis.exitTime}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: "#D97706", fontStyle: "italic", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                        <ShieldAlert size={12} /> Still Inside
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "18px 24px" }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "4px 10px",
                      borderRadius: 8,
                      background: vis.status === "Inside" ? "#FFF4E5" : "#ECFDF5",
                      color: vis.status === "Inside" ? "#B45309" : "#047857",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4
                    }}>
                      {vis.status === "Inside" ? <UserCheck size={12} /> : <UserMinus size={12} />}
                      {vis.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "18px 24px", display: "flex", gap: 8, alignItems: "center" }}>
                    {vis.status === "Inside" ? (
                      <button
                        onClick={() => handleCheckoutVisitor(vis.id)}
                        style={{
                          background: "#F1F5F9", color: "#334155", border: "1px solid #CBD5E1",
                          padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer"
                        }}
                      >
                        Log Exit
                      </button>
                    ) : (
                      <span style={{ color: "#94A3B8", fontSize: 13 }}>Closed</span>
                    )}
                    <button
                      onClick={() => {
                        setViewingVisitor(vis);
                        setShowViewVisitorModal(true);
                      }}
                      title="View Gate Pass & Log Details"
                      style={{ background: "#ECFDF5", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#10B981" }}
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => handleDownloadVisitorPass(vis)}
                      title="Download Gate Pass Slip"
                      style={{ background: "#F1F5F9", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#334155" }}
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingVisitor(vis);
                        setEditVisName(vis.name);
                        setEditVisPhone(vis.phone ? vis.phone.replace(/\D/g, "").slice(-10) : "");
                        setEditVisRelation(vis.relation);
                        setEditVisPurpose(vis.purpose);
                        setEditVisStatus(vis.status);
                        setShowEditVisitorModal(true);
                      }}
                      title="Edit Visitor"
                      style={{ background: "#EEF2FF", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#4F46E5" }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteVisitor(vis)}
                      title="Delete Visitor"
                      style={{ background: "#FEF2F2", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#EF4444" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Visitor Modal */}
      {showEditVisitorModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <form onSubmit={handleEditVisitorSubmit} style={{
            background: "#fff", padding: 32, borderRadius: 20, width: "100%", maxWidth: 460,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)"
          }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: 20, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.5px" }}>Edit Visitor Details</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Visitor Name</label>
                <input
                  type="text"
                  value={editVisName}
                  onChange={(e) => setEditVisName(e.target.value)}
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Phone Number (10 digits)</label>
                <input
                  type="text"
                  value={editVisPhone}
                  onChange={(e) => setEditVisPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Relation</label>
                <select
                  value={editVisRelation}
                  onChange={(e) => setEditVisRelation(e.target.value)}
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none", background: "#fff" }}
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                  <option value="Local Guardian">Local Guardian</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Purpose</label>
                <input
                  type="text"
                  value={editVisPurpose}
                  onChange={(e) => setEditVisPurpose(e.target.value)}
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Status</label>
                <select
                  value={editVisStatus}
                  onChange={(e) => setEditVisStatus(e.target.value)}
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none", background: "#fff" }}
                >
                  <option value="Inside">Inside</option>
                  <option value="Checked Out">Checked Out</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="button"
                onClick={() => setShowEditVisitorModal(false)}
                style={{ padding: "10px 18px", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 13.5, cursor: "pointer", background: "none", color: "#64748B", fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: "10px 18px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 10, fontSize: 13.5, cursor: "pointer", fontWeight: 700 }}
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Visitor Gate Pass & Log Modal */}
      {showViewVisitorModal && viewingVisitor && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "#fff", borderRadius: 24, width: "100%", maxWidth: 520,
            padding: 32, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <span style={{ background: "#EEF2FF", color: "#4F46E5", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 800 }}>
                  HOSTEL GATE PASS
                </span>
                <h3 style={{ margin: "8px 0 0 0", fontSize: 20, fontWeight: 900, color: "#0F172A" }}>{viewingVisitor.name}</h3>
              </div>
              <span style={{
                background: viewingVisitor.status === "Inside" ? "#FEF2F2" : "#ECFDF5",
                color: viewingVisitor.status === "Inside" ? "#EF4444" : "#047857",
                padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 800
              }}>
                {viewingVisitor.status ? viewingVisitor.status.toUpperCase() : "CHECKED OUT"}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, background: "#F8FAFC", padding: 18, borderRadius: 14, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Relation</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>{viewingVisitor.relation}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Phone Contact</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>{viewingVisitor.phone || "N/A"}</div>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Visiting Student</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#4F46E5", marginTop: 2 }}>{viewingVisitor.studentName}</div>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Purpose of Visit</div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: "#334155", marginTop: 2 }}>{viewingVisitor.purpose || "General Visit"}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Entry Time</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>{viewingVisitor.entryTime || "N/A"}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Exit Time</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>{viewingVisitor.exitTime || "Still Inside"}</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="button"
                onClick={() => handleDownloadVisitorPass(viewingVisitor)}
                style={{ padding: "10px 18px", background: "#F1F5F9", color: "#334155", border: "none", borderRadius: 10, fontSize: 13.5, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}
              >
                <Download size={15} /> Download Pass
              </button>
              <button
                type="button"
                onClick={() => setShowViewVisitorModal(false)}
                style={{ padding: "10px 18px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 10, fontSize: 13.5, cursor: "pointer", fontWeight: 700 }}
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
