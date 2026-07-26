import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Bus, MapPin, Clock, Activity, CalendarX, X, CheckCircle, AlertCircle, PhoneCall, Navigation, ShieldCheck } from "lucide-react";
import { busesApi } from "../../services/api";

// ─── Leave Modal ───────────────────────────────────────────────────────────────
function LeaveModal({ studentName, busId, studentId, onClose, onConfirm, isLoading }) {
  const [reason, setReason] = useState("");
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 440,
        boxShadow: "0 25px 60px -10px rgba(0,0,0,0.25)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 28, marginBottom: 4 }}>🚌</div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "#1E293B" }}>Mark Bus Leave</h3>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#64748B" }}>Notify driver that your child will not board today</p>
          </div>
          <button onClick={onClose} style={{ background: "#F1F5F9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} color="#64748B" />
          </button>
        </div>

        <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 12, padding: "12px 14px", marginBottom: 18, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <AlertCircle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 13, color: "#92400E", lineHeight: 1.5 }}>
            <strong>{studentName}</strong> will be marked absent on <strong>{today}</strong>. The driver will skip your pickup stop.
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>
            Reason <span style={{ fontWeight: 400, color: "#94A3B8" }}>(optional)</span>
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Sick, Family function, Doctor appointment..."
            rows={3}
            style={{
              width: "100%", borderRadius: 10, border: "1.5px solid #CBD5E1", padding: "10px 12px",
              fontSize: 13.5, color: "#1E293B", resize: "none", outline: "none", boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "11px", background: "#F1F5F9", border: "none", borderRadius: 10,
              fontSize: 13.5, fontWeight: 700, color: "#475569", cursor: "pointer"
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={isLoading}
            style={{
              flex: 2, padding: "11px", background: isLoading ? "#94A3B8" : "#EF4444", border: "none",
              borderRadius: 10, fontSize: 13.5, fontWeight: 800, color: "#fff",
              cursor: isLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
            }}
          >
            <CalendarX size={15} />
            {isLoading ? "Marking..." : "Confirm Bus Leave"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ParentLiveBus() {
  const { studentId } = useParams();

  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [routeStops, setRouteStops] = useState([]);
  const [roadWaypoints, setRoadWaypoints] = useState([]);
  const [routeInfo, setRouteInfo] = useState({ distanceKm: 0, durationMin: 0 });

  // Leave state
  const [leaveInfo, setLeaveInfo] = useState({ isOnLeaveToday: false, todayLeaveId: null, studentName: "" });
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);

  // Map refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const busMarkerRef = useRef(null);
  const stopMarkersRef = useRef([]);
  const polylineRef = useRef(null);

  // ── 1. Leaflet loader ───────────────────────────────────────────────────────
  const loadLeaflet = () =>
    new Promise((resolve) => {
      if (window.L) return resolve(window.L);
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => resolve(window.L);
      document.head.appendChild(script);
    });

  // ── 2. OSRM Road Polyline Routing ──────────────────────────────────────────
  const fetchOSRMRoute = async (stops) => {
    const validStops = stops.filter(s => s.latitude && s.longitude);
    if (validStops.length < 2) return [];
    try {
      const waypoints = validStops.map(s => `${s.longitude},${s.latitude}`).join(";");
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson`);
      const data = await res.json();
      if (data.code === "Ok" && data.routes && data.routes[0]) {
        const route = data.routes[0];
        const rawCoords = route.geometry.coordinates;
        const roadLatLngs = rawCoords.map(c => [c[1], c[0]]);
        const distKm = (route.distance / 1000).toFixed(1);
        const durMin = Math.max(1, Math.round(route.duration / 60));
        setRouteInfo({ distanceKm: distKm, durationMin: durMin });
        setRoadWaypoints(roadLatLngs);
        return roadLatLngs;
      }
    } catch (err) {
      console.warn("OSRM routing failed, falling back to direct lines:", err);
    }
    const fallbackLines = validStops.map(s => [parseFloat(s.latitude), parseFloat(s.longitude)]);
    setRoadWaypoints(fallbackLines);
    return fallbackLines;
  };

  // ── 3. Fetch Route Stops ───────────────────────────────────────────────────
  const fetchRouteStops = useCallback(async (busId) => {
    try {
      const stops = await busesApi.getStops(busId);
      let sorted = Array.isArray(stops) ? [...stops].sort((a, b) => a.stopOrder - b.stopOrder) : [];
      setRouteStops(sorted);
      await fetchOSRMRoute(sorted);
    } catch {
      setRouteStops([]);
      await fetchOSRMRoute([]);
    }
  }, []);

  // ── 4. Fetch Leave Status ──────────────────────────────────────────────────
  const fetchLeaveStatus = useCallback(async () => {
    try {
      const data = await busesApi.getStudentLeaves(studentId);
      setLeaveInfo({
        isOnLeaveToday: data.isOnLeaveToday || false,
        todayLeaveId: data.todayLeaveId || null,
        studentName: data.data?.[0]?.studentName || ""
      });
    } catch {
      /* silent */
    }
  }, [studentId]);

  // ── 5. Fetch Live Telemetry Data ──────────────────────────────────────────
  const fetchLiveBus = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await busesApi.getLive();
      const busData = res.data;
      if (busData) {
        setBus(busData);
        if (routeStops.length === 0 && busData.id) {
          fetchRouteStops(busData.id);
        }
      }
    } catch (err) {
      console.warn("Could not load live bus telemetry:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [routeStops.length, fetchRouteStops]);

  // ── 6. Map Initialization & Polyline/Marker Render ─────────────────────────
  useEffect(() => {
    const initMap = async () => {
      const L = await loadLeaflet();
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([28.6139, 77.2090], 14);

      mapInstanceRef.current = map;

      // Google Roadmap Layer
      L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
        maxZoom: 20, subdomains: ["mt0", "mt1", "mt2", "mt3"]
      }).addTo(map);

      setTimeout(() => { map.invalidateSize(); }, 300);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // ── Update Map Elements (Polyline, Stops, Live Bus Pin) ────────────────────
  useEffect(() => {
    if (!window.L || !mapInstanceRef.current) return;
    const L = window.L;

    // Render Road Polyline
    if (polylineRef.current) {
      mapInstanceRef.current.removeLayer(polylineRef.current);
    }
    if (roadWaypoints.length > 1) {
      polylineRef.current = L.polyline(roadWaypoints, {
        color: "#0284C7",
        weight: 5,
        opacity: 0.85,
        dashArray: "8, 6"
      }).addTo(mapInstanceRef.current);
    }

    // Render Stop Markers
    stopMarkersRef.current.forEach(m => mapInstanceRef.current.removeLayer(m));
    stopMarkersRef.current = [];

    routeStops.forEach((stop, idx) => {
      if (!stop.latitude || !stop.longitude) return;
      const isSchool = idx === routeStops.length - 1;
      const isChildPickup = stop.stopName.toLowerCase().includes("pickup") || idx === 1;

      const stopBg = isSchool ? "#10B981" : (isChildPickup ? "#EF4444" : "#0284C7");
      const iconHtml = `<div style="
        width: 32px; height: 32px; background: ${stopBg}; border: 2.5px solid #fff;
        border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        color: #fff; font-weight: 900; font-size: 13px;
        display: flex; align-items: center; justify-content: center;">
        ${isSchool ? "🏫" : idx + 1}
      </div>`;

      const icon = L.divIcon({ html: iconHtml, className: "parent-stop-icon", iconSize: [32, 32], iconAnchor: [16, 16] });
      
      const tooltipText = isChildPickup 
        ? `⭐ <strong>${stop.stopName}</strong><br/><span style="color:#DC2626;font-weight:700">Child Pickup Spot</span>`
        : `<strong>${stop.stopName}</strong>`;

      const marker = L.marker([parseFloat(stop.latitude), parseFloat(stop.longitude)], { icon })
        .addTo(mapInstanceRef.current)
        .bindTooltip(tooltipText, { permanent: isChildPickup, direction: "top" });

      stopMarkersRef.current.push(marker);
    });

    // Render Live Bus Marker
    const curLat = parseFloat(bus?.latitude) || (roadWaypoints[0] ? roadWaypoints[0][0] : 28.6139);
    const curLng = parseFloat(bus?.longitude) || (roadWaypoints[0] ? roadWaypoints[0][1] : 77.2090);

    const busIconHtml = `<div style="
      width: 44px; height: 44px; background: linear-gradient(135deg, #0284C7, #1E40AF);
      border: 3px solid #fff; border-radius: 50%; box-shadow: 0 6px 18px rgba(2,132,199,0.5);
      display: flex; align-items: center; justify-content: center; font-size: 22px; color: #fff;">
      🚌
    </div>`;
    const busIcon = L.divIcon({ html: busIconHtml, className: "parent-live-bus-pin", iconSize: [44, 44], iconAnchor: [22, 22] });

    if (busMarkerRef.current) {
      busMarkerRef.current.setLatLng([curLat, curLng]);
      busMarkerRef.current.setIcon(busIcon);
    } else {
      busMarkerRef.current = L.marker([curLat, curLng], { icon: busIcon, zIndexOffset: 2000 })
        .addTo(mapInstanceRef.current)
        .bindTooltip(`<strong>Bus #${bus?.busNumber || '102'}</strong> · Live`, { permanent: true, direction: "top" });
    }

    if (roadWaypoints.length > 0) {
      try {
        const bounds = L.latLngBounds(roadWaypoints);
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
      } catch {}
    }
  }, [roadWaypoints, routeStops, bus]);

  // ── Poll for live location & leave status ──────────────────────────────────
  useEffect(() => {
    fetchLiveBus();
    fetchLeaveStatus();
    const interval = setInterval(() => fetchLiveBus(true), 4000);
    return () => clearInterval(interval);
  }, [fetchLiveBus, fetchLeaveStatus]);

  // ── Leave Actions ──────────────────────────────────────────────────────────
  const handleConfirmLeave = async (reason) => {
    setLeaveLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      await busesApi.markLeave({
        studentId,
        studentName: leaveInfo.studentName || "Student",
        busId: bus?.id || "demo-bus",
        leaveDate: today,
        reason: reason || null
      });
      toast.success("Bus leave marked! Driver has been notified.");
      setShowLeaveModal(false);
      await fetchLeaveStatus();
    } catch (err) {
      toast.error(err?.message || "Failed to mark leave");
    } finally {
      setLeaveLoading(false);
    }
  };

  const handleCancelLeave = async () => {
    if (!leaveInfo.todayLeaveId) return;
    setLeaveLoading(true);
    try {
      await busesApi.cancelLeave(leaveInfo.todayLeaveId);
      toast.success("Leave cancelled. Driver notified.");
      await fetchLeaveStatus();
    } catch {
      toast.error("Failed to cancel leave.");
    } finally {
      setLeaveLoading(false);
    }
  };

  const isBusActive = bus?.isTripActive;
  const busSpeed = isBusActive ? (bus?.speed || "28") : "0";

  return (
    <>
      {/* Leave Modal */}
      {showLeaveModal && (
        <LeaveModal
          studentName={leaveInfo.studentName || "your child"}
          busId={bus?.id}
          studentId={studentId}
          onClose={() => setShowLeaveModal(false)}
          onConfirm={handleConfirmLeave}
          isLoading={leaveLoading}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16, pb: 20 }}>

        {/* Top Header Bar */}
        <div style={{ background: "#fff", border: "1px solid #BAE6FD", borderRadius: 16, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, boxShadow: "0 4px 15px -3px rgba(0,0,0,0.03)" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ background: "#E0F2FE", color: "#0284C7", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>
                PARENT ROUTE TELEMETRY
              </span>
              <span style={{
                fontSize: 11.5, fontWeight: 800, padding: "4px 10px", borderRadius: 20,
                background: isBusActive ? "#DCFCE7" : "#FEE2E2",
                color: isBusActive ? "#15803D" : "#DC2626"
              }}>
                {isBusActive ? "🟢 En Route (Live GPS)" : "🔴 Bus Offline"}
              </span>
            </div>
            <h2 style={{ margin: "6px 0 2px", fontSize: 22, fontWeight: 900, color: "#0F172A" }}>
              Live Bus Tracking · Bus #{bus?.busNumber || "102"}
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>
              Vehicle Plate: <strong>{bus?.vehicleNumber || "DL-1CA-1234"}</strong> · Driver: <strong>{bus?.driverName || "Ramesh Kumar"}</strong>
            </p>
          </div>

          {/* Action Button: Mark Leave */}
          <div>
            {leaveInfo.isOnLeaveToday ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ background: "#DCFCE7", color: "#15803D", padding: "8px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle size={16} /> Child Marked Absent Today
                </div>
                <button
                  onClick={handleCancelLeave}
                  disabled={leaveLoading}
                  style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", color: "#475569", padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel Leave
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLeaveModal(true)}
                style={{
                  background: "linear-gradient(135deg, #EF4444, #DC2626)", color: "#fff", border: "none",
                  borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 800, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(220,38,38,0.25)"
                }}
              >
                <CalendarX size={16} /> Mark Bus Leave Today
              </button>
            )}
          </div>
        </div>

        {/* Main Grid: Left Map + Right Professional Transit Timeline */}
        <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: 20, minHeight: 520 }}>

          {/* Left Column: Interactive Map Container */}
          <div style={{ background: "#fff", border: "1px solid #BAE6FD", borderRadius: 18, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.04)" }}>
            <div ref={mapContainerRef} style={{ width: "100%", flex: 1, minHeight: 480 }} />

            {/* Floating Live Telemetry Bar */}
            <div style={{
              position: "absolute", bottom: 16, left: 16, right: 16, zIndex: 500,
              background: "rgba(15,23,42,0.9)", backdropFilter: "blur(8px)", color: "#fff",
              borderRadius: 14, padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(2,132,199,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Navigation size={18} color="#38BDF8" />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase" }}>Route Progress</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#F8FAFC" }}>{routeInfo.distanceKm} km · Turn-by-Turn Road Polylines</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase" }}>Live Speed</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: "#34D399" }}>{busSpeed} km/h</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase" }}>Estimated Total Trip</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: "#FBBF24" }}>~{routeInfo.durationMin} Mins</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Executive Transit Timeline & Driver Roster Card */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Driver Contact & Bus Details Card */}
            <div style={{ background: "#fff", border: "1px solid #BAE6FD", borderRadius: 16, padding: 18, boxShadow: "0 4px 15px -3px rgba(0,0,0,0.03)" }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
                Assigned Bus & Driver Info
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "#EFF6FF", border: "1px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                    👨‍✈️
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#0F172A" }}>{bus?.driverName || "Ramesh Kumar"}</h4>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748B" }}>Driver · Bus #{bus?.busNumber || "102"}</p>
                  </div>
                </div>
                <a
                  href={`tel:${bus?.driverPhone || '9876543210'}`}
                  style={{
                    padding: "8px 12px", background: "#0284C7", color: "#fff", borderRadius: 8,
                    fontSize: 12, fontWeight: 800, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6
                  }}
                >
                  <PhoneCall size={14} /> Call Driver
                </a>
              </div>
            </div>

            {/* Vertical Transit Route Timeline */}
            <div style={{ background: "#fff", border: "1px solid #BAE6FD", borderRadius: 16, padding: 20, flex: 1, display: "flex", flexDirection: "column", boxShadow: "0 4px 15px -3px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Route Timeline & Stops
                </h3>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#0284C7", background: "#EFF6FF", padding: "3px 8px", borderRadius: 6 }}>
                  {routeStops.length} Total Stops
                </span>
              </div>

              {/* Vertical Route List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative", flex: 1 }}>
                
                {/* Connecting Vertical Line */}
                <div style={{ position: "absolute", top: 16, bottom: 16, left: 15, width: 3, background: "#E2E8F0", zIndex: 1 }} />

                {routeStops.map((stop, idx) => {
                  const isSchool = idx === routeStops.length - 1;
                  const isChildPickup = stop.stopName.toLowerCase().includes("pickup") || idx === 1;

                  return (
                    <div key={stop.id || idx} style={{ display: "flex", gap: 14, position: "relative", zIndex: 2, paddingBottom: idx === routeStops.length - 1 ? 0 : 20 }}>
                      
                      {/* Timeline Node Icon */}
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: isSchool ? "#10B981" : (isChildPickup ? "#EF4444" : "#0284C7"),
                        color: "#fff", fontWeight: 900, fontSize: 12,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        boxShadow: isChildPickup ? "0 0 0 4px rgba(239, 68, 68, 0.2)" : "none"
                      }}>
                        {isSchool ? "🏫" : idx + 1}
                      </div>

                      {/* Stop Info Details */}
                      <div style={{
                        flex: 1, background: isChildPickup ? "#FEF2F2" : "#F8FAFC",
                        border: isChildPickup ? "1.5px solid #FCA5A5" : "1px solid #E2E8F0",
                        borderRadius: 12, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center"
                      }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 900, color: isChildPickup ? "#991B1B" : "#0F172A" }}>
                            {stop.stopName}
                          </div>
                          {isChildPickup && (
                            <span style={{ fontSize: 10.5, fontWeight: 800, color: "#DC2626", background: "#FEE2E2", padding: "2px 6px", borderRadius: 4, marginTop: 4, display: "inline-block" }}>
                              ⭐ Your Child's Pickup Spot
                            </span>
                          )}
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#64748B", display: "block" }}>
                            {stop.estimatedMinutes > 0 ? `~${stop.estimatedMinutes} min` : "Arrival"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>

        </div>

      </div>
    </>
  );
}
