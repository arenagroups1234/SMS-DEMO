import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Plus, CheckCircle, Clock, AlertTriangle, AlertCircle, Wrench, Edit2, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { hostelMaintenanceApi } from "../../services/api";

export default function Maintenance() {
  const { schoolId } = useParams();
  const [complaints, setComplaints] = useState(() => {
    const saved = localStorage.getItem(`sms_${schoolId}_hostel_maintenance`);
    if (saved && saved !== "[]") {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    hostelMaintenanceApi.getAll({ schoolId }).then(res => {
      if (res && res.data) {
        setComplaints(res.data);
      }
    }).catch(() => {});
  }, [schoolId]);

  useEffect(() => {
    localStorage.setItem(`sms_${schoolId}_hostel_maintenance`, JSON.stringify(complaints));
  }, [complaints, schoolId]);

  // View state: "list" or "register"
  const [currentView, setCurrentView] = useState("list");

  // Form State
  const [newRoom, setNewRoom] = useState("");
  const [newType, setNewType] = useState("Plumbing");
  const [newDesc, setNewDesc] = useState("");
  const [newSeverity, setNewSeverity] = useState("Medium");

  // Edit Ticket Modal State
  const [showEditTicketModal, setShowEditTicketModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [editRoom, setEditRoom] = useState("");
  const [editType, setEditType] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editSeverity, setEditSeverity] = useState("");
  const [editStatus, setEditStatus] = useState("");

  // Load active rooms from registered students
  const [rooms] = useState(() => {
    const saved = localStorage.getItem(`sms_${schoolId}_hostel_students`);
    if (saved && saved !== "[]") {
      try {
        const studentsList = JSON.parse(saved);
        const uniqueRooms = [...new Set(studentsList.map(s => s.roomNumber).filter(Boolean))];
        return uniqueRooms.sort();
      } catch (e) {}
    }
    return [];
  });

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    if (!newRoom.trim()) {
      toast.error("Please select a valid Room Number.");
      return;
    }
    if (!newDesc.trim() || newDesc.trim().length < 5) {
      toast.error("Please enter a detailed description of the maintenance issue (minimum 5 characters).");
      return;
    }
    const newC = {
      id: String(Date.now()),
      roomNumber: newRoom.trim(),
      type: newType,
      description: newDesc.trim(),
      dateReported: new Date().toISOString().split("T")[0],
      severity: newSeverity,
      status: "Pending",
      schoolId: schoolId || ""
    };

    try {
      await hostelMaintenanceApi.create(newC);
    } catch (err) {}

    setComplaints([newC, ...complaints]);
    
    // Reset Form
    setNewRoom("");
    setNewDesc("");
    setCurrentView("list");
    toast.success(`Complaint registered successfully for Room ${newRoom}.`);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    const updated = complaints.map(c => c.id === id ? { ...c, status: newStatus } : c);
    setComplaints(updated);
    const target = updated.find(c => c.id === id);
    if (target) {
      try {
        await hostelMaintenanceApi.update(id, target);
      } catch (err) {}
    }
    toast.success(`Ticket status updated to ${newStatus}.`);
  };

  const handleEditTicketSubmit = async (e) => {
    e.preventDefault();
    if (!editRoom.trim() || !editDesc.trim()) {
      toast.error("Please fill all required fields.");
      return;
    }
    const updated = complaints.map(c => c.id === editingTicket.id ? {
      ...c,
      roomNumber: editRoom.trim(),
      type: editType,
      description: editDesc.trim(),
      severity: editSeverity,
      status: editStatus
    } : c);
    setComplaints(updated);
    try { await hostelMaintenanceApi.update(editingTicket.id, updated.find(c => c.id === editingTicket.id)); } catch (err) {}
    setShowEditTicketModal(false);
    setEditingTicket(null);
    toast.success("Maintenance ticket updated successfully.");
  };

  const handleDeleteTicket = async (ticket) => {
    if (window.confirm(`Are you sure you want to delete maintenance ticket for Room ${ticket.roomNumber}?`)) {
      setComplaints(complaints.filter(c => c.id !== ticket.id));
      try { await hostelMaintenanceApi.delete(ticket.id); } catch (err) {}
      toast.success("Maintenance ticket deleted.");
    }
  };

  const handleExportMaintenanceCSV = () => {
    if (complaints.length === 0) {
      toast.error("No maintenance complaints available to export.");
      return;
    }
    toast.success("Exporting maintenance complaints register CSV...");
    const headers = ["Ticket ID,Room Number,Complaint Type,Description,Date Reported,Severity,Status"];
    const rows = complaints.map(c => `"${c.id}","${c.roomNumber}","${c.type}","${c.description.replace(/"/g, '""')}","${c.dateReported}","${c.severity}","${c.status}"`);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Hostel_Maintenance_Complaints_${schoolId || 'portal'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadWorkOrder = (comp) => {
    toast.success(`Downloading maintenance work order sheet for Room ${comp.roomNumber}...`);
    const headers = ["Work Order ID,Room Number,Complaint Type,Description,Date Reported,Severity,Status,Assigned To"];
    const rows = [`"${comp.id}","${comp.roomNumber}","${comp.type}","${comp.description.replace(/"/g, '""')}","${comp.dateReported}","${comp.severity}","${comp.status}","Hostel Maintenance Team"`];
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Work_Order_Room_${comp.roomNumber}_${comp.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (currentView === "register") {
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
            ← Back to Tickets
          </button>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", margin: 0 }}>Register Maintenance Complaint</h2>
        </div>

        <div style={{ background: "#fff", padding: 32, borderRadius: 20, border: "1px solid #E2E8F0", maxWidth: 500, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
          <form onSubmit={handleCreateComplaint}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 28 }}>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Select Room *</label>
                  <select
                    required
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, background: "#fff" }}
                  >
                    <option value="">-- Choose Room --</option>
                    {rooms.map(rm => <option key={rm} value={rm}>Room {rm}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Issue Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none", background: "#fff" }}
                  >
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Carpentry">Carpentry</option>
                    <option value="WiFi">WiFi Network</option>
                    <option value="Other">Other Issues</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Severity Level</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value)}
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none", background: "#fff" }}
                >
                  <option value="Low">Low (Minor Repair)</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High (Urgent Attention)</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Describe Issue *</label>
                <textarea
                  required
                  placeholder="e.g. Ceiling fan is vibrating heavily and making noise..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
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
                Submit Ticket
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
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.5px" }}>Maintenance & Repairs</h1>
          <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: 14 }}>Track repair tasks, assign status, and audit room complaints.</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={handleExportMaintenanceCSV}
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
            title="Export Complaints Register"
          >
            <Download size={16} /> <span>Export CSV</span>
          </button>
          <button
            onClick={() => setCurrentView("register")}
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
            <Plus size={16} /> <span>Register Complaint</span>
          </button>
        </div>
      </div>

      {/* Grid Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 18, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444" }}>
            <AlertCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Pending</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#EF4444", marginTop: 2 }}>
              {complaints.filter(c => c.status === "Pending").length} Requests
            </div>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 18, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB" }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>In Progress</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#2563EB", marginTop: 2 }}>
              {complaints.filter(c => c.status === "In Progress").length} Requests
            </div>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 18, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981" }}>
            <CheckCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Resolved</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#10B981", marginTop: 2 }}>
              {complaints.filter(c => c.status === "Resolved").length} Requests
            </div>
          </div>
        </div>
      </div>

      {/* Table of Maintenance & Repair Tickets */}
      <div style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #E2E8F0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        overflow: "hidden"
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <th style={{ padding: "16px 20px", fontWeight: 800, color: "#475569" }}>Room & Ticket</th>
                <th style={{ padding: "16px 20px", fontWeight: 800, color: "#475569" }}>Issue Type</th>
                <th style={{ padding: "16px 20px", fontWeight: 800, color: "#475569" }}>Description</th>
                <th style={{ padding: "16px 20px", fontWeight: 800, color: "#475569" }}>Severity</th>
                <th style={{ padding: "16px 20px", fontWeight: 800, color: "#475569" }}>Status</th>
                <th style={{ padding: "16px 20px", fontWeight: 800, color: "#475569" }}>Date Reported</th>
                <th style={{ padding: "16px 20px", fontWeight: 800, color: "#475569", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaints.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
                    No maintenance complaints registered yet.
                  </td>
                </tr>
              ) : (
                complaints.map(comp => (
                  <tr key={comp.id} style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.15s ease" }} onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    
                    {/* 1. Room & Ticket */}
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 10, background: "#EEF2FF", color: "#4F46E5",
                          display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, flexShrink: 0
                        }}>
                          <Wrench size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: "#0F172A", fontSize: 14 }}>Room {comp.roomNumber}</div>
                          <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>ID: #{String(comp.id).slice(-6)}</div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Issue Type */}
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{ fontWeight: 700, color: "#1E293B", background: "#F1F5F9", padding: "4px 10px", borderRadius: 6 }}>
                        {comp.type}
                      </span>
                    </td>

                    {/* 3. Description */}
                    <td style={{ padding: "16px 20px", maxWidth: 280 }}>
                      <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {comp.description}
                      </div>
                    </td>

                    {/* 4. Severity */}
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 6,
                        background: comp.severity === "High" ? "#FEE2E2" : comp.severity === "Medium" ? "#FEF3C7" : "#F1F5F9",
                        color: comp.severity === "High" ? "#EF4444" : comp.severity === "Medium" ? "#D97706" : "#64748B",
                        textTransform: "uppercase"
                      }}>
                        {comp.severity}
                      </span>
                    </td>

                    {/* 5. Status */}
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 6,
                        background: comp.status === "Pending" ? "#FCE8E6" : comp.status === "In Progress" ? "#E8F0FE" : "#E6F4EA",
                        color: comp.status === "Pending" ? "#C5221F" : comp.status === "In Progress" ? "#1A73E8" : "#137333",
                        textTransform: "uppercase"
                      }}>
                        {comp.status}
                      </span>
                    </td>

                    {/* 6. Date Reported */}
                    <td style={{ padding: "16px 20px", fontSize: 13, color: "#64748B" }}>
                      {comp.dateReported}
                    </td>

                    {/* 7. Actions */}
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
                        {comp.status === "Pending" && (
                          <button
                            onClick={() => handleUpdateStatus(comp.id, "In Progress")}
                            style={{
                              background: "#4F46E5", color: "#fff", border: "none",
                              padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer"
                            }}
                          >
                            Assign Task
                          </button>
                        )}
                        {comp.status === "In Progress" && (
                          <button
                            onClick={() => handleUpdateStatus(comp.id, "Resolved")}
                            style={{
                              background: "#10B981", color: "#fff", border: "none",
                              padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer"
                            }}
                          >
                            Resolve Ticket
                          </button>
                        )}
                        {comp.status === "Resolved" && (
                          <span style={{ color: "#10B981", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                            <CheckCircle size={14} /> Closed
                          </span>
                        )}

                        <button
                          onClick={() => handleDownloadWorkOrder(comp)}
                          style={{
                            padding: "6px 9px", borderRadius: 8, background: "#F1F5F9", color: "#475569",
                            border: "1px solid #E2E8F0", fontSize: 12, fontWeight: 700, cursor: "pointer"
                          }}
                          title="Download Work Order Slip"
                        >
                          <Download size={13} />
                        </button>

                        <button
                          onClick={() => {
                            setEditingTicket(comp);
                            setEditRoom(comp.roomNumber);
                            setEditType(comp.type);
                            setEditDesc(comp.description);
                            setEditSeverity(comp.severity);
                            setEditStatus(comp.status);
                            setShowEditTicketModal(true);
                          }}
                          style={{
                            padding: "6px 9px", borderRadius: 8, background: "#EEF2FF", color: "#4F46E5",
                            border: "1px solid #E0E7FF", fontSize: 12, fontWeight: 700, cursor: "pointer"
                          }}
                          title="Edit Ticket"
                        >
                          <Edit2 size={13} />
                        </button>

                        <button
                          onClick={() => handleDeleteTicket(comp)}
                          style={{
                            padding: "6px 9px", borderRadius: 8, background: "#FEF2F2", color: "#EF4444",
                            border: "1px solid #FEE2E2", fontSize: 12, fontWeight: 700, cursor: "pointer"
                          }}
                          title="Delete Ticket"
                        >
                          <Trash2 size={13} />
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

      {/* Edit Ticket Modal */}
      {showEditTicketModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <form onSubmit={handleEditTicketSubmit} style={{
            background: "#fff", padding: 32, borderRadius: 20, width: "100%", maxWidth: 460,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)"
          }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: 20, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.5px" }}>Edit Maintenance Ticket</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Room Number *</label>
                  <input
                    type="text"
                    required
                    value={editRoom}
                    onChange={(e) => setEditRoom(e.target.value)}
                    style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Issue Category</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none", background: "#fff" }}
                  >
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Carpentry">Carpentry</option>
                    <option value="WiFi">WiFi / Network</option>
                    <option value="Cleaning">Sanitation / Cleaning</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Problem Description *</label>
                <textarea
                  required
                  rows="3"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Severity Level</label>
                  <select
                    value={editSeverity}
                    onChange={(e) => setEditSeverity(e.target.value)}
                    style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none", background: "#fff" }}
                  >
                    <option value="High">High (Immediate)</option>
                    <option value="Medium">Medium (Within 24h)</option>
                    <option value="Low">Low (Normal Queue)</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none", background: "#fff" }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="button"
                onClick={() => setShowEditTicketModal(false)}
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

    </div>
  );
}
