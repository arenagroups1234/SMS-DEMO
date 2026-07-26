import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Edit3, Trash2, Bus, MapPin, X, ChevronRight, GripVertical, ArrowUp, ArrowDown, Radio } from "lucide-react";
import { busesApi } from "../../services/api";
import HardwareConnectModal from "../../components/HardwareConnectModal";

// ─── Stop Row in the manager panel ────────────────────────────────────────────
function StopRow({ stop, onEdit, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  const isSchool = isLast;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
      background: isSchool ? "#FFF7ED" : "#F8FAFF",
      border: `1.5px solid ${isSchool ? "#FED7AA" : "#EDE9FE"}`,
      borderRadius: 10, marginBottom: 6
    }}>
      {/* Order badge */}
      <div style={{
        width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
        background: isSchool ? "#EA580C" : "#7C3AED", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 800
      }}>
        {isSchool ? "🏫" : stop.stopOrder}
      </div>

      {/* Stop info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {stop.stopName}
        </div>
        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>
          {stop.estimatedMinutes > 0 ? `${stop.estimatedMinutes} min from school` : "ETA not set"}
          {stop.latitude ? ` · GPS set` : " · No GPS"}
        </div>
      </div>

      {/* Move up/down */}
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <button onClick={onMoveUp} disabled={isFirst} style={{ background: "none", border: "none", cursor: isFirst ? "not-allowed" : "pointer", color: isFirst ? "#E2E8F0" : "#94A3B8", padding: 1 }}>
          <ArrowUp size={13} />
        </button>
        <button onClick={onMoveDown} disabled={isLast} style={{ background: "none", border: "none", cursor: isLast ? "not-allowed" : "pointer", color: isLast ? "#E2E8F0" : "#94A3B8", padding: 1 }}>
          <ArrowDown size={13} />
        </button>
      </div>

      {/* Edit / Delete */}
      <button onClick={() => onEdit(stop)} style={{ background: "none", border: "none", color: "#0284C7", cursor: "pointer", padding: 4 }}>
        <Edit3 size={14} />
      </button>
      <button onClick={() => onDelete(stop.id)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", padding: 4 }}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ─── Stops Manager Panel (shown as slide-in drawer per bus) ───────────────────
function StopsManagerPanel({ bus, onClose }) {
  const [stops, setStops]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [editingStop, setEditingStop] = useState(null); // null = add new
  const [showForm, setShowForm]   = useState(false);

  // Form state
  const [stopName, setStopName]   = useState("");
  const [estMins, setEstMins]     = useState("");
  const [lat, setLat]             = useState("");
  const [lng, setLng]             = useState("");

  const fetchStops = async () => {
    setLoading(true);
    try {
      const data = await busesApi.getStops(bus.id);
      const sorted = Array.isArray(data) ? [...data].sort((a, b) => a.stopOrder - b.stopOrder) : [];
      setStops(sorted);
    } catch { toast.error("Failed to load stops"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStops(); }, [bus.id]);

  const openAdd = () => {
    setEditingStop(null);
    setStopName(""); setEstMins(""); setLat(""); setLng("");
    setShowForm(true);
  };

  const openEdit = (stop) => {
    setEditingStop(stop);
    setStopName(stop.stopName);
    setEstMins(String(stop.estimatedMinutes || ""));
    setLat(stop.latitude || ""); setLng(stop.longitude || "");
    setShowForm(true);
  };

  const handleSaveStop = async () => {
    if (!stopName.trim()) { toast.error("Stop name is required"); return; }
    setSaving(true);
    try {
      if (editingStop) {
        await busesApi.updateStop(editingStop.id, {
          stopName: stopName.trim(),
          estimatedMinutes: estMins ? parseInt(estMins) : 0,
          latitude: lat || null, longitude: lng || null
        });
        toast.success("Stop updated!");
      } else {
        const nextOrder = stops.length > 0 ? Math.max(...stops.map(s => s.stopOrder)) + 1 : 1;
        await busesApi.createStop(bus.id, {
          stopName: stopName.trim(),
          stopOrder: nextOrder,
          estimatedMinutes: estMins ? parseInt(estMins) : 0,
          latitude: lat || null, longitude: lng || null
        });
        toast.success("Stop added!");
      }
      setShowForm(false);
      fetchStops();
    } catch (err) { toast.error("Save failed: " + (err.message || "Unknown error")); }
    finally { setSaving(false); }
  };

  const handleDelete = async (stopId) => {
    if (!window.confirm("Delete this stop?")) return;
    try {
      await busesApi.deleteStop(stopId);
      toast.success("Stop deleted");
      fetchStops();
    } catch { toast.error("Failed to delete stop"); }
  };

  // Reorder: swap stopOrder values between two adjacent stops
  const handleMove = async (idx, direction) => {
    const newStops = [...stops];
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= newStops.length) return;

    const a = newStops[idx];
    const b = newStops[swapIdx];
    try {
      await Promise.all([
        busesApi.updateStop(a.id, { stopOrder: b.stopOrder }),
        busesApi.updateStop(b.id, { stopOrder: a.stopOrder })
      ]);
      fetchStops();
    } catch { toast.error("Reorder failed"); }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 900,
      background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)",
      display: "flex", justifyContent: "flex-end"
    }}>
      <div style={{
        width: "100%", maxWidth: 480, height: "100%", background: "#fff",
        display: "flex", flexDirection: "column", boxShadow: "-8px 0 30px rgba(0,0,0,0.12)"
      }}>
        {/* Header */}
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1E293B" }}>
              🚌 Route Stops — Bus #{bus.busNumber}
            </h3>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748B" }}>
              {bus.busName || bus.vehicleNumber} · Stops are shown on driver map in this order
            </p>
          </div>
          <button onClick={onClose} style={{ background: "#F1F5F9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} color="#64748B" />
          </button>
        </div>

        {/* Stop list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {loading ? (
            <div style={{ textAlign: "center", color: "#94A3B8", padding: 30, fontSize: 13 }}>Loading stops...</div>
          ) : stops.length === 0 ? (
            <div style={{ textAlign: "center", padding: 30 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📍</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>No stops yet</div>
              <p style={{ fontSize: 12.5, color: "#64748B", marginTop: 4 }}>
                Add pickup stops in order. The last stop should be the school.
              </p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11.5, color: "#94A3B8", fontWeight: 600, marginBottom: 10 }}>
                {stops.length} stop{stops.length !== 1 ? "s" : ""} · Last stop = school destination
              </div>
              {stops.map((stop, idx) => (
                <StopRow
                  key={stop.id}
                  stop={stop}
                  isFirst={idx === 0}
                  isLast={idx === stops.length - 1}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onMoveUp={() => handleMove(idx, -1)}
                  onMoveDown={() => handleMove(idx, 1)}
                />
              ))}
              <div style={{ marginTop: 8, padding: "8px 12px", background: "#FFF7ED", border: "1px dashed #FED7AA", borderRadius: 8, fontSize: 12, color: "#92400E" }}>
                💡 The <strong>last stop</strong> in the list is treated as the school destination on the driver's map.
              </div>
            </>
          )}
        </div>

        {/* Add / Edit Stop Form */}
        {showForm && (
          <div style={{ borderTop: "1px solid #E2E8F0", padding: "16px 20px", background: "#F8FAFC", flexShrink: 0 }}>
            <h4 style={{ margin: "0 0 12px", fontSize: 13.5, fontWeight: 800, color: "#1E293B" }}>
              {editingStop ? `Edit: ${editingStop.stopName}` : "Add New Stop"}
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Stop Name *</label>
                <input value={stopName} onChange={e => setStopName(e.target.value)}
                  placeholder="e.g. Main Market Gate, Sector 12..."
                  style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>
                  ETA from School (minutes)
                  <span style={{ fontWeight: 400, color: "#94A3B8" }}> — used for parent arrival estimate</span>
                </label>
                <input type="number" min="0" value={estMins} onChange={e => setEstMins(e.target.value)}
                  placeholder="e.g. 15"
                  style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Latitude <span style={{ color: "#94A3B8", fontWeight: 400 }}>(optional)</span></label>
                  <input value={lat} onChange={e => setLat(e.target.value)} placeholder="28.6139"
                    style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Longitude <span style={{ color: "#94A3B8", fontWeight: 400 }}>(optional)</span></label>
                  <input value={lng} onChange={e => setLng(e.target.value)} placeholder="77.2090"
                    style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "8px", background: "#E2E8F0", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={handleSaveStop} disabled={saving} style={{ flex: 1, padding: "8px", background: "#0284C7", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
                  {saving ? "Saving..." : editingStop ? "Update Stop" : "Add Stop"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        {!showForm && (
          <div style={{ padding: "14px 20px", borderTop: "1px solid #F1F5F9", flexShrink: 0 }}>
            <button onClick={openAdd} style={{ width: "100%", padding: "10px", background: "#0284C7", color: "#fff", border: "none", borderRadius: 9, fontSize: 13.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Plus size={16} /> Add Stop to Route
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main BusManagement Page ───────────────────────────────────────────────────
export default function BusManagement() {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const [buses, setBuses]           = useState([]);
  const [drivers, setDrivers]       = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [stopsForBus, setStopsForBus] = useState(null); // bus object whose stops panel is open

  // Hardware Device Connection Modal State
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [selectedBusForConnect, setSelectedBusForConnect] = useState(null);

  // Bus form state
  const [busNumber, setBusNumber]       = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [busName, setBusName]           = useState("");
  const [driverId, setDriverId]         = useState("");
  const [capacity, setCapacity]         = useState("40");
  const [status, setStatus]             = useState("Active");
  const [gpsDeviceId, setGpsDeviceId]   = useState("");

  // Stop count cache per busId for badge display
  const [stopCounts, setStopCounts] = useState({});

  const loadData = async () => {
    setLoading(true);
    try {
      const [driverData, busData] = await Promise.all([
        busesApi.getDrivers(),
        busesApi.getAll()
      ]);
      const allDrivers = Array.isArray(driverData) ? driverData : (driverData.data || []);
      const allBuses   = Array.isArray(busData)   ? busData   : (busData.data   || []);
      setDrivers(allDrivers);
      setBuses(allBuses);

      // Fetch stop counts for each bus (for badge)
      const counts = {};
      await Promise.all(allBuses.map(async (b) => {
        try {
          const stops = await busesApi.getStops(b.id);
          counts[b.id] = Array.isArray(stops) ? stops.length : 0;
        } catch { counts[b.id] = 0; }
      }));
      setStopCounts(counts);
    } catch (err) {
      toast.error("Failed to load transport details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [schoolId]);

  const openAddModal = () => {
    setEditingBus(null);
    setSelectedBusForConnect(null);
    setBusNumber(""); setVehicleNumber(""); setBusName("");
    setDriverId(""); setCapacity("40"); setStatus("Active");
    setGpsDeviceId("");
    setIsModalOpen(true);
  };

  const openEditModal = (bus) => {
    setEditingBus(bus);
    setBusNumber(bus.busNumber); setVehicleNumber(bus.vehicleNumber);
    setBusName(bus.busName || ""); setDriverId(bus.driverId || "");
    setCapacity(String(bus.capacity || 40)); setStatus(bus.status || "Active");
    setGpsDeviceId(bus.gpsDeviceId || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!busNumber.trim() || !vehicleNumber.trim()) {
      toast.error("Bus Number and Vehicle Number are required"); return;
    }
    try {
      const payload = {
        busNumber: busNumber.trim(), vehicleNumber: vehicleNumber.trim(),
        busName: busName.trim() || null, capacity: parseInt(capacity),
        status, driverId: driverId || null, schoolId,
        gpsDeviceId: gpsDeviceId.trim() || null
      };
      if (editingBus) await busesApi.update(editingBus.id, payload);
      else await busesApi.create(payload);
      toast.success(editingBus ? "Bus updated!" : "Bus registered!");
      setIsModalOpen(false);
      loadData();
    } catch (err) { toast.error("Action failed: " + err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this bus? All student assignments will be cleared.")) return;
    try {
      await busesApi.delete(id);
      toast.success("Bus deleted!");
      loadData();
    } catch (err) { toast.error("Delete failed: " + err.message); }
  };

  const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13.5, outline: "none", boxSizing: "border-box" };
  const labelStyle = { display: "block", fontSize: 12.5, fontWeight: 600, color: "#475569", marginBottom: 6 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Stops Manager Drawer */}
      {stopsForBus && (
        <StopsManagerPanel
          bus={stopsForBus}
          onClose={() => { setStopsForBus(null); loadData(); }}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1E293B" }}>Bus Management</h2>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Register buses, assign drivers, and configure route stops.</p>
        </div>
        <button onClick={openAddModal} style={{ padding: "10px 18px", background: "#0284C7", color: "#fff", border: "none", borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Plus size={16} /> Register New Bus
        </button>
      </div>

      {/* Bus List Table */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.02)", overflow: "hidden" }}>
        {loading && buses.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748B" }}>Loading fleet database...</div>
        ) : buses.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748B" }}>No buses registered yet. Click "Register New Bus" to add one.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <th style={{ padding: "14px 20px", color: "#475569", fontWeight: 700 }}>Bus Number</th>
                <th style={{ padding: "14px 20px", color: "#475569", fontWeight: 700 }}>Vehicle Plate</th>
                <th style={{ padding: "14px 20px", color: "#475569", fontWeight: 700 }}>Route / Name</th>
                <th style={{ padding: "14px 20px", color: "#475569", fontWeight: 700 }}>Capacity</th>
                <th style={{ padding: "14px 20px", color: "#475569", fontWeight: 700 }}>Driver</th>
                <th style={{ padding: "14px 20px", color: "#475569", fontWeight: 700 }}>GPS Tracker ID</th>
                <th style={{ padding: "14px 20px", color: "#475569", fontWeight: 700 }}>Stops</th>
                <th style={{ padding: "14px 20px", color: "#475569", fontWeight: 700 }}>Status</th>
                <th style={{ padding: "14px 20px", color: "#475569", fontWeight: 700, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {buses.map((bus) => {
                const driver = drivers.find(d => d.id === bus.driverId);
                const stopCount = stopCounts[bus.id] ?? 0;
                return (
                  <tr key={bus.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "14px 20px", fontWeight: 800, color: "#1E293B" }}>{bus.busNumber}</td>
                    <td style={{ padding: "14px 20px", color: "#475569" }}>{bus.vehicleNumber}</td>
                    <td style={{ padding: "14px 20px", color: "#475569" }}>{bus.busName || "Not Configured"}</td>
                    <td style={{ padding: "14px 20px", color: "#475569" }}>{bus.capacity} Students</td>
                    <td style={{ padding: "14px 20px", color: "#0284C7", fontWeight: 700 }}>
                      {driver ? driver.name : "Not Assigned"}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      {bus.gpsDeviceId ? (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#F0FDF4", border: "1px solid #BBF7D0", padding: "4px 9px", borderRadius: 6 }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16A34A" }} />
                          <span style={{ color: "#15803D", fontWeight: 800, fontSize: 11.5 }}>{bus.gpsDeviceId}</span>
                          <span style={{ fontSize: 10, color: "#166534", fontWeight: 700 }}>(🟢 Connected)</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setSelectedBusForConnect(bus); setIsHardwareModalOpen(true); }}
                          style={{
                            padding: "4px 10px", background: "#EFF6FF", border: "1px solid #BFDBFE",
                            borderRadius: 6, color: "#0284C7", fontSize: 11.5, fontWeight: 800, cursor: "pointer",
                            display: "inline-flex", alignItems: "center", gap: 4
                          }}
                          title="Scan & Pair Bluetooth / Serial / Cloud GPS Device"
                        >
                          <Radio size={12} /> 🔌 Scan & Pair Device
                        </button>
                      )}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <button
                        onClick={() => setStopsForBus(bus)}
                        className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all font-semibold flex items-center gap-1 text-[11.5px]"
                        title="Configure Route Stops"
                      >
                        <MapPin size={12} className="text-slate-500" />
                        {stopCount} Stop{stopCount !== 1 ? "s" : ""}
                      </button>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                        background: bus.status === "Active" ? "#D1FAE5" : "#FEE2E2",
                        color: bus.status === "Active" ? "#065F46" : "#991B1B"
                      }}>
                        {bus.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 8, justifyContent: "flex-end" }}>
                        <button
                          onClick={() => navigate(`/school-portal/${schoolId}/live-tracking?busId=${bus.id}`)}
                          className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all flex items-center justify-center animate-none"
                          title="Track Live Bus"
                        >
                          <MapPin size={13} />
                        </button>
                        <button
                          onClick={() => openEditModal(bus)}
                          className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center"
                          title="Edit Bus"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(bus.id)}
                          className="p-2 rounded-lg bg-danger/10 text-danger hover:bg-danger hover:text-white transition-all flex items-center justify-center"
                          title="Delete Bus"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Bus Modal */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 460, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1E293B" }}>
              {editingBus ? `Edit Bus #${editingBus.busNumber}` : "Register New Bus"}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
              <div><label style={labelStyle}>Bus Number *</label>
                <input required placeholder="e.g. 102" value={busNumber} onChange={e => setBusNumber(e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>Vehicle Plate Number *</label>
                <input required placeholder="e.g. DL-1CA-1234" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>Bus Name / Route (Optional)</label>
                <input placeholder="e.g. North Delhi Route" value={busName} onChange={e => setBusName(e.target.value)} style={inputStyle} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={labelStyle}>Capacity</label>
                  <input type="number" min="1" value={capacity} onChange={e => setCapacity(e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, background: "#fff" }}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select></div>
              </div>
              <div>
                <label style={labelStyle}>GPS Hardware Device</label>
                {gpsDeviceId ? (
                  <div style={{
                    background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: 10,
                    padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#16A34A" }} />
                      <div>
                        <strong style={{ fontSize: 13, color: "#15803D", display: "block" }}>
                          Auto-Fetched ID: {gpsDeviceId}
                        </strong>
                        <span style={{ fontSize: 11, color: "#166534", fontWeight: 700 }}>
                          🟢 Status: Paired & Broadcasting Live GPS
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsHardwareModalOpen(true)}
                      style={{
                        background: "#DCFCE7", border: "1px solid #86EFAC", borderRadius: 6,
                        color: "#15803D", fontSize: 11, fontWeight: 800, padding: "4px 10px", cursor: "pointer"
                      }}
                    >
                      🔄 Re-scan / Change
                    </button>
                  </div>
                ) : (
                  <div style={{
                    background: "#F8FAFC", border: "1.5px dashed #CBD5E1", borderRadius: 10,
                    padding: 14, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8
                  }}>
                    <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>
                      No Hardware GPS Device paired yet. Click below to auto-detect.
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsHardwareModalOpen(true)}
                      style={{
                        width: "100%", padding: "10px", background: "#0284C7", color: "#fff",
                        border: "none", borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                      }}
                    >
                      <Radio size={16} /> 🔌 Scan & Pair Hardware Device (Auto-Fetch ID)
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle}>Assigned Driver</label>
                <select value={driverId} onChange={e => setDriverId(e.target.value)} style={{ ...inputStyle, background: "#fff" }}>
                  <option value="">No Driver Assigned</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.phone})</option>)}
                </select>
                <p style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>Drivers can only be linked to a single bus.</p>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: "10px 16px", background: "#F1F5F9", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#475569" }}>Cancel</button>
                <button type="submit" style={{ padding: "10px 20px", background: "#0284C7", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#fff" }}>Save Bus</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hardware Connection Modal */}
      <HardwareConnectModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
        deviceType="gps"
        initialDeviceId={gpsDeviceId || selectedBusForConnect?.gpsDeviceId || ""}
        onConnected={async (devId) => {
          setGpsDeviceId(devId);
          if (selectedBusForConnect) {
            try {
              await busesApi.update(selectedBusForConnect.id, { gpsDeviceId: devId });
              toast.success(`Bus #${selectedBusForConnect.busNumber} linked to Hardware Device ${devId}`);
              loadData();
            } catch (err) { toast.error("Failed to link device ID"); }
          }
          setIsHardwareModalOpen(false);
        }}
      />
    </div>
  );
}
