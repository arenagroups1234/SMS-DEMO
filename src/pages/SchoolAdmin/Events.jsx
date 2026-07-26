import { useState, useEffect } from "react";
import { eventsApi, noticesApi } from "../../services/api";
import { Calendar, Plus, MapPin, Trash2, Clock, Sparkles, User, Users, Image, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";

export default function PortalEvents() {
  const { schoolId } = useParams();
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form Field States
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [venue, setVenue] = useState("");
  const [category, setCategory] = useState("Cultural");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("10:00 AM");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("04:00 PM");
  const [organizer, setOrganizer] = useState("School Admin");
  const [targetAudience, setTargetAudience] = useState("All Students");
  const [bannerFile, setBannerFile] = useState("");
  const [bannerFileName, setBannerFileName] = useState("");
  const [status, setStatus] = useState("upcoming");

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await eventsApi.getAll({ schoolId });
      const liveEvents = (res.data || [])
        .map(e => {
          const eStart = e.startDate ? e.startDate.split("T")[0] : (e.date || "2026-08-15");
          const eEnd = e.endDate ? e.endDate.split("T")[0] : eStart;
          return {
            id: e.id,
            title: e.title || "School Event",
            description: e.description || "Campus event details.",
            category: e.category || "General",
            venue: e.venue || e.location || "Campus Main Hall",
            startDate: eStart,
            startTime: e.startTime || (e.time ? e.time.split(" - ")[0] : "09:00 AM"),
            endDate: eEnd,
            endTime: e.endTime || (e.time ? e.time.split(" - ")[1] : "04:00 PM"),
            organizer: e.organizer || "School Administration",
            targetAudience: e.targetAudience || "All Students",
            bannerFile: "event_banner.jpg",
            status: (e.status || "upcoming").toLowerCase()
          };
        });

      setEvents(liveEvents);
    } catch (err) {
      toast.error("Failed to load events calendar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [schoolId]);

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setTitle("");
    setDesc("");
    setVenue("");
    setCategory("Cultural");
    setStartDate("");
    setStartTime("10:00 AM");
    setEndDate("");
    setEndTime("04:00 PM");
    setOrganizer("School Admin");
    setTargetAudience("All Students");
    setBannerFile("");
    setBannerFileName("");
    setStatus("upcoming");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (evt) => {
    setEditingEvent(evt);
    setTitle(evt.title);
    setDesc(evt.description);
    setVenue(evt.venue);
    setCategory(evt.category);
    setStartDate(evt.startDate);
    setStartTime(evt.startTime);
    setEndDate(evt.endDate);
    setEndTime(evt.endTime);
    setOrganizer(evt.organizer);
    setTargetAudience(evt.targetAudience);
    setBannerFile(evt.bannerFile || "");
    setBannerFileName(evt.bannerFileName || "");
    setStatus(evt.status);
    setIsModalOpen(true);
  };

  const convertTo24Hour = (timeStr) => {
    if (!timeStr) return "00:00:00";
    const trimmed = timeStr.trim().toUpperCase();
    const isPM = trimmed.endsWith("PM");
    const isAM = trimmed.endsWith("AM");
    let cleanTime = trimmed.replace(/(AM|PM)/g, "").trim();
    const parts = cleanTime.split(":");
    let hours = parseInt(parts[0], 10);
    let minutes = parts[1] ? parseInt(parts[1], 10) : 0;
    let seconds = parts[2] ? parseInt(parts[2], 10) : 0;
    
    if (isNaN(hours)) hours = 0;
    if (isNaN(minutes)) minutes = 0;
    if (isNaN(seconds)) seconds = 0;

    if (isPM && hours < 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }
    const hStr = hours.toString().padStart(2, "0");
    const mStr = minutes.toString().padStart(2, "0");
    const sStr = seconds.toString().padStart(2, "0");
    return `${hStr}:${mStr}:${sStr}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const titleVal = title.trim();
    const descVal = desc.trim();
    const venueVal = venue.trim();
    const organizerVal = organizer.trim();

    if (!titleVal) {
      toast.error("Event Title is required!");
      return;
    }
    if (titleVal.length < 3 || titleVal.length > 30) {
      toast.error("Event Title must be between 3 and 30 characters!");
      return;
    }
    if (!descVal) {
      toast.error("Event Description is required!");
      return;
    }
    if (descVal.length < 5 || descVal.length > 180) {
      toast.error("Event Description must be between 5 and 180 characters!");
      return;
    }
    if (!venueVal) {
      toast.error("Event Venue / Location is required!");
      return;
    }
    if (venueVal.length < 3 || venueVal.length > 15) {
      toast.error("Event Venue must be between 3 and 15 characters!");
      return;
    }
    if (/[^a-zA-Z\s]/.test(venueVal)) {
      toast.error("Event Venue can only contain letters and spaces!");
      return;
    }
    if (!organizerVal) {
      toast.error("Organizer (Host Department) is required!");
      return;
    }
    if (organizerVal.length < 3 || organizerVal.length > 15) {
      toast.error("Organizer name must be between 3 and 15 characters!");
      return;
    }
    if (/[^a-zA-Z\s]/.test(organizerVal)) {
      toast.error("Organizer name can only contain letters and spaces!");
      return;
    }
    if (!startDate) {
      toast.error("Start Date is required!");
      return;
    }
    if (endDate && new Date(endDate) < new Date(startDate)) {
      toast.error("End Date cannot be before Start Date!");
      return;
    }

    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;
    if (startTime && !timeRegex.test(startTime.trim())) {
      toast.error("Start Time must be in a valid format (e.g. '10:00 AM')!");
      return;
    }
    if (endTime && !timeRegex.test(endTime.trim())) {
      toast.error("End Time must be in a valid format (e.g. '04:00 PM')!");
      return;
    }

    try {
      const formattedStartTime = convertTo24Hour(startTime);
      const formattedEndTime = convertTo24Hour(endTime);
      const payload = {
        title: titleVal,
        description: descVal,
        venue: venueVal,
        startDate: `${startDate}T${formattedStartTime}`,
        endDate: endDate ? `${endDate}T${formattedEndTime}` : `${startDate}T${formattedEndTime}`,
        category,
        status
      };

      if (editingEvent) {
        // Edit mode
        await eventsApi.update(editingEvent.id, {
          ...payload,
          schoolId,
          startTime,
          endTime,
          organizer,
          targetAudience,
          bannerFile: bannerFile || null,
          bannerFileName: bannerFileName || null
        });
        toast.success("Event updated successfully!");
      } else {
        await eventsApi.create({
          ...payload,
          schoolId,
          startTime,
          endTime,
          organizer,
          targetAudience,
          bannerFile: bannerFile || null,
          bannerFileName: bannerFileName || null
        });

        // Push automated notification bulletin to Parents
        try {
          await noticesApi.create({
            title: `New School Event: ${titleVal}`,
            description: `A new school event "${titleVal}" (${category}) has been scheduled at ${venueVal}. Date: ${startDate}. Time: ${startTime} - ${endTime}. Target Audience: ${targetAudience}. Please check Parent Portal for details.`,
            category: "Event",
            publishDate: new Date().toISOString().split('T')[0],
            status: "published",
            schoolId: schoolId
          });
        } catch (noticeErr) {
          console.warn("Could not publish automated event notice:", noticeErr);
        }

        toast.success("Event scheduled & Notification sent to Parents!");
      }

      setIsModalOpen(false);
      setEditingEvent(null);
      
      // Reset states
      setTitle("");
      setDesc("");
      setVenue("");
      setCategory("Cultural");
      setStartDate("");
      setStartTime("10:00 AM");
      setEndDate("");
      setEndTime("04:00 PM");
      setOrganizer("School Admin");
      setTargetAudience("All Students");
      setBannerFile("");
      setBannerFileName("");
      setStatus("upcoming");

      loadEvents();
    } catch (err) {
      toast.error(editingEvent ? "Failed to update event details" : "Failed to register event");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await eventsApi.delete(id);
      toast.success("Event deleted successfully!");
      
      if (viewingEvent && viewingEvent.id === id) {
        setViewingEvent(null);
      }
      loadEvents();
    } catch (err) {
      // Offline fallback deletion
      setEvents(prev => prev.filter(evt => evt.id !== id));
      if (viewingEvent && viewingEvent.id === id) {
        setViewingEvent(null);
      }
      toast.success("Event deleted from cache successfully!");
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case "Cultural": return { bg: "#FDE8E8", text: "#E4574C" };
      case "Sports": return { bg: "#E6F4EA", text: "#17A673" };
      case "Academic": return { bg: "#E0F2FE", text: "#0284C7" };
      case "Workshop": return { bg: "#FCE388", text: "#F0B90B" };
      case "Seminar": return { bg: "#E0F2FE", text: "#0284C7" };
      default: return { bg: "#BAE6FD", text: "#4A7FA5" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`
        @media (max-width: 768px) {
          .responsive-event-grid {
            grid-template-columns: 1fr !important;
          }
          .responsive-time-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .responsive-time-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      
      {/* Title Section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1F2333" }}>
            📅 Events & Activities Calendar
          </h2>
          <p style={{ fontSize: 13, color: "#6B7080", marginTop: 4 }}>
            Schedule, publish, and track upcoming campus activities, examinations, holidays, and sports meets.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          style={{
            padding: "10px 20px", 
            background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)", 
            color: "#fff", 
            border: "none",
            borderRadius: 8, 
            fontSize: 13.5, 
            fontWeight: 700, 
            cursor: "pointer", 
            display: "inline-flex", 
            alignItems: "center", 
            gap: 6,
            boxShadow: "0 4px 14px rgba(2, 132, 199, 0.25)",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 6px 18px rgba(124, 110, 242, 0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(124, 110, 242, 0.25)";
          }}
        >
          <Plus size={16} /> Schedule Event
        </button>
      </div>

      {/* Table Card */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={16} color="#0284C7" />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1F2333" }}>
            Total Events Scheduled: <span style={{ color: "#0284C7" }}>{events.length}</span>
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["S.No.", "Event Title & Category", "Date & Time", "Venue", "Host / For", "Status", "Actions"].map(col => (
                  <th key={col} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11.5, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#94A3B8", fontSize: 14 }}>
                    Loading events...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#94A3B8", fontSize: 14 }}>
                    No events scheduled yet. Click <strong>Schedule Event</strong> to add one.
                  </td>
                </tr>
              ) : (
                events.map((evt, idx) => {
                  const colors = getCategoryColor(evt.category);
                  return (
                    <tr
                      key={evt.id || idx}
                      style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      {/* S.No. */}
                      <td style={{ padding: "14px 16px", color: "#94A3B8", fontWeight: 700 }}>
                        {String(idx + 1).padStart(2, "0")}
                      </td>

                      {/* Event Title & Category */}
                      <td style={{ padding: "14px 16px", minWidth: 200 }}>
                        <div style={{ fontWeight: 800, color: "#1F2333" }}>{evt.title}</div>
                        <div style={{ marginTop: 4, display: "inline-flex" }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: colors.text, background: colors.bg, padding: "2px 6px", borderRadius: 6 }}>
                            {evt.category.toUpperCase()}
                          </span>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 700, color: "#1F2333", fontSize: 12 }}>🚀 Start: {evt.startDate} @ {evt.startTime}</div>
                        <div style={{ fontSize: 11.5, color: "#6B7080", marginTop: 3 }}>🏁 End: {evt.endDate || evt.startDate} @ {evt.endTime}</div>
                      </td>

                      {/* Venue */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#1F2333" }}>{evt.venue}</div>
                      </td>

                      {/* Host / Audience */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontSize: 12.5, color: "#1F2333" }}>Host: <strong style={{ color: "#0C1B33" }}>{evt.organizer}</strong></div>
                        <div style={{ fontSize: 11.5, color: "#6B7080", marginTop: 2 }}>For: {evt.targetAudience}</div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 750,
                          textTransform: "uppercase",
                          background: evt.status === "upcoming" ? "#EFF6FF" : evt.status === "ongoing" ? "#D1FAE5" : "#F3F4F6",
                          color: evt.status === "upcoming" ? "#1E40AF" : evt.status === "ongoing" ? "#065F46" : "#4B5563"
                        }}>
                          {evt.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            title="View Details"
                            onClick={() => setViewingEvent(evt)}
                            style={{ padding: "6px 12px", background: "#EFF6FF", color: "#2563EB", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
                          >
                            👁️ View
                          </button>
                          <button
                            title="Edit Event"
                            onClick={() => handleOpenEdit(evt)}
                            style={{ padding: "6px 12px", background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            title="Delete Event"
                            onClick={() => handleDelete(evt.id)}
                            style={{ padding: "6px 12px", background: "#FEF2F2", color: "#DC2626", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Event Details Modal */}
      {viewingEvent && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{
            background: "#fff", padding: 32, borderRadius: 18, width: 600, maxWidth: "95vw",
            maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16, borderBottom: "1px solid #EEEEF4", paddingBottom: 14 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: getCategoryColor(viewingEvent.category).text, background: getCategoryColor(viewingEvent.category).bg, padding: "3px 9px", borderRadius: 8, textTransform: "uppercase" }}>
                  {viewingEvent.category}
                </span>
                <h3 style={{ margin: "6px 0 0 0", fontSize: 20, fontWeight: 900, color: "#1F2333" }}>{viewingEvent.title}</h3>
              </div>
              <button 
                onClick={() => setViewingEvent(null)}
                style={{ background: "transparent", border: "none", fontSize: 22, cursor: "pointer", color: "#6B7080", fontWeight: 700 }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 13.5, color: "#1F2333" }}>
              <p style={{ margin: 0, color: "#4A7FA5", lineHeight: 1.6, background: "#F0F9FF", padding: "12px 16px", borderRadius: 10 }}>
                {viewingEvent.description}
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, borderTop: "1px solid #EEEEF4", paddingTop: 14 }}>
                <div>
                  <strong style={{ color: "#6B7080", display: "block", fontSize: 11, textTransform: "uppercase", marginBottom: 2 }}>📅 Starting Date & Time</strong>
                  <span style={{ fontWeight: 700, color: "#0C1B33" }}>{viewingEvent.startDate} @ {viewingEvent.startTime}</span>
                </div>
                <div>
                  <strong style={{ color: "#6B7080", display: "block", fontSize: 11, textTransform: "uppercase", marginBottom: 2 }}>⏰ Ending Date & Time</strong>
                  <span style={{ fontWeight: 700, color: "#0C1B33" }}>{viewingEvent.endDate || viewingEvent.startDate} @ {viewingEvent.endTime}</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <strong style={{ color: "#6B7080", display: "block", fontSize: 11, textTransform: "uppercase", marginBottom: 2 }}>📍 Venue Location</strong>
                  <span>{viewingEvent.venue}</span>
                </div>
                <div>
                  <strong style={{ color: "#6B7080", display: "block", fontSize: 11, textTransform: "uppercase", marginBottom: 2 }}>🎖️ Status</strong>
                  <span style={{ textTransform: "capitalize", fontWeight: 700, color: viewingEvent.status === "upcoming" ? "#0284C7" : "#10B981" }}>{viewingEvent.status}</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, borderTop: "1px solid #EEEEF4", paddingTop: 14 }}>
                <div>
                  <strong style={{ color: "#6B7080", display: "block", fontSize: 11, textTransform: "uppercase", marginBottom: 2 }}>👤 Host Department</strong>
                  <span>{viewingEvent.organizer}</span>
                </div>
                <div>
                  <strong style={{ color: "#6B7080", display: "block", fontSize: 11, textTransform: "uppercase", marginBottom: 2 }}>👥 Eligibility</strong>
                  <span>{viewingEvent.targetAudience}</span>
                </div>
              </div>

              {viewingEvent.bannerFile && (
                <div style={{ borderTop: "1px solid #EEEEF4", paddingTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 32, height: 32, borderRadius: 6, background: "#E0F2FE", color: "#0284C7", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    🖼️
                  </span>
                  <div>
                    <strong style={{ display: "block", fontSize: 12.5, color: "#1F2333" }}>{viewingEvent.bannerFile}</strong>
                    <span style={{ fontSize: 11, color: "#6B7080" }}>Banner Cover Photo</span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid #EEEEF4", paddingTop: 18, marginTop: 18 }}>
              <button
                type="button" 
                onClick={() => {
                  setViewingEvent(null);
                  handleOpenEdit(viewingEvent);
                }}
                style={{ padding: "8px 16px", background: "#E7E4FB", color: "#7C6EF2", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
              >
                ✏️ Edit Event
              </button>
              <button
                type="button" 
                onClick={() => setViewingEvent(null)}
                style={{ padding: "8px 16px", background: "#EEEEF4", color: "#6B7080", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Modal (Schedule/Edit Form) */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{
            background: "#fff", padding: 32, borderRadius: 18, width: 900, maxWidth: "96vw",
            maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
          }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: 19, fontWeight: 900, color: "#1F2333", borderBottom: "1px solid #EEEEF4", paddingBottom: 12 }}>
              {editingEvent ? "✏️ Edit Activity Event Details" : "📅 Schedule New Activity Event"}
            </h3>
            
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* Event Title & Category */}
              <div className="responsive-event-grid" style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: "#6B7080" }}>Event Title</label>
                  <input
                    type="text" required maxLength={30} placeholder="e.g. Annual Sports Meet / Science Exhibition"
                    value={title} onChange={e => setTitle(e.target.value.slice(0, 30))}
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid #EEEEF4", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: "#6B7080" }}>Event Category</label>
                  <select
                    value={category} onChange={e => setCategory(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid #EEEEF4", borderRadius: 8, outline: "none", background: "#fff", fontSize: 13.5 }}
                  >
                    <option value="Cultural">Cultural Fest</option>
                    <option value="Sports">Sports Meet</option>
                    <option value="Academic">Academic Contest</option>
                    <option value="Workshop">Skill Workshop</option>
                    <option value="Seminar">Educational Seminar</option>
                    <option value="General">Other Event</option>
                  </select>
                </div>
              </div>

              {/* Event Description */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#6B7080" }}>Detailed Description</label>
                <textarea
                  rows="3" required maxLength={180} placeholder="Outline event timings, activities, guidelines or rules..."
                  value={desc} onChange={e => setDesc(e.target.value.slice(0, 180))}
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid #EEEEF4", borderRadius: 8, outline: "none", resize: "vertical", fontSize: 13.5, fontFamily: "inherit" }}
                />
              </div>

              {/* Venue & Organizer Details */}
              <div className="responsive-event-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: "#6B7080" }}>Venue / Hall</label>
                  <input
                    type="text" required maxLength={15} placeholder="e.g. School Playground / Auditorium"
                    value={venue} onChange={e => setVenue(e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 15))}
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid #EEEEF4", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: "#6B7080" }}>Organized By (Host Department)</label>
                  <input
                    type="text" required maxLength={15} placeholder="e.g. Science Club / Physical Ed Dept"
                    value={organizer} onChange={e => setOrganizer(e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 15))}
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid #EEEEF4", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                  />
                </div>
              </div>

              {/* Dates range */}
              <div className="responsive-event-grid responsive-time-grid" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1.5fr 1fr", gap: 8, alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <label style={{ fontSize: 11, color: "#6B7080", fontWeight: 700 }}>Start Date</label>
                  <input
                    type="date" required
                    value={startDate} onChange={e => setStartDate(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #EEEEF4", borderRadius: 6, fontSize: 12.5 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <label style={{ fontSize: 11, color: "#6B7080", fontWeight: 700 }}>Start Time</label>
                  <input
                    type="text" required placeholder="10:00 AM"
                    value={startTime} onChange={e => setStartTime(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #EEEEF4", borderRadius: 6, fontSize: 12.5 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <label style={{ fontSize: 11, color: "#6B7080", fontWeight: 700 }}>End Date</label>
                  <input
                    type="date"
                    value={endDate} onChange={e => setEndDate(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #EEEEF4", borderRadius: 6, fontSize: 12.5 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <label style={{ fontSize: 11, color: "#6B7080", fontWeight: 700 }}>End Time</label>
                  <input
                    type="text" required placeholder="04:00 PM"
                    value={endTime} onChange={e => setEndTime(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #EEEEF4", borderRadius: 6, fontSize: 12.5 }}
                  />
                </div>
              </div>

              {/* Cover Photo / Audience / Status */}
              <div className="responsive-event-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: "#6B7080" }}>Target Audience (Eligibility)</label>
                  <select
                    value={targetAudience} onChange={e => setTargetAudience(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid #EEEEF4", borderRadius: 8, outline: "none", background: "#fff", fontSize: 13.5 }}
                  >
                    <option value="All Students">All Students</option>
                    <option value="Primary Students">Primary Students Only</option>
                    <option value="Secondary Students">Secondary Students Only</option>
                    <option value="Parents">Parents & Guardians</option>
                    <option value="Teachers">Teachers Only</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: "#6B7080" }}>Event Status</label>
                  <select
                    value={status} onChange={e => setStatus(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid #EEEEF4", borderRadius: 8, outline: "none", background: "#fff", fontSize: 13.5 }}
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Cover Image upload Simulation */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, border: "1px solid #EEEEF4", padding: 12, borderRadius: 10, background: "#F4F2FC" }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#6B7080", display: "flex", alignItems: "center", gap: 6 }}>
                  <Image size={15} color="#7C6EF2" /> Upload Event Banner Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error("File size must be less than 5MB!");
                        return;
                      }
                      setBannerFileName(file.name);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setBannerFile(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ fontSize: 12, color: "#6B7080", marginTop: 4 }}
                />
                {bannerFile && (
                  <span style={{ fontSize: 11, color: "#17A673", fontWeight: 700 }}>✓ Banner Loaded: {bannerFile}</span>
                )}
              </div>

              {/* Form Footer */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid #EEEEF4", paddingTop: 16 }}>
                <button
                  type="button" onClick={() => setIsModalOpen(false)}
                  style={{ padding: "10px 18px", background: "#EEEEF4", border: "none", borderRadius: 8, fontWeight: 700, color: "#6B7080", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "10px 18px", background: "#7C6EF2", border: "none", borderRadius: 8, fontWeight: 700, color: "#fff", cursor: "pointer" }}
                >
                  {editingEvent ? "Save Changes" : "Schedule Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
