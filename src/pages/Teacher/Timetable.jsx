import { useState, useEffect } from "react";
import { Clock, Calendar } from "lucide-react";
import { timetableApi } from "../../services/api";
import { toast } from "sonner";
import { useParams } from "react-router-dom";

export default function TPortalTimetable() {
  const { teacherId } = useParams();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadTimetable = async () => {
    setLoading(true);
    try {
      const storedUser = (() => { try { return JSON.parse(localStorage.getItem("sms_user") || "{}"); } catch { return {}; } })();
      const schoolId = storedUser.schoolId || "";

      const res = await timetableApi.getAll({ schoolId, limit: 100 });
      const backendSlots = res.data || [];

      // Process database slots into day-based schedule structure
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      const scheduleMap = {};
      days.forEach(d => {
        scheduleMap[d] = [];
      });

      backendSlots.forEach(s => {
        if (scheduleMap[s.day]) {
          scheduleMap[s.day].push({
            time: s.time,
            class: s.class,
            subject: s.subject,
            room: s.room
          });
        }
      });

      // Convert map to array structure
      const formattedSchedule = days.map(d => ({
        day: d,
        slots: scheduleMap[d]
      }));

      setSchedule(formattedSchedule);
    } catch (err) {
      toast.error("Failed to load weekly timetable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, [teacherId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1E293B" }}>Weekly Timetable</h2>
        <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Check your weekly lecture hours and class allocations.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {schedule.map((daySchedule, idx) => (
          <div key={idx} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <h3 style={{ margin: "0 0 14px 0", fontSize: 16, fontWeight: 900, color: "#0284C7", display: "flex", alignItems: "center", gap: 6 }}>
              <Calendar size={18} /> {daySchedule.day}
            </h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
              {daySchedule.slots.length === 0 ? (
                <div style={{ fontSize: 13, color: "#94A3B8", fontStyle: "italic", padding: "4px 0" }}>
                  No lectures scheduled for {daySchedule.day}
                </div>
              ) : (
                daySchedule.slots.map((slot, sIdx) => (
                  <div key={sIdx} style={{ background: "#F9FAFB", border: "1px solid #F3F4F6", padding: 14, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 11.5, color: "#9CA3AF", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Clock size={12} /> {slot.time}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#1E293B" }}>Class {slot.class}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: "#4B5563" }}>{slot.subject}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#0284C7", background: "#E0F2FE", padding: "4px 8px", borderRadius: 6 }}>
                      {slot.room}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
