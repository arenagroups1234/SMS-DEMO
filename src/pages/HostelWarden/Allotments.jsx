import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Search, Filter, Plus, Calendar, CheckCircle2, XCircle, User, Shield, CreditCard, ChevronRight, ChevronLeft, Upload, Edit2, Trash2, Eye, Download, FileText, Printer, X } from "lucide-react";
import { toast } from "sonner";
import { hostelAllotmentsApi, hostelStudentsApi, hostelRoomsApi, usersApi } from "../../services/api";

export default function Allotments() {
  const { schoolId } = useParams();
  const [allotments, setAllotments] = useState(() => {
    const saved = localStorage.getItem(`sms_${schoolId}_hostel_allotments`);
    if (saved && saved !== "[]") {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [selectedRegisteredStudentId, setSelectedRegisteredStudentId] = useState("");

  useEffect(() => {
    // Fetch students directly from API — no fallback to dummy data
    usersApi.getAll({ role: "student", schoolId, limit: 500 }).then(res => {
      if (res && res.data && Array.isArray(res.data)) {
        setRegisteredStudents(res.data.map(st => ({
          id: st.id,
          name: st.name,
          phone: st.phone || "",
          class: st.className || st.class || ""
        })));
      }
    }).catch(() => {});
  }, [schoolId]);

  const handleSelectRegisteredStudent = (e) => {
    const id = e.target.value;
    setSelectedRegisteredStudentId(id);
    if (!id) return;
    const found = registeredStudents.find(s => String(s.id) === String(id));
    if (found) {
      setNewStudentName(found.name);
      setNewStudentId(found.id);
      if (found.phone) setNewStudentPhone(found.phone);
    }
  };

  useEffect(() => {
    hostelAllotmentsApi.getAll({ schoolId }).then(res => {
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setAllotments(prev => {
          const merged = [...res.data];
          prev.forEach(item => {
            if (!merged.some(m => String(m.id) === String(item.id))) {
              merged.push(item);
            }
          });
          return merged;
        });
      }
    }).catch(() => {});
  }, [schoolId]);

  useEffect(() => {
    localStorage.setItem(`sms_${schoolId}_hostel_allotments`, JSON.stringify(allotments));
  }, [allotments, schoolId]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Allotment Multi-Step Wizard State
  const [showAllotModal, setShowAllotModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Uploaded documents state
  const [uploadedPhoto, setUploadedPhoto] = useState(null);
  const [uploadedPhotoDataUrl, setUploadedPhotoDataUrl] = useState(null);
  const [uploadedDoc, setUploadedDoc] = useState(null);
  const [uploadedDocDataUrl, setUploadedDocDataUrl] = useState(null);

  // View Allotment Document Modal State
  const [showViewDocModal, setShowViewDocModal] = useState(false);
  const [viewingAllotment, setViewingAllotment] = useState(null);

  // File Preview Modal State (for View Photo & View Document buttons)
  const [showFilePreviewModal, setShowFilePreviewModal] = useState(false);
  const [previewFileTarget, setPreviewFileTarget] = useState("photo"); // "photo" or "doc"
  const [previewFileName, setPreviewFileName] = useState("");
  const [previewFileDataUrl, setPreviewFileDataUrl] = useState(null);

  // Edit Allotment Modal State
  const [showEditAllotModal, setShowEditAllotModal] = useState(false);
  const [editingAllotment, setEditingAllotment] = useState(null);
  const [editRent, setEditRent] = useState("");
  const [editRoomNumber, setEditRoomNumber] = useState("");
  const [editHostelName, setEditHostelName] = useState("");
  const [editStatus, setEditStatus] = useState("Active");

  // Step 1: Student Personal Details
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentId, setNewStudentId] = useState("");
  const [newStudentPhone, setNewStudentPhone] = useState("");
  const [newStudentAadhaar, setNewStudentAadhaar] = useState("");

  // Step 2: Guardian Details
  const [newGuardianName, setNewGuardianName] = useState("");
  const [newGuardianRelation, setNewGuardianRelation] = useState("Father");
  const [newGuardianPhone, setNewGuardianPhone] = useState("");
  const [newGuardianAadhaar, setNewGuardianAadhaar] = useState("");

  // Step 3: Meal Plan details
  const [newMealType, setNewMealType] = useState("Veg Continental");
  const [newMealFrequency, setNewMealFrequency] = useState("3 / Day");

  // Step 4: Stay & Billing Details
  const [newHostelName, setNewHostelName] = useState("Block A - Boys Hostel");
  const [newRoomNumber, setNewRoomNumber] = useState("101");
  const [newCheckInDate, setNewCheckInDate] = useState("");
  const [newRent, setNewRent] = useState("5500");
  const [newPaymentMode, setNewPaymentMode] = useState("EMIs"); // EMIs or One Shot
  const [newEmiCount, setNewEmiCount] = useState("3");

  const validateStep = (step) => {
    if (step === 1) {
      if (!newStudentName.trim()) {
        toast.error("Student full name is required.");
        return false;
      }
      if (!newStudentId.trim()) {
        toast.error("Student ID / Roll Number is required.");
        return false;
      }
      if (newStudentPhone.trim() && !/^\d{10}$/.test(newStudentPhone.trim().replace(/\s+/g, ""))) {
        toast.error("Student phone number must be exactly 10 digits.");
        return false;
      }
      if (newStudentAadhaar.trim() && !/^\d{12}$/.test(newStudentAadhaar.trim().replace(/\s+/g, ""))) {
        toast.error("Student Aadhaar number must be exactly 12 digits.");
        return false;
      }
      if (allotments.some(al => al.studentId.trim().toLowerCase() === newStudentId.trim().toLowerCase() && al.status === "Active")) {
        toast.error(`Student ID ${newStudentId.trim()} already has an active room allotment!`);
        return false;
      }
    } else if (step === 2) {
      if (newGuardianPhone.trim() && !/^\d{10}$/.test(newGuardianPhone.trim().replace(/\s+/g, ""))) {
        toast.error("Guardian phone number must be exactly 10 digits.");
        return false;
      }
      if (newGuardianAadhaar.trim() && !/^\d{12}$/.test(newGuardianAadhaar.trim().replace(/\s+/g, ""))) {
        toast.error("Guardian Aadhaar number must be exactly 12 digits.");
        return false;
      }
    } else if (step === 4) {
      if (!newCheckInDate) {
        toast.error("Check-in date is required.");
        return false;
      }
      if (!newRent.trim() || Number(newRent) <= 0 || isNaN(Number(newRent))) {
        toast.error("Please enter a valid positive monthly rent amount.");
        return false;
      }
      // Check bed availability in the selected room right now!
      const savedRoomsStr = localStorage.getItem(`sms_${schoolId}_hostel_rooms`);
      if (savedRoomsStr) {
        const currentRooms = JSON.parse(savedRoomsStr);
        const targetHostelId = newHostelName.includes("Boys") ? "1" : "2";
        const roomObj = currentRooms.find(r => r.hostelId === targetHostelId && r.roomNumber === newRoomNumber);
        if (roomObj) {
          const activeOccupants = allotments.filter(al =>
            al.status === "Active" &&
            al.roomNumber === newRoomNumber &&
            ((targetHostelId === "1" && al.hostelName.includes("Boys")) || (targetHostelId === "2" && al.hostelName.includes("Girls")))
          ).length;
          if (activeOccupants >= roomObj.capacity) {
            toast.error(`Room ${newRoomNumber} is currently full (${activeOccupants}/${roomObj.capacity} beds occupied). Please select another room or add capacity in Rooms page.`);
            return false;
          }
        }
      }
      if (!uploadedPhoto || !uploadedDoc) {
        toast.error("Please upload the required documents before allocating a room.");
        return false;
      }
    }
    return true;
  };

  const handleAllot = async (e) => {
    if (e) e.preventDefault();
    if (!validateStep(4)) return;

    const newA = {
      id: String(Date.now()),
      studentName: newStudentName.trim(),
      studentId: newStudentId.trim(),
      hostelName: newHostelName,
      roomNumber: newRoomNumber,
      checkInDate: newCheckInDate,
      status: "Active",
      rent: Number(newRent),
      photoUploaded: uploadedPhoto || "Student_Profile_Photo.jpg",
      photoDataUrl: uploadedPhotoDataUrl || null,
      documentUploaded: uploadedDoc || "ID_Proof_Undertaking.pdf",
      documentDataUrl: uploadedDocDataUrl || null,
      schoolId: schoolId || ""
    };

    try {
      await hostelAllotmentsApi.create(newA);
    } catch (err) {
      // fallback to local
    }


    setAllotments([newA, ...allotments]);
    
    // reset form
    setNewStudentName("");
    setNewStudentId("");
    setNewStudentPhone("");
    setNewStudentAadhaar("");
    setNewGuardianName("");
    setNewGuardianPhone("");
    setNewGuardianAadhaar("");
    setNewCheckInDate("");
    setUploadedPhoto(null);
    setUploadedPhotoDataUrl(null);
    setUploadedDoc(null);
    setUploadedDocDataUrl(null);
    setShowAllotModal(false);
    setCurrentStep(1);
    toast.success(`Room ${newRoomNumber} successfully allotted to ${newA.studentName}!`);
  };

  const handleCheckOut = async (id) => {
    try {
      await hostelAllotmentsApi.updateStatus(id, "Checked Out");
    } catch (err) {}
    const updated = allotments.map(al => al.id === id ? { ...al, status: "Checked Out" } : al);
    setAllotments(updated);

    const target = updated.find(al => al.id === id);
    if (target) {
      const savedStudentsStr = localStorage.getItem(`sms_${schoolId}_hostel_students`);
      if (savedStudentsStr) {
        const currentStudents = JSON.parse(savedStudentsStr);
        const updatedStudents = currentStudents.map(s => s.id.toLowerCase() === target.studentId.toLowerCase() ? { ...s, status: "Checked Out" } : s);
        localStorage.setItem(`sms_${schoolId}_hostel_students`, JSON.stringify(updatedStudents));
      }
    }

    toast.info("Student checked out from room successfully.");
  };

  const handleDeleteAllotment = async (al) => {
    if (window.confirm(`Are you sure you want to delete allotment record for ${al.studentName}?`)) {
      setAllotments(allotments.filter(a => a.id !== al.id));
      try { await hostelAllotmentsApi.delete(al.id); } catch (err) {}
      toast.success("Allotment record deleted.");
    }
  };

  const handleEditAllotmentSubmit = async (e) => {
    e.preventDefault();
    if (!editRent.toString().trim() || Number(editRent) <= 0 || isNaN(Number(editRent))) {
      toast.error("Please enter a valid positive monthly rent.");
      return;
    }
    const updated = allotments.map(a => a.id === editingAllotment.id ? {
      ...a,
      rent: Number(editRent),
      roomNumber: editRoomNumber.trim(),
      hostelName: editHostelName,
      status: editStatus
    } : a);
    setAllotments(updated);
    try { await hostelAllotmentsApi.update(editingAllotment.id, updated.find(a => a.id === editingAllotment.id)); } catch (err) {}
    setShowEditAllotModal(false);
    setEditingAllotment(null);
    toast.success("Allotment updated successfully.");
  };

  const handleExportAllotmentsCSV = () => {
    if (allotments.length === 0) {
      toast.error("No allotments available to export.");
      return;
    }
    toast.success("Exporting room allotments register CSV...");
    const headers = ["Allotment ID,Student Name,Student ID,Hostel Block,Room Number,Check-In Date,Monthly Rent,Status"];
    const rows = allotments.map(a => `"${a.id}","${a.studentName}","${a.studentId}","${a.hostelName}","${a.roomNumber}","${a.checkInDate}",${a.rent},"${a.status}"`);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Hostel_Room_Allotments_${schoolId || 'portal'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenPhotoPreview = (allotment) => {
    setPreviewFileTarget("photo");
    setPreviewFileName(allotment.photoUploaded || "Student_Profile_Photo.jpg");
    setPreviewFileDataUrl(allotment.photoDataUrl || null);
    setShowFilePreviewModal(true);
  };

  const handleOpenDocPreview = (allotment) => {
    setPreviewFileTarget("doc");
    setPreviewFileName(allotment.documentUploaded || "ID_Proof_Undertaking.pdf");
    setPreviewFileDataUrl(allotment.documentDataUrl || null);
    setShowFilePreviewModal(true);
  };

  const handleDownloadPreviewFile = (allotment, target, fileName, dataUrl) => {
    if (dataUrl) {
      toast.success(`Downloading attached ${fileName}...`);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = fileName || (target === "photo" ? `Photo_${allotment.studentId}.jpg` : `Document_${allotment.studentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    toast.success(`Downloading official ${target === "photo" ? "Photo ID Dossier" : "Undertaking Document"} CSV record...`);
    const headers = [target === "photo" ? "Student ID,Name,Hostel Block,Room,Check-In Date,Rent,Photo File,Status" : "Document Ref,Student ID,Name,Hostel Block,Room,Monthly Rent,Agreement Status,Attached File"];
    const rows = [target === "photo" 
      ? `"${allotment.studentId}","${allotment.studentName}","${allotment.hostelName}","${allotment.roomNumber}","${allotment.checkInDate}",${allotment.rent},"${allotment.photoUploaded || 'Student_Profile_Photo.jpg'}","${allotment.status}"`
      : `"REF-DOC-${allotment.studentId}-${allotment.id}","${allotment.studentId}","${allotment.studentName}","${allotment.hostelName}","${allotment.roomNumber}",${allotment.rent},"Signed & Verified","${allotment.documentUploaded || 'ID_Proof_Undertaking.pdf'}"`
    ];
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `${target === "photo" ? "Tenant_Photo_Dossier" : "Undertaking_Agreement"}_${allotment.studentId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPreviewFile = (allotment, target) => {
    toast.success(`Opening digital print & PDF window for ${allotment.studentName}...`);
    let contentHtml = "";
    if (target === "photo") {
      contentHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tenant Profile Photo ID - ${allotment.studentName}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; margin: 0; background: #f8fafc; color: #1e293b; display: flex; justify-content: center; }
    .card { background: #0f172a; color: #fff; border-radius: 20px; padding: 36px; width: 420px; box-shadow: 0 10px 25px rgba(0,0,0,0.25); border: 2px solid #334155; }
    .header { text-align: center; border-bottom: 1px solid #334155; padding-bottom: 20px; margin-bottom: 24px; }
    .header h2 { margin: 0; font-size: 20px; color: #38bdf8; letter-spacing: 1px; text-transform: uppercase; }
    .header p { margin: 6px 0 0 0; font-size: 12px; color: #94a3b8; }
    .photo-box { width: 180px; height: 180px; border-radius: 16px; border: 3px solid #38bdf8; margin: 0 auto 24px auto; background: #1e293b; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .photo-box img { width: 100%; height: 100%; object-fit: cover; }
    .photo-placeholder { font-size: 64px; color: #64748b; }
    .details { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #1e293b; padding: 20px; border-radius: 14px; }
    .label { font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700; }
    .val { font-size: 15px; font-weight: 800; color: #f1f5f9; margin-top: 4px; }
    .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2>Hostel Resident ID Badge</h2>
      <p>Official Tenant Verification Dossier</p>
    </div>
    <div class="photo-box">
      ${allotment.photoDataUrl ? `<img src="${allotment.photoDataUrl}" alt="Photo" />` : `<div class="photo-placeholder">👤</div>`}
    </div>
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 24px; font-weight: 900; color: #fff;">${allotment.studentName}</div>
      <div style="font-size: 14px; color: #38bdf8; font-weight: 700; margin-top: 4px;">ID: ${allotment.studentId}</div>
    </div>
    <div class="details">
      <div>
        <div class="label">Hostel Block</div>
        <div class="val">${allotment.hostelName}</div>
      </div>
      <div>
        <div class="label">Room Assigned</div>
        <div class="val">Room ${allotment.roomNumber}</div>
      </div>
      <div>
        <div class="label">Check-In Date</div>
        <div class="val">${allotment.checkInDate}</div>
      </div>
      <div>
        <div class="label">Status</div>
        <div class="val" style="color: #10b981;">Active Resident</div>
      </div>
    </div>
    <div class="footer">Verified by Hostel Warden Portal • Ref: ${allotment.photoUploaded || 'Student_Profile_Photo.jpg'}</div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;
    } else {
      contentHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Hostel Undertaking Agreement - ${allotment.studentName}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; margin: 0; color: #1e293b; line-height: 1.6; }
    .doc { max-width: 750px; margin: 0 auto; border: 2px solid #cbd5e1; padding: 40px; border-radius: 12px; background: #fff; }
    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 24px; }
    .header h1 { margin: 0; font-size: 24px; color: #0f172a; text-transform: uppercase; }
    .header p { margin: 4px 0 0 0; color: #64748b; font-size: 13px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 24px; }
    .meta-item strong { display: block; font-size: 12px; color: #64748b; text-transform: uppercase; }
    .meta-item span { font-size: 16px; font-weight: 800; color: #0f172a; }
    .terms { margin-bottom: 30px; }
    .terms h3 { font-size: 16px; color: #0f172a; margin-bottom: 12px; }
    .terms ul { padding-left: 20px; }
    .terms li { margin-bottom: 10px; font-size: 14px; }
    .sigs { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 50px; border-top: 1px solid #cbd5e1; padding-top: 30px; }
    .sig-box { text-align: center; }
    .sig-line { font-weight: 800; color: #0f172a; font-size: 15px; border-bottom: 1px dashed #64748b; padding-bottom: 6px; margin-bottom: 6px; display: inline-block; min-width: 200px; }
  </style>
</head>
<body>
  <div class="doc">
    <div class="header">
      <h1>Hostel Residency Agreement & Undertaking</h1>
      <p>Official ID Proof & Terms Verification Document • Ref: REF-DOC-${allotment.studentId}-${allotment.id}</p>
    </div>
    <div class="meta">
      <div class="meta-item"><strong>Resident Name & ID</strong><span>${allotment.studentName} (${allotment.studentId})</span></div>
      <div class="meta-item"><strong>Assigned Accommodation</strong><span>Room ${allotment.roomNumber} (${allotment.hostelName})</span></div>
      <div class="meta-item"><strong>Check-In Date</strong><span>${allotment.checkInDate}</span></div>
      <div class="meta-item"><strong>Monthly Tariff</strong><span>₹${allotment.rent.toLocaleString()} / month</span></div>
    </div>
    ${allotment.documentDataUrl && allotment.documentDataUrl.startsWith("data:image/") ? `
      <div style="text-align: center; margin-bottom: 24px;">
        <h4 style="margin: 0 0 10px 0; color: #475569;">Attached Document Scan / Proof</h4>
        <img src="${allotment.documentDataUrl}" style="max-width: 100%; max-height: 500px; border: 1px solid #cbd5e1; border-radius: 8px;" />
      </div>
    ` : ""}
    <div class="terms">
      <h3>Terms & Conditions Undertaking</h3>
      <ul>
        <li><strong>Curfew & Gate Timings:</strong> I undertake to return to the hostel premises before the stipulated curfew time (9:30 PM) daily.</li>
        <li><strong>Property & Furniture Maintenance:</strong> I agree to maintain the room fixtures, bed, cupboard, and common areas with care, accepting financial responsibility for any willful damage.</li>
        <li><strong>Biometric Attendance:</strong> I agree to mark my attendance daily using the hostel biometric scanner at the warden desk.</li>
        <li><strong>Payment Schedule:</strong> I acknowledge that monthly room tariff (₹${allotment.rent.toLocaleString()}) is due on or before the 5th of each calendar month.</li>
      </ul>
    </div>
    <div class="sigs">
      <div class="sig-box">
        <div class="sig-line">Digital Sign: ${allotment.studentName}</div>
        <div style="font-size: 12px; color: #64748b;">Resident Undertaking</div>
      </div>
      <div class="sig-box">
        <div class="sig-line">APPROVED & VERIFIED</div>
        <div style="font-size: 12px; color: #64748b;">Hostel Warden Administration</div>
      </div>
    </div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;
    }
    const printWindow = window.open("", "_blank", "width=850,height=900,scrollbars=yes,resizable=yes");
    if (printWindow) {
      printWindow.document.write(contentHtml);
      printWindow.document.close();
    }
  };

  const filteredAllotments = allotments.filter(al => {
    const matchesSearch = al.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || al.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || al.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, paddingBottom: 40 }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.5px" }}>Room Allotments</h1>
          <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: 14 }}>Allocate rooms, register student details, guardian info, meal options, and billing setup.</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleExportAllotmentsCSV}
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
            title="Export Room Allotments Register"
          >
            <Download size={16} /> <span>Export CSV</span>
          </button>

        </div>
      </div>

      {/* Filters & Search */}
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
              outline: "none",
              boxSizing: "border-box"
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
          <option value="Active">Active</option>
          <option value="Checked Out">Checked Out</option>
        </select>
      </div>

      {/* Table List */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflowX: "auto", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
              <th style={{ padding: "18px 24px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>Student</th>
              <th style={{ padding: "18px 24px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>Hostel Block</th>
              <th style={{ padding: "18px 24px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>Room No.</th>
              <th style={{ padding: "18px 24px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>Check-In Date</th>
              <th style={{ padding: "18px 24px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>Monthly Rent</th>
              <th style={{ padding: "18px 24px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</th>
              <th style={{ padding: "18px 24px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAllotments.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>No allotments found.</td>
              </tr>
            ) : (
              filteredAllotments.map(al => (
                <tr key={al.id} style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.15s" }}>
                  <td style={{ padding: "18px 24px" }}>
                    <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 14.5 }}>{al.studentName}</div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{al.studentId}</div>
                  </td>
                  <td style={{ padding: "18px 24px", fontSize: 14, color: "#334155" }}>{al.hostelName}</td>
                  <td style={{ padding: "18px 24px" }}>
                    <span style={{ background: "#EEF2FF", color: "#4F46E5", padding: "4px 10px", borderRadius: 8, fontSize: 12.5, fontWeight: 700 }}>Room {al.roomNumber}</span>
                  </td>
                  <td style={{ padding: "18px 24px", fontSize: 14, color: "#475569" }}>{al.checkInDate}</td>
                  <td style={{ padding: "18px 24px", fontSize: 14, fontWeight: 700, color: "#0F172A" }}>₹{al.rent.toLocaleString()}</td>
                  <td style={{ padding: "18px 24px" }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "4px 10px",
                      borderRadius: 8,
                      background: al.status === "Active" ? "#ECFDF5" : "#FEF2F2",
                      color: al.status === "Active" ? "#047857" : "#EF4444",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4
                    }}>
                      {al.status === "Active" ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {al.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "18px 24px", display: "flex", gap: 8, alignItems: "center" }}>
                    {al.status === "Active" ? (
                      <button
                        onClick={() => handleCheckOut(al.id)}
                        style={{
                          background: "#FEF2F2",
                          color: "#EF4444",
                          border: "none",
                          padding: "6px 14px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                      >
                        Check Out
                      </button>
                    ) : (
                      <span style={{ color: "#94A3B8", fontSize: 13 }}>Closed</span>
                    )}
                    <button
                      onClick={() => {
                        setViewingAllotment(al);
                        setShowViewDocModal(true);
                      }}
                      title="View Tenant Details & Uploaded Documents"
                      style={{ background: "#F0FDF4", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#10B981" }}
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => {
                        toast.success(`Downloading allotment slip & documents for ${al.studentName}...`);
                        const headers = ["Student Name,ID,Hostel,Room Number,Check-In Date,Rent,Status,Photo,Document"];
                        const rows = [`"${al.studentName}","${al.studentId}","${al.hostelName}","${al.roomNumber}","${al.checkInDate}",${al.rent},"${al.status}","${al.photoUploaded || 'Attached'}","${al.documentUploaded || 'Attached'}"`];
                        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", `Allotment_Document_${al.studentId}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      title="Download Allotment Slip / Document"
                      style={{ background: "#F1F5F9", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#334155" }}
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingAllotment(al);
                        setEditRent(String(al.rent));
                        setEditRoomNumber(al.roomNumber);
                        setEditHostelName(al.hostelName);
                        setEditStatus(al.status);
                        setShowEditAllotModal(true);
                      }}
                      title="Edit Allotment"
                      style={{ background: "#EEF2FF", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#4F46E5" }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteAllotment(al)}
                      title="Delete Allotment"
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

      {/* Multi-Step Allotment Wizard Modal */}
      {showAllotModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "#fff", padding: 32, borderRadius: 24, width: "100%", maxWidth: 540,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)", position: "relative"
          }}>
            
            {/* Steps Progress bar indicator */}
            <div style={{ display: "flex", justifyBetween: "space-between", alignItems: "center", marginBottom: 28, borderBottom: "1px solid #F1F5F9", paddingBottom: 20 }}>
              <div style={{ display: "flex", gap: 16 }}>
                {[1, 2, 3, 4].map(s => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%",
                      background: currentStep === s ? "#4F46E5" : currentStep > s ? "#10B981" : "#E2E8F0",
                      color: "#fff", fontSize: 11, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyBetween: "center", justifyContent: "center"
                    }}>{currentStep > s ? "✓" : s}</div>
                    <span style={{
                      fontSize: 11.5, fontWeight: 700,
                      color: currentStep === s ? "#0F172A" : "#94A3B8"
                    }}>
                      {s === 1 ? "Student" : s === 2 ? "Guardian" : s === 3 ? "Meal" : "Stay"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <h3 style={{ margin: "0 0 20px 0", fontSize: 18, fontWeight: 900, color: "#0F172A" }}>
              {currentStep === 1 && "Step 1: Student Information"}
              {currentStep === 2 && "Step 2: Guardian Details"}
              {currentStep === 3 && "Step 3: Meal Selection Plan"}
              {currentStep === 4 && "Step 4: Stay & Billing Configuration"}
            </h3>

            {/* STEP 1: Student personal info */}
            {currentStep === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 28 }}>
                
                {/* Select Registered Student Dropdown */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Select Student (Registered in School) *</label>
                  <select
                    value={selectedRegisteredStudentId}
                    onChange={handleSelectRegisteredStudent}
                    style={{
                      width: "100%", padding: "11px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10,
                      fontSize: 14, outline: "none", background: "#fff", color: "#0F172A", fontWeight: 600,
                      boxSizing: "border-box", cursor: "pointer"
                    }}
                  >
                    <option value="">-- Select Registered Student --</option>
                    {registeredStudents.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} (ID: {st.id}{st.class ? ` • ${st.class}` : ""})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Full Student Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramakant Sharma"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Roll Number / ID *</label>
                    <input
                      type="text"
                      placeholder="e.g. STU101"
                      value={newStudentId}
                      onChange={(e) => setNewStudentId(e.target.value)}
                      style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14 }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Contact Number (10 digits)</label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={newStudentPhone}
                      onChange={(e) => setNewStudentPhone(e.target.value.replace(/\D/g, ''))}
                      style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Tenant Aadhaar Number (12 digits)</label>
                    <input
                      type="text"
                      placeholder="e.g. 2545 2545 2545"
                      value={newStudentAadhaar}
                      onChange={(e) => setNewStudentAadhaar(e.target.value.replace(/\D/g, ''))}
                      style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14 }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Upload Tenant Photo (JPG/PNG)</label>
                    <label style={{
                      border: "2px dashed #CBD5E1", borderRadius: 10, padding: 14, textAlign: "center", color: uploadedPhoto ? "#047857" : "#64748B",
                      cursor: "pointer", background: uploadedPhoto ? "#ECFDF5" : "#F8FAFC", display: "flex", flexDirection: "column", alignItems: "center", gap: 6
                    }}>
                      <Upload size={18} style={{ color: uploadedPhoto ? "#10B981" : "#94A3B8" }} />
                      <span style={{ fontSize: 12, fontWeight: 700, wordBreak: "break-all" }}>{uploadedPhoto ? `✓ ${uploadedPhoto}` : "Click to select profile photo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setUploadedPhoto(file.name);
                            const reader = new FileReader();
                            reader.onload = (event) => setUploadedPhotoDataUrl(event.target.result);
                            reader.readAsDataURL(file);
                            toast.success("Profile photo attached.");
                          }
                        }}
                      />
                    </label>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Upload ID / Undertaking Doc (PDF/Image)</label>
                    <label style={{
                      border: "2px dashed #CBD5E1", borderRadius: 10, padding: 14, textAlign: "center", color: uploadedDoc ? "#047857" : "#64748B",
                      cursor: "pointer", background: uploadedDoc ? "#ECFDF5" : "#F8FAFC", display: "flex", flexDirection: "column", alignItems: "center", gap: 6
                    }}>
                      <FileText size={18} style={{ color: uploadedDoc ? "#10B981" : "#94A3B8" }} />
                      <span style={{ fontSize: 12, fontWeight: 700, wordBreak: "break-all" }}>{uploadedDoc ? `✓ ${uploadedDoc}` : "Click to select ID / undertaking"}</span>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setUploadedDoc(file.name);
                            const reader = new FileReader();
                            reader.onload = (event) => setUploadedDocDataUrl(event.target.result);
                            reader.readAsDataURL(file);
                            toast.success("Document attached.");
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Guardian Info */}
            {currentStep === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 28 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Name of Guardian</label>
                    <input
                      type="text"
                      placeholder="e.g. Harsh Goenkar"
                      value={newGuardianName}
                      onChange={(e) => setNewGuardianName(e.target.value)}
                      style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Relationship with Student</label>
                    <select
                      value={newGuardianRelation}
                      onChange={(e) => setNewGuardianRelation(e.target.value)}
                      style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, background: "#fff" }}
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Brother">Brother</option>
                      <option value="Sister">Sister</option>
                      <option value="Local Guardian">Local Guardian</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Guardian Phone Number (10 digits)</label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={newGuardianPhone}
                      onChange={(e) => setNewGuardianPhone(e.target.value.replace(/\D/g, ''))}
                      style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Guardian Aadhaar Number (12 digits)</label>
                    <input
                      type="text"
                      placeholder="e.g. 5566 6655 4433"
                      value={newGuardianAadhaar}
                      onChange={(e) => setNewGuardianAadhaar(e.target.value.replace(/\D/g, ''))}
                      style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14 }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Meal Selection Plan */}
            {currentStep === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 28 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Select Type of Meal</label>
                  <select
                    value={newMealType}
                    onChange={(e) => setNewMealType(e.target.value)}
                    style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, background: "#fff" }}
                  >
                    <option value="Veg Continental">Veg Continental</option>
                    <option value="Non-Veg Continental">Non-Veg Continental</option>
                    <option value="Continental Mix Plan">Continental Mix Plan</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Frequency of Meal per Day</label>
                  <select
                    value={newMealFrequency}
                    onChange={(e) => setNewMealFrequency(e.target.value)}
                    style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, background: "#fff" }}
                  >
                    <option value="1 / Day">1 Time per Day (Breakfast only)</option>
                    <option value="2 / Day">2 Times per Day (Lunch, Dinner)</option>
                    <option value="3 / Day">3 Times per Day (Breakfast, Lunch, Dinner)</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 4: Stay & Billing Configuration */}
            {currentStep === 4 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 28 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Select Hostel Block</label>
                    <select
                      value={newHostelName}
                      onChange={(e) => setNewHostelName(e.target.value)}
                      style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, background: "#fff" }}
                    >
                      <option value="Block A - Boys Hostel">Block A - Boys Hostel</option>
                      <option value="Block B - Girls Hostel">Block B - Girls Hostel</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Select Room</label>
                    <select
                      value={newRoomNumber}
                      onChange={(e) => setNewRoomNumber(e.target.value)}
                      style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, background: "#fff" }}
                    >
                      <option value="101">Room 101 (AC)</option>
                      <option value="102">Room 102 (Non-AC)</option>
                      <option value="103">Room 103 (AC)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Check-In Date *</label>
                    <input
                      type="date"
                      value={newCheckInDate}
                      onChange={(e) => setNewCheckInDate(e.target.value)}
                      style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Rent Amount / Month *</label>
                    <input
                      type="number"
                      value={newRent}
                      onChange={(e) => setNewRent(e.target.value)}
                      style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14 }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Payment Method</label>
                    <div style={{ display: "flex", gap: 8, background: "#F1F5F9", padding: 4, borderRadius: 8 }}>
                      <button
                        type="button"
                        onClick={() => setNewPaymentMode("EMIs")}
                        style={{
                          flex: 1, padding: "8px", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700,
                          cursor: "pointer", background: newPaymentMode === "EMIs" ? "#4F46E5" : "transparent",
                          color: newPaymentMode === "EMIs" ? "#fff" : "#64748B"
                        }}
                      >
                        Pay in EMIs
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewPaymentMode("One Shot")}
                        style={{
                          flex: 1, padding: "8px", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700,
                          cursor: "pointer", background: newPaymentMode === "One Shot" ? "#4F46E5" : "transparent",
                          color: newPaymentMode === "One Shot" ? "#fff" : "#64748B"
                        }}
                      >
                        One Shot
                      </button>
                    </div>
                  </div>

                  {newPaymentMode === "EMIs" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Number of EMIs</label>
                      <select
                        value={newEmiCount}
                        onChange={(e) => setNewEmiCount(e.target.value)}
                        style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, background: "#fff" }}
                      >
                        <option value="3">3 EMIs</option>
                        <option value="6">6 EMIs</option>
                        <option value="12">12 EMIs</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal actions */}
            <div style={{ display: "flex", justifyBetween: "space-between", justifyContent: "flex-end", gap: 12, borderTop: "1px solid #F1F5F9", paddingTop: 20 }}>
              <button
                type="button"
                onClick={() => setShowAllotModal(false)}
                style={{ padding: "10px 18px", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 13.5, cursor: "pointer", background: "none", color: "#64748B", fontWeight: 600 }}
              >
                Cancel
              </button>

              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  style={{
                    padding: "10px 18px", border: "1px solid #CBD5E1", borderRadius: 10, fontSize: 13.5,
                    cursor: "pointer", background: "#fff", color: "#334155", display: "flex", alignItems: "center", gap: 6
                  }}
                >
                  <ChevronLeft size={14} /> Back
                </button>
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep(currentStep)) setCurrentStep(currentStep + 1);
                  }}
                  style={{
                    padding: "10px 18px", background: "#4F46E5", color: "#fff", border: "none",
                    borderRadius: 10, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 700
                  }}
                >
                  Continue <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAllot}
                  style={{
                    padding: "10px 18px", background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", color: "#fff",
                    border: "none", borderRadius: 10, fontSize: 13.5, cursor: "pointer", fontWeight: 700
                  }}
                >
                  Allot Room & Generate Bills
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Edit Allotment Modal */}
      {showEditAllotModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <form onSubmit={handleEditAllotmentSubmit} style={{
            background: "#fff", padding: 32, borderRadius: 20, width: "100%", maxWidth: 440,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)"
          }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: 20, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.5px" }}>Edit Allotment Details</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 28 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Hostel Block</label>
                <select
                  value={editHostelName}
                  onChange={(e) => setEditHostelName(e.target.value)}
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none", background: "#fff" }}
                >
                  <option value="Block A - Boys Hostel">Block A - Boys Hostel</option>
                  <option value="Block B - Girls Hostel">Block B - Girls Hostel</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Room Number</label>
                <input
                  type="text"
                  value={editRoomNumber}
                  onChange={(e) => setEditRoomNumber(e.target.value)}
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Monthly Rent (INR)</label>
                <input
                  type="number"
                  value={editRent}
                  onChange={(e) => setEditRent(e.target.value)}
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
                  <option value="Active">Active</option>
                  <option value="Checked Out">Checked Out</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="button"
                onClick={() => setShowEditAllotModal(false)}
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

      {/* View Attached Document / Tenant Details Modal */}
      {showViewDocModal && viewingAllotment && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "#fff", borderRadius: 24, width: "100%", maxWidth: 600,
            padding: 32, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            maxHeight: "90vh", overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", margin: 0 }}>Allotment Documents & Record</h2>
                <p style={{ margin: "4px 0 0 0", fontSize: 14, color: "#64748B" }}>Student: {viewingAllotment.studentName} ({viewingAllotment.studentId})</p>
              </div>
              <span style={{
                background: viewingAllotment.status === "Active" ? "#ECFDF5" : "#FEF2F2",
                color: viewingAllotment.status === "Active" ? "#047857" : "#EF4444",
                padding: "6px 12px", borderRadius: 10, fontSize: 12, fontWeight: 800
              }}>
                {viewingAllotment.status.toUpperCase()}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, background: "#F8FAFC", padding: 18, borderRadius: 14, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Assigned Room</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#0F172A", marginTop: 4 }}>Room {viewingAllotment.roomNumber} ({viewingAllotment.hostelName})</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Check-In Date</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#0F172A", marginTop: 4 }}>{viewingAllotment.checkInDate}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Monthly Rent</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#10B981", marginTop: 4 }}>₹{viewingAllotment.rent.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Verification Status</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#4F46E5", marginTop: 4 }}>Verified</div>
              </div>
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", marginBottom: 14 }}>Attached Tenant Files & Proofs</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, background: "#F1F5F9", borderRadius: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <User size={22} style={{ color: "#4F46E5" }} />
                  <div>
                    <div style={{ fontWeight: 800, color: "#0F172A", fontSize: 14 }}>Tenant Profile Photo</div>
                    <div style={{ fontSize: 12, color: "#64748B" }}>{viewingAllotment.photoUploaded || "Student_Profile_Photo.jpg"}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenPhotoPreview(viewingAllotment)}
                  style={{ background: "#4F46E5", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)" }}
                >
                  <Eye size={14} /> View Photo
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, background: "#F1F5F9", borderRadius: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <FileText size={22} style={{ color: "#10B981" }} />
                  <div>
                    <div style={{ fontWeight: 800, color: "#0F172A", fontSize: 14 }}>ID Proof / Undertaking Form</div>
                    <div style={{ fontSize: 12, color: "#64748B" }}>{viewingAllotment.documentUploaded || "ID_Proof_Undertaking.pdf"}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenDocPreview(viewingAllotment)}
                  style={{ background: "#10B981", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)" }}
                >
                  <Eye size={14} /> View Document
                </button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
              <button
                type="button"
                onClick={() => setShowViewDocModal(false)}
                style={{ padding: "11px 24px", borderRadius: 12, border: "1px solid #CBD5E1", background: "#fff", color: "#475569", fontWeight: 700, cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive File & Document Preview Modal */}
      {showFilePreviewModal && viewingAllotment && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200,
          backdropFilter: "blur(6px)", padding: 20
        }}>
          <div style={{
            background: "#fff", borderRadius: 24, width: "100%", maxWidth: 700,
            padding: 32, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
            maxHeight: "92vh", display: "flex", flexDirection: "column", overflow: "hidden"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: 18, marginBottom: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: previewFileTarget === "photo" ? "#EEF2FF" : "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", color: previewFileTarget === "photo" ? "#4F46E5" : "#10B981" }}>
                  {previewFileTarget === "photo" ? <User size={22} /> : <FileText size={22} />}
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: "#0F172A", margin: 0 }}>
                    {previewFileTarget === "photo" ? "Tenant Profile Photo & ID Badge" : "ID Proof & Undertaking Agreement"}
                  </h2>
                  <p style={{ margin: "3px 0 0 0", fontSize: 13, color: "#64748B" }}>
                    Student: {viewingAllotment.studentName} ({viewingAllotment.studentId}) • File: {previewFileName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFilePreviewModal(false)}
                style={{ background: "#F1F5F9", border: "none", borderRadius: 10, padding: 8, color: "#64748B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
              {previewFileTarget === "photo" ? (
                previewFileDataUrl ? (
                  <div style={{ textAlign: "center", padding: 16, background: "#F8FAFC", borderRadius: 16, border: "1px solid #E2E8F0" }}>
                    <img src={previewFileDataUrl} alt="Tenant Photo" style={{ maxWidth: "100%", maxHeight: 420, objectFit: "contain", borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                    <div style={{ marginTop: 14, fontSize: 14, fontWeight: 800, color: "#1E293B" }}>{viewingAllotment.studentName} — {previewFileName}</div>
                  </div>
                ) : (
                  <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", borderRadius: 20, padding: 32, color: "#fff", border: "2px solid #334155", boxShadow: "0 12px 30px rgba(0,0,0,0.2)", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(56, 189, 248, 0.08)" }}></div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #334155", paddingBottom: 16, marginBottom: 20 }}>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: "#38BDF8", letterSpacing: "1px", textTransform: "uppercase" }}>HOSTEL RESIDENT ID</div>
                        <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 2 }}>Official Tenant Verification Dossier</div>
                      </div>
                      <span style={{ background: "#059669", color: "#ECFDF5", padding: "5px 12px", borderRadius: 8, fontSize: 11.5, fontWeight: 800 }}>ACTIVE</span>
                    </div>
                    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                      <div style={{ width: 120, height: 135, borderRadius: 14, background: "#334155", border: "3px solid #38BDF8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <User size={54} style={{ color: "#94A3B8" }} />
                        <span style={{ fontSize: 10, color: "#CBD5E1", marginTop: 6, fontWeight: 700 }}>{viewingAllotment.studentId}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>{viewingAllotment.studentName}</div>
                        <div style={{ fontSize: 13.5, color: "#38BDF8", fontWeight: 700, marginTop: 4 }}>Room {viewingAllotment.roomNumber} ({viewingAllotment.hostelName})</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16, background: "rgba(255,255,255,0.04)", padding: 12, borderRadius: 10 }}>
                          <div>
                            <div style={{ fontSize: 10.5, color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>Check-In Date</div>
                            <div style={{ fontSize: 13.5, fontWeight: 800, color: "#F1F5F9", marginTop: 2 }}>{viewingAllotment.checkInDate}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10.5, color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>Monthly Tariff</div>
                            <div style={{ fontSize: 13.5, fontWeight: 800, color: "#34D399", marginTop: 2 }}>₹{viewingAllotment.rent.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#64748B" }}>
                      <span>Attached File: {previewFileName}</span>
                      <span style={{ fontFamily: "monospace", letterSpacing: "2px", color: "#94A3B8" }}>*|{viewingAllotment.studentId}-{viewingAllotment.roomNumber}|*</span>
                    </div>
                  </div>
                )
              ) : (
                previewFileDataUrl ? (
                  previewFileDataUrl.startsWith("data:application/pdf") ? (
                    <iframe src={previewFileDataUrl} style={{ width: "100%", height: 460, border: "1px solid #CBD5E1", borderRadius: 12 }} title="Undertaking Preview" />
                  ) : (
                    <div style={{ textAlign: "center", padding: 16, background: "#F8FAFC", borderRadius: 16, border: "1px solid #E2E8F0" }}>
                      <img src={previewFileDataUrl} alt="Undertaking Scan" style={{ maxWidth: "100%", maxHeight: 440, objectFit: "contain", borderRadius: 12 }} />
                      <div style={{ marginTop: 12, fontSize: 13.5, fontWeight: 800, color: "#1E293B" }}>{previewFileName}</div>
                    </div>
                  )
                ) : (
                  <div style={{ border: "2px solid #CBD5E1", borderRadius: 16, padding: 26, background: "#FFF", color: "#1E293B", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                    <div style={{ textAlign: "center", borderBottom: "2px solid #0F172A", paddingBottom: 16, marginBottom: 20 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 900, color: "#0F172A", margin: 0, textTransform: "uppercase" }}>HOSTEL RESIDENCY AGREEMENT & UNDERTAKING</h3>
                      <p style={{ margin: "4px 0 0 0", fontSize: 12.5, color: "#64748B" }}>Official Terms Verification & Code of Conduct • Ref: REF-DOC-{viewingAllotment.studentId}-{viewingAllotment.id}</p>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, background: "#F8FAFC", padding: 16, borderRadius: 12, border: "1px solid #E2E8F0", marginBottom: 20 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Resident Name</div>
                        <div style={{ fontSize: 14.5, fontWeight: 900, color: "#0F172A", marginTop: 2 }}>{viewingAllotment.studentName} ({viewingAllotment.studentId})</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Assigned Accommodation</div>
                        <div style={{ fontSize: 14.5, fontWeight: 900, color: "#0F172A", marginTop: 2 }}>Room {viewingAllotment.roomNumber} ({viewingAllotment.hostelName})</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Check-In Date</div>
                        <div style={{ fontSize: 14.5, fontWeight: 800, color: "#334155", marginTop: 2 }}>{viewingAllotment.checkInDate}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Monthly Tariff</div>
                        <div style={{ fontSize: 14.5, fontWeight: 900, color: "#10B981", marginTop: 2 }}>₹{viewingAllotment.rent.toLocaleString()} / month</div>
                      </div>
                    </div>
                    <h4 style={{ fontSize: 14.5, fontWeight: 800, color: "#0F172A", marginBottom: 10 }}>Undertaking Checklist & Code of Conduct:</h4>
                    <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8, fontSize: 13.5, color: "#334155" }}>
                      <li><strong>Curfew Timings Compliance:</strong> Resident agrees to enter the hostel premises strictly prior to the curfew time (9:30 PM) every evening.</li>
                      <li><strong>Care of Property:</strong> Resident undertakes to keep furniture, electrical installations, and common utilities intact, bearing full responsibility for any willful damage.</li>
                      <li><strong>Biometric Attendance Compliance:</strong> Resident agrees to record daily biometric attendance at the warden security kiosk.</li>
                      <li><strong>Timely Tariff Payment:</strong> Resident acknowledges that monthly hostel dues are strictly payable on or before the 5th of every month.</li>
                    </ul>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, marginTop: 32, paddingTop: 20, borderTop: "1px dashed #CBD5E1", textAlign: "center" }}>
                      <div>
                        <div style={{ fontWeight: 800, color: "#0F172A", fontSize: 13.5, borderBottom: "1px solid #64748B", paddingBottom: 4, display: "inline-block", minWidth: 180 }}>Digital Sign: {viewingAllotment.studentName}</div>
                        <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 4 }}>Resident Undertaking Sign</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: "#10B981", fontSize: 13.5, borderBottom: "1px solid #64748B", paddingBottom: 4, display: "inline-block", minWidth: 180 }}>VERIFIED & APPROVED</div>
                        <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 4 }}>Warden Administration Stamp</div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E2E8F0", paddingTop: 18, marginTop: 22 }}>
              <button
                type="button"
                onClick={() => handlePrintPreviewFile(viewingAllotment, previewFileTarget)}
                style={{ padding: "10px 18px", borderRadius: 12, border: "1px solid #CBD5E1", background: "#F8FAFC", color: "#334155", fontWeight: 700, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
              >
                <Printer size={16} /> Print / Save as PDF
              </button>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => handleDownloadPreviewFile(viewingAllotment, previewFileTarget, previewFileName, previewFileDataUrl)}
                  style={{ padding: "10px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)", color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px -2px rgba(79, 70, 229, 0.3)" }}
                >
                  <Download size={16} /> Download File
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilePreviewModal(false)}
                  style={{ padding: "10px 22px", borderRadius: 12, border: "1px solid #CBD5E1", background: "#fff", color: "#475569", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

