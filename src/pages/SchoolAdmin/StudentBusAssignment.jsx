import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Search, Bus, ShieldCheck } from "lucide-react";
import { busesApi } from "../../services/api";

export default function StudentBusAssignment() {
  const { schoolId } = useParams();
  const [students, setStudents] = useState([]);
  const [buses, setBuses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Buses
      const busData = await busesApi.getAll();
      const allBuses = Array.isArray(busData) ? busData : (busData.data || []);
      setBuses(allBuses);

      // 2. Fetch Students
      const studentData = await busesApi.getStudents();
      const allStudents = Array.isArray(studentData) ? studentData : (studentData.data || []);
      setStudents(allStudents);

    } catch (err) {
      toast.error("Failed to load student roster");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [schoolId]);

  const handleAssign = async (studentId, busId) => {
    try {
      await busesApi.assignStudent(studentId, busId || null);

      toast.success("Student bus assignment updated successfully!");
      // Update local state to avoid full reload flicker
      setStudents(prev => prev.map(s => {
        if (s.id === studentId) {
          return { ...s, busId: busId || null };
        }
        return s;
      }));

    } catch (err) {
      toast.error("Failed to update assignment: " + err.message);
    }
  };

  const filteredStudents = students.filter(s => {
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.email && s.email.toLowerCase().includes(q)) || (s.phone && s.phone.includes(q));
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1E293B" }}>Student Bus Assignment</h2>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Assign registered students to designated school bus routes.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", background: "#fff", padding: 12, border: "1px solid #E5E7EB", borderRadius: 10 }}>
        <Search size={18} color="#64748B" />
        <input
          type="text"
          placeholder="Search students by name, email, or mobile..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: "100%", border: "none", fontSize: 13.5, outline: "none", color: "#1E293B" }}
        />
      </div>

      {/* Roster Table Card */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.02)", overflow: "hidden" }}>
        {loading && students.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748B" }}>Loading school roster...</div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748B" }}>No matching student records found.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <th style={{ padding: "14px 20px", color: "#475569", fontWeight: 700 }}>Student Name</th>
                <th style={{ padding: "14px 20px", color: "#475569", fontWeight: 700 }}>Email / Contact</th>
                <th style={{ padding: "14px 20px", color: "#475569", fontWeight: 700 }}>Current Assignment</th>
                <th style={{ padding: "14px 20px", color: "#475569", fontWeight: 700, width: 280 }}>Assign Bus Route</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const assignedBus = buses.find(b => b.id === student.busId);
                return (
                  <tr key={student.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "14px 20px", fontWeight: 800, color: "#1E293B" }}>{student.name}</td>
                    <td style={{ padding: "14px 20px", color: "#475569" }}>
                      <div>{student.email || "--"}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{student.phone || ""}</div>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      {assignedBus ? (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "#E0F2FE", color: "#0369A1", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Bus size={12} /> Route #{assignedBus.busNumber}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: "#94A3B8" }}>Not Assigned</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <select
                        value={student.busId || ""}
                        onChange={(e) => handleAssign(student.id, e.target.value)}
                        style={{
                          width: "100%", padding: "8px 10px", border: "1px solid #CBD5E1", borderRadius: 8,
                          fontSize: 13, outline: "none", background: "#fff", cursor: "pointer", color: student.busId ? "#1E293B" : "#94A3B8"
                        }}
                      >
                        <option value="">-- No Bus (Walk-in / Private) --</option>
                        {buses.map(b => (
                          <option key={b.id} value={b.id}>
                            Bus #{b.busNumber} - {b.busName || b.vehicleNumber}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
