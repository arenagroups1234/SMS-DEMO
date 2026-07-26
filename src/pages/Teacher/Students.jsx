import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { usersApi } from "../../services/api";
import { Users, Search, Mail, Phone, Book } from "lucide-react";
import { toast } from "sonner";

export default function TPortalStudents() {
  const { teacherId } = useParams();
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true);
      try {
        let teacher = {};
        try {
          const tRes = await usersApi.getById(teacherId);
          if (tRes.data) {
            teacher = tRes.data;
          }
        } catch (tErr) {
          console.warn("Could not load teacher profile from DB:", tErr);
          teacher = (() => { try { return JSON.parse(localStorage.getItem("sms_user") || "{}"); } catch { return {}; } })();
        }

        const schoolId = teacher.schoolId || "";
        
        let teacherClasses = [];
        if (Array.isArray(teacher.classes) && teacher.classes.length > 0) {
          teacherClasses = teacher.classes;
        } else if (typeof teacher.classes === "string" && teacher.classes) {
          teacherClasses = teacher.classes.split(",").map(c => c.trim()).filter(Boolean);
        } else if (typeof teacher.className === "string" && teacher.className) {
          teacherClasses = teacher.className.split(",").map(c => c.trim()).filter(Boolean);
        } else if (teacher.class) {
          teacherClasses = [teacher.class];
        }
        if (!teacherClasses || teacherClasses.length === 0) {
          teacherClasses = ["9th A", "9th B", "10th A", "10th B", "11th Science"];
        }

        const res = await usersApi.getAll({ role: "student", schoolId, limit: 100 });
        const liveStudents = (res.data || []).map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || "N/A",
          class: u.className || u.class || "9th A",
          rollNo: u.rollNumber || u.rollNo || "N/A"
        }));

        // Filter students belonging to this teacher's assigned classes
        const teacherClassesNormalized = teacherClasses.map(c => c.trim().toLowerCase());
        const teacherStudents = liveStudents.filter(s => teacherClassesNormalized.includes(s.class.trim().toLowerCase()));
        setStudents(teacherStudents);
      } catch (err) {
        toast.error("Failed to load students from database");
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, [teacherId]);

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1E293B" }}>My Students</h2>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>List of students enrolled in your assigned classes.</p>
        </div>

        {/* Search Bar */}
        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Search by student name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "10px 16px 10px 40px", border: "1px solid #D1D5DB", borderRadius: 10,
              fontSize: 14, outline: "none", width: 260, background: "#FFF"
            }}
          />
          <Search size={18} color="#9CA3AF" style={{ position: "absolute", left: 14, top: 12 }} />
        </div>
      </div>

      {/* Students Data Grid */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F9FAFB", borderBottom: "2px solid #E5E7EB" }}>
              <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "#4B5563" }}>Roll No</th>
              <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "#4B5563" }}>Student Name</th>
              <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "#4B5563" }}>Class Room</th>
              <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "#4B5563" }}>Contact Email</th>
              <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "#4B5563" }}>Parent Mobile</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((s, idx) => (
              <tr key={s.id || idx} style={{ borderBottom: "1px solid #F3F4F6" }}>
                <td style={{ padding: "14px 20px", fontSize: 13.5, fontWeight: 700, color: "#0284C7" }}>#{s.rollNo}</td>
                <td style={{ padding: "14px 20px", fontSize: 13.5, fontWeight: 800, color: "#1F2937" }}>{s.name}</td>
                <td style={{ padding: "14px 20px", fontSize: 13.5, color: "#4B5563" }}>
                  <span style={{ background: "#E0F2FE", color: "#0284C7", padding: "4px 8px", borderRadius: 6, fontWeight: 700 }}>
                    {s.class}
                  </span>
                </td>
                <td style={{ padding: "14px 20px", fontSize: 13, color: "#4B5563", display: "flex", alignItems: "center", gap: 6 }}>
                  <Mail size={14} color="#9CA3AF" /> {s.email}
                </td>
                <td style={{ padding: "14px 20px", fontSize: 13, color: "#4B5563" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Phone size={14} color="#9CA3AF" /> {s.phone}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
