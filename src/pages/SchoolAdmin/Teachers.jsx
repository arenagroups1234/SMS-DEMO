import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usersApi, classesApi, subjectsApi } from "../../services/api";
import { toast } from "sonner";
import { Plus } from "lucide-react";

/* ─────────────────────────────────────────────────────────
   School Portal — Teachers
   Matches wireframe structure:
   - Top card: Title + Add button + 5 quick action boxes
   - Bottom card: 3 search inputs + Data Table
   ───────────────────────────────────────────────────────── */

const DUMMY_TEACHERS = [
  { id: "1", name: "Priya Verma", class: "10th A", students: 45, subject: "Physics", status: "Active", today: "Present" },
  { id: "2", name: "Ananya Sen", class: "9th B", students: 38, subject: "Chemistry", status: "Active", today: "Present" },
];

function QuickBox({ icon, label, bg = "#F3F4F6", iconBg = "#E5E7EB" }) {
  return (
    <div style={{
      width: 110,
      height: 100,
      background: bg,
      border: "1px solid #E5E7EB",
      borderRadius: 10,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      cursor: "pointer",
      transition: "transform 0.15s, box-shadow 0.15s",
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{
        width: 48, height: 48,
        background: iconBg,
        borderRadius: 8,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 24
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: "#1F2937", textAlign: "center", lineHeight: 1.1 }}>
        {label}
      </span>
    </div>
  );
}

function ActionBtn({ icon, tip, color = "#2563EB", onClick }) {
  return (
    <button
      title={tip}
      onClick={onClick}
      style={{
        width: 28, height: 28,
        border: "none", borderRadius: 6,
        background: "#F3F4F6", color: color,
        fontSize: 13, cursor: "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#E5E7EB")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#F3F4F6")}
    >
      {icon}
    </button>
  );
}

const VALID_QUALIFICATIONS = [
  "B.Ed",
  "M.Ed",
  "D.El.Ed",
  "NTT",
  "B.Sc",
  "M.Sc",
  "B.A",
  "M.A",
  "B.Com",
  "M.Com",
  "B.Tech",
  "M.Tech",
  "BCA",
  "MCA",
  "Ph.D",
  "CTET",
  "NET"
];

export default function PortalTeachers() {
  const navigate = useNavigate();
  const { schoolId } = useParams();

  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);

  const getIdPlaceholder = (type) => {
    switch (type) {
      case "Aadhaar Card":
        return "12-digit Aadhaar (e.g. 123456789012)";
      case "PAN Card":
        return "10-char PAN (e.g. ABCDE1234F)";
      case "Passport":
        return "8-char Passport (e.g. A1234567)";
      case "Voter ID":
        return "10-char Voter ID (e.g. ABC1234567)";
      case "Driving License":
        return "15-char Driving License (e.g. DL1420110012345)";
      default:
        return "ID document number";
    }
  };
  const [searchName, setSearchName] = useState("");
  const [searchId, setSearchId] = useState("");
  const [searchMobile, setSearchMobile] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterClass, setFilterClass] = useState("All");
  const [filterSubject, setFilterSubject] = useState("All");
  const [filterQual, setFilterQual] = useState("All");
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingTeacher, setViewingTeacher] = useState(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formStatus, setFormStatus] = useState("Active");
  const [formPassword, setFormPassword] = useState("");
  
  // Custom multi-select & additional info states
  const [formClasses, setFormClasses] = useState([]);
  const [formSubjects, setFormSubjects] = useState([]);
  const [formAddress, setFormAddress] = useState("");
  
  const [formIdProof1Type, setFormIdProof1Type] = useState("Aadhaar Card");
  const [formIdProof1Number, setFormIdProof1Number] = useState("");
  const [formIdProof1File, setFormIdProof1File] = useState("");
  
  const [formIdProof2Type, setFormIdProof2Type] = useState("PAN Card");
  const [formIdProof2Number, setFormIdProof2Number] = useState("");
  const [formIdProof2File, setFormIdProof2File] = useState("");
  const [formIdProof1FileName, setFormIdProof1FileName] = useState("");
  const [formIdProof2FileName, setFormIdProof2FileName] = useState("");

  const [formState, setFormState] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formZipCode, setFormZipCode] = useState("");
  const [formQualification, setFormQualification] = useState("");
  const [formQualificationProofFile, setFormQualificationProofFile] = useState("");
  const [formQualifications, setFormQualifications] = useState([]);

  const handleQualificationProofUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormQualificationProofFile(reader.result);
        toast.success("Qualification proof file uploaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdProof1Upload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormIdProof1File(reader.result);
        setFormIdProof1FileName(file.name);
        toast.success("Primary ID proof file loaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdProof2Upload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormIdProof2File(reader.result);
        setFormIdProof2FileName(file.name);
        toast.success("Secondary ID proof file loaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  const viewFileInNewTab = (fileData) => {
    if (!fileData) return;
    if (fileData.startsWith("data:")) {
      try {
        const parts = fileData.split(";base64,");
        const contentType = parts[0].split(":")[1];
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const blob = new Blob([uInt8Array], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
      } catch (e) {
        console.error("Failed to parse base64 file data:", e);
        const newTab = window.open();
        newTab.document.write(`<iframe src="${fileData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
      }
    } else {
      window.open(fileData, "_blank");
    }
  };

  const handleAddQualification = () => {
    if (!formQualification.trim()) {
      toast.error("Please select a qualification name!");
      return;
    }
    if (!formQualificationProofFile) {
      toast.error("Proof Certificate (PDF / Image) is required for qualification!");
      return;
    }
    const newQual = {
      id: Date.now(),
      name: formQualification.trim(),
      proof: formQualificationProofFile
    };
    setFormQualifications([...formQualifications, newQual]);
    setFormQualification("");
    setFormQualificationProofFile("");
    toast.success("Qualification added to list!");
  };

  const handleRemoveQualification = (id) => {
    setFormQualifications(formQualifications.filter(q => q.id !== id));
  };

  const handleIdProof1NumberChange = (val, type) => {
    let sanitized = val;
    if (type === "Aadhaar Card") {
      sanitized = val.replace(/\D/g, '').slice(0, 12);
    } else if (type === "Passport") {
      sanitized = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
    } else if (type === "PAN Card") {
      sanitized = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
    } else if (type === "Voter ID") {
      sanitized = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
    } else if (type === "Driving License") {
      sanitized = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 15);
    } else {
      sanitized = val.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
    }
    setFormIdProof1Number(sanitized);
  };

  const handleIdProof2NumberChange = (val, type) => {
    let sanitized = val;
    if (type === "Aadhaar Card") {
      sanitized = val.replace(/\D/g, '').slice(0, 12);
    } else if (type === "Passport") {
      sanitized = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
    } else if (type === "PAN Card") {
      sanitized = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
    } else if (type === "Voter ID") {
      sanitized = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
    } else if (type === "Driving License") {
      sanitized = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 15);
    } else {
      sanitized = val.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
    }
    setFormIdProof2Number(sanitized);
  };

  const loadTeachersList = async () => {
    setLoading(true);
    try {
      // Load real classes and subjects registered in DB for this school
      try {
        const cRes = await classesApi.getAll({ schoolId, limit: 100 });
        const sRes = await subjectsApi.getAll({ schoolId, limit: 100 });
        const dbClasses = (cRes.data || []).map(c => c.name).filter(Boolean);
        const dbSubjects = (sRes.data || []).map(s => s.name).filter(Boolean);
        setAvailableClasses(Array.from(new Set(dbClasses)));
        setAvailableSubjects(Array.from(new Set(dbSubjects)));
      } catch (cErr) {
        console.warn("Could not load dynamic classes/subjects for school:", cErr);
      }

      // Load all students to calculate actual class sizes
      const sRes = await usersApi.getAll({ role: "student", schoolId: schoolId, limit: 100 });
      const students = sRes.data || [];
      const classSizes = {};
      students.forEach(s => {
        const cName = s.class || "9th A";
        classSizes[cName] = (classSizes[cName] || 0) + 1;
      });

      // Load teachers
      const res = await usersApi.getAll({ role: "teacher", schoolId: schoolId, limit: 100 });
      const mappings = JSON.parse(localStorage.getItem("teacher_class_mappings") || "{}");

      const liveTeachers = (res.data || []).map(u => {
        const map = mappings[u.id] || {};
        
        // Dynamic fallback mapping
        const address = u.address !== undefined && u.address !== null ? u.address : (map.address || "123 Elm St, Cambridge");
        const state = u.state !== undefined && u.state !== null ? u.state : (map.state || "Rajasthan");
        const city = u.city !== undefined && u.city !== null ? u.city : (map.city || "Jaipur");
        const zipCode = u.zipCode !== undefined && u.zipCode !== null ? u.zipCode : (map.zipCode || "302001");
        
        const idProof1Type = u.idProof1Type !== undefined && u.idProof1Type !== null ? u.idProof1Type : (map.idProof1Type || "Aadhaar Card");
        const idProof1Number = u.idProof1Number !== undefined && u.idProof1Number !== null ? u.idProof1Number : (map.idProof1Number || "1234-5678-9012");
        const idProof1File = u.idProof1File !== undefined && u.idProof1File !== null ? u.idProof1File : (map.idProof1File || "aadhaar_mock.pdf");
        
        const idProof2Type = u.idProof2Type !== undefined && u.idProof2Type !== null ? u.idProof2Type : (map.idProof2Type || "PAN Card");
        const idProof2Number = u.idProof2Number !== undefined && u.idProof2Number !== null ? u.idProof2Number : (map.idProof2Number || "ABCDE1234F");
        const idProof2File = u.idProof2File !== undefined && u.idProof2File !== null ? u.idProof2File : (map.idProof2File || "pan_mock.pdf");
        
        const qualification = u.qualification !== undefined && u.qualification !== null ? u.qualification : (map.qualification || "M.Sc, B.Ed");
        const qualificationProofFile = map.qualificationProofFile || ""; // proof image URL from mapping if any
        
        let classesArr = [];
        if (u.classes) {
          classesArr = u.classes.split(", ").filter(Boolean);
        } else if (map.classes) {
          classesArr = map.classes;
        } else {
          classesArr = ["10th A"];
        }

        let subjectsArr = [];
        if (u.subjects) {
          subjectsArr = u.subjects.split(", ").filter(Boolean);
        } else if (map.subjects) {
          subjectsArr = map.subjects;
        } else {
          subjectsArr = ["Science"];
        }

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || "",
          class: classesArr.join(", "),
          classes: classesArr,
          students: classSizes[classesArr[0]] !== undefined ? classSizes[classesArr[0]] : 45,
          subject: subjectsArr.join(", "),
          subjects: subjectsArr,
          address: address,
          idProof1Type: idProof1Type,
          idProof1Number: idProof1Number,
          idProof1File: idProof1File,
          idProof2Type: idProof2Type,
          idProof2Number: idProof2Number,
          idProof2File: idProof2File,
          qualification: qualification,
          qualificationProofFile: qualificationProofFile,
          qualifications: map.qualifications || (qualification ? [{ id: 1, name: qualification, proof: qualificationProofFile }] : [{ id: 1, name: "M.Sc, B.Ed", proof: qualificationProofFile }]),
          state: state,
          city: city,
          zipCode: zipCode,
          status: u.isActive ? "Active" : "Inactive",
          today: "Present"
        };
      });
      liveTeachers.reverse();
      setTeachers(liveTeachers);
    } catch (err) {
      console.warn("Could not load teachers:", err.message);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDocField = (fileData, fallbackName = "Document") => {
    if (!fileData) return "Not Uploaded";
    if (typeof fileData === "string") {
      if (fileData.startsWith("http://") || fileData.startsWith("https://")) {
        return fileData;
      }
      if (fileData.startsWith("data:")) {
        return `Uploaded (${fallbackName})`;
      }
      if (fileData.length > 300) {
        return `Uploaded (${fallbackName})`;
      }
      return fileData;
    }
    return "Uploaded";
  };

  const handleExportCSV = () => {
    const listToExport = (filteredTeachers && filteredTeachers.length > 0) ? filteredTeachers : teachers;
    if (listToExport.length === 0) {
      toast.error("No teacher records available to export.");
      return;
    }
    const headers = [
      "S.No.",
      "Teacher ID",
      "School ID",
      "Full Name",
      "Email",
      "Phone",
      "Assigned Subjects",
      "Assigned Classes",
      "Status",
      "Qualifications",
      "Qualification Proof Document",
      "Primary ID Proof Type",
      "Primary ID Proof Number",
      "Primary ID Proof Document",
      "Secondary ID Proof Type",
      "Secondary ID Proof Number",
      "Secondary ID Proof Document",
      "Permanent Address",
      "City",
      "State",
      "Zip Code"
    ];

    const rows = listToExport.map((t, idx) => {
      const qualsStr = (t.qualifications && t.qualifications.length > 0)
        ? t.qualifications.map(q => q.name).join("; ")
        : (t.qualification || "");

      const qualProof = (t.qualifications && t.qualifications.length > 0)
        ? t.qualifications.map(q => formatDocField(q.proof || t.qualificationProofFile, q.name || "Proof")).join(" | ")
        : formatDocField(t.qualificationProofFile, "Qualification Certificate");

      return [
        idx + 1,
        t.id || "",
        `SCH-${(t.id || "").slice(0, 5).toUpperCase()}`,
        t.name || "",
        t.email || "",
        t.phone || "",
        t.subjects?.join("; ") || t.subject || "",
        t.classes?.join("; ") || t.class || "",
        t.status || "Active",
        qualsStr,
        qualProof,
        t.idProof1Type || "",
        t.idProof1Number || "",
        formatDocField(t.idProof1File, "Primary ID"),
        t.idProof2Type || "",
        t.idProof2Number || "",
        formatDocField(t.idProof2File, "Secondary ID"),
        t.address || "",
        t.city || "",
        t.state || "",
        t.zipCode || ""
      ];
    });
    
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.map(val => `"${val ? val.toString().replace(/"/g, '""') : ''}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Teachers_Directory_Complete_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Complete teacher directory exported successfully!");
  };

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormStatus("Active");
    setFormPassword("");
    setFormClasses([]);
    setFormSubjects([]);
    setFormAddress("");
    setFormState("");
    setFormCity("");
    setFormZipCode("");
    setFormQualifications([]);
    setFormIdProof1Type("Aadhaar Card");
    setFormIdProof1Number("");
    setFormIdProof1File("");
    setFormIdProof1FileName("");
    setFormIdProof2Type("PAN Card");
    setFormIdProof2Number("");
    setFormIdProof2File("");
    setFormIdProof2FileName("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormName(teacher.name);
    setFormEmail(teacher.email || "");
    setFormPhone(teacher.phone || "");
    setFormStatus(teacher.status);
    setFormPassword("");
    setFormClasses(teacher.classes || [teacher.class || "10th A"]);
    setFormSubjects(teacher.subjects || [teacher.subject || "Science"]);
    setFormAddress(teacher.address || "");
    setFormState(teacher.state || "");
    setFormCity(teacher.city || "");
    setFormZipCode(teacher.zipCode || "");
    setFormQualifications(teacher.qualifications || []);
    setFormIdProof1Type(teacher.idProof1Type || "Aadhaar Card");
    setFormIdProof1Number(teacher.idProof1Number || "");
    setFormIdProof1File(teacher.idProof1File || "");
    setFormIdProof1FileName(teacher.idProof1File ? (teacher.idProof1File.startsWith('data:') ? 'Uploaded Document' : teacher.idProof1File) : "");
    setFormIdProof2Type(teacher.idProof2Type || "PAN Card");
    setFormIdProof2Number(teacher.idProof2Number || "");
    setFormIdProof2File(teacher.idProof2File || "");
    setFormIdProof2FileName(teacher.idProof2File ? (teacher.idProof2File.startsWith('data:') ? 'Uploaded Document' : teacher.idProof2File) : "");
    
    setIsModalOpen(true);
  };

  const handleOpenView = (teacher) => {
    setViewingTeacher(teacher);
    setIsViewModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Name validation
    if (!formName.trim()) {
      toast.error("Full Name is required!");
      return;
    }
    if (formName.length > 30) {
      toast.error("Full Name must be 30 characters or less!");
      return;
    }
    if (/[^a-zA-Z\s]/.test(formName)) {
      toast.error("Full Name can only contain letters and spaces!");
      return;
    }

    // Email validation
    if (!formEmail.trim()) {
      toast.error("Email is required!");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formEmail)) {
      toast.error("Please enter a valid email address!");
      return;
    }

    // Phone validation
    if (!formPhone || formPhone.trim().length !== 10 || /\D/.test(formPhone)) {
      toast.error("Mobile Number must be exactly 10 digits!");
      return;
    }

    // Password validation (only on register)
    if (!editingTeacher) {
      if (!formPassword || formPassword.length < 6 || formPassword.length > 15) {
        toast.error("Access Password must be between 6 and 15 characters long!");
        return;
      }
    }

    // Address validation
    if (!formAddress.trim()) {
      toast.error("Residential Address is required!");
      return;
    }
    if (formAddress.length > 100) {
      toast.error("Residential Address must be 100 characters or less!");
      return;
    }

    if (!formState.trim()) {
      toast.error("State is required!");
      return;
    }
    if (!formCity.trim()) {
      toast.error("City is required!");
      return;
    }
    if (!formZipCode.trim()) {
      toast.error("Zip Code is required!");
      return;
    }
    if (formZipCode.trim().length !== 6 || /\D/.test(formZipCode)) {
      toast.error("Zip Code must be exactly 6 digits!");
      return;
    }

    if (formQualifications.length === 0) {
      if (formQualification.trim()) {
        if (!formQualificationProofFile) {
          toast.error("Proof Certificate (PDF / Image) is required for qualification!");
          return;
        }
        const autoQual = {
          id: Date.now(),
          name: formQualification.trim(),
          proof: formQualificationProofFile
        };
        formQualifications.push(autoQual);
      } else {
        toast.error("Please add at least one academic qualification with proof certificate!");
        return;
      }
    }

    const missingProofQual = formQualifications.find(q => !q.proof);
    if (missingProofQual) {
      toast.error(`Proof Certificate (PDF / Image) is required for qualification: ${missingProofQual.name}!`);
      return;
    }

    // Classes & Subjects select validation
    if (formClasses.length === 0) {
      toast.error("Please select at least one Assigned Class!");
      return;
    }
    if (formSubjects.length === 0) {
      toast.error("Please select at least one Assigned Subject!");
      return;
    }

    // ID proof number helper checks
    const validateIdProof = (type, num, label) => {
      if (!num.trim()) {
        toast.error(`${label} number is required!`);
        return false;
      }
      if (type === "Aadhaar Card") {
        if (num.length !== 12 || /\D/.test(num)) {
          toast.error(`${label} (Aadhaar Card) must be exactly 12 digits!`);
          return false;
        }
      } else if (type === "PAN Card") {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
        if (!panRegex.test(num.toUpperCase())) {
          toast.error(`${label} (PAN Card) must be in standard Indian format (e.g. ABCDE1234F)!`);
          return false;
        }
      } else if (type === "Passport") {
        const passportRegex = /^[A-Z][0-9]{7}$/;
        if (!passportRegex.test(num.toUpperCase())) {
          toast.error(`${label} (Passport) must start with 1 capital letter followed by 7 digits (e.g. A1234567)!`);
          return false;
        }
      } else if (type === "Voter ID") {
        const voterRegex = /^[A-Z]{3}[0-9]{7}$/;
        if (!voterRegex.test(num.toUpperCase())) {
          toast.error(`${label} (Voter ID) must be in standard format (e.g. ABC1234567)!`);
          return false;
        }
      } else if (type === "Driving License") {
        const dlRegex = /^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$/;
        if (!dlRegex.test(num.toUpperCase())) {
          toast.error(`${label} (Driving License) must be in standard Indian format (e.g. DL1420110012345)!`);
          return false;
        }
      } else {
        if (num.length < 8 || num.length > 20) {
          toast.error(`${label} number must be between 8 and 20 characters!`);
          return false;
        }
      }
      return true;
    };

    if (formIdProof1Type && formIdProof2Type && formIdProof1Type === formIdProof2Type) {
      toast.error("Primary ID Proof and Secondary ID Proof cannot be the same!");
      return;
    }

    if (!validateIdProof(formIdProof1Type, formIdProof1Number, "Primary ID")) return;
    if (formIdProof2Number && formIdProof2Number.trim()) {
      if (!validateIdProof(formIdProof2Type, formIdProof2Number, "Secondary ID")) return;
    }

    try {
      let savedTeacherId = "";
      if (editingTeacher) {
        const payload = {
          name: formName,
          email: formEmail,
          phone: formPhone || null,
          role: "teacher",
          schoolId: schoolId,
          isActive: formStatus === "Active",
          address: formAddress,
          state: formState,
          city: formCity,
          zipCode: formZipCode,
          idProof1Type: formIdProof1Type,
          idProof1Number: formIdProof1Number,
          idProof1File: formIdProof1File,
          idProof2Type: formIdProof2Type,
          idProof2Number: formIdProof2Number,
          idProof2File: formIdProof2File,
          qualification: formQualifications[0]?.name || "",
          classes: formClasses.join(", "),
          subjects: formSubjects.join(", ")
        };
        await usersApi.update(editingTeacher.id, payload);
        savedTeacherId = editingTeacher.id;
        toast.success("Teacher updated successfully!");
      } else {
        const payload = {
          name: formName,
          email: formEmail,
          phone: formPhone || null,
          password: formPassword || "TeacherPass123!",
          role: "teacher",
          schoolId: schoolId,
          address: formAddress,
          state: formState,
          city: formCity,
          zipCode: formZipCode,
          idProof1Type: formIdProof1Type,
          idProof1Number: formIdProof1Number,
          idProof1File: formIdProof1File,
          idProof2Type: formIdProof2Type,
          idProof2Number: formIdProof2Number,
          idProof2File: formIdProof2File,
          qualification: formQualifications[0]?.name || "",
          classes: formClasses.join(", "),
          subjects: formSubjects.join(", ")
        };
        const resUser = await usersApi.create(payload);
        savedTeacherId = resUser.data?.id || "";
        toast.success("Teacher added successfully!");
      }

      // Save class & subject metadata mapping in localStorage safely
      if (savedTeacherId) {
        try {
          const mappings = JSON.parse(localStorage.getItem("teacher_class_mappings") || "{}");
          const cleanQuals = (formQualifications || []).map(q => ({
            ...q,
            proof: (q.proof && q.proof.length > 500) ? "uploaded_proof.pdf" : (q.proof || "")
          }));
          
          mappings[savedTeacherId] = {
            schoolId: schoolId,
            classes: formClasses,
            subjects: formSubjects,
            address: formAddress,
            state: formState,
            city: formCity,
            zipCode: formZipCode,
            idProof1Type: formIdProof1Type,
            idProof1Number: formIdProof1Number,
            idProof1File: (formIdProof1File && formIdProof1File.length > 500) ? (formIdProof1FileName || "uploaded_id1.pdf") : formIdProof1File,
            idProof2Type: formIdProof2Type,
            idProof2Number: formIdProof2Number,
            idProof2File: (formIdProof2File && formIdProof2File.length > 500) ? (formIdProof2FileName || "uploaded_id2.pdf") : formIdProof2File,
            qualification: formQualifications[0]?.name || "",
            qualificationProofFile: (formQualifications[0]?.proof && formQualifications[0].proof.length > 500) ? "uploaded_proof.pdf" : (formQualifications[0]?.proof || ""),
            qualifications: cleanQuals
          };
          
          // Prune any existing large base64 values across all items in mappings
          for (const tid in mappings) {
            const m = mappings[tid];
            if (m && typeof m === "object") {
              if (typeof m.idProof1File === "string" && m.idProof1File.length > 500) m.idProof1File = "uploaded_id1.pdf";
              if (typeof m.idProof2File === "string" && m.idProof2File.length > 500) m.idProof2File = "uploaded_id2.pdf";
              if (typeof m.qualificationProofFile === "string" && m.qualificationProofFile.length > 500) m.qualificationProofFile = "uploaded_proof.pdf";
              if (Array.isArray(m.qualifications)) {
                m.qualifications.forEach(q => {
                  if (q && typeof q.proof === "string" && q.proof.length > 500) q.proof = "uploaded_proof.pdf";
                });
              }
            }
          }

          localStorage.setItem("teacher_class_mappings", JSON.stringify(mappings));
        } catch (storageErr) {
          console.warn("Could not update local teacher_class_mappings:", storageErr);
        }
      }

      setIsModalOpen(false);
      loadTeachersList();
    } catch (err) {
      toast.error(err.message || "Failed to save teacher");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this teacher?")) return;
    try {
      await usersApi.delete(id);
      // Remove mapping
      const mappings = JSON.parse(localStorage.getItem("teacher_class_mappings") || "{}");
      delete mappings[id];
      localStorage.setItem("teacher_class_mappings", JSON.stringify(mappings));

      toast.success("Teacher deleted successfully!");
      loadTeachersList();
    } catch (err) {
      toast.error(err.message || "Failed to delete teacher");
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
        console.warn("Could not load dynamic classes/subjects:", err);
      }
    };

    loadTeachersList();
    fetchDropdowns();
  }, [schoolId]);


  const inputSx = {
    padding: "10px 14px",
    border: "2px solid #E5E7EB",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    color: "#4B5563",
    outline: "none",
    width: 200,
    background: "#FAFAFA",
  };

  const filteredTeachers = teachers.filter(item => {
    const formattedId = `SCH-${item.id.slice(0, 5).toUpperCase()}`;
    const matchesSearch = item.name.toLowerCase().includes(searchName.toLowerCase()) ||
                         formattedId.toLowerCase().includes(searchName.toLowerCase());
    const matchesStatus = filterStatus === "All" || (item.status || "Active") === filterStatus;
    const matchesClass = filterClass === "All" || (item.classes || []).includes(filterClass);
    const matchesSubject = filterSubject === "All" || (item.subjects || []).includes(filterSubject);
    const matchesQual = filterQual === "All" || (() => {
      const quals = item.qualifications || [];
      if (quals.length > 0) {
        return quals.some(q => q.name && q.name.toLowerCase().includes(filterQual.toLowerCase()));
      }
      return (item.qualification || "").toLowerCase().includes(filterQual.toLowerCase());
    })();
    return matchesSearch && matchesStatus && matchesClass && matchesSubject && matchesQual;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* Header toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1F2333" }}>All Teachers List</h2>
          <p style={{ fontSize: 13, color: "#6B7080", marginTop: 4 }}>Configure faculty directories, assigned subjects and credentials.</p>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {/* Export File Button */}
          <button
            onClick={handleExportCSV}
            style={{
              padding: "10px 18px",
              background: "#E0F2FE",
              color: "#0284C7",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#0284C7";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#E0F2FE";
              e.currentTarget.style.color = "#0284C7";
            }}
          >
            📥 Export File
          </button>

          {/* Create Teacher Button */}
          <button
            onClick={handleOpenAdd}
            style={{
              padding: "10px 18px",
              background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 4px 14px rgba(2, 132, 199, 0.2)",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 18px rgba(2, 132, 199, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(2, 132, 199, 0.2)";
            }}
          >
            <Plus size={15} /> Create Teacher
          </button>
        </div>
      </div>

      {/* Search & Filter Bar — single row */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 20, background: "#fff", padding: "12px 20px", borderRadius: 16, border: "1px solid #E2E8F0" }}>

        {/* Search Input */}
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180, maxWidth: 320 }}>
          <input
            type="text"
            placeholder="🔍 Search teachers by name or School ID..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 14px 9px 14px",
              border: "1.5px solid #CBD5E1",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 500,
              color: "#334155",
              outline: "none",
              background: "#F8FAFC",
              transition: "all 0.2s",
              boxSizing: "border-box"
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#0284C7";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(2, 132, 199, 0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#CBD5E1";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: "9px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#475569", background: "#fff", outline: "none" }}
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        {/* Class Filter */}
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          style={{ padding: "9px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#475569", background: "#fff", outline: "none" }}
        >
          <option value="All">All Classes</option>
          {availableClasses.map(cls => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>

        {/* Subject Filter */}
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          style={{ padding: "9px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#475569", background: "#fff", outline: "none" }}
        >
          <option value="All">All Subjects</option>
          {availableSubjects.map(sub => (
            <option key={sub} value={sub}>{sub}</option>
          ))}
        </select>

        {/* Qualification Filter */}
        <select
          value={filterQual}
          onChange={(e) => setFilterQual(e.target.value)}
          style={{ padding: "9px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#475569", background: "#fff", outline: "none" }}
        >
          <option value="All">All Qualifications</option>
          <option value="M.Sc">M.Sc</option>
          <option value="B.Ed">B.Ed</option>
          <option value="B.Tech">B.Tech</option>
          <option value="Ph.D">Ph.D</option>
          <option value="M.A">M.A</option>
          <option value="B.A">B.A</option>
          <option value="M.Tech">M.Tech</option>
        </select>

        {/* Clear Filters */}
        <button
          type="button"
          onClick={() => {
            setSearchName("");
            setFilterStatus("All");
            setFilterClass("All");
            setFilterSubject("All");
            setFilterQual("All");
          }}
          style={{
            padding: "9px 14px",
            background: "#F1F5F9",
            color: "#475569",
            border: "none",
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap"
          }}
        >
          Clear Filters
        </button>
      </div>

      {/* Main Table Card */}
      <div style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 18,
        boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.04)",
        overflow: "hidden"
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr style={{ background: "#F0F9FF", borderBottom: "1px solid #BAE6FD" }}>
                <th style={{ padding: "18px 24px", textAlign: "left", fontSize: 12.5, fontWeight: 800, color: "#64748B", width: 80 }}>S.No.</th>
                <th style={{ padding: "18px 24px", textAlign: "left", fontSize: 12.5, fontWeight: 800, color: "#64748B" }}>Teacher Name</th>
                <th style={{ padding: "18px 24px", textAlign: "left", fontSize: 12.5, fontWeight: 800, color: "#64748B" }}>School ID</th>
                <th style={{ padding: "18px 24px", textAlign: "left", fontSize: 12.5, fontWeight: 800, color: "#64748B" }}>Subject(s)</th>
                <th style={{ padding: "18px 24px", textAlign: "left", fontSize: 12.5, fontWeight: 800, color: "#64748B" }}>Class(es)</th>
                <th style={{ padding: "18px 24px", textAlign: "left", fontSize: 12.5, fontWeight: 800, color: "#64748B" }}>Phone Number</th>
                <th style={{ padding: "18px 24px", textAlign: "left", fontSize: 12.5, fontWeight: 800, color: "#64748B" }}>Address</th>

                <th style={{ padding: "18px 24px", textAlign: "right", fontSize: 12.5, fontWeight: 800, color: "#64748B" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: "40px 24px", textAlign: "center", fontSize: 14, color: "#64748B", fontWeight: 700 }}>
                    No teachers found
                  </td>
                </tr>
              )}
              {filteredTeachers.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "16px 24px", fontSize: 13, fontWeight: 700, color: "#4B5563" }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%", background: "#EFF6FF", color: "#2563EB",
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800
                        }}>
                          {item.name.charAt(0)}
                        </div>
                        <div>
                          <strong style={{ fontSize: 13.5, color: "#1E293B", display: "inline-flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                            <span>{item.name}</span>
                            {item.qualifications && item.qualifications.length > 0 ? (
                              item.qualifications.map((q, qIdx) => (
                                <span key={q.id || qIdx} style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#EFF6FF", color: "#2563EB", padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 800 }}>
                                  {q.name}
                                  {(q.proof || (qIdx === 0 && item.qualificationProofFile)) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        viewFileInNewTab(q.proof || item.qualificationProofFile);
                                      }}
                                      title="View Certificate"
                                      style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 11, padding: 0 }}
                                    >
                                      📄
                                    </button>
                                  )}
                                </span>
                              ))
                            ) : item.qualification ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#EFF6FF", color: "#2563EB", padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 800 }}>
                                {item.qualification}
                                {item.qualificationProofFile && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      viewFileInNewTab(item.qualificationProofFile);
                                    }}
                                    title="View Certificate"
                                    style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 11, padding: 0 }}
                                  >
                                    📄
                                  </button>
                                )}
                              </span>
                            ) : null}
                          </strong>
                          <span style={{ fontSize: 11.5, color: "#94A3B8", display: "block" }}>{item.email || `${item.name.toLowerCase().replace(" ", "")}@school.com`}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: 13, fontWeight: 700, color: "#4B5563" }}>
                      {`SCH-${item.id.slice(0, 5).toUpperCase()}`}
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: 13, color: "#4B5563" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {item.subjects?.map(s => (
                          <span key={s} style={{ background: "#F3F4F6", padding: "2px 6px", borderRadius: 4, fontSize: 11, fontWeight: 600, color: "#4B5563" }}>{s}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: 13, fontWeight: 700, color: "#2563EB" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {item.classes?.map(c => (
                          <span key={c} style={{ background: "#D8EEFF", padding: "2px 6px", borderRadius: 4, fontSize: 11, fontWeight: 700, color: "#2563EB" }}>{c}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: 13, color: "#4B5563" }}>
                      {item.phone || "—"}
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: 13, color: "#64748B", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.address ? `${item.address}${item.city ? `, ${item.city}` : ""}${item.state ? `, ${item.state}` : ""}${item.zipCode ? ` - ${item.zipCode}` : ""}` : "—"}>
                      {item.address ? `${item.address}${item.city ? `, ${item.city}` : ""}${item.state ? `, ${item.state}` : ""}${item.zipCode ? ` - ${item.zipCode}` : ""}` : "—"}
                    </td>

                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center" }}>
                        <button onClick={() => handleOpenView(item)} className="btn-action-login" title="View Profile">
                          <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button onClick={() => handleOpenEdit(item)} className="btn-action-edit" title="Edit">
                          <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="btn-action-delete" title="Delete">
                          <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <button
                          onClick={() => navigate(`/teacher-portal/${item.id}`)}
                          className="btn-action-view"
                          title="Login as Teacher"
                          style={{ fontSize: 13 }}
                        >
                          🔑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredTeachers.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderTop: "1px solid #E2E8F0", background: "#FFFFFF", flexWrap: "wrap", gap: 12 }}>
            <button style={{ padding: "6px 12px", border: "1px solid #E2E8F0", borderRadius: 6, fontSize: 12, fontWeight: 700, color: "#64748B", background: "#FFFFFF", cursor: "pointer" }}>
              Previous
            </button>
            
            <div style={{ display: "flex", gap: 6, fontSize: 12.5, fontWeight: 700, color: "#64748B" }}>
              <span style={{ color: "#2563EB", background: "#EFF6FF", width: 24, height: 24, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>1</span>
              <span style={{ width: 24, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>2</span>
              <span style={{ width: 24, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>3</span>
              <span style={{ width: 24, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>4</span>
              <span style={{ color: "#CBD5E1" }}>...</span>
              <span style={{ width: 24, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>17</span>
            </div>

            <button style={{ padding: "6px 12px", border: "1px solid #E2E8F0", borderRadius: 6, fontSize: 12, fontWeight: 700, color: "#64748B", background: "#FFFFFF", cursor: "pointer" }}>
              Next
            </button>
          </div>
        )}
      </div>

      {/* ── Add/Edit Modal ── */}
      {isModalOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          fontFamily: "inherit"
        }}>
          <div style={{
            background: "#fff", padding: 28, borderRadius: 16, width: 950, maxWidth: "95vw",
            maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"
          }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: 19, fontWeight: 900, color: "#1E293B", borderBottom: "1px solid #E2E8F0", paddingBottom: 12 }}>
              {editingTeacher ? "✏️ Edit Faculty Details" : "➕ Register New Teacher"}
            </h3>
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* Section 1: Basic Info */}
              <div>
                <h4 style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: 800, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.05em" }}>Basic Details</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Full Name</label>
                    <input 
                      type="text" required value={formName} onChange={e => setFormName(e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 30))}
                      placeholder="e.g. Priya Verma"
                      style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Email Address</label>
                    <input 
                      type="email" required value={formEmail}
                      onChange={e => setFormEmail(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9@._\-]/g, '')
                          .slice(0, 80)
                      )}
                      placeholder="teacher@school.com"
                      style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Mobile Number</label>
                    <input 
                      type="text" value={formPhone} onChange={e => setFormPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="e.g. 9876543210"
                      style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                    />
                  </div>
                  {!editingTeacher ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Access Password</label>
                      <input 
                        type="password" required value={formPassword} onChange={e => setFormPassword(e.target.value.slice(0, 15))}
                        placeholder="Enter password"
                        style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                      />
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Status</label>
                      <select 
                        value={formStatus} onChange={e => setFormStatus(e.target.value)}
                        style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", background: "#fff", fontSize: 13.5 }}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Address & Residential Information */}
              <div>
                <h4 style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: 800, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.05em" }}>Address Detail</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Residential Address</label>
                  <textarea 
                    required value={formAddress} onChange={e => setFormAddress(e.target.value.slice(0, 100))}
                    placeholder="Enter detailed residential address..."
                    style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5, minHeight: 60, resize: "vertical", fontFamily: "inherit" }}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>State</label>
                    <input 
                      type="text" required value={formState} onChange={e => setFormState(e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 30))}
                      placeholder="e.g. Rajasthan"
                      style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>City</label>
                    <input 
                      type="text" required value={formCity} onChange={e => setFormCity(e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 30))}
                      placeholder="e.g. Jaipur"
                      style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Zip Code</label>
                    <input 
                      type="text" required value={formZipCode} onChange={e => setFormZipCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="e.g. 302001"
                      style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Academic Assignments */}
              <div>
                <h4 style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: 800, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.05em" }}>Academic Assignments</h4>
                
                {/* Assigned Class(es) Dropdown Selector */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Assigned Class(es) *</label>
                  <select
                    value=""
                    onChange={e => {
                      const val = e.target.value;
                      if (val && !formClasses.includes(val)) {
                        setFormClasses([...formClasses, val]);
                      }
                    }}
                    style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5, background: "#fff" }}
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
                  
                  {/* Selected Classes Tags with delete button */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                    {formClasses.map(cls => (
                      <span
                        key={cls}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 10px",
                          background: "#D8EEFF",
                          border: "1px solid #93C5FD",
                          color: "#2563EB",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {cls}
                        <button
                          type="button"
                          onClick={() => setFormClasses(formClasses.filter(c => c !== cls))}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#2563EB",
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

                {/* Assigned Subject(s) Dropdown Selector */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Assigned Subject(s) *</label>
                  <select
                    value=""
                    onChange={e => {
                      const val = e.target.value;
                      if (val && !formSubjects.includes(val)) {
                        setFormSubjects([...formSubjects, val]);
                      }
                    }}
                    style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5, background: "#fff" }}
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
                  
                  {/* Selected Subjects Tags with delete button */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                    {formSubjects.map(subj => (
                      <span
                        key={subj}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 10px",
                          background: "#F3F4F6",
                          border: "1px solid #D1D5DB",
                          color: "#4B5563",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {subj}
                        <button
                          type="button"
                          onClick={() => setFormSubjects(formSubjects.filter(s => s !== subj))}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#4B5563",
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
              </div>

              {/* Section: Academic Qualifications */}
              <div>
                <h4 style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: 800, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.05em" }}>Academic Qualifications</h4>
                
                {/* List of Added Qualifications */}
                {formQualifications.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12, border: "1px dashed #D1D5DB", padding: 12, borderRadius: 10, background: "#FAFAFA" }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>Added Qualifications List:</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {formQualifications.map(q => (
                        <span
                          key={q.id}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 10px",
                            background: "#E0F2FE",
                            border: "1px solid #7DD3FC",
                            color: "#0369A1",
                            borderRadius: 16,
                            fontSize: 12,
                            fontWeight: 700
                          }}
                        >
                          {q.name}
                          {(q.proof || (formQualifications.findIndex(x => x.id === q.id) === 0 && formQualificationProofFile)) && (
                            <button
                              type="button"
                              onClick={() => viewFileInNewTab(q.proof || formQualificationProofFile)}
                              title="View Document"
                              style={{ background: "transparent", border: "none", color: "#0369A1", cursor: "pointer", fontSize: 11, padding: 0 }}
                            >
                              📄
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveQualification(q.id)}
                            title="Remove Qualification"
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#DC2626",
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
                )}

                {/* Qualification inputs to add new one */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, border: "1px solid #E2E8F0", padding: 12, borderRadius: 10, background: "#F8FAFC" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Qualification Name <span style={{ color: "#EF4444" }}>*</span></label>
                    <select 
                      value={formQualification} 
                      onChange={e => setFormQualification(e.target.value)}
                      style={{ padding: "8px 10px", border: "1px solid #D1D5DB", borderRadius: 6, outline: "none", fontSize: 13, background: "#fff" }}
                    >
                      <option value="">-- Select Qualification --</option>
                      {VALID_QUALIFICATIONS.map(q => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Proof Certificate (PDF / Image) <span style={{ color: "#EF4444" }}>*</span></label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                      <input 
                        type="file" 
                        accept="image/*,application/pdf"
                        onChange={handleQualificationProofUpload}
                        style={{ fontSize: 11, color: "#4B5563", maxWidth: 180 }}
                      />
                      <button
                        type="button"
                        onClick={handleAddQualification}
                        style={{ padding: "6px 12px", background: "#10B981", border: "none", borderRadius: 6, color: "#fff", fontWeight: 700, fontSize: 11.5, cursor: "pointer" }}
                      >
                        + Add to List
                      </button>
                    </div>
                    {formQualificationProofFile && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: "#10B981", fontWeight: 700 }}>✓ File Loaded</span>
                        <button 
                          type="button" 
                          onClick={() => viewFileInNewTab(formQualificationProofFile)}
                          style={{ padding: "2px 6px", background: "#D8EEFF", color: "#2563EB", border: "none", borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                        >
                          View
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 4: ID Verifications */}
              <div>
                <h4 style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: 800, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.05em" }}>Required ID Verifications (Primary ID is Mandatory)</h4>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {/* ID Proof 1 */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, border: "1px solid #E2E8F0", padding: 12, borderRadius: 10, background: "#F8FAFC" }}>
                    <label style={{ fontSize: 12, fontWeight: 800, color: "#1E293B" }}>Primary ID Proof</label>
                    
                    <select
                      value={formIdProof1Type}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === formIdProof2Type) {
                          toast.error("Primary ID Proof and Secondary ID Proof cannot be the same!");
                          return;
                        }
                        setFormIdProof1Type(val);
                        setFormIdProof1Number("");
                      }}
                      style={{ padding: "8px 10px", border: "1px solid #D1D5DB", borderRadius: 6, outline: "none", background: "#fff", fontSize: 12.5 }}
                    >
                      {["Aadhaar Card", "PAN Card", "Passport", "Voter ID", "Driving License"].map(type => (
                        <option key={type} value={type} disabled={type === formIdProof2Type}>
                          {type} {type === formIdProof2Type ? "(Selected as Secondary ID)" : ""}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      required
                      value={formIdProof1Number}
                      onChange={e => handleIdProof1NumberChange(e.target.value, formIdProof1Type)}
                      placeholder={getIdPlaceholder(formIdProof1Type)}
                      style={{ padding: "8px 10px", border: "1px solid #D1D5DB", borderRadius: 6, outline: "none", fontSize: 12.5 }}
                    />

                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>Upload Scan (PDF/JPG)</label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleIdProof1Upload}
                        style={{ fontSize: 11, color: "#64748B" }}
                      />
                      {formIdProof1File && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                          <span style={{ fontSize: 11, color: "#10B981", fontWeight: 700 }}>✓ {formIdProof1FileName || "File Loaded"}</span>
                          <button 
                            type="button" 
                            onClick={() => viewFileInNewTab(formIdProof1File)}
                            style={{ padding: "2px 6px", background: "#D8EEFF", color: "#2563EB", border: "none", borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                          >
                            View
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ID Proof 2 */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, border: "1px solid #E2E8F0", padding: 12, borderRadius: 10, background: "#F8FAFC" }}>
                    <label style={{ fontSize: 12, fontWeight: 800, color: "#1E293B" }}>Secondary ID Proof</label>
                    
                    <select
                      value={formIdProof2Type}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === formIdProof1Type) {
                          toast.error("Primary ID Proof and Secondary ID Proof cannot be the same!");
                          return;
                        }
                        setFormIdProof2Type(val);
                        setFormIdProof2Number("");
                      }}
                      style={{ padding: "8px 10px", border: "1px solid #D1D5DB", borderRadius: 6, outline: "none", background: "#fff", fontSize: 12.5 }}
                    >
                      {["PAN Card", "Aadhaar Card", "Passport", "Voter ID", "Driving License"].map(type => (
                        <option key={type} value={type} disabled={type === formIdProof1Type}>
                          {type} {type === formIdProof1Type ? "(Selected as Primary ID)" : ""}
                        </option>
                      ))}
                    </select>
 
                    <input
                      type="text"
                      value={formIdProof2Number}
                      onChange={e => handleIdProof2NumberChange(e.target.value, formIdProof2Type)}
                      placeholder={`${getIdPlaceholder(formIdProof2Type)} (Optional)`}
                      style={{ padding: "8px 10px", border: "1px solid #D1D5DB", borderRadius: 6, outline: "none", fontSize: 12.5 }}
                    />

                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>Upload Scan (PDF/JPG)</label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleIdProof2Upload}
                        style={{ fontSize: 11, color: "#64748B" }}
                      />
                      {formIdProof2File && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                          <span style={{ fontSize: 11, color: "#10B981", fontWeight: 700 }}>✓ {formIdProof2FileName || "File Loaded"}</span>
                          <button 
                            type="button" 
                            onClick={() => viewFileInNewTab(formIdProof2File)}
                            style={{ padding: "2px 6px", background: "#D8EEFF", color: "#2563EB", border: "none", borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                          >
                            View
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10, borderTop: "1px solid #E2E8F0", paddingTop: 16 }}>
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  style={{ padding: "10px 18px", background: "#F3F4F6", border: "none", borderRadius: 8, fontWeight: 700, color: "#4B5563", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ padding: "10px 18px", background: "#2563EB", border: "none", borderRadius: 8, fontWeight: 700, color: "#fff", cursor: "pointer" }}
                >
                  Save Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── View Details Modal ── */}
      {isViewModalOpen && viewingTeacher && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          fontFamily: "inherit"
        }}>
          <div style={{
            background: "#fff", padding: 28, borderRadius: 16, width: 850, maxWidth: "90vw",
            maxHeight: "85vh", overflowY: "auto",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: 16, marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#1E293B" }}>
                👁️ Teacher Profile Details
              </h3>
              <button 
                type="button" 
                onClick={() => setIsViewModalOpen(false)}
                style={{ background: "transparent", border: "none", fontSize: 20, color: "#94A3B8", cursor: "pointer" }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              
              {/* Row 1: Profile Summary */}
              <div style={{ display: "flex", gap: 20, alignItems: "center", background: "#F8FAFC", padding: 20, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%", background: "#EFF6FF", color: "#2563EB",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800
                }}>
                  {viewingTeacher.name.charAt(0)}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1E293B" }}>{viewingTeacher.name}</h4>
                  <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#64748B" }}>
                    ID: <strong style={{ color: "#2563EB" }}>SCH-{viewingTeacher.id.slice(0, 5).toUpperCase()}</strong>
                  </p>
                </div>
              </div>

              {/* Row 2: Grid of basic stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px 0" }}>Basic Information</h4>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: "6px 0", fontSize: 13, color: "#64748B", width: "40%" }}>Email:</td>
                        <td style={{ padding: "6px 0", fontSize: 13, fontWeight: 700, color: "#1E293B" }}>{viewingTeacher.email || "—"}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "6px 0", fontSize: 13, color: "#64748B" }}>Phone:</td>
                        <td style={{ padding: "6px 0", fontSize: 13, fontWeight: 700, color: "#1E293B" }}>{viewingTeacher.phone || "—"}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "6px 0", fontSize: 13, color: "#64748B" }}>Status:</td>
                        <td style={{ padding: "6px 0", fontSize: 13, fontWeight: 700, color: viewingTeacher.status === "Inactive" ? "#DC2626" : "#10B981" }}>
                          {viewingTeacher.status || "Active"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px 0" }}>Address Details</h4>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: "6px 0", fontSize: 13, color: "#64748B", width: "40%" }}>Address:</td>
                        <td style={{ padding: "6px 0", fontSize: 13, fontWeight: 700, color: "#1E293B" }}>{viewingTeacher.address || "—"}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "6px 0", fontSize: 13, color: "#64748B" }}>State / City:</td>
                        <td style={{ padding: "6px 0", fontSize: 13, fontWeight: 700, color: "#1E293B" }}>
                          {viewingTeacher.state ? `${viewingTeacher.state}, ${viewingTeacher.city || ''}` : "—"}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "6px 0", fontSize: 13, color: "#64748B" }}>Zip Code:</td>
                        <td style={{ padding: "6px 0", fontSize: 13, fontWeight: 700, color: "#1E293B" }}>{viewingTeacher.zipCode || "—"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Row 3: Academic Assignments */}
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px 0" }}>Academic Assignments</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div style={{ border: "1px solid #E2E8F0", padding: 12, borderRadius: 10, background: "#FAFAFA" }}>
                    <div style={{ fontSize: 12, fontWeight: 750, color: "#64748B", marginBottom: 6 }}>Assigned Classes:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {viewingTeacher.classes && viewingTeacher.classes.length > 0 ? (
                        viewingTeacher.classes.map(c => (
                          <span key={c} style={{ background: "#D8EEFF", padding: "3px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700, color: "#2563EB" }}>{c}</span>
                        ))
                      ) : (
                        <span style={{ fontSize: 12, color: "#94A3B8" }}>No classes assigned</span>
                      )}
                    </div>
                  </div>

                  <div style={{ border: "1px solid #E2E8F0", padding: 12, borderRadius: 10, background: "#FAFAFA" }}>
                    <div style={{ fontSize: 12, fontWeight: 750, color: "#64748B", marginBottom: 6 }}>Assigned Subjects:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {viewingTeacher.subjects && viewingTeacher.subjects.length > 0 ? (
                        viewingTeacher.subjects.map(s => (
                          <span key={s} style={{ background: "#F3F4F6", padding: "3px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700, color: "#4B5563" }}>{s}</span>
                        ))
                      ) : (
                        <span style={{ fontSize: 12, color: "#94A3B8" }}>No subjects assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 4: Qualifications & ID proofs */}
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px 0" }}>Verifications & Credentials</h4>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  
                  {/* Qualifications */}
                  <div style={{ border: "1px solid #E2E8F0", padding: 16, borderRadius: 12, background: "#FAFAFA" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: "#1E293B", marginBottom: 10 }}>Academic Qualifications</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {viewingTeacher.qualifications && viewingTeacher.qualifications.length > 0 ? (
                        viewingTeacher.qualifications.map((q, idx) => (
                          <div key={q.id || idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1E293B" }}>{q.name}</span>
                            {(q.proof || (idx === 0 && viewingTeacher.qualificationProofFile)) && (
                              <button
                                type="button"
                                onClick={() => viewFileInNewTab(q.proof || viewingTeacher.qualificationProofFile)}
                                style={{ padding: "3px 8px", background: "#EFF6FF", border: "none", borderRadius: 6, color: "#2563EB", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
                              >
                                View proof
                              </button>
                            )}
                          </div>
                        ))
                      ) : viewingTeacher.qualification ? (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1E293B" }}>{viewingTeacher.qualification}</span>
                          {viewingTeacher.qualificationProofFile && (
                            <button
                              type="button"
                              onClick={() => viewFileInNewTab(viewingTeacher.qualificationProofFile)}
                              style={{ padding: "3px 8px", background: "#EFF6FF", border: "none", borderRadius: 6, color: "#2563EB", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
                            >
                              View proof
                            </button>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: 12.5, color: "#94A3B8" }}>No qualifications uploaded</span>
                      )}
                    </div>
                  </div>

                  {/* ID Proofs */}
                  <div style={{ border: "1px solid #E2E8F0", padding: 16, borderRadius: 12, background: "#FAFAFA" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: "#1E293B", marginBottom: 10 }}>Uploaded ID Verifications</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      
                      {/* ID Proof 1 */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                        <div>
                          <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700 }}>{viewingTeacher.idProof1Type || "Primary ID Proof"}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", marginTop: 2 }}>{viewingTeacher.idProof1Number || "—"}</div>
                        </div>
                        {viewingTeacher.idProof1File && (
                          <button
                            type="button"
                            onClick={() => viewFileInNewTab(viewingTeacher.idProof1File)}
                            style={{ padding: "4px 10px", background: "#EFF6FF", border: "none", borderRadius: 6, color: "#2563EB", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
                          >
                            View scan
                          </button>
                        )}
                      </div>

                      {/* ID Proof 2 */}
                      {viewingTeacher.idProof2Number && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                          <div>
                            <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700 }}>{viewingTeacher.idProof2Type || "Secondary ID Proof"}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", marginTop: 2 }}>{viewingTeacher.idProof2Number || "—"}</div>
                          </div>
                          {viewingTeacher.idProof2File && (
                            <button
                              type="button"
                              onClick={() => viewFileInNewTab(viewingTeacher.idProof2File)}
                              style={{ padding: "4px 10px", background: "#EFF6FF", border: "none", borderRadius: 6, color: "#2563EB", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
                            >
                              View scan
                            </button>
                          )}
                        </div>
                      )}

                    </div>
                  </div>

                </div>
              </div>

            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid #E2E8F0", paddingTop: 16, marginTop: 24 }}>
              <button 
                type="button" 
                onClick={() => setIsViewModalOpen(false)}
                style={{ padding: "10px 20px", background: "#F3F4F6", border: "none", borderRadius: 8, color: "#4B5563", fontWeight: 700, cursor: "pointer" }}
              >
                Close Profile
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleOpenEdit(viewingTeacher);
                }}
                style={{ padding: "10px 20px", background: "#2563EB", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer" }}
              >
                Edit Profile
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
