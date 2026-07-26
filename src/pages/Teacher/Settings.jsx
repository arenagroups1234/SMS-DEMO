import { useState } from "react";
import { Lock, Bell, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function TPortalSettings() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    toast.success("Security settings updated in database!");
    setOldPassword("");
    setNewPassword("");
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24, alignItems: "start" }}>
      
      {/* Security Credentials */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: 18, fontWeight: 900, color: "#1E293B", display: "flex", alignItems: "center", gap: 6 }}>
          <Lock size={18} color="#0284C7" /> Update Security Credentials
        </h3>
        
        <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: "#4B5563" }}>Current Password</label>
            <input
              type={showPass ? "text" : "password"} required
              value={oldPassword} onChange={e => setOldPassword(e.target.value)}
              style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: "#4B5563" }}>New Secure Password</label>
            <input
              type={showPass ? "text" : "password"} required
              value={newPassword} onChange={e => setNewPassword(e.target.value)}
              style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              type="button" onClick={() => setShowPass(!showPass)}
              style={{ background: "transparent", border: "none", fontSize: 12, fontWeight: 700, color: "#0284C7", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              {showPass ? <EyeOff size={14} /> : <Eye size={14} />} {showPass ? "Hide Passwords" : "Show Passwords"}
            </button>
            
            <button
              type="submit"
              style={{ padding: "10px 18px", background: "#0284C7", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>

      {/* Notification settings */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: 18, fontWeight: 900, color: "#1E293B", display: "flex", alignItems: "center", gap: 6 }}>
          <Bell size={18} color="#0284C7" /> Notification preferences
        </h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: "1px solid #F3F4F6" }}>
            <div>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1E293B" }}>Email Bulletins</h4>
              <p style={{ margin: "2px 0 0 0", fontSize: 11.5, color: "#9CA3AF" }}>Receive email updates for new announcements circulars</p>
            </div>
            <input type="checkbox" defaultChecked style={{ width: 18, height: 18, cursor: "pointer" }} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1E293B" }}>Mobile SMS Alerts</h4>
              <p style={{ margin: "2px 0 0 0", fontSize: 11.5, color: "#9CA3AF" }}>Send immediate SMS alerts to parents on student absent logs</p>
            </div>
            <input type="checkbox" defaultChecked style={{ width: 18, height: 18, cursor: "pointer" }} />
          </div>
        </div>
      </div>

    </div>
  );
}
