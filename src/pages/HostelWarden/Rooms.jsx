import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Bed, Building, Plus, Sparkles, Trash2, ShieldAlert, Edit2, Eye, Download, Users, FileText } from "lucide-react";
import { toast } from "sonner";
import { hostelsApi, hostelRoomsApi } from "../../services/api";

export default function Rooms() {
  const { schoolId } = useParams();

  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);

  // Fetch from backend API on mount — no fallback to localStorage dummy data
  useEffect(() => {
    // Clear any stale dummy data from localStorage that had hardcoded ids "1" or "2"
    const clearDummyLocalStorage = () => {
      try {
        const savedHostels = JSON.parse(localStorage.getItem(`sms_${schoolId}_hostels`) || "[]");
        const hasDummy = savedHostels.some(h => h.id === "1" || h.id === "2");
        if (hasDummy) {
          localStorage.removeItem(`sms_${schoolId}_hostels`);
          localStorage.removeItem(`sms_${schoolId}_hostel_rooms`);
        }
      } catch (e) {}
    };
    clearDummyLocalStorage();

    hostelsApi.getAll({ schoolId }).then(res => {
      if (res && res.data && Array.isArray(res.data)) {
        setHostels(res.data);
        // Auto-select first hostel so rooms display immediately
        if (res.data.length > 0) {
          setSelectedHostel(res.data[0].id);
          setNewRoomHostelId(res.data[0].id);
        }
      }
    }).catch(() => {});

    hostelRoomsApi.getAll({ schoolId }).then(res => {
      if (res && res.data && Array.isArray(res.data)) {
        setRooms(res.data);
      }
    }).catch(() => {});
  }, [schoolId]);


  // Helper to get exact occupants of a room from allotments, students, or seed fallback
  const getRoomOccupants = (hostelId, roomNo) => {
    const targetHostelName = hostelId === "1" ? "Block A - Boys Hostel" : "Block B - Girls Hostel";
    let occupants = [];

    // 1. Check allotments store
    const savedAllotmentsStr = localStorage.getItem(`sms_${schoolId}_hostel_allotments`);
    if (savedAllotmentsStr) {
      const currentAllotments = JSON.parse(savedAllotmentsStr);
      occupants = currentAllotments.filter(al => 
        al.status === "Active" && 
        (al.hostelName === targetHostelName || 
         (hostelId === "1" && al.hostelName && al.hostelName.includes("Boys")) || 
         (hostelId === "2" && al.hostelName && al.hostelName.includes("Girls"))) && 
        String(al.roomNumber).trim() === String(roomNo).trim()
      );
    }

    // 2. If empty, check students store
    if (occupants.length === 0) {
      const savedStudentsStr = localStorage.getItem(`sms_${schoolId}_hostel_students`);
      if (savedStudentsStr) {
        const currentStudents = JSON.parse(savedStudentsStr);
        occupants = currentStudents.filter(st => 
          st.status === "Active" && 
          (st.block === targetHostelName || 
           (hostelId === "1" && st.block && st.block.includes("Boys")) || 
           (hostelId === "2" && st.block && st.block.includes("Girls"))) && 
          String(st.roomNumber).trim() === String(roomNo).trim()
        ).map(st => ({
          id: st.id,
          studentName: st.name,
          studentId: st.id,
          checkInDate: st.checkInDate || "2026-07-01",
          status: st.status || "Active",
          rent: st.rent || (hostelId === "1" ? 5500 : 6000)
        }));
      }
    }

    return occupants;
  };

  const getOccupiedCount = (hostelId, roomNo) => {
    return getRoomOccupants(hostelId, roomNo).length;
  };

  const handleExportRoomsCSV = () => {
    const headers = ["Room Number,Block/Wing,Type,Capacity,Occupied Beds,Monthly Rent (INR),Floor"];
    const rows = filteredRooms.map(r => {
      const occ = getOccupiedCount(r.hostelId, r.roomNumber);
      const hostelName = hostels.find(h => h.id === r.hostelId)?.name || (r.hostelId === "1" ? "Block A - Boys Hostel" : "Block B - Girls Hostel");
      return `"${r.roomNumber}","${hostelName}","${r.type}",${r.capacity},${occ},${r.rent},"${r.floor}"`;
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Hostel_Rooms_Report_${schoolId || "All"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Rooms report exported as CSV.");
  };

  const [selectedHostel, setSelectedHostel] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("All");

  // Add Floor Modal
  const [showAddFloorModal, setShowAddFloorModal] = useState(false);
  const [newFloorName, setNewFloorName] = useState("");
  
  // View Room Modal State
  const [showViewRoomModal, setShowViewRoomModal] = useState(false);
  const [viewingRoom, setViewingRoom] = useState(null);

  // View Block Modal State
  const [showViewHostelModal, setShowViewHostelModal] = useState(false);
  const [viewingHostel, setViewingHostel] = useState(null);

  // Add Hostel Modal State
  const [showHostelModal, setShowHostelModal] = useState(false);
  const [newHostelName, setNewHostelName] = useState("");
  const [newHostelType, setNewHostelType] = useState("Boys");

  // Add Room Modal State
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [newRoomHostelId, setNewRoomHostelId] = useState("");
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newRoomType, setNewRoomType] = useState("AC");
  const [newRoomCapacity, setNewRoomCapacity] = useState("3");
  const [newRoomRent, setNewRoomRent] = useState("");
  const [newRoomFloor, setNewRoomFloor] = useState("1st Floor");

  // Edit Room Modal State
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [editRoomNumber, setEditRoomNumber] = useState("");
  const [editRoomType, setEditRoomType] = useState("AC");
  const [editRoomCapacity, setEditRoomCapacity] = useState("3");
  const [editRoomRent, setEditRoomRent] = useState("");
  const [editRoomFloor, setEditRoomFloor] = useState("1st Floor");

  // Edit Block Modal State
  const [showEditHostelModal, setShowEditHostelModal] = useState(false);
  const [editingHostel, setEditingHostel] = useState(null);
  const [editHostelName, setEditHostelName] = useState("");
  const [editHostelType, setEditHostelType] = useState("Boys");

  const filteredRooms = rooms.filter(
    (room) =>
      (!selectedHostel || String(room.hostelId) === String(selectedHostel)) &&
      (selectedFloor === "All" || room.floor === selectedFloor)
  );

  const [floors, setFloors] = useState(["All", "1st Floor", "2nd Floor", "3rd Floor"]);

  const handleAddHostel = async (e) => {
    e.preventDefault();
    if (!newHostelName.trim()) {
      toast.error("Hostel block name is required.");
      return;
    }
    const blockNameRegex = /^[A-Za-z0-9\s\-()]+$/;
    if (!blockNameRegex.test(newHostelName.trim())) {
      toast.error("Hostel block name should not contain special symbols like @#$%&*.");
      return;
    }
    const newH = {
      id: String(Date.now()),
      name: newHostelName.trim(),
      type: newHostelType,
      totalRooms: 0,
      schoolId: schoolId || ""
    };
    
    try {
      await hostelsApi.create(newH);
    } catch (err) {
      // fallback to local if API offline
    }

    setHostels([...hostels, newH]);
    setNewHostelName("");
    setShowHostelModal(false);
    toast.success(`Hostel block "${newH.name}" created successfully.`);
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!newRoomNumber.trim()) {
      toast.error("Room number is required.");
      return;
    }
    const roomNoRegex = /^[A-Za-z0-9\-]+$/;
    if (!roomNoRegex.test(newRoomNumber.trim())) {
      toast.error("Room Number can only contain letters, numbers, and dashes (e.g. 101 or B-201). Special characters are not allowed.");
      return;
    }
    if (!newRoomRent.trim() || Number(newRoomRent) <= 0 || isNaN(Number(newRoomRent))) {
      toast.error("Please enter a valid positive monthly rent.");
      return;
    }
    if (Number(newRoomCapacity) <= 0 || isNaN(Number(newRoomCapacity))) {
      toast.error("Bed capacity must be greater than 0.");
      return;
    }
    const targetHostelId = newRoomHostelId || selectedHostel;
    const exists = rooms.some(r => String(r.hostelId) === String(targetHostelId) && r.roomNumber.trim().toLowerCase() === newRoomNumber.trim().toLowerCase());
    if (exists) {
      toast.error(`Room ${newRoomNumber} already exists in this block.`);
      return;
    }

    const newR = {
      id: String(Date.now()),
      hostelId: targetHostelId,
      roomNumber: newRoomNumber.trim(),
      type: newRoomType,
      capacity: Number(newRoomCapacity),
      occupied: 0,
      rent: Number(newRoomRent),
      floor: newRoomFloor,
      schoolId: schoolId || ""
    };

    try {
      await hostelRoomsApi.create(newR);
    } catch (err) {
      // fallback to local
    }

    setRooms([...rooms, newR]);
    setHostels(hostels.map(h => h.id === selectedHostel ? { ...h, totalRooms: (h.totalRooms || 0) + 1 } : h));

    setNewRoomNumber("");
    setNewRoomRent("");
    setShowRoomModal(false);
    toast.success(`Room ${newR.roomNumber} added successfully.`);
  };

  const handleEditRoomSubmit = async (e) => {
    e.preventDefault();
    if (!editRoomNumber.trim()) {
      toast.error("Room number is required.");
      return;
    }
    if (!editRoomRent.toString().trim() || Number(editRoomRent) <= 0 || isNaN(Number(editRoomRent))) {
      toast.error("Please enter a valid positive monthly rent.");
      return;
    }
    if (Number(editRoomCapacity) <= 0 || isNaN(Number(editRoomCapacity))) {
      toast.error("Bed capacity must be greater than 0.");
      return;
    }
    const occ = getOccupiedCount(editingRoom.hostelId, editingRoom.roomNumber);
    if (Number(editRoomCapacity) < occ) {
      toast.error(`Cannot reduce capacity to ${editRoomCapacity} as ${occ} beds are currently occupied.`);
      return;
    }

    const updated = rooms.map(r => {
      if (r.id === editingRoom.id) {
        return {
          ...r,
          roomNumber: editRoomNumber.trim(),
          type: editRoomType,
          capacity: Number(editRoomCapacity),
          rent: Number(editRoomRent),
          floor: editRoomFloor
        };
      }
      return r;
    });
    setRooms(updated);
    try { await hostelRoomsApi.update(editingRoom.id, updated.find(r => r.id === editingRoom.id)); } catch (err) {}
    setShowEditRoomModal(false);
    setEditingRoom(null);
    toast.success("Room details updated successfully.");
  };

  const handleDeleteRoom = async (room) => {
    const occ = getOccupiedCount(room.hostelId, room.roomNumber);
    if (occ > 0) {
      toast.error(`Cannot delete Room ${room.roomNumber} because ${occ} beds are currently occupied!`);
      return;
    }
    if (window.confirm(`Are you sure you want to delete Room ${room.roomNumber}?`)) {
      setRooms(rooms.filter(r => r.id !== room.id));
      setHostels(hostels.map(h => h.id === room.hostelId ? { ...h, totalRooms: Math.max(0, (h.totalRooms || 1) - 1) } : h));
      try { await hostelRoomsApi.delete(room.id); } catch (err) {}
      toast.success(`Room ${room.roomNumber} deleted.`);
    }
  };

  const handleEditHostelSubmit = async (e) => {
    e.preventDefault();
    if (!editHostelName.trim()) {
      toast.error("Hostel block name is required.");
      return;
    }
    const updated = hostels.map(h => h.id === editingHostel.id ? { ...h, name: editHostelName.trim(), type: editHostelType } : h);
    setHostels(updated);
    try { await hostelsApi.update(editingHostel.id, updated.find(h => h.id === editingHostel.id)); } catch (err) {}
    setShowEditHostelModal(false);
    setEditingHostel(null);
    toast.success("Hostel block updated successfully.");
  };

  const handleDeleteHostel = async (hostel, e) => {
    e.stopPropagation();
    const hasOccupiedRooms = rooms.some(r => r.hostelId === hostel.id && getOccupiedCount(r.hostelId, r.roomNumber) > 0);
    if (hasOccupiedRooms) {
      toast.error(`Cannot delete block "${hostel.name}" because some rooms are currently occupied by students.`);
      return;
    }
    if (window.confirm(`Are you sure you want to delete block "${hostel.name}"?`)) {
      setHostels(hostels.filter(h => h.id !== hostel.id));
      setRooms(rooms.filter(r => r.hostelId !== hostel.id));
      if (selectedHostel === hostel.id) {
        const remaining = hostels.filter(h => h.id !== hostel.id);
        if (remaining.length > 0) setSelectedHostel(remaining[0].id);
      }
      try { await hostelsApi.delete(hostel.id); } catch (err) {}
      toast.success(`Hostel block "${hostel.name}" deleted.`);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, paddingBottom: 40 }}>
      
      {/* Header section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.5px" }}>Rooms & Beds Management</h1>
          <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: 14 }}>Real-time bed allocation visualizer and room config.</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => setShowHostelModal(true)}
            style={{
              padding: "11px 20px",
              background: "#EEF2FF",
              color: "#4F46E5",
              border: "none",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 13.5,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.15s ease"
            }}
          >
            <Building size={16} /> <span>Add Block</span>
          </button>
          <button
            onClick={() => { setNewRoomHostelId(selectedHostel || (hostels[0]?.id ?? "")); setShowRoomModal(true); }}
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
            <Plus size={16} /> <span>Add Room</span>
          </button>
          <button
            onClick={handleExportRoomsCSV}
            style={{
              padding: "11px 20px",
              background: "#10B981",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 13.5,
              cursor: "pointer",
              boxShadow: "0 4px 12px -2px rgba(16, 185, 129, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.15s ease"
            }}
          >
            <Download size={16} /> <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Buildings Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        {hostels.map((hostel) => {
          const isActive = selectedHostel === hostel.id;
          return (
            <div
              key={hostel.id}
              onClick={() => setSelectedHostel(hostel.id)}
              style={{
                background: "#fff",
                borderRadius: 18,
                padding: 24,
                border: isActive ? "2.5px solid #4F46E5" : "1px solid #E2E8F0",
                boxShadow: isActive ? "0 10px 25px -8px rgba(79, 70, 229, 0.22)" : "0 4px 6px -1px rgba(0,0,0,0.01)",
                cursor: "pointer",
                position: "relative",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: isActive ? "translateY(-2px)" : "none"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "4px 10px",
                  borderRadius: 8,
                  background: hostel.type === "Boys" ? "#E0F2FE" : "#FCE7F3",
                  color: hostel.type === "Boys" ? "#0369A1" : "#BE185D",
                  letterSpacing: "0.5px"
                }}>
                  {hostel.type.toUpperCase()} WING
                </span>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingHostel(hostel);
                      setShowViewHostelModal(true);
                    }}
                    title="View Block Overview & Rooms"
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "#10B981", padding: 4 }}
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingHostel(hostel);
                      setEditHostelName(hostel.name);
                      setEditHostelType(hostel.type);
                      setShowEditHostelModal(true);
                    }}
                    title="Edit Block"
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748B", padding: 4 }}
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteHostel(hostel, e)}
                    title="Delete Block"
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "#EF4444", padding: 4 }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", margin: "0 0 6px 0" }}>{hostel.name}</h3>
              <p style={{ margin: 0, fontSize: 13.5, color: "#64748B" }}>Total Rooms: <strong style={{ color: "#334155" }}>{hostel.totalRooms || rooms.filter(r => r.hostelId === hostel.id).length} Rooms</strong></p>
            </div>
          );
        })}
      </div>

      {/* Floor Filter Tabs */}
      <div style={{ display: "flex", gap: 12, borderBottom: "1.5px solid #E2E8F0", paddingBottom: 16, alignItems: "center" }}>
        {floors.map((fl) => {
          const isSel = selectedFloor === fl;
          return (
            <button
              key={fl}
              onClick={() => setSelectedFloor(fl)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                background: isSel ? "#4F46E5" : "transparent",
                color: isSel ? "#fff" : "#64748B",
                border: "none",
                fontSize: 13.5,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              {fl}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => { setNewFloorName(""); setShowAddFloorModal(true); }}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: "1px dashed #4F46E5",
            background: "transparent",
            color: "#4F46E5",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer",
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 4
          }}
        >
          <Plus size={14} /> Add Floor
        </button>
        {selectedFloor !== "All" && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Are you sure you want to remove ${selectedFloor}?`)) {
                setFloors(floors.filter(f => f !== selectedFloor));
                setSelectedFloor("All");
              }
            }}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px dashed #EF4444",
              background: "transparent",
              color: "#EF4444",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
          >
            <Trash2 size={14} /> Remove Floor
          </button>
        )}
      </div>

      {/* Table of Rooms & Beds Management */}
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
                <th style={{ padding: "16px 20px", fontWeight: 800, color: "#475569" }}>Room & Floor</th>
                <th style={{ padding: "16px 20px", fontWeight: 800, color: "#475569" }}>Hostel Block</th>
                <th style={{ padding: "16px 20px", fontWeight: 800, color: "#475569" }}>Type & Monthly Rent</th>
                <th style={{ padding: "16px 20px", fontWeight: 800, color: "#475569" }}>Beds Occupancy Status</th>
                <th style={{ padding: "16px 20px", fontWeight: 800, color: "#475569", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
                    No rooms found on this floor.
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => {
                  const occupiedBeds = getOccupiedCount(room.hostelId, room.roomNumber);
                  const isFull = occupiedBeds >= room.capacity;
                  const availableBeds = room.capacity - occupiedBeds;
                  const hostelName = hostels.find(h => h.id === room.hostelId)?.name || (room.hostelId === "1" ? "Block A (Boys)" : "Block B (Girls)");

                  return (
                    <tr key={room.id} style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.15s ease" }} onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      
                      {/* 1. Room Number & Floor */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: 10, background: "#EEF2FF", color: "#4F46E5",
                            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, flexShrink: 0
                          }}>
                            {room.roomNumber}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: "#0F172A", fontSize: 14 }}>Room {room.roomNumber}</div>
                            <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{room.floor}</div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Hostel Block */}
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{ fontWeight: 700, color: "#1E293B" }}>{hostelName}</span>
                      </td>

                      {/* 3. Type & Rent */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 6,
                            background: room.type === "AC" ? "#ECFDF5" : "#F8FAFC",
                            color: room.type === "AC" ? "#047857" : "#475569",
                            border: room.type === "AC" ? "1px solid #A7F3D0" : "1px solid #E2E8F0"
                          }}>
                            {room.type}
                          </span>
                          <span style={{ fontWeight: 800, color: "#0F172A" }}>
                            ₹{room.rent ? room.rent.toLocaleString() : "0"}/mo
                          </span>
                        </div>
                      </td>

                      {/* 4. Bed Occupancy Status */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            {Array.from({ length: room.capacity }).map((_, idx) => {
                              const occupied = idx < occupiedBeds;
                              return (
                                <div
                                  key={idx}
                                  title={occupied ? "Occupied Bed" : "Available Bed"}
                                  style={{
                                    width: 26, height: 26, borderRadius: 6,
                                    background: occupied ? "rgba(239, 68, 68, 0.08)" : "rgba(16, 185, 129, 0.08)",
                                    border: occupied ? "1.5px solid #EF4444" : "1.5px solid #10B981",
                                    color: occupied ? "#EF4444" : "#10B981",
                                    display: "flex", alignItems: "center", justifyContent: "center"
                                  }}
                                >
                                  <Bed size={13} />
                                </div>
                              );
                            })}
                            <span style={{
                              fontSize: 11.5, fontWeight: 800, marginLeft: 6,
                              color: isFull ? "#EF4444" : "#10B981"
                            }}>
                              {isFull ? "FULL" : `${availableBeds} Bed${availableBeds > 1 ? "s" : ""} Available`}
                            </span>
                          </div>
                          <span style={{ fontSize: 11.5, color: "#64748B" }}>
                            {occupiedBeds} / {room.capacity} beds occupied
                          </span>
                        </div>
                      </td>

                      {/* 5. Actions */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
                          <button
                            onClick={() => {
                              setViewingRoom(room);
                              setShowViewRoomModal(true);
                            }}
                            title="View Occupants"
                            style={{
                              padding: "7px 12px", borderRadius: 8, background: "#F0FDF4", color: "#10B981",
                              fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1px solid #DCFCE7",
                              display: "flex", alignItems: "center", gap: 6
                            }}
                          >
                            <Eye size={14} /> Occupants
                          </button>

                          <button
                            onClick={() => {
                              setEditingRoom(room);
                              setEditRoomNumber(room.roomNumber);
                              setEditRoomType(room.type);
                              setEditRoomCapacity(String(room.capacity));
                              setEditRoomRent(String(room.rent));
                              setEditRoomFloor(room.floor);
                              setShowEditRoomModal(true);
                            }}
                            title="Edit Room"
                            style={{
                              padding: "7px 10px", borderRadius: 8, background: "#EEF2FF", color: "#4F46E5",
                              border: "1px solid #E0E7FF", fontSize: 12, fontWeight: 700, cursor: "pointer"
                            }}
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            onClick={() => handleDeleteRoom(room)}
                            title="Delete Room"
                            style={{
                              padding: "7px 10px", borderRadius: 8, background: "#FEF2F2", color: "#EF4444",
                              border: "1px solid #FEE2E2", fontSize: 12, fontWeight: 700, cursor: "pointer"
                            }}
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

      {/* Add Hostel Modal */}
      {showHostelModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(6px)"
        }}>
          <div style={{
            background: "#fff", padding: "28px 32px", borderRadius: 20, width: "100%", maxWidth: 420,
            boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.5px" }}>Add Hostel Block</h3>
              <button
                type="button"
                onClick={() => setShowHostelModal(false)}
                style={{ background: "none", border: "none", color: "#94A3B8", fontSize: 20, cursor: "pointer", padding: "4px 8px", borderRadius: 6 }}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddHostel}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Hostel Block Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Block C - Senior Wing"
                    value={newHostelName}
                    onChange={(e) => setNewHostelName(e.target.value)}
                    style={{
                      width: "100%", padding: "11px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10,
                      fontSize: 14, outline: "none", color: "#0F172A", fontWeight: 600, boxSizing: "border-box"
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Hostel Type</label>
                  <select
                    value={newHostelType}
                    onChange={(e) => setNewHostelType(e.target.value)}
                    style={{
                      width: "100%", padding: "11px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10,
                      fontSize: 14, outline: "none", background: "#fff", color: "#0F172A", fontWeight: 600, boxSizing: "border-box", cursor: "pointer"
                    }}
                  >
                    <option value="Boys">Boys Hostel</option>
                    <option value="Girls">Girls Hostel</option>
                    <option value="Co-ed">Co-ed Hostel</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowHostelModal(false)}
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
                  Create Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {showRoomModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(6px)"
        }}>
          <div style={{
            background: "#fff", padding: "28px 32px", borderRadius: 20, width: "100%", maxWidth: 460,
            boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.5px" }}>Add New Room</h3>
              <button
                type="button"
                onClick={() => setShowRoomModal(false)}
                style={{ background: "none", border: "none", color: "#94A3B8", fontSize: 20, cursor: "pointer", padding: "4px 8px", borderRadius: 6 }}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddRoom}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: "span 2" }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>1. Select Hostel Block *</label>
                  <select
                    value={newRoomHostelId}
                    onChange={(e) => setNewRoomHostelId(e.target.value)}
                    style={{
                      width: "100%", padding: "11px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10,
                      fontSize: 14, outline: "none", background: "#fff", color: "#0F172A", fontWeight: 600,
                      boxSizing: "border-box", cursor: "pointer"
                    }}
                  >
                    {(hostels && hostels.length > 0 ? hostels : [
                      { id: "1", name: "Block A - Boys Hostel", type: "Boys" },
                      { id: "2", name: "Block B - Girls Hostel", type: "Girls" }
                    ]).map(h => (
                      <option key={h.id} value={h.id}>{h.name} ({h.type || "Hostel"})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>2. Select Floor *</label>
                  <select
                    value={newRoomFloor}
                    onChange={(e) => setNewRoomFloor(e.target.value)}
                    style={{
                      width: "100%", padding: "11px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10,
                      fontSize: 14, outline: "none", background: "#fff", color: "#0F172A", fontWeight: 600,
                      boxSizing: "border-box", cursor: "pointer"
                    }}
                  >
                    {floors.filter(f => f !== "All").map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>3. Room Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. 104"
                    value={newRoomNumber}
                    onChange={(e) => setNewRoomNumber(e.target.value)}
                    style={{
                      width: "100%", padding: "11px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10,
                      fontSize: 14, outline: "none", color: "#0F172A", fontWeight: 600, boxSizing: "border-box"
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Room Type</label>
                  <select
                    value={newRoomType}
                    onChange={(e) => setNewRoomType(e.target.value)}
                    style={{
                      width: "100%", padding: "11px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10,
                      fontSize: 14, outline: "none", background: "#fff", color: "#0F172A", fontWeight: 600,
                      boxSizing: "border-box", cursor: "pointer"
                    }}
                  >
                    <option value="AC">AC Room</option>
                    <option value="Non-AC">Non-AC Room</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Bed Capacity</label>
                  <select
                    value={newRoomCapacity}
                    onChange={(e) => setNewRoomCapacity(e.target.value)}
                    style={{
                      width: "100%", padding: "11px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10,
                      fontSize: 14, outline: "none", background: "#fff", color: "#0F172A", fontWeight: 600,
                      boxSizing: "border-box", cursor: "pointer"
                    }}
                  >
                    <option value="1">1 Bed (Single)</option>
                    <option value="2">2 Beds</option>
                    <option value="3">3 Beds</option>
                    <option value="4">4 Beds</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: "span 2" }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Monthly Rent (INR)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={newRoomRent}
                    onChange={(e) => setNewRoomRent(e.target.value)}
                    style={{
                      width: "100%", padding: "11px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10,
                      fontSize: 14, outline: "none", color: "#0F172A", fontWeight: 600, boxSizing: "border-box"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
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
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Room Modal */}
      {showViewRoomModal && viewingRoom && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "#fff", borderRadius: 24, width: "100%", maxWidth: 650,
            padding: 32, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            maxHeight: "90vh", overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", margin: 0 }}>Room {viewingRoom.roomNumber} Details</h2>
                <p style={{ margin: "4px 0 0 0", fontSize: 14, color: "#64748B" }}>
                  {hostels.find(h => h.id === viewingRoom.hostelId)?.name || "Hostel Block"} • {viewingRoom.floor} • {viewingRoom.type}
                </p>
              </div>
              <button
                onClick={() => {
                  const occupants = getRoomOccupants(viewingRoom.hostelId, viewingRoom.roomNumber);
                  const headers = ["Student Name,Roll Number/ID,Check-In Date,Monthly Rent,Status"];
                  const rows = occupants.map(o => `"${o.studentName}","${o.studentId}","${o.checkInDate || 'N/A'}",${o.rent},"${o.status}"`);
                  const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", `Room_${viewingRoom.roomNumber}_Residents_Slip.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success(`Room ${viewingRoom.roomNumber} resident slip downloaded.`);
                }}
                style={{
                  padding: "9px 16px", background: "#EEF2FF", color: "#4F46E5", border: "none",
                  borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6
                }}
              >
                <Download size={15} /> Download Slip
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, background: "#F8FAFC", padding: 18, borderRadius: 14, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Total Capacity</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#0F172A", marginTop: 4 }}>{viewingRoom.capacity} Beds</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Occupied Beds</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#4F46E5", marginTop: 4 }}>{getOccupiedCount(viewingRoom.hostelId, viewingRoom.roomNumber)} Beds</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Monthly Rent</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#10B981", marginTop: 4 }}>₹{viewingRoom.rent.toLocaleString()}</div>
              </div>
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", marginBottom: 14 }}>Current Residents ({getRoomOccupants(viewingRoom.hostelId, viewingRoom.roomNumber).length})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 280, overflowY: "auto" }}>
              {getRoomOccupants(viewingRoom.hostelId, viewingRoom.roomNumber).length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0", background: "#F8FAFC", borderRadius: 12, color: "#64748B" }}>
                  No students currently assigned to this room.
                </div>
              ) : (
                getRoomOccupants(viewingRoom.hostelId, viewingRoom.roomNumber).map((occ, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12 }}>
                    <div>
                      <div style={{ fontWeight: 800, color: "#0F172A", fontSize: 14.5 }}>{occ.studentName}</div>
                      <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 2 }}>ID: {occ.studentId} • Check-In: {occ.checkInDate || "Active"} • Rent: ₹{occ.rent || viewingRoom.rent}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ background: "#ECFDF5", color: "#047857", padding: "4px 10px", borderRadius: 6, fontSize: 11.5, fontWeight: 800 }}>
                        ACTIVE
                      </span>
                      <button
                        onClick={() => {
                          const headers = ["Student Name,ID,Room,Hostel Block,Check-In Date,Status,Rent"];
                          const row = `"${occ.studentName}","${occ.studentId}","${viewingRoom.roomNumber}","${hostels.find(h => h.id === viewingRoom.hostelId)?.name || 'Hostel Block'}","${occ.checkInDate || 'Active'}","Active",${occ.rent || viewingRoom.rent}`;
                          const csv = "data:text/csv;charset=utf-8," + [headers, row].join("\n");
                          const link = document.createElement("a");
                          link.setAttribute("href", encodeURI(csv));
                          link.setAttribute("download", `Resident_${occ.studentId}_Profile_Slip.csv`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          toast.success(`Resident profile slip for ${occ.studentName} downloaded.`);
                        }}
                        style={{ background: "#F0FDF4", border: "1px solid #DCFCE7", color: "#10B981", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}
                        title="Download Resident Slip"
                      >
                        <Download size={13} /> Slip
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
              <button
                type="button"
                onClick={() => setShowViewRoomModal(false)}
                style={{ padding: "11px 24px", borderRadius: 12, border: "1px solid #CBD5E1", background: "#fff", color: "#475569", fontWeight: 700, cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Block Details & Rooms Overview Modal */}
      {showViewHostelModal && viewingHostel && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "#fff", borderRadius: 24, width: "100%", maxWidth: 720,
            padding: 32, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            maxHeight: "90vh", overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 8,
                  background: viewingHostel.type === "Boys" ? "#E0F2FE" : "#FCE7F3",
                  color: viewingHostel.type === "Boys" ? "#0369A1" : "#BE185D"
                }}>
                  {viewingHostel.type.toUpperCase()} HOSTEL WING
                </span>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", margin: "8px 0 0 0" }}>{viewingHostel.name}</h2>
              </div>
              <button
                onClick={() => {
                  const blockRooms = rooms.filter(r => r.hostelId === viewingHostel.id);
                  const headers = ["Room Number,Floor,Type,Capacity,Occupied Beds,Monthly Rent"];
                  const rows = blockRooms.map(r => `"${r.roomNumber}","${r.floor}","${r.type}",${r.capacity},${getOccupiedCount(r.hostelId, r.roomNumber)},${r.rent}`);
                  const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
                  const link = document.createElement("a");
                  link.setAttribute("href", encodeURI(csvContent));
                  link.setAttribute("download", `Hostel_Block_${viewingHostel.name.replace(/\s+/g, '_')}_Rooms.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success(`Hostel Block ${viewingHostel.name} register downloaded.`);
                }}
                style={{
                  padding: "9px 16px", background: "#EEF2FF", color: "#4F46E5", border: "none",
                  borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6
                }}
              >
                <Download size={15} /> Export Wing Register
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, background: "#F8FAFC", padding: 18, borderRadius: 14, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Total Rooms</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#0F172A", marginTop: 4 }}>
                  {rooms.filter(r => r.hostelId === viewingHostel.id).length} Rooms
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Total Bed Capacity</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#4F46E5", marginTop: 4 }}>
                  {rooms.filter(r => r.hostelId === viewingHostel.id).reduce((sum, r) => sum + (Number(r.capacity) || 0), 0)} Beds
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Occupied Beds</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#10B981", marginTop: 4 }}>
                  {rooms.filter(r => r.hostelId === viewingHostel.id).reduce((sum, r) => sum + getOccupiedCount(r.hostelId, r.roomNumber), 0)} Occupied
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", marginBottom: 14 }}>Wing Rooms & Occupancy Summary</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 300, overflowY: "auto" }}>
              {rooms.filter(r => r.hostelId === viewingHostel.id).length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0", background: "#F8FAFC", borderRadius: 12, color: "#64748B" }}>
                  No rooms created in this block yet.
                </div>
              ) : (
                rooms.filter(r => r.hostelId === viewingHostel.id).map((rm, idx) => {
                  const occ = getOccupiedCount(rm.hostelId, rm.roomNumber);
                  const isFull = occ >= Number(rm.capacity);
                  return (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12 }}>
                      <div>
                        <div style={{ fontWeight: 800, color: "#0F172A", fontSize: 14.5 }}>Room {rm.roomNumber} ({rm.type})</div>
                        <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 2 }}>Floor: {rm.floor} • Monthly Rent: ₹{rm.rent.toLocaleString()}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{
                          background: isFull ? "#FEF2F2" : "#ECFDF5",
                          color: isFull ? "#EF4444" : "#047857",
                          padding: "4px 10px", borderRadius: 6, fontSize: 11.5, fontWeight: 800
                        }}>
                          {occ} / {rm.capacity} Beds ({isFull ? "FULL" : "AVAILABLE"})
                        </span>
                        <button
                          onClick={() => {
                            setShowViewHostelModal(false);
                            setViewingRoom(rm);
                            setShowViewRoomModal(true);
                          }}
                          style={{ background: "#F0FDF4", border: "1px solid #DCFCE7", color: "#10B981", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}
                          title="View Room Details"
                        >
                          <Eye size={13} /> View Room
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
              <button
                type="button"
                onClick={() => setShowViewHostelModal(false)}
                style={{ padding: "11px 24px", borderRadius: 12, border: "1px solid #CBD5E1", background: "#fff", color: "#475569", fontWeight: 700, cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {showEditRoomModal && editingRoom && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(6px)"
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, width: "100%", maxWidth: 500,
            padding: "28px 32px", boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0F172A" }}>Edit Room {editingRoom.roomNumber}</h3>
              <button
                type="button"
                onClick={() => setShowEditRoomModal(false)}
                style={{ background: "none", border: "none", color: "#94A3B8", fontSize: 20, cursor: "pointer", padding: "4px 8px", borderRadius: 6 }}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleEditRoomSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Room Number</label>
                  <input
                    type="text"
                    value={editRoomNumber}
                    onChange={(e) => setEditRoomNumber(e.target.value)}
                    required
                    style={{
                      width: "100%", padding: "11px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10,
                      fontSize: 14, outline: "none", color: "#0F172A", fontWeight: 600, boxSizing: "border-box"
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Floor Location</label>
                  <select
                    value={editRoomFloor}
                    onChange={(e) => setEditRoomFloor(e.target.value)}
                    style={{
                      width: "100%", padding: "11px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10,
                      fontSize: 14, outline: "none", background: "#fff", color: "#0F172A", fontWeight: 600,
                      boxSizing: "border-box", cursor: "pointer"
                    }}
                  >
                    <option value="1st Floor">1st Floor</option>
                    <option value="2nd Floor">2nd Floor</option>
                    <option value="3rd Floor">3rd Floor</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Room Type</label>
                  <select
                    value={editRoomType}
                    onChange={(e) => setEditRoomType(e.target.value)}
                    style={{
                      width: "100%", padding: "11px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10,
                      fontSize: 14, outline: "none", background: "#fff", color: "#0F172A", fontWeight: 600,
                      boxSizing: "border-box", cursor: "pointer"
                    }}
                  >
                    <option value="AC">AC Room</option>
                    <option value="Non-AC">Non-AC Room</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Bed Capacity</label>
                  <select
                    value={editRoomCapacity}
                    onChange={(e) => setEditRoomCapacity(e.target.value)}
                    style={{
                      width: "100%", padding: "11px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10,
                      fontSize: 14, outline: "none", background: "#fff", color: "#0F172A", fontWeight: 600,
                      boxSizing: "border-box", cursor: "pointer"
                    }}
                  >
                    <option value="1">1 Bed (Single)</option>
                    <option value="2">2 Beds</option>
                    <option value="3">3 Beds</option>
                    <option value="4">4 Beds</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: "span 2" }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Monthly Rent (INR)</label>
                  <input
                    type="number"
                    value={editRoomRent}
                    onChange={(e) => setEditRoomRent(e.target.value)}
                    required
                    style={{
                      width: "100%", padding: "11px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10,
                      fontSize: 14, outline: "none", color: "#0F172A", fontWeight: 600, boxSizing: "border-box"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowEditRoomModal(false)}
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
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Block Modal */}
      {showEditHostelModal && editingHostel && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(6px)"
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, width: "100%", maxWidth: 440,
            padding: "28px 32px", boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0F172A" }}>Edit Block Wing</h3>
              <button
                type="button"
                onClick={() => setShowEditHostelModal(false)}
                style={{ background: "none", border: "none", color: "#94A3B8", fontSize: 20, cursor: "pointer", padding: "4px 8px", borderRadius: 6 }}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleEditHostelSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Hostel Block Name</label>
                  <input
                    type="text"
                    value={editHostelName}
                    onChange={(e) => setEditHostelName(e.target.value)}
                    required
                    style={{
                      width: "100%", padding: "11px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10,
                      fontSize: 14, outline: "none", color: "#0F172A", fontWeight: 600, boxSizing: "border-box"
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>Wing Type</label>
                  <select
                    value={editHostelType}
                    onChange={(e) => setEditHostelType(e.target.value)}
                    style={{
                      width: "100%", padding: "11px 14px", border: "1.5px solid #CBD5E1", borderRadius: 10,
                      fontSize: 14, outline: "none", background: "#fff", color: "#0F172A", fontWeight: 600,
                      boxSizing: "border-box", cursor: "pointer"
                    }}
                  >
                    <option value="Boys">Boys Wing</option>
                    <option value="Girls">Girls Wing</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowEditHostelModal(false)}
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
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Floor Modal ───────────────────────────── */}
      {showAddFloorModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            background: "#fff", borderRadius: 20, padding: 32, width: "100%", maxWidth: 420,
            boxShadow: "0 25px 60px -15px rgba(0,0,0,0.3)"
          }}>
            <h2 style={{ margin: "0 0 6px 0", fontSize: 20, fontWeight: 900, color: "#0F172A" }}>Add New Floor</h2>
            <p style={{ margin: "0 0 24px 0", fontSize: 13.5, color: "#64748B" }}>Add a new floor tab to organize rooms by level.</p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const name = newFloorName.trim();
              if (!name) { toast.error("Floor name is required."); return; }
              if (floors.includes(name)) { toast.error(`"${name}" floor already exists.`); return; }
              setFloors([...floors, name]);
              setSelectedFloor(name);
              setShowAddFloorModal(false);
              setNewFloorName("");
              toast.success(`Floor "${name}" added successfully.`);
            }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
                  Floor Name *
                </label>
                <input
                  autoFocus
                  value={newFloorName}
                  onChange={e => setNewFloorName(e.target.value)}
                  placeholder="e.g. 4th Floor, Ground Floor, Terrace"
                  style={{
                    width: "100%", padding: "11px 14px", border: "1.5px solid #CBD5E1",
                    borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box",
                    fontFamily: "inherit"
                  }}
                  onFocus={e => e.target.style.borderColor = "#4F46E5"}
                  onBlur={e => e.target.style.borderColor = "#CBD5E1"}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button type="button" onClick={() => setShowAddFloorModal(false)}
                  style={{ padding: "10px 20px", border: "1px solid #CBD5E1", borderRadius: 10, fontSize: 13.5, cursor: "pointer", background: "#F8FAFC", color: "#475569", fontWeight: 700 }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ padding: "10px 22px", background: "linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)", color: "#fff", border: "none", borderRadius: 10, fontSize: 13.5, cursor: "pointer", fontWeight: 700, boxShadow: "0 4px 12px rgba(79,70,229,0.3)" }}>
                  Add Floor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
