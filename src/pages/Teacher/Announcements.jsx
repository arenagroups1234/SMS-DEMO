import { useState, useEffect } from "react";
import { noticesApi } from "../../services/api";
import { Bell, Calendar, Megaphone } from "lucide-react";
import { toast } from "sonner";

export default function TPortalAnnouncements() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadNotices = async () => {
      setLoading(true);
      try {
        const storedUser = (() => { try { return JSON.parse(localStorage.getItem("sms_user") || "{}"); } catch { return {}; } })();
        const schoolId = storedUser.schoolId || "";
        const userCreatedAt = storedUser.createdAt ? new Date(storedUser.createdAt) : null;

        const queryParams = { limit: 100 };
        if (schoolId && String(schoolId).trim()) {
          queryParams.schoolId = schoolId;
        }

        const res = await noticesApi.getAll(queryParams);
        const allNotices = res.data || [];
        
        // Filter by audience role & creation date
        const schoolNotices = allNotices.filter(n => {
          // Exclude private school admin system categories
          const adminSystemCategories = ["System", "Fees", "Admissions", "Activity"];
          if (adminSystemCategories.includes(n.category)) return false;

          // Exclude notices targeted exclusively at Students Only
          const catLower = (n.category || "").toLowerCase();
          if (catLower === "students" || catLower === "students only" || catLower === "student") {
            return false;
          }

          if (userCreatedAt && n.createdAt) {
            return new Date(n.createdAt) >= userCreatedAt;
          }
          return true;
        });

        const liveNotices = schoolNotices.map(n => ({
          id: n.id,
          title: n.title,
          description: n.description,
          publishDate: n.publishDate ? n.publishDate.split("T")[0] : "2026-07-09",
          category: n.category || "All"
        }));
        
        setNotices(liveNotices);

        // Mark all as read for this teacher
        if (storedUser.id && liveNotices.length > 0) {
          try {
            const key = `teacher_${storedUser.id}_read_notifications`;
            const storedRead = localStorage.getItem(key);
            const readList = storedRead ? JSON.parse(storedRead) : [];
            let updated = false;
            
            liveNotices.forEach(n => {
              if (!readList.includes(n.id)) {
                readList.push(n.id);
                updated = true;
              }
            });
            
            if (updated) {
              localStorage.setItem(key, JSON.stringify(readList));
              window.dispatchEvent(new Event("teacher_notifications_update"));
            }
          } catch (storageErr) {
            console.warn("Could not save read notifications state:", storageErr);
          }
        }
      } catch (err) {
        toast.error("Failed to load school announcements");
      } finally {
        setLoading(false);
      }
    };
    loadNotices();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1E293B", display: "flex", alignItems: "center", gap: 8 }}>
          <Megaphone size={24} color="#0284C7" /> Announcements Bulletin
        </h2>
        <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Access notices published by school administration.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {notices.map(notice => (
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
                  Target: {notice.category}
                </span>
              </div>
              
              <p style={{ fontSize: 13.5, color: "#4B5563", lineHeight: 1.5, margin: 0 }}>{notice.description}</p>
              
              <span style={{ fontSize: 11, color: "#9CA3AF", display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                <Calendar size={12} /> Published on: {notice.publishDate}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
