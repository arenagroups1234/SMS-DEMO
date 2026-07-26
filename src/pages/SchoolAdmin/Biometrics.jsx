import { useState, useEffect } from "react";
import { Cpu, Fingerprint, Plus, Trash2, ShieldCheck, RefreshCw, Wifi, AlertTriangle, Radio } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { biometricsApi } from "../../services/api";
import { usersApi } from "../../services/api";
import HardwareConnectModal from "../../components/HardwareConnectModal";

export default function PortalBiometrics() {
  const { schoolId } = useParams();
  const [activeTab, setActiveTab] = useState("devices"); // devices, enrollment
  
  // Device Config State
  const [devices, setDevices] = useState([]);
  const [deviceLoading, setDeviceLoading] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [deviceIp, setDeviceIp] = useState("");
  const [devicePort, setDevicePort] = useState("4370");

  // Enrollment State
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Enrollment Form State
  const [enrollMode, setEnrollMode] = useState("network"); // network, usb
  const [enrollId, setEnrollId] = useState("");
  const [usbStatus, setUsbStatus] = useState("Idle"); // Idle, Scanning, Success, Error

  // Load Data
  const loadDevices = async () => {
    setDeviceLoading(true);
    try {
      const res = await biometricsApi.getDevices();
      setDevices(res.data || []);
    } catch (err) {
      toast.error("Failed to load biometric devices");
    } finally {
      setDeviceLoading(false);
    }
  };

  const loadStudentsAndEnrollments = async () => {
    setEnrollLoading(true);
    try {
      const studRes = await usersApi.getAll({ schoolId, role: "student", limit: 100 });
      setStudents(studRes.data || []);
    } catch (err) {
      toast.error("Failed to load students list");
    } finally {
      setEnrollLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "devices") {
      loadDevices();
    } else {
      loadStudentsAndEnrollments();
    }
  }, [schoolId, activeTab]);

  // Create Device Handler
  const handleCreateDevice = async (e) => {
    e.preventDefault();
    if (!deviceName.trim() || !deviceIp.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await biometricsApi.createDevice({
        deviceName,
        deviceIp,
        port: parseInt(devicePort) || 4370,
        schoolId
      });
      toast.success("Biometric device registered successfully");
      setIsDeviceModalOpen(false);
      setDeviceName("");
      setDeviceIp("");
      setDevicePort("4370");
      loadDevices();
    } catch (err) {
      toast.error("Failed to register biometric device");
    }
  };

  // Delete Device Handler
  const handleDeleteDevice = async (id) => {
    if (!window.confirm("Are you sure you want to delete this biometric device?")) return;
    try {
      await biometricsApi.deleteDevice(id);
      toast.success("Biometric device removed");
      loadDevices();
    } catch (err) {
      toast.error("Failed to remove biometric device");
    }
  };

  // Trigger Local USB Scanner Capture (Simulating Mantra/Morpho RD Service)
  const handleUsbCaptureSimulate = () => {
    setUsbStatus("Scanning");
    toast.info("Activating USB Scanner... Please place your finger on the device");
    
    setTimeout(async () => {
      // Simulate base64 XML response minutiae data from Mantra local service
      const dummyTemplate = "Mantra_MFS100_Encrypted_ISO_Minutiae_Base64_XML_DATA_Simulated_" + Math.random().toString(36).substring(7);
      setUsbStatus("Success");
      toast.success("Fingerprint captured successfully!");
      
      try {
        await biometricsApi.enroll({
          studentId: selectedStudent.id,
          biometricTemplate: dummyTemplate,
          schoolId
        });
        toast.success(`Fingerprint enrolled for ${selectedStudent.name}`);
        setTimeout(() => {
          setIsEnrollModalOpen(false);
          loadStudentsAndEnrollments();
        }, 1000);
      } catch (err) {
        toast.error("Failed to save fingerprint template in server");
        setUsbStatus("Error");
      }
    }, 2000);
  };

  // Submit Network Enroll Mapping Handler
  const handleNetworkEnroll = async (e) => {
    e.preventDefault();
    if (!enrollId.trim()) {
      toast.error("Please specify a Machine Enroll ID");
      return;
    }

    try {
      await biometricsApi.enroll({
        studentId: selectedStudent.id,
        deviceEnrollId: parseInt(enrollId),
        schoolId
      });
      toast.success(`Linked Machine ID ${enrollId} to ${selectedStudent.name}`);
      setIsEnrollModalOpen(false);
      setEnrollId("");
      loadStudentsAndEnrollments();
    } catch (err) {
      toast.error("Failed to map enrollment ID");
    }
  };

  // Filter students based on search
  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* ─── PAGE HEADER ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold font-serif text-primary flex items-center gap-2">
            <Fingerprint className="text-secondary" size={24} />
            Biometric Attendance Management
          </h1>
          <p className="text-xs text-text-light mt-1">
            Register biometric network devices and enroll student fingerprints for real-time gate attendance.
          </p>
        </div>
        
        {activeTab === "devices" && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsHardwareModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-emerald-700 transition-all active:scale-95 shrink-0"
            >
              <Radio size={14} /> Pair Bluetooth / USB Machine
            </button>
            <button
              onClick={() => setIsDeviceModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl shadow-md hover:bg-primary-dark transition-all active:scale-95 shrink-0"
            >
              <Plus size={14} /> Add IP Device
            </button>
          </div>
        )}
      </div>

      {/* ─── TABS ─── */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab("devices")}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "devices"
              ? "border-primary text-primary"
              : "border-transparent text-text-light hover:text-primary"
          }`}
        >
          <Cpu size={14} />
          Registered IP Devices
        </button>
        <button
          onClick={() => setActiveTab("enrollment")}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "enrollment"
              ? "border-primary text-primary"
              : "border-transparent text-text-light hover:text-primary"
          }`}
        >
          <Fingerprint size={14} />
          Fingerprint Enrollment
        </button>
      </div>

      {/* ─── TAB 1: DEVICE LIST ─── */}
      {activeTab === "devices" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deviceLoading ? (
            <div className="col-span-full py-12 text-center text-text-light">Loading devices...</div>
          ) : devices.length === 0 ? (
            <div className="col-span-full py-12 text-center text-text-light bg-white rounded-2xl border border-slate-100">
              No biometric devices configured yet. Click "Add Device" to link ZKTeco gate machines.
            </div>
          ) : (
            devices.map((device) => (
              <div
                key={device.id}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="bg-primary/5 p-2.5 rounded-xl">
                      <Wifi className="text-primary" size={20} />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      device.status === "Online" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${device.status === "Online" ? "bg-success animate-pulse" : "bg-danger"}`}></span>
                      {device.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-primary">{device.deviceName}</h3>
                    <p className="text-xs text-text-light mt-1 flex items-center gap-1.5">
                      <span>IP Address: <strong>{device.deviceIp}</strong></span>
                      <span className="text-slate-300">|</span>
                      <span>Port: <strong>{device.port}</strong></span>
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-50">
                  <span className="text-[10px] text-text-light font-medium">Mapped to gate/entrance</span>
                  <button
                    onClick={() => handleDeleteDevice(device.id)}
                    className="p-1.5 text-danger hover:bg-danger/5 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── TAB 2: ENROLLMENT LIST ─── */}
      {activeTab === "enrollment" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          
          {/* SEARCH BAR */}
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <input
              type="text"
              placeholder="Search student by name or email..."
              className="bg-white border border-slate-200 text-xs px-4 py-2 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full max-w-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">
              {filteredStudents.length} students found
            </span>
          </div>

          {/* STUDENTS TABLE */}
          {enrollLoading ? (
            <div className="py-12 text-center text-text-light">Loading students...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-text-light">No students found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-text-light uppercase tracking-wider border-b border-slate-100">
                    <th className="px-6 py-3.5">Student Name</th>
                    <th className="px-6 py-3.5">Class</th>
                    <th className="px-6 py-3.5">Enrollment Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => {
                    const isEnrolledOnMachine = student.deviceEnrollId !== null;
                    const isEnrolledViaUsb = student.biometricTemplate !== null;
                    const isEnrolled = isEnrolledOnMachine || isEnrolledViaUsb;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/5 text-primary font-bold flex items-center justify-center text-xs">
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-primary">{student.name}</h4>
                              <p className="text-[10px] text-text-light">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-primary">
                          {student.className || "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          {isEnrolledOnMachine ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success flex items-center gap-1.5 w-fit">
                              <ShieldCheck size={12} />
                              Gate Machine ID: {student.deviceEnrollId}
                            </span>
                          ) : isEnrolledViaUsb ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1.5 w-fit">
                              <Fingerprint size={12} />
                              USB Registered
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning/10 text-warning flex items-center gap-1.5 w-fit">
                              <AlertTriangle size={12} />
                              Not Registered
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setEnrollId(student.deviceEnrollId ? String(student.deviceEnrollId) : "");
                              setIsEnrollModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-primary/5 hover:bg-primary text-primary hover:text-white font-bold text-[10px] rounded-lg transition-all"
                          >
                            {isEnrolled ? "Re-enroll Finger" : "Enroll Finger"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL: ADD DEVICE ─── */}
      {isDeviceModalOpen && (
        <div className="fixed inset-0 bg-primary-dark/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="font-bold text-sm text-primary flex items-center gap-2">
                <Cpu className="text-secondary" size={18} />
                Register Network Device
              </h2>
              <button onClick={() => setIsDeviceModalOpen(false)} className="text-text-light hover:text-primary">✕</button>
            </div>
            
            <form onSubmit={handleCreateDevice} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-light uppercase tracking-wider">Device Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Main Entrance Gate Scanner"
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-4 py-2.5 rounded-xl outline-none focus:bg-white focus:border-primary transition-all"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-text-light uppercase tracking-wider">IP Address *</label>
                  <input
                    type="text"
                    placeholder="e.g. 192.168.1.150"
                    className="w-full bg-slate-50 border border-slate-200 text-xs px-4 py-2.5 rounded-xl outline-none focus:bg-white focus:border-primary transition-all"
                    value={deviceIp}
                    onChange={(e) => setDeviceIp(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-light uppercase tracking-wider">Port</label>
                  <input
                    type="text"
                    placeholder="4370"
                    className="w-full bg-slate-50 border border-slate-200 text-xs px-4 py-2.5 rounded-xl outline-none focus:bg-white focus:border-primary transition-all"
                    value={devicePort}
                    onChange={(e) => setDevicePort(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-98"
              >
                Register Device
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ENROLL FINGERPRINT ─── */}
      {isEnrollModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-primary-dark/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="font-bold text-sm text-primary flex items-center gap-2">
                  <Fingerprint className="text-secondary" size={18} />
                  Biometric Enrollment
                </h2>
                <p className="text-[10px] text-text-light mt-0.5">Enrolling fingerprint for {selectedStudent.name}</p>
              </div>
              <button onClick={() => { setIsEnrollModalOpen(false); setUsbStatus("Idle"); }} className="text-text-light hover:text-primary">✕</button>
            </div>
            
            <div className="p-6 space-y-6">
              
              {/* CONNECTION TYPE SELECTOR */}
              <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setEnrollMode("network")}
                  className={`py-2 text-[10px] font-bold rounded-lg transition-all ${
                    enrollMode === "network" ? "bg-white text-primary shadow-sm" : "text-text-light hover:text-primary"
                  }`}
                >
                  📡 Online LAN Device
                </button>
                <button
                  type="button"
                  onClick={() => setEnrollMode("usb")}
                  className={`py-2 text-[10px] font-bold rounded-lg transition-all ${
                    enrollMode === "usb" ? "bg-white text-primary shadow-sm" : "text-text-light hover:text-primary"
                  }`}
                >
                  🔌 USB Desktop Scanner
                </button>
              </div>

              {/* MODE A: ONLINE NETWORK MAPPING */}
              {enrollMode === "network" && (
                <form onSubmit={handleNetworkEnroll} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-light uppercase tracking-wider">Device Machine Enroll ID *</label>
                    <input
                      type="number"
                      placeholder="e.g. 99"
                      className="w-full bg-slate-50 border border-slate-200 text-xs px-4 py-2.5 rounded-xl outline-none focus:bg-white focus:border-primary transition-all"
                      value={enrollId}
                      onChange={(e) => setEnrollId(e.target.value)}
                      required
                    />
                    <p className="text-[9px] text-text-light mt-1">
                      Enter the unique User ID mapping number registered for this student on your physical wall machine.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-98"
                  >
                    Save Mapping
                  </button>
                </form>
              )}

              {/* MODE B: USB SCANNER CAPTURE */}
              {enrollMode === "usb" && (
                <div className="space-y-6 text-center py-4">
                  <div className="flex justify-center">
                    <div className={`p-5 rounded-full border-2 ${
                      usbStatus === "Scanning" ? "border-primary animate-pulse bg-primary/5" :
                      usbStatus === "Success" ? "border-success bg-success/5 text-success" :
                      usbStatus === "Error" ? "border-danger bg-danger/5 text-danger" : "border-slate-200 text-slate-400"
                    }`}>
                      <Fingerprint size={48} className={usbStatus === "Scanning" ? "text-primary animate-bounce" : ""} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-primary">
                      {usbStatus === "Idle" && "Mantra/Morpho scanner detected"}
                      {usbStatus === "Scanning" && "Scanning... Please place finger on device"}
                      {usbStatus === "Success" && "Template Captured Successfully"}
                      {usbStatus === "Error" && "Capture failed. Try again"}
                    </h4>
                    <p className="text-[10px] text-text-light px-6">
                      Requires Mantra RD service running locally on port 11100.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleUsbCaptureSimulate}
                    disabled={usbStatus === "Scanning"}
                    className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    {usbStatus === "Scanning" ? "Enrolling..." : "Scan Fingerprint"}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Hardware Connection Modal */}
      <HardwareConnectModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
        deviceType="biometric"
        onConnected={(devId) => {
          toast.success(`Biometric hardware device paired: ${devId}`);
          setIsHardwareModalOpen(false);
          loadDevices();
        }}
      />
    </div>
  );
}
