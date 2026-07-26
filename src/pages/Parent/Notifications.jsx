import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { noticesApi, usersApi } from "../../services/api";
import { Bell, Calendar, Megaphone } from "lucide-react";
import { toast } from "sonner";

export default function PPortalNotifications() {
  const { studentId } = useParams();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadNotices = async () => {
      setLoading(true);
      try {
        const storedUser = (() => { try { return JSON.parse(localStorage.getItem("sms_user") || "{}"); } catch { return {}; } })();
        let studentSchoolId = storedUser.schoolId || "";
        let studentClass = storedUser.className || storedUser.class || "";
        let studentName = "";

        try {
          const sRes = await usersApi.getById(studentId);
          if (sRes.data) {
            studentName = sRes.data.name || "";
            if (sRes.data.schoolId) studentSchoolId = sRes.data.schoolId;
            if (sRes.data.className) studentClass = sRes.data.className;
          }
        } catch (e) {}

        if (!studentName && storedUser) {
          studentName = storedUser.name || storedUser.studentName || "";
        }

        // 2. Fetch notices for THIS school only
        const queryParams = { limit: 100 };
        if (studentSchoolId && String(studentSchoolId).trim()) {
          queryParams.schoolId = studentSchoolId;
        }
        const res = await noticesApi.getAll(queryParams);
        const rawNotices = res.data || [];
        const filtered = rawNotices.filter(n => {
          // Exclude draft notices for parents/students
          if ((n.status || "").toLowerCase() === "draft") {
            return false;
          }

          const catLower = (n.category || "").toLowerCase();

          // Exclude notices targeted exclusively at Teachers
          if (catLower.includes("teacher")) {
            return false;
          }

          // Exclude class-specific announcements that do not match student's class
          const genericCategories = ["all", "all users", "students", "students only", "general", "academic", "exam", "holiday", "event", "urgent", "fee", "notice"];
          if (n.category && !genericCategories.includes(catLower)) {
            if (studentClass) {
              const normStudentClass = studentClass.toLowerCase().replace(/class/g, "").trim();
              const normNoticeClass = catLower.replace(/class/g, "").trim();
              if (normNoticeClass && !normNoticeClass.includes(normStudentClass) && !normStudentClass.includes(normNoticeClass)) {
                return false;
              }
            }
          }

          const isSpecificNotice = n.title && (
            n.title.includes("Fee Deposition") || 
            n.title.includes("Alert") || 
            n.title.includes("Reminder") ||
            n.title.includes("Overdue") ||
            n.title.includes("Library")
          );
          if (isSpecificNotice) {
            const sNameLower = studentName.toLowerCase();
            const firstNameLower = studentName.split(" ")[0].toLowerCase();
            const titleLower = (n.title || "").toLowerCase();
            const descLower = (n.description || "").toLowerCase();

            return titleLower.includes(sNameLower) || 
                   (firstNameLower && titleLower.includes(firstNameLower)) ||
                   descLower.includes(sNameLower) ||
                   (firstNameLower && descLower.includes(firstNameLower));
          }
          return true; // Keep general notices intended for students/all
        });

        const liveNotices = filtered.map(n => ({
          id: n.id,
          title: n.title,
          description: n.description,
          publishDate: n.publishDate ? n.publishDate.split("T")[0] : "2026-07-09",
          category: n.category || "All"
        }));

        setNotices(liveNotices);
      } catch (err) {
        toast.error("Failed to load school bulletins notifications");
      } finally {
        setLoading(false);
      }
    };
    loadNotices();
  }, [studentId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1E293B", display: "flex", alignItems: "center", gap: 8 }}>
          <Megaphone size={24} color="#0284C7" /> School Notice Bulletins
        </h2>
        <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Stay updated with notices, updates, and announcements from the school admin.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {notices.length === 0 ? (
          <div style={{
            background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: 32,
            textAlign: "center", color: "#64748B", fontSize: 14
          }}>
            No notifications found.
          </div>
        ) : (
          notices.map(notice => (
            <div key={notice.id} style={{
              background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: 20,
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)", display: "flex", gap: 16
            }}>
              <div style={{
                width: 44, height: 44, background: "#E0F2FE", color: "#0284C7", borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>
                <Bell size={20} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <h4 style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", margin: 0 }}>{notice.title}</h4>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: "#0284C7", background: "#E0F2FE", padding: "3px 8px", borderRadius: 6 }}>
                    {notice.category}
                  </span>
                </div>

                <p style={{ fontSize: 13.5, color: "#4B5563", lineHeight: 1.5, margin: 0 }}>{notice.description}</p>

                <span style={{ fontSize: 11, color: "#9CA3AF", display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <Calendar size={12} /> Published on: {notice.publishDate}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
