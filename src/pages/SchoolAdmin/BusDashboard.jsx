import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Bus, UserCheck, Users, Activity, CalendarX } from "lucide-react";
import { busesApi } from "../../services/api";

export default function BusDashboard() {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalBuses: 0,
    activeTrips: 0,
    totalDrivers: 0,
    assignedStudents: 0
  });
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayLeaves, setTodayLeaves] = useState([]);

  const fetchStatsAndBuses = async () => {
    setLoading(true);
    try {
      const [busData, driverData, studentData, leaveData] = await Promise.all([
        busesApi.getAll(),
        busesApi.getDrivers(),
        busesApi.getStudents(),
        busesApi.getTodayLeaves().catch(() => ({ data: [] }))
      ]);

      const allBuses    = Array.isArray(busData)    ? busData    : (busData.data    || []);
      const allDrivers  = Array.isArray(driverData)  ? driverData  : (driverData.data  || []);
      const allStudents = Array.isArray(studentData) ? studentData : (studentData.data || []);
      const leaves      = leaveData?.data || [];

      setBuses(allBuses);
      setTodayLeaves(leaves);
      setStats({
        totalBuses: allBuses.length,
        activeTrips: allBuses.filter(b => b.isTripActive).length,
        totalDrivers: allDrivers.length,
        assignedStudents: allStudents.filter(s => s.busId).length
      });
    } catch (err) {
      toast.error("Failed to load tracking analytics dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndBuses();
    
    // Auto refresh status every 15 seconds to simulate real-time updates
    const interval = setInterval(fetchStatsAndBuses, 15000);
    return () => clearInterval(interval);
  }, [schoolId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1E293B" }}>Live Bus System Dashboard</h2>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Real-time transport intelligence, route monitors, and fleet tracking metrics.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
        {/* Card 1: Total Buses */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.02)", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bus size={24} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>Registered Fleet</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#1E293B", marginTop: 4 }}>{stats.totalBuses} Buses</div>
          </div>
        </div>

        {/* Card 2: Active Trips */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.02)", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#ECFDF5", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Activity size={24} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>Active Trips</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#10B981", marginTop: 4 }}>{stats.activeTrips} Live</div>
          </div>
        </div>

        {/* Card 3: Total Drivers */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.02)", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#F5F3FF", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UserCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>Verified Drivers</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#7C3AED", marginTop: 4 }}>{stats.totalDrivers} Drivers</div>
          </div>
        </div>

        {/* Card 4: Assigned Students */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.02)", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#FEF3C7", color: "#D97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>Assigned Students</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#D97706", marginTop: 4 }}>{stats.assignedStudents} Assigned</div>
          </div>
        </div>
      </div>

      {/* Fleet Status Table Card */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.02)", overflow: "hidden" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1E293B" }}>Active Fleet Monitor</h3>
          <button 
            onClick={() => navigate(`/school-portal/${schoolId}/live-tracking`)}
            style={{ padding: "6px 12px", background: "#0F172A", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            Launch Map Tracker 📍
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          {loading && buses.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748B" }}>Loading fleet data...</div>
          ) : buses.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748B" }}>No buses registered. Use <strong>Bus Management</strong> to add a vehicle.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "14px 20px", color: "#475569", fontWeight: 700 }}>Bus Number</th>
                  <th style={{ padding: "14px 20px", color: "#475569", fontWeight: 700 }}>Vehicle Plate</th>
                  <th style={{ padding: "14px 20px", color: "#475569", fontWeight: 700 }}>Name / Route</th>
                  <th style={{ padding: "14px 20px", color: "#475569", fontWeight: 700 }}>Trip Status</th>
                  <th style={{ padding: "14px 20px", color: "#475569", fontWeight: 700 }}>Current Speed</th>
                  <th style={{ padding: "14px 20px", color: "#475569", fontWeight: 700 }}>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {buses.map((bus) => {
                  let statusBg = "#F1F5F9";
                  let statusColor = "#64748B";
                  let statusText = "Offline";

                  if (bus.isTripActive) {
                    if (bus.tripStatus === "Moving") {
                      statusBg = "#D1FAE5";
                      statusColor = "#065F46";
                      statusText = "🟢 Moving";
                    } else {
                      statusBg = "#FEF3C7";
                      statusColor = "#92400E";
                      statusText = "🟡 Stopped";
                    }
                  } else {
                    statusBg = "#FEE2E2";
                    statusColor = "#991B1B";
                    statusText = "🔴 Offline";
                  }

                  return (
                    <tr key={bus.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "14px 20px", fontWeight: 800, color: "#1E293B" }}>{bus.busNumber}</td>
                      <td style={{ padding: "14px 20px", color: "#475569" }}>{bus.vehicleNumber}</td>
                      <td style={{ padding: "14px 20px", color: "#475569" }}>{bus.busName || "N/A"}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 6, background: statusBg, color: statusColor }}>
                          {statusText}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px", color: "#1E293B", fontWeight: 700 }}>
                        {bus.isTripActive ? `${bus.speed || 0} km/h` : "--"}
                      </td>
                      <td style={{ padding: "14px 20px", color: "#64748B", fontSize: 12.5 }}>
                        {bus.lastUpdated ? new Date(bus.lastUpdated).toLocaleTimeString() : "Never"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
