import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usersApi, classesApi } from "../../services/api";
import { toast } from "sonner";

function MapPickerModal({ isOpen, onClose, initialLat, initialLng, onConfirm }) {
  const [lat, setLat] = useState(initialLat || "28.6139");
  const [lng, setLng] = useState(initialLng || "77.2090");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [mapType, setMapType] = useState("google"); // "google", "hybrid", "osm"
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markerRef = useRef(null);

  const tileURLs = {
    google: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    hybrid: "https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}",
    osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  };

  useEffect(() => {
    if (!isOpen) return;
    setLat(initialLat || "28.6139");
    setLng(initialLng || "77.2090");

    const loadLeafletAndInit = () => {
      if (!window.L) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);

        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => initMap();
        document.body.appendChild(script);
      } else {
        initMap();
      }
    };

    const initMap = () => {
      if (!mapContainerRef.current) return;
      const L = window.L;
      if (!L) return;

      const initLat = parseFloat(initialLat) || 28.6139;
      const initLng = parseFloat(initialLng) || 77.2090;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current).setView([initLat, initLng], 15);
      mapInstanceRef.current = map;

      const options = mapType === "osm" ? { attribution: "© OpenStreetMap contributors" } : { subdomains: ['mt0', 'mt1', 'mt2', 'mt3'] };
      const tileLayer = L.tileLayer(tileURLs[mapType], options).addTo(map);
      tileLayerRef.current = tileLayer;

      const iconHtml = `<div style="
        width:40px;height:40px;background:linear-gradient(135deg, #EF4444, #B91C1C);border:3px solid #fff;
        border-radius:50%;box-shadow:0 6px 16px rgba(185,28,28,0.6);
        display:flex;align-items:center;justify-content:center;font-size:20px;color:#fff;">📍</div>`;
      const pinIcon = L.divIcon({ html: iconHtml, className: "student-picker-pin", iconSize: [40, 40], iconAnchor: [20, 20] });

      const marker = L.marker([initLat, initLng], { icon: pinIcon, draggable: true }).addTo(map);
      markerRef.current = marker;

      const updateCoords = (newLat, newLng) => {
        const roundedLat = parseFloat(newLat).toFixed(6);
        const roundedLng = parseFloat(newLng).toFixed(6);
        setLat(roundedLat);
        setLng(roundedLng);
        marker.setLatLng([newLat, newLng]);
      };

      marker.on("dragend", (e) => {
        const pos = e.target.getLatLng();
        updateCoords(pos.lat, pos.lng);
      });

      map.on("click", (e) => {
        updateCoords(e.latlng.lat, e.latlng.lng);
      });

      setTimeout(() => {
        map.invalidateSize();
      }, 350);
    };

    loadLeafletAndInit();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, initialLat, initialLng]);

  // Handle Map Type Switching (Google Roadmap vs Google Satellite vs OSM)
  const changeMapType = (type) => {
    setMapType(type);
    if (!mapInstanceRef.current || !window.L) return;
    const L = window.L;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const options = type === "osm" ? { attribution: "© OpenStreetMap contributors" } : { subdomains: ['mt0', 'mt1', 'mt2', 'mt3'] };
    tileLayerRef.current = L.tileLayer(tileURLs[type], options).addTo(mapInstanceRef.current);
  };

  // Address Geocoding Search
  const handleSearchAddress = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const first = data[0];
        const newLat = parseFloat(first.lat).toFixed(6);
        const newLng = parseFloat(first.lon).toFixed(6);
        setLat(newLat);
        setLng(newLng);
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([first.lat, first.lon], 16);
          markerRef.current.setLatLng([first.lat, first.lon]);
        }
        toast.success(`Found: ${first.display_name.slice(0, 45)}...`);
      } else {
        toast.error("Location not found! Try searching with colony/city name.");
      }
    } catch (err) {
      toast.error("Geocoding search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1100,
      background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 680,
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", overflow: "hidden", display: "flex", flexDirection: "column"
      }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #0284C7, #0369A1)", padding: "18px 24px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900 }}>📍 Google Maps Home Location Picker</h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.9 }}>
              Search house address or click/drag pin on Google Maps to set exact student pickup spot
            </p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            ✕
          </button>
        </div>

        {/* Top Search & Layer Toggle Bar */}
        <div style={{ padding: "12px 18px", background: "#F1F5F9", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <form onSubmit={handleSearchAddress} style={{ flex: 1, display: "flex", gap: 6, minWidth: 260 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="🔍 Search house no, street, colony, city (e.g. Malviya Nagar Jaipur)..."
              style={{ flex: 1, padding: "8px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 12.5, outline: "none", background: "#fff" }}
            />
            <button
              type="submit"
              disabled={searching}
              style={{ padding: "8px 14px", background: "#0284C7", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: searching ? "wait" : "pointer" }}
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </form>

          {/* Map Layer Switcher Buttons */}
          <div style={{ display: "flex", gap: 4, background: "#CBD5E1", padding: 3, borderRadius: 8 }}>
            <button
              type="button"
              onClick={() => changeMapType("google")}
              style={{ padding: "4px 8px", border: "none", borderRadius: 6, background: mapType === "google" ? "#fff" : "transparent", color: mapType === "google" ? "#0284C7" : "#475569", fontWeight: 800, fontSize: 11, cursor: "pointer" }}
            >
              🗺️ Google Maps
            </button>
            <button
              type="button"
              onClick={() => changeMapType("hybrid")}
              style={{ padding: "4px 8px", border: "none", borderRadius: 6, background: mapType === "hybrid" ? "#fff" : "transparent", color: mapType === "hybrid" ? "#0284C7" : "#475569", fontWeight: 800, fontSize: 11, cursor: "pointer" }}
            >
              🛰️ Satellite
            </button>
            <button
              type="button"
              onClick={() => changeMapType("osm")}
              style={{ padding: "4px 8px", border: "none", borderRadius: 6, background: mapType === "osm" ? "#fff" : "transparent", color: mapType === "osm" ? "#0284C7" : "#475569", fontWeight: 800, fontSize: 11, cursor: "pointer" }}
            >
              🗺️ Standard
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div style={{ width: "100%", height: 380, position: "relative", background: "#E2E8F0" }}>
          <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
        </div>

        {/* Selected Coordinates & Footer */}
        <div style={{ padding: "14px 20px", background: "#F8FAFC", borderTop: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", textTransform: "uppercase" }}>Selected Home Pickup Location</span>
            <strong style={{ fontSize: 13, color: "#0F172A" }}>Latitude: {lat} | Longitude: {lng}</strong>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ padding: "9px 16px", background: "#E2E8F0", border: "none", borderRadius: 8, fontSize: 12.5, fontWeight: 700, color: "#475569", cursor: "pointer" }}>
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm(lat, lng);
                onClose();
                toast.success(`Pickup Location set: (${lat}, ${lng})`);
              }}
              style={{ padding: "9px 18px", background: "#0284C7", border: "none", borderRadius: 8, fontSize: 12.5, fontWeight: 800, color: "#fff", cursor: "pointer" }}
            >
              ✓ Confirm & Set Location Pin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const DUMMY_STUDENTS = [
  { 
    id: "101", 
    name: "Aarav Sharma", 
    email: "aarav@school.com", 
    class: "9th A", 
    rollNo: "12", 
    status: "Active",
    dob: "2012-05-15",
    gender: "Male",
    bloodGroup: "O+",
    fatherName: "Rajesh Sharma",
    motherName: "Sushma Sharma",
    parentEmail: "rajesh@gmail.com",
    address: "12 Elm St, Cambridge",
    admissionNo: "ADM-9821",
    idProofType: "Aadhaar Card",
    idProofNumber: "1234-5678-9012",
    idProofFile: "aadhaar.pdf",
    prevSchool: "Greenwood High School",
    tcNumber: "TC-99812",
    tcIssueDate: "2026-06-15",
    tcFile: "tc_photo_aarav.jpg"
  },
  { 
    id: "102", 
    name: "Diya Patel", 
    email: "diya@school.com", 
    class: "9th A", 
    rollNo: "15", 
    status: "Active",
    dob: "2012-07-22",
    gender: "Female",
    bloodGroup: "A+",
    fatherName: "Ketan Patel",
    motherName: "Meena Patel",
    parentEmail: "ketan@gmail.com",
    address: "45 Pine St, Boston",
    admissionNo: "ADM-9844",
    idProofType: "Aadhaar Card",
    idProofNumber: "9876-5432-1098",
    idProofFile: "aadhaar_diya.pdf",
    prevSchool: "Boston International School",
    tcNumber: "TC-98711",
    tcIssueDate: "2026-06-10",
    tcFile: "tc_photo_diya.jpg"
  },
  { 
    id: "103", 
    name: "Rohan Gupta", 
    email: "rohan@school.com", 
    class: "10th B", 
    rollNo: "05", 
    status: "Active",
    dob: "2011-11-09",
    gender: "Male",
    bloodGroup: "B+",
    fatherName: "Sanjay Gupta",
    motherName: "Rita Gupta",
    parentEmail: "sanjay@gmail.com",
    address: "88 Maple Ave, Quincy",
    admissionNo: "ADM-9905",
    idProofType: "Birth Certificate",
    idProofNumber: "BC-772183",
    idProofFile: "birth_cert.pdf",
    prevSchool: "Quincy Grammar School",
    tcNumber: "TC-99051",
    tcIssueDate: "2026-06-20",
    tcFile: "tc_photo_rohan.jpg"
  },
];

export default function PortalStudents() {
  const navigate = useNavigate();
  const { schoolId } = useParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [availableClasses, setAvailableClasses] = useState([]);

  // Search & Filter states
  const [searchStudent, setSearchStudent] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterClass, setFilterClass] = useState("All");
  const [filterGender, setFilterGender] = useState("All");
  const [filterBloodGroup, setFilterBloodGroup] = useState("All");

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  
  // View Modal States
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);
  
  // Standard fields
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formStatus, setFormStatus] = useState("Active");
  const [formPassword, setFormPassword] = useState("");

  // Detailed admission fields
  const [formDob, setFormDob] = useState("");
  const [formGender, setFormGender] = useState("");
  const [formBloodGroup, setFormBloodGroup] = useState("");
  const [formFatherName, setFormFatherName] = useState("");
  const [formMotherName, setFormMotherName] = useState("");
  const [formParentEmail, setFormParentEmail] = useState("");
  const [formClass, setFormClass] = useState("");
  const [formRollNo, setFormRollNo] = useState("");
  const [formAdmissionNo, setFormAdmissionNo] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formState, setFormState] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formZipCode, setFormZipCode] = useState("");
  const [formLatitude, setFormLatitude] = useState("");
  const [formLongitude, setFormLongitude] = useState("");
  const [formIdProofType, setFormIdProofType] = useState("Aadhaar Card");
  const [formIdProofNumber, setFormIdProofNumber] = useState("");
  const [formIdProofFile, setFormIdProofFile] = useState("");

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    toast.info("Fetching current GPS location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setFormLatitude(lat);
        setFormLongitude(lng);
        toast.success(`Location captured: ${lat}, ${lng}`);
      },
      () => {
        toast.error("Unable to retrieve location. Please grant GPS permissions or enter manually.");
      },
      { enableHighAccuracy: true }
    );
  };

  // TC and previous school fields
  const [formPrevSchool, setFormPrevSchool] = useState("");
  const [formTcNumber, setFormTcNumber] = useState("");
  const [formTcIssueDate, setFormTcIssueDate] = useState("");
  const [formTcFile, setFormTcFile] = useState("");
  const [formIdProofFileName, setFormIdProofFileName] = useState("");
  const [formTcFileName, setFormTcFileName] = useState("");

  const [formPrevMarks, setFormPrevMarks] = useState("");
  const [formMarksheetFile, setFormMarksheetFile] = useState("");
  const [formMarksheetFileName, setFormMarksheetFileName] = useState("");

  const handleMarksheetUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormMarksheetFile(reader.result);
        setFormMarksheetFileName(file.name);
        toast.success("Previous marksheet uploaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdProofUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormIdProofFile(reader.result);
        setFormIdProofFileName(file.name);
        toast.success("ID proof file loaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTcUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormTcFile(reader.result);
        setFormTcFileName(file.name);
        toast.success("Transfer Certificate file loaded!");
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

  const loadStudentsList = async () => {
    setLoading(true);
    try {
      // Load real classes registered in DB for this school
      try {
        const cRes = await classesApi.getAll({ schoolId, limit: 100 });
        const dbClasses = (cRes.data || []).map(c => c.name).filter(Boolean);
        setAvailableClasses(Array.from(new Set(dbClasses)));
      } catch (cErr) {
        console.warn("Could not load dynamic classes for school:", cErr);
      }

      const res = await usersApi.getAll({ role: "student", schoolId: schoolId, limit: 100 });
      const mappings = JSON.parse(localStorage.getItem("student_admission_mappings") || "{}");

      const liveStudents = (res.data || [])
        .map(u => {
          const map = mappings[u.id] || {};
          
          // Priority logic: u (API response) -> map (localStorage) -> default
          const classVal = u.className !== undefined && u.className !== null ? u.className : (map.class || "9th A");
          const rollNo = u.rollNo !== undefined && u.rollNo !== null ? u.rollNo : (map.rollNo || "10");
          const dob = u.dob !== undefined && u.dob !== null ? u.dob : (map.dob || "2012-05-15");
          const gender = u.gender !== undefined && u.gender !== null ? u.gender : (map.gender || "");
          const bloodGroup = u.bloodGroup !== undefined && u.bloodGroup !== null ? u.bloodGroup : (map.bloodGroup || "");
          const fatherName = u.fatherName !== undefined && u.fatherName !== null ? u.fatherName : (map.fatherName || "Father Name");
          const motherName = u.motherName !== undefined && u.motherName !== null ? u.motherName : (map.motherName || "Mother Name");
          const parentEmail = u.parentEmail !== undefined && u.parentEmail !== null ? u.parentEmail : (map.parentEmail || "parent@school.com");
          
          const address = u.address !== undefined && u.address !== null ? u.address : (map.address || u.pickupAddress || "123 Elm St, Cambridge");
          const state = u.state !== undefined && u.state !== null ? u.state : (map.state || "");
          const city = u.city !== undefined && u.city !== null ? u.city : (map.city || "");
          const zipCode = u.zipCode !== undefined && u.zipCode !== null ? u.zipCode : (map.zipCode || "");
          const latitude = u.latitude !== undefined && u.latitude !== null ? u.latitude : (map.latitude || u.pickupLatitude || "");
          const longitude = u.longitude !== undefined && u.longitude !== null ? u.longitude : (map.longitude || u.pickupLongitude || "");
          
          const admissionNo = u.admissionNo !== undefined && u.admissionNo !== null ? u.admissionNo : (map.admissionNo || `ADM-${u.id.slice(0, 4).toUpperCase()}`);
          const idProofType = u.idProofType !== undefined && u.idProofType !== null ? u.idProofType : (map.idProofType || "Aadhaar Card");
          const idProofNumber = u.idProofNumber !== undefined && u.idProofNumber !== null ? u.idProofNumber : (map.idProofNumber || "1234-5678-9012");
          const idProofFile = u.idProofFile !== undefined && u.idProofFile !== null ? u.idProofFile : (map.idProofFile || "aadhaar.pdf");
          
          const prevSchool = u.prevSchool !== undefined && u.prevSchool !== null ? u.prevSchool : (map.prevSchool || "Greenwood High School");
          const tcNumber = u.tcNumber !== undefined && u.tcNumber !== null ? u.tcNumber : (map.tcNumber || "TC-99812");
          const tcIssueDate = u.tcIssueDate !== undefined && u.tcIssueDate !== null ? u.tcIssueDate : (map.tcIssueDate || "2026-06-15");
          const tcFile = u.tcFile !== undefined && u.tcFile !== null ? u.tcFile : (map.tcFile || "tc_photo.jpg");
          const prevMarks = u.prevMarks !== undefined && u.prevMarks !== null ? u.prevMarks : (map.prevMarks || "85%");
          const marksheetFile = u.marksheetFile !== undefined && u.marksheetFile !== null ? u.marksheetFile : (map.marksheetFile || "");
          const marksheetFileName = u.marksheetFileName !== undefined && u.marksheetFileName !== null ? u.marksheetFileName : (map.marksheetFileName || "");

          return {
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone || map.phone || "",
            class: classVal,
            rollNo: rollNo,
            dob: dob,
            gender: gender,
            bloodGroup: bloodGroup,
            fatherName: fatherName,
            motherName: motherName,
            parentEmail: parentEmail,
            address: address,
            state: state,
            city: city,
            zipCode: zipCode,
            latitude: latitude,
            longitude: longitude,
            admissionNo: admissionNo,
            idProofType: idProofType,
            idProofNumber: idProofNumber,
            idProofFile: idProofFile,
            prevSchool: prevSchool,
            tcNumber: tcNumber,
            tcIssueDate: tcIssueDate,
            tcFile: tcFile,
            prevMarks: prevMarks,
            marksheetFile: marksheetFile,
            marksheetFileName: marksheetFileName,
            status: u.isActive ? "Active" : "Inactive"
          };
        })
        .filter(Boolean);

      setStudents(liveStudents);
    } catch (err) {
      console.warn("Could not load students:", err.message);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormStatus("Active");
    setFormPassword("");
    
    // reset admission fields
    setFormDob("");
    setFormGender("");
    setFormBloodGroup("");
    setFormFatherName("");
    setFormMotherName("");
    setFormParentEmail("");
    setFormClass("");
    setFormRollNo("");
    setFormAdmissionNo("");
    setFormAddress("");
    setFormState("");
    setFormCity("");
    setFormZipCode("");
    setFormLatitude("");
    setFormLongitude("");
    setFormIdProofType("Aadhaar Card");
    setFormIdProofNumber("");
    setFormIdProofFile("");
    setFormIdProofFileName("");
    setFormPrevSchool("");
    setFormTcNumber("");
    setFormTcIssueDate("");
    setFormTcFile("");
    setFormTcFileName("");
    setFormPrevMarks("");
    setFormMarksheetFile("");
    setFormMarksheetFileName("");
    
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setFormName(student.name);
    setFormEmail(student.email || "");
    setFormPhone(student.phone || "");
    setFormStatus(student.status);
    setFormPassword("");
    
    // restore fields
    setFormDob(student.dob || "");
    setFormGender(student.gender || "");
    setFormBloodGroup(student.bloodGroup || "");
    setFormFatherName(student.fatherName || "");
    setFormMotherName(student.motherName || "");
    setFormParentEmail(student.parentEmail || "");
    setFormClass(student.class || "9th A");
    setFormRollNo(student.rollNo || "");
    setFormAdmissionNo(student.admissionNo || "");
    setFormAddress(student.address || "");
    setFormState(student.state || "");
    setFormCity(student.city || "");
    setFormZipCode(student.zipCode || "");
    setFormLatitude(student.latitude || "");
    setFormLongitude(student.longitude || "");
    setFormIdProofType(student.idProofType || "Aadhaar Card");
    setFormIdProofNumber(student.idProofNumber || "");
    setFormIdProofFile(student.idProofFile || "");
    setFormIdProofFileName(student.idProofFile ? (student.idProofFile.startsWith('data:') ? 'Uploaded Document' : student.idProofFile) : "");
    setFormPrevSchool(student.prevSchool || "");
    setFormTcNumber(student.tcNumber || "");
    setFormTcIssueDate(student.tcIssueDate || "");
    setFormTcFile(student.tcFile || "");
    setFormTcFileName(student.tcFile ? (student.tcFile.startsWith('data:') ? 'Uploaded Document' : student.tcFile) : "");
    setFormPrevMarks(student.prevMarks || "");
    setFormMarksheetFile(student.marksheetFile || "");
    setFormMarksheetFileName(student.marksheetFileName || "");
    
    setIsModalOpen(true);
  };

  const getIdPlaceholder = () => {
    switch (formIdProofType) {
      case "Aadhaar Card":
        return "12-digit Aadhaar Number (e.g. 123456789012)";
      case "Passport":
        return "Letter followed by 7 digits (e.g. Z1234567)";
      case "Birth Certificate":
        return "Certificate number (e.g. BC/2026/12345)";
      case "Ration Card":
        return "Ration Card number (8 to 15 alphanumeric characters)";
      default:
        return "Enter ID Document Number";
    }
  };

  const handleIdProofNumberChange = (val) => {
    let sanitized = val;
    if (formIdProofType === "Aadhaar Card") {
      sanitized = val.replace(/\D/g, '').slice(0, 12);
    } else if (formIdProofType === "Passport") {
      sanitized = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
    } else if (formIdProofType === "Birth Certificate") {
      sanitized = val.replace(/[^a-zA-Z0-9\/\s-]/g, '').slice(0, 20);
    } else if (formIdProofType === "Ration Card") {
      sanitized = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 15);
    } else {
      sanitized = val.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
    }
    setFormIdProofNumber(sanitized);
  };

  const handleIdProofTypeChange = (type) => {
    setFormIdProofType(type);
    setFormIdProofNumber("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Student Name validation
    if (!formName.trim()) {
      toast.error("Student Full Name is required!");
      return;
    }
    if (formName.length > 30) {
      toast.error("Student Name must be 30 characters or less!");
      return;
    }
    if (/[^a-zA-Z\s]/.test(formName)) {
      toast.error("Student Name can only contain letters and spaces!");
      return;
    }

    // Student Email validation
    if (!formEmail.trim()) {
      toast.error("Student Email is required!");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formEmail)) {
      toast.error("Please enter a valid student email address!");
      return;
    }

    // Assigned Class validation
    if (!formClass.trim()) {
      toast.error("Please select an Assigned Class!");
      return;
    }

    // Roll Number validation
    if (!formRollNo.trim()) {
      toast.error("Roll Number is required!");
      return;
    }
    if (/\D/.test(formRollNo)) {
      toast.error("Roll Number can only contain digits!");
      return;
    }
    if (formRollNo.length > 5) {
      toast.error("Roll Number must be 5 digits or less!");
      return;
    }

    // Admission Number check (if entered)
    if (formAdmissionNo && formAdmissionNo.length > 15) {
      toast.error("Admission Number must be 15 characters or less!");
      return;
    }

    // Father Name validation
    if (!formFatherName.trim()) {
      toast.error("Father's Name is required!");
      return;
    }
    if (formFatherName.length > 30) {
      toast.error("Father's Name must be 30 characters or less!");
      return;
    }
    if (/[^a-zA-Z\s]/.test(formFatherName)) {
      toast.error("Father's Name can only contain letters and spaces!");
      return;
    }

    // Mother Name validation
    if (!formMotherName.trim()) {
      toast.error("Mother's Name is required!");
      return;
    }
    if (formMotherName.length > 30) {
      toast.error("Mother's Name must be 30 characters or less!");
      return;
    }
    if (/[^a-zA-Z\s]/.test(formMotherName)) {
      toast.error("Mother's Name can only contain letters and spaces!");
      return;
    }

    // Parent Mobile validation
    if (!formPhone || formPhone.trim().length !== 10 || /\D/.test(formPhone)) {
      toast.error("Parent Mobile Number must be exactly 10 digits!");
      return;
    }

    // Parent Email validation (optional but validate if entered)
    if (formParentEmail.trim()) {
      if (!emailRegex.test(formParentEmail)) {
        toast.error("Please enter a valid parent email address!");
        return;
      }
    }

    // Address validation
    if (!formAddress.trim()) {
      toast.error("Permanent Address is required!");
      return;
    }
    if (formAddress.length > 100) {
      toast.error("Permanent Address must be 100 characters or less!");
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

    // ID document number checks
    if (!formIdProofNumber.trim()) {
      toast.error("ID Document Number is required!");
      return;
    }
    if (formIdProofType === "Aadhaar Card") {
      if (formIdProofNumber.length !== 12 || /\D/.test(formIdProofNumber)) {
        toast.error("Aadhaar Card must be exactly 12 digits!");
        return;
      }
    } else if (formIdProofType === "Passport") {
      const passportRegex = /^[A-Z][0-9]{7}$/;
      if (!passportRegex.test(formIdProofNumber.toUpperCase())) {
        toast.error("Passport number must start with 1 capital letter followed by 7 digits (e.g. Z1234567)!");
        return;
      }
    } else if (formIdProofType === "Birth Certificate") {
      const bcRegex = /^[a-zA-Z0-9\/\s-]{5,20}$/;
      if (!bcRegex.test(formIdProofNumber)) {
        toast.error("Birth Certificate number must be 5 to 20 alphanumeric characters!");
        return;
      }
    } else if (formIdProofType === "Ration Card") {
      const rcRegex = /^[a-zA-Z0-9]{8,15}$/;
      if (!rcRegex.test(formIdProofNumber)) {
        toast.error("Ration Card number must be 8 to 15 alphanumeric characters!");
        return;
      }
    } else {
      if (formIdProofNumber.length < 8 || formIdProofNumber.length > 16) {
        toast.error("ID Document Number must be between 8 and 16 characters!");
        return;
      }
    }

    // Previous school and TC checks
    if (formPrevSchool.trim()) {
      if (formPrevSchool.trim().length < 3 || formPrevSchool.trim().length > 100) {
        toast.error("Previous School Name must be between 3 and 100 characters!");
        return;
      }
    }
    if (formTcNumber.trim()) {
      if (formTcNumber.trim().length < 3 || formTcNumber.trim().length > 20) {
        toast.error("TC Number must be between 3 and 20 characters!");
        return;
      }
    }
    // Make TC Scan and Marksheet upload mandatory
    if (!formTcFile) {
      toast.error("Please upload the Transfer Certificate (TC) scan/photo!");
      return;
    }
    if (!formMarksheetFile) {
      toast.error("Please upload the Previous Class Marksheet!");
      return;
    }
    if (formPrevMarks.trim()) {
      const sanitizedMarks = formPrevMarks.replace("%", "").trim();
      const parsedMarks = parseFloat(sanitizedMarks);
      if (isNaN(parsedMarks) || parsedMarks < 0 || parsedMarks > 100) {
        toast.error("Previous Class Marks must be a valid percentage between 0 and 100%!");
        return;
      }
    }

    try {
      let savedStudentId = "";
      if (editingStudent) {
        const payload = {
          name: formName,
          email: formEmail,
          phone: formPhone || null,
          role: "student",
          schoolId: schoolId,
          isActive: formStatus === "Active",
          className: formClass,
          rollNo: formRollNo,
          dob: formDob,
          gender: formGender,
          bloodGroup: formBloodGroup,
          fatherName: formFatherName,
          motherName: formMotherName,
          parentEmail: formParentEmail,
          address: formAddress,
          state: formState,
          city: formCity,
          zipCode: formZipCode,
          latitude: formLatitude || null,
          longitude: formLongitude || null,
          admissionNo: formAdmissionNo || `ADM-${editingStudent.id.slice(0, 4).toUpperCase()}`,
          idProofType: formIdProofType,
          idProofNumber: formIdProofNumber,
          idProofFile: formIdProofFile,
          prevSchool: formPrevSchool,
          tcNumber: formTcNumber,
          tcIssueDate: formTcIssueDate,
          tcFile: formTcFile,
          prevMarks: formPrevMarks,
          marksheetFile: formMarksheetFile,
          marksheetFileName: formMarksheetFileName
        };
        await usersApi.update(editingStudent.id, payload);
        savedStudentId = editingStudent.id;
        toast.success("Student updated successfully!");
      } else {
        // Enforce Plan Student Limit Rule (Active + Inactive students count towards limit)
        let studentLimit = 2; // Default limit for NEW/Basic plan
        try {
          const { schoolsApi, plansApi } = await import("../../services/api");
          const sRes = await schoolsApi.getById(schoolId);
          const planName = sRes?.data?.planName || "NEW";
          const pRes = await plansApi.getAll();
          const plansList = pRes?.data || [];
          const matchedPlan = plansList.find(p => (p.name || "").toLowerCase() === planName.toLowerCase());
          if (matchedPlan && matchedPlan.maxStudents) {
            studentLimit = Number(matchedPlan.maxStudents);
          }
        } catch (planErr) {
          console.warn("Could not load plan limit:", planErr);
        }

        const totalRegisteredStudents = students.length;
        if (totalRegisteredStudents >= studentLimit) {
          toast.error(`Student limit reached for your plan! You cannot add more than ${studentLimit} students (active & inactive counted).`);
          return;
        }

        const payload = {
          name: formName,
          email: formEmail,
          phone: formPhone || null,
          password: formPassword || "StudentPass123!",
          role: "student",
          schoolId: schoolId,
          className: formClass,
          rollNo: formRollNo,
          dob: formDob,
          gender: formGender,
          bloodGroup: formBloodGroup,
          fatherName: formFatherName,
          motherName: formMotherName,
          parentEmail: formParentEmail,
          address: formAddress,
          state: formState,
          city: formCity,
          zipCode: formZipCode,
          latitude: formLatitude || null,
          longitude: formLongitude || null,
          admissionNo: formAdmissionNo,
          idProofType: formIdProofType,
          idProofNumber: formIdProofNumber,
          idProofFile: formIdProofFile,
          prevSchool: formPrevSchool,
          tcNumber: formTcNumber,
          tcIssueDate: formTcIssueDate,
          tcFile: formTcFile,
          prevMarks: formPrevMarks,
          marksheetFile: formMarksheetFile,
          marksheetFileName: formMarksheetFileName
        };
        const resUser = await usersApi.create(payload);
        savedStudentId = resUser.data?.id || "";
        toast.success("Student added successfully!");
      }

      if (savedStudentId) {
        try {
          const mappings = JSON.parse(localStorage.getItem("student_admission_mappings") || "{}");
          mappings[savedStudentId] = {
            schoolId: schoolId,
            class: formClass,
            rollNo: formRollNo,
            dob: formDob,
            gender: formGender,
            bloodGroup: formBloodGroup,
            fatherName: formFatherName,
            motherName: formMotherName,
            parentEmail: formParentEmail,
            address: formAddress,
            state: formState,
            city: formCity,
            zipCode: formZipCode,
            latitude: formLatitude,
            longitude: formLongitude,
            admissionNo: formAdmissionNo || `ADM-${savedStudentId.slice(0, 4).toUpperCase()}`,
            idProofType: formIdProofType,
            idProofNumber: formIdProofNumber,
            idProofFile: (formIdProofFile && formIdProofFile.length > 500) ? "uploaded_id.pdf" : formIdProofFile,
            prevSchool: formPrevSchool,
            tcNumber: formTcNumber,
            tcIssueDate: formTcIssueDate,
            tcFile: (formTcFile && formTcFile.length > 500) ? "uploaded_tc.pdf" : formTcFile,
            prevMarks: formPrevMarks,
            marksheetFile: (formMarksheetFile && formMarksheetFile.length > 500) ? (formMarksheetFileName || "uploaded_marksheet.pdf") : formMarksheetFile,
            marksheetFileName: formMarksheetFileName
          };

          // Prune any existing large base64 values across all items in mappings
          for (const sid in mappings) {
            const m = mappings[sid];
            if (m && typeof m === "object") {
              if (typeof m.idProofFile === "string" && m.idProofFile.length > 500) m.idProofFile = "uploaded_id.pdf";
              if (typeof m.tcFile === "string" && m.tcFile.length > 500) m.tcFile = "uploaded_tc.pdf";
              if (typeof m.marksheetFile === "string" && m.marksheetFile.length > 500) m.marksheetFile = "uploaded_marksheet.pdf";
            }
          }

          localStorage.setItem("student_admission_mappings", JSON.stringify(mappings));
        } catch (storageErr) {
          console.warn("Could not update local student_admission_mappings:", storageErr);
        }
      }

      setIsModalOpen(false);
      loadStudentsList();
    } catch (err) {
      toast.error(err.message || "Failed to save student");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try {
      await usersApi.delete(id);
      
      const mappings = JSON.parse(localStorage.getItem("student_admission_mappings") || "{}");
      delete mappings[id];
      localStorage.setItem("student_admission_mappings", JSON.stringify(mappings));

      toast.success("Student deleted successfully!");
      loadStudentsList();
    } catch (err) {
      toast.error(err.message || "Failed to delete student");
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

  const filteredStudents = students.filter(s => {
    const q = searchStudent.toLowerCase();
    const matchesSearch = !q ||
      (s.name || "").toLowerCase().includes(q) ||
      (s.rollNo || "").toLowerCase().includes(q) ||
      (s.admissionNo || "").toLowerCase().includes(q);
    const matchesStatus = filterStatus === "All" || (s.status || "Active") === filterStatus;
    const matchesClass  = filterClass  === "All" || (s.class || "") === filterClass;
    const matchesGender = filterGender === "All" || (s.gender || "") === filterGender;
    const matchesBG     = filterBloodGroup === "All" || (s.bloodGroup || "") === filterBloodGroup;
    return matchesSearch && matchesStatus && matchesClass && matchesGender && matchesBG;
  });

  const handleExportCSV = () => {
    const listToExport = filteredStudents.length > 0 ? filteredStudents : students;
    if (listToExport.length === 0) {
      toast.error("No student records available to export.");
      return;
    }
    const headers = [
      "S.No.",
      "Student ID",
      "Admission No",
      "Roll No",
      "Student Name",
      "Email",
      "Student Phone",
      "Assigned Class",
      "Status",
      "Gender",
      "DOB",
      "Blood Group",
      "Father Name",
      "Mother Name",
      "Parent Contact / Phone",
      "Parent Email",
      "Permanent Address",
      "City",
      "State",
      "Zip Code",
      "Pickup Latitude",
      "Pickup Longitude",
      "ID Proof Type",
      "ID Proof Number",
      "ID Proof Document",
      "Previous School",
      "Previous Class Marks",
      "Previous Marksheet Document",
      "TC Number",
      "TC Issue Date",
      "TC Document"
    ];

    const rows = listToExport.map((s, idx) => [
      idx + 1,
      s.id || "",
      s.admissionNo || "",
      s.rollNo || "",
      s.name || "",
      s.email || "",
      s.phone || "",
      s.class || "",
      s.status || "Active",
      s.gender || "",
      s.dob || "",
      s.bloodGroup || "",
      s.fatherName || "",
      s.motherName || "",
      s.phone || "",
      s.parentEmail || "",
      s.address || "",
      s.city || "",
      s.state || "",
      s.zipCode || "",
      s.latitude || "",
      s.longitude || "",
      s.idProofType || "",
      s.idProofNumber || "",
      formatDocField(s.idProofFile, "ID Proof"),
      s.prevSchool || "",
      s.prevMarks || "",
      formatDocField(s.marksheetFile, s.marksheetFileName || "Marksheet"),
      s.tcNumber || "",
      s.tcIssueDate || "",
      formatDocField(s.tcFile, "Transfer Certificate")
    ]);
    
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.map(val => `"${val ? val.toString().replace(/"/g, '""') : ''}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Students_Directory_Complete_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Complete student directory exported successfully!");
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

    loadStudentsList();
    fetchClasses();
  }, [schoolId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1F2333" }}>
            🎓 Student Directory & Admissions
          </h2>
          <p style={{ fontSize: 13, color: "#6B7080", marginTop: 4 }}>
            Manage student registrations, academic statuses, personal details and parental credentials.
          </p>
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

          {/* Register New Student Button */}
          <button 
            onClick={handleOpenAdd}
            style={{
              padding: "10px 18px", 
              background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)", 
              color: "#fff", 
              border: "none",
              borderRadius: 10, 
              fontSize: 13.5, 
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
            ➕ Register New Student
          </button>
        </div>
      </div>

      {/* Search & Filter Bar — single row */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 20, background: "#fff", padding: "12px 20px", borderRadius: 16, border: "1px solid #E2E8F0" }}>

        {/* Search Input */}
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180, maxWidth: 320 }}>
          <input
            type="text"
            placeholder="🔍 Search by student name, roll no. or admission no..."
            value={searchStudent}
            onChange={(e) => setSearchStudent(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 14px",
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

        {/* Gender Filter */}
        <select
          value={filterGender}
          onChange={(e) => setFilterGender(e.target.value)}
          style={{ padding: "9px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#475569", background: "#fff", outline: "none" }}
        >
          <option value="All">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>

        {/* Blood Group Filter */}
        <select
          value={filterBloodGroup}
          onChange={(e) => setFilterBloodGroup(e.target.value)}
          style={{ padding: "9px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#475569", background: "#fff", outline: "none" }}
        >
          <option value="All">All Blood Groups</option>
          {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(bg => (
            <option key={bg} value={bg}>{bg}</option>
          ))}
        </select>

        {/* Clear Filters */}
        <button
          type="button"
          onClick={() => {
            setSearchStudent("");
            setFilterStatus("All");
            setFilterClass("All");
            setFilterGender("All");
            setFilterBloodGroup("All");
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

      <div style={{ 
        background: "#fff", 
        border: "1px solid #E2E8F0", 
        borderRadius: 18, 
        boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.04)",
        overflow: "hidden" 
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
            <thead>
              <tr style={{ background: "#F0F9FF", borderBottom: "2px solid #BAE6FD" }}>
                <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12.5, fontWeight: 800, color: "#64748B" }}>Roll No</th>
                <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12.5, fontWeight: 800, color: "#64748B" }}>Admission No</th>
                <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12.5, fontWeight: 800, color: "#64748B" }}>Student Details</th>
                <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12.5, fontWeight: 800, color: "#64748B" }}>Class</th>
                <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12.5, fontWeight: 800, color: "#64748B" }}>Parent & Guardian Details</th>
                <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12.5, fontWeight: 800, color: "#64748B" }}>DOB & Gender</th>
                <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12.5, fontWeight: 800, color: "#64748B" }}>Status</th>
                <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12.5, fontWeight: 800, color: "#64748B" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students
                .filter(s => {
                  const q = searchStudent.toLowerCase();
                  const matchesSearch = !q ||
                    s.name.toLowerCase().includes(q) ||
                    (s.rollNo || "").toLowerCase().includes(q) ||
                    (s.admissionNo || "").toLowerCase().includes(q);
                  const matchesStatus = filterStatus === "All" || (s.status || "Active") === filterStatus;
                  const matchesClass  = filterClass  === "All" || (s.class || "") === filterClass;
                  const matchesGender = filterGender === "All" || (s.gender || "") === filterGender;
                  const matchesBG     = filterBloodGroup === "All" || (s.bloodGroup || "") === filterBloodGroup;
                  return matchesSearch && matchesStatus && matchesClass && matchesGender && matchesBG;
                })
                .map(s => (
                <tr key={s.id} style={{ borderBottom: "1px solid #EFF2F6" }}>
                  <td style={{ padding: "16px 20px", fontSize: 13.5, fontWeight: 800, color: "#2563EB" }}>
                    {s.rollNo ? `#${s.rollNo}` : "—"}
                  </td>
                  <td style={{ padding: "16px 20px", fontSize: 13, fontWeight: 600, color: "#475569" }}>
                    {s.admissionNo || "—"}
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%", background: "#EFF6FF", color: "#2563EB",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 800
                      }}>
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <strong style={{ fontSize: 13.5, color: "#1E293B", display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span>{s.name}</span>
                          {s.prevMarks && (
                            <span style={{ background: "#EFF6FF", color: "#2563EB", padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 800 }} title="Previous Class Marks">
                              {s.prevMarks}
                            </span>
                          )}
                          {s.marksheetFile && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                viewFileInNewTab(s.marksheetFile);
                              }}
                              title="View Previous Marksheet"
                              style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 11, padding: 0 }}
                            >
                              📄
                            </button>
                          )}
                        </strong>
                        <span style={{ fontSize: 11.5, color: "#64748B", display: "block" }}>{s.email}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "16px 20px", fontSize: 13, fontWeight: 700, color: "#475569" }}>
                    {s.class}
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.4 }}>
                      <strong>Father:</strong> {s.fatherName || "—"}<br/>
                      <strong>Mother:</strong> {s.motherName || "—"}<br/>
                      <strong>Phone:</strong> {s.phone || "—"}
                    </div>
                  </td>
                  <td style={{ padding: "16px 20px", fontSize: 12.5, color: "#475569", lineHeight: 1.4 }}>
                    <div>
                      <strong>DOB:</strong> {s.dob || "—"}<br/>
                      <strong>Gender:</strong> {s.gender || "—"}{s.bloodGroup ? ` (${s.bloodGroup})` : ""}
                    </div>
                  </td>

                  <td style={{ padding: "16px 20px" }}>
                    <span style={{
                      padding: "4px 8px", borderRadius: 12, fontSize: 11.5, fontWeight: 700,
                      background: s.status === "Active" ? "#DCFCE7" : "#FEE2E2",
                      color: s.status === "Active" ? "#16A34A" : "#EF4444"
                    }}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button
                        onClick={() => {
                          setViewingStudent(s);
                          setIsViewModalOpen(true);
                        }}
                        className="btn-action-login"
                        title="View Profile"
                      >
                        <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="btn-action-edit"
                        title="Edit"
                      >
                        <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="btn-action-delete"
                        title="Delete"
                      >
                        <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <button
                        onClick={() => navigate(`/parent-portal/${s.id}`)}
                        className="btn-action-view"
                        title="Login as Parent"
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
              {editingStudent ? "✏️ Edit Admission Details" : "➕ Register New Student (Admission Form)"}
            </h3>
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* SECTION 1: STUDENT PROFILE */}
              <div>
                <h4 style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: 800, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.05em" }}>Student Profile</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Full Name</label>
                    <input 
                      type="text" required value={formName} onChange={e => setFormName(e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 30))}
                      placeholder="e.g. Rahul Gupta"
                      style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Student Email</label>
                    <input 
                      type="email" required value={formEmail}
                      onChange={e => setFormEmail(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9@._\-]/g, '')
                          .slice(0, 80)
                      )}
                      placeholder="student@school.com"
                      style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Date of Birth</label>
                    <input 
                      type="date" required value={formDob} onChange={e => setFormDob(e.target.value)}
                      style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5, background: "#fff" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Gender</label>
                    <select 
                      required
                      value={formGender} onChange={e => setFormGender(e.target.value)}
                      style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", background: "#fff", fontSize: 13.5 }}
                    >
                      <option value="">-- Select Gender --</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Blood Group</label>
                    <select 
                      value={formBloodGroup} onChange={e => setFormBloodGroup(e.target.value)}
                      style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", background: "#fff", fontSize: 13.5 }}
                    >
                      <option value="">-- Select Blood Group --</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: ACADEMIC ASSIGNMENT */}
              <div>
                <h4 style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: 800, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.05em" }}>Academic Enrolment</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Assigned Class *</label>
                    <select 
                      value={formClass} onChange={e => setFormClass(e.target.value)}
                      style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", background: "#fff", fontSize: 13.5 }}
                    >
                      <option value="">-- Select Class --</option>
                      {availableClasses.length > 0 ? (
                        availableClasses.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))
                      ) : (
                        <option value="" disabled>No classes created yet</option>
                      )}
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Roll Number</label>
                    <input 
                      type="text" required value={formRollNo} onChange={e => setFormRollNo(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      placeholder="e.g. 05"
                      style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Admission No.</label>
                    <input 
                      type="text" value={formAdmissionNo} onChange={e => setFormAdmissionNo(e.target.value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 15))}
                      placeholder="e.g. ADM-9021 (Auto if empty)"
                      style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: PARENT / GUARDIAN DETAILS */}
              <div>
                <h4 style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: 800, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.05em" }}>Parent / Guardian Details</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Father's/Guardian Name</label>
                    <input 
                      type="text" required value={formFatherName} onChange={e => setFormFatherName(e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 30))}
                      placeholder="e.g. Rajesh Gupta"
                      style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Mother's Name</label>
                    <input 
                      type="text" required value={formMotherName} onChange={e => setFormMotherName(e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 30))}
                      placeholder="e.g. Rita Gupta"
                      style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Parent Mobile</label>
                    <input 
                      type="text" required value={formPhone} onChange={e => setFormPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Parent Email Address</label>
                    <input 
                      type="email" required value={formParentEmail}
                      onChange={e => setFormParentEmail(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9@._\-]/g, '')
                          .slice(0, 80)
                      )}
                      placeholder="parent@school.com"
                      style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: ADDRESS & LOGISTICS */}
              <div>
                <h4 style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: 800, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.05em" }}>Residential Information</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Permanent Address *</label>
                  <textarea 
                    required value={formAddress} onChange={e => setFormAddress(e.target.value.slice(0, 100))}
                    placeholder="Enter resident house no., street, city, state and zipcode..."
                    style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5, minHeight: 50, fontFamily: "inherit", resize: "vertical" }}
                  />
                </div>

                {/* Optional GPS Location Coordinates for Pickup / Driver */}
                <div style={{ marginTop: 12, padding: "12px 14px", background: "#F8FAFC", borderRadius: 10, border: "1px dashed #CBD5E1" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "flex", alignItems: "center", gap: 5 }}>
                      📍 Map Pickup Coordinates <span style={{ color: "#64748B", fontWeight: 500, fontSize: 11 }}>(Optional — for Bus Route & Driver Navigation)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsMapPickerOpen(true)}
                      style={{
                        padding: "6px 12px", background: "#0284C7", color: "#fff", border: "none", borderRadius: 6,
                        fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 5
                      }}
                    >
                      🗺️ Select on Map
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 4 }}>Latitude (e.g. 28.6318)</label>
                      <input 
                        type="text"
                        value={formLatitude}
                        onChange={e => setFormLatitude(e.target.value.replace(/[^0-9.-]/g, ''))}
                        placeholder="e.g. 28.6318"
                        style={{ width: "100%", padding: "8px 10px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 12.5, outline: "none", background: "#fff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 4 }}>Longitude (e.g. 77.2901)</label>
                      <input 
                        type="text"
                        value={formLongitude}
                        onChange={e => setFormLongitude(e.target.value.replace(/[^0-9.-]/g, ''))}
                        placeholder="e.g. 77.2901"
                        style={{ width: "100%", padding: "8px 10px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 12.5, outline: "none", background: "#fff" }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>State *</label>
                    <input 
                      type="text" required value={formState} onChange={e => setFormState(e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 30))}
                      placeholder="e.g. Rajasthan"
                      style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>City *</label>
                    <input 
                      type="text" required value={formCity} onChange={e => setFormCity(e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 30))}
                      placeholder="e.g. Jaipur"
                      style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Zip Code *</label>
                    <input 
                      type="text" required value={formZipCode} onChange={e => setFormZipCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="e.g. 302001"
                      style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: IDENTIFICATION DOCUMENTS */}
              <div>
                <h4 style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: 800, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.05em" }}>Identification Documents</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>ID Document Type</label>
                    <select 
                      value={formIdProofType} onChange={e => handleIdProofTypeChange(e.target.value)}
                      style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", background: "#fff", fontSize: 13.5 }}
                    >
                      <option value="Aadhaar Card">Aadhaar Card</option>
                      <option value="Birth Certificate">Birth Certificate</option>
                      <option value="Passport">Passport</option>
                      <option value="Ration Card">Ration Card</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>ID Document Number</label>
                    <input 
                      type="text" required value={formIdProofNumber} onChange={e => handleIdProofNumberChange(e.target.value)}
                      placeholder={getIdPlaceholder()}
                      style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>Upload Document Scan (PDF/JPG)</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleIdProofUpload}
                    style={{ fontSize: 11, color: "#64748B" }}
                  />
                  {formIdProofFile && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: "#10B981", fontWeight: 700 }}>✓ {formIdProofFileName || "File Loaded"}</span>
                      <button 
                        type="button" 
                        onClick={() => viewFileInNewTab(formIdProofFile)}
                        style={{ padding: "2px 6px", background: "#D8EEFF", color: "#2563EB", border: "none", borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                      >
                        👁️ View
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 6: PREVIOUS SCHOOL & TRANSFER CERTIFICATE (TC) */}
              <div>
                <h4 style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: 800, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.05em" }}>Previous School & Transfer Certificate (TC)</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Previous School Name</label>
                    <input 
                      type="text" value={formPrevSchool} onChange={e => setFormPrevSchool(e.target.value.replace(/[^a-zA-Z0-9\s.-]/g, '').slice(0, 100))}
                      placeholder="e.g. Greenwood High School"
                      style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>TC Number</label>
                    <input 
                      type="text" value={formTcNumber} onChange={e => setFormTcNumber(e.target.value.replace(/[^a-zA-Z0-9\/-]/g, '').slice(0, 20))}
                      placeholder="e.g. TC-99212"
                      style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>TC Issue Date</label>
                    <input 
                      type="date" value={formTcIssueDate} onChange={e => setFormTcIssueDate(e.target.value)}
                      style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5, background: "#fff" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>TC Scan / Photo (Upload)</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleTcUpload}
                      style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}
                    />
                    {formTcFile && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: "#10B981", fontWeight: 700 }}>✓ {formTcFileName || "File Loaded"}</span>
                        <button 
                          type="button" 
                          onClick={() => viewFileInNewTab(formTcFile)}
                          style={{ padding: "2px 6px", background: "#D8EEFF", color: "#2563EB", border: "none", borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                        >
                          👁️ View
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 7: PREVIOUS ACADEMIC RECORD */}
              <div>
                <h4 style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: 800, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.05em" }}>Previous Academic Record</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Previous Class Marks (%)</label>
                    <input 
                      type="text" value={formPrevMarks} onChange={e => setFormPrevMarks(e.target.value.replace(/[^0-9.%]/g, '').slice(0, 6))}
                      placeholder="e.g. 85%"
                      style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Upload Previous Marksheet (PDF / Image)</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                      <input 
                        type="file" 
                        accept="image/*,application/pdf"
                        onChange={handleMarksheetUpload}
                        style={{ fontSize: 11, color: "#64748B" }}
                      />
                      {formMarksheetFile && (
                        <button 
                          type="button" 
                          onClick={() => viewFileInNewTab(formMarksheetFile)}
                          style={{ padding: "4px 8px", background: "#D8EEFF", color: "#2563EB", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                        >
                          👁️ View
                        </button>
                      )}
                    </div>
                    {formMarksheetFileName && (
                      <span style={{ fontSize: 11, color: "#10B981", fontWeight: 700, marginTop: 4 }}>✓ {formMarksheetFileName} Loaded</span>
                    )}
                  </div>
                </div>
              </div>

              {/* SECURITY / STATUS */}
              <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 16 }}>
                {!editingStudent ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Login Password</label>
                    <input 
                      type="password" required value={formPassword} onChange={e => setFormPassword(e.target.value)}
                      placeholder="Enter login password"
                      style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                    />
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Admission Status</label>
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

              {/* ACTION FOOTER BUTTONS */}
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
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Details Modal ── */}
      {isViewModalOpen && viewingStudent && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          fontFamily: "inherit"
        }}>
          <div style={{
            background: "#fff", padding: 32, borderRadius: 20, width: 950, maxWidth: "95vw",
            maxHeight: "85vh", overflowY: "auto",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)",
            border: "1px solid #E2E8F0"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottom: "1px solid #E2E8F0", paddingBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", background: "#E0F2FE", color: "#0284C7",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800
                }}>
                  {viewingStudent.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#0F172A" }}>
                    {viewingStudent.name}
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: 13, color: "#64748B" }}>
                    Admission No: <strong>{viewingStudent.admissionNo || "—"}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                style={{
                  background: "#F1F5F9", color: "#64748B", border: "none", width: 36, height: 36, borderRadius: "50%",
                  fontSize: 18, fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#E2E8F0"; e.currentTarget.style.color = "#0F172A"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#F1F5F9"; e.currentTarget.style.color = "#64748B"; }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {/* SECTION 1: Personal & Academic Summary */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
                {/* Profile Card */}
                <div style={{ background: "#F8FAFC", padding: 20, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                  <h4 style={{ margin: "0 0 16px 0", fontSize: 14, fontWeight: 800, color: "#0284C7", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 }}>
                    👤 Personal Information
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", textTransform: "uppercase" }}>Full Name</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{viewingStudent.name}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", textTransform: "uppercase" }}>Student Email</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{viewingStudent.email || "—"}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", textTransform: "uppercase" }}>Date of Birth</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{viewingStudent.dob || "—"}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", textTransform: "uppercase" }}>Gender</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{viewingStudent.gender || "—"}</span>
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", textTransform: "uppercase" }}>Blood Group</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{viewingStudent.bloodGroup || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Academic Enrollment */}
                <div style={{ background: "#F8FAFC", padding: 20, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                  <h4 style={{ margin: "0 0 16px 0", fontSize: 14, fontWeight: 800, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 }}>
                    🎓 Academic Enrollment
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", textTransform: "uppercase" }}>Assigned Class</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{viewingStudent.class || "—"}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", textTransform: "uppercase" }}>Roll Number</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{viewingStudent.rollNo || "—"}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", textTransform: "uppercase" }}>Status</span>
                        <span style={{
                          padding: "3px 8px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                          background: viewingStudent.status === "Active" ? "#DCFCE7" : "#FEE2E2",
                          color: viewingStudent.status === "Active" ? "#16A34A" : "#EF4444",
                          display: "inline-block", marginTop: 2
                        }}>
                          {viewingStudent.status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", textTransform: "uppercase" }}>Admission Number</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{viewingStudent.admissionNo || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Parent Details */}
                <div style={{ background: "#F8FAFC", padding: 20, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                  <h4 style={{ margin: "0 0 16px 0", fontSize: 14, fontWeight: 800, color: "#7C3AED", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 }}>
                    👨‍👩‍👦 Parent & Guardian
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", textTransform: "uppercase" }}>Father's Name</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{viewingStudent.fatherName || "—"}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", textTransform: "uppercase" }}>Mother's Name</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{viewingStudent.motherName || "—"}</span>
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", textTransform: "uppercase" }}>Parent Mobile</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{viewingStudent.phone || "—"}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", textTransform: "uppercase" }}>Parent Email</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{viewingStudent.parentEmail || "—"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Address & Identity */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(430px, 1fr))", gap: 24 }}>
                {/* Residential Address */}
                <div style={{ background: "#F8FAFC", padding: 20, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                  <h4 style={{ margin: "0 0 16px 0", fontSize: 14, fontWeight: 800, color: "#0D9488", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    📍 Residential Address
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", textTransform: "uppercase" }}>Street Address</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", lineHeight: 1.4 }}>{viewingStudent.address || "—"}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", textTransform: "uppercase" }}>City</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{viewingStudent.city || "—"}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", textTransform: "uppercase" }}>State</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{viewingStudent.state || "—"}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", textTransform: "uppercase" }}>Zip Code</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{viewingStudent.zipCode || "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Identity Proof */}
                <div style={{ background: "#F8FAFC", padding: 20, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                  <h4 style={{ margin: "0 0 16px 0", fontSize: 14, fontWeight: 800, color: "#EA580C", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    🆔 Identification Documents
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", textTransform: "uppercase" }}>Document Type</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{viewingStudent.idProofType || "—"}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", textTransform: "uppercase" }}>Document Number</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{viewingStudent.idProofNumber || "—"}</span>
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", textTransform: "uppercase" }}>Document Scan File</span>
                      {viewingStudent.idProofFile ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                          <span style={{ fontSize: 13, color: "#10B981", fontWeight: 700 }}>✓ Document Attached</span>
                          <button
                            type="button"
                            onClick={() => viewFileInNewTab(viewingStudent.idProofFile)}
                            style={{
                              padding: "4px 10px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE",
                              borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4
                            }}
                          >
                            👁️ View Document
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 13, color: "#64748B", fontStyle: "italic" }}>No document uploaded</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Academic Record & TC */}
              <div style={{ background: "#F8FAFC", padding: 20, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                <h4 style={{ margin: "0 0 16px 0", fontSize: 14, fontWeight: 800, color: "#DB2777", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  📜 Previous Academic Record & Transfer Certificate (TC)
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", textTransform: "uppercase" }}>Previous School Name</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{viewingStudent.prevSchool || "—"}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", textTransform: "uppercase" }}>TC Number</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{viewingStudent.tcNumber || "—"}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", textTransform: "uppercase" }}>TC Issue Date</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{viewingStudent.tcIssueDate || "—"}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", textTransform: "uppercase" }}>Prev Class Marks / GPA</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{viewingStudent.prevMarks || "—"}</span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20, borderTop: "1px solid #E2E8F0", paddingTop: 16 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", textTransform: "uppercase" }}>Transfer Certificate Scan</span>
                    {viewingStudent.tcFile ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                        <span style={{ fontSize: 13, color: "#10B981", fontWeight: 700 }}>✓ TC Scan Attached</span>
                        <button
                          type="button"
                          onClick={() => viewFileInNewTab(viewingStudent.tcFile)}
                          style={{
                            padding: "4px 10px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE",
                            borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer"
                          }}
                        >
                          👁️ View TC
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 13, color: "#64748B", fontStyle: "italic" }}>No TC file uploaded</span>
                    )}
                  </div>

                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", textTransform: "uppercase" }}>Previous Marksheet File</span>
                    {viewingStudent.marksheetFile ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                        <span style={{ fontSize: 13, color: "#10B981", fontWeight: 700 }}>✓ Marksheet Attached</span>
                        <button
                          type="button"
                          onClick={() => viewFileInNewTab(viewingStudent.marksheetFile)}
                          style={{
                            padding: "4px 10px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE",
                            borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer"
                          }}
                        >
                          👁️ View Marksheet
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 13, color: "#64748B", fontStyle: "italic" }}>No marksheet uploaded</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 28, borderTop: "1px solid #E2E8F0", paddingTop: 20 }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  padding: "10px 20px", background: "#F1F5F9", border: "none", borderRadius: 8,
                  fontWeight: 700, color: "#475569", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6
                }}
              >
                🖨️ Print Details
              </button>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                style={{
                  padding: "10px 20px", background: "#0284C7", border: "none", borderRadius: 8,
                  fontWeight: 700, color: "#fff", cursor: "pointer"
                }}
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Pickup Location Picker Modal */}
      <MapPickerModal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        initialLat={formLatitude}
        initialLng={formLongitude}
        onConfirm={(lat, lng) => {
          setFormLatitude(lat);
          setFormLongitude(lng);
        }}
      />
    </div>
  );
}
