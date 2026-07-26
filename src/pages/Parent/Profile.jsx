import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usersApi } from "../../services/api";
import { User, Mail, Phone, Calendar, Lock } from "lucide-react";
import { toast } from "sonner";

export default function PPortalProfile() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const storedUser = (() => { try { return JSON.parse(localStorage.getItem("sms_user") || "{}"); } catch { return {}; } })();
        
        let match = null;
        try {
          const res = await usersApi.getAll({ role: "student", limit: 100 });
          const list = res.data || [];
          match = list.find(s => String(s.id) === String(studentId));
        } catch (e) {}

        if (!match && storedUser && (String(storedUser.id) === String(studentId) || storedUser.role === "student" || storedUser.role === "parent")) {
          match = storedUser;
        }

        if (match) {
          setStudent({
            id: match.id,
            name: match.name || match.studentName || "Student",
            email: match.email || "student@school.com",
            phone: match.phone || match.studentPhone || "",
            class: match.className || match.class || "N/A",
            rollNo: match.rollNumber || match.rollNo || "N/A"
          });
        } else {
          setStudent({
            id: studentId,
            name: "Registered Student",
            email: "student@school.com",
            phone: "",
            class: "N/A",
            rollNo: "N/A"
          });
        }
      } catch (err) {
        toast.error("Failed to load parent profile logs");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [studentId]);

  if (loading || !student) {
    return <div style={{ padding: 24 }}>Loading parent profile...</div>;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24, alignItems: "start" }}>
      
      {/* Profile Details */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28, borderBottom: "1px solid #F3F4F6", paddingBottom: 24 }}>
          <div style={{
            width: 72, height: 72, background: "#E0F2FE", color: "#0284C7", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 900
          }}>
            {student.name.charAt(0)}
          </div>
          
          <div>
            <h2 style={{ margin: "0 0 4px 0", fontSize: 22, fontWeight: 900, color: "#1E293B" }}>{student.name}</h2>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0284C7", background: "#E0F2FE", padding: "4px 10px", borderRadius: 6 }}>
              Parent Contact
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <User size={18} color="#9CA3AF" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#9CA3AF" }}>STUDENT REGISTERED ID</span>
              <span style={{ fontSize: 13.5, color: "#1E293B", fontWeight: 700 }}>{student.id}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Mail size={18} color="#9CA3AF" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#9CA3AF" }}>EMAIL ADDRESS</span>
              <span style={{ fontSize: 13.5, color: "#1E293B", fontWeight: 700 }}>{student.email}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Phone size={18} color="#9CA3AF" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#9CA3AF" }}>MOBILE NUMBER</span>
              <span style={{ fontSize: 13.5, color: "#1E293B", fontWeight: 700 }}>{student.phone}</span>
            </div>
          </div>

          <button
            onClick={() => navigate("/")}
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
    </div>
  );
}
