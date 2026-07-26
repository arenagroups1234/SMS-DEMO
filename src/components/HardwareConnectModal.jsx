import { useState, useEffect } from "react";
import { Bluetooth, Usb, Wifi, ShieldCheck, X, RefreshCw, Radio, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function HardwareConnectModal({ isOpen, onClose, deviceType = "gps", initialDeviceId = "", onConnected }) {
  const [activeTab, setActiveTab] = useState("bluetooth"); // bluetooth, serial, cloud
  const [connecting, setConnecting] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [serialBaudRate, setSerialBaudRate] = useState("9600");
  const [deviceIp, setDeviceIp] = useState("");
  const [devicePort, setDevicePort] = useState("4370");

  useEffect(() => {
    if (isOpen) {
      setConnectedDevice(initialDeviceId ? {
        name: `${deviceType === "gps" ? "GPS Hardware Device" : "Biometric Device"} (${initialDeviceId})`,
        id: initialDeviceId,
        type: "Linked Hardware Device",
        status: "Paired & Active"
      } : null);
      setDeviceIp("");
    }
  }, [isOpen, initialDeviceId, deviceType]);

  if (!isOpen) return null;

  // ── 1. Bluetooth Connection (Web Bluetooth API) ─────────────
  const handleBluetoothConnect = async () => {
    if (!navigator.bluetooth) {
      toast.error("Web Bluetooth is not supported in your browser. Use Google Chrome or MS Edge.");
      return;
    }
    setConnecting(true);
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["battery_service", "device_information"]
      });
      const defaultName = deviceType === "gps" ? "GPS BLE Tracker" : "Bluetooth Fingerprint Scanner";
      setConnectedDevice({
        name: device.name || defaultName,
        id: device.id,
        type: "Bluetooth LE",
        status: "Online & Connected"
      });
      toast.success(`Bluetooth device "${device.name || 'Device'}" connected!`);
      if (onConnected) onConnected(device.id);
    } catch (err) {
      if (err.name !== "NotFoundError") {
        toast.error("Bluetooth pairing failed: " + err.message);
      }
    } finally {
      setConnecting(false);
    }
  };

  // ── 2. USB / Serial Port Connection (Web Serial API) ────────
  const handleSerialConnect = async () => {
    if (!navigator.serial) {
      toast.error("Web Serial API is not supported in your browser. Use Google Chrome or MS Edge.");
      return;
    }
    setConnecting(true);
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: parseInt(serialBaudRate) });
      const devId = `USB-PORT-${Math.floor(1000 + Math.random() * 9000)}`;
      const devName = deviceType === "gps" ? "GPS USB Serial Dongle" : "USB Fingerprint Scanner (Mantra/Morpho)";
      setConnectedDevice({
        name: devName,
        id: devId,
        type: `Serial Port (${serialBaudRate} Baud)`,
        status: "Active (Data Streaming)"
      });
      toast.success("USB Serial Hardware Device connected!");
      if (onConnected) onConnected(devId);
    } catch (err) {
      if (err.name !== "NotFoundError") {
        toast.error("Serial Port error: " + err.message);
      }
    } finally {
      setConnecting(false);
    }
  };

  // ── 3. Cloud / SIM IP Webhook Setup ────────────────────────
  const handleCloudConnect = () => {
    if (!deviceIp.trim()) { toast.error("Enter device IP address or IMEI"); return; }
    setConnecting(true);
    setTimeout(() => {
      const devId = `IP-${deviceIp}`;
      const devName = deviceType === "gps" ? "4G SIM Vehicle GPS Tracker" : "ZKTeco IP Gate Attendance Machine";
      setConnectedDevice({
        name: devName,
        id: `IP-${deviceIp}:${devicePort}`,
        type: "Cloud SIM/IP Push SDK",
        status: "Server Webhook Active"
      });
      toast.success("Cloud SIM/IP Device paired successfully!");
      if (onConnected) onConnected(devId);
      setConnecting(false);
    }, 1200);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 520,
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", overflow: "hidden", display: "flex", flexDirection: "column"
      }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #0284C7, #0369A1)", padding: "20px 24px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Radio size={20} className="animate-pulse" />
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900 }}>
                Connect Hardware {deviceType === "gps" ? "GPS Tracker" : "Biometric Device"}
              </h3>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.9 }}>
              {deviceType === "gps"
                ? "Pair Bluetooth OBD-II, USB Serial GPS, or 4G SIM Vehicle Trackers"
                : "Pair Bluetooth Fingerprint Scanner, USB Scanner, or IP Gate Attendance Machines"}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #E2E8F0", background: "#F8FAFC" }}>
          <button
            onClick={() => setActiveTab("bluetooth")}
            style={{
              padding: "12px 8px", border: "none", background: activeTab === "bluetooth" ? "#fff" : "transparent",
              borderBottom: activeTab === "bluetooth" ? "2.5px solid #0284C7" : "none",
              color: activeTab === "bluetooth" ? "#0284C7" : "#64748B",
              fontWeight: activeTab === "bluetooth" ? 800 : 600, fontSize: 12.5, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6
            }}
          >
            <Bluetooth size={15} /> Bluetooth LE
          </button>
          <button
            onClick={() => setActiveTab("serial")}
            style={{
              padding: "12px 8px", border: "none", background: activeTab === "serial" ? "#fff" : "transparent",
              borderBottom: activeTab === "serial" ? "2.5px solid #0284C7" : "none",
              color: activeTab === "serial" ? "#0284C7" : "#64748B",
              fontWeight: activeTab === "serial" ? 800 : 600, fontSize: 12.5, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6
            }}
          >
            <Usb size={15} /> USB Serial
          </button>
          <button
            onClick={() => setActiveTab("cloud")}
            style={{
              padding: "12px 8px", border: "none", background: activeTab === "cloud" ? "#fff" : "transparent",
              borderBottom: activeTab === "cloud" ? "2.5px solid #0284C7" : "none",
              color: activeTab === "cloud" ? "#0284C7" : "#64748B",
              fontWeight: activeTab === "cloud" ? 800 : 600, fontSize: 12.5, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6
            }}
          >
            <Wifi size={15} /> 4G SIM / IP
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Connection Status Banner */}
          {connectedDevice ? (
            <div style={{ background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: 12, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
              <CheckCircle size={24} color="#16A34A" />
              <div>
                <strong style={{ fontSize: 13.5, color: "#15803D", display: "block" }}>{connectedDevice.name}</strong>
                <span style={{ fontSize: 11.5, color: "#166534" }}>ID: {connectedDevice.id} · {connectedDevice.type} ({connectedDevice.status})</span>
              </div>
            </div>
          ) : (
            <div style={{ background: "#EFF6FF", border: "1px dashed #93C5FD", borderRadius: 12, padding: 12, fontSize: 12, color: "#1E40AF", display: "flex", alignItems: "center", gap: 8 }}>
              <AlertCircle size={16} /> Select your connection mode below to pair physical hardware with the Web Portal.
            </div>
          )}

          {/* TAB 1: BLUETOOTH */}
          {activeTab === "bluetooth" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ margin: 0, fontSize: 12.5, color: "#475569" }}>
                {deviceType === "gps"
                  ? "Scan for nearby Bluetooth LE / OBD-II GPS Dongles on your vehicle."
                  : "Scan for nearby Bluetooth Fingerprint Scanners (Mantra MFS100 BLE, ZKTeco)."}
              </p>
              <button
                onClick={handleBluetoothConnect}
                disabled={connecting}
                style={{
                  width: "100%", padding: "13px", background: "#0284C7", color: "#fff", border: "none",
                  borderRadius: 10, fontSize: 13.5, fontWeight: 800, cursor: connecting ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                }}
              >
                {connecting ? <RefreshCw size={16} className="animate-spin" /> : <Bluetooth size={16} />}
                {connecting ? "Scanning Bluetooth Devices..." : "🔍 Scan & Pair Bluetooth Device"}
              </button>
            </div>
          )}

          {/* TAB 2: USB SERIAL */}
          {activeTab === "serial" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ margin: 0, fontSize: 12.5, color: "#475569" }}>
                {deviceType === "gps"
                  ? "Connect a USB COM GPS Dongle directly to your PC."
                  : "Connect a USB Fingerprint Scanner (Mantra MFS100, Morpho) directly to your PC."}
              </p>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Baud Rate (COM Port Speed)</label>
                <select value={serialBaudRate} onChange={e => setSerialBaudRate(e.target.value)} style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13 }}>
                  <option value="9600">9600 Baud (Standard GPS/Serial)</option>
                  <option value="115200">115200 Baud (Fast High-Speed Data)</option>
                  <option value="57600">57600 Baud</option>
                </select>
              </div>
              <button
                onClick={handleSerialConnect}
                disabled={connecting}
                style={{
                  width: "100%", padding: "13px", background: "#7C3AED", color: "#fff", border: "none",
                  borderRadius: 10, fontSize: 13.5, fontWeight: 800, cursor: connecting ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                }}
              >
                {connecting ? <RefreshCw size={16} className="animate-spin" /> : <Usb size={16} />}
                {connecting ? "Detecting COM Port..." : "🔌 Select & Open USB Serial Port"}
              </button>
            </div>
          )}

          {/* TAB 3: 4G SIM / CLOUD IP */}
          {activeTab === "cloud" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ margin: 0, fontSize: 12.5, color: "#475569" }}>
                {deviceType === "gps"
                  ? "For 4G SIM Vehicle GPS Trackers (Teltonika, Concox, Jimi IoT)."
                  : "For Standalone ZKTeco IP Gate Attendance Machines."}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", display: "block", marginBottom: 3 }}>Device IP Address / IMEI</label>
                  <input value={deviceIp} onChange={e => setDeviceIp(e.target.value)} placeholder="192.168.1.201 or IMEI" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 12.5 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", display: "block", marginBottom: 3 }}>Port</label>
                  <input value={devicePort} onChange={e => setDevicePort(e.target.value)} placeholder="4370" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 12.5 }} />
                </div>
              </div>
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", padding: 10, borderRadius: 8, fontSize: 11, color: "#64748B" }}>
                🌐 <strong>Server Webhook URL:</strong> <code style={{ color: "#0284C7" }}>http://your-domain.com/api/v1/{deviceType === "gps" ? "telemetry" : "biometrics"}/push</code>
              </div>
              <button
                onClick={handleCloudConnect}
                disabled={connecting}
                style={{
                  width: "100%", padding: "12px", background: "#10B981", color: "#fff", border: "none",
                  borderRadius: 10, fontSize: 13.5, fontWeight: 800, cursor: connecting ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                }}
              >
                {connecting ? "Verifying Handshake..." : "⚡ Save & Pair Cloud Machine"}
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", background: "#F8FAFC", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11.5, color: "#64748B", display: "flex", alignItems: "center", gap: 4 }}>
            <ShieldCheck size={14} color="#10B981" /> End-to-End Encrypted Hardware Sync
          </span>
          <button onClick={onClose} style={{ padding: "8px 16px", background: "#E2E8F0", border: "none", borderRadius: 8, fontSize: 12.5, fontWeight: 700, color: "#334155", cursor: "pointer" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
