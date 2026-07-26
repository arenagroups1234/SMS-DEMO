import { useState, useEffect } from "react";
import { MessageSquare, HelpCircle, Send, CheckCircle2, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { contactsApi } from "../../services/api";

export default function PortalSupport() {
  const { schoolId } = useParams();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Technical");
  const [severity, setSeverity] = useState("Medium");
  const [description, setDescription] = useState("");
  const [tickets, setTickets] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);
  const [loading, setLoading] = useState(false);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("sms_user") || "{}");
    } catch {
      return {};
    }
  })();

  // Load tickets from backend
  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await contactsApi.getAll({ limit: 100 });
      const schoolTickets = (res.data || [])
        .map(t => {
          // Try to extract category/severity from description if stored in custom format
          let cat = "Technical";
          let sev = "Medium";
          let cleanDesc = t.message;

          if (t.message && t.message.startsWith("Category:")) {
            try {
              const lines = t.message.split("\n");
              cat = lines[0].replace("Category:", "").trim();
              sev = lines[1].replace("Severity:", "").trim();
              cleanDesc = lines.slice(3).join("\n");
            } catch (e) {
              console.warn("Could not parse ticket metadata:", e);
            }
          }

          return {
            id: t.id,
            subject: t.subject || "Support Request",
            category: cat,
            severity: sev,
            description: cleanDesc,
            status: (t.status === "new" || !t.status) ? "Pending" : (t.status === "responded" ? "Resolved" : t.status),
            date: t.createdAt ? t.createdAt.split("T")[0] : new Date().toLocaleDateString(),
            reply: t.reply || ""
          };
        });
      setTickets(schoolTickets);
    } catch (err) {
      console.error("Could not load support tickets from backend:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [schoolId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const subVal = subject.trim();
    const descVal = description.trim();

    if (!subVal) {
      toast.error("Ticket Subject is required!");
      return;
    }
    if (subVal.length < 5 || subVal.length > 80) {
      toast.error("Ticket Subject must be between 5 and 80 characters!");
      return;
    }
    if (!descVal) {
      toast.error("Ticket Description is required!");
      return;
    }
    if (descVal.length < 10 || descVal.length > 500) {
      toast.error("Ticket Description must be between 10 and 500 characters!");
      return;
    }

    try {
      const fullMessage = `Category: ${category}\nSeverity: ${severity}\n\n${descVal}`;

      const payload = {
        name: user.name || "School Admin",
        email: user.email || user.schoolEmail || "admin@school.com",
        subject: subVal,
        message: fullMessage,
        schoolName: user.schoolName || "School",
        schoolId: schoolId,
        status: "new"
      };

      await contactsApi.create(payload);
      toast.success("Support ticket created successfully! Our team will reply shortly.");
      setSubject("");
      setDescription("");
      loadTickets();
    } catch (err) {
      toast.error(err.message || "Failed to submit support ticket");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this ticket?")) return;
    try {
      await contactsApi.delete(id);
      toast.success("Ticket deleted successfully!");
      loadTickets();
    } catch (err) {
      toast.error(err.message || "Failed to delete ticket");
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case "High": return { bg: "#FEE2E2", color: "#EF4444" };
      case "Medium": return { bg: "#FEF3C7", color: "#D97706" };
      default: return { bg: "#F3F4F6", color: "#4B5563" };
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Resolved": return { bg: "#DEF7EC", color: "#03543F" };
      case "Processing": return { bg: "#FEF3C7", color: "#D97706" };
      default: return { bg: "#FEE2E2", color: "#EF4444" };
    }
  };

  const faqs = [
    { q: "How do I add a new subject to a specific class?", a: "Go to Class Management > Subjects and click 'Create Subject'. Enter the name, code, and assign the classes." },
    { q: "Can I download teacher qualifications data?", a: "Yes, in the Teachers section, you can export teacher profiles (including qualification details) as a CSV file using the 'Export File' button." },
    { q: "How are parent portals updated?", a: "When you update student details or admit a student with the parent's email, their login credentials and student linkage sync automatically." },
    { q: "How can I update my school logo and credentials?", a: "School portal settings can be modified by clicking on the settings button in the top profile dropdown or contacting Platform Admin support." }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* Title Header */}
      <div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1E293B" }}>
          💬 Support & Helpdesk Center
        </h2>
        <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
          Raise technical tickets, check status updates, or find answers to frequently asked questions.
        </p>
      </div>

      <div className="responsive-support-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24, alignItems: "start" }}>
        <style>{`
          @media (max-width: 1024px) {
            .responsive-support-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
        
        {/* Left Side: Ticket Creator & Ticket Log */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Ticket form */}
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 800, color: "#1E293B", display: "flex", alignItems: "center", gap: 8 }}>
              <MessageSquare size={18} color="#2563EB" /> Raise a New Ticket
            </h3>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Ticket Subject *</label>
                <input 
                  type="text" required value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="Summarize your issue or request..."
                  style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5 }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Category</label>
                  <select 
                    value={category} onChange={e => setCategory(e.target.value)}
                    style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", background: "#fff", fontSize: 13.5 }}
                  >
                    <option value="Technical">Technical Support</option>
                    <option value="Academic">Academic Manager</option>
                    <option value="Billing">Billing & Subscription</option>
                    <option value="General">General Query</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Severity Level</label>
                  <select 
                    value={severity} onChange={e => setSeverity(e.target.value)}
                    style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", background: "#fff", fontSize: 13.5 }}
                  >
                    <option value="Low">Low (No workflow impact)</option>
                    <option value="Medium">Medium (Workaround exists)</option>
                    <option value="High">High (Service blocked)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563" }}>Detailed Description *</label>
                <textarea 
                  required value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Describe your issue or steps to reproduce..."
                  style={{ padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", fontSize: 13.5, minHeight: 80, resize: "vertical", fontFamily: "inherit" }}
                />
              </div>

              <button
                type="submit"
                style={{
                  alignSelf: "flex-end", padding: "10px 20px", background: "#2563EB", color: "#fff", border: "none",
                  borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6
                }}
              >
                <Send size={14} /> Send Ticket
              </button>
            </form>
          </div>

          {/* Ticket Log list */}
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 800, color: "#1E293B" }}>
              Active Tickets ({tickets.length})
            </h3>

            {tickets.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "#94A3B8" }}>
                <CheckCircle2 size={32} style={{ margin: "0 auto 8px auto", display: "block" }} />
                No active support tickets found.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {tickets.map(t => {
                  const badg = getSeverityBadge(t.severity);
                  return (
                    <div key={t.id} style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 14, background: "#FAFAFA", position: "relative" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <strong style={{ fontSize: 13.5, color: "#1E293B" }}>{t.subject}</strong>
                            <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: badg.bg, color: badg.color, fontWeight: 800 }}>
                              {t.severity}
                            </span>
                            <span style={{ 
                              fontSize: 10, 
                              padding: "2px 6px", 
                              borderRadius: 4, 
                              background: getStatusStyle(t.status).bg, 
                              color: getStatusStyle(t.status).color, 
                              fontWeight: 800, 
                              display: "inline-flex", 
                              alignItems: "center", 
                              gap: 3 
                            }}>
                              {t.status === "Resolved" ? <CheckCircle2 size={10} /> : <Clock size={10} />} {t.status}
                            </span>
                          </div>
                          <p style={{ fontSize: 12, color: "#64748B", margin: "6px 0 0 0", whiteSpace: "pre-wrap" }}>{t.description}</p>
                          
                          {t.reply && (
                            <div style={{ marginTop: 10, padding: "10px 14px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, fontSize: 12, color: "#1E40AF" }}>
                              <strong>Admin Response:</strong> {t.reply}
                            </div>
                          )}

                          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 8 }}>
                            Category: {t.category} • Date Opened: {t.date}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(t.id)}
                          title="Delete Ticket Record"
                          style={{ background: "transparent", border: "none", cursor: "pointer", color: "#EF4444", padding: 4 }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: FAQ section */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 800, color: "#1E293B", display: "flex", alignItems: "center", gap: 8 }}>
            <HelpCircle size={18} color="#2563EB" /> FAQ & Help Articles
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} style={{ borderBottom: "1px solid #F1F5F9", paddingBottom: 12 }}>
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    style={{
                      width: "100%", textAlign: "left", background: "transparent", border: "none",
                      fontSize: 13.5, fontWeight: 700, color: isOpen ? "#2563EB" : "#334155",
                      cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 16, padding: "4px 0"
                    }}
                  >
                    <span>{faq.q}</span>
                    <span>{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <p style={{ fontSize: 12.5, color: "#64748B", margin: "8px 0 0 0", lineHeight: 1.5 }}>
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
