import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { noticesApi } from "../services/api";

/* ─────────────────────────────────────────────────────────
   Teacher Portal Layout — Blue & White SaaS Theme
   • 260px white sidebar with blue active states
   • Top navbar with teacher name, breadcrumb & user avatar
   • Gray-bg main content area
   ───────────────────────────────────────────────────────── */

const NAV = [
  { label: "Dashboard",     icon: "🏠", to: ""                  , end: true },
  { label: "My Classes",    icon: "🏫", to: "classes"            },
  { label: "Students",      icon: "🎓", to: "students"           },
  { label: "Attendance",    icon: "✅", to: "attendance"         },
  { label: "Homework",      icon: "📚", to: "homework"           },
  { label: "Assignments",   icon: "📋", to: "assignments"        },
  { label: "Announcements", icon: "📢", to: "announcements"      },
];

export default function TeacherPortalLayout() {
  const { teacherId } = useParams();
  const navigate      = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Read logged-in teacher info from localStorage
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem("sms_user") || "{}"); } catch { return {}; } })();
  const [currentTeacher, setCurrentTeacher] = useState(null);

  useEffect(() => {
    const loadTeacherHeaderProfile = async () => {
      const targetId = teacherId || storedUser.id;
      if (!targetId) return;
      try {
        const { usersApi } = await import("../services/api");
        const res = await usersApi.getById(targetId);
        if (res?.data) {
          setCurrentTeacher(res.data);
        }
      } catch (err) {
        console.warn("Could not fetch target teacher info for header:", err);
      }
    };
    loadTeacherHeaderProfile();
  }, [teacherId]);

  const teacherName = currentTeacher?.name || storedUser.name || "Teacher";
  const teacherEmail = currentTeacher?.email || storedUser.email || "";
  const avatarLetter = teacherName.charAt(0).toUpperCase();

  const checkUnread = async () => {
    try {
      const schoolId = storedUser.schoolId || "";
      const userCreatedAt = storedUser.createdAt ? new Date(storedUser.createdAt) : null;
      
      const res = await noticesApi.getAll();
      const allNotices = res.data || [];
      
      // Filter by school and date
      const schoolNotices = allNotices.filter(n => {
        const matchesSchool = n.schoolId === schoolId || n.schoolId === "ALL" || n.schoolId === "all" || !n.schoolId;
        if (!matchesSchool) return false;
        if (userCreatedAt && n.createdAt) {
          return new Date(n.createdAt) >= userCreatedAt;
        }
        return true;
      });

      // Get read notices list from local storage
      const storedRead = localStorage.getItem(`teacher_${storedUser.id}_read_notifications`);
      const readIds = storedRead ? JSON.parse(storedRead) : [];
      
      // Filter those not read yet
      const unread = schoolNotices.filter(n => !readIds.includes(n.id));
      setUnreadCount(unread.length);
    } catch (e) {
      console.warn("Could not load unread notices count:", e);
    }
  };

  useEffect(() => {
    checkUnread();
    window.addEventListener("teacher_notifications_update", checkUnread);
    return () => {
      window.removeEventListener("teacher_notifications_update", checkUnread);
    };
  }, []);

  const base = `/teacher-portal/${teacherId}`;

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Inter, system-ui, sans-serif", background: "#F4F2FC" }}>

      {/* ══════════════ SIDEBAR ══════════════ */}
      <aside style={{
        width: collapsed ? 70 : 260,
        background: "#fff",
        borderRight: "1px solid #EEEEF4",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        transition: "width 0.22s ease",
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
          }}>👨‍🏫</div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0C1B33", whiteSpace: "nowrap" }}>School ERP</div>
              <div style={{ fontSize: 11, color: "#4A7FA5", whiteSpace: "nowrap" }}>Teacher Portal</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
          {NAV.map((item) => (
            <NavLink
              key={item.label}
              to={`${base}${item.to ? `/${item.to}` : ""}`}
              end={item.end}
              title={collapsed ? item.label : undefined}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: collapsed ? "11px 0" : "10px 18px",
                justifyContent: collapsed ? "center" : "flex-start",
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
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid #EEEEF4", flexShrink: 0 }}>
          <button
            onClick={() => setCollapsed((p) => !p)}
            style={{
              width: "100%",
              padding: "9px 0",
              border: "none",
              borderRadius: 8,
              background: "#F0F9FF",
              color: "#4A7FA5",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#E0F2FE")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#F0F9FF")}
          >
            {collapsed ? "→" : "← Collapse"}
          </button>
        </div>

      </aside>

      {/* ══════════════ MAIN ══════════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top Navbar */}
        <header style={{
          height: 64,
          background: "#fff",
          borderBottom: "1px solid #EEEEF4",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          gap: 16,
          flexShrink: 0,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          {/* Teacher name */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0C1B33", letterSpacing: "0.3px" }}>
              👨‍🏫 Welcome, {teacherName}
            </div>
            <div style={{ fontSize: 11.5, color: "#4A7FA5" }}>{teacherEmail || `Teacher ID: ${teacherId}`}</div>
          </div>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Notification */}
            <button 
              onClick={() => navigate(`${base}/announcements`)}
              style={{
                width: 36, height: 36,
                border: "none", borderRadius: "50%",
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
                  position: "absolute", top: 5, right: 5,
                  width: 7, height: 7, borderRadius: "50%",
                  background: "#E4574C", border: "1.5px solid #fff",
                }} />
              )}
            </button>

            {/* Avatar Dropdown wrapper */}
            <div style={{ position: "relative" }}>
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  width: 36, height: 36,
                  borderRadius: "50%",
                  background: "#16A34A",
                  color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 14,
                  cursor: "pointer",
                  userSelect: "none"
                }}
              >
                {avatarLetter}
              </div>
              
              {isDropdownOpen && (
                <div style={{
                  position: "absolute",
                  top: 42,
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
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate(`${base}/profile`);
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "none",
                      borderRadius: 8,
                      background: "transparent",
                      color: "#0C1B33",
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
                    👤 Profile
                  </button>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      localStorage.removeItem("sms_user");
                      localStorage.removeItem("sms_token");
                      localStorage.removeItem("sms_active_school");
                      navigate("/login");
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
                    🚪 Logout
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
