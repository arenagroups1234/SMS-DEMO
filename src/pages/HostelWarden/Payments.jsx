import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Search, IndianRupee, AlertCircle, CheckCircle, Clock, Plus, Edit2, Trash2, Download, Eye } from "lucide-react";
import { toast } from "sonner";
import { hostelPaymentsApi, hostelStudentsApi, usersApi } from "../../services/api";

export default function Payments() {
  const { schoolId } = useParams();

  // Add Invoice Modal State
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [availableStudents, setAvailableStudents] = useState([]);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentId, setNewStudentId] = useState("");
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newMonth, setNewMonth] = useState("August 2026");
  const [newAmount, setNewAmount] = useState("");
  const [newDueDate, setNewDueDate] = useState("");

  // View Invoice Modal State
  const [showViewInvoiceModal, setShowViewInvoiceModal] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);

  // Edit Invoice Modal State
  const [showEditInvoiceModal, setShowEditInvoiceModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editMonth, setEditMonth] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editStatus, setEditStatus] = useState("Pending");

  const [payments, setPayments] = useState(() => {
    const saved = localStorage.getItem(`sms_${schoolId}_hostel_payments`);
    if (saved && saved !== "[]") {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  // Compute stats dynamically from payments list
  const totalDemand = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const collectedAmount = payments.filter(p => p.status === "Paid").reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const pendingAmount = totalDemand - collectedAmount;

  // Load registered school & hostel students
  useEffect(() => {
    let studentList = [];

    const savedHostelStr = localStorage.getItem(`sms_${schoolId}_hostel_students`);
    if (savedHostelStr) {
      try {
        const parsed = JSON.parse(savedHostelStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach(st => {
            if (!studentList.some(s => String(s.id) === String(st.id))) {
              studentList.push({
                id: st.id,
                name: st.name,
                class: st.class || "",
                roomNumber: st.roomNumber || "101",
                rent: st.rent || 5000
              });
            }
          });
        }
      } catch (e) {}
    }

    const savedUsersStr = localStorage.getItem("sms_users") || localStorage.getItem(`sms_${schoolId}_students`);
    if (savedUsersStr) {
      try {
        const parsed = JSON.parse(savedUsersStr);
        if (Array.isArray(parsed)) {
          parsed.filter(u => u.role === "student" || u.role === "Student").forEach(st => {
            if (!studentList.some(s => String(s.id) === String(st.id))) {
              studentList.push({
                id: st.id || st.studentId || `STU-${Math.floor(1000 + Math.random() * 9000)}`,
                name: st.name || st.studentName,
                class: st.class || st.className || "",
                roomNumber: st.roomNumber || "101",
                rent: st.rent || 5000
              });
            }
          });
        }
      } catch (e) {}
    }

    if (studentList.length === 0) {
      studentList = [
        { id: "STU-1001", name: "Aarav Sharma", class: "Class 10-A", roomNumber: "101", rent: 5000 },
        { id: "STU-1002", name: "Rohan Verma", class: "Class 10-B", roomNumber: "102", rent: 4000 },
        { id: "STU-1003", name: "Priya Patel", class: "Class 9-A", roomNumber: "201", rent: 5500 },
        { id: "STU-1004", name: "Ananya Gupta", class: "Class 11-C", roomNumber: "301", rent: 6000 }
      ];
    }

    setAvailableStudents(studentList);

    hostelStudentsApi.getAll({ schoolId }).then(res => {
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setAvailableStudents(prev => {
          const combined = [...prev];
          res.data.forEach(st => {
            if (!combined.some(s => String(s.id) === String(st.id))) {
              combined.push({
                id: st.id,
                name: st.name,
                class: st.class || "",
                roomNumber: st.roomNumber || "101",
                rent: st.rent || 5000
              });
            }
          });
          return combined;
        });
      }
    }).catch(() => {});

    usersApi.getAll({ role: "student", schoolId, limit: 100 }).then(res => {
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setAvailableStudents(prev => {
          const combined = [...prev];
          res.data.forEach(st => {
            if (!combined.some(s => String(s.id) === String(st.id))) {
              combined.push({
                id: st.id,
                name: st.name,
                class: st.class || "",
                roomNumber: st.roomNumber || "101",
                rent: st.rent || 5000
              });
            }
          });
          return combined;
        });
      }
    }).catch(() => {});
  }, [schoolId]);

  const handleSelectStudentChange = (e) => {
    const stId = e.target.value;
    setSelectedStudentId(stId);
    if (!stId) return;

    const found = availableStudents.find(s => String(s.id) === String(stId));
    if (found) {
      setNewStudentName(found.name);
      setNewStudentId(found.id);
      setNewRoomNumber(found.roomNumber || "101");
      if (found.rent) {
        setNewAmount(String(found.rent));
      }
    }
  };

  useEffect(() => {
    hostelPaymentsApi.getAll({ schoolId }).then(res => {
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setPayments(prev => {
          const merged = [...res.data];
          prev.forEach(p => {
            if (!merged.some(m => String(m.id) === String(p.id))) {
              merged.push(p);
            }
          });
          return merged;
        });
      }
    }).catch(() => {});
  }, [schoolId]);

  useEffect(() => {
    localStorage.setItem(`sms_${schoolId}_hostel_payments`, JSON.stringify(payments));
  }, [payments, schoolId]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const handleMarkAsPaid = async (id) => {
    const updated = payments.map(p => {
      if (p.id === id) {
        return { ...p, status: "Paid", paymentDate: new Date().toISOString().split("T")[0] };
      }
      return p;
    });
    setPayments(updated);
    const target = updated.find(p => p.id === id);
    if (target) {
      try {
        await hostelPaymentsApi.update(id, target);
      } catch (err) {}
    }
    toast.success("Payment marked as Paid!");
  };

  const handleAddInvoiceSubmit = async (e) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentId.trim() || !newAmount || Number(newAmount) <= 0 || !newDueDate) {
      toast.error("Please fill in all required fields and valid positive amount.");
      return;
    }
    const newInv = {
      id: String(Date.now()),
      studentName: newStudentName.trim(),
      studentId: newStudentId.trim(),
      roomNumber: newRoomNumber.trim() || "N/A",
      month: newMonth,
      amount: Number(newAmount),
      status: "Pending",
      dueDate: newDueDate,
      paymentDate: ""
    };
    try { await hostelPaymentsApi.create(newInv); } catch (err) {}
    setPayments([newInv, ...payments]);
    setShowAddInvoiceModal(false);
    setNewStudentName("");
    setNewStudentId("");
    setNewRoomNumber("");
    setNewDueDate("");
    toast.success("Fee invoice created successfully!");
  };

  const handleEditInvoiceSubmit = async (e) => {
    e.preventDefault();
    if (!editAmount || Number(editAmount) <= 0) {
      toast.error("Please enter a valid positive amount.");
      return;
    }
    const updated = payments.map(p => p.id === editingInvoice.id ? {
      ...p,
      amount: Number(editAmount),
      month: editMonth,
      dueDate: editDueDate,
      status: editStatus,
      paymentDate: editStatus === "Paid" && !p.paymentDate ? new Date().toISOString().split("T")[0] : (editStatus !== "Paid" ? "" : p.paymentDate)
    } : p);
    setPayments(updated);
    try { await hostelPaymentsApi.update(editingInvoice.id, updated.find(p => p.id === editingInvoice.id)); } catch (err) {}
    setShowEditInvoiceModal(false);
    setEditingInvoice(null);
    toast.success("Fee invoice updated successfully!");
  };

  const handleDeleteInvoice = async (inv) => {
    if (window.confirm(`Are you sure you want to delete invoice for ${inv.studentName} (${inv.month})?`)) {
      setPayments(payments.filter(p => p.id !== inv.id));
      try { await hostelPaymentsApi.delete(inv.id); } catch (err) {}
      toast.success("Fee invoice deleted.");
    }
  };

  const handleSendReminder = (studentName) => {
    toast.success(`Fee payment reminder sent to ${studentName}'s parent successfully.`);
  };

  const handleDownloadReceipt = (pay) => {
    toast.success(`Downloading official fee receipt for ${pay.studentName}...`);
    const headers = ["Invoice ID,Student Name,Student ID,Room Number,Billing Month,Amount (INR),Status,Due Date,Payment Date"];
    const rows = [`"${pay.id}","${pay.studentName}","${pay.studentId}","${pay.roomNumber}","${pay.month}",${pay.amount},"${pay.status}","${pay.dueDate}","${pay.paymentDate || 'Pending'}"`];
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Fee_Receipt_${pay.studentId}_${pay.month.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportLedger = () => {
    if (payments.length === 0) {
      toast.error("No billing records available to export.");
      return;
    }
    toast.success("Exporting complete fee ledger...");
    const headers = ["Invoice ID,Student Name,Student ID,Room Number,Billing Month,Amount (INR),Status,Due Date,Payment Date"];
    const rows = payments.map(p => `"${p.id}","${p.studentName}","${p.studentId}","${p.roomNumber}","${p.month}",${p.amount},"${p.status}","${p.dueDate}","${p.paymentDate || 'Pending'}"`);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Hostel_Fee_Ledger_${schoolId || 'portal'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || p.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, paddingBottom: 40 }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.5px" }}>Fee Payments</h1>
          <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: 14 }}>Manage room billing invoices, tracking collections and outstanding balances.</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={handleExportLedger}
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
            title="Export Fee Ledger"
          >
            <Download size={16} /> <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowAddInvoiceModal(true)}
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
              gap: 8
            }}
          >
            <Plus size={16} /> <span>Add Invoice</span>
          </button>
        </div>
      </div>

      {/* Collection Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
        
        {/* Card 1 */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 18, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#4F46E5" }}>
            <IndianRupee size={20} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Demand</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#0F172A", marginTop: 2 }}>₹{totalDemand.toLocaleString()}</div>
          </div>
        </div>

        {/* Card 2 */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 18, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981" }}>
            <CheckCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Collected</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#10B981", marginTop: 2 }}>₹{collectedAmount.toLocaleString()}</div>
          </div>
        </div>

        {/* Card 3 */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 18, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444" }}>
            <AlertCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Outstanding</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#EF4444", marginTop: 2 }}>₹{pendingAmount.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
          <input
            type="text"
            placeholder="Search by student name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px 12px 42px",
              border: "1px solid #E2E8F0",
              borderRadius: 12,
              fontSize: 14,
              background: "#fff",
              outline: "none"
            }}
          />
          <Search size={18} style={{ position: "absolute", left: 14, top: 14, color: "#94A3B8" }} />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "12px 18px",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            fontSize: 14,
            background: "#fff",
            color: "#334155",
            outline: "none"
          }}
        >
          <option value="All">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Overdue">Overdue</option>
        </select>
      </div>

      {/* Payments Table */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
              <th style={{ padding: "18px 24px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>Student</th>
              <th style={{ padding: "18px 24px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>Room</th>
              <th style={{ padding: "18px 24px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>Month</th>
              <th style={{ padding: "18px 24px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>Amount</th>
              <th style={{ padding: "18px 24px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>Due Date</th>
              <th style={{ padding: "18px 24px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</th>
              <th style={{ padding: "18px 24px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>No billing records found.</td>
              </tr>
            ) : (
              filteredPayments.map(pay => (
                <tr key={pay.id} style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.15s" }}>
                  <td style={{ padding: "18px 24px" }}>
                    <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 14.5 }}>{pay.studentName}</div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{pay.studentId}</div>
                  </td>
                  <td style={{ padding: "18px 24px", fontSize: 14, color: "#334155" }}>Room {pay.roomNumber}</td>
                  <td style={{ padding: "18px 24px", fontSize: 14, color: "#475569" }}>{pay.month}</td>
                  <td style={{ padding: "18px 24px", fontSize: 14, fontWeight: 800, color: "#0F172A" }}>₹{pay.amount.toLocaleString()}</td>
                  <td style={{ padding: "18px 24px", fontSize: 14, color: "#475569" }}>{pay.dueDate}</td>
                  <td style={{ padding: "18px 24px" }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "4px 10px",
                      borderRadius: 8,
                      background: pay.status === "Paid" ? "#ECFDF5" : pay.status === "Pending" ? "#FFF4E5" : "#FCE8E6",
                      color: pay.status === "Paid" ? "#047857" : pay.status === "Pending" ? "#B45309" : "#C5221F",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4
                    }}>
                      {pay.status === "Paid" ? <CheckCircle size={12} /> : pay.status === "Pending" ? <Clock size={12} /> : <AlertCircle size={12} />}
                      {pay.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "18px 24px", display: "flex", gap: 8, alignItems: "center" }}>
                    {pay.status !== "Paid" ? (
                      <>
                        <button
                          onClick={() => handleMarkAsPaid(pay.id)}
                          style={{
                            background: "#ECFDF5", color: "#047857", border: "none",
                            padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer"
                          }}
                        >
                          Mark Paid
                        </button>
                        <button
                          onClick={() => handleSendReminder(pay.studentName)}
                          style={{
                            background: "#FFF4E5", color: "#B45309", border: "none",
                            padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer"
                          }}
                        >
                          Send Alert
                        </button>
                      </>
                    ) : (
                      <span style={{ color: "#94A3B8", fontSize: 13 }}>Paid on {pay.paymentDate}</span>
                    )}
                    <button
                      onClick={() => {
                        setViewingInvoice(pay);
                        setShowViewInvoiceModal(true);
                      }}
                      title="View Invoice & Payment Details"
                      style={{ background: "#ECFDF5", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#10B981" }}
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => handleDownloadReceipt(pay)}
                      title="Download Official Fee Receipt / Invoice"
                      style={{ background: "#F1F5F9", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#334155" }}
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingInvoice(pay);
                        setEditAmount(String(pay.amount));
                        setEditMonth(pay.month);
                        setEditDueDate(pay.dueDate);
                        setEditStatus(pay.status);
                        setShowEditInvoiceModal(true);
                      }}
                      title="Edit Invoice"
                      style={{ background: "#EEF2FF", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#4F46E5" }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteInvoice(pay)}
                      title="Delete Invoice"
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

      {/* Add Fee Invoice Modal */}
      {showAddInvoiceModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(6px)"
        }}>
          <div style={{
            background: "#fff", padding: "28px 32px", borderRadius: 20, width: "100%", maxWidth: 480,
            boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.5px" }}>Generate Fee Invoice</h3>
              <button
                type="button"
                onClick={() => setShowAddInvoiceModal(false)}
                style={{ background: "none", border: "none", color: "#94A3B8", fontSize: 20, cursor: "pointer", padding: "4px 8px", borderRadius: 6 }}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddInvoiceSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
                
                {/* Select Registered Student Dropdown */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Select Student (Created in School) *</label>
                  <select
                    value={selectedStudentId}
                    onChange={handleSelectStudentChange}
                    style={{
                      width: "100%", padding: "11px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10,
                      fontSize: 14, outline: "none", background: "#fff", color: "#0F172A", fontWeight: 600,
                      boxSizing: "border-box", cursor: "pointer"
                    }}
                  >
                    <option value="">-- Select Registered Student --</option>
                    {availableStudents.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} (ID: {st.id}{st.class ? ` • ${st.class}` : ""}{st.roomNumber ? ` • Room ${st.roomNumber}` : ""})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Student Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Auto-filled or type..."
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      style={{
                        width: "100%", padding: "11px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10,
                        fontSize: 14, outline: "none", color: "#0F172A", fontWeight: 600, boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Student ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="Auto-filled or type..."
                      value={newStudentId}
                      onChange={(e) => setNewStudentId(e.target.value)}
                      style={{
                        width: "100%", padding: "11px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10,
                        fontSize: 14, outline: "none", color: "#0F172A", fontWeight: 600, boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Room No.</label>
                    <input
                      type="text"
                      placeholder="e.g. 101"
                      value={newRoomNumber}
                      onChange={(e) => setNewRoomNumber(e.target.value)}
                      style={{
                        width: "100%", padding: "11px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10,
                        fontSize: 14, outline: "none", color: "#0F172A", fontWeight: 600, boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Billing Month</label>
                    <input
                      type="text"
                      placeholder="e.g. August 2026"
                      value={newMonth}
                      onChange={(e) => setNewMonth(e.target.value)}
                      style={{
                        width: "100%", padding: "11px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10,
                        fontSize: 14, outline: "none", color: "#0F172A", fontWeight: 600, boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Amount (INR) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 5000"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      style={{
                        width: "100%", padding: "11px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10,
                        fontSize: 14, outline: "none", color: "#0F172A", fontWeight: 600, boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Due Date *</label>
                    <input
                      type="date"
                      required
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      style={{
                        width: "100%", padding: "11px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10,
                        fontSize: 14, outline: "none", color: "#0F172A", fontWeight: 600, boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowAddInvoiceModal(false)}
                  style={{
                    padding: "10px 20px", border: "1px solid #CBD5E1", borderRadius: 10, fontSize: 13.5,
                    cursor: "pointer", background: "#F8FAFC", color: "#475569", fontWeight: 700
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 22px", background: "linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)",
                    color: "#fff", border: "none", borderRadius: 10, fontSize: 13.5, cursor: "pointer", fontWeight: 700,
                    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)"
                  }}
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Fee Invoice Modal */}
      {showEditInvoiceModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <form onSubmit={handleEditInvoiceSubmit} style={{
            background: "#fff", padding: 32, borderRadius: 20, width: "100%", maxWidth: 440,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)"
          }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: 20, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.5px" }}>Edit Invoice Details</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Billing Month</label>
                <input
                  type="text"
                  value={editMonth}
                  onChange={(e) => setEditMonth(e.target.value)}
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Amount (INR)</label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Due Date</label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none", background: "#fff" }}
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="button"
                onClick={() => setShowEditInvoiceModal(false)}
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

      {/* View Invoice Details Modal */}
      {showViewInvoiceModal && viewingInvoice && (
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
                  FEE INVOICE DETAILS
                </span>
                <h3 style={{ margin: "8px 0 0 0", fontSize: 20, fontWeight: 900, color: "#0F172A" }}>{viewingInvoice.studentName}</h3>
              </div>
              <span style={{
                background: viewingInvoice.status === "Paid" ? "#ECFDF5" : viewingInvoice.status === "Pending" ? "#FFF4E5" : "#FEF2F2",
                color: viewingInvoice.status === "Paid" ? "#047857" : viewingInvoice.status === "Pending" ? "#B45309" : "#EF4444",
                padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 800
              }}>
                {viewingInvoice.status ? viewingInvoice.status.toUpperCase() : "PENDING"}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, background: "#F8FAFC", padding: 18, borderRadius: 14, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Student ID</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>{viewingInvoice.studentId}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Room Number</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>Room {viewingInvoice.roomNumber || "N/A"}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Billing Month</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#4F46E5", marginTop: 2 }}>{viewingInvoice.month}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Invoice Amount</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#0F172A", marginTop: 2 }}>₹{viewingInvoice.amount}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Due Date</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>{viewingInvoice.dueDate || "N/A"}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Payment Date</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: viewingInvoice.status === "Paid" ? "#047857" : "#94A3B8", marginTop: 2 }}>
                  {viewingInvoice.paymentDate || "Not Paid Yet"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="button"
                onClick={() => handleDownloadReceipt(viewingInvoice)}
                style={{ padding: "10px 18px", background: "#F1F5F9", color: "#334155", border: "none", borderRadius: 10, fontSize: 13.5, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}
              >
                <Download size={15} /> Download Receipt
              </button>
              <button
                type="button"
                onClick={() => setShowViewInvoiceModal(false)}
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
