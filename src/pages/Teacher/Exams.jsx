import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { usersApi, examMarksApi, subjectsApi } from "../../services/api";
import { Award, BookOpen, Save, Eye, X, BarChart2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export default function TPortalExams() {
  const { teacherId } = useParams();
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [examName, setExamName] = useState("Midterm Examination");
  const [subject, setSubject] = useState("");
  const [marks, setMarks] = useState({}); // studentId -> score
  const [loading, setLoading] = useState(false);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState(null);

  const [teacherClasses, setTeacherClasses] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const storedUser = (() => { try { return JSON.parse(localStorage.getItem("sms_user") || "{}"); } catch { return {}; } })();
        
        let teacher = {};
        try {
          const tRes = await usersApi.getById(teacherId);
          if (tRes.data) {
            teacher = tRes.data;
          }
        } catch (tErr) {
          console.warn("Could not load teacher profile from DB:", tErr);
          teacher = storedUser;
        }

        const schoolId = teacher.schoolId || "";

        let classesList = [];
        if (Array.isArray(teacher.classes) && teacher.classes.length > 0) {
          classesList = teacher.classes;
        } else if (typeof teacher.classes === "string" && teacher.classes) {
          classesList = teacher.classes.split(",").map(c => c.trim()).filter(Boolean);
        } else if (typeof teacher.className === "string" && teacher.className) {
          classesList = teacher.className.split(",").map(c => c.trim()).filter(Boolean);
        } else if (teacher.class) {
          classesList = [teacher.class];
        }
        if (!classesList || classesList.length === 0) {
          classesList = ["9th A", "9th B", "10th A", "10th B", "11th Science"];
        }
        setTeacherClasses(classesList);
        
        if (classesList.length > 0 && !selectedClass) {
          setSelectedClass(classesList[0]);
        }

        const subRes = await subjectsApi.getAll({ schoolId, limit: 1000 });
        setAllSubjects(subRes.data || []);
      } catch (err) {
        console.warn("Failed to load metadata", err);
      }
    };
    loadMetadata();
  }, [teacherId]);

  useEffect(() => {
    if (!selectedClass) {
      setFilteredSubjects([]);
      setSubject("");
      return;
    }
    const filtered = allSubjects.filter(sub => {
      const subClass = sub.className || sub.class || "";
      return subClass.trim().toLowerCase() === selectedClass.trim().toLowerCase();
    });
    setFilteredSubjects(filtered);
    
    if (filtered.length > 0) {
      const exists = filtered.find(s => s.name === subject);
      if (!exists) {
        setSubject(filtered[0].name);
      }
    } else {
      setSubject("");
    }
  }, [selectedClass, allSubjects]);

  const loadStudentMarks = async (studentList) => {
    try {
      const res = await examMarksApi.getAll({ examName, subject, limit: 1000 });
      const dbMarks = res.data || [];
      const dbMarksMap = {};
      dbMarks.forEach(m => {
        dbMarksMap[m.studentId] = m;
      });

      const initialMarks = {};
      studentList.forEach(s => {
        const m = dbMarksMap[s.id];
        initialMarks[s.id] = m ? m.marks : "";
      });
      setMarks(initialMarks);
    } catch (err) {
      console.error("Failed to load graded marks from DB", err);
    }
  };

  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true);
      try {
        const storedUser = (() => { try { return JSON.parse(localStorage.getItem("sms_user") || "{}"); } catch { return {}; } })();
        const schoolId = storedUser.schoolId || "";

        const res = await usersApi.getAll({ role: "student", schoolId, limit: 100 });
        const list = res.data || [];
        const filtered = list.filter(s => (s.className || s.class || "").trim().toLowerCase() === selectedClass.trim().toLowerCase());
        
        setStudents(filtered);
        await loadStudentMarks(filtered);
      } catch (err) {
        toast.error("Failed to load student lists for grading");
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, [teacherId, selectedClass, examName, subject]);

  const handleScoreChange = (studentId, score) => {
    setMarks(prev => ({ ...prev, [studentId]: score }));
  };

  const handleSaveMarks = async () => {
    setLoading(true);
    const storedUser = (() => { try { return JSON.parse(localStorage.getItem("sms_user") || "{}"); } catch { return {}; } })();
    const schoolId = storedUser.schoolId || "";

    try {
      const res = await examMarksApi.getAll({ examName, subject, limit: 1000 });
      const existing = res.data || [];
      const lookup = {};
      existing.forEach(e => {
        lookup[e.studentId] = e.id;
      });

      for (const studentId of Object.keys(marks)) {
        const studentObj = students.find(s => s.id === studentId);
        if (!studentObj) continue;

        const score = marks[studentId];
        const existingId = lookup[studentId];

        if (existingId) {
          await examMarksApi.update(existingId, {
            studentId,
            studentName: studentObj.name,
            examName,
            subject,
            marks: String(score),
            schoolId
          });
        } else {
          await examMarksApi.create({
            studentId,
            studentName: studentObj.name,
            examName,
            subject,
            marks: String(score),
            schoolId
          });
        }
      }
      toast.success(`Exam marks for ${examName} (${subject}) saved successfully!`);
    } catch (err) {
      toast.error("Failed to save marks to database: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // Helper to show real recorded score for selected subject
  const getStudentGrades = (student) => {
    const currentScore = parseInt(marks[student.id]) || 0;
    const currentSubjectName = subject || "Subject Test";
    
    const grades = [
      { subject: currentSubjectName, score: currentScore }
    ];

    const average = currentScore;
    return { grades, average };
  };

  const getProgressBarColor = (score) => {
    if (score >= 90) return "#10b981"; // Emerald
    if (score >= 80) return "#6366f1"; // Indigo
    if (score >= 70) return "#f59e0b"; // Amber
    return "#ef4444"; // Red
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1E293B" }}>Exams & Grading Ledger</h2>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Enter student scores for term exams and class tests.</p>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <select
            value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} required
            style={{ padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", background: "#fff", fontSize: 13.5, fontWeight: 700 }}
          >
            <option value="">Choose Class...</option>
            {teacherClasses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          
          <select
            value={subject} onChange={(e) => setSubject(e.target.value)} required
            disabled={!selectedClass}
            style={{ padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: 8, outline: "none", background: "#fff", fontSize: 13.5, fontWeight: 700 }}
          >
            {!selectedClass ? (
              <option value="">Choose Class First...</option>
            ) : filteredSubjects.length === 0 ? (
              <option value="">No subjects assigned</option>
            ) : (
              <>
                <option value="">Choose Subject...</option>
                {filteredSubjects.map(sub => (
                  <option key={sub.id || sub.name} value={sub.name}>{sub.name}</option>
                ))}
              </>
            )}
          </select>

          <button
            onClick={handleSaveMarks}
            style={{
              padding: "8px 16px", background: "#0284C7", color: "#fff", border: "none",
              borderRadius: 8, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6
            }}
          >
            <Save size={16} /> Save Grades
          </button>
        </div>
      </div>

      {/* Exam metadata selectors */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 18, display: "flex", gap: 24, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Award size={20} color="#0284C7" />
          <span style={{ fontSize: 13.5, fontWeight: 700, color: "#1E293B" }}>Exam Term:</span>
          <input
            type="text" value={examName} onChange={e => setExamName(e.target.value)}
            placeholder="e.g. Midterm Exams"
            style={{ padding: "6px 12px", border: "1px solid #D1D5DB", borderRadius: 6, outline: "none", fontSize: 13 }}
          />
        </div>
      </div>

      {/* Student Marks Entry Grid */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F9FAFB", borderBottom: "2px solid #E5E7EB" }}>
              <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "#4B5563" }}>Roll No</th>
              <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "#4B5563" }}>Student Name</th>
              <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "#4B5563" }}>Class Level</th>
              <th style={{ padding: "14px 20px", textAlign: "right", fontSize: 12, fontWeight: 800, color: "#4B5563" }}>Obtained Score (Out of 100)</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                <td style={{ padding: "14px 20px", fontSize: 13.5, fontWeight: 700, color: "#0284C7" }}>#{s.rollNo || "10"}</td>
                <td style={{ padding: "14px 20px", fontSize: 13.5, color: "#1F2937" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span 
                      onClick={() => setSelectedStudentForReport(s)}
                      style={{ fontWeight: 800, cursor: "pointer", hoverColor: "#0284C7", textDecoration: "underline text-decoration-color: transparent", transition: "all 0.2s" }}
                      className="hover:text-blue-600 hover:underline"
                    >
                      {s.name}
                    </span>
                    <button
                      onClick={() => setSelectedStudentForReport(s)}
                      style={{
                        background: "#E0F2FE", border: "1px solid #DBEAFE", color: "#0284C7",
                        padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                        display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer"
                      }}
                    >
                      <Eye size={12} /> View Report
                    </button>
                  </div>
                </td>
                <td style={{ padding: "14px 20px", fontSize: 13.5, color: "#4B5563" }}>{selectedClass}</td>
                <td style={{ padding: "14px 20px", textAlign: "right" }}>
                  <input
                    type="number" max="100" min="0"
                    value={marks[s.id] || ""}
                    onChange={(e) => handleScoreChange(s.id, e.target.value)}
                    style={{
                      padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: 8,
                      width: 80, textAlign: "center", outline: "none", fontSize: 13.5, fontWeight: 700
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* REPORT CARD POPUP MODAL */}
      <AnimatePresence>
        {selectedStudentForReport && (() => {
          const { grades, average } = getStudentGrades(selectedStudentForReport);
          return (
            <div 
              style={{
                position: "fixed", inset: 0, zIndex: 1000, 
                background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)",
                display: "flex", justifyContent: "center", alignItems: "center", padding: 16
              }}
              onClick={() => setSelectedStudentForReport(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                style={{
                  background: "#ffffff", borderRadius: 24, border: "1px solid #BAE6FD",
                  width: "100%", maxWidth: 440, padding: 24, 
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  position: "relative"
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedStudentForReport(null)}
                  style={{
                    position: "absolute", top: 16, right: 16, border: "none", background: "#f1f5f9",
                    width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center",
                    justifyContent: "center", cursor: "pointer", color: "#64748b"
                  }}
                >
                  <X size={16} />
                </button>

                {/* Modal Header */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20, textAlign: "center" }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%", background: "#E0F2FE",
                    color: "#0284C7", display: "flex", justifyContent: "center", alignItems: "center",
                    fontSize: 20, fontWeight: 900, marginBottom: 8
                  }}>
                    {selectedStudentForReport.name.charAt(0)}
                  </div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1e293b" }}>{selectedStudentForReport.name}</h3>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>Class {selectedClass} | Roll #{selectedStudentForReport.rollNo || "10"}</p>
                </div>

                {/* Average Score Banner */}
                <div style={{
                  background: "#F8FAFC", border: "1px solid #BAE6FD", borderRadius: 16,
                  padding: "12px 18px", display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: 20
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <BarChart2 size={18} color="#0284C7" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Average Score</span>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 900, color: "#1e293b" }}>{average}%</span>
                </div>

                {/* Subject-wise Marks List */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: 11.5, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Subject Grades</h4>
                  {grades.map((g, idx) => (
                    <div key={idx} style={{ display: "flex", flexDirection: "column" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>{g.subject}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#1e293b" }}>{g.score}/100</span>
                      </div>
                      {/* Modern Progress Bar */}
                      <div style={{ width: "100%", height: 6, background: "#f1f5f9", borderRadius: 3, marginTop: 6, overflow: "hidden" }}>
                        <div 
                          style={{ 
                            height: "100%", 
                            background: getProgressBarColor(g.score), 
                            borderRadius: 3, 
                            width: `${g.score}%`,
                            transition: "width 0.4s ease-out"
                          }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
