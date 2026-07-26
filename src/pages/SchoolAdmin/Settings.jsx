import { useState } from "react";
import { Lock, School, Save } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";

export default function PortalSettings() {
  const { schoolId } = useParams();
  const [schoolName, setSchoolName] = useState("Sunrise Academy");
  const [principal, setPrincipal] = useState("Dr. Lawrence Bacow");
  const [phone, setPhone] = useState("1234567890");
  const [address, setAddress] = useState("Cambridge St, Boston");

  // SaaS feature licenses
  const [hostelEnabled, setHostelEnabled] = useState(() => {
    const saved = localStorage.getItem(`sms_${schoolId}_hostel_enabled`);
    return saved === "true";
  });

  const handleUpdate = (e) => {
    e.preventDefault();
    const nameVal = schoolName.trim();
    const princVal = principal.trim();
    const phoneVal = phone.trim();
    const addrVal = address.trim();

    if (!nameVal) {
      toast.error("School Name is required!");
      return;
    }
    if (nameVal.length < 3 || nameVal.length > 100) {
      toast.error("School Name must be between 3 and 100 characters!");
      return;
    }
    if (!princVal) {
      toast.error("Principal Name is required!");
      return;
    }
    if (princVal.length < 3 || princVal.length > 50) {
      toast.error("Principal Name must be between 3 and 50 characters!");
      return;
    }
    if (!phoneVal || phoneVal.length !== 10 || /\D/.test(phoneVal)) {
      toast.error("Contact Number must be exactly 10 digits!");
      return;
    }
    if (!addrVal) {
      toast.error("Campus Address is required!");
      return;
    }
    if (addrVal.length < 5 || addrVal.length > 150) {
      toast.error("Campus Address must be between 5 and 150 characters!");
      return;
    }

    localStorage.setItem(`sms_${schoolId}_hostel_enabled`, String(hostelEnabled));
    // Trigger custom event to notify layout sidebar
    window.dispatchEvent(new Event("sms_settings_update"));
    toast.success("School details & configuration settings saved successfully!");
  };

  return (
    <div className="responsive-settings-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24, alignItems: "start" }}>
      <style>{`
        @media (max-width: 1024px) {
          .responsive-settings-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      
      {/* School details config */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: 18, fontWeight: 900, color: "#1E293B", display: "flex", alignItems: "center", gap: 6 }}>
          <School size={18} color="#2563EB" /> Campus Configuration
        </h3>
        
        <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: "#4B5563" }}>School Name</label>
            <input
              type="text" required value={schoolName} onChange={e => setSchoolName(e.target.value)}
              style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: "#4B5563" }}>Principal Name</label>
            <input
              type="text" required value={principal} onChange={e => setPrincipal(e.target.value)}
              style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: "#4B5563" }}>Contact Number</label>
            <input
              type="text" required value={phone} onChange={e => setPhone(e.target.value)}
              style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: "#4B5563" }}>Campus Address</label>
            <input
              type="text" required value={address} onChange={e => setAddress(e.target.value)}
              style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none" }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: "12px", background: "#2563EB", color: "#fff", border: "none",
              borderRadius: 8, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
            }}
          >
            <Save size={16} /> Save Changes
          </button>
        </form>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Lock configurations preferences */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: 18, fontWeight: 900, color: "#1E293B", display: "flex", alignItems: "center", gap: 6 }}>
            <Lock size={18} color="#2563EB" /> Security Preferences
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: "1px solid #F3F4F6" }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1E293B" }}>Automatic Audit Trail</h4>
                <p style={{ margin: "2px 0 0 0", fontSize: 11.5, color: "#9CA3AF" }}>Save activity changes log in database audit table</p>
              </div>
              <input type="checkbox" defaultChecked style={{ width: 18, height: 18, cursor: "pointer" }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1E293B" }}>Daily Database Backups</h4>
                <p style={{ margin: "2px 0 0 0", fontSize: 11.5, color: "#9CA3AF" }}>Perform hourly sync logs of student/teacher records to cloud</p>
              </div>
              <input type="checkbox" defaultChecked style={{ width: 18, height: 18, cursor: "pointer" }} />
            </div>
          </div>
        </div>

        {/* SaaS Addons configurations controlled by Super Admin */}
      </div>

    </div>
  );
}
