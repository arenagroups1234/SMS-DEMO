import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Edit3, Trash2, ShieldAlert } from "lucide-react";
import { busesApi } from "../../services/api";

export default function DriverManagement() {
  const { schoolId } = useParams();
  const [drivers, setDrivers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busId, setBusId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Buses
      const busData = await busesApi.getAll();
      const allBuses = Array.isArray(busData) ? busData : (busData.data || []);
      setBuses(allBuses);

      // 2. Fetch Drivers
      const driverData = await busesApi.getDrivers();
      const allDrivers = Array.isArray(driverData) ? driverData : (driverData.data || []);
      setDrivers(allDrivers);

    } catch (err) {
      toast.error("Failed to load driver profiles");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [schoolId]);

  const openAddModal = () => {
    setEditingDriver(null);
    setName("");
    setPhone("");
    setEmail("");
    setPassword("");
    setBusId("");
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (driver) => {
    setEditingDriver(driver);
    setName(driver.name);
    setPhone(driver.phone);
    setEmail(driver.email || "");
    setPassword(""); // Keep blank to not change password
    setBusId(driver.busId || "");
    setIsActive(driver.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("Name and Mobile Number are required");
      return;
    }
    if (!editingDriver && !password.trim()) {
      toast.error("Password is required for new driver accounts");
      return;
    }

    if (email.trim()) {
      const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
      if (!emailRegex.test(email.trim().toLowerCase())) {
        toast.error("Please enter a valid email address");
        return;
      }
    }

    if (password.trim()) {
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!strongPasswordRegex.test(password.trim())) {
        toast.error("Password must be at least 8 characters long, and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)");
        return;
      }
    }

    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase() || null,
        isActive,
        busId: busId || null,
        schoolId
      };

      if (password.trim()) {
        payload.password = password.trim();
      }

      if (editingDriver) {
        await busesApi.updateDriver(editingDriver.id, payload);
      } else {
        await busesApi.createDriver(payload);
      }

      toast.success(editingDriver ? "Driver details updated successfully!" : "Driver account registered successfully!");
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      toast.error("Action failed: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this driver? The linked bus will be unassigned.")) return;

    try {
      await busesApi.deleteDriver(id);
      toast.success("Driver deleted successfully!");
      loadData();
    } catch (err) {
      toast.error("Delete failed: " + err.message);
    }
  };

  const handleQuickLogin = async (driver) => {
    try {
      const res = await busesApi.emulateDriver(driver.id);
      if (res.success && res.data) {
        localStorage.setItem("sms_user", JSON.stringify(res.data.user));
        localStorage.setItem("sms_token", res.data.accessToken);
        localStorage.setItem("sms_demo_mode", "false");
        toast.success(`Emulating driver: ${driver.name}. Redirecting...`);
        window.open(`/driver-portal/${driver.id}`, "_blank");
      } else {
        toast.error("Failed to generate emulation session");
      }
    } catch (err) {
      toast.error("Emulation failed: " + err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1E293B" }}>Driver Accounts</h2>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Manage driver profile records, contact credentials, and bus assignments.</p>
        </div>

        <button
          onClick={openAddModal}
          style={{
            padding: "10px 18px", background: "#0284C7", color: "#fff", border: "none",
            borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6
          }}
        >
          <Plus size={16} /> Register New Driver
        </button>
      </div>

      {/* Driver List Table */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.02)", overflow: "hidden" }}>
        {loading && drivers.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748B" }}>Loading drivers directory...</div>
        ) : drivers.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748B" }}>No drivers registered. Click "Register New Driver" to add one.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <th style={{ padding: "14px 20px", color: "#475569", fontWeight: 700 }}>Driver Name</th>
                <th style={{ padding: "14px 20px", color: "#475569", fontWeight: 700 }}>Mobile Number</th>
                <th style={{ padding: "14px 20px", color: "#475569", fontWeight: 700 }}>Email Address</th>
                <th style={{ padding: "14px 20px", color: "#475569", fontWeight: 700 }}>Assigned Bus</th>
                <th style={{ padding: "14px 20px", color: "#475569", fontWeight: 700 }}>Status</th>
                <th style={{ padding: "14px 20px", color: "#475569", fontWeight: 700, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => {
                const assignedBus = buses.find(b => b.id === driver.busId);
                return (
                  <tr key={driver.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "14px 20px", fontWeight: 800, color: "#1E293B" }}>{driver.name}</td>
                    <td style={{ padding: "14px 20px", color: "#475569" }}>{driver.phone}</td>
                    <td style={{ padding: "14px 20px", color: "#475569" }}>{driver.email || "--"}</td>
                    <td style={{ padding: "14px 20px", color: "#0284C7", fontWeight: 700 }}>
                      {assignedBus ? `Bus #${assignedBus.busNumber}` : "Not Assigned"}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                        background: driver.isActive ? "#D1FAE5" : "#FEE2E2",
                        color: driver.isActive ? "#065F46" : "#991B1B"
                      }}>
                        {driver.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 8, justifyContent: "flex-end" }}>
                        <button
                          onClick={() => openEditModal(driver)}
                          className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center"
                          title="Edit Driver"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(driver.id)}
                          className="p-2 rounded-lg bg-danger/10 text-danger hover:bg-danger hover:text-white transition-all flex items-center justify-center"
                          title="Delete Driver"
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 460, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1E293B" }}>
              {editingDriver ? `Edit Driver: ${editingDriver.name}` : "Register New Driver"}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Driver Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13.5, outline: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13.5, outline: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. ramesh@school.com"
                  value={email}
                  onChange={(e) => {
                    const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9@._-]/g, "");
                    setEmail(sanitized);
                  }}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13.5, outline: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                  Password {editingDriver ? "(Leave blank to keep current)" : "*"}
                </label>
                <input
                  type="password"
                  required={!editingDriver}
                  autoComplete="new-password"
                  placeholder="e.g. Driver@123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13.5, outline: "none" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Status</label>
                  <select
                    value={isActive ? "true" : "false"}
                    onChange={(e) => setIsActive(e.target.value === "true")}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13.5, outline: "none", background: "#fff" }}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Assigned Bus</label>
                  <select
                    value={busId}
                    onChange={(e) => setBusId(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13.5, outline: "none", background: "#fff" }}
                  >
                    <option value="">No Bus Assigned</option>
                    {buses.map(b => (
                      <option key={b.id} value={b.id}>
                        Bus #{b.busNumber} ({b.vehicleNumber})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: "10px 16px", background: "#F1F5F9", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#475569" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "10px 20px", background: "#0284C7", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#fff" }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
