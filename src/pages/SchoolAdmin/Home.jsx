import { useState, useEffect } from "react";
import { usersApi, schoolsApi, attendanceApi, mapSchoolFromBackend } from "../../services/api";
import { 
  Users, UserCheck, DollarSign, Plus, Calendar, Bell, 
  BookOpen, FileText, Award, BarChart3, TrendingUp, AlertCircle 
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';

const CARD = {
  background: "#FFFFFF",
  border: "1px solid #BAE6FD",
  borderRadius: 18,
  boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.04)",
  padding: 24,
};

// Colors matching Super Admin donut chart exactly
const COLORS = ["#4FB6E8", "#F0B90B"]; // Blue deep (#4FB6E8) and Yellow deep (#F0B90B)

function QuickAction({ icon, label, onClick }) {
  return (
    <button 
      onClick={onClick}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
        padding: "16px 12px",
        border: "1px solid #E2E8F0",
        borderRadius: 14,
        background: "#FFFFFF",
        cursor: "pointer",
        transition: "all 0.2s ease",
        fontFamily: "inherit"
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#E0F2FE"; e.currentTarget.style.borderColor = "#0284C7"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF"; e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.transform = "none"; }}
    >
      <div style={{ color: "#0284C7" }}>{icon}</div>
      <span style={{ fontSize: 12.5, fontWeight: 800, color: "#0C1B33", textAlign: "center" }}>{label}</span>
    </button>
  );
}

export default function SchoolPortalHome() {
  const navigate = useNavigate();
  const { schoolId } = useParams();
  const [activeSchool, setActiveSchool] = useState(null);
  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState([
    { name: "Mon", Present: 92, Absent: 8 },
    { name: "Tue", Present: 94, Absent: 6 },
    { name: "Wed", Present: 96, Absent: 4 },
    { name: "Thu", Present: 91, Absent: 9 },
    { name: "Fri", Present: 95, Absent: 5 }
  ]);

  useEffect(() => {
    const fetchSchoolData = async () => {
      if (!schoolId) return;
      setLoading(true);
      try {
        const res = await schoolsApi.getById(schoolId);
        const mapped = mapSchoolFromBackend(res.data);
        setActiveSchool(mapped);
        
        // Fetch live counts of students and teachers
        const stdRes = await usersApi.getAll({ role: "student", schoolId, limit: 1000 });
        const teaRes = await usersApi.getAll({ role: "teacher", schoolId, limit: 1000 });
        
        setStudentCount(stdRes.data?.length || 0);
        setTeacherCount(teaRes.data?.length || 0);

        // Fetch live attendance data
        const attRes = await attendanceApi.getAll({ schoolId, limit: 10000 });
        const attList = attRes.data || [];
        if (attList.length > 0) {
          const daysMap = {
            1: { name: "Mon", present: 0, total: 0 },
            2: { name: "Tue", present: 0, total: 0 },
            3: { name: "Wed", present: 0, total: 0 },
            4: { name: "Thu", present: 0, total: 0 },
            5: { name: "Fri", present: 0, total: 0 }
          };

          attList.forEach(a => {
            if (!a.date) return;
            const dateObj = new Date(a.date);
            const day = dateObj.getDay();
            if (day >= 1 && day <= 5) {
              daysMap[day].total += 1;
              if (a.status?.toLowerCase() === "present") {
                daysMap[day].present += 1;
              }
            }
          });

          const computed = Object.values(daysMap).map(d => {
            const pctPresent = d.total > 0 ? Math.round((d.present / d.total) * 100) : 90;
            return {
              name: d.name,
              Present: pctPresent,
              Absent: 100 - pctPresent
            };
          });
          setAttendanceData(computed);
        }
      } catch (err) {
        console.warn("Could not fetch school details or counts from backend:", err.message);
        // Fallback to localStorage active school if any
        try {
          const stored = JSON.parse(localStorage.getItem('sms_active_school') || '{}');
          if (stored && stored.id === schoolId) {
            setActiveSchool(stored);
            
            // Local storage counts
            const mockUsers = JSON.parse(localStorage.getItem('school_management_users') || '[]');
            const mockStds = mockUsers.filter(u => u.schoolId === schoolId && u.role === 'student');
            const mockTeas = mockUsers.filter(u => u.schoolId === schoolId && u.role === 'teacher');
            setStudentCount(mockStds.length);
            setTeacherCount(mockTeas.length);

            // Local storage attendance
            const mockAtts = JSON.parse(localStorage.getItem('school_management_attendances') || '[]');
            const filteredAtts = mockAtts.filter(a => a.schoolId === schoolId);
            if (filteredAtts.length > 0) {
              const daysMap = {
                1: { name: "Mon", present: 0, total: 0 },
                2: { name: "Tue", present: 0, total: 0 },
                3: { name: "Wed", present: 0, total: 0 },
                4: { name: "Thu", present: 0, total: 0 },
                5: { name: "Fri", present: 0, total: 0 }
              };

              filteredAtts.forEach(a => {
                if (!a.date) return;
                const dateObj = new Date(a.date);
                const day = dateObj.getDay();
                if (day >= 1 && day <= 5) {
                  daysMap[day].total += 1;
                  if (a.status?.toLowerCase() === "present") {
                    daysMap[day].present += 1;
                  }
                }
              });

              const computed = Object.values(daysMap).map(d => {
                const pctPresent = d.total > 0 ? Math.round((d.present / d.total) * 100) : 90;
                return {
                  name: d.name,
                  Present: pctPresent,
                  Absent: 100 - pctPresent
                };
              });
              setAttendanceData(computed);
            }
          }
        } catch {}
      } finally {
        setLoading(false);
      }
    };
    fetchSchoolData();
  }, [schoolId]);

  const base = `/school-portal/${schoolId}`;

  const boysCount = Math.ceil(studentCount * 0.52);
  const girlsCount = Math.floor(studentCount * 0.48);
  const dynamicGenderData = [
    { name: "Boys", value: studentCount > 0 ? boysCount : 0 },
    { name: "Girls", value: studentCount > 0 ? girlsCount : 0 }
  ];

  const formatStorage = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const parseStorageLimit = (limitStr) => {
    if (!limitStr) return 100 * 1024 * 1024 * 1024; // Default 100 GB
    const clean = String(limitStr).trim().toLowerCase();
    if (clean === "unlimited") return Infinity;
    const match = clean.match(/^([\d.]+)\s*(gb|mb|kb|tb)?$/);
    if (!match) return 100 * 1024 * 1024 * 1024;
    const val = parseFloat(match[1]);
    const unit = match[2] || "gb";
    const multipliers = { kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024, tb: 1024 * 1024 * 1024 * 1024 };
    return val * (multipliers[unit] || 1024 * 1024 * 1024);
  };

  const limitBytes = parseStorageLimit(activeSchool?.storageLimit);
  const usedPercentage = limitBytes === Infinity ? 0 : Math.min(100, ((activeSchool?.storageUsage || 0) / limitBytes) * 100);

  // Metric cards styled exactly like Super Admin dashboard with the new color palette
  const metricCards = [
    { label: "Students", val: studentCount, bg: "#E0F2FE", trend: "Database", trendColor: "#10B981", trendBg: "#E6F4EA" },
    { label: "Teachers", val: teacherCount, bg: "#FCE388", trend: "Database", trendColor: "#10B981", trendBg: "#E6F4EA" },
    { label: "License Plan", val: activeSchool?.planName || "Basic", bg: "#BAE6FD", trend: "Plan", trendColor: "#0284C7", trendBg: "#E0F2FE" },
    { label: "License Status", val: `₹${(activeSchool?.amount || 0).toLocaleString()}`, bg: "#E0F2FE", trend: activeSchool?.status || "Unpaid", trendColor: activeSchool?.status === 'Paid' ? '#10B981' : '#EF4444', trendBg: activeSchool?.status === 'Paid' ? '#E6F4EA' : '#FCE8E6' },
    { 
      label: `Storage Limit (${activeSchool?.storageLimit || "100 GB"})`, 
      val: formatStorage(activeSchool?.storageUsage || 0), 
      bg: "#FEE2E2", 
      trend: `${usedPercentage.toFixed(3)}% Used`, 
      trendColor: "#EF4444", 
      trendBg: "#FEE2E2",
      extra: (
        <div style={{ width: "100%", backgroundColor: "rgba(0, 0, 0, 0.05)", borderRadius: 10, height: 6, marginTop: 8 }}>
          <div style={{ width: `${Math.max(1, usedPercentage)}%`, backgroundColor: "#EF4444", height: "100%", borderRadius: 10 }}></div>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Greeting Banner */}
      <div style={{
        background: "#FFFFFF",
        border: "1px solid #BAE6FD",
        borderRadius: 18,
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.04)"
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "#1F2333", margin: 0 }}>Welcome Back to {activeSchool?.name || 'School Administrator'}</h2>
          <p style={{ fontSize: 13, color: "#6B7080", margin: 0 }}>
            Configure schedules, manage faculty parameters, compile circular notices, and generate fee receipts database.
          </p>
        </div>
      </div>

      {/* 5 Colored Metric Cards - Super Admin Style */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
        {metricCards.map((card, idx) => (
          <div key={idx} style={{
            background: card.bg,
            borderRadius: 18,
            padding: 24,
            boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.04)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: 140,
            transition: 'transform 0.18s ease'
          }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                color: card.trendColor,
                background: card.trendBg,
                padding: '4px 8px',
                borderRadius: 6
              }}>{card.trend}</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#1F2333', cursor: 'pointer' }}>•••</span>
            </div>
            <div>
              <div style={{ fontSize: typeof card.val === "number" ? 32 : 24, fontWeight: 955, color: '#1F2333', letterSpacing: '-0.5px' }}>{card.val}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#6B7080', marginTop: 2 }}>{card.label}</div>
              {card.extra}
            </div>
          </div>
        ))}
      </div>

      {/* Middle Section: Students gender pie & Attendance weekly bar chart - Super Admin Style */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: 20, alignItems: 'stretch' }}>
          
          {/* Left Card: Students gender */}
          <div style={{
              background: '#FFFFFF',
              border: '1px solid #EEEEF4',
              borderRadius: 18,
              padding: 24,
              boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 380
          }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#1F2333' }}>Students</h3>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#6B7080', cursor: 'pointer' }}>•••</span>
              </div>

              {/* Circular donut chart container */}
              <div style={{ position: 'relative', width: '100%', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={dynamicGenderData}
                              cx="50%"
                              cy="50%"
                              innerRadius={65}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                          >
                              {dynamicGenderData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                          </Pie>
                      </PieChart>
                  </ResponsiveContainer>
                  {/* Gender icons overlay in the center */}
                  <div style={{ position: 'absolute', display: 'flex', gap: 6, fontSize: 24 }}>
                      👤👧
                  </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #EEEEF4', paddingTop: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4FB6E8' }} />
                          <strong style={{ fontSize: 14, color: '#1F2333' }}>{dynamicGenderData[0].value}</strong>
                      </div>
                      <span style={{ fontSize: 12, color: '#6B7080', fontWeight: 700 }}>Boys (52%)</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F0B90B' }} />
                          <strong style={{ fontSize: 14, color: '#1F2333' }}>{dynamicGenderData[1].value}</strong>
                      </div>
                      <span style={{ fontSize: 12, color: '#6B7080', fontWeight: 700 }}>Girls (48%)</span>
                  </div>
              </div>
          </div>

          {/* Right Card: Attendance weekly bar chart */}
          <div style={{
              background: '#FFFFFF',
              border: '1px solid #EEEEF4',
              borderRadius: 18,
              padding: 24,
              boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 380
          }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#1F2333' }}>Attendance</h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                      <select style={{ padding: '4px 8px', border: '1px solid #EEEEF4', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#6B7080', background: '#fff' }}>
                          <option>Weekly</option>
                      </select>
                      <select style={{ padding: '4px 8px', border: '1px solid #EEEEF4', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#6B7080', background: '#fff' }}>
                          <option>All Classes</option>
                      </select>
                  </div>
              </div>

              <div style={{ height: 260, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={attendanceData} barSize={10} barGap={4}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEEEF4" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7080', fontSize: 11 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7080', fontSize: 11 }} />
                          <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #EEEEF4' }} />
                          <Bar name="Present" dataKey="Present" fill="#F0B90B" radius={[4, 4, 0, 0]} />
                          <Bar name="Absent" dataKey="Absent" fill="#4FB6E8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* Activity Logs & Campus Events */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        
        {/* Recent Activity */}
        <div style={{ ...CARD }}>
          <h3 style={{ margin: "0 0 14px 0", fontSize: 15, fontWeight: 900, color: "#0C1B33" }}>🔔 Recent System Activity</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ padding: "12px 14px", background: "#F0F9FF", borderRadius: 10, fontSize: 13, borderLeft: "4px solid #0284C7" }}>
              <strong>New Teacher Registered</strong>
              <p style={{ margin: "4px 0 0 0", color: "#4A7FA5" }}>Albert Einstein was added as a Physics Instructor.</p>
            </div>
            <div style={{ padding: "12px 14px", background: "#F0F9FF", borderRadius: 10, fontSize: 13, borderLeft: "4px solid #10B981" }}>
              <strong>Student Admission Added</strong>
              <p style={{ margin: "4px 0 0 0", color: "#4A7FA5" }}>Rohan Sharma admitted successfully to Class 10th A.</p>
            </div>
          </div>
        </div>

        {/* Campus Events */}
        <div style={{ ...CARD }}>
          <h3 style={{ margin: "0 0 14px 0", fontSize: 15, fontWeight: 900, color: "#0C1B33" }}>📅 Upcoming Campus Events</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ padding: "12px 14px", background: "#F0F9FF", borderRadius: 10, fontSize: 13, borderLeft: "4px solid #F59E0B" }}>
              <strong>Annual Cultural Fest 2026</strong>
              <p style={{ margin: "4px 0 0 0", color: "#4A7FA5" }}>Scheduled at School Auditorium on July 25th.</p>
            </div>
            <div style={{ padding: "12px 14px", background: "#F0F9FF", borderRadius: 10, fontSize: 13, borderLeft: "4px solid #0284C7" }}>
              <strong>Inter-School Athletics Tryouts</strong>
              <p style={{ margin: "4px 0 0 0", color: "#4A7FA5" }}>Sports Meet trials start August 5th on Campus playground.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
