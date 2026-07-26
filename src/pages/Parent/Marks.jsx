import { useState, useEffect } from "react";
import { Calendar, FileText, Clock, MapPin } from "lucide-react";
import { useParams } from "react-router-dom";
import { examsApi, usersApi } from "../../services/api";

export default function PPortalMarks() {
  const { studentId } = useParams();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadExamData = async () => {
      setLoading(true);
      try {
        const storedUser = (() => { try { return JSON.parse(localStorage.getItem("sms_user") || "{}"); } catch { return {}; } })();
        let studentClass = "";
        
        try {
          const sRes = await usersApi.getById(studentId);
          if (sRes.data) {
            studentClass = sRes.data.className || sRes.data.class || "";
          }
        } catch (e) {}

        if (!studentClass && storedUser) {
          studentClass = storedUser.className || storedUser.class || "";
        }

        const exRes = await examsApi.getAll({ limit: 100 });
        const list = exRes.data || [];
        const parsed = list.map(e => ({
          ...e,
          schedules: typeof e.schedules === 'string' ? JSON.parse(e.schedules || '[]') : (e.schedules || [])
        }));

        // Filter exam timetables strictly for the student's class and exclude draft status exams
        const filteredExams = parsed.filter(e => {
          // Do not show draft exams to parents/students
          if ((e.status || "").toLowerCase() === "draft") {
            return false;
          }

          if (!studentClass) return true;
          const examClasses = e.classes || "";
          if (!examClasses || examClasses.toLowerCase().includes("all")) return true;
          
          const normStudentClass = studentClass.toLowerCase().replace(/class/g, "").trim();
          const targetClasses = examClasses.split(",").map(c => c.toLowerCase().replace(/class/g, "").trim());
          
          return targetClasses.some(c => normStudentClass.includes(c) || c.includes(normStudentClass));
        });

        setExams(filteredExams);
      } catch (err) {
        console.warn("Could not load exam timetables", err);
      } finally {
        setLoading(false);
      }
    };
    loadExamData();
  }, [studentId]);

  const openDocumentViewer = (fileUrl) => {
    if (!fileUrl) return;
    const newTab = window.open();
    newTab.document.write(`<iframe src="${fileUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1E293B" }}>Examinations & Schedules</h2>
        <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>View upcoming exam timetables, datesheets, and subject schedules for your child's class.</p>
      </div>

      {/* Scheduled Exam Timetables */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748B" }}>Loading exam timetables...</div>
        ) : exams.length === 0 ? (
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: 40, textAlign: "center", color: "#64748B" }}>
            No active exam schedules posted at this time.
          </div>
        ) : (
          exams.map((exm) => (
            <div key={exm.id} style={{ background: "#fff", border: "1px solid #BAE6FD", borderRadius: 16, padding: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#1E293B" }}>{exm.name}</h3>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#0284C7", background: "#E0F2FE", padding: "3px 8px", borderRadius: 6 }}>
                      Classes: {exm.classes || "All Classes"}
                    </span>
                  </div>
                  {exm.notes && <p style={{ fontSize: 13, color: "#64748B", margin: "6px 0 0 0" }}>📌 Instructions: {exm.notes}</p>}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {exm.date && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#4B5563", display: "flex", alignItems: "center", gap: 4 }}>
                      <Calendar size={14} color="#0284C7" /> Starts: {exm.date}
                    </span>
                  )}
                </div>
              </div>

              {/* Content Mode 1: Document Upload View */}
              {exm.timetableFile ? (
                <div style={{ border: "1px dashed #7DD3FC", borderRadius: 12, padding: 16, background: "#F0F9FF", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0369A1" }}>📄 Official Timetable Document / Datesheet Sheet</div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{exm.timetableFileName || "Exam_Timetable_Sheet.pdf"}</div>
                  </div>
                  <button
                    onClick={() => openDocumentViewer(exm.timetableFile)}
                    style={{ padding: "8px 16px", background: "#0284C7", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <FileText size={15} /> View Full Timetable Document
                  </button>
                </div>
              ) : (
                /* Content Mode 2: Interactive Subject Datesheet Table */
                exm.schedules && exm.schedules.length > 0 && (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>Subject</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>Exam Date</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>Timing</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>Exam Hall</th>
                          <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>Max / Pass</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exm.schedules.map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                            <td style={{ padding: "10px 12px", fontWeight: 800, color: "#0284C7" }}>{row.subject}</td>
                            <td style={{ padding: "10px 12px", fontWeight: 700, color: "#1E293B" }}>{row.date || "TBD"}</td>
                            <td style={{ padding: "10px 12px", color: "#4B5563" }}>
                              <Clock size={12} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
                              {row.startTime} - {row.endTime}
                            </td>
                            <td style={{ padding: "10px 12px", color: "#4B5563" }}>
                              <MapPin size={12} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
                              {row.room || "Main Hall"}
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700, color: "#16A34A" }}>
                              {row.maxMarks} / {row.passingMarks}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
