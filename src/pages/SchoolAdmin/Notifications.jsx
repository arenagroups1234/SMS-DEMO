import { useState, useEffect } from "react";
import { Bell, Trash2, Check, AlertCircle, Award, DollarSign, UserPlus, Filter } from "lucide-react";
import { toast } from "sonner";

const CARD = {
  background: "#FFFFFF",
  border: "1px solid #E2E8F0",
  borderRadius: 16,
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.005)",
  padding: 18,
  display: "flex",
  alignItems: "start",
  gap: 14,
  transition: "all 0.15s ease",
};

const CATEGORIES = ["All", "Admissions", "Fees", "System", "Activity"];

import { useParams } from "react-router-dom";
import { noticesApi } from "../../services/api";

export default function PortalNotifications() {
  const { schoolId } = useParams();
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    const loadNotices = async () => {
      let dbNotices = [];
      try {
        const queryParams = { limit: 100 };
        if (schoolId && String(schoolId).trim()) {
          queryParams.schoolId = schoolId;
        }
        const res = await noticesApi.getAll(queryParams);
        const rawList = res.data || [];
        dbNotices = rawList
          .map(n => ({
            id: n.id,
            schoolId: schoolId,
            title: n.title || 'System Broadcast',
            description: n.description,
            type: n.category === 'All' ? 'System' : (n.category || 'System'),
            date: n.createdAt ? new Date(n.createdAt).toLocaleString('en-US', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
            }) : 'Just now',
            read: false
          }));
      } catch (err) {
        console.error('Could not load backend notices:', err);
      }

      let readIds = [];
      let deletedIds = [];
      try {
        const storedRead = localStorage.getItem("school_admin_read_notifications");
        if (storedRead) readIds = JSON.parse(storedRead);
      } catch {}
      try {
        const storedDeleted = localStorage.getItem("school_admin_deleted_notifications");
        if (storedDeleted) deletedIds = JSON.parse(storedDeleted);
      } catch {}

      let storedFiltered = [];
      try {
        const stored = localStorage.getItem("school_admin_notifications");
        if (stored) {
          storedFiltered = JSON.parse(stored).filter(n => n.schoolId === schoolId);
        }
      } catch (e) {
        console.error(e);
      }

      const defaults = [
        {
          id: `notif-1-${schoolId}`,
          schoolId: schoolId,
          title: "Admission Verification Pending",
          description: "New Student admission request for Rohan Sharma is awaiting approval. Review parent credentials and TC scans.",
          type: "Admissions",
          date: "Today, 10:30 AM",
          read: false
        },
        {
          id: `notif-2-${schoolId}`,
          schoolId: schoolId,
          title: "Weekly Attendance Compiled",
          description: "Attendance records for the week ending July 9th are compiled. Current average attendance is at 93.6%.",
          type: "Activity",
          date: "Today, 08:00 AM",
          read: false
        },
        {
          id: `notif-3-${schoolId}`,
          schoolId: schoolId,
          title: "Fees Ledger Milestone Alert",
          description: "Outstanding school fee ledger has reached ₹12,450. Check due fees records to dispatch notifications.",
          type: "Fees",
          date: "Yesterday, 04:15 PM",
          read: true
        },
        {
          id: `notif-4-${schoolId}`,
          schoolId: schoolId,
          title: "Exam Timetable Broadcasted",
          description: "Midterm Examination 2026 syllabus guidelines and datesheet published to 9th and 10th grade student channels.",
          type: "System",
          date: "Yesterday, 11:30 AM",
          read: true
        },
        {
          id: `notif-5-${schoolId}`,
          schoolId: schoolId,
          title: "New Faculty Registered",
          description: "Albert Einstein has completed registration and was mapped to the Physics department list.",
          type: "Activity",
          date: "2 days ago",
          read: true
        }
      ];

      const baseList = storedFiltered.length > 0 ? storedFiltered : defaults;
      
      // Combine dbNotices + baseList (avoiding duplicate IDs)
      const existingIds = new Set(baseList.map(b => b.id));
      const newFromDb = dbNotices.filter(d => !existingIds.has(d.id));
      const combined = [...newFromDb, ...baseList];

      // Map read status and filter out deleted ones
      const finalNotifs = combined
        .map(n => ({
          ...n,
          read: n.read || readIds.includes(n.id)
        }))
        .filter(n => !deletedIds.includes(n.id));

      setNotifications(finalNotifs);

      try {
        const stored = localStorage.getItem("school_admin_notifications");
        const allNotifs = stored ? JSON.parse(stored) : [];
        const otherNotifs = allNotifs.filter(n => n.schoolId !== schoolId);
        const updated = [...otherNotifs, ...finalNotifs];
        localStorage.setItem("school_admin_notifications", JSON.stringify(updated));
        window.dispatchEvent(new Event("school_admin_notifications_update"));
      } catch {}
    };

    loadNotices();
  }, [schoolId]);

  const saveNotifications = (updatedList) => {
    setNotifications(updatedList);
    try {
      const stored = localStorage.getItem("school_admin_notifications");
      const allNotifs = stored ? JSON.parse(stored) : [];
      const otherNotifs = allNotifs.filter(n => n.schoolId !== schoolId);
      const updated = [...otherNotifs, ...updatedList];
      localStorage.setItem("school_admin_notifications", JSON.stringify(updated));
    } catch {}
    // Trigger custom event so layout navbar bell dot updates immediately
    window.dispatchEvent(new Event("school_admin_notifications_update"));
  };

  const handleMarkAsRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);

    try {
      const storedRead = localStorage.getItem("school_admin_read_notifications");
      const readList = storedRead ? JSON.parse(storedRead) : [];
      if (!readList.includes(id)) {
        readList.push(id);
        localStorage.setItem("school_admin_read_notifications", JSON.stringify(readList));
      }
    } catch {}

    saveNotifications(updated);
    toast.success("Marked as read!");
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);

    try {
      const storedRead = localStorage.getItem("school_admin_read_notifications");
      const readList = storedRead ? JSON.parse(storedRead) : [];
      notifications.forEach(n => {
        if (!readList.includes(n.id)) {
          readList.push(n.id);
        }
      });
      localStorage.setItem("school_admin_read_notifications", JSON.stringify(readList));
    } catch {}

    saveNotifications(updated);
    toast.success("All notifications marked as read!");
  };

  const handleDelete = (id) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);

    try {
      const storedDeleted = localStorage.getItem("school_admin_deleted_notifications");
      const deletedList = storedDeleted ? JSON.parse(storedDeleted) : [];
      if (!deletedList.includes(id)) {
        deletedList.push(id);
        localStorage.setItem("school_admin_deleted_notifications", JSON.stringify(deletedList));
      }
    } catch {}

    saveNotifications(updated);
    toast.success("Notification deleted successfully!");
  };

  const handleClearAll = () => {
    if (!window.confirm("Are you sure you want to delete all notifications?")) return;

    try {
      const storedDeleted = localStorage.getItem("school_admin_deleted_notifications");
      const deletedList = storedDeleted ? JSON.parse(storedDeleted) : [];
      notifications.forEach(n => {
        if (!deletedList.includes(n.id)) {
          deletedList.push(n.id);
        }
      });
      localStorage.setItem("school_admin_deleted_notifications", JSON.stringify(deletedList));
    } catch {}

    setNotifications([]);
    saveNotifications([]);
    toast.success("All notifications cleared!");
  };

  const getIcon = (type) => {
    switch (type) {
      case "Admissions":
        return { icon: <UserPlus size={20} />, bg: "#EFF6FF", color: "#2563EB" };
      case "Fees":
        return { icon: <DollarSign size={20} />, bg: "#FEF3C7", color: "#D97706" };
      case "System":
        return { icon: <AlertCircle size={20} />, bg: "#FEE2E2", color: "#EF4444" };
      default:
        return { icon: <Award size={20} />, bg: "#F1F5F9", color: "#475569" };
    }
  };

  const filtered = notifications.filter(n => activeTab === "All" || n.type === activeTab);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* Title Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1E293B" }}>
            🔔 Notification Center
          </h2>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
            Monitor system audits, user registrations, outstanding alerts, and broadcast confirmations.
          </p>
        </div>

        {notifications.length > 0 && (
          <div style={{ display: "flex", gap: 10 }}>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  padding: "8px 16px", background: "#EFF6FF", color: "#2563EB", border: "none",
                  borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4
                }}
              >
                <Check size={14} /> Mark all read
              </button>
            )}
            <button
              onClick={handleClearAll}
              style={{
                padding: "8px 16px", background: "#FEE2E2", color: "#EF4444", border: "none",
                borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4
              }}
            >
              <Trash2 size={14} /> Clear all
            </button>
          </div>
        )}
      </div>

      {/* Categories Filter Tabs */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, borderBottom: "1px solid #E2E8F0" }}>
        {CATEGORIES.map(cat => {
          const isActive = activeTab === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              style={{
                padding: "8px 16px",
                border: "none",
                borderRadius: 20,
                background: isActive ? "#2563EB" : "transparent",
                color: isActive ? "#fff" : "#475569",
                fontWeight: 700,
                fontSize: 12.5,
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap"
              }}
            >
              {cat === "All" ? `📯 All Alerts (${notifications.length})` : cat}
            </button>
          );
        })}
      </div>

      {/* Notifications List Stack */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
        {filtered.length === 0 ? (
          <div style={{ ...CARD, display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px", textAlign: "center", color: "#64748B" }}>
            <Bell size={40} color="#94A3B8" style={{ marginBottom: 12 }} />
            <strong style={{ fontSize: 15, color: "#1E293B" }}>No notifications found</strong>
            <span style={{ fontSize: 13 }}>All caught up! There are no alerts in this category.</span>
          </div>
        ) : (
          filtered.map(item => {
            const look = getIcon(item.type);
            return (
              <div
                key={item.id}
                style={{
                  ...CARD,
                  background: item.read ? "#FFFFFF" : "#F0F7FF",
                  border: item.read ? "1px solid #E2E8F0" : "1px solid #BFDBFE"
                }}
              >
                {/* Status dot */}
                {!item.read && (
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563EB", marginTop: 6 }} />
                )}

                {/* Category Icon */}
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: look.bg, color: look.color,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  {look.icon}
                </div>

                {/* Body Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#1E293B" }}>
                      {item.title}
                    </h4>
                    <span style={{ fontSize: 11, color: "#94A3B8", whiteSpace: "nowrap" }}>{item.date}</span>
                  </div>
                  <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
                    {item.description}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, alignSelf: "center" }}>
                  {!item.read && (
                    <button
                      onClick={() => handleMarkAsRead(item.id)}
                      style={{
                        width: 32, height: 32, borderRadius: 6, border: "1px solid #E2E8F0",
                        background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#16A34A"
                      }}
                      title="Mark as Read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{
                      width: 32, height: 32, borderRadius: 6, border: "1px solid #E2E8F0",
                      background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#EF4444"
                    }}
                    title="Delete Notification"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
