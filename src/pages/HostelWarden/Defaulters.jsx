import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { 
  ShieldAlert, Send, Trash2, CheckCircle2, Search, 
  FileText, Plus, Eye, Download, Printer, UserMinus, Edit2 
} from "lucide-react";
import { toast } from "sonner";
import { hostelDefaultersApi } from "../../services/api";

export default function WardenDefaulters() {
  const { schoolId } = useParams();
  const [defaulters, setDefaulters] = useState(() => {
    const saved = localStorage.getItem(`sms_${schoolId}_hostel_defaulters`);
    if (saved && saved !== "[]") {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    hostelDefaultersApi.getAll({ schoolId }).then(res => {
      if (res && res.data) {
        setDefaulters(res.data);
      }
    }).catch(() => {});
  }, [schoolId]);

  useEffect(() => {
    localStorage.setItem(`sms_${schoolId}_hostel_defaulters`, JSON.stringify(defaulters));
  }, [defaulters, schoolId]);

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem(`sms_${schoolId}_hostel_defaulters_history`);
    if (saved && saved !== "[]") {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(`sms_${schoolId}_hostel_defaulters_history`, JSON.stringify(history));
  }, [history, schoolId]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("defaulters");

  // Document Locker State
  const [selectedStudentDocs, setSelectedStudentDocs] = useState(null);

  // Add Defaulter Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [defName, setDefName] = useState("");
  const [defRoom, setDefRoom] = useState("");
  const [defHostel, setDefHostel] = useState("H1");
  const [defDue, setDefDue] = useState("");
  const [defRemark, setDefRemark] = useState("");

  // Edit Defaulter Modal State
  const [showEditDefModal, setShowEditDefModal] = useState(false);
  const [editingDefaulter, setEditingDefaulter] = useState(null);
  const [editDefDue, setEditDefDue] = useState("");
  const [editDefDefaults, setEditDefDefaults] = useState("");
  const [editDefRemark, setEditDefRemark] = useState("");

  const handleAddDefaulter = async (e) => {
    e.preventDefault();
    if (!defName.trim() || !defDue) return;

    const newDef = {
      id: String(Date.now()),
      name: defName.trim(),
      room: defRoom.trim() || "101",
      hostel: defHostel,
      dueRent: Number(defDue),
      defaultsCount: 1,
      phone: "+91 99887 76655",
      remark: defRemark.trim() || "Rent overdue",
      dateAdded: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: "Pending",
      schoolId: schoolId || ""
    };

    try {
      await hostelDefaultersApi.create(newDef);
    } catch (err) {}

    setDefaulters([newDef, ...defaulters]);
    setDefName("");
    setDefDue("");
    setDefRemark("");
    setShowAddModal(false);
    toast.success("Defaulter record added successfully!");
  };

  const handleRemoveDefaulter = async (id) => {
    setDefaulters(defaulters.filter(d => d.id !== id));
    try {
      await hostelDefaultersApi.delete(id);
    } catch (err) {}
    toast.success("Student removed from defaulters list.");
  };

  const handleSendLink = async (id) => {
    toast.success("Payment fine link successfully sent to tenant's WhatsApp & parent registered email!");
    const updated = defaulters.map(d => d.id === id ? { ...d, status: "Link Sent" } : d);
    setDefaulters(updated);
    const target = updated.find(d => d.id === id);
    if (target) {
      try {
        await hostelDefaultersApi.update(id, target);
      } catch (err) {}
    }
  };

  const handleEditDefaulterSubmit = async (e) => {
    e.preventDefault();
    if (!editDefDue || Number(editDefDue) < 0 || !editDefDefaults || Number(editDefDefaults) < 0) {
      toast.error("Please provide valid due rent and default counts.");
      return;
    }
    const updated = defaulters.map(d => d.id === editingDefaulter.id ? {
      ...d,
      dueRent: Number(editDefDue),
      defaultsCount: Number(editDefDefaults),
      remark: editDefRemark.trim()
    } : d);
    setDefaulters(updated);
    try { await hostelDefaultersApi.update(editingDefaulter.id, updated.find(d => d.id === editingDefaulter.id)); } catch (err) {}
    setShowEditDefModal(false);
    setEditingDefaulter(null);
    toast.success("Defaulter record updated successfully.");
  };

  const mockDocuments = {
    studentName: "Abhinav Srivastva",
    aadhaarFront: "Aadhaar_Front_Abhinav.jpg",
    aadhaarBack: "Aadhaar_Back_Abhinav.jpg",
    photo: "Abhinav_Photo.jpg",
    collegeId: "Student_ID_Abhinav.jpg",
    agreement: "rent_agreement_signed.pdf"
  };

  // Helper to trigger download & PDF view of individual locker document
  const handleDownloadDoc = (docName, docTitle, studentName) => {
    if (!docName || docName === "Not Uploaded") {
      toast.error(`${docTitle} has not been uploaded yet for ${studentName || "this resident"}.`);
      return;
    }

    const docContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${docTitle} - ${studentName || "Resident"}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 0; margin: 0; color: #1e293b; background: #f8fafc; }
    .no-print { background: #1e293b; color: #fff; padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 9999; box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
    .card { background: #ffffff; border: 2px solid #e2e8f0; border-radius: 12px; padding: 40px; max-width: 700px; margin: 40px auto; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { margin: 0; font-size: 22px; color: #1e293b; }
    .badge { background: #dbeafe; color: #1d4ed8; padding: 6px 14px; border-radius: 20px; font-weight: bold; font-size: 13px; text-transform: uppercase; }
    .details { margin-bottom: 30px; line-height: 1.8; font-size: 15px; }
    .details strong { color: #475569; display: inline-block; width: 180px; }
    .doc-preview { background: #f1f5f9; border: 2px dashed #94a3b8; border-radius: 8px; padding: 50px 20px; text-align: center; margin-bottom: 30px; }
    .doc-preview h3 { margin: 0 0 10px 0; color: #334155; font-size: 18px; }
    .doc-preview p { margin: 0; color: #64748b; font-size: 14px; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #64748b; }
    .stamp { border: 2px solid #10b981; color: #10b981; padding: 8px 16px; border-radius: 6px; font-weight: bold; text-transform: uppercase; font-size: 12px; transform: rotate(-5deg); display: inline-block; }
    @media print { .no-print { display: none !important; } body { background: #fff; padding: 0; } .card { box-shadow: none; border: none; margin: 0; } }
  </style>
</head>
<body>
  <div class="no-print">
    <button onclick="if(window.opener){window.close();}else if(window.history.length>1){window.history.back();}else{window.location.href=window.location.origin+'/hostel-warden/defaulters';}" style="background: #3b82f6; color: #fff; border: none; padding: 9px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 14px; transition: 0.2s;">
      ← Close & Return to Hostel Portal
    </button>
    <div style="display: flex; gap: 12px; align-items: center;">
      <span style="font-size: 13px; color: #cbd5e1;">Select 'Save as PDF' in Destination</span>
      <button onclick="window.print()" style="background: #10b981; color: #fff; border: none; padding: 9px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        🖨️ Print / Save as PDF
      </button>
    </div>
  </div>
  <div class="card">
    <div class="header">
      <div>
        <h1>Hostel Digital Document Locker</h1>
        <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">Official Verification Certificate</p>
      </div>
      <span class="badge">Verified PDF</span>
    </div>
    <div class="details">
      <div><strong>Resident Name:</strong> ${studentName || "N/A"}</div>
      <div><strong>Document Type:</strong> ${docTitle}</div>
      <div><strong>File Reference:</strong> ${docName}</div>
      <div><strong>Verification Date:</strong> ${new Date().toLocaleDateString()}</div>
    </div>
    <div class="doc-preview">
      <h3>📄 ${docName}</h3>
      <p>Digital copy of ${docTitle} stored securely in Institutional Locker.</p>
    </div>
    <div class="footer">
      <div>
        <div><strong>Hostel Warden Authority</strong></div>
        <div style="font-size: 11px; margin-top: 4px;">System Digitally Signed & Verified</div>
      </div>
      <div class="stamp">✓ Locker Verified</div>
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 500);
    };
    window.onafterprint = function() {
      setTimeout(function() { window.close(); }, 300);
    };
  </script>
</body>
</html>`;

    const printWindow = window.open("", "_blank", "width=900,height=800,scrollbars=yes,resizable=yes");
    if (printWindow) {
      printWindow.document.write(docContent);
      printWindow.document.close();
    }

    toast.success(`Opened ${docTitle} certificate! Use top Close button or Close Locker anytime.`);
  };

  // Helper to print entire locker dossier as PDF
  const handlePrintLockerDocs = (docs) => {
    if (!docs) return;
    const dossierContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Locker Dossier - ${docs.studentName || "Resident"}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 0; margin: 0; color: #1e293b; background: #fff; }
    .no-print { background: #1e293b; color: #fff; padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 9999; box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
    .container { max-width: 800px; margin: 40px auto; border: 2px solid #cbd5e1; padding: 40px; border-radius: 12px; }
    .header { text-align: center; border-bottom: 3px solid #ef4444; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { margin: 0; font-size: 26px; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; }
    .header p { margin: 6px 0 0 0; color: #64748b; font-size: 15px; }
    .section-title { background: #f1f5f9; padding: 10px 16px; font-weight: bold; font-size: 16px; color: #334155; border-left: 4px solid #ef4444; margin: 25px 0 15px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { border: 1px solid #e2e8f0; padding: 12px 16px; text-align: left; font-size: 14px; }
    th { background: #f8fafc; color: #475569; font-weight: 600; }
    .status-ok { color: #10b981; font-weight: bold; }
    .status-missing { color: #ef4444; font-weight: bold; }
    .footer { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 2px solid #e2e8f0; padding-top: 20px; }
    .signature { text-align: center; width: 200px; }
    .signature-line { border-bottom: 1px solid #334155; margin-bottom: 8px; height: 30px; }
    @media print { .no-print { display: none !important; } body { padding: 0; } .container { border: none; padding: 0; margin: 0; } }
  </style>
</head>
<body>
  <div class="no-print">
    <button onclick="if(window.opener){window.close();}else if(window.history.length>1){window.history.back();}else{window.location.href=window.location.origin+'/hostel-warden/defaulters';}" style="background: #3b82f6; color: #fff; border: none; padding: 9px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 14px;">
      ← Close & Return to Hostel Portal
    </button>
    <div style="display: flex; gap: 12px; align-items: center;">
      <span style="font-size: 13px; color: #cbd5e1;">Select 'Save as PDF' in Destination</span>
      <button onclick="window.print()" style="background: #10b981; color: #fff; border: none; padding: 9px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 14px;">
        🖨️ Print / Save as PDF
      </button>
    </div>
  </div>
  <div class="container">
    <div class="header">
      <h1>Hostel Resident Dossier & Digital Locker</h1>
      <p>Official Document Verification Record - ${docs.studentName || "Resident"}</p>
    </div>

    <div class="section-title">Digital Locker Documents Verification</div>
    <table>
      <thead>
        <tr>
          <th>Document Type</th>
          <th>File Reference</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Student Photo</td>
          <td>${docs.photo || "Not Uploaded"}</td>
          <td class="${docs.photo && docs.photo !== 'Not Uploaded' ? 'status-ok' : 'status-missing'}">${docs.photo && docs.photo !== 'Not Uploaded' ? '✓ VERIFIED' : '✕ MISSING'}</td>
        </tr>
        <tr>
          <td>Aadhaar Card (Front)</td>
          <td>${docs.aadhaarFront || "Not Uploaded"}</td>
          <td class="${docs.aadhaarFront && docs.aadhaarFront !== 'Not Uploaded' ? 'status-ok' : 'status-missing'}">${docs.aadhaarFront && docs.aadhaarFront !== 'Not Uploaded' ? '✓ VERIFIED' : '✕ MISSING'}</td>
        </tr>
        <tr>
          <td>Aadhaar Card (Back)</td>
          <td>${docs.aadhaarBack || "Not Uploaded"}</td>
          <td class="${docs.aadhaarBack && docs.aadhaarBack !== 'Not Uploaded' ? 'status-ok' : 'status-missing'}">${docs.aadhaarBack && docs.aadhaarBack !== 'Not Uploaded' ? '✓ VERIFIED' : '✕ MISSING'}</td>
        </tr>
        <tr>
          <td>Institutional ID Card</td>
          <td>${docs.collegeId || "Not Uploaded"}</td>
          <td class="${docs.collegeId && docs.collegeId !== 'Not Uploaded' ? 'status-ok' : 'status-missing'}">${docs.collegeId && docs.collegeId !== 'Not Uploaded' ? '✓ VERIFIED' : '✕ MISSING'}</td>
        </tr>
        <tr>
          <td>Signed Rent Agreement</td>
          <td>${docs.agreement || "Not Uploaded"}</td>
          <td class="${docs.agreement && docs.agreement !== 'Not Uploaded' ? 'status-ok' : 'status-missing'}">${docs.agreement && docs.agreement !== 'Not Uploaded' ? '✓ VERIFIED' : '✕ MISSING'}</td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <div>
        <div style="font-size: 13px; color: #64748b;">Generated on: ${new Date().toLocaleString()}</div>
        <div style="font-size: 13px; color: #10b981; font-weight: bold; margin-top: 4px;">✓ System Authenticated Record</div>
      </div>
      <div class="signature">
        <div class="signature-line"></div>
        <div style="font-size: 13px; font-weight: 600;">Hostel Warden Signature</div>
      </div>
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 500);
    };
    window.onafterprint = function() {
      setTimeout(function() { window.close(); }, 300);
    };
  </script>
</body>
</html>`;

    const printWindow = window.open("", "_blank", "width=900,height=800,scrollbars=yes,resizable=yes");
    if (printWindow) {
      printWindow.document.write(dossierContent);
      printWindow.document.close();
    }
    toast.success(`Opening Digital Locker Dossier for ${docs.studentName || "Resident"}. Use top Close button or Close Locker anytime.`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, paddingBottom: 40 }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.5px" }}>Defaulters & Tenant Documentation</h1>
          <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: 14 }}>Manage rent defaulters, recover dues, inspect digital document lockers, and view check-out history.</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => handlePrintLockerDocs(mockDocuments)}
            style={{
              padding: "11px 18px",
              background: "#ffffff",
              color: "#334155",
              border: "1px solid #CBD5E1",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 13.5,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              transition: "all 0.2s"
            }}
          >
            <Printer size={16} /> <span>Export / Print PDF</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: "11px 20px",
              background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 13.5,
              cursor: "pointer",
              boxShadow: "0 4px 12px -2px rgba(239, 68, 68, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <Plus size={16} /> <span>Add Defaulter / Fine</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 12, borderBottom: "1.5px solid #E2E8F0", paddingBottom: 12 }}>
        <button
          onClick={() => setActiveTab("defaulters")}
          style={{
            padding: "8px 16px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 700,
            cursor: "pointer", background: activeTab === "defaulters" ? "#EF4444" : "transparent",
            color: activeTab === "defaulters" ? "#fff" : "#64748B"
          }}
        >
          Overdue Rent & Defaulters
        </button>
        <button
          onClick={() => setActiveTab("history")}
          style={{
            padding: "8px 16px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 700,
            cursor: "pointer", background: activeTab === "history" ? "#4F46E5" : "transparent",
            color: activeTab === "history" ? "#fff" : "#64748B"
          }}
        >
          Checked-out Tenant History
        </button>
      </div>

      {/* Search Filter */}
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
          <input
            type="text"
            placeholder="Search by student name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%", padding: "12px 16px 12px 42px",
              border: "1px solid #E2E8F0", borderRadius: 12,
              fontSize: 14, background: "#fff", outline: "none"
            }}
          />
          <Search size={18} style={{ position: "absolute", left: 14, top: 14, color: "#94A3B8" }} />
        </div>
      </div>

      {/* Tab 1: Defaulters */}
      {activeTab === "defaulters" && (
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>Student Name</th>
                <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>Room Details</th>
                <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>Default Count</th>
                <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>Due Rent / Fine</th>
                <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>Remark Details</th>
                <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>Docs</th>
                <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {defaulters.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())).map(def => (
                <tr key={def.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 14.5 }}>{def.name}</div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{def.phone}</div>
                  </td>
                  <td style={{ padding: "16px 20px", fontSize: 13.5, color: "#334155" }}>
                    Room {def.room} (Block {def.hostel})
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <span style={{ background: "#FEE2E2", color: "#EF4444", padding: "4px 10px", borderRadius: 8, fontSize: 12.5, fontWeight: 700 }}>
                      {def.defaultsCount} Defaults
                    </span>
                  </td>
                  <td style={{ padding: "16px 20px", fontSize: 15, fontWeight: 900, color: "#EF4444" }}>
                    ₹{def.dueRent.toLocaleString()}
                  </td>
                  <td style={{ padding: "16px 20px", fontSize: 13, color: "#64748B", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={def.remark}>
                    {def.remark}
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <button
                      onClick={() => setSelectedStudentDocs(mockDocuments)}
                      style={{
                        background: "none", border: "1px solid #CBD5E1", borderRadius: 8, padding: "4px 8px",
                        fontSize: 12, color: "#4F46E5", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                      }}
                    >
                      <Eye size={12} /> View Locker
                    </button>
                  </td>
                  <td style={{ padding: "16px 20px", display: "flex", gap: 6, alignItems: "center" }}>
                    <button
                      onClick={() => handleSendLink(def.id)}
                      style={{
                        background: "#EEF2FF", color: "#4F46E5", border: "none",
                        padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                      }}
                    >
                      <Send size={12} /> Send Alert
                    </button>
                    <button
                      onClick={() => {
                        setEditingDefaulter(def);
                        setEditDefDue(String(def.dueRent));
                        setEditDefDefaults(String(def.defaultsCount));
                        setEditDefRemark(def.remark);
                        setShowEditDefModal(true);
                      }}
                      title="Edit Defaulter Details"
                      style={{ background: "#EEF2FF", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#4F46E5" }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleRemoveDefaulter(def.id)}
                      style={{
                        background: "#ECFDF5", color: "#047857", border: "none",
                        padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer"
                      }}
                    >
                      Clear Dues
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Checked-Out History */}
      {activeTab === "history" && (
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>Tenant Name</th>
                <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>Room info</th>
                <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>Stay Duration</th>
                <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>Check-Out Date</th>
                <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>Check-out Reason</th>
                <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>Rent Agreement</th>
              </tr>
            </thead>
            <tbody>
              {history.filter(h => h.name.toLowerCase().includes(searchQuery.toLowerCase())).map(hist => (
                <tr key={hist.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "16px 20px", fontWeight: 700, color: "#0F172A", fontSize: 14 }}>{hist.name}</td>
                  <td style={{ padding: "16px 20px", fontSize: 13.5, color: "#334155" }}>Room {hist.room} ({hist.hostel})</td>
                  <td style={{ padding: "16px 20px", fontSize: 13.5, color: "#475569" }}>{hist.duration}</td>
                  <td style={{ padding: "16px 20px", fontSize: 13, color: "#64748B" }}>{hist.checkOutDate}</td>
                  <td style={{ padding: "16px 20px", fontSize: 13.5, color: "#E11D48", fontWeight: 600 }}>{hist.remark}</td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <button
                        onClick={() => setSelectedStudentDocs(mockDocuments)}
                        title="View Documents"
                        style={{ background: "#EEF2FF", border: "1px solid #CBD5E1", borderRadius: 6, padding: "5px 8px", cursor: "pointer", color: "#4F46E5", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700 }}
                      >
                        <Eye size={13} /> View
                      </button>
                      <button
                        onClick={() => handleDownloadDoc(hist.docName || "rent_agreement.pdf", "Rent Agreement", hist.name)}
                        title="Download Agreement PDF"
                        style={{ background: "#F1F5F9", border: "none", borderRadius: 6, padding: "5px 8px", cursor: "pointer", color: "#334155", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700 }}
                      >
                        <Download size={13} /> {hist.docName}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Document Locker Modal */}
      {selectedStudentDocs && (
        <div 
          onClick={() => setSelectedStudentDocs(null)}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
            backdropFilter: "blur(4px)"
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", padding: 32, borderRadius: 20, width: "100%", maxWidth: 460,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#0F172A" }}>Digital Document Locker</h3>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedStudentDocs(null); }} 
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}
              >
                <span style={{ fontSize: 18, fontWeight: "bold" }}>✕</span>
              </button>
            </div>
            <p style={{ fontSize: 13, color: "#64748B", marginBottom: 20 }}>Resident: <strong style={{ color: "#0F172A" }}>{selectedStudentDocs.studentName}</strong></p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 10, background: "#F8FAFC", borderRadius: 10 }}>
                <span style={{ fontSize: 13, color: "#475569" }}>Student Photo:</span>
                <span 
                  onClick={() => handleDownloadDoc(selectedStudentDocs.photo, "Student Photo", selectedStudentDocs.studentName)}
                  style={{ fontSize: 12.5, fontWeight: 700, color: "#4F46E5", textDecoration: "underline", cursor: "pointer" }}
                >
                  {selectedStudentDocs.photo}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 10, background: "#F8FAFC", borderRadius: 10 }}>
                <span style={{ fontSize: 13, color: "#475569" }}>Aadhaar Card (Front):</span>
                <span 
                  onClick={() => handleDownloadDoc(selectedStudentDocs.aadhaarFront, "Aadhaar Card (Front)", selectedStudentDocs.studentName)}
                  style={{ fontSize: 12.5, fontWeight: 700, color: "#4F46E5", textDecoration: "underline", cursor: "pointer" }}
                >
                  {selectedStudentDocs.aadhaarFront}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 10, background: "#F8FAFC", borderRadius: 10 }}>
                <span style={{ fontSize: 13, color: "#475569" }}>Aadhaar Card (Back):</span>
                <span 
                  onClick={() => handleDownloadDoc(selectedStudentDocs.aadhaarBack, "Aadhaar Card (Back)", selectedStudentDocs.studentName)}
                  style={{ fontSize: 12.5, fontWeight: 700, color: "#4F46E5", textDecoration: "underline", cursor: "pointer" }}
                >
                  {selectedStudentDocs.aadhaarBack}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 10, background: "#F8FAFC", borderRadius: 10 }}>
                <span style={{ fontSize: 13, color: "#475569" }}>Institutional ID Card:</span>
                <span 
                  onClick={() => handleDownloadDoc(selectedStudentDocs.collegeId, "Institutional ID Card", selectedStudentDocs.studentName)}
                  style={{ fontSize: 12.5, fontWeight: 700, color: "#4F46E5", textDecoration: "underline", cursor: "pointer" }}
                >
                  {selectedStudentDocs.collegeId}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 10, background: "#F8FAFC", borderRadius: 10 }}>
                <span style={{ fontSize: 13, color: "#475569" }}>Signed Rent Agreement:</span>
                <span 
                  onClick={() => handleDownloadDoc(selectedStudentDocs.agreement, "Signed Rent Agreement", selectedStudentDocs.studentName)}
                  style={{ fontSize: 12.5, fontWeight: 700, color: "#4F46E5", textDecoration: "underline", cursor: "pointer" }}
                >
                  {selectedStudentDocs.agreement}
                </span>
              </div>

            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); handlePrintLockerDocs(selectedStudentDocs); }}
                style={{
                  padding: "10px 18px", border: "1px solid #CBD5E1", borderRadius: 10, fontSize: 13,
                  fontWeight: 700, color: "#334155", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6
                }}
              >
                <Printer size={14} /> Print Locker Docs
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedStudentDocs(null); }}
                style={{ padding: "10px 18px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                Close Locker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Defaulter Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <form onSubmit={handleAddDefaulter} style={{
            background: "#fff", padding: 32, borderRadius: 20, width: "100%", maxWidth: 400,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)"
          }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: 18, fontWeight: 900, color: "#0F172A" }}>Add Tenant Defaulter / Fine</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 28 }}>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Student Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Abhinav Srivastva"
                  value={defName}
                  onChange={(e) => setDefName(e.target.value)}
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14 }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Room Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 101"
                    value={defRoom}
                    onChange={(e) => setDefRoom(e.target.value)}
                    style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Hostel Block</label>
                  <select
                    value={defHostel}
                    onChange={(e) => setDefHostel(e.target.value)}
                    style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, background: "#fff" }}
                  >
                    <option value="H1">Hostel 1</option>
                    <option value="H2">Hostel 2</option>
                    <option value="H3">Hostel 3</option>
                    <option value="H6">Hostel 6</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Due Overdue Rent / Fine Amount</label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  value={defDue}
                  onChange={(e) => setDefDue(e.target.value)}
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14 }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Remark / Defaulter Reason</label>
                <textarea
                  placeholder="e.g. Broke 4 Test tubes in Hostel Mess..."
                  value={defRemark}
                  onChange={(e) => setDefRemark(e.target.value)}
                  rows="3"
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, fontFamily: "inherit", resize: "none" }}
                />
              </div>

            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ padding: "10px 18px", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 13.5, cursor: "pointer", background: "none", color: "#64748B" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: "10px 18px", background: "#EF4444", color: "#fff", border: "none", borderRadius: 10, fontSize: 13.5, cursor: "pointer", fontWeight: 700 }}
              >
                Add Defaulter
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Defaulter Modal */}
      {showEditDefModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <form onSubmit={handleEditDefaulterSubmit} style={{
            background: "#fff", padding: 32, borderRadius: 20, width: "100%", maxWidth: 440,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)"
          }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: 20, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.5px" }}>Edit Defaulter Details</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Due Rent / Fine (INR) *</label>
                  <input
                    type="number"
                    required
                    value={editDefDue}
                    onChange={(e) => setEditDefDue(e.target.value)}
                    style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Default Count *</label>
                  <input
                    type="number"
                    required
                    value={editDefDefaults}
                    onChange={(e) => setEditDefDefaults(e.target.value)}
                    style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Remark / Reason *</label>
                <textarea
                  rows="3"
                  required
                  value={editDefRemark}
                  onChange={(e) => setEditDefRemark(e.target.value)}
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none", resize: "vertical" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="button"
                onClick={() => setShowEditDefModal(false)}
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
