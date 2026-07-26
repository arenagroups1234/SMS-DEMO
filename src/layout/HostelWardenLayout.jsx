import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";

/* ─────────────────────────────────────────────────────────
   Hostel Warden Portal Layout — Warm Indigo & Slate Theme
   • 260px sidebar with indigo active states
   • Top navbar with school name, breadcrumb & user avatar
   • Slate-bg main content area
   ───────────────────────────────────────────────────────── */

const NAV = [
  { label: "Dashboard",       icon: "📊", to: "", end: true },
  { label: "Hostel Students", icon: "👥", to: "students" },
  { label: "Hostels & Rooms", icon: "🏢", to: "rooms" },
  { label: "Room Allotments", icon: "🔑", to: "allotments" },
  { label: "Attendance & Leaves", icon: "📋", to: "attendance" },
  { label: "Inventory & Assets", icon: "📦", to: "inventory" },
  { label: "Fee Payments",    icon: "💳", to: "payments" },
  { label: "Maintenance",     icon: "🛠️", to: "maintenance" },
  { label: "Visitor Logs",    icon: "📝", to: "visitors" }
];

export default function HostelWardenLayout() {
  const { schoolId } = useParams();
  const navigate     = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Room 102 requested maintenance.", time: "5 mins ago", read: false },
    { id: 2, text: "New allotment request for Aarav.", time: "1 hour ago", read: false }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('sms_user') || '{}'); } catch { return {}; }
  })();

  const activeSchool = (() => {
    try { return JSON.parse(localStorage.getItem('sms_active_school') || '{}'); } catch { return {}; }
  })();
  const schoolName = activeSchool?.name || `School #${schoolId}`;

  const base = `/hostel-portal/${schoolId}`;

  const handleLogout = () => {
    if (user?.role === "admin" || user?.role === "super_admin") {
      navigate(`/school-portal/${schoolId}`);
    } else {
      localStorage.removeItem("sms_user");
      localStorage.removeItem("sms_token");
      navigate("/login");
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Inter, system-ui, sans-serif", background: "#F8FAFC" }}>

      {/* ══════════════ SIDEBAR ══════════════ */}
      <aside style={{
        width: 260,
        background: "#0F172A", // Dark slate background
        color: "#F1F5F9",
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
          borderBottom: "1px solid #1E293B",
          flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36,
            background: "#6366F1", // Indigo accent
            borderRadius: 9,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, flexShrink: 0,
          }}>🏢</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#FFFFFF", whiteSpace: "nowrap", maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis" }}>{schoolName}</div>
            <div style={{ fontSize: 11, color: "#94A3B8", whiteSpace: "nowrap" }}>Hostel Warden Portal</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "15px 0" }}>
          {NAV.map((item) => (
            <NavLink
              key={item.label}
              to={`${base}/${item.to}`}
              end={item.end}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 18px",
                margin: "4px 12px",
                borderRadius: 8,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "#FFFFFF" : "#94A3B8",
                background: isActive ? "rgba(99, 102, 241, 0.15)" : "transparent",
                borderLeft: isActive ? "4px solid #6366F1" : "4px solid transparent",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
                overflow: "hidden",
              })}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer User info */}
        <div style={{
          padding: "15px 18px",
          borderTop: "1px solid #1E293B",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          background: "#090D16"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "#6366F1", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 14, flexShrink: 0
            }}>W</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>Warden Office</div>
              <div style={{ fontSize: 10, color: "#64748B" }}>{user?.email || "warden@school.com"}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title={user?.role === "admin" || user?.role === "super_admin" ? "Back to School Admin" : "Logout"}
            style={{
              background: "none", border: "none", color: "#EF4444", fontSize: 18, cursor: "pointer", padding: 5
            }}
          >
            🚪
          </button>
        </div>
      </aside>

      {/* ══════════════ MAIN CONTENT AREA ══════════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

        {/* Top Header */}
        <header style={{
          height: 64,
          background: "#fff",
          borderBottom: "1px solid #E2E8F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          flexShrink: 0,
        }}>
          {/* Left: Breadcrumbs & Back Option */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: "#64748B", fontWeight: 500 }}>
            {(user?.role === "admin" || user?.role === "super_admin") && (
              <button 
                onClick={() => navigate(`/school-portal/${schoolId}`)}
                style={{
                  background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 8,
                  padding: "6px 12px", color: "#4F46E5", fontSize: 12.5, fontWeight: 700,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#E0E7FF"}
                onMouseLeave={e => e.currentTarget.style.background = "#EEF2FF"}
              >
                ← Back to School Admin
              </button>
            )}
            <span>🏢 Hostel Management</span>
            <span>/</span>
            <span style={{ color: "#0F172A", fontWeight: 600 }}>Portal</span>
          </div>

          {/* Right: Notifications & Quick Profile */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            
            {/* Notifications */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  background: "#F1F5F9", border: "none", width: 40, height: 40, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                  fontSize: 18, position: "relative"
                }}
              >
                🔔
                <span style={{
                  position: "absolute", top: 10, right: 10, width: 8, height: 8,
                  background: "#EF4444", borderRadius: "50%"
                }} />
              </button>
              
              {showNotifications && (
                <div style={{
                  position: "absolute", top: 48, right: 0, width: 300, background: "#fff",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                  borderRadius: 12, border: "1px solid #E2E8F0", zIndex: 100, padding: 10
                }}>
                  <div style={{ fontWeight: 700, fontSize: 14, padding: "5px 10px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between" }}>
                    <span>Notifications</span>
                    <span style={{ fontSize: 11, color: "#6366F1", cursor: "pointer" }}>Clear All</span>
                  </div>
                  {notifications.map(n => (
                    <div key={n.id} style={{ padding: 10, borderBottom: "1px solid #F8FAFC", fontSize: 13 }}>
                      <div style={{ color: "#334155" }}>{n.text}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>{n.time}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div style={{ position: "relative" }}>
              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Hostel Warden</span>
                  <span style={{ fontSize: 11, color: "#64748B" }}>Staff User</span>
                </div>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "#EEF2FF", border: "1.5px solid #6366F1",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20
                }}>🧑‍💼</div>
              </div>

              {isDropdownOpen && (
                <div style={{
                  position: "absolute", top: 48, right: 0, width: 160, background: "#fff",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", borderRadius: 8,
                  border: "1px solid #E2E8F0", zIndex: 100, overflow: "hidden"
                }}>
                  <button
                    onClick={() => { setIsDropdownOpen(false); navigate(`${base}/profile`); }}
                    style={{
                      display: "block", width: "100%", padding: "10px 15px", textAlign: "left",
                      background: "none", border: "none", fontSize: 13, cursor: "pointer", color: "#334155"
                    }}
                  >
                    👤 Profile
                  </button>
                  <button
                    onClick={() => { setIsDropdownOpen(false); navigate(`/school-portal/${schoolId}`); }}
                    style={{
                      display: "block", width: "100%", padding: "10px 15px", textAlign: "left",
                      background: "none", border: "none", fontSize: 13, cursor: "pointer", color: "#334155",
                      borderTop: "1px solid #F1F5F9"
                    }}
                  >
                    🏫 School Admin
                  </button>
                  <button
                    onClick={() => { setIsDropdownOpen(false); handleLogout(); }}
                    style={{
                      display: "block", width: "100%", padding: "10px 15px", textAlign: "left",
                      background: "none", border: "none", fontSize: 13, cursor: "pointer", color: "#EF4444",
                      borderTop: "1px solid #F1F5F9"
                    }}
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Content Outlet */}
        <main style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          <Outlet />
        </main>
      </div>

    </div>
  );
}
