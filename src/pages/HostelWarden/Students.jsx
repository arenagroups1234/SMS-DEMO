import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Plus, Eye, Upload, X, Printer, Mail, AlertTriangle, ShieldCheck, Edit, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { hostelStudentsApi, hostelAllotmentsApi, hostelRoomsApi, usersApi } from "../../services/api";

export default function Students() {
  const { schoolId } = useParams();
  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem(`sms_${schoolId}_hostel_students`);
    if (saved && saved !== "[]") {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const [registeredSchoolStudents, setRegisteredSchoolStudents] = useState([]);
  const [selectedSchoolStudentId, setSelectedSchoolStudentId] = useState("");
  const [selectedStudentFloor, setSelectedStudentFloor] = useState("All");
  const [editStudentFloor, setEditStudentFloor] = useState("All");

  const [createdRooms, setCreatedRooms] = useState(() => {
    const saved = localStorage.getItem(`sms_${schoolId}_hostel_rooms`);
    if (saved && saved !== "[]") {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    hostelStudentsApi.getAll({ schoolId }).then(res => {
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setStudents(prev => {
          const merged = [...res.data];
          prev.forEach(st => {
            if (!merged.some(m => String(m.id) === String(st.id))) {
              merged.push(st);
            }
          });
          return merged;
        });
      }
    }).catch(() => {});

    usersApi.getAll({ role: "student", schoolId, limit: 100 }).then(res => {
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setRegisteredSchoolStudents(res.data);
      }
    }).catch(() => {});

    hostelRoomsApi.getAll({ schoolId }).then(res => {
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setCreatedRooms(res.data);
      }
    }).catch(() => {});
  }, [schoolId]);

  useEffect(() => {
    localStorage.setItem(`sms_${schoolId}_hostel_students`, JSON.stringify(students));
  }, [students, schoolId]);

  const [searchQuery, setSearchQuery] = useState("");
  const [blockFilter, setBlockFilter] = useState("All");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudentDocs, setSelectedStudentDocs] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editStudent, setEditStudent] = useState(null);

  const handleEditClick = (student) => {
    setEditingStudent(student);
    setEditStudent({
      id: student.id,
      name: student.name,
      class: student.class,
      roomNumber: student.roomNumber,
      block: student.block,
      parentName: student.parentName,
      parentPhone: student.parentPhone ? student.parentPhone.replace(/\D/g, "") : "",
      bloodGroup: student.bloodGroup,
      email: student.email,
      photo: student.documents?.photo || "",
      aadhaarFront: student.documents?.aadhaarFront || "",
      aadhaarBack: student.documents?.aadhaarBack || "",
      collegeId: student.documents?.collegeId || "",
      agreement: student.documents?.agreement || ""
    });
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "parentPhone") {
      const cleanValue = value.replace(/\D/g, "");
      if (cleanValue.length <= 10) {
        setEditStudent(prev => ({ ...prev, [name]: cleanValue }));
      }
      return;
    }
    setEditStudent(prev => ({ ...prev, [name]: value }));
  };

  const handleEditFileChange = (e, docKey) => {
    const file = e.target.files[0];
    if (file) {
      setEditStudent(prev => ({ ...prev, [docKey]: file.name }));
    }
  };

  const handleEditStudentSubmit = async (e) => {
    e.preventDefault();
    if (!editStudent.name.trim() || !editStudent.id.trim() || !editStudent.roomNumber.trim()) {
      toast.error("Please fill in Student Name, ID, and Room Number.");
      return;
    }
    if (editStudent.parentPhone && editStudent.parentPhone.length !== 10) {
      toast.error("Parent Contact Phone number must be exactly 10 digits.");
      return;
    }

    // Check capacity if room changed or when verifying room assignment
    const savedRoomsStr = localStorage.getItem(`sms_${schoolId}_hostel_rooms`);
    const savedAllotmentsStr = localStorage.getItem(`sms_${schoolId}_hostel_allotments`);
    if (savedRoomsStr && savedAllotmentsStr) {
      const currentRooms = JSON.parse(savedRoomsStr);
      const currentAllotments = JSON.parse(savedAllotmentsStr);
      const targetHostelName = editStudent.block && editStudent.block.includes("Boys") ? "Block A - Boys Hostel" : "Block B - Girls Hostel";
      const targetRoom = currentRooms.find(r => r.roomNumber === editStudent.roomNumber.trim() && ((editStudent.block.includes("Boys") && r.hostelId === "1") || (!editStudent.block.includes("Boys") && r.hostelId === "2")));
      if (targetRoom) {
        const activeOccupants = currentAllotments.filter(a => a.roomNumber === editStudent.roomNumber.trim() && a.hostelName === targetHostelName && a.status === "Active" && a.studentId !== editStudent.id).length;
        if (activeOccupants >= targetRoom.capacity) {
          toast.error(`Room ${editStudent.roomNumber} is full (${activeOccupants}/${targetRoom.capacity} beds occupied). Cannot assign.`);
          return;
        }
      }
    }

    try {
      const fd = new FormData();
      fd.append("name", editStudent.name.trim());
      fd.append("class", editStudent.class || "N/A");
      fd.append("roomNumber", editStudent.roomNumber.trim());
      fd.append("block", editStudent.block);
      fd.append("parentName", editStudent.parentName || "N/A");
      fd.append("parentPhone", editStudent.parentPhone || "N/A");
      fd.append("bloodGroup", editStudent.bloodGroup);
      fd.append("email", editStudent.email || "N/A");
      fd.append("schoolId", schoolId || "");
      await hostelStudentsApi.update(editStudent.id, fd);
    } catch (err) {}

    // Update corresponding Allotment record if exists in localStorage
    const allotmentsStrEdit = localStorage.getItem(`sms_${schoolId}_hostel_allotments`);
    if (allotmentsStrEdit) {
      const currentAllotments = JSON.parse(allotmentsStrEdit);
      const updatedAllotments = currentAllotments.map(al => {
        if (al.studentId === editStudent.id) {
          return {
            ...al,
            studentName: editStudent.name,
            hostelName: editStudent.block.includes("Boys") ? "Block A - Boys Hostel" : "Block B - Girls Hostel",
            roomNumber: editStudent.roomNumber
          };
        }
        return al;
      });
      localStorage.setItem(`sms_${schoolId}_hostel_allotments`, JSON.stringify(updatedAllotments));
    }

    // Automatically create corresponding Room record in localStorage if it doesn't exist
    const roomsStrEdit = localStorage.getItem(`sms_${schoolId}_hostel_rooms`);
    let currentRooms = [];
    if (roomsStrEdit) {
      currentRooms = JSON.parse(roomsStrEdit);
    } else {
      currentRooms = [
        { id: "101", hostelId: "1", roomNumber: "101", type: "AC", capacity: 3, occupied: 3, rent: 5500, floor: "1st Floor" },
        { id: "102", hostelId: "1", roomNumber: "102", type: "Non-AC", capacity: 4, occupied: 2, rent: 4000, floor: "1st Floor" },
        { id: "103", hostelId: "1", roomNumber: "103", type: "AC", capacity: 2, occupied: 1, rent: 6000, floor: "1st Floor" },
        { id: "201", hostelId: "1", roomNumber: "201", type: "AC", capacity: 3, occupied: 0, rent: 5500, floor: "2nd Floor" },
        { id: "301", hostelId: "2", roomNumber: "101", type: "AC", capacity: 3, occupied: 2, rent: 5500, floor: "1st Floor" },
        { id: "302", hostelId: "2", roomNumber: "102", type: "Non-AC", capacity: 4, occupied: 4, rent: 4000, floor: "1st Floor" }
      ];
    }

    const targetHostelId = editStudent.block.includes("Boys") ? "1" : "2";
    const roomExists = currentRooms.some(r => r.hostelId === targetHostelId && r.roomNumber === editStudent.roomNumber);
    if (!roomExists) {
      const newRoom = {
        id: String(Date.now() + 1),
        hostelId: targetHostelId,
        roomNumber: editStudent.roomNumber,
        type: "AC",
        capacity: 3,
        occupied: 1,
        rent: targetHostelId === "1" ? 5500 : 6000,
        floor: "1st Floor",
        schoolId: schoolId || ""
      };
      try {
        await hostelRoomsApi.create(newRoom);
      } catch (err) {}
      const updatedRooms = [...currentRooms, newRoom];
      localStorage.setItem(`sms_${schoolId}_hostel_rooms`, JSON.stringify(updatedRooms));
    }

    setStudents(prev => prev.map(s => {
      if (s.id === editingStudent.id) {
        return {
          id: editStudent.id,
          name: editStudent.name,
          class: editStudent.class || "N/A",
          roomNumber: editStudent.roomNumber,
          block: editStudent.block,
          parentName: editStudent.parentName || "N/A",
          parentPhone: editStudent.parentPhone || "N/A",
          bloodGroup: editStudent.bloodGroup,
          email: editStudent.email || "N/A",
          documents: {
            photo: editStudent.photo || "Not Uploaded",
            aadhaarFront: editStudent.aadhaarFront || "Not Uploaded",
            aadhaarBack: editStudent.aadhaarBack || "Not Uploaded",
            collegeId: editStudent.collegeId || "Not Uploaded",
            agreement: editStudent.agreement || "Not Uploaded"
          }
        };
      }
      return s;
    }));

    setShowEditModal(false);
    setEditingStudent(null);
    setEditStudent(null);
    toast.success("Resident profile updated successfully!");
  };

  const handleDeleteStudent = async (student) => {
    if (window.confirm(`Are you sure you want to remove resident ${student.name} (${student.id})? This will also check out their room allotment.`)) {
      const updatedStudents = students.filter(s => s.id !== student.id);
      setStudents(updatedStudents);
      localStorage.setItem(`sms_${schoolId}_hostel_students`, JSON.stringify(updatedStudents));

      const savedAllotmentsStr = localStorage.getItem(`sms_${schoolId}_hostel_allotments`);
      if (savedAllotmentsStr) {
        const currentAllotments = JSON.parse(savedAllotmentsStr);
        const updatedAllotments = currentAllotments.map(al => 
          al.studentId.toLowerCase() === student.id.toLowerCase() && al.status === "Active"
            ? { ...al, status: "Checked Out" }
            : al
        );
        localStorage.setItem(`sms_${schoolId}_hostel_allotments`, JSON.stringify(updatedAllotments));
      }

      try { await hostelStudentsApi.delete(student.id); } catch (err) {}
      toast.success(`Resident ${student.name} removed successfully.`);
    }
  };

  const handleExportStudentsCSV = () => {
    if (students.length === 0) {
      toast.error("No residents available to export.");
      return;
    }
    toast.success("Exporting resident directory CSV report...");
    const headers = ["Student ID,Name,Class,Room Number,Hostel Block,Parent Name,Parent Phone,Blood Group,Email,Status"];
    const rows = students.map(s => `"${s.id}","${s.name}","${s.class}","${s.roomNumber}","${s.block}","${s.parentName}","${s.parentPhone}","${s.bloodGroup}","${s.email}","${s.status || 'Active'}"`);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Hostel_Residents_Directory_${schoolId || 'portal'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadResidentSlip = (student) => {
    toast.success(`Downloading official resident ID & profile slip for ${student.name}...`);
    const headers = ["Student ID,Name,Class,Room Number,Hostel Block,Parent Name,Parent Phone,Blood Group,Email,Status"];
    const rows = [`"${student.id}","${student.name}","${student.class}","${student.roomNumber}","${student.block}","${student.parentName}","${student.parentPhone}","${student.bloodGroup}","${student.email}","${student.status || 'Active'}"`];
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Resident_Slip_${student.id}_${student.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // New Student Form state
  const [newStudent, setNewStudent] = useState({
    id: "",
    name: "",
    class: "",
    roomNumber: "",
    block: "Block A (Boys)",
    parentName: "",
    parentPhone: "",
    bloodGroup: "O+",
    email: "",
    photo: "",
    aadhaarFront: "",
    aadhaarBack: "",
    collegeId: "",
    agreement: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Enforce 10-digit numeric constraint on parentPhone
    if (name === "parentPhone") {
      const cleanValue = value.replace(/\D/g, ""); // numbers only
      if (cleanValue.length <= 10) {
        setNewStudent(prev => ({
          ...prev,
          [name]: cleanValue
        }));
      }
      return;
    }

    setNewStudent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectSchoolStudent = (e) => {
    const studentIdVal = e.target.value;
    setSelectedSchoolStudentId(studentIdVal);
    if (!studentIdVal) {
      setNewStudent({
        id: "",
        name: "",
        class: "",
        roomNumber: "",
        block: "Block A (Boys)",
        parentName: "",
        parentPhone: "",
        bloodGroup: "O+",
        email: "",
        photo: "",
        aadhaarFront: "",
        aadhaarBack: "",
        collegeId: "",
        agreement: ""
      });
      return;
    }

    const matched = registeredSchoolStudents.find(s => String(s.id) === String(studentIdVal));
    if (matched) {
      setNewStudent(prev => ({
        ...prev,
        name: matched.name || "",
        id: matched.rollNo || matched.rollNumber || String(matched.id).slice(0, 10),
        class: matched.className || matched.class || "",
        email: matched.email || "",
        parentName: matched.fatherName || matched.parentName || "",
        parentPhone: (matched.parentPhone || matched.fatherPhone || matched.phone || "").replace(/\D/g, "").slice(0, 10),
        bloodGroup: matched.bloodGroup || "O+"
      }));
    }
  };

  const handleFileChange = (e, docKey) => {
    const file = e.target.files[0];
    if (file) {
      setNewStudent(prev => ({
        ...prev,
        [docKey]: file.name
      }));
    }
  };

  const handleAddStudentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSchoolStudentId) {
      toast.error("Please select a registered school student from the dropdown list!");
      return;
    }
    if (!newStudent.name.trim() || !newStudent.id.trim() || !newStudent.roomNumber.trim()) {
      toast.error("Please fill in Student Name, ID, and Room Number.");
      return;
    }

    const nameRegex = /^[A-Za-z\s.]+$/;
    if (!nameRegex.test(newStudent.name.trim())) {
      toast.error("Student Name should contain only letters and spaces. Numbers and special characters are not allowed.");
      return;
    }

    if (newStudent.parentName && !nameRegex.test(newStudent.parentName.trim())) {
      toast.error("Parent Name should contain only letters and spaces. Numbers and special characters are not allowed.");
      return;
    }

    if (newStudent.parentPhone && !/^\d{10}$/.test(newStudent.parentPhone.trim())) {
      toast.error("Parent Contact Phone number must contain exactly 10 digits without spaces or special characters.");
      return;
    }

    if (!newStudent.photo || !newStudent.aadhaarFront || !newStudent.aadhaarBack || !newStudent.collegeId || !newStudent.agreement) {
      toast.error("Please upload all mandatory documents before saving the student.");
      return;
    }

    if (students.some(s => s.id.toLowerCase() === newStudent.id.trim().toLowerCase())) {
      toast.error(`A student with Roll ID '${newStudent.id.trim()}' already exists.`);
      return;
    }

    const savedRoomsStrCheck = localStorage.getItem(`sms_${schoolId}_hostel_rooms`);
    const savedAllotmentsStrCheck = localStorage.getItem(`sms_${schoolId}_hostel_allotments`);
    if (savedRoomsStrCheck && savedAllotmentsStrCheck) {
      const currentRooms = JSON.parse(savedRoomsStrCheck);
      const currentAllotments = JSON.parse(savedAllotmentsStrCheck);
      const targetHostelName = newStudent.block && newStudent.block.includes("Boys") ? "Block A - Boys Hostel" : "Block B - Girls Hostel";
      const targetRoom = currentRooms.find(r => r.roomNumber === newStudent.roomNumber.trim() && ((newStudent.block.includes("Boys") && r.hostelId === "1") || (!newStudent.block.includes("Boys") && r.hostelId === "2")));
      if (targetRoom) {
        const activeOccupants = currentAllotments.filter(a => a.roomNumber === newStudent.roomNumber.trim() && a.hostelName === targetHostelName && a.status === "Active").length;
        if (activeOccupants >= targetRoom.capacity) {
          toast.error(`Room ${newStudent.roomNumber} is full (${activeOccupants}/${targetRoom.capacity} beds occupied). Please choose another room.`);
          return;
        }
      }
    }

    const addedStudent = {
      id: newStudent.id.trim(),
      name: newStudent.name.trim(),
      class: newStudent.class.trim() || "N/A",
      roomNumber: newStudent.roomNumber.trim(),
      block: newStudent.block,
      parentName: newStudent.parentName.trim() || "N/A",
      parentPhone: newStudent.parentPhone.trim() || "N/A",
      bloodGroup: newStudent.bloodGroup,
      email: newStudent.email.trim() || "N/A",
      documents: {
        photo: newStudent.photo || "Not Uploaded",
        aadhaarFront: newStudent.aadhaarFront || "Not Uploaded",
        aadhaarBack: newStudent.aadhaarBack || "Not Uploaded",
        collegeId: newStudent.collegeId || "Not Uploaded",
        agreement: newStudent.agreement || "Not Uploaded"
      },
      schoolId: schoolId || ""
    };

    try {
      const fd = new FormData();
      fd.append("id", addedStudent.id);
      fd.append("name", addedStudent.name);
      fd.append("class", addedStudent.class);
      fd.append("roomNumber", addedStudent.roomNumber);
      fd.append("block", addedStudent.block);
      fd.append("parentName", addedStudent.parentName);
      fd.append("parentPhone", addedStudent.parentPhone);
      fd.append("bloodGroup", addedStudent.bloodGroup);
      fd.append("email", addedStudent.email);
      fd.append("schoolId", addedStudent.schoolId);
      await hostelStudentsApi.create(fd);
    } catch (err) {}

    // Automatically create corresponding Allotment record in localStorage
    const savedAllotmentsStr = localStorage.getItem(`sms_${schoolId}_hostel_allotments`);
    let currentAllotments = [];
    if (savedAllotmentsStr && savedAllotmentsStr !== "[]") {
      try { currentAllotments = JSON.parse(savedAllotmentsStr); } catch (e) {}
    }

    const todayDate = new Date().toISOString().split("T")[0];
    const autoAllotment = {
      id: String(Date.now()),
      studentName: addedStudent.name,
      studentId: addedStudent.id,
      hostelName: addedStudent.block.includes("Boys") ? "Block A - Boys Hostel" : "Block B - Girls Hostel",
      roomNumber: addedStudent.roomNumber,
      checkInDate: todayDate,
      status: "Active",
      rent: addedStudent.block.includes("Boys") ? 5500 : 6000,
      schoolId: schoolId || ""
    };

    try {
      await hostelAllotmentsApi.create(autoAllotment);
    } catch (err) {}

    const newAllotmentsList = [autoAllotment, ...currentAllotments];
    localStorage.setItem(`sms_${schoolId}_hostel_allotments`, JSON.stringify(newAllotmentsList));

    // Automatically create corresponding Room record in localStorage if it doesn't exist
    const savedRoomsStr = localStorage.getItem(`sms_${schoolId}_hostel_rooms`);
    let currentRooms = [];
    if (savedRoomsStr) {
      currentRooms = JSON.parse(savedRoomsStr);
    } else {
      currentRooms = [
        { id: "101", hostelId: "1", roomNumber: "101", type: "AC", capacity: 3, occupied: 3, rent: 5500, floor: "1st Floor" },
        { id: "102", hostelId: "1", roomNumber: "102", type: "Non-AC", capacity: 4, occupied: 2, rent: 4000, floor: "1st Floor" },
        { id: "103", hostelId: "1", roomNumber: "103", type: "AC", capacity: 2, occupied: 1, rent: 6000, floor: "1st Floor" },
        { id: "201", hostelId: "1", roomNumber: "201", type: "AC", capacity: 3, occupied: 0, rent: 5500, floor: "2nd Floor" },
        { id: "301", hostelId: "2", roomNumber: "101", type: "AC", capacity: 3, occupied: 2, rent: 5500, floor: "1st Floor" },
        { id: "302", hostelId: "2", roomNumber: "102", type: "Non-AC", capacity: 4, occupied: 4, rent: 4000, floor: "1st Floor" }
      ];
    }

    const targetHostelId = addedStudent.block.includes("Boys") ? "1" : "2";
    const roomExists = currentRooms.some(r => r.hostelId === targetHostelId && r.roomNumber === addedStudent.roomNumber);
    if (!roomExists) {
      const newRoom = {
        id: String(Date.now() + 1),
        hostelId: targetHostelId,
        roomNumber: addedStudent.roomNumber,
        type: "AC",
        capacity: 3,
        occupied: 1,
        rent: targetHostelId === "1" ? 5500 : 6000,
        floor: "1st Floor",
        schoolId: schoolId || ""
      };
      try {
        await hostelRoomsApi.create(newRoom);
      } catch (err) {}
      const updatedRooms = [...currentRooms, newRoom];
      localStorage.setItem(`sms_${schoolId}_hostel_rooms`, JSON.stringify(updatedRooms));
    }

    setStudents([addedStudent, ...students]);
    setShowAddModal(false);
    
    // Reset Form
    setNewStudent({
      id: "",
      name: "",
      class: "",
      roomNumber: "",
      block: "Block A (Boys)",
      parentName: "",
      parentPhone: "",
      bloodGroup: "O+",
      email: "",
      photo: "",
      aadhaarFront: "",
      aadhaarBack: "",
      collegeId: "",
      agreement: ""
    });
    toast.success("Student registered and room allotted successfully!");
  };

  // Helper to trigger download & PDF view of individual locker document
  const handleDownloadDoc = (docName, docTitle, student) => {
    if (!docName || docName === "Not Uploaded") {
      toast.error(`${docTitle} has not been uploaded yet for ${student?.name || "this resident"}.`);
      return;
    }

    const docContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${docTitle} - ${student?.name || "Resident"}</title>
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
    <button onclick="if(window.opener){window.close();}else if(window.history.length>1){window.history.back();}else{window.location.href=window.location.origin+'/hostel-warden/students';}" style="background: #3b82f6; color: #fff; border: none; padding: 9px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 14px; transition: 0.2s;">
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
      <div><strong>Resident Name:</strong> ${student?.name || "N/A"}</div>
      <div><strong>Resident ID:</strong> ${student?.id || "N/A"}</div>
      <div><strong>Hostel Block:</strong> ${student?.block || "N/A"}</div>
      <div><strong>Room Number:</strong> ${student?.roomNumber || "N/A"}</div>
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
  const handlePrintLockerDocs = (student) => {
    if (!student) return;
    const docs = student.documents || {};
    const dossierContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Locker Dossier - ${student.name}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 0; margin: 0; color: #1e293b; background: #fff; }
    .no-print { background: #1e293b; color: #fff; padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 9999; box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
    .container { max-width: 800px; margin: 40px auto; border: 2px solid #cbd5e1; padding: 40px; border-radius: 12px; }
    .header { text-align: center; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { margin: 0; font-size: 26px; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; }
    .header p { margin: 6px 0 0 0; color: #64748b; font-size: 15px; }
    .section-title { background: #f1f5f9; padding: 10px 16px; font-weight: bold; font-size: 16px; color: #334155; border-left: 4px solid #3b82f6; margin: 25px 0 15px 0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
    .info-item { font-size: 14px; }
    .info-item strong { color: #64748b; display: block; font-size: 12px; text-transform: uppercase; margin-bottom: 3px; }
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
    <button onclick="if(window.opener){window.close();}else if(window.history.length>1){window.history.back();}else{window.location.href=window.location.origin+'/hostel-warden/students';}" style="background: #3b82f6; color: #fff; border: none; padding: 9px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 14px;">
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
      <p>Official Document Verification Record</p>
    </div>

    <div class="section-title">Resident Profile</div>
    <div class="grid">
      <div class="info-item"><strong>Full Name</strong> ${student.name}</div>
      <div class="info-item"><strong>Resident / Student ID</strong> ${student.id}</div>
      <div class="info-item"><strong>Hostel Block</strong> ${student.block}</div>
      <div class="info-item"><strong>Room Number</strong> ${student.roomNumber}</div>
      <div class="info-item"><strong>Parent/Guardian Contact</strong> ${student.parentName} (${student.parentPhone || "N/A"})</div>
      <div class="info-item"><strong>Blood Group / Email</strong> ${student.bloodGroup} | ${student.email || "N/A"}</div>
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
    toast.success(`Opening Digital Locker Dossier for ${student.name}. Use top Close button or Close Locker anytime.`);
  };

  // Helper to export/download full residents list as PDF
  const handleDownloadStudentsListPDF = () => {
    if (!filteredStudents.length) {
      toast.error("No residents found to export.");
      return;
    }
    const listContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Hostel Residents Directory</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 0; margin: 0; color: #1e293b; }
    .no-print { background: #1e293b; color: #fff; padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 9999; box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
    .content { padding: 30px; }
    h1 { margin: 0 0 5px 0; color: #0f172a; font-size: 24px; }
    p { margin: 0 0 20px 0; color: #64748b; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
    th { background: #f1f5f9; color: #334155; font-weight: 700; }
    @media print { .no-print { display: none !important; } .content { padding: 0; } }
  </style>
</head>
<body>
  <div class="no-print">
    <button onclick="if(window.opener){window.close();}else if(window.history.length>1){window.history.back();}else{window.location.href=window.location.origin+'/hostel-warden/students';}" style="background: #3b82f6; color: #fff; border: none; padding: 9px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 14px;">
      ← Close & Return to Hostel Portal
    </button>
    <div style="display: flex; gap: 12px; align-items: center;">
      <span style="font-size: 13px; color: #cbd5e1;">Select 'Save as PDF' in Destination</span>
      <button onclick="window.print()" style="background: #10b981; color: #fff; border: none; padding: 9px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 14px;">
        🖨️ Print / Save as PDF
      </button>
    </div>
  </div>
  <div class="content">
    <h1>Hostel Residents & Lockers Directory</h1>
    <p>Generated on ${new Date().toLocaleString()} | Filter: ${blockFilter} | Total Residents: ${filteredStudents.length}</p>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Resident Name</th>
          <th>Block / Hostel</th>
          <th>Room</th>
          <th>Parent Name</th>
          <th>Parent Phone</th>
          <th>Locker Docs</th>
        </tr>
      </thead>
      <tbody>
        ${filteredStudents.map(s => {
          const docs = s.documents || {};
          const count = [docs.photo, docs.aadhaarFront, docs.aadhaarBack, docs.collegeId, docs.agreement]
            .filter(d => d && d !== "Not Uploaded").length;
          return `
            <tr>
              <td><strong>${s.id}</strong></td>
              <td>${s.name}</td>
              <td>${s.block}</td>
              <td>${s.roomNumber}</td>
              <td>${s.parentName || "N/A"}</td>
              <td>${s.parentPhone || "N/A"}</td>
              <td>${count} / 5 Uploaded</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
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
      printWindow.document.write(listContent);
      printWindow.document.close();
    }
    toast.success("Opening complete Residents Directory for PDF export/printing!");
  };

  const filteredStudents = students.filter(st => {
    const matchesSearch = st.name.toLowerCase().includes(searchQuery.toLowerCase()) || st.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBlock = blockFilter === "All" || st.block.includes(blockFilter);
    return matchesSearch && matchesBlock;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: "-0.5px" }}>Hostel Residents & Lockers</h1>
          <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: 13.5 }}>Manage student admissions, allocate rooms, and upload mandatory digital locker documents.</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={handleExportStudentsCSV}
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
            title="Export Resident Directory CSV"
          >
            <Download size={16} /> <span>Export CSV</span>
          </button>
          <button
            onClick={handleDownloadStudentsListPDF}
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
            <Printer size={16} /> <span>Export / Print Directory</span>
          </button>
          <button
            onClick={() => {
              setSelectedSchoolStudentId("");
              setNewStudent({
                id: "",
                name: "",
                class: "",
                roomNumber: "",
                block: "Block A (Boys)",
                parentName: "",
                parentPhone: "",
                bloodGroup: "O+",
                email: "",
                photo: "",
                aadhaarFront: "",
                aadhaarBack: "",
                collegeId: "",
                agreement: ""
              });
              setShowAddModal(true);
            }}
            style={{
              padding: "11px 20px",
              background: "linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)",
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
              transition: "all 0.2s"
            }}
          >
            <Plus size={16} /> <span>Register New Student</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
          <input
            type="text"
            placeholder="Search student by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px 12px 42px",
              border: "1px solid #E2E8F0",
              borderRadius: 12,
              fontSize: 13.5,
              background: "#fff",
              outline: "none"
            }}
          />
          <span style={{ position: "absolute", left: 14, top: 13.5, fontSize: 16, color: "#94A3B8" }}>🔍</span>
        </div>

        <select
          value={blockFilter}
          onChange={(e) => setBlockFilter(e.target.value)}
          style={{
            padding: "12px 18px",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            fontSize: 13.5,
            background: "#fff",
            color: "#334155",
            outline: "none"
          }}
        >
          <option value="All">All Blocks</option>
          <option value="Block A">Block A (Boys)</option>
          <option value="Block B">Block B (Girls)</option>
        </select>
      </div>

      {/* Table of Hostel Residents */}
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
                <th style={{ padding: "16px 20px", fontWeight: 800, color: "#475569" }}>Resident Student</th>
                <th style={{ padding: "16px 20px", fontWeight: 800, color: "#475569" }}>Hostel & Room</th>
                <th style={{ padding: "16px 20px", fontWeight: 800, color: "#475569" }}>Parent / Guardian</th>
                <th style={{ padding: "16px 20px", fontWeight: 800, color: "#475569" }}>Blood Group</th>
                <th style={{ padding: "16px 20px", fontWeight: 800, color: "#475569" }}>Locker Documents</th>
                <th style={{ padding: "16px 20px", fontWeight: 800, color: "#475569", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
                    No students found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => {
                  const docs = student.documents || {};
                  const docCount = [docs.photo, docs.aadhaarFront, docs.aadhaarBack, docs.collegeId, docs.agreement]
                    .filter(d => d && d !== "Not Uploaded").length;

                  return (
                    <tr key={student.id} style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.15s ease" }} onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      
                      {/* 1. Student Name & ID */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: "50%", background: "#EEF2FF", color: "#4F46E5",
                            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, flexShrink: 0
                          }}>
                            {student.name ? student.name.charAt(0).toUpperCase() : "S"}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: "#0F172A", fontSize: 14 }}>{student.name}</div>
                            <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                              ID: <strong>{student.id}</strong> {student.class ? `| Class: ${student.class}` : ""}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Hostel & Room */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <span style={{ fontWeight: 700, color: "#1E293B" }}>{student.block}</span>
                          <span style={{ fontSize: 11.5, fontWeight: 800, background: "#EFF6FF", color: "#2563EB", padding: "2px 8px", borderRadius: 6, width: "fit-content" }}>
                            Room {student.roomNumber}
                          </span>
                        </div>
                      </td>

                      {/* 3. Parent / Guardian */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ fontWeight: 700, color: "#1E293B" }}>{student.parentName || "N/A"}</span>
                          <a href={`tel:${student.parentPhone}`} style={{ fontSize: 12, color: "#4F46E5", textDecoration: "none", fontWeight: 600 }}>
                            📞 {student.parentPhone || "N/A"}
                          </a>
                        </div>
                      </td>

                      {/* 4. Blood Group */}
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: "#DC2626", background: "#FEF2F2", padding: "4px 10px", borderRadius: 6, border: "1px solid #FEE2E2" }}>
                          🩸 {student.bloodGroup || "N/A"}
                        </span>
                      </td>

                      {/* 5. Locker Docs */}
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{
                          fontSize: 12, fontWeight: 800,
                          background: docCount === 5 ? "#ECFDF5" : docCount > 0 ? "#FEF3C7" : "#FEF2F2",
                          color: docCount === 5 ? "#047857" : docCount > 0 ? "#D97706" : "#DC2626",
                          padding: "4px 10px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 6
                        }}>
                          <ShieldCheck size={14} />
                          {docCount} / 5 Locker Docs
                        </span>
                      </td>

                      {/* 6. Actions */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
                          <button
                            onClick={() => setSelectedStudentDocs(student)}
                            style={{
                              padding: "7px 12px", borderRadius: 8, background: "#EEF2FF", color: "#4F46E5",
                              fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1px solid #E0E7FF",
                              display: "flex", alignItems: "center", gap: 6
                            }}
                            title="View Digital Locker Dossier"
                          >
                            <Eye size={14} /> Locker
                          </button>

                          <button
                            onClick={() => handleDownloadResidentSlip(student)}
                            style={{
                              padding: "7px 10px", borderRadius: 8, background: "#F0FDF4", color: "#10B981",
                              border: "1px solid #DCFCE7", fontSize: 12, fontWeight: 700, cursor: "pointer"
                            }}
                            title="Download Resident Slip"
                          >
                            <Download size={14} />
                          </button>

                          <button
                            onClick={() => handleEditClick(student)}
                            style={{
                              padding: "7px 10px", borderRadius: 8, background: "#F1F5F9", color: "#475569",
                              border: "1px solid #E2E8F0", fontSize: 12, fontWeight: 700, cursor: "pointer"
                            }}
                            title="Edit Profile"
                          >
                            <Edit size={14} />
                          </button>

                          <button
                            onClick={() => handleDeleteStudent(student)}
                            style={{
                              padding: "7px 10px", borderRadius: 8, background: "#FEF2F2", color: "#EF4444",
                              border: "1px solid #FEE2E2", fontSize: 12, fontWeight: 700, cursor: "pointer"
                            }}
                            title="Delete Resident"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD NEW STUDENT MODAL --- */}
      {showAddModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "#fff", borderRadius: 24, width: "100%", maxWidth: 650, maxHeight: "90vh",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column",
            overflow: "hidden"
          }}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 28px", borderBottom: "1px solid #E2E8F0" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#0F172A" }}>Register Hostel Student</h3>
                <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748B" }}>Input personal information and upload locker documents.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Scrollable Form) */}
            <form onSubmit={handleAddStudentSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflowY: "auto", padding: 28 }}>
              
              <h4 style={{ margin: "0 0 14px 0", fontSize: 14, color: "#4F46E5", fontWeight: 700, borderBottom: "1px solid #EEF2FF", paddingBottom: 6 }}>1. Personal & Stay Details</h4>
              
              {/* Select School Student Dropdown */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: "1/-1", marginBottom: 14, background: "#EEF2FF", padding: 14, borderRadius: 12, border: "1.5px solid #C7D2FE" }}>
                <label style={{ fontSize: 13, fontWeight: 800, color: "#4338CA" }}>
                  🔍 Select School Student (Registered in School Admin) *
                </label>
                <select
                  required
                  value={selectedSchoolStudentId}
                  onChange={handleSelectSchoolStudent}
                  style={{ padding: "10px 14px", border: "1.5px solid #818CF8", borderRadius: 10, fontSize: 13.5, background: "#fff", fontWeight: 700, color: "#1E1B4B" }}
                >
                  <option value="">-- Search & Choose Registered Student --</option>
                  {registeredSchoolStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.className || s.class || "Class N/A"}) - Roll/ID #{s.rollNo || s.rollNumber || String(s.id).slice(0,6)}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: 11.5, color: "#6366F1", fontWeight: 600 }}>
                  Selecting a student auto-fills their Name, Roll ID, Class, Email, and Parent contact details automatically.
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Full Student Name *</label>
                  <input
                    required
                    readOnly
                    type="text"
                    name="name"
                    value={newStudent.name}
                    onChange={handleInputChange}
                    placeholder="Auto-filled on selecting student above..."
                    style={{ padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 13.5, background: "#F8FAFC" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Student Roll ID *</label>
                  <input
                    required
                    readOnly
                    type="text"
                    name="id"
                    value={newStudent.id}
                    onChange={handleInputChange}
                    placeholder="Auto-filled on selecting student..."
                    style={{ padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 13.5, background: "#F8FAFC" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Class</label>
                  <input
                    readOnly
                    type="text"
                    name="class"
                    value={newStudent.class}
                    onChange={handleInputChange}
                    placeholder="Auto-filled..."
                    style={{ padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 13.5, background: "#F8FAFC" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Student Email</label>
                  <input
                    readOnly
                    type="email"
                    name="email"
                    value={newStudent.email}
                    onChange={handleInputChange}
                    placeholder="Auto-filled..."
                    style={{ padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 13.5, background: "#F8FAFC" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>1. Select Hostel Block *</label>
                  <select
                    name="block"
                    value={newStudent.block}
                    onChange={(e) => {
                      handleInputChange(e);
                      setSelectedStudentFloor("All");
                    }}
                    style={{ padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 13.5, background: "#fff", fontWeight: 700 }}
                  >
                    <option value="Block A (Boys)">Block A (Boys)</option>
                    <option value="Block B (Girls)">Block B (Girls)</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>2. Select Floor *</label>
                  <select
                    value={selectedStudentFloor}
                    onChange={(e) => setSelectedStudentFloor(e.target.value)}
                    style={{ padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 13.5, background: "#fff", fontWeight: 700 }}
                  >
                    <option value="All">-- Choose Floor --</option>
                    {Array.from(new Set(
                      createdRooms
                        .filter(r => {
                          const targetHostelId = newStudent.block.includes("Boys") ? "1" : "2";
                          return String(r.hostelId) === String(targetHostelId);
                        })
                        .map(r => r.floor)
                    )).map(fl => (
                      <option key={fl} value={fl}>{fl}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>3. Select Room Number *</label>
                  <select
                    required
                    name="roomNumber"
                    value={newStudent.roomNumber}
                    onChange={handleInputChange}
                    style={{ padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 13.5, background: "#fff", fontWeight: 700 }}
                  >
                    <option value="">-- Choose Created Room --</option>
                    {createdRooms
                      .filter(r => {
                        const targetHostelId = newStudent.block.includes("Boys") ? "1" : "2";
                        const matchesBlock = String(r.hostelId) === String(targetHostelId);
                        const matchesFloor = selectedStudentFloor === "All" || r.floor === selectedStudentFloor;
                        return matchesBlock && matchesFloor;
                      })
                      .map(rm => (
                        <option key={rm.id} value={rm.roomNumber}>
                          Room {rm.roomNumber} ({rm.floor} | {rm.type} | ₹{rm.rent}/mo)
                        </option>
                      ))
                    }
                  </select>
                </div>
              </div>

              <h4 style={{ margin: "10px 0 14px 0", fontSize: 14, color: "#4F46E5", fontWeight: 700, borderBottom: "1px solid #EEF2FF", paddingBottom: 6 }}>2. Parent & Medical Details</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Parent/Guardian Name</label>
                  <input
                    type="text"
                    name="parentName"
                    value={newStudent.parentName}
                    onChange={handleInputChange}
                    placeholder="e.g. Suresh Kumar"
                    style={{ padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 13.5 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Parent Contact Phone *</label>
                  <input
                    required
                    type="tel"
                    name="parentPhone"
                    value={newStudent.parentPhone}
                    onChange={handleInputChange}
                    placeholder="e.g. 9876543210 (10-digit number)"
                    maxLength={10}
                    style={{ padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 13.5 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Blood Group</label>
                  <select
                    name="bloodGroup"
                    value={newStudent.bloodGroup}
                    onChange={handleInputChange}
                    style={{ padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 13.5, background: "#fff" }}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <h4 style={{ margin: "10px 0 14px 0", fontSize: 14, color: "#4F46E5", fontWeight: 700, borderBottom: "1px solid #EEF2FF", paddingBottom: 6 }}>3. Mandatory Document Locker Uploads</h4>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                {/* Photo Upload */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Student Passport Photo</label>
                  <div style={{ position: "relative", border: "1.5px dashed #CBD5E1", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", cursor: "pointer" }}>
                    <Upload size={14} style={{ color: "#94A3B8" }} />
                    <span style={{ fontSize: 12, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
                      {newStudent.photo || "Choose photo file..."}
                    </span>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, "photo")}
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                    />
                  </div>
                </div>

                {/* Aadhaar Front */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Aadhaar Card (Front Side)</label>
                  <div style={{ position: "relative", border: "1.5px dashed #CBD5E1", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", cursor: "pointer" }}>
                    <Upload size={14} style={{ color: "#94A3B8" }} />
                    <span style={{ fontSize: 12, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
                      {newStudent.aadhaarFront || "Choose front image..."}
                    </span>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, "aadhaarFront")}
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                    />
                  </div>
                </div>

                {/* Aadhaar Back */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Aadhaar Card (Back Side)</label>
                  <div style={{ position: "relative", border: "1.5px dashed #CBD5E1", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", cursor: "pointer" }}>
                    <Upload size={14} style={{ color: "#94A3B8" }} />
                    <span style={{ fontSize: 12, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
                      {newStudent.aadhaarBack || "Choose back image..."}
                    </span>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, "aadhaarBack")}
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                    />
                  </div>
                </div>

                {/* College ID */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Institutional ID Card</label>
                  <div style={{ position: "relative", border: "1.5px dashed #CBD5E1", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", cursor: "pointer" }}>
                    <Upload size={14} style={{ color: "#94A3B8" }} />
                    <span style={{ fontSize: 12, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
                      {newStudent.collegeId || "Choose ID image..."}
                    </span>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, "collegeId")}
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                    />
                  </div>
                </div>

                {/* Signed rent agreement */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: "1/-1" }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Signed Rent Agreement / Hostel NOC</label>
                  <div style={{ position: "relative", border: "1.5px dashed #CBD5E1", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", cursor: "pointer" }}>
                    <Upload size={14} style={{ color: "#94A3B8" }} />
                    <span style={{ fontSize: 12, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {newStudent.agreement || "Choose PDF/Doc file..."}
                    </span>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, "agreement")}
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12, borderTop: "1px solid #E2E8F0", paddingTop: 20 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: "10px 18px", border: "1px solid #E2E8F0", borderRadius: 10,
                    fontSize: 13.5, cursor: "pointer", background: "none", color: "#64748B", fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 22px", background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                    color: "#fff", border: "none", borderRadius: 10, fontSize: 13.5, cursor: "pointer", fontWeight: 700
                  }}
                >
                  Register & Allot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT STUDENT MODAL --- */}
      {showEditModal && editStudent && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "#fff", borderRadius: 24, width: "100%", maxWidth: 650, maxHeight: "90vh",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column",
            overflow: "hidden"
          }}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 28px", borderBottom: "1px solid #E2E8F0" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#0F172A" }}>Edit Resident Profile</h3>
                <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748B" }}>Modify student details and update locker files.</p>
              </div>
              <button onClick={() => { setShowEditModal(false); setEditingStudent(null); setEditStudent(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Scrollable Form) */}
            <form onSubmit={handleEditStudentSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflowY: "auto", padding: 28 }}>
              
              <h4 style={{ margin: "0 0 14px 0", fontSize: 14, color: "#4F46E5", fontWeight: 700, borderBottom: "1px solid #EEF2FF", paddingBottom: 6 }}>1. Personal & Stay Details</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Full Student Name *</label>
                  <input
                    required
                    type="text"
                    name="name"
                    value={editStudent.name}
                    onChange={handleEditInputChange}
                    placeholder="e.g. Ramesh Kumar"
                    style={{ padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 13.5 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Student Roll ID *</label>
                  <input
                    required
                    disabled
                    type="text"
                    name="id"
                    value={editStudent.id}
                    style={{ padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 13.5, background: "#F1F5F9", cursor: "not-allowed", color: "#64748B" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Class</label>
                  <input
                    type="text"
                    name="class"
                    value={editStudent.class}
                    onChange={handleEditInputChange}
                    placeholder="e.g. 11th B"
                    style={{ padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 13.5 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Student Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editStudent.email}
                    onChange={handleEditInputChange}
                    placeholder="e.g. ramesh@school.com"
                    style={{ padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 13.5 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>1. Select Hostel Block *</label>
                  <select
                    name="block"
                    value={editStudent.block}
                    onChange={(e) => {
                      handleEditInputChange(e);
                      setEditStudentFloor("All");
                    }}
                    style={{ padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 13.5, background: "#fff", fontWeight: 700 }}
                  >
                    <option value="Block A (Boys)">Block A (Boys)</option>
                    <option value="Block B (Girls)">Block B (Girls)</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>2. Select Floor *</label>
                  <select
                    value={editStudentFloor}
                    onChange={(e) => setEditStudentFloor(e.target.value)}
                    style={{ padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 13.5, background: "#fff", fontWeight: 700 }}
                  >
                    <option value="All">-- Choose Floor --</option>
                    {Array.from(new Set(
                      createdRooms
                        .filter(r => {
                          const targetHostelId = editStudent.block.includes("Boys") ? "1" : "2";
                          return String(r.hostelId) === String(targetHostelId);
                        })
                        .map(r => r.floor)
                    )).map(fl => (
                      <option key={fl} value={fl}>{fl}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>3. Select Room Number *</label>
                  <select
                    required
                    name="roomNumber"
                    value={editStudent.roomNumber}
                    onChange={handleEditInputChange}
                    style={{ padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 13.5, background: "#fff", fontWeight: 700 }}
                  >
                    <option value="">-- Choose Created Room --</option>
                    {createdRooms
                      .filter(r => {
                        const targetHostelId = editStudent.block.includes("Boys") ? "1" : "2";
                        const matchesBlock = String(r.hostelId) === String(targetHostelId);
                        const matchesFloor = editStudentFloor === "All" || r.floor === editStudentFloor;
                        return matchesBlock && matchesFloor;
                      })
                      .map(rm => (
                        <option key={rm.id} value={rm.roomNumber}>
                          Room {rm.roomNumber} ({rm.floor} | {rm.type} | ₹{rm.rent}/mo)
                        </option>
                      ))
                    }
                  </select>
                </div>
              </div>

              <h4 style={{ margin: "10px 0 14px 0", fontSize: 14, color: "#4F46E5", fontWeight: 700, borderBottom: "1px solid #EEF2FF", paddingBottom: 6 }}>2. Parent & Medical Details</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Parent/Guardian Name</label>
                  <input
                    type="text"
                    name="parentName"
                    value={editStudent.parentName}
                    onChange={handleEditInputChange}
                    placeholder="e.g. Suresh Kumar"
                    style={{ padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 13.5 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Parent Contact Phone *</label>
                  <input
                    required
                    type="tel"
                    name="parentPhone"
                    value={editStudent.parentPhone}
                    onChange={handleEditInputChange}
                    placeholder="e.g. 9876543210 (10-digit number)"
                    maxLength={10}
                    style={{ padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 13.5 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Blood Group</label>
                  <select
                    name="bloodGroup"
                    value={editStudent.bloodGroup}
                    onChange={handleEditInputChange}
                    style={{ padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 13.5, background: "#fff" }}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <h4 style={{ margin: "10px 0 14px 0", fontSize: 14, color: "#4F46E5", fontWeight: 700, borderBottom: "1px solid #EEF2FF", paddingBottom: 6 }}>3. Locker Documents (PDF/Images)</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Student Photo</label>
                  <div style={{ position: "relative", border: "1.5px dashed #CBD5E1", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", cursor: "pointer" }}>
                    <Upload size={14} style={{ color: "#94A3B8" }} />
                    <span style={{ fontSize: 12, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {editStudent.photo || "Upload new photo..."}
                    </span>
                    <input
                      type="file"
                      onChange={(e) => handleEditFileChange(e, "photo")}
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Aadhaar Card (Front)</label>
                  <div style={{ position: "relative", border: "1.5px dashed #CBD5E1", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", cursor: "pointer" }}>
                    <Upload size={14} style={{ color: "#94A3B8" }} />
                    <span style={{ fontSize: 12, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {editStudent.aadhaarFront || "Upload Aadhaar Front..."}
                    </span>
                    <input
                      type="file"
                      onChange={(e) => handleEditFileChange(e, "aadhaarFront")}
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Aadhaar Card (Back)</label>
                  <div style={{ position: "relative", border: "1.5px dashed #CBD5E1", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", cursor: "pointer" }}>
                    <Upload size={14} style={{ color: "#94A3B8" }} />
                    <span style={{ fontSize: 12, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {editStudent.aadhaarBack || "Upload Aadhaar Back..."}
                    </span>
                    <input
                      type="file"
                      onChange={(e) => handleEditFileChange(e, "aadhaarBack")}
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Institutional Student ID Card</label>
                  <div style={{ position: "relative", border: "1.5px dashed #CBD5E1", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", cursor: "pointer" }}>
                    <Upload size={14} style={{ color: "#94A3B8" }} />
                    <span style={{ fontSize: 12, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {editStudent.collegeId || "Upload Student ID..."}
                    </span>
                    <input
                      type="file"
                      onChange={(e) => handleEditFileChange(e, "collegeId")}
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: "1/-1" }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Signed Rent Agreement / Hostel NOC</label>
                  <div style={{ position: "relative", border: "1.5px dashed #CBD5E1", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", cursor: "pointer" }}>
                    <Upload size={14} style={{ color: "#94A3B8" }} />
                    <span style={{ fontSize: 12, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {editStudent.agreement || "Choose PDF/Doc file..."}
                    </span>
                    <input
                      type="file"
                      onChange={(e) => handleEditFileChange(e, "agreement")}
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12, borderTop: "1px solid #E2E8F0", paddingTop: 20 }}>
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingStudent(null); setEditStudent(null); }}
                  style={{
                    padding: "10px 18px", border: "1px solid #E2E8F0", borderRadius: 10,
                    fontSize: 13.5, cursor: "pointer", background: "none", color: "#64748B", fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 22px", background: "linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)",
                    color: "#fff", border: "none", borderRadius: 10, fontSize: 13.5, cursor: "pointer", fontWeight: 700
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DIGITAL DOCUMENT LOCKER MODAL --- */}
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
              background: "#fff", padding: 32, borderRadius: 20, width: "100%", maxWidth: 480,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={22} style={{ color: "#10B981" }} />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#0F172A" }}>Digital Document Locker</h3>
              </div>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedStudentDocs(null); }} 
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}
              >
                <X size={18} />
              </button>
            </div>
            
            <p style={{ fontSize: 13.5, color: "#64748B", marginBottom: 20 }}>
              Resident: <strong style={{ color: "#0F172A" }}>{selectedStudentDocs.name}</strong> (ID: {selectedStudentDocs.id})
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #F1F5F9" }}>
                <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>Student Photo:</span>
                <span 
                  onClick={() => handleDownloadDoc(selectedStudentDocs.documents?.photo, "Student Photo", selectedStudentDocs)}
                  style={{ fontSize: 12.5, fontWeight: 700, color: "#4F46E5", textDecoration: "underline", cursor: "pointer" }}
                >
                  {selectedStudentDocs.documents?.photo || "Not Uploaded"}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #F1F5F9" }}>
                <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>Aadhaar Card (Front):</span>
                <span 
                  onClick={() => handleDownloadDoc(selectedStudentDocs.documents?.aadhaarFront, "Aadhaar Card (Front)", selectedStudentDocs)}
                  style={{ fontSize: 12.5, fontWeight: 700, color: "#4F46E5", textDecoration: "underline", cursor: "pointer" }}
                >
                  {selectedStudentDocs.documents?.aadhaarFront || "Not Uploaded"}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #F1F5F9" }}>
                <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>Aadhaar Card (Back):</span>
                <span 
                  onClick={() => handleDownloadDoc(selectedStudentDocs.documents?.aadhaarBack, "Aadhaar Card (Back)", selectedStudentDocs)}
                  style={{ fontSize: 12.5, fontWeight: 700, color: "#4F46E5", textDecoration: "underline", cursor: "pointer" }}
                >
                  {selectedStudentDocs.documents?.aadhaarBack || "Not Uploaded"}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #F1F5F9" }}>
                <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>Institutional ID Card:</span>
                <span 
                  onClick={() => handleDownloadDoc(selectedStudentDocs.documents?.collegeId, "Institutional ID Card", selectedStudentDocs)}
                  style={{ fontSize: 12.5, fontWeight: 700, color: "#4F46E5", textDecoration: "underline", cursor: "pointer" }}
                >
                  {selectedStudentDocs.documents?.collegeId || "Not Uploaded"}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #F1F5F9" }}>
                <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>Signed Rent Agreement:</span>
                <span 
                  onClick={() => handleDownloadDoc(selectedStudentDocs.documents?.agreement, "Signed Rent Agreement", selectedStudentDocs)}
                  style={{ fontSize: 12.5, fontWeight: 700, color: "#4F46E5", textDecoration: "underline", cursor: "pointer" }}
                >
                  {selectedStudentDocs.documents?.agreement || "Not Uploaded"}
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

    </div>
  );
}

