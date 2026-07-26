import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User, Mail, Phone, Shield, Calendar, Lock, Eye, EyeOff, Building, Award } from "lucide-react";
import { toast } from "sonner";

export default function WardenProfile() {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    id: "WRD-2026-09",
    name: "Rajesh Kumar",
    email: "warden@school.com",
    phone: "9876504321",
    role: "Chief Hostel Warden",
    joined: "2024-04-12",
    schoolName: "Green Valley Campus"
  });

  // Password States
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    toast.success("Security credentials updated successfully!");
    setOldPassword("");
    setNewPassword("");
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("sms_user");
    const activeSchool = localStorage.getItem("sms_active_school");
    
    let email = "warden@school.com";
    let school = "Green Valley Campus";
    
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u.email) email = u.email;
      } catch (e) {}
    }
    if (activeSchool) {
      try {
        const s = JSON.parse(activeSchool);
        if (s.name) school = s.name;
      } catch (e) {}
    }
    
    setProfile(prev => ({
      ...prev,
      email,
      schoolName: school
    }));
  }, []);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24, alignItems: "start" }}>
      
      {/* Profile Details Card */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28, borderBottom: "1px solid #F3F4F6", paddingBottom: 24 }}>
          <div style={{
            width: 72, height: 72, background: "#EEF2FF", color: "#4F46E5", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 900
          }}>
            {profile.name.charAt(0)}
          </div>
          
          <div>
            <h2 style={{ margin: "0 0 4px 0", fontSize: 22, fontWeight: 900, color: "#1E293B" }}>{profile.name}</h2>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#4F46E5", background: "#EEF2FF", padding: "4px 10px", borderRadius: 6 }}>
              {profile.role}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <User size={18} color="#9CA3AF" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#9CA3AF" }}>WARDEN STAFF ID</span>
              <span style={{ fontSize: 13.5, color: "#1E293B", fontWeight: 700 }}>{profile.id}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Mail size={18} color="#9CA3AF" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#9CA3AF" }}>EMAIL ADDRESS</span>
              <span style={{ fontSize: 13.5, color: "#1E293B", fontWeight: 700 }}>{profile.email}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Phone size={18} color="#9CA3AF" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#9CA3AF" }}>MOBILE NUMBER</span>
              <span style={{ fontSize: 13.5, color: "#1E293B", fontWeight: 700 }}>{profile.phone}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Building size={18} color="#9CA3AF" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#9CA3AF" }}>ASSIGNED CAMPUS / SCHOOL</span>
              <span style={{ fontSize: 13.5, color: "#1E293B", fontWeight: 700 }}>{profile.schoolName}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Calendar size={18} color="#9CA3AF" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#9CA3AF" }}>JOINED SYSTEM ON</span>
              <span style={{ fontSize: 13.5, color: "#1E293B", fontWeight: 700 }}>{profile.joined}</span>
            </div>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("sms_user");
              localStorage.removeItem("sms_token");
              navigate("/login");
            }}
            style={{
              marginTop: 20,
              width: "100%",
              padding: "12px",
              border: "none",
              borderRadius: 8,
              background: "#FEE2E2",
              color: "#DC2626",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "background 0.15s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#FECACA"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#FEE2E2"}
          >
            🚪 Log Out / Exit Portal
          </button>
        </div>
      </div>

      {/* Security Credentials Card */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: 18, fontWeight: 900, color: "#1E293B" }}>Security Credentials</h3>
        <p style={{ margin: "0 0 24px 0", fontSize: 13, color: "#6B7280" }}>Update your password to secure access to the Warden Portal.</p>

        <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 800, color: "#4B5563" }}>CURRENT PASSWORD</label>
            <div style={{ position: "relative" }}>
              <input
                required
                type={showPass ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%", padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: 8,
                  fontSize: 13.5, outline: "none", paddingRight: 40
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute", right: 12, top: 12, background: "none", border: "none",
                  cursor: "pointer", color: "#9CA3AF"
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 800, color: "#4B5563" }}>NEW PASSWORD</label>
            <div style={{ position: "relative" }}>
              <input
                required
                type={showPass ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                style={{
                  width: "100%", padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: 8,
                  fontSize: 13.5, outline: "none", paddingRight: 40
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              marginTop: 10,
              width: "100%",
              padding: "12px",
              border: "none",
              borderRadius: 8,
              background: "linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 12px -2px rgba(79, 70, 229, 0.3)"
            }}
          >
            <Lock size={16} /> Update Password
          </button>
        </form>
      </div>

    </div>
  );
}
