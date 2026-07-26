import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Building, Users, AlertTriangle, IndianRupee, 
  ArrowUpRight, TrendingUp, Calendar, CheckCircle2,
  Clock, Coffee, Bell, FileText, Send, Trash2, X, Search, Phone, Plus
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip
} from "recharts";
import { 
  hostelRoomsApi, hostelStudentsApi, hostelMaintenanceApi, 
  hostelPaymentsApi, hostelOutingsApi 
} from "../../services/api";

export default function WardenHome() {
  const navigate = useNavigate();
  const { schoolId } = useParams();

  // Academic Session State
  const [session, setSession] = useState("2026-2027");

  // Dynamic Overview Metrics state
  const [stats, setStats] = useState({
    totalHostels: 0,
    totalRooms: 0,
    occupiedBeds: 0,
    availableBeds: 0,
    pendingMaintenance: 0,
    revenueCollected: 0,
    revenuePending: 0
  });

  // Today's Mess Menu
  const [messMenu] = useState({
    breakfast: "Aloo Paratha & Curd / Tea",
    lunch: "Kadi Pakoda, Jeera Rice, Roti & Salad",
    snacks: "Samosa / Chai",
    dinner: "Dal Tadka, Paneer Bhurji, Roti & Kheer"
  });

  // Interactive Warden Sticky Note
  const [stickyNote, setStickyNote] = useState(() => {
    return localStorage.getItem(`sms_${schoolId}_hostel_sticky_note`) || "Welcome to the Hostel Warden Dashboard. Add or import records to view analytics.";
  });
  const [noteInput, setNoteInput] = useState("");

  // Authentic Student Hostel Operations Logs
  const [recentActivities, setRecentActivities] = useState([]);

  // Hostel Students Directory State (Placed at the bottom of the dashboard)
  const [studentsList, setStudentsList] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [roomsRes, studentsRes, maintRes, paymentsRes, logsRes] = await Promise.all([
          hostelRoomsApi.getAll({ schoolId, limit: 1000 }),
          hostelStudentsApi.getAll({ schoolId, limit: 1000 }).catch(() => ({ data: [] })),
          hostelMaintenanceApi.getAll({ schoolId, limit: 1000 }).catch(() => ({ data: [] })),
          hostelPaymentsApi.getAll({ schoolId, limit: 1000 }).catch(() => ({ data: [] })),
          hostelOutingsApi.getAll({ schoolId, limit: 10 }).catch(() => ({ data: [] }))
        ]);

        const roomsList = roomsRes.data || [];
        const studentsListRaw = studentsRes.data || [];
        const maintList = maintRes.data || [];
        const paymentsList = paymentsRes.data || [];
        const outingsList = logsRes.data || [];

        const totalRooms = roomsList.length;
        const blocksSet = new Set(roomsList.map(r => r.block || "Block A (Boys)"));
        const totalHostels = roomsList.length > 0 ? blocksSet.size : 0;
        const totalCapacity = roomsList.reduce((acc, r) => acc + (Number(r.capacity) || 0), 0);
        const occupiedBeds = roomsList.reduce((acc, r) => acc + (Number(r.occupied) || 0), 0);
        const availableBeds = Math.max(0, totalCapacity - occupiedBeds);

        const pendingMaintenance = maintList.filter(m => 
          m.status === "Pending" || m.status === "Open" || m.status === "In Progress"
        ).length;

        const revenueCollected = paymentsList
          .filter(p => p.status === "Paid")
          .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

        const revenuePending = paymentsList
          .filter(p => p.status === "Pending" || p.status === "Overdue")
          .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

        setStats({
          totalHostels,
          totalRooms,
          occupiedBeds,
          availableBeds,
          pendingMaintenance,
          revenueCollected,
          revenuePending
        });

        setStudentsList(studentsListRaw.map(s => ({
          id: s.id,
          name: s.name || s.studentName,
          room: s.roomNumber || "N/A",
          block: s.block || "Block A (Boys)",
          status: s.status || "Inside",
          contact: s.parentPhone || "N/A"
        })));

        setRecentActivities(outingsList.map(o => ({
          id: o.id,
          studentName: o.studentName,
          action: o.type || "Outing",
          time: o.createdAt ? o.createdAt.split('T')[0] : "Today",
          details: `Destination: ${o.destination || 'N/A'}`
        })));

      } catch (err) {
        console.warn("Could not load warden dashboard statistics:", err);
      }
    };
    loadDashboardData();
  }, [schoolId]);
  // Student directory search query
  const [studentSearch, setStudentSearch] = useState("");

  // Selected Activity detail popup state
  const [selectedLogDetail, setSelectedLogDetail] = useState(null);

  // Chart data
  const monthlyData = [
    { name: "Jan", Collected: 95000, Pending: 15000 },
    { name: "Feb", Collected: 110000, Pending: 20000 },
    { name: "Mar", Collected: 120000, Pending: 18000 },
    { name: "Apr", Collected: 115000, Pending: 25000 },
    { name: "May", Collected: 130000, Pending: 12000 },
    { name: "Jun", Collected: 124000, Pending: 42000 }
  ];

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    setStickyNote(noteInput);
    localStorage.setItem(`sms_${schoolId}_hostel_sticky_note`, noteInput);
    setNoteInput("");
  };

  // Filter students list in directory
  const filteredStudents = studentsList.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
    s.id.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.room.includes(studentSearch)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
      
      {/* HEADER WITH SESSION SELECTOR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.5px" }}>Warden Control Panel</h1>
          <p style={{ margin: "2px 0 0 0", color: "#64748B", fontSize: 13.5 }}>Oversee hostel allotments, mess records, security curfews, and maintenance logs.</p>
        </div>
        
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {/* Academic Session Changer */}
          <div style={{ display: "flex", gap: 8, background: "#fff", padding: "6px 12px", borderRadius: 10, border: "1px solid #E2E8F0", alignItems: "center" }}>
            <Calendar size={15} style={{ color: "#4F46E5" }} />
            <select
              value={session}
              onChange={(e) => setSession(e.target.value)}
              style={{ border: "none", background: "transparent", fontSize: 12.5, fontWeight: 700, color: "#475569", outline: "none", cursor: "pointer" }}
            >
              <option value="2026-2027">Session: 2026-2027</option>
              <option value="2025-2026">Session: 2025-2026</option>
              <option value="2027-2028">Session: 2027-2028</option>
            </select>
          </div>


        </div>
      </div>

      {/* METRICS ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        {/* Card 1 */}
        <div 
          onClick={() => navigate(`/hostel-portal/${schoolId}/rooms`)}
          style={{ cursor: "pointer", background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)", transition: "transform 0.15s ease" }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "none"}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 12.5, color: "#64748B", fontWeight: 700 }}>Total Hostels</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#4F46E5" }}>
              <Building size={16} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#0F172A" }}>{stats.totalHostels} Blocks</div>
          <span style={{ fontSize: 11.5, color: "#64748B", marginTop: 6 }}>{stats.totalRooms} Rooms Managed</span>
        </div>

        {/* Card 2 */}
        <div 
          onClick={() => navigate(`/hostel-portal/${schoolId}/allotments`)}
          style={{ cursor: "pointer", background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)", transition: "transform 0.15s ease" }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "none"}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 12.5, color: "#64748B", fontWeight: 700 }}>Hostel Occupancy</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981" }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#0F172A" }}>{stats.occupiedBeds} Allotted</div>
          <span style={{ fontSize: 11.5, color: "#10B981", fontWeight: 700, display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
            <TrendingUp size={13} /> {((stats.occupiedBeds / (stats.occupiedBeds + stats.availableBeds)) * 100).toFixed(0)}% Bed Occupancy
          </span>
        </div>

        {/* Card 3 */}
        <div 
          onClick={() => navigate(`/hostel-portal/${schoolId}/maintenance`)}
          style={{ cursor: "pointer", background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)", transition: "transform 0.15s ease" }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "none"}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 12.5, color: "#64748B", fontWeight: 700 }}>Pending Repairs</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444" }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#0F172A" }}>{stats.pendingMaintenance} Tickets</div>
          <span style={{ fontSize: 11.5, color: "#EF4444", fontWeight: 700, marginTop: 6 }}>Requires Warden Attention</span>
        </div>

        {/* Card 4 */}
        <div 
          onClick={() => navigate(`/hostel-portal/${schoolId}/payments`)}
          style={{ cursor: "pointer", background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)", transition: "transform 0.15s ease" }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "none"}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 12.5, color: "#64748B", fontWeight: 700 }}>Hostel Fees Collected</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FDF2F8", display: "flex", alignItems: "center", justifyContent: "center", color: "#DB2777" }}>
              <IndianRupee size={15} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#0F172A" }}>₹{(stats.revenueCollected / 1000).toFixed(0)}k MTD</div>
          <span style={{ fontSize: 11.5, color: "#64748B", marginTop: 6 }}>₹{(stats.revenuePending / 1000).toFixed(0)}k Dues Outstanding</span>
        </div>
      </div>

      {/* CORE HOSTEL MODULES: QUICK ACTIONS */}
      <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #E2E8F0", padding: 20, boxShadow: "0 4px 10px rgba(0,0,0,0.01)" }}>
        <h2 style={{ fontSize: 15, fontWeight: 900, color: "#0F172A", margin: "0 0 14px 0" }}>Hostel Warden Quick Actions</h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
          
          <button 
            onClick={() => navigate(`/hostel-portal/${schoolId}/allotments`)}
            style={{ 
              padding: "16px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, 
              display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start", cursor: "pointer", 
              transition: "all 0.15s", width: "100%", textAlign: "left" 
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#4F46E5"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#E2E8F0"}
          >
            <span style={{ fontSize: 20 }}>🔑</span>
            <strong style={{ fontSize: 13, color: "#1E293B" }}>Allot Room & Bed</strong>
            <span style={{ fontSize: 11, color: "#64748B" }}>Check-in a student & allocate room.</span>
          </button>

          <button 
            onClick={() => navigate(`/hostel-portal/${schoolId}/payments`)}
            style={{ 
              padding: "16px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, 
              display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start", cursor: "pointer", 
              transition: "all 0.15s", width: "100%", textAlign: "left"
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#DB2777"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#E2E8F0"}
          >
            <span style={{ fontSize: 20 }}>💳</span>
            <strong style={{ fontSize: 13, color: "#1E293B" }}>Collect Fees / Fine</strong>
            <span style={{ fontSize: 11, color: "#64748B" }}>Record student mess/hostel dues.</span>
          </button>

          <button 
            onClick={() => navigate(`/hostel-portal/${schoolId}/maintenance`)}
            style={{ 
              padding: "16px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, 
              display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start", cursor: "pointer", 
              transition: "all 0.15s", width: "100%", textAlign: "left"
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#EF4444"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#E2E8F0"}
          >
            <span style={{ fontSize: 20 }}>🛠️</span>
            <strong style={{ fontSize: 13, color: "#1E293B" }}>Add Repair Complaint</strong>
            <span style={{ fontSize: 11, color: "#64748B" }}>Open carpentry, electrical ticket.</span>
          </button>

          <button 
            onClick={() => navigate(`/hostel-portal/${schoolId}/visitors`)}
            style={{ 
              padding: "16px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, 
              display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start", cursor: "pointer", 
              transition: "all 0.15s", width: "100%", textAlign: "left"
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#10B981"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#E2E8F0"}
          >
            <span style={{ fontSize: 20 }}>📝</span>
            <strong style={{ fontSize: 13, color: "#1E293B" }}>Register Gate Visitor</strong>
            <span style={{ fontSize: 11, color: "#64748B" }}>Log entries for parents or guests.</span>
          </button>
          
        </div>
      </div>

      {/* --- MOVED FEATURE: HOSTEL STUDENTS QUICK DIRECTORY --- */}
      <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #E2E8F0", padding: 24, boxShadow: "0 4px 10px rgba(0,0,0,0.01)", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 900, color: "#0F172A", margin: 0 }}>Hostel Residents Directory</h2>
            <span style={{ fontSize: 12, color: "#64748B" }}>Quick access to student contact details and current status.</span>
          </div>

          {/* Quick Search inside Directory */}
          <div style={{ position: "relative", width: 260 }}>
            <input
              type="text"
              placeholder="Search resident name, ID or Room..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px 10px 36px", border: "1.5px solid #CBD5E1",
                borderRadius: 10, fontSize: 12.5, outline: "none"
              }}
            />
            <Search size={15} style={{ position: "absolute", left: 12, top: 12, color: "#94A3B8" }} />
          </div>
        </div>

        {/* Directory Table */}
        <div style={{ overflowX: "auto", border: "1px solid #F1F5F9", borderRadius: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1.5px solid #E2E8F0" }}>
                <th style={{ padding: "12px 16px", fontWeight: 800, color: "#475569", textAlign: "left" }}>Resident Name</th>
                <th style={{ padding: "12px 16px", fontWeight: 800, color: "#475569", textAlign: "left" }}>Student Roll ID</th>
                <th style={{ padding: "12px 16px", fontWeight: 800, color: "#475569", textAlign: "left" }}>Room / Block</th>
                <th style={{ padding: "12px 16px", fontWeight: 800, color: "#475569", textAlign: "left" }}>Current Status</th>
                <th style={{ padding: "12px 16px", fontWeight: 800, color: "#475569", textAlign: "left" }}>Emergency Contact</th>
                <th style={{ padding: "12px 16px", fontWeight: 800, color: "#475569", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: "24px", textAlign: "center", color: "#64748B" }}>No matching residents found in this block.</td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0F172A" }}>{student.name}</td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>{student.id}</td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>Room {student.room} • {student.block}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        fontSize: 10.5, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                        background: student.status === "Inside" ? "#ECFDF5" : student.status === "Outside" ? "#FFF4E5" : "#F3E8FF",
                        color: student.status === "Inside" ? "#047857" : student.status === "Outside" ? "#B45309" : "#7C3AED",
                      }}>
                        {student.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
                      <Phone size={12} style={{ color: "#94A3B8" }} />
                      <a href={`tel:${student.contact}`} style={{ color: "#4F46E5", textDecoration: "none", fontWeight: 600 }}>{student.contact}</a>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <button 
                        onClick={() => navigate(`/hostel-portal/${schoolId}/students`)}
                        style={{ padding: "6px 12px", background: "#EEF2FF", border: "1px solid #E0E7FF", color: "#4F46E5", borderRadius: 8, fontSize: 11.5, cursor: "pointer", fontWeight: 700 }}
                      >
                        View Locker
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MIDDLE SECTION: CHARTS */}
      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 24, alignItems: "stretch" }}>
        
        {/* Revenue collected chart */}
        <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #E2E8F0", padding: 24, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.01)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 900, color: "#0F172A", margin: 0 }}>Fee Collections Trend</h2>
              <span style={{ fontSize: 12, color: "#64748B" }}>Compare Collected vs Pending hostel fees.</span>
            </div>
          </div>

          <div style={{ height: 240, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorColl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorPend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="Collected" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#colorColl)" />
                <Area type="monotone" dataKey="Pending" stroke="#EF4444" strokeWidth={1.5} fillOpacity={1} fill="url(#colorPend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mess Menu Card */}
        <div style={{ 
          background: "#FFFbeb", 
          borderRadius: 18, 
          border: "1px solid #FDE68A", 
          padding: 24, 
          display: "flex", 
          flexDirection: "column", 
          gap: 16, 
          boxShadow: "0 10px 15px -3px rgba(251, 191, 36, 0.05)" 
        }}>
          <div style={{ display: "flex", justifyBetween: "space-between", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Coffee size={18} style={{ color: "#D97706" }} />
              <strong style={{ fontSize: 15, color: "#92400E" }}>Today's Mess Menu</strong>
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, padding: "4px 8px", borderRadius: 6, background: "#FEF3C7", color: "#B45309" }}>
              ACTIVE MENU
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 12.5, color: "#78350F" }}>
            <div style={{ borderLeft: "3.5px solid #FBBF24", paddingLeft: 10 }}>
              <div style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 10, color: "#B45309" }}>Breakfast (07:30 AM - 09:00 AM)</div>
              <div style={{ marginTop: 2, fontWeight: 600 }}>{messMenu.breakfast}</div>
            </div>
            <div style={{ borderLeft: "3.5px solid #FBBF24", paddingLeft: 10 }}>
              <div style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 10, color: "#B45309" }}>Lunch (12:30 PM - 02:00 PM)</div>
              <div style={{ marginTop: 2, fontWeight: 600 }}>{messMenu.lunch}</div>
            </div>
            <div style={{ borderLeft: "3.5px solid #FBBF24", paddingLeft: 10 }}>
              <div style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 10, color: "#B45309" }}>Evening Tea (05:00 PM - 06:00 PM)</div>
              <div style={{ marginTop: 2, fontWeight: 600 }}>{messMenu.snacks}</div>
            </div>
            <div style={{ borderLeft: "3.5px solid #FBBF24", paddingLeft: 10 }}>
              <div style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 10, color: "#B45309" }}>Dinner (08:00 PM - 09:30 PM)</div>
              <div style={{ marginTop: 2, fontWeight: 600 }}>{messMenu.dinner}</div>
            </div>
          </div>
        </div>

      </div>

      {/* LOWER GRID: OPERATIONS LOGS & WARDEN STICKY NOTE */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24 }}>
        
        {/* Warden Operations Log */}
        <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #E2E8F0", padding: 24, boxShadow: "0 4px 10px rgba(0,0,0,0.01)" }}>
          <div style={{ display: "flex", justifyBetween: "space-between", alignItems: "center", marginBottom: 20, justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 15, fontWeight: 900, color: "#0F172A", margin: 0 }}>Warden Operations Log</h2>
            <span style={{ fontSize: 11, color: "#64748B" }}>Real-time updates</span>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {recentActivities.map((act) => (
              <div key={act.id} style={{ display: "flex", justifyBetween: "space-between", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F1F5F9", paddingBottom: 12 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: act.category === "Gate Pass" ? "#EEF2FF" : act.category === "Discipline" ? "#FEF2F2" : act.category === "Mess attendance" ? "#FFF4E5" : "#F0FDF4",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16
                  }}>
                    {act.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>{act.action}</div>
                    <div style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 2 }}>{act.time} • <strong style={{ color: "#64748B" }}>{act.category}</strong></div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLogDetail(act)}
                  style={{ 
                    fontSize: 12, color: "#4F46E5", fontWeight: 700, cursor: "pointer", 
                    background: "none", border: "none", textDecoration: "underline" 
                  }}
                >
                  Details
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Sticky Notes (Noticeboard) */}
        <div style={{ 
          background: "#FEFCE8", 
          borderRadius: 18, 
          border: "1px solid #FEF08A", 
          padding: 24, 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "space-between", 
          gap: 16,
          boxShadow: "0 4px 10px rgba(0,0,0,0.01)" 
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Bell size={18} style={{ color: "#CA8A04" }} />
              <strong style={{ fontSize: 15, color: "#854D0E" }}>Warden Notice Board</strong>
            </div>

            <div style={{ 
              background: "#FFF", 
              border: "1px solid #FEF08A", 
              borderRadius: 12, 
              padding: 16, 
              fontSize: 12.5, 
              color: "#713F12",
              fontFamily: "monospace",
              lineHeight: "1.6",
              minHeight: 120,
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
            }}>
              {stickyNote}
            </div>
          </div>

          <form onSubmit={handleAddNote} style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="Post a new warden note..."
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              style={{
                flex: 1, padding: "8px 12px", border: "1px solid #E2E8F0",
                borderRadius: 8, fontSize: 12.5, background: "#fff", outline: "none"
              }}
            />
            <button
              type="submit"
              style={{
                padding: "8px 12px", background: "#CA8A04", color: "#fff",
                border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center"
              }}
            >
              <Send size={14} />
            </button>
          </form>
        </div>

      </div>



      {/* --- DETAIL MODAL FOR WARDEN OPERATIONS LOG --- */}
      {selectedLogDetail && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "#fff", padding: 32, borderRadius: 20, width: "90%", maxWidth: 440,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)"
          }}>
            <div style={{ display: "flex", justifyBetween: "space-between", alignItems: "center", marginBottom: 20, justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 22 }}>{selectedLogDetail.icon}</span>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#0F172A" }}>Operation Details</h3>
              </div>
              <button 
                onClick={() => setSelectedLogDetail(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 13.5, color: "#475569", marginBottom: 28 }}>
              <div><strong>Action Log:</strong> {selectedLogDetail.action}</div>
              <div><strong>Logged Time:</strong> {selectedLogDetail.time}</div>
              <div><strong>Category:</strong> <span style={{ textTransform: "uppercase", fontSize: 11, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: "#EEF2FF", color: "#4F46E5" }}>{selectedLogDetail.category}</span></div>
              <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 12, marginTop: 4 }}>
                <strong>Full Report:</strong>
                <p style={{ margin: "6px 0 0 0", background: "#F8FAFC", padding: 12, borderRadius: 8, fontSize: 13, border: "1px solid #E2E8F0", fontStyle: "italic", lineHeight: "1.5" }}>
                  {selectedLogDetail.details}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setSelectedLogDetail(null)}
                style={{ padding: "10px 20px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
