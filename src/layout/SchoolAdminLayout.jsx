import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

/* ─────────────────────────────────────────────────────────
   School Portal Layout  — Blue & White SaaS Theme
   • 260px white sidebar with blue active states
   • Top navbar with school name, breadcrumb & user avatar
   • Gray-bg main content area
   ───────────────────────────────────────────────────────── */

const NAV = [
  { label: "Dashboard",       icon: "🏠", to: "", end: true },
  {
    label: "User Management",
    icon: "👥",
    isGroup: true,
    groupKey: "userManagement",
    subItems: [
      { label: "Teachers",      icon: "👨‍🏫", to: "teachers" },
      { label: "Students",      icon: "🎓", to: "students" },
    ]
  },
  {
    label: "Class Management",
    icon: "🏫",
    isGroup: true,
    groupKey: "classManagement",
    subItems: [
      { label: "Classes",       icon: "🏫", to: "classes" },
      { label: "Subjects",      icon: "📚", to: "subjects" },
      { label: "Biometrics",    icon: "👣", to: "biometrics" },
      { label: "Attendance Log", icon: "📋", to: "attendance" },
    ]
  },
  { label: "Exams",           icon: "📝", to: "exams" },
  { label: "Library",         icon: "📚", to: "library" },
  { label: "Events",          icon: "📅", to: "events" },
  { label: "Send Message",    icon: "✉️", to: "announcements" },
  { label: "Reports",         icon: "📊", to: "reports" },
  { label: "Hostel Portal",   icon: "🏢", to: "hostel-portal", isAbsolute: true },
  {
    label: "Live Bus System",
    icon: "🚌",
    isGroup: true,
    groupKey: "liveBusSystem",
    subItems: [
      { label: "Dashboard",                   icon: "📊", to: "bus-dashboard" },
      { label: "Bus Management",             icon: "🚌", to: "bus-management" },
      { label: "Driver Management",          icon: "👨‍✈️", to: "driver-management" },
      { label: "Student Bus Assignment",     icon: "📝", to: "student-bus-assignment" },
      { label: "Live Tracking",              icon: "📍", to: "live-tracking" }
    ]
  },
  { label: "Support Section", icon: "💬", to: "support" },
];

export default function SchoolPortalLayout() {
  const { schoolId } = useParams();
  const navigate     = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    userManagement: true,
    classManagement: true,
    liveBusSystem: true,
  });

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('sms_user') || '{}'); } catch { return {}; }
  })();
  const isSuperAdminUser = user?.role === "super_admin";

  const checkUnreadNotifications = () => {
    try {
      const stored = localStorage.getItem("school_admin_notifications");
      if (stored) {
        const notifs = JSON.parse(stored);
        setUnreadCount(notifs.filter(n => n.schoolId === schoolId && !n.read).length);
      } else {
        setUnreadCount(2); // default unread count
      }
    } catch {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    checkUnreadNotifications();
    window.addEventListener("school_admin_notifications_update", checkUnreadNotifications);
    return () => {
      window.removeEventListener("school_admin_notifications_update", checkUnreadNotifications);
    };
  }, []);

  const [hostelEnabled, setHostelEnabled] = useState(() => {
    return localStorage.getItem(`sms_${schoolId}_hostel_enabled`) === "true";
  });

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setHostelEnabled(localStorage.getItem(`sms_${schoolId}_hostel_enabled`) === "true");
    };
    window.addEventListener("sms_settings_update", handleSettingsUpdate);
    return () => window.removeEventListener("sms_settings_update", handleSettingsUpdate);
  }, [schoolId]);

  // Load school info from localStorage (set when Super Admin clicks Login)
  const activeSchool = (() => {
    try { return JSON.parse(localStorage.getItem('sms_active_school') || '{}'); } catch { return {}; }
  })();
  const schoolName = activeSchool?.name || `School #${schoolId}`;
  const schoolInitial = schoolName.charAt(0).toUpperCase();

  const base = `/school-portal/${schoolId}`;

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Inter, system-ui, sans-serif", background: "#F0F9FF" }}>

      {/* ══════════════ SIDEBAR ══════════════ */}
      <aside style={{
        width: 260,
        background: "#fff",
        borderRight: "1px solid #BAE6FD",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflow: "hidden",
      }}>

        {/* Brand */}
        <div style={{
          height: 64,
          padding: "0 18px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: "1px solid #EEEEF4",
          flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36,
            background: "#0284C7",
            borderRadius: 9,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, flexShrink: 0,
          }}>🏫</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0C1B33", whiteSpace: "nowrap", maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis" }}>{schoolName}</div>
            <div style={{ fontSize: 11, color: "#4A7FA5", whiteSpace: "nowrap" }}>School Admin Portal</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
          {NAV.map((item) => {
            if (item.isGroup) {
              const groupExpanded = !!expandedSections[item.groupKey];
              const isAnySubActive = item.subItems.some(sub => 
                window.location.pathname.includes(`/${sub.to}`)
              );
              return (
                <div key={item.label} style={{ display: "flex", flexDirection: "column" }}>
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, [item.groupKey]: !prev[item.groupKey] }))}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 11,
                      padding: "10px 18px",
                      margin: "1px 8px",
                      borderRadius: 8,
                      border: "none",
                      background: isAnySubActive ? "rgba(2, 132, 199, 0.05)" : "transparent",
                      color: isAnySubActive ? "#0284C7" : "#0C1B33",
                      fontSize: 13.5,
                      fontWeight: isAnySubActive ? 700 : 500,
                      cursor: "pointer",
                      textAlign: "left",
                      width: "calc(100% - 16px)",
                      fontFamily: "inherit",
                      transition: "background 0.15s, color 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <span style={{ fontSize: 17, flexShrink: 0 }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    <span style={{ 
                      fontSize: 10, 
                      transition: "transform 0.2s", 
                      transform: groupExpanded ? "rotate(180deg)" : "rotate(0deg)" 
                    }}>
                      ▼
                    </span>
                  </button>

                  {groupExpanded && item.subItems.map((subItem) => (
                    <NavLink
                      key={subItem.label}
                      to={`${base}/${subItem.to}`}
                      style={({ isActive }) => ({
                        display: "flex",
                        alignItems: "center",
                        gap: 11,
                        padding: "10px 18px",
                        paddingLeft: "36px",
                        justifyContent: "flex-start",
                        margin: "1px 8px",
                        borderRadius: 8,
                        textDecoration: "none",
                        fontSize: 13,
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? "#0284C7" : "#4A7FA5",
                        background: isActive ? "#E0F2FE" : "transparent",
                        borderLeft: isActive ? "3px solid #0284C7" : "3px solid transparent",
                        transition: "background 0.15s, color 0.15s",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                      })}
                    >
                      <span style={{ fontSize: 15, flexShrink: 0 }}>{subItem.icon}</span>
                      {subItem.label}
                    </NavLink>
                  ))}
                </div>
              );
            }

            if (item.to === "hostel-portal" && !hostelEnabled) {
              return null;
            }

            const targetUrl = item.isAbsolute ? `/hostel-portal/${schoolId}` : `${base}${item.to ? `/${item.to}` : ""}`;
            return (
              <NavLink
                key={item.label}
                to={targetUrl}
                end={item.end}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "10px 18px",
                  justifyContent: "flex-start",
                  margin: "1px 8px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 13.5,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#0284C7" : "#0C1B33",
                  background: isActive ? "#E0F2FE" : "transparent",
                  borderLeft: isActive ? "3px solid #0284C7" : "3px solid transparent",
                  transition: "background 0.15s, color 0.15s",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                })}
              >
                <span style={{ fontSize: 17, flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* ══════════════ MAIN ══════════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top Navbar */}
        <header style={{
          height: 70,
          background: "#ffffff",
          borderBottom: "1px solid #BAE6FD",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          flexShrink: 0,
          boxShadow: "0 4px 20px -10px rgba(0,0,0,0.03)",
        }}>
          {/* Left Block: Symmetrical empty block */}
          <div style={{ width: 220 }} />

          {/* Center Block: Centered School Name styled with premium text gradient */}
          <div style={{ 
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", 
            textAlign: "center", flex: 1 
          }}>
            <h1 style={{ 
              margin: 0, fontSize: 18.5, fontWeight: 900, color: "#0C1B33", 
              letterSpacing: "0.3px", display: "flex", alignItems: "center", gap: 6,
              background: "linear-gradient(90deg, #0369A1 0%, #0284C7 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
              {schoolName}
            </h1>
          </div>

          {/* Right Block: Symmetrical Actions Block */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 14, width: 220 }}>
            {/* Notification */}
            <button 
              onClick={() => navigate(`${base}/notifications`)}
              style={{
                width: 38, height: 38,
                border: "1px solid #BAE6FD", borderRadius: "50%",
                background: "#F0F9FF",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 17, position: "relative",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#E0F2FE")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#F0F9FF")}
            >
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: 6, right: 6,
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#E4574C", border: "2px solid #fff",
                }} />
              )}
            </button>

            {/* Avatar Dropdown wrapper */}
            <div style={{ position: "relative" }}>
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  width: 38, height: 38,
                  borderRadius: "50%",
                  background: "#0284C7",
                  color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 14,
                  cursor: "pointer",
                  userSelect: "none"
                }}
              >
                {schoolInitial}
              </div>
              
              {isDropdownOpen && (
                <div style={{
                  position: "absolute",
                  top: 44,
                  right: 0,
                  background: "#FFFFFF",
                  border: "1px solid #BAE6FD",
                  borderRadius: 12,
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
                  width: 150,
                  zIndex: 2000,
                  padding: 6,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4
                }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#4A7FA5", padding: "6px 12px", borderBottom: "1px solid #BAE6FD" }}>
                    SCHOOL ADMIN
                  </div>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate(`/hostel-portal/${schoolId}`);
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "none",
                      borderRadius: 8,
                      background: "transparent",
                      color: "#334155",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      textAlign: "left",
                      fontFamily: "inherit",
                      transition: "background 0.15s"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#E0F2FE")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    🏢 Hostel Portal
                  </button>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      if (isSuperAdminUser) {
                        navigate("/super-admin");
                      } else {
                        localStorage.removeItem("sms_user");
                        localStorage.removeItem("sms_token");
                        localStorage.removeItem("sms_active_school");
                        navigate("/login");
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "none",
                      borderRadius: 8,
                      background: "transparent",
                      color: "#E4574C",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      textAlign: "left",
                      fontFamily: "inherit",
                      transition: "background 0.15s"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#E0F2FE")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    🚪 {isSuperAdminUser ? "Back to Super Admin" : "Logout"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
