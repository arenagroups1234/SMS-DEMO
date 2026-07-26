import { useState, useEffect } from "react";
import { usersApi } from "../../services/api";
import { BarChart3, TrendingUp, Users, Award, ShieldAlert } from "lucide-react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

export default function PortalReports() {
  const { schoolId: routeSchoolId } = useParams();
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem("sms_user") || "{}"); } catch { return {}; } })();
  const schoolId = routeSchoolId || storedUser.schoolId || "";

  const [counts, setCounts] = useState({ teachers: 0, students: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCounts = async () => {
      setLoading(true);
      try {
        const queryParams = { limit: 1000 };
        if (schoolId && String(schoolId).trim()) {
          queryParams.schoolId = schoolId;
        }

        const sRes = await usersApi.getAll({ ...queryParams, role: "student" });
        const tRes = await usersApi.getAll({ ...queryParams, role: "teacher" });

        setCounts({
          students: Array.isArray(sRes.data) ? sRes.data.length : 0,
          teachers: Array.isArray(tRes.data) ? tRes.data.length : 0
        });
      } catch (err) {
        console.warn("Could not load counts for reports dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    loadCounts();
  }, [schoolId]);

  const reports = [
    { 
      title: "Student Roster Ratios", 
      value: `${counts.students} Registered Student${counts.students === 1 ? "" : "s"}`, 
      trend: "Live school count", 
      icon: <Users size={20} /> 
    },
    { 
      title: "Teacher & Student Staff Ratio", 
      value: `${counts.teachers} Teacher${counts.teachers === 1 ? "" : "s"} : ${counts.students} Student${counts.students === 1 ? "" : "s"}`, 
      trend: `${counts.teachers} Active Teachers in school`, 
      icon: <Award size={20} /> 
    },
    { 
      title: "Financial Audit Summary", 
      value: `₹${counts.students * 120} Projected Fees`, 
      trend: "Calculated dynamically based on active students", 
      icon: <BarChart3 size={20} /> 
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1E293B" }}>SaaS Workspace Reports</h2>
        <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Review live counts, database ratios, and financial projections.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        {loading ? (
          <div style={{ gridColumn: "1 / -1", padding: 40, textAlign: "center", color: "#64748B" }}>Loading report stats...</div>
        ) : (
          reports.map((rep, idx) => (
            <div key={idx} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, background: "#EFF6FF", color: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {rep.icon}
                </div>
                <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: "#1E293B" }}>{rep.title}</h4>
              </div>

              <div style={{ fontSize: 22, fontWeight: 900, color: "#2563EB", marginBottom: 6 }}>{rep.value}</div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#16A34A", fontWeight: 700 }}>
                <TrendingUp size={14} /> {rep.trend}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
