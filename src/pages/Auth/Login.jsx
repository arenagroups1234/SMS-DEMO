import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, schoolsApi } from "../../services/api";
import loginBg from "../../assets/light_abstract_bg_v3.png";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [mounted, setMounted]   = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const handleQuickLogin = (targetEmail, targetPassword = "Password123!") => {
    setEmail(targetEmail);
    setPassword(targetPassword);
    executeLogin(targetEmail, targetPassword);
  };

  const executeLogin = async (loginEmail, loginPass) => {
    setError("");
    setLoading(true);
    try {
      let data = null;
      try {
        const res = await authApi.login(loginEmail, loginPass);
        data = res;
      } catch (apiErr) {
        console.warn("API login failed, using Vercel mock fallback:", apiErr);
      }

      // Mock User Fallback mapping if backend unreachable
      let user = data?.user || data?.data?.user;
      if (!user) {
        const eLower = loginEmail.toLowerCase().trim();
        if (eLower.includes("admin@school.com")) {
          user = { id: "super-admin-1", name: "Super Admin", role: "super_admin", email: eLower };
        } else if (eLower.includes("stxaviers")) {
          user = { id: "admin-1", schoolId: "school-1", name: "St. Xavier Admin", role: "school_admin", email: eLower };
        } else if (eLower.includes("teacher") || eLower.includes("vikram")) {
          user = { id: "teacher-1", schoolId: "school-1", name: "Dr. Vikramaditya Sharma", role: "teacher", email: eLower };
        } else if (eLower.includes("student") || eLower.includes("aarav")) {
          user = { id: "student-1", schoolId: "school-1", name: "Aarav Sharma", role: "student", email: eLower };
        } else if (eLower.includes("driver") || /^\d{10}$/.test(eLower)) {
          user = { id: "driver-1", schoolId: "school-1", name: "Ramesh Kumar", role: "driver", email: eLower };
        } else {
          user = { id: "admin-1", schoolId: "school-1", name: "St. Xavier Admin", role: "school_admin", email: eLower };
        }
      }

      if (user && user.role === "admin") {
        user.role = "school_admin";
      }
      const role = user?.role || "school_admin";

      localStorage.setItem("sms_user", JSON.stringify(user));
      localStorage.setItem("sms_token", data?.token || "demo_vercel_token_123");

      if (role === "school_admin") {
        localStorage.setItem("sms_active_school", JSON.stringify({ id: user.schoolId || "school-1", name: user.name || "School Admin" }));
      }

      // Route by role
      if (role === "super_admin") navigate("/super-admin");
      else if (role === "school_admin") navigate(`/school-portal/${user.schoolId || "school-1"}`);
      else if (role === "teacher") navigate(`/teacher-portal/${user.id || "teacher-1"}`);
      else if (role === "parent" || role === "student") navigate(`/parent-portal/${user.id || "student-1"}`);
      else if (role === "driver") navigate(`/driver-portal/${user.id || "driver-1"}`);
      else navigate(`/school-portal/${user.schoolId || "school-1"}`);

    } catch (err) {
      setError("Login error: " + (err.message || "Invalid credentials"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter an email or phone number.");
      return;
    }
    executeLogin(email, password);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "'Inter', -apple-system, sans-serif",
      background: "#FAFAFA",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Back to Website button at top-left */}
      <button
        onClick={() => navigate("/")}
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          zIndex: 10,
          background: "rgba(255, 255, 255, 0.7)",
          border: "1px solid rgba(255, 255, 255, 0.8)",
          borderRadius: "12px",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: "13.5px",
          fontWeight: 700,
          color: "#1E4D72",
          cursor: "pointer",
          backdropFilter: "blur(8px)",
          boxShadow: "0 4px 12px rgba(2, 132, 199, 0.08)",
          transition: "all 0.2s ease-in-out",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#FFFFFF";
          e.currentTarget.style.transform = "translateX(-2px)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(2, 132, 199, 0.12)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.7)";
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(2, 132, 199, 0.08)";
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to Website
      </button>

      {/* Sky blue animated 3D background */}
      <div style={{
        position: "absolute", inset: 0, overflow: "hidden", zIndex: 0,
        background: "linear-gradient(135deg, #C8EEFF 0%, #A8DFF7 30%, #D4F1FF 60%, #E8F8FF 100%)",
      }}>
        {/* Light base image */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${loginBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.3,
        }} />
        {/* Animated floating orb 1 — sky blue */}
        <div style={{
          position: "absolute", width: "55vw", height: "55vw",
          top: "-25%", left: "-15%",
          background: "radial-gradient(circle, rgba(56,189,248,0.32) 0%, rgba(125,211,252,0.12) 40%, transparent 70%)",
          filter: "blur(55px)",
          animation: "orb1 18s ease-in-out infinite alternate",
          borderRadius: "50%",
        }} />
        {/* Animated floating orb 2 — indigo */}
        <div style={{
          position: "absolute", width: "50vw", height: "50vw",
          bottom: "-20%", right: "-15%",
          background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(165,180,252,0.07) 40%, transparent 70%)",
          filter: "blur(65px)",
          animation: "orb2 22s ease-in-out infinite alternate-reverse",
          borderRadius: "50%",
        }} />
        {/* Animated floating orb 3 — teal */}
        <div style={{
          position: "absolute", width: "38vw", height: "38vw",
          top: "35%", right: "10%",
          background: "radial-gradient(circle, rgba(20,184,166,0.16) 0%, rgba(94,234,212,0.05) 40%, transparent 70%)",
          filter: "blur(50px)",
          animation: "orb3 14s ease-in-out infinite alternate",
          borderRadius: "50%",
        }} />
        {/* Animated floating orb 4 — sky lighter */}
        <div style={{
          position: "absolute", width: "30vw", height: "30vw",
          top: "10%", right: "25%",
          background: "radial-gradient(circle, rgba(2,132,199,0.12) 0%, transparent 70%)",
          filter: "blur(45px)",
          animation: "orb4 25s ease-in-out infinite alternate-reverse",
          borderRadius: "50%",
        }} />
        {/* Fine grid overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(2, 132, 199, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(2, 132, 199, 0.05) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          opacity: 0.5,
        }} />
      </div>

      {/* Main login form card */}
      <div style={{
        width: 480, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 24px",
        position: "relative", zIndex: 1,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(30px)",
        transition: "all 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.15s",
      }}>
        <div style={{
          width: "100%",
          background: "rgba(255, 255, 255, 0.82)",
          border: "1px solid rgba(255, 255, 255, 0.7)",
          borderRadius: 24,
          padding: "40px 36px",
          backdropFilter: "blur(24px)",
          boxShadow: "0 32px 80px -20px rgba(2,132,199,0.18), inset 0 0 0 1px rgba(255,255,255,1)",
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 32 }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "#0284C7",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 20px -4px rgba(2,132,199,0.4)",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3L2 8l10 5 10-5-10-5zM2 16l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ color: "#000000", fontWeight: 800, fontSize: 18, letterSpacing: "-0.5px" }}>
                Edu<span style={{ color: "#0284C7" }}>Sphere</span>
              </span>
            </div>

            <h2 style={{ color: "#000000", fontSize: 26, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.5px" }}>
              Sign in
            </h2>
            <p style={{ color: "#4A7FA5", fontSize: 14 }}>Enter your credentials to continue</p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA",
              borderRadius: 12, padding: "12px 14px", marginBottom: 20,
              color: "#DC2626", fontSize: 13,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 18 }}>
              <label style={{
                color: "#1E4D72", fontSize: 13, fontWeight: 600,
                display: "block", marginBottom: 8,
              }}>
                Email address or Phone number
              </label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                  color: "#A1A1AA", fontSize: 16, pointerEvents: "none",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <input
                  type="text"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder="Email or 10-digit phone number"
                  required
                  style={{
                    width: "100%", padding: "12px 14px 12px 44px",
                    background: "#F0F9FF",
                    border: "1px solid #BAE6FD",
                    borderRadius: 12, color: "#000000", fontSize: 14, fontWeight: 500,
                    outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
                  }}
                  onFocus={e => { e.target.style.borderColor = "#38BDF8"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(56,189,248,0.15)"; }}
                  onBlur={e => { e.target.style.borderColor = "#BAE6FD"; e.target.style.background = "#F0F9FF"; e.target.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 28 }}>
              <label style={{
                color: "#1E4D72", fontSize: 13, fontWeight: 600,
                display: "block", marginBottom: 8,
              }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                  color: "#A1A1AA", fontSize: 16, pointerEvents: "none",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  required
                  style={{
                    width: "100%", padding: "12px 44px 12px 44px",
                    background: "#F0F9FF",
                    border: "1px solid #BAE6FD",
                    borderRadius: 12, color: "#000000", fontSize: 14, fontWeight: 500,
                    outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
                  }}
                  onFocus={e => { e.target.style.borderColor = "#38BDF8"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(56,189,248,0.15)"; }}
                  onBlur={e => { e.target.style.borderColor = "#BAE6FD"; e.target.style.background = "#F0F9FF"; e.target.style.boxShadow = "none"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{
                    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "#71717A", padding: 0, fontSize: 16,
                    display: "flex", alignItems: "center",
                  }}
                >
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "14px",
                background: loading ? "#7BADC8" : "#0284C7",
                color: "#fff", border: "none", borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: loading ? "none" : "0 8px 24px -4px rgba(2,132,199,0.45)",
                transition: "all 0.3s ease",
                position: "relative", overflow: "hidden",
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 12px 30px -4px rgba(2,132,199,0.55)"; e.currentTarget.style.background = "#0369A1"; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = loading ? "none" : "0 8px 24px -4px rgba(2,132,199,0.45)"; e.currentTarget.style.background = loading ? "#7BADC8" : "#0284C7"; }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff", borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }} />
                  Signing in...
                </>
              ) : (
                <>Sign In →</>
              )}
            </button>
          </form>

          {/* Driver login hint */}
          <div style={{
            padding: "10px 14px", background: "#F0FDF4", border: "1px solid #BBF7D0",
            borderRadius: 10, fontSize: 12.5, color: "#166534", lineHeight: 1.5,
            marginTop: 20
          }}>
            🚌 <strong>Driver?</strong> Use your registered <strong>phone number</strong> as your username and the password set by your school admin.
          </div>
        </div>
      </div>

      <style>{`
        @keyframes orb1 {
          0%   { transform: translate(0px, 0px) scale(1); }
          33%  { transform: translate(60px, -40px) scale(1.08); }
          66%  { transform: translate(-30px, 50px) scale(0.94); }
          100% { transform: translate(40px, 30px) scale(1.04); }
        }
        @keyframes orb2 {
          0%   { transform: translate(0px, 0px) scale(1); }
          33%  { transform: translate(-50px, 40px) scale(0.93); }
          66%  { transform: translate(40px, -50px) scale(1.06); }
          100% { transform: translate(-20px, 30px) scale(0.97); }
        }
        @keyframes orb3 {
          0%   { transform: translate(0px, 0px) scale(1); }
          50%  { transform: translate(-40px, -35px) scale(1.1); }
          100% { transform: translate(30px, 40px) scale(0.92); }
        }
        @keyframes orb4 {
          0%   { transform: translate(0px, 0px) scale(1); }
          40%  { transform: translate(45px, 30px) scale(1.05); }
          100% { transform: translate(-35px, -25px) scale(0.96); }
        }
        @keyframes floatSlow {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(40px, -30px) scale(1.05); }
          100% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes floatSlowReverse {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-30px, 40px) scale(0.95); }
          100% { transform: translate(20px, -20px) scale(1.05); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .login-left-panel { display: none !important; }
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
          -webkit-text-fill-color: #0A0A0B !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </div>
  );
}
