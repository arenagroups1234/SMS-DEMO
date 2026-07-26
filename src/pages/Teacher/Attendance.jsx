import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { usersApi, attendanceApi, classesApi, noticesApi } from "../../services/api";
import { Calendar, Save, CheckCircle2, UserCheck, UserX, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function TPortalAttendance() {
  const { teacherId } = useParams();
  
  // Date and Class selections
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  });
  const [selectedClass, setSelectedClass] = useState("");
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [teacherProfile, setTeacherProfile] = useState(null);
  
  // Roster and State
  const [students, setStudents] = useState([]);
  const [attendanceGrid, setAttendanceGrid] = useState({}); // { [studentId]: "Present" | "Absent" | "None" }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Fetch logged in user info (fallback)
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("sms_user") || "{}");
    } catch {
      return {};
    }
  })();

  // 1. Fetch teacher profile to get their schoolId dynamically
  useEffect(() => {
    const loadTeacherProfile = async () => {
      try {
        const tRes = await usersApi.getById(teacherId);
        if (tRes.data) {
          setTeacherProfile(tRes.data);
        }
      } catch (err) {
        console.warn("Could not load teacher profile by ID:", err);
      }
    };
    loadTeacherProfile();
  }, [teacherId]);

  // 2. Fetch classes where this teacher is the head master / class teacher
  useEffect(() => {
    const loadTeacherClasses = async () => {
      try {
        // Fetch all classes from database
        const res = await classesApi.getAll();
        const allClasses = res.data || [];
        
        // Filter classes where this teacher is assigned as head master
        const headmasterClasses = allClasses
          .filter(c => c.teacherId === teacherId)
          .map(c => c.name);
          
        let finalClasses = headmasterClasses;
        
        // Fallback to local storage/profile classes if none mapped in database
        if (!finalClasses || finalClasses.length === 0) {
          finalClasses = allClasses.map(c => c.name);
        }
        if (finalClasses.length === 0) {
          const profile = teacherProfile || storedUser;
          if (Array.isArray(profile.classes)) {
            finalClasses = profile.classes;
          } else if (typeof profile.classes === "string") {
            finalClasses = profile.classes.split(",").map(c => c.trim()).filter(Boolean);
          } else if (profile.class) {
            finalClasses = [profile.class];
          }
        }
        
        setTeacherClasses(finalClasses);
        if (finalClasses.length > 0 && !selectedClass) {
          setSelectedClass(finalClasses[0]);
        }
      } catch (err) {
        console.warn("Could not load classes for headmaster check:", err);
      }
    };
    loadTeacherClasses();
  }, [teacherId, teacherProfile]);

  // 3. Load students roster & their saved attendance for selected date/class
  useEffect(() => {
    const loadRosterAndAttendance = async () => {
      if (!selectedClass) return;
      setLoading(true);
      try {
        // Get schoolId from teacher profile or fallback to stored user
        const schoolId = teacherProfile?.schoolId || storedUser.schoolId || "";
        
        // Fetch all students in the school
        const res = await usersApi.getAll({ role: "student", schoolId, limit: 100 });
        const liveStudents = (res.data || []).map(u => ({
          id: u.id,
          name: u.name,
          class: u.className || u.class || "9th A"
        }));

        // Filter students belonging to this class
        const classFiltered = liveStudents.filter(s => s.class.trim().toLowerCase() === selectedClass.trim().toLowerCase());
        setStudents(classFiltered);

        // Prepopulate grid with unmarked ("None") status
        const initialGrid = {};
        classFiltered.forEach(s => {
          initialGrid[s.id] = "None";
        });

        // Load saved attendance for this class & date from database
        try {
          const attRes = await attendanceApi.getAll({ class: selectedClass, date: selectedDate, limit: 1000 });
          const attRecords = attRes.data || [];
          
          attRecords.forEach(rec => {
            if (rec.studentId && initialGrid[rec.studentId] !== undefined) {
              initialGrid[rec.studentId] = rec.status || "None";
            }
          });
        } catch (e) {
          console.warn("No attendance records found for this date/class:", e);
        }

        setAttendanceGrid(initialGrid);
      } catch (err) {
        toast.error("Failed to load student roster data");
      } finally {
        setLoading(false);
      }
    };
    
    loadRosterAndAttendance();
  }, [selectedClass, selectedDate, teacherProfile]);

  // 4. Mark attendance status locally
  const markStatus = (studentId, status) => {
    setAttendanceGrid(prev => {
      const current = prev[studentId];
      
      // If student is marked Absent, show a helpful toast notify (SMS simulation)
      if (status === "Absent" && current !== "Absent") {
        const studentObj = students.find(s => s.id === studentId);
        if (studentObj) {
          toast.error(`[SMS Sent] Parent notified that ${studentObj.name} is absent today!`, {
            duration: 3000
          });
        }
      }
      
      return {
        ...prev,
        [studentId]: status
      };
    });
  };

  // 5. Save attendance grid to database
  const handleSaveAttendance = async () => {
    if (!selectedClass) {
      toast.error("Please select a class first!");
      return;
    }
    
    // Check if any student is unmarked
    const unmarkedStudents = students.filter(s => attendanceGrid[s.id] === "None");
    if (unmarkedStudents.length > 0) {
      if (!window.confirm(`You have ${unmarkedStudents.length} unmarked students. Save anyway?`)) {
        return;
      }
    }

    setSaving(true);
    try {
      // Get existing records for this class & date
      const attRes = await attendanceApi.getAll({ class: selectedClass, date: selectedDate, limit: 1000 });
      const existingRecords = attRes.data || [];

      // Create lookup dictionary
      const lookup = {};
      existingRecords.forEach(r => {
        lookup[r.studentId] = r.id;
      });

      const schoolId = teacherProfile?.schoolId || storedUser.schoolId || "";

      // Save each student's record
      for (const student of students) {
        const status = attendanceGrid[student.id] || "None";
        const existingId = lookup[student.id];

        if (existingId) {
          // Update existing attendance record
          await attendanceApi.update(existingId, {
            studentId: student.id,
            studentName: student.name,
            class: selectedClass,
            date: selectedDate,
            status
          });
        } else if (status !== "None") {
          // Create new attendance record
          await attendanceApi.create({
            studentId: student.id,
            studentName: student.name,
            class: selectedClass,
            date: selectedDate,
            status
          });
        }

        // If marked Absent, create an Absent Alert notice for the parent
        if (status === "Absent") {
          try {
            await noticesApi.create({
              title: `Absent Alert: ${student.name}`,
              description: `Dear Parent, your child ${student.name} was marked ABSENT on ${selectedDate}. Please contact school if this is incorrect.`,
              category: "All",
              schoolId: schoolId,
              publishDate: new Date().toISOString(),
              status: "published"
            });
          } catch (noticeErr) {
            console.warn("Could not create absent notice:", noticeErr);
          }
        }
      }

      toast.success("Attendance register saved successfully!");
    } catch (err) {
      toast.error("Failed to save attendance: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  // Calculate dynamic stats
  const totalCount = students.length;
  const presentCount = Object.values(attendanceGrid).filter(s => s === "Present").length;
  const absentCount = Object.values(attendanceGrid).filter(s => s === "Absent").length;
  const unmarkedCount = Object.values(attendanceGrid).filter(s => s === "None").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 60 }}>
      
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1E293B" }}>
            📝 Daily Attendance Register
          </h2>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
            Mark daily attendance for classes where you are assigned as class teacher/head master.
          </p>
        </div>

        {/* Global Save Button */}
        <button
          onClick={handleSaveAttendance}
          disabled={saving || loading || students.length === 0}
          style={{
            padding: "10px 20px",
            background: "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            transition: "all 0.15s",
            opacity: (saving || loading || students.length === 0) ? 0.6 : 1,
            boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)"
          }}
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Attendance"}
        </button>
      </div>

      {/* Date & Class Select Card */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 20, padding: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
        
        {/* Date Selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 800, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
            <Calendar size={14} color="#4F46E5" /> SELECT DATE *
          </label>
          <input 
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{
              padding: "11px 14px",
              border: "1px solid #CBD5E1",
              borderRadius: 10,
              fontSize: 13.5,
              fontWeight: 700,
              outline: "none",
              background: "#F8FAFC",
              color: "#334155"
            }}
          />
        </div>

        {/* Class Selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 800, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
            🏫 SELECT CLASS *
          </label>
          <select 
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            style={{
              padding: "11px 14px",
              border: "1px solid #CBD5E1",
              borderRadius: 10,
              fontSize: 13.5,
              fontWeight: 700,
              outline: "none",
              background: "#F8FAFC",
              color: "#334155"
            }}
          >
            {teacherClasses.length === 0 ? (
              <option value="">No Assigned Classes</option>
            ) : (
              teacherClasses.map(c => (
                <option key={c} value={c}>Class {c}</option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 16 }}>
        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 16, padding: 16, textAlign: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#64748B", display: "block" }}>TOTAL STUDENTS</span>
          <span style={{ fontSize: 24, fontWeight: 900, color: "#1E293B", marginTop: 4, display: "block" }}>{totalCount}</span>
        </div>
        <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 16, padding: 16, textAlign: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#059669", display: "block" }}>PRESENT COUNT</span>
          <span style={{ fontSize: 24, fontWeight: 900, color: "#047857", marginTop: 4, display: "block" }}>{presentCount}</span>
        </div>
        <div style={{ background: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: 16, padding: 16, textAlign: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#DC2626", display: "block" }}>ABSENT COUNT</span>
          <span style={{ fontSize: 24, fontWeight: 900, color: "#B91C1C", marginTop: 4, display: "block" }}>{absentCount}</span>
        </div>
        <div style={{ background: "#EFF6FF", border: "1px solid #DBEAFE", borderRadius: 16, padding: 16, textAlign: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#2563EB", display: "block" }}>UNMARKED COUNT</span>
          <span style={{ fontSize: 24, fontWeight: 900, color: "#1D4ED8", marginTop: 4, display: "block" }}>{unmarkedCount}</span>
        </div>
      </div>

      {/* Students List Roster */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 20, padding: 24, minHeight: 250 }}>
        <h3 style={{ margin: "0 0 20px 0", fontSize: 15, fontWeight: 800, color: "#1E293B", borderBottom: "1px solid #F1F5F9", paddingBottom: 10 }}>
          Class Roster - {selectedClass ? `Class ${selectedClass}` : "No Class Selected"}
        </h3>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#64748B" }}>
            Loading students register...
          </div>
        ) : students.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8" }}>
            <AlertCircle size={40} style={{ margin: "0 auto 12px auto", display: "block", color: "#CBD5E1" }} />
            No active students found in Class {selectedClass}.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {students.map((s, index) => {
              const status = attendanceGrid[s.id] || "None";
              
              return (
                <div 
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 18px",
                    background: "#FAFAFA",
                    border: "1px solid #E5E7EB",
                    borderRadius: 16,
                    gap: 16,
                    flexWrap: "wrap",
                    transition: "all 0.15s"
                  }}
                >
                  {/* Student Left Info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "#E2E8F0",
                      color: "#475569",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 800
                    }}>
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1E293B" }}>{s.name}</p>
                      <p style={{ margin: "2px 0 0 0", fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>Roll #{index + 1}</p>
                    </div>
                  </div>

                  {/* P & A Toggle Action Buttons */}
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    
                    {/* P (Present) Button */}
                    <button
                      onClick={() => markStatus(s.id, "Present")}
                      style={{
                        padding: "8px 16px",
                        border: "2px solid #10B981",
                        borderRadius: 10,
                        background: status === "Present" ? "#10B981" : "transparent",
                        color: status === "Present" ? "#FFF" : "#10B981",
                        fontSize: 12,
                        fontWeight: 900,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        minWidth: 56,
                        justifyContent: "center",
                        transition: "all 0.15s"
                      }}
                    >
                      <UserCheck size={14} /> P
                    </button>

                    {/* A (Absent) Button */}
                    <button
                      onClick={() => markStatus(s.id, "Absent")}
                      style={{
                        padding: "8px 16px",
                        border: "2px solid #EF4444",
                        borderRadius: 10,
                        background: status === "Absent" ? "#EF4444" : "transparent",
                        color: status === "Absent" ? "#FFF" : "#EF4444",
                        fontSize: 12,
                        fontWeight: 900,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        minWidth: 56,
                        justifyContent: "center",
                        transition: "all 0.15s"
                      }}
                    >
                      <UserX size={14} /> A
                    </button>
                    
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
