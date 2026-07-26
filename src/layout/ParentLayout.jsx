import { useState } from "react";
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";

/* ─────────────────────────────────────────────────────────
   Parent Portal Layout — Blue & White SaaS Theme
   • 260px white sidebar with blue active states
   • Top navbar with parent name, breadcrumb & user avatar
   • Gray-bg main content area
   ───────────────────────────────────────────────────────── */

const NAV = [
  { label: "Dashboard",           icon: "🏠", to: ""              , end: true },
  { label: "Attendance",          icon: "✅", to: "attendance"     },
  { label: "Homework & Tasks",    icon: "📚", to: "homework"       },
  { label: "Exams & Timetables", icon: "📝", to: "marks"          },
  { label: "Notifications",       icon: "🔔", to: "notifications"  },
  { label: "Live Bus Tracking",   icon: "🚌", to: "live-bus"       },
];

export default function ParentPortalLayout() {
  const { studentId } = useParams();
  const navigate      = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Read logged-in parent/student info from localStorage
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem("sms_user") || "{}"); } catch { return {}; } })();
  const parentName = storedUser.name || "Parent";
  const parentEmail = storedUser.email || "";
  const avatarLetter = parentName.charAt(0).toUpperCase();

  const base = `/parent-portal/${studentId}`;

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Inter, system-ui, sans-serif", background: "#F4F2FC" }}>

      {/* ══════════════ SIDEBAR ══════════════ */}
      <aside style={{
        width: collapsed ? 64 : 260,
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
          }}>👨‍👩‍👦</div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0C1B33", whiteSpace: "nowrap" }}>School ERP</div>
              <div style={{ fontSize: 11, color: "#4A7FA5", whiteSpace: "nowrap" }}>Parent Portal</div>
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
          {/* Parent name */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0C1B33", letterSpacing: "0.3px" }}>
              👋 Welcome, {parentName}
            </div>
            <div style={{ fontSize: 11.5, color: "#4A7FA5" }}>{parentEmail || `Student ID: ${studentId}`}</div>
          </div>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Notification */}
            <button style={{
              width: 36, height: 36,
              border: "none", borderRadius: "50%",
              background: "#F0F9FF",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 17, position: "relative",
              transition: "background 0.15s",
            }}
              onClick={() => navigate(`${base}/notifications`)}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#E0F2FE")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#F0F9FF")}
            >
              🔔
              <span style={{
                position: "absolute", top: 5, right: 5,
                width: 7, height: 7, borderRadius: "50%",
                background: "#E4574C", border: "1.5px solid #fff",
              }} />
            </button>

            {/* Avatar Dropdown wrapper */}
            <div style={{ position: "relative" }}>
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  width: 36, height: 36,
                  borderRadius: "50%",
                  background: "#0284C7",
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
