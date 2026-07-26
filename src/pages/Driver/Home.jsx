import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Play, Square, LogOut, Compass, MapPin, AlertTriangle, Users, BellOff, RefreshCw } from "lucide-react";
import { busesApi } from "../../services/api";

// Default fallback coords (Delhi) — used only when DB has no stops yet
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

export default function DriverHome() {
  const { driverId } = useParams();
  const navigate = useNavigate();

  const [driver, setDriver]           = useState(null);
  const [bus, setBus]                 = useState(null);
  const [isTripActive, setIsTripActive] = useState(false);
  const [tripStatus, setTripStatus]   = useState("Offline");
  const [loading, setLoading]         = useState(true);
  const [coords, setCoords]           = useState(DEFAULT_CENTER);
  const [logs, setLogs]               = useState([]);
  const [isLocationAllowed, setIsLocationAllowed] = useState(null);

  // ── NEW: DB-driven state ──────────────────────────────────────
  const [routeStops, setRouteStops]   = useState([]);   // from /buses/{id}/stops
  const [allStudents, setAllStudents] = useState([]);   // students on this bus
  const [absentToday, setAbsentToday] = useState([]);   // studentIds absent today
  const [stopsLoaded, setStopsLoaded] = useState(false);
  const [roadWaypoints, setRoadWaypoints] = useState([]);
  const [routeInfo, setRouteInfo] = useState({ distanceKm: 0, durationMin: 0 });
  const [currentStopIndex, setCurrentStopIndex] = useState(0);

  const watchIdRef      = useRef(null);
  const intervalRef     = useRef(null);
  const leaveIntervalRef= useRef(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef  = useRef(null);
  const markerRef       = useRef(null);
  const polylineRef     = useRef(null);
  const stopMarkersRef  = useRef([]);
  const routeStepRef    = useRef(0);
  const stopsRef        = useRef([]);   // always-fresh ref for simulated GPS
  const roadWaypointsRef= useRef([]);

  const fetchOSRMRoute = async (stops) => {
    const validStops = stops.filter(s => s.latitude && s.longitude);
    if (validStops.length < 2) return [];
    try {
      const waypoints = validStops.map(s => `${s.longitude},${s.latitude}`).join(";");
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson`);
      const data = await res.json();
      if (data.code === "Ok" && data.routes && data.routes[0]) {
        const route = data.routes[0];
        const rawCoords = route.geometry.coordinates; // [[lng, lat], ...]
        const roadLatLngs = rawCoords.map(c => [c[1], c[0]]); // [[lat, lng], ...]
        const distKm = (route.distance / 1000).toFixed(1);
        const durMin = Math.max(1, Math.round(route.duration / 60));
        setRouteInfo({ distanceKm: distKm, durationMin: durMin });
        setRoadWaypoints(roadLatLngs);
        roadWaypointsRef.current = roadLatLngs;
        return roadLatLngs;
      }
    } catch (err) {
      console.warn("OSRM routing failed, using direct lines:", err);
    }
    const fallbackLines = validStops.map(s => [parseFloat(s.latitude), parseFloat(s.longitude)]);
    setRoadWaypoints(fallbackLines);
    roadWaypointsRef.current = fallbackLines;
    return fallbackLines;
  };

  // ── Leaflet loader ──────────────────────────────────────────
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

  // ── Fetch today's absent students for this bus ──────────────
  const fetchAbsentList = useCallback(async (busId) => {
    try {
      const data = await busesApi.getTodayLeaves();
      const ids = (data.data || [])
        .filter(l => l.busId === busId)
        .map(l => l.studentId);
      setAbsentToday(ids);
    } catch {
      // silent — absent list is additive feature
    }
  }, []);

  // ── Fetch route stops from DB ───────────────────────────────
  const fetchStops = useCallback(async (busId) => {
    try {
      const stops = await busesApi.getStops(busId);
      const sorted = Array.isArray(stops)
        ? [...stops].sort((a, b) => a.stopOrder - b.stopOrder)
        : [];
      if (sorted.length === 0) {
        const fallbackStops = [
          { id: "stop-1", stopName: "Preet Vihar Crossing", stopOrder: 1, latitude: "28.6318", longitude: "77.2901", estimatedMinutes: 10 },
          { id: "stop-2", stopName: "Laxmi Nagar Metro Station", stopOrder: 2, latitude: "28.6304", longitude: "77.2777", estimatedMinutes: 15 },
          { id: "stop-3", stopName: "Nirman Vihar Hub", stopOrder: 3, latitude: "28.6358", longitude: "77.2831", estimatedMinutes: 20 },
          { id: "stop-4", stopName: "Akshardham Mandir Gate", stopOrder: 4, latitude: "28.6127", longitude: "77.2773", estimatedMinutes: 25 },
          { id: "stop-5", stopName: "Sunrise Academy (School)", stopOrder: 5, latitude: "28.6139", longitude: "77.2090", estimatedMinutes: 0 }
        ];
        setRouteStops(fallbackStops);
        stopsRef.current = fallbackStops;
        setStopsLoaded(true);
        return fallbackStops;
      }
      setRouteStops(sorted);
      stopsRef.current = sorted;
      setStopsLoaded(true);
      return sorted;
    } catch {
      const fallbackStops = [
        { id: "stop-1", stopName: "Preet Vihar Crossing", stopOrder: 1, latitude: "28.6318", longitude: "77.2901", estimatedMinutes: 10 },
        { id: "stop-2", stopName: "Laxmi Nagar Metro Station", stopOrder: 2, latitude: "28.6304", longitude: "77.2777", estimatedMinutes: 15 },
        { id: "stop-3", stopName: "Nirman Vihar Hub", stopOrder: 3, latitude: "28.6358", longitude: "77.2831", estimatedMinutes: 20 },
        { id: "stop-4", stopName: "Akshardham Mandir Gate", stopOrder: 4, latitude: "28.6127", longitude: "77.2773", estimatedMinutes: 25 },
        { id: "stop-5", stopName: "Sunrise Academy (School)", stopOrder: 5, latitude: "28.6139", longitude: "77.2090", estimatedMinutes: 0 }
      ];
      setRouteStops(fallbackStops);
      stopsRef.current = fallbackStops;
      setStopsLoaded(true);
      return fallbackStops;
    }
  }, []);

  // ── Load driver + bus details ───────────────────────────────
  const loadDriverDetails = useCallback(async () => {
    try {
      const stored = localStorage.getItem("sms_user");
      const user = stored ? JSON.parse(stored) : null;
      if (!user || !["driver", "admin", "school_admin"].includes(user.role)) {
        toast.error("Unauthorized role access");
        navigate("/login");
        return;
      }
      setDriver(user);

      const buses = await busesApi.getAll();
      const busList = Array.isArray(buses) ? buses : (buses.data || []);
      let assignedBus = busList.find(b => b.driverId === user.id) || busList[0];

      if (assignedBus) {
        setBus(assignedBus);
        setIsTripActive(assignedBus.isTripActive);
        setTripStatus(assignedBus.isTripActive ? assignedBus.tripStatus : "Offline");

        // Fetch students + stops + today's absents in parallel
        const [studs, stops] = await Promise.all([
          busesApi.getStudents().catch(() => []),
          fetchStops(assignedBus.id),
          fetchAbsentList(assignedBus.id)
        ]);
        const filtered = (studs || []).filter(s => s.busId === assignedBus.id);
        if (filtered.length === 0) {
          const fallbackStudents = [
            { id: "stud-demo-1", name: "Rahul Sharma", busId: assignedBus.id, className: "9th A" },
            { id: "stud-demo-2", name: "Priya Patel", busId: assignedBus.id, className: "10th B" },
            { id: "stud-demo-3", name: "Arjun Verma", busId: assignedBus.id, className: "8th C" },
            { id: "stud-demo-4", name: "Sanya Malhotra", busId: assignedBus.id, className: "11th A" },
            { id: "stud-demo-5", name: "Kabir Mehta", busId: assignedBus.id, className: "9th B" },
            { id: "stud-demo-6", name: "Ananya Sen", busId: assignedBus.id, className: "12th A" }
          ];
          setAllStudents(fallbackStudents);
        } else {
          setAllStudents(filtered);
        }

        // If stops exist use first stop as start coords, else fallback
        if (stops.length > 0 && stops[0].latitude && stops[0].longitude) {
          setCoords({ lat: parseFloat(stops[0].latitude), lng: parseFloat(stops[0].longitude) });
        }
      }
    } catch (err) {
      toast.error("Failed to load driver details");
    } finally {
      setLoading(false);
    }
  }, [navigate, fetchStops, fetchAbsentList]);

  // ── GPS permission check ────────────────────────────────────
  const checkLocationPermissions = useCallback(() => {
    if (!navigator.geolocation) { setIsLocationAllowed(false); return; }
    addLog("Requesting GPS permission...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocationAllowed(true);
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        addLog(`GPS online. [${latitude.toFixed(5)}, ${longitude.toFixed(5)}]`);
        updateMapMarker(latitude, longitude);
      },
      () => {
        setIsLocationAllowed(false);
        addLog("GPS denied. Running in simulated route mode.");
      }
    );
  }, []);

  // ── Map init ────────────────────────────────────────────────
  const initDriverMap = async (lat, lng) => {
    const L = await loadLeaflet();
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    mapInstanceRef.current = L.map(mapContainerRef.current, {
      zoomControl: true, attributionControl: false
    }).setView([lat, lng], 14);
    L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
      maxZoom: 20, subdomains: ["mt0", "mt1", "mt2", "mt3"]
    }).addTo(mapInstanceRef.current);

    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);
  };

  // ── Draw route polyline + stop markers from DB stops ────────
  const drawRouteOnMap = useCallback(async (stops, absentIds = []) => {
    if (!window.L || !mapInstanceRef.current || stops.length === 0) return;
    const L = window.L;

    // Remove old polyline + stop markers
    if (polylineRef.current) { polylineRef.current.remove(); polylineRef.current = null; }
    stopMarkersRef.current.forEach(m => m.remove());
    stopMarkersRef.current = [];

    const validStops = stops.filter(s => s.latitude && s.longitude);
    if (validStops.length < 2) return;

    // Fetch actual driving road geometry from OSRM
    const roadLatLngs = await fetchOSRMRoute(validStops);

    polylineRef.current = L.polyline(roadLatLngs, {
      color: "#2563EB", weight: 6, opacity: 0.9, lineCap: "round", lineJoin: "round"
    }).addTo(mapInstanceRef.current);

    validStops.forEach((stop, idx) => {
      const isSchool = idx === validStops.length - 1;

      // Find students at this stop (assigned by stopOrder match)
      const studentsAtStop = allStudents.filter((_, si) =>
        Math.floor(si / Math.max(1, Math.ceil(allStudents.length / Math.max(1, validStops.length - 1)))) === idx
      );
      const allAbsent = studentsAtStop.length > 0 &&
        studentsAtStop.every(s => absentIds.includes(s.id));

      const borderColor = isSchool ? "#DC2626" : allAbsent ? "#94A3B8" : "#7C3AED";
      const emoji       = isSchool ? "🏫" : allAbsent ? "✓" : "🧒";

      const html = `<div style="
        background:#fff; border:3px solid ${borderColor}; border-radius:50%;
        width:${isSchool ? 36 : 32}px; height:${isSchool ? 36 : 32}px;
        display:flex; align-items:center; justify-content:center;
        box-shadow:0 4px 12px rgba(0,0,0,0.2); font-size:${isSchool ? 18 : 15}px;
        opacity:${allAbsent && !isSchool ? 0.55 : 1};
      ">${emoji}</div>`;

      const icon = L.divIcon({
        html, className: "route-stop-icon",
        iconSize: [isSchool ? 36 : 32, isSchool ? 36 : 32],
        iconAnchor: [isSchool ? 18 : 16, isSchool ? 18 : 16]
      });

      const absentNames = studentsAtStop
        .filter(s => absentIds.includes(s.id))
        .map(s => s.name).join(", ");
      const presentNames = studentsAtStop
        .filter(s => !absentIds.includes(s.id))
        .map(s => s.name).join(", ");

      let tip = "";
      if (!isSchool) {
        const studentHeading = presentNames || "Student Pickup";
        if (allAbsent) {
          tip = `<div style="text-align:center;">
            <strong style="font-size:12.5px; color:#EF4444;">${studentHeading} (Absent)</strong><br/>
            <span style="font-size:10.5px; color:#64748B;">📍 ${stop.stopName}</span>
          </div>`;
        } else {
          tip = `<div style="text-align:center;">
            <strong style="font-size:13px; color:#0F172A;">${studentHeading}</strong><br/>
            <span style="font-size:10.5px; color:#64748B;">📍 ${stop.stopName}</span>
          </div>`;
        }
      } else {
        tip = `<div style="text-align:center;">
          <strong style="font-size:13px; color:#DC2626;">Sunrise Academy School</strong><br/>
          <span style="font-size:10.5px; color:#64748B;">🏫 Destination: Drop-off Point</span>
        </div>`;
      }

      const marker = L.marker(
        [parseFloat(stop.latitude), parseFloat(stop.longitude)],
        { icon }
      ).addTo(mapInstanceRef.current).bindTooltip(tip, { permanent: true, direction: "top" });

      stopMarkersRef.current.push(marker);
    });

    // Automatically place initial Bus marker at first road waypoint if not placed yet
    if (roadLatLngs.length > 0) {
      updateMapMarker(roadLatLngs[0][0], roadLatLngs[0][1]);
    }

    try {
      const bounds = L.latLngBounds(roadLatLngs);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      mapInstanceRef.current.invalidateSize();
    } catch { /* silent */ }
  }, [allStudents]);

  // ── Bus marker ──────────────────────────────────────────────
  const updateMapMarker = (lat, lng) => {
    if (!window.L || !mapInstanceRef.current) return;
    const L = window.L;
    const iconHtml = `<div style="
      width:48px;height:48px;background:linear-gradient(135deg, #0284C7, #2563EB);border:3.5px solid #fff;
      border-radius:50%;box-shadow:0 6px 20px rgba(37,99,235,0.6);
      display:flex;align-items:center;justify-content:center;font-size:25px;">🚌</div>`;
    const icon = L.divIcon({ html: iconHtml, className: "driver-bus-icon", iconSize: [48, 48], iconAnchor: [24, 24] });
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setIcon(icon);
    } else {
      markerRef.current = L.marker([lat, lng], { icon, zIndexOffset: 3000 }).addTo(mapInstanceRef.current).bindTooltip("<strong>🚌 School Bus (Live GPS)</strong>", { permanent: true, direction: "top" });
    }
  };

  // ── Trip controls ───────────────────────────────────────────
  const handleStartTrip = async () => {
    try {
      await busesApi.startTrip();
      setIsTripActive(true); setTripStatus("Moving");
      addLog("Trip started. GPS tracking active.");
      toast.success("Trip started!");
      startGpsTracking();
    } catch (err) { toast.error("Error starting trip: " + err.message); }
  };

  const handleEndTrip = async () => {
    try {
      await busesApi.endTrip();
      setIsTripActive(false); setTripStatus("Offline");
      addLog("Trip ended. GPS stopped.");
      toast.success("Trip ended!");
      stopGpsTracking();
    } catch (err) { toast.error("Error ending trip: " + err.message); }
  };

  // ── GPS tracking ────────────────────────────────────────────
  const startGpsTracking = () => {
    if (!navigator.geolocation || isLocationAllowed === false) {
      addLog("Simulated route mode active...");
      startSimulatedGps(); return;
    }
    addLog("Hardware GPS tracking started...");
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => updateLocationOnServer(pos.coords.latitude, pos.coords.longitude, pos.coords.speed || 0),
      () => { addLog("GPS error. Falling back to simulation."); startSimulatedGps(); },
      { enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  const startSimulatedGps = () => {
    routeStepRef.current = 0;
    intervalRef.current = setInterval(() => {
      const pts = roadWaypointsRef.current.length > 0
        ? roadWaypointsRef.current
        : stopsRef.current.map(s => [parseFloat(s.latitude), parseFloat(s.longitude)]);

      if (pts.length > 0) {
        const step = routeStepRef.current % pts.length;
        const pt = pts[step];
        const speed = Math.floor(30 + Math.random() * 15);
        addLog(`🚌 Bus navigating road... (${speed} km/h)`);
        updateLocationOnServer(pt[0], pt[1], speed);
      }
      routeStepRef.current += 1;
    }, 1500);
  };

  const stopGpsTracking = () => {
    if (watchIdRef.current) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  const updateLocationOnServer = async (latitude, longitude, speed) => {
    setCoords({ lat: latitude, lng: longitude });
    updateMapMarker(latitude, longitude);

    if (stopsRef.current.length > 0) {
      let minDist = Infinity;
      let nearestIdx = 0;
      stopsRef.current.forEach((st, idx) => {
        if (st.latitude && st.longitude) {
          const d = Math.hypot(parseFloat(st.latitude) - latitude, parseFloat(st.longitude) - longitude);
          if (d < minDist) {
            minDist = d;
            nearestIdx = idx;
          }
        }
      });
      setCurrentStopIndex(nearestIdx);
    }

    try {
      const data = await busesApi.updateLocation(latitude, longitude, speed);
      if (data?.data) {
        setTripStatus(data.data.tripStatus);
        addLog(`GPS: [${latitude.toFixed(5)}, ${longitude.toFixed(5)}] ${speed} km/h`);
      }
    } catch { /* silent */ }
  };

  const addLog = (msg) => {
    const t = new Date().toLocaleTimeString();
    setLogs(prev => [`[${t}] ${msg}`, ...prev.slice(0, 19)]);
  };

  const handleLogout = () => {
    stopGpsTracking();
    if (leaveIntervalRef.current) clearInterval(leaveIntervalRef.current);
    localStorage.removeItem("sms_user");
    localStorage.removeItem("sms_token");
    localStorage.removeItem("sms_demo_mode");
    toast.success("Logged out");
    navigate("/login");
  };

  // ── Effects ─────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      await loadDriverDetails();
      checkLocationPermissions();
    };
    init();
    return () => {
      stopGpsTracking();
      if (leaveIntervalRef.current) clearInterval(leaveIntervalRef.current);
    };
  }, [driverId]);

  // Init Leaflet map once loading is complete and DOM element is mounted
  useEffect(() => {
    if (!loading && mapContainerRef.current && !mapInstanceRef.current) {
      initDriverMap(coords.lat || DEFAULT_CENTER.lat, coords.lng || DEFAULT_CENTER.lng);
    }
  }, [loading, coords]);

  // Redraw route when stops or absent list changes
  useEffect(() => {
    if (stopsLoaded && routeStops.length > 0) {
      drawRouteOnMap(routeStops, absentToday);
    }
  }, [stopsLoaded, routeStops, absentToday, drawRouteOnMap]);

  // Poll absent list every 30s so driver gets live updates when parents mark leave
  useEffect(() => {
    if (!bus) return;
    leaveIntervalRef.current = setInterval(() => fetchAbsentList(bus.id), 30000);
    return () => clearInterval(leaveIntervalRef.current);
  }, [bus, fetchAbsentList]);

  // ── Derived values ───────────────────────────────────────────
  // For each stop, compute: list of students + how many absent
  const stopsWithStudents = routeStops
    .filter(s => !isLastStop(s, routeStops))
    .map((stop, idx) => {
      const chunkSize = Math.max(1, Math.ceil(allStudents.length / Math.max(1, routeStops.length - 1)));
      const studentsAtStop = allStudents.slice(idx * chunkSize, idx * chunkSize + chunkSize);
      const absentCount = studentsAtStop.filter(s => absentToday.includes(s.id)).length;
      return { stop, studentsAtStop, absentCount, allAbsent: studentsAtStop.length > 0 && absentCount === studentsAtStop.length };
    });

  function isLastStop(stop, stops) {
    return stop.stopOrder === Math.max(...stops.map(s => s.stopOrder));
  }

  // ── Loading ──────────────────────────────────────────────────
  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", color: "#64748B" }}>Loading Driver Portal...</div>
  );

  if (!bus) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F1F5F9", padding: 20 }}>
      <div style={{ background: "#fff", padding: 32, borderRadius: 16, border: "1px solid #E2E8F0", textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🚌</div>
        <h2 style={{ fontSize: 18, color: "#1E293B", fontWeight: 800 }}>No Bus Assigned</h2>
        <p style={{ fontSize: 13.5, color: "#64748B", marginTop: 8 }}>
          Hello <strong>{driver?.name}</strong>. Your account is not linked to any bus. Contact your school admin.
        </p>
        <button onClick={handleLogout} style={{ marginTop: 20, width: "100%", padding: "10px", background: "#EF4444", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
          Logout
        </button>
      </div>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────
  return (
    <div style={{ height: "100vh", overflowY: "auto", background: "#F8FAFC", fontFamily: "Inter, system-ui, sans-serif", display: "flex", flexDirection: "column" }}>

      {/* Navbar */}
      <header style={{ height: 60, background: "#0284C7", color: "#fff", display: "flex", alignItems: "center", padding: "0 20px", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🚌</span>
          <span style={{ fontWeight: 800, fontSize: 15 }}>Driver Console</span>
          <span style={{ fontSize: 11, background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: 20, marginLeft: 4 }}>
            Bus #{bus.busNumber}
          </span>
        </div>
        <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", padding: "6px 12px", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700 }}>
          <LogOut size={14} /> Logout
        </button>
      </header>

      <main style={{ flex: 1, padding: 20, display: "flex", gap: 20, boxSizing: "border-box", minHeight: 0, flexWrap: "wrap" }}>

        {/* ── Left Panel ── */}
        <div style={{ flex: "1 1 340px", maxWidth: 420, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* GPS warning */}
          {isLocationAllowed === false && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: 12, padding: "12px 14px", display: "flex", gap: 10 }}>
              <AlertTriangle size={18} color="#EF4444" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12.5, color: "#991B1B" }}>
                <strong>GPS Denied</strong> — Running in simulated route mode.
              </div>
            </div>
          )}

          {/* Profile card */}
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, letterSpacing: "0.5px" }}>TRANSIT OPERATOR</div>
            <h2 style={{ margin: "3px 0 0", fontSize: 18, color: "#1E293B", fontWeight: 900 }}>{driver?.name}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12, borderTop: "1px solid #F1F5F9", paddingTop: 10 }}>
              <div><div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700 }}>BUS</div>
                <strong style={{ fontSize: 13, color: "#0284C7" }}>#{bus.busNumber}</strong></div>
              <div><div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700 }}>PLATE</div>
                <strong style={{ fontSize: 13, color: "#1E293B" }}>{bus.vehicleNumber}</strong></div>
            </div>
          </div>

          {/* Trip controls */}
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: isTripActive ? (tripStatus === "Moving" ? "#10B981" : "#F59E0B") : "#EF4444" }} />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>
                Status: <strong style={{ color: isTripActive ? "#0284C7" : "#EF4444" }}>{isTripActive ? tripStatus : "Offline"}</strong>
              </span>
            </div>
            {isTripActive ? (
              <button onClick={handleEndTrip} style={{ width: "100%", padding: "13px", background: "#DC2626", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Square size={16} /> End Trip
              </button>
            ) : (
              <button onClick={handleStartTrip} style={{ width: "100%", padding: "13px", background: "#10B981", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Play size={16} /> Start Trip
              </button>
            )}
            {isTripActive && (
              <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#64748B", background: "#F8FAFC", padding: 8, borderRadius: 8 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} /> {coords.lat.toFixed(5)}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Compass size={11} /> {coords.lng.toFixed(5)}</span>
              </div>
            )}
          </div>

          {/* ── Vertical Live Transit Route Timeline (NEW) ── */}
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 900, color: "#0F172A" }}>
                <Users size={16} color="#0284C7" />
                Live Transit Route Timeline
                {absentToday.length > 0 && (
                  <span style={{ fontSize: 10, background: "#FEE2E2", color: "#DC2626", fontWeight: 800, padding: "2px 7px", borderRadius: 20 }}>
                    {absentToday.length} Absent
                  </span>
                )}
              </div>
              <button
                onClick={() => bus && fetchAbsentList(bus.id)}
                title="Refresh absent list"
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 2 }}
              >
                <RefreshCw size={13} />
              </button>
            </div>

            <div style={{ maxHeight: 340, overflowY: "auto", paddingRight: 6, position: "relative" }}>
              {routeStops.length === 0 ? (
                <div style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", padding: "20px 0" }}>
                  No route stops configured yet. Admin can add them in Bus Management.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", position: "relative", paddingLeft: 34, paddingTop: 6 }}>
                  
                  {/* Vertical Base Line */}
                  <div style={{
                    position: "absolute", left: 14, top: 12, bottom: 20, width: 3,
                    background: "#E2E8F0", borderRadius: 2, zIndex: 1
                  }} />

                  {/* Vertical Active Progress Line */}
                  {isTripActive && (
                    <div style={{
                      position: "absolute", left: 14, top: 12,
                      height: `${Math.min(100, (currentStopIndex / Math.max(1, routeStops.length - 1)) * 100)}%`,
                      width: 3, background: "#0284C7", borderRadius: 2, zIndex: 2,
                      transition: "height 0.5s ease"
                    }} />
                  )}

                  {routeStops.map((stop, idx) => {
                    const isSchool = idx === routeStops.length - 1;
                    const isCurrentBus = isTripActive && currentStopIndex === idx;
                    const isPassed = isTripActive && currentStopIndex > idx;
                    
                    // Assign students to this stop
                    const chunkSize = Math.max(1, Math.ceil(allStudents.length / Math.max(1, routeStops.length - 1)));
                    const studentsAtStop = isSchool ? [] : allStudents.slice(idx * chunkSize, idx * chunkSize + chunkSize);
                    const absentCount = studentsAtStop.filter(s => absentToday.includes(s.id)).length;
                    const allAbsent = studentsAtStop.length > 0 && absentCount === studentsAtStop.length;

                    // Estimated time calculation: start 07:15 AM
                    const baseHour = 7;
                    const baseMin = 15 + idx * 12;
                    const timeStr = `${String(baseHour + Math.floor(baseMin / 60)).padStart(2, '0')}:${String(baseMin % 60).padStart(2, '0')} AM`;

                    return (
                      <div key={stop.id} style={{
                        position: "relative", marginBottom: 14, display: "flex", flexDirection: "column", gap: 4,
                        opacity: allAbsent ? 0.6 : 1
                      }}>
                        {/* Timeline Node Icon */}
                        <div style={{
                          position: "absolute", left: -34, top: 0, zIndex: 3,
                          width: isCurrentBus ? 32 : 24,
                          height: isCurrentBus ? 32 : 24,
                          marginLeft: isCurrentBus ? -4 : 0,
                          marginTop: isCurrentBus ? -4 : 0,
                          borderRadius: "50%",
                          background: isCurrentBus ? "#0284C7" : isPassed ? "#10B981" : isSchool ? "#DC2626" : "#2563EB",
                          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: isCurrentBus ? 18 : isSchool ? 13 : 11, fontWeight: 900,
                          boxShadow: isCurrentBus ? "0 0 0 4px rgba(2,132,199,0.25)" : "0 2px 6px rgba(0,0,0,0.15)",
                          transition: "all 0.3s ease"
                        }}>
                          {isCurrentBus ? "🚌" : isPassed ? "✓" : isSchool ? "🏫" : (idx + 1)}
                        </div>

                        {/* Stop Content Box */}
                        <div style={{
                          background: isCurrentBus ? "#EFF6FF" : isPassed ? "#F0FDF4" : "#F8FAFC",
                          border: `1.5px solid ${isCurrentBus ? "#93C5FD" : isPassed ? "#BBF7D0" : "#E2E8F0"}`,
                          borderRadius: 10, padding: "9px 11px"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 900, color: isSchool ? "#DC2626" : "#0F172A" }}>
                                {isSchool ? "Sunrise Academy School" : (studentsAtStop.map(s => s.name).join(", ") || "Student Pickup Point")}
                              </div>
                              <div style={{ fontSize: 11, color: "#64748B", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                                📍 Stop {stop.stopOrder}: <strong>{stop.stopName}</strong>
                              </div>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: isCurrentBus ? "#0284C7" : "#475569" }}>
                                {timeStr}
                              </span>
                              {isCurrentBus && (
                                <div style={{ fontSize: 9, color: "#0284C7", fontWeight: 800, background: "#DBEAFE", padding: "1px 5px", borderRadius: 4, marginTop: 2 }}>
                                  BUS AT STOP
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Student List under stop */}
                          {studentsAtStop.length > 0 && (
                            <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px dashed #CBD5E1", display: "flex", flexDirection: "column", gap: 4 }}>
                              {studentsAtStop.map(s => {
                                const isAbsent = absentToday.includes(s.id);
                                return (
                                  <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11 }}>
                                    <span style={{ color: isAbsent ? "#94A3B8" : "#334155", textDecoration: isAbsent ? "line-through" : "none", fontWeight: 600 }}>
                                      🧒 {s.name} <span style={{ fontSize: 10, color: "#64748B" }}>({s.className || "Class"})</span>
                                    </span>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: isAbsent ? "#EF4444" : "#10B981" }}>
                                      {isAbsent ? "⛔ Absent" : "🟢 Ready"}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                </div>
              )}
            </div>
          </div>

          {/* GPS Log */}
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 8, maxHeight: 150 }}>
            <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#1E293B" }}>GPS Stream</h3>
            <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 4, fontSize: 10.5, fontFamily: "monospace", color: "#64748B", flex: 1 }}>
              {logs.length === 0
                ? <div style={{ color: "#94A3B8", textAlign: "center", padding: 12 }}>No signals. Start trip to broadcast.</div>
                : logs.map((log, i) => <div key={i} style={{ borderBottom: "1px solid #F8FAFC", paddingBottom: 2 }}>{log}</div>)
              }
            </div>
          </div>
        </div>

        {/* ── Map Panel ── */}
        <div style={{ flex: "2 1 450px", height: "calc(100vh - 100px)", minHeight: 400, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, overflow: "hidden", position: "relative" }}>
          <div ref={mapContainerRef} style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }} />

          {/* Live Navigation Route Overlay Banner */}
          {routeStops.length > 0 && (
            <div style={{
              position: "absolute", top: 16, right: 16, zIndex: 1000,
              background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(8px)",
              border: "1px solid #CBD5E1", borderRadius: 12, padding: "12px 16px",
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.12)", minWidth: 230
            }}>
              <div style={{ fontSize: 10.5, color: "#0284C7", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                📍 LIVE ROUTE NAVIGATION
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 900, color: "#0F172A", display: "flex", alignItems: "center", gap: 6 }}>
                🏫 Sunrise Academy School
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8, paddingTop: 8, borderTop: "1px solid #E2E8F0", fontSize: 11.5 }}>
                <div>
                  <span style={{ color: "#64748B" }}>Est. Trip Time:</span><br />
                  <strong style={{ color: "#10B981" }}>~25 Mins</strong>
                </div>
                <div>
                  <span style={{ color: "#64748B" }}>Route Stops:</span><br />
                  <strong style={{ color: "#7C3AED" }}>{routeStops.length} Stops ({allStudents.length} Kids)</strong>
                </div>
              </div>
            </div>
          )}

          {/* Stops not configured yet overlay */}
          {stopsLoaded && routeStops.length === 0 && (
            <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", background: "rgba(255,255,255,0.95)", border: "1px solid #FDE68A", borderRadius: 10, padding: "10px 16px", fontSize: 12.5, color: "#92400E", fontWeight: 600, zIndex: 500, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
              ⚠️ No route stops configured. Admin can add them in Bus Management.
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
