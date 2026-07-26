import { useState, useEffect } from "react";
import { usersApi, feesApi, noticesApi } from "../../services/api";
import { DollarSign, CheckCircle2, AlertCircle, Search, CreditCard, BellRing, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";

export default function PortalFees() {
  const { schoolId } = useParams();
  const [payments, setPayments] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [loading, setLoading] = useState(false);

  // Settings state for custom global Q1-Q4 due dates
  const [showSettings, setShowSettings] = useState(false);
  const [q1Date, setQ1Date] = useState("2026-06-15");
  const [q2Date, setQ2Date] = useState("2026-09-15");
  const [q3Date, setQ3Date] = useState("2026-12-15");
  const [q4Date, setQ4Date] = useState("2027-03-15");

  // State for alert checks message history
  const [showHistory, setShowHistory] = useState(false);
  const [alertHistory, setAlertHistory] = useState([]);

  const formatHeaderDate = (dateStr, defaultText) => {
    if (!dateStr || dateStr === "-") return defaultText;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return defaultText;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch (e) {
      return defaultText;
    }
  };

  const loadAlertHistory = async () => {
    try {
      const res = await noticesApi.getAll({ schoolId, limit: 100 });
      const list = (res.data || [])
        .filter(n => n.title && (n.title.includes("Alert") || n.title.includes("Reminder")))
        .map(n => ({
          id: n.id,
          title: n.title,
          description: n.description,
          publishDate: n.publishDate ? n.publishDate.split("T")[0] : "-"
        }))
        .reverse(); // Newest first
      setAlertHistory(list);

      // Sync these generated notices to the admin's bell notification center (localStorage)
      try {
        const stored = localStorage.getItem("school_admin_notifications");
        let adminNotifs = stored ? JSON.parse(stored) : [];
        let updated = false;

        list.forEach(item => {
          // Check if already exists in admin notifications
          const exists = adminNotifs.some(an => an.id === `admin-fee-${item.id}` || an.title === item.title);
          if (!exists) {
            adminNotifs.unshift({
              id: `admin-fee-${item.id}`,
              schoolId: schoolId,
              title: item.title,
              description: item.description,
              type: "Fees",
              date: item.publishDate,
              read: false
            });
            updated = true;
          }
        });

        if (updated) {
          localStorage.setItem("school_admin_notifications", JSON.stringify(adminNotifs));
          // Dispatch event so that top bar bell badge updates instantly
          window.dispatchEvent(new Event("school_admin_notifications_update"));
        }
      } catch (e) {
        console.error("Failed to sync notifications to bell", e);
      }

      return list;
    } catch (err) {
      console.error("Failed to load alerts history:", err);
      return [];
    }
  };

  const loadFees = async () => {
    setLoading(true);
    try {
      // 1. Fetch fees from database
      const fRes = await feesApi.getAll({ schoolId, limit: 100 });
      let currentPayments = fRes.data || [];

      // Migration: Remove any incorrectly seeded administrators from the fee list
      const hasAdmins = currentPayments.some(
        p => p.studentName && p.studentName.toLowerCase().includes("admin")
      );
      if (hasAdmins) {
        for (const p of currentPayments) {
          if (p.studentName && p.studentName.toLowerCase().includes("admin")) {
            try {
              await feesApi.delete(p.id);
            } catch (e) {
              console.error("Failed to delete admin fee record", e);
            }
          }
        }
        // Reload fresh after deleting incorrect data
        loadFees();
        return;
      }

      // 2. Fetch active students from this school (filtering by role student)
      const sRes = await usersApi.getAll({ role: "student", limit: 100 });
      const students = (sRes.data || []).filter(
        s => s.schoolId === schoolId && s.role === "student"
      );

      // 3. Strict Cleanup Migration: Remove orphaned or duplicate fee records
      let needsCleanup = false;
      const seenStudentIds = new Set();

      for (const p of currentPayments) {
        const matchingStudent = students.find(s => s.id === p.studentId);
        const studentExists = !!matchingStudent;
        const isDuplicate = seenStudentIds.has(p.studentId);

        if (!studentExists || isDuplicate) {
          try {
            await feesApi.delete(p.id);
            needsCleanup = true;
          } catch (e) {
            console.error("Failed to clean up incorrect fee record", e);
          }
        } else {
          if (p.studentId) {
            seenStudentIds.add(p.studentId);
          }
          // Self-healing: if student's name was changed in directory, sync the name in fee record too!
          if (matchingStudent && p.studentName !== matchingStudent.name) {
            try {
              await feesApi.update(p.id, { studentName: matchingStudent.name });
              p.studentName = matchingStudent.name; // Update local reference
            } catch (err) {
              console.error("Failed to sync updated student name in fee record", err);
            }
          }
        }
      }

      if (needsCleanup) {
        // Reload fresh list after cleaning up incorrect/orphaned rows
        loadFees();
        return;
      }

      // Extract actual active configured dates from database to avoid race condition
      let activeQ1 = q1Date;
      let activeQ2 = q2Date;
      let activeQ3 = q3Date;
      let activeQ4 = q4Date;

      if (currentPayments.length > 0) {
        const first = currentPayments[0];
        if (first.q1_dueDate) activeQ1 = first.q1_dueDate;
        if (first.q2_dueDate) activeQ2 = first.q2_dueDate;
        if (first.q3_dueDate) activeQ3 = first.q3_dueDate;
        if (first.q4_dueDate) activeQ4 = first.q4_dueDate;
        
        setQ1Date(activeQ1);
        setQ2Date(activeQ2);
        setQ3Date(activeQ3);
        setQ4Date(activeQ4);
      }

      // Self-healing realignment: Ensure all existing student fee records share the exact same due dates
      let needsRealignReload = false;
      for (const p of currentPayments) {
        if (p.q1_dueDate !== activeQ1 || 
            p.q2_dueDate !== activeQ2 || 
            p.q3_dueDate !== activeQ3 || 
            p.q4_dueDate !== activeQ4) {
          try {
            await feesApi.update(p.id, {
              q1_dueDate: activeQ1,
              q1_notified_15d: false,
              q1_notified_7d: false,
              q2_dueDate: activeQ2,
              q2_notified_15d: false,
              q2_notified_7d: false,
              q3_dueDate: activeQ3,
              q3_notified_15d: false,
              q3_notified_7d: false,
              q4_dueDate: activeQ4,
              q4_notified_15d: false,
              q4_notified_7d: false
            });
            needsRealignReload = true;
          } catch (e) {
            console.error("Failed to realign out-of-sync dates", e);
          }
        }
      }

      if (needsRealignReload) {
        const freshRes = await feesApi.getAll({ schoolId, limit: 100 });
        currentPayments = freshRes.data || [];
      }

      // 4. Sync fees: create missing fee records for any student who doesn't have one
      let needsReload = false;

      for (const s of students) {
        const alreadyHasFee = currentPayments.some(p => p.studentId === s.id);
        if (!alreadyHasFee) {
          try {
            const feePayload = {
              studentId: s.id,
              studentName: s.name,
              class: s.class || "9th A",
              amount: 480, // Total annual fee
              status: "Pending",
              date: "-",
              schoolId: schoolId,
              paymentType: "Installment",
              q1_amount: 120,
              q1_status: "Pending",
              q1_dueDate: activeQ1,
              q1_paidDate: "-",
              q2_amount: 120,
              q2_status: "Pending",
              q2_dueDate: activeQ2,
              q2_paidDate: "-",
              q3_amount: 120,
              q3_status: "Pending",
              q3_dueDate: activeQ3,
              q3_paidDate: "-",
              q4_amount: 120,
              q4_status: "Pending",
              q4_dueDate: activeQ4,
              q4_paidDate: "-"
            };
            await feesApi.create(feePayload);
            needsReload = true;
          } catch (createErr) {
            console.error("Failed to sync fee record for student", s.name, createErr);
          }
        }
      }

      if (needsReload) {
        // Reload fresh list after syncing all missing records
        const freshRes = await feesApi.getAll({ schoolId, limit: 100 });
        setPayments(freshRes.data || []);
      } else {
        setPayments(currentPayments);
      }
    } catch (err) {
      toast.error("Failed to load school fee database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        await feesApi.checkNotifications();
      } catch (e) {
        console.error("Failed notification check", e);
      }
      loadFees();
      loadAlertHistory();
    };
    init();
  }, [schoolId]);

  const handleUpdatePaymentType = async (id, newType) => {
    try {
      await feesApi.update(id, { paymentType: newType });
      toast.success(`Payment type updated to ${newType}`);
      loadFees();
    } catch (err) {
      toast.error("Failed to update payment option");
    }
  };

  const handleSaveDueDates = async () => {
    if (!q1Date || !q2Date || !q3Date || !q4Date) {
      toast.error("All quarter due dates are required!");
      return;
    }

    const d1 = new Date(q1Date);
    const d2 = new Date(q2Date);
    const d3 = new Date(q3Date);
    const d4 = new Date(q4Date);

    if (isNaN(d1.getTime()) || isNaN(d2.getTime()) || isNaN(d3.getTime()) || isNaN(d4.getTime())) {
      toast.error("Please enter valid dates!");
      return;
    }

    if (d2 <= d1) {
      toast.error("Q2 Due Date must be chronologically after Q1 Due Date!");
      return;
    }
    if (d3 <= d2) {
      toast.error("Q3 Due Date must be chronologically after Q2 Due Date!");
      return;
    }
    if (d4 <= d3) {
      toast.error("Q4 Due Date must be chronologically after Q3 Due Date!");
      return;
    }

    setLoading(true);
    try {
      for (const p of payments) {
        await feesApi.update(p.id, {
          q1_dueDate: q1Date,
          q1_notified_15d: false,
          q1_notified_7d: false,
          q2_dueDate: q2Date,
          q2_notified_15d: false,
          q2_notified_7d: false,
          q3_dueDate: q3Date,
          q3_notified_15d: false,
          q3_notified_7d: false,
          q4_dueDate: q4Date,
          q4_notified_15d: false,
          q4_notified_7d: false
        });
      }
      setShowSettings(false);
      // Run alert check to generate new notices if any new date matches thresholds
      const res = await feesApi.checkNotifications();
      await loadAlertHistory();
      toast.success("Due dates saved and applied successfully!");
      setShowHistory(true); // Automatically fly open the history dropdown log
      loadFees();
    } catch (err) {
      toast.error("Failed to save due dates: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleRunAlertChecks = async () => {
    try {
      await feesApi.checkNotifications();
      await loadAlertHistory();
      toast.success("Alert checks completed successfully!");
      setShowHistory(true); // Automatically fly open the history dropdown log
      loadFees();
    } catch (e) {
      toast.error("Failed to run checks");
    }
  };

  const handleDeleteAlert = async (id) => {
    try {
      await noticesApi.delete(id);
      
      // Delete from school_admin_notifications too
      try {
        const stored = localStorage.getItem("school_admin_notifications");
        if (stored) {
          let adminNotifs = JSON.parse(stored);
          adminNotifs = adminNotifs.filter(an => an.id !== `admin-fee-${id}`);
          localStorage.setItem("school_admin_notifications", JSON.stringify(adminNotifs));
          window.dispatchEvent(new Event("school_admin_notifications_update"));
        }
      } catch (err) {}

      toast.success("Alert removed from history");
      await loadAlertHistory();
    } catch (err) {
      toast.error("Failed to delete alert");
    }
  };

  const deleteNoticesForQuarter = async (studentName, quarterKey) => {
    try {
      const qUpper = quarterKey.toUpperCase(); // e.g. "Q2"
      const res = await noticesApi.getAll({ limit: 100 });
      const list = res.data || [];
      const matches = list.filter(n => 
        n.schoolId === schoolId && 
        n.title && 
        n.title.includes(studentName) && 
        n.title.includes(qUpper) && 
        (n.title.includes("Alert") || n.title.includes("Reminder"))
      );
      for (const m of matches) {
        await noticesApi.delete(m.id);
      }

      // Also clean up from local school_admin_notifications
      try {
        const stored = localStorage.getItem("school_admin_notifications");
        if (stored) {
          let adminNotifs = JSON.parse(stored);
          const beforeLen = adminNotifs.length;
          adminNotifs = adminNotifs.filter(an => 
            !(an.title && an.title.includes(studentName) && an.title.includes(qUpper))
          );
          if (adminNotifs.length !== beforeLen) {
            localStorage.setItem("school_admin_notifications", JSON.stringify(adminNotifs));
            window.dispatchEvent(new Event("school_admin_notifications_update"));
          }
        }
      } catch (err) {
        console.error("Failed to clean up bell notifications for quarter", err);
      }

    } catch (e) {
      console.error("Failed to clean up notices for paid installment", e);
    }
  };

  const handlePayInstallment = async (id, quarterKey) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const updatePayload = {
      [`${quarterKey}_status`]: "Paid",
      [`${quarterKey}_paidDate`]: todayStr
    };

    try {
      await feesApi.update(id, updatePayload);
      
      const payment = payments.find(p => p.id === id);
      if (payment) {
        await deleteNoticesForQuarter(payment.studentName, quarterKey);
      }
      
      toast.success(`Quarterly installment paid successfully!`);
      await loadAlertHistory();
      loadFees();
    } catch (err) {
      toast.error("Failed to pay installment: " + (err.message || err));
    }
  };

  const handleUnpayInstallment = async (id, quarterKey) => {
    const updatePayload = {
      [`${quarterKey}_status`]: "Pending",
      [`${quarterKey}_paidDate`]: "-",
      [`${quarterKey}_notified_15d`]: false,
      [`${quarterKey}_notified_7d`]: false,
      status: "Pending" // Automatically flags overall status back to Pending
    };

    try {
      await feesApi.update(id, updatePayload);
      toast.success(`Installment payment reverted to Pending.`);
      // Instantly trigger check and reload history list to show reverted notifications
      await feesApi.checkNotifications();
      await loadAlertHistory();
      loadFees();
    } catch (err) {
      toast.error("Failed to revert payment: " + (err.message || err));
    }
  };

  const handlePayCompleteFee = async (id, pendingQuarters) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const updatePayload = {
      status: "Paid",
      date: todayStr
    };

    // Mark all currently pending quarters as paid dynamically
    pendingQuarters.forEach(q => {
      updatePayload[`${q}_status`] = "Paid";
      updatePayload[`${q}_paidDate`] = todayStr;
    });

    try {
      await feesApi.update(id, updatePayload);
      
      const payment = payments.find(p => p.id === id);
      if (payment) {
        for (const q of pendingQuarters) {
          await deleteNoticesForQuarter(payment.studentName, q);
        }
      }
      
      toast.success(`Complete/remaining fee settled successfully!`);
      await loadAlertHistory();
      loadFees();
    } catch (err) {
      toast.error("Failed to settle complete fee: " + (err.message || err));
    }
  };

  const filtered = payments.filter(p => (p.studentName || "").toLowerCase().includes(searchName.toLowerCase()));

  // Calculate totals (parsing as base 10 integers to avoid string concatenation)
  let totalCollected = 0;
  let totalPending = 0;

  payments.forEach(p => {
    ["q1", "q2", "q3", "q4"].forEach(q => {
      const status = p[`${q}_status`];
      const amt = parseInt(p[`${q}_amount`] || 120, 10);
      if (status === "Paid") {
        totalCollected += amt;
      } else {
        totalPending += amt;
      }
    });
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1E293B" }}>Fees Ledger & Collection</h2>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Track quarterly invoices, transition payment logics, and trigger parent reminders.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              padding: "8px 16px", background: "#475569", color: "#fff", border: "none",
              borderRadius: 8, fontSize: 12.5, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6
            }}
          >
            ⚙ Configure Due Dates
          </button>

          {/* Combined Alert Checks Action & History Dropdown */}
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", boxShadow: "0 2px 4px rgba(2, 132, 199, 0.15)" }}>
              <button
                onClick={handleRunAlertChecks}
                style={{
                  padding: "8px 14px", background: "#0284C7", color: "#fff", border: "none",
                  fontSize: 12.5, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6
                }}
              >
                <BellRing size={16} /> Alert Checks
              </button>
              <button
                onClick={() => setShowHistory(!showHistory)}
                style={{
                  padding: "8px 10px", background: "#0284C7", color: "#fff", border: "none",
                  borderLeft: "1px solid rgba(255,255,255,0.25)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10
                }}
                title="View Sent Message History"
              >
                ▼
              </button>
            </div>

            {/* Float Dropdown for Sent Alert History */}
            {showHistory && (
              <div style={{
                position: "absolute", right: 0, top: 40, width: 350, background: "#fff",
                border: "1px solid #E2E8F0", borderRadius: 12, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15)",
                padding: 16, zIndex: 100, display: "flex", flexDirection: "column", gap: 12
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#1E293B" }}>Sent Due Alerts Log</h4>
                  <button onClick={() => setShowHistory(false)} style={{ border: "none", background: "none", fontSize: 11, color: "#64748B", fontWeight: 700, cursor: "pointer" }}>Close</button>
                </div>
                <div style={{ maxHeight: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingRight: 4 }}>
                  {alertHistory.length === 0 ? (
                    <span style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center", padding: "20px 0" }}>No due alerts sent yet.</span>
                  ) : (
                    alertHistory.map(a => (
                      <div key={a.id} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "#0F172A" }}>{a.title}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAlert(a.id);
                            }}
                            style={{
                              border: "none", background: "none", color: "#EF4444", cursor: "pointer",
                              padding: 0, display: "flex", alignItems: "center", justifyContent: "center"
                            }}
                            title="Delete alert"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <span style={{ fontSize: 11, color: "#475569", lineHeight: 1.4 }}>{a.description}</span>
                        <span style={{ fontSize: 9.5, color: "#9CA3AF", marginTop: 2 }}>Trigger Date: {a.publishDate}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div style={{
          background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20,
          display: "flex", flexDirection: "column", gap: 16
        }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1E293B" }}>Set Global Installment Due Dates</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: "#64748B" }}>Q1 Due Date</label>
              <input type="date" value={q1Date} onChange={e => setQ1Date(e.target.value)} style={{ padding: 8, border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13, outline: "none" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: "#64748B" }}>Q2 Due Date</label>
              <input type="date" value={q2Date} onChange={e => setQ2Date(e.target.value)} style={{ padding: 8, border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13, outline: "none" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: "#64748B" }}>Q3 Due Date</label>
              <input type="date" value={q3Date} onChange={e => setQ3Date(e.target.value)} style={{ padding: 8, border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13, outline: "none" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: "#64748B" }}>Q4 Due Date</label>
              <input type="date" value={q4Date} onChange={e => setQ4Date(e.target.value)} style={{ padding: 8, border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13, outline: "none" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => setShowSettings(false)} style={{ padding: "8px 16px", background: "#E2E8F0", color: "#475569", border: "none", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSaveDueDates} style={{ padding: "8px 16px", background: "#16A34A", color: "#fff", border: "none", borderRadius: 8, fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>Apply to All Students</button>
          </div>
        </div>
      )}

      {/* Stats summary boxes */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#9CA3AF" }}>TOTAL COLLECTED</span>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#16A34A", marginTop: 4 }}>₹{totalCollected}</div>
          </div>
          <div style={{ width: 44, height: 44, background: "#DCFCE7", color: "#16A34A", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#9CA3AF" }}>PENDING BALANCE DUES</span>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#DC2626", marginTop: 4 }}>₹{totalPending}</div>
          </div>
          <div style={{ width: 44, height: 44, background: "#FEE2E2", color: "#DC2626", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertCircle size={24} />
          </div>
        </div>
      </div>

      {/* List section */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1F2937" }}>Student Fee Dues Roster</h3>
          <div style={{ position: "relative" }}>
            <input
              type="text" placeholder="Search by name..."
              value={searchName} onChange={e => setSearchName(e.target.value)}
              style={{ padding: "8px 12px 8px 32px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13 }}
            />
            <Search size={16} color="#9CA3AF" style={{ position: "absolute", left: 10, top: 10 }} />
          </div>
        </div>

        {/* Invoices table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "2px solid #E5E7EB" }}>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "#4B5563" }}>Student Name</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "#4B5563" }}>Class</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "#4B5563" }}>Option</th>
                
                {/* Separating headers with clean vertical borders */}
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "#4B5563", borderLeft: "1px solid #E5E7EB", borderRight: "1px solid #E5E7EB" }}>
                  Q1 ({formatHeaderDate(payments[0]?.q1_dueDate, "June 15")})
                </th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "#4B5563", borderRight: "1px solid #E5E7EB" }}>
                  Q2 ({formatHeaderDate(payments[0]?.q2_dueDate, "Sept 15")})
                </th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "#4B5563", borderRight: "1px solid #E5E7EB" }}>
                  Q3 ({formatHeaderDate(payments[0]?.q3_dueDate, "Dec 15")})
                </th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "#4B5563", borderRight: "1px solid #E5E7EB" }}>
                  Q4 ({formatHeaderDate(payments[0]?.q4_dueDate, "Mar 15")})
                </th>
                
                <th style={{ padding: "14px 16px", textAlign: "right", fontSize: 12, fontWeight: 800, color: "#4B5563" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const quarters = ["q1", "q2", "q3", "q4"];
                const paidCount = quarters.filter(q => p[`${q}_status`] === "Paid").length;
                const pendingQuarters = quarters.filter(q => p[`${q}_status`] === "Pending");
                const pendingAmount = pendingQuarters.length * 120;

                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <td style={{ padding: "14px 16px", fontSize: 13.5, fontWeight: 800, color: "#1F2937" }}>
                      {p.studentName}
                      <div style={{ fontSize: 10.5, fontWeight: 500, color: "#64748B", marginTop: 2 }}>
                        {paidCount === 4 ? "Fully Cleared" : `${paidCount} / 4 Paid`}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13.5, color: "#4B5563" }}>{p.class}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <select
                        value={p.paymentType || "Installment"}
                        onChange={e => handleUpdatePaymentType(p.id, e.target.value)}
                        style={{
                          padding: "6px 8px", border: "1px solid #CBD5E1", borderRadius: 6,
                          fontSize: 12.5, outline: "none", background: "#fff", cursor: "pointer"
                        }}
                      >
                        <option value="Installment">Installment</option>
                        <option value="Complete">Complete</option>
                      </select>
                    </td>

                    {/* Q1-Q4 Installment Cells separated by grid lines */}
                    {quarters.map((q, idx) => {
                      const status = p[`${q}_status`];
                      const date = p[`${q}_paidDate`];
                      const dueDate = p[`${q}_dueDate`];
                      
                      // Compute matching grid line borders for table columns
                      const cellStyle = {
                        padding: "14px 16px",
                        borderRight: "1px solid #E5E7EB",
                        borderLeft: idx === 0 ? "1px solid #E5E7EB" : "none"
                      };

                      return (
                        <td key={q} style={cellStyle}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {status === "Paid" ? (
                                <div style={{
                                  display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10.5, fontWeight: 800,
                                  color: "#16A34A", background: "#DCFCE7", border: "1px solid #BBF7D0",
                                  padding: "3px 8px", borderRadius: 8
                                }}>
                                  <span>₹120 Paid</span>
                                  <button
                                    onClick={() => handleUnpayInstallment(p.id, q)}
                                    title="Mark unpaid / Undo payment"
                                    style={{
                                      border: "none", background: "none", padding: 0, margin: 0, color: "#EF4444",
                                      cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
                                      transition: "transform 0.2s ease"
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = "rotate(-45deg)"}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = "rotate(0deg)"}
                                  >
                                    <RotateCcw size={11} />
                                  </button>
                                </div>
                              ) : (
                                <span style={{
                                  display: "inline-flex", alignSelf: "flex-start", fontSize: 10.5, fontWeight: 800,
                                  color: "#DC2626", background: "#FEE2E2", border: "1px solid #FCA5A5",
                                  padding: "3px 8px", borderRadius: 8
                                }}>
                                  ₹120 Pending
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: 10, color: "#9CA3AF" }}>
                              {status === "Paid" ? `Paid: ${date}` : `Due: ${dueDate || "-"}`}
                            </span>
                          </div>
                        </td>
                      );
                    })}

                    {/* Actions Cell */}
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      {paidCount === 4 ? (
                        <div style={{ display: "inline-flex", width: "185px", height: "38px", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 12.5, fontWeight: 800, color: "#16A34A" }}>✓ Completed</span>
                        </div>
                      ) : p.paymentType === "Complete" ? (
                        /* Fully dynamic Complete Payment Option */
                        pendingQuarters.length === 4 ? (
                          <button
                            onClick={() => handlePayCompleteFee(p.id, pendingQuarters)}
                            style={{
                              width: "185px", height: "38px", background: "#0284C7", color: "#fff", border: "none",
                              borderRadius: 8, fontSize: 12.5, fontWeight: 800, cursor: "pointer",
                              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                              boxShadow: "0 2px 4px rgba(2, 132, 199, 0.2)"
                            }}
                          >
                            <CreditCard size={14} /> Pay Full (₹480)
                          </button>
                        ) : (
                          /* Dynamically calculates exactly how much outstanding fee is left */
                          <button
                            onClick={() => handlePayCompleteFee(p.id, pendingQuarters)}
                            style={{
                              width: "185px", height: "38px", background: "#16A34A", color: "#fff", border: "none",
                              borderRadius: 8, fontSize: 12.5, fontWeight: 800, cursor: "pointer",
                              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                              boxShadow: "0 2px 4px rgba(22, 163, 74, 0.2)"
                            }}
                          >
                            <CreditCard size={14} /> Pay Remaining (₹{pendingAmount})
                          </button>
                        )
                      ) : (
                        /* Installment option pay next pending */
                        (() => {
                          const nextPending = quarters.find(q => p[`${q}_status`] === "Pending") || "q1";
                          return (
                            <button
                              onClick={() => handlePayInstallment(p.id, nextPending)}
                              style={{
                                width: "185px", height: "38px", background: "#16A34A", color: "#fff", border: "none",
                                borderRadius: 8, fontSize: 12.5, fontWeight: 800, cursor: "pointer",
                                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                                boxShadow: "0 2px 4px rgba(22, 163, 74, 0.2)"
                              }}
                            >
                              ✓ Pay {nextPending.toUpperCase()} (₹120)
                            </button>
                          );
                        })()
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
