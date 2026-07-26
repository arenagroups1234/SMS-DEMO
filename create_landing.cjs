const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'src', 'components', 'landing');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const files = {
  "Navbar.jsx": `import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const linkStyle = {
    textDecoration: "none",
    color: isScrolled ? "#475569" : "#F8FAFC",
    fontWeight: 500,
    fontSize: 14,
    transition: "color 0.2s ease"
  };

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, height: 72,
      background: isScrolled ? "rgba(255, 255, 255, 0.85)" : "transparent",
      backdropFilter: isScrolled ? "blur(12px)" : "none",
      borderBottom: isScrolled ? "1px solid rgba(226, 232, 240, 0.8)" : "1px solid transparent",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 5%", zIndex: 100, transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => window.scrollTo(0,0)}>
        <div style={{
          width: 32, height: 32, background: isScrolled ? "#2563EB" : "#fff",
          borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
          color: isScrolled ? "#fff" : "#2563EB", fontSize: 18, fontWeight: 800,
          boxShadow: isScrolled ? "0 4px 12px rgba(37, 99, 235, 0.2)" : "none"
        }}>E</div>
        <span style={{ fontSize: 20, fontWeight: 700, color: isScrolled ? "#0F172A" : "#fff", letterSpacing: "-0.5px" }}>
          EduCloud
        </span>
      </div>

      {/* Links */}
      <div style={{ display: "none", alignItems: "center", gap: 32, "@media (min-width: 1024px)": { display: "flex" } }}>
        <a href="#features" style={linkStyle}>Features</a>
        <a href="#solutions" style={linkStyle}>Solutions</a>
        <a href="#modules" style={linkStyle}>Modules</a>
        <a href="#pricing" style={linkStyle}>Pricing</a>
        <a href="#resources" style={linkStyle}>Resources</a>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button 
          onClick={() => navigate('/login')}
          style={{
            background: "transparent", border: "none", fontSize: 14, fontWeight: 600,
            color: isScrolled ? "#475569" : "#fff", cursor: "pointer", transition: "color 0.2s"
          }}
        >
          Login
        </button>
        <button style={{
          padding: "10px 20px", background: isScrolled ? "#0F172A" : "#fff",
          color: isScrolled ? "#fff" : "#0F172A", border: "none",
          borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: "pointer",
          boxShadow: isScrolled ? "0 4px 14px rgba(0, 0, 0, 0.1)" : "0 4px 14px rgba(255, 255, 255, 0.2)",
          transition: "transform 0.2s, box-shadow 0.2s"
        }}
        >
          Book Demo
        </button>
      </div>
    </nav>
  );
}`,

  "Hero.jsx": `export default function Hero() {
  return (
    <section style={{
      position: "relative",
      padding: "160px 5% 120px",
      backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.95)), url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      {/* ── Content ── */}
      <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 10 }}>
        
        <div style={{ 
          display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", 
          background: "rgba(255, 255, 255, 0.15)", border: "1px solid rgba(255, 255, 255, 0.2)", 
          borderRadius: 999, marginBottom: 32, backdropFilter: "blur(12px)" 
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#38BDF8", boxShadow: "0 0 10px #38BDF8" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#F8FAFC", letterSpacing: "0.5px" }}>The #1 Multi-School ERP Platform</span>
        </div>
        
        <h1 style={{ 
          fontSize: 72, fontWeight: 800, color: "#fff", lineHeight: 1.05, letterSpacing: "-2px", marginBottom: 32,
          textShadow: "0 10px 30px rgba(0,0,0,0.5)"
        }}>
          Manage thousands of schools.<br />
          <span style={{ color: "#38BDF8" }}>From a single dashboard.</span>
        </h1>
        
        <p style={{ fontSize: 20, color: "#CBD5E1", lineHeight: 1.6, marginBottom: 48, maxWidth: 700, margin: "0 auto 48px", fontWeight: 400 }}>
          Automate attendance, streamline fee collection, empower teachers, and engage parents. The world's most advanced cloud infrastructure built for multi-tenant educational institutions.
        </p>

        <div style={{ display: "flex", gap: 16, justifyContent: "center", alignItems: "center" }}>
          <button style={{
            padding: "16px 32px", background: "#2563EB", color: "#fff", border: "none",
            borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: "pointer",
            boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.4)",
            transition: "all 0.2s"
          }}
          >
            Book Demo
          </button>
          
          <button style={{
            padding: "16px 32px", background: "rgba(255, 255, 255, 0.05)", color: "#fff", border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: "pointer", backdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s"
          }}
          >
            <span style={{ fontSize: 20 }}>▶</span> Watch Product Tour
          </button>
        </div>
      </div>

      {/* ── Realistic Desktop Dashboard Showcase ── */}
      <div style={{ width: "100%", maxWidth: 1100, margin: "80px auto 0", position: "relative", zIndex: 20 }}>
        {/* Main Desktop Mockup */}
        <div style={{
          background: "#fff", borderRadius: 16, padding: "8px", 
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1)",
          position: "relative"
        }}>
          {/* Mock Mac Window Header */}
          <div style={{ display: "flex", gap: 6, padding: "8px 12px 16px" }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FF5F56" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FFBD2E" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#27C93F" }} />
          </div>
          {/* Dummy Dashboard UI inside Mac */}
          <div style={{ height: 500, background: "#F1F5F9", borderRadius: 8, overflow: "hidden", display: "flex" }}>
            <div style={{ width: 220, background: "#fff", borderRight: "1px solid #E2E8F0", padding: 24 }}>
              <div style={{ width: 120, height: 24, background: "#E2E8F0", borderRadius: 4, marginBottom: 40 }} />
              <div style={{ width: "100%", height: 16, background: "#E2E8F0", borderRadius: 4, marginBottom: 16 }} />
              <div style={{ width: "80%", height: 16, background: "#E2E8F0", borderRadius: 4, marginBottom: 16 }} />
              <div style={{ width: "90%", height: 16, background: "#E2E8F0", borderRadius: 4, marginBottom: 16 }} />
            </div>
            <div style={{ flex: 1, padding: 32 }}>
              <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
                <div style={{ flex: 1, height: 100, background: "#fff", borderRadius: 8, border: "1px solid #E2E8F0" }} />
                <div style={{ flex: 1, height: 100, background: "#fff", borderRadius: 8, border: "1px solid #E2E8F0" }} />
                <div style={{ flex: 1, height: 100, background: "#fff", borderRadius: 8, border: "1px solid #E2E8F0" }} />
              </div>
              <div style={{ height: 250, background: "#fff", borderRadius: 8, border: "1px solid #E2E8F0" }} />
            </div>
          </div>
        </div>

        {/* Floating Mobile App Preview (Right) */}
        <div style={{
          position: "absolute", top: 120, right: -40, width: 200, height: 420,
          background: "#fff", borderRadius: 32, padding: 8,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 6px #1E293B",
          display: "flex", flexDirection: "column"
        }}>
          {/* Notch */}
          <div style={{ width: 80, height: 24, background: "#1E293B", margin: "0 auto", borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }} />
          {/* App UI */}
          <div style={{ padding: 16, flex: 1 }}>
            <div style={{ width: 100, height: 20, background: "#E2E8F0", borderRadius: 4, marginBottom: 24 }} />
            <div style={{ width: "100%", height: 60, background: "#DBEAFE", borderRadius: 12, marginBottom: 16 }} />
            <div style={{ width: "100%", height: 60, background: "#FEF3C7", borderRadius: 12, marginBottom: 16 }} />
            <div style={{ width: "100%", height: 60, background: "#DCFCE7", borderRadius: 12, marginBottom: 16 }} />
          </div>
        </div>

        {/* Floating Analytics Card (Left) */}
        <div style={{
          position: "absolute", bottom: 60, left: -60, padding: 24,
          background: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(12px)",
          borderRadius: 16, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.5)",
          display: "flex", alignItems: "center", gap: 16
        }}>
          <div style={{ width: 48, height: 48, background: "#DCFCE7", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📈</div>
          <div>
            <div style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>Total Revenue</div>
            <div style={{ fontSize: 24, color: "#0F172A", fontWeight: 800 }}>$2.4M</div>
          </div>
        </div>
      </div>
    </section>
  );
}`,

  "TrustMetrics.jsx": `export default function TrustMetrics() {
  return (
    <section style={{ padding: "80px 5%", background: "#fff", borderBottom: "1px solid #F1F5F9" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 40 }}>
          Trusted by top institutions worldwide
        </p>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 64, marginBottom: 80, opacity: 0.5, filter: "grayscale(100%)" }}>
          <span style={{ fontSize: 24, fontWeight: 800 }}>EDU.Corp</span>
          <span style={{ fontSize: 24, fontWeight: 800 }}>Academix</span>
          <span style={{ fontSize: 24, fontWeight: 800 }}>ScholarIS</span>
          <span style={{ fontSize: 24, fontWeight: 800 }}>LearnFlow</span>
          <span style={{ fontSize: 24, fontWeight: 800 }}>CampusPro</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 32 }}>
          <div><div style={{ fontSize: 48, fontWeight: 800, color: "#0F172A", letterSpacing: "-1px" }}>500+</div><div style={{ fontSize: 16, color: "#64748B", fontWeight: 500, marginTop: 8 }}>Schools Managed</div></div>
          <div><div style={{ fontSize: 48, fontWeight: 800, color: "#0F172A", letterSpacing: "-1px" }}>150k+</div><div style={{ fontSize: 16, color: "#64748B", fontWeight: 500, marginTop: 8 }}>Active Students</div></div>
          <div><div style={{ fontSize: 48, fontWeight: 800, color: "#0F172A", letterSpacing: "-1px" }}>20k+</div><div style={{ fontSize: 16, color: "#64748B", fontWeight: 500, marginTop: 8 }}>Empowered Teachers</div></div>
          <div><div style={{ fontSize: 48, fontWeight: 800, color: "#0F172A", letterSpacing: "-1px" }}>10M+</div><div style={{ fontSize: 16, color: "#64748B", fontWeight: 500, marginTop: 8 }}>Attendance Records</div></div>
        </div>
      </div>
    </section>
  );
}`,

  "ModulesGrid.jsx": `const MODULES = [
  { name: "Admissions", icon: "📝", color: "#EFF6FF", text: "#2563EB" },
  { name: "Student Info", icon: "🎓", color: "#F0FDF4", text: "#16A34A" },
  { name: "Attendance", icon: "✅", color: "#FEF2F2", text: "#DC2626" },
  { name: "Fee Management", icon: "💳", color: "#FFFBEB", text: "#D97706" },
  { name: "Transport", icon: "🚌", color: "#F3E8FF", text: "#9333EA" },
  { name: "Examinations", icon: "📋", color: "#ECFEFF", text: "#0891B2" },
  { name: "Timetable", icon: "📅", color: "#FDF4FF", text: "#C026D3" },
  { name: "Homework", icon: "📚", color: "#F5F3FF", text: "#7C3AED" },
  { name: "Library", icon: "📖", color: "#FFF7ED", text: "#EA580C" },
  { name: "Hostel", icon: "🏨", color: "#F1F5F9", text: "#475569" },
  { name: "HR & Payroll", icon: "👥", color: "#ECFDF5", text: "#059669" },
  { name: "Finance", icon: "📊", color: "#EFF6FF", text: "#1D4ED8" },
  { name: "Inventory", icon: "📦", color: "#FDF2F8", text: "#DB2777" },
  { name: "Certificates", icon: "📜", color: "#FFFBEB", text: "#B45309" },
  { name: "Communication", icon: "💬", color: "#F0FDF4", text: "#15803D" },
  { name: "AI Reports", icon: "🤖", color: "#F8FAFC", text: "#0F172A" },
];
export default function ModulesGrid() {
  return (
    <section style={{ padding: "120px 5%", background: "#F8FAFC" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-1px", marginBottom: 16 }}>Every module you need.</h2>
          <p style={{ fontSize: 20, color: "#64748B", maxWidth: 700, margin: "0 auto", lineHeight: 1.6 }}>16+ enterprise-grade modules working together in perfect harmony.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 24 }}>
          {MODULES.map((mod, i) => (
            <div key={i} style={{ background: "#fff", padding: "24px", borderRadius: 20, border: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: mod.color, color: mod.text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{mod.icon}</div>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#1E293B" }}>{mod.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,

  "RoleExperience.jsx": `const ROLES = [
  { role: "Super Admin", desc: "Manage multiple schools, global analytics.", icon: "👑", color: "#2563EB" },
  { role: "School Admin", desc: "Run daily operations, staff HR.", icon: "🏢", color: "#16A34A" },
  { role: "Teacher", desc: "Mark attendance, assign homework.", icon: "👨‍🏫", color: "#9333EA" },
  { role: "Parent", desc: "Track progress, view report cards.", icon: "👨‍👩‍👦", color: "#EA580C" },
  { role: "Accountant", desc: "Process fee collections, manage expenses.", icon: "💰", color: "#0891B2" },
  { role: "Librarian", desc: "Issue books, manage inventory.", icon: "📚", color: "#C026D3" },
  { role: "Transport", desc: "Track bus routes via GPS.", icon: "🚌", color: "#D97706" },
];
export default function RoleExperience() {
  return (
    <section style={{ padding: "120px 5%", background: "#fff" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 80 }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-1px", marginBottom: 16 }}>Designed for everyone.</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
          {ROLES.map((role, i) => (
            <div key={i} style={{ padding: 32, background: "#fff", borderRadius: 24, border: "1px solid #E2E8F0", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 6, background: role.color }} />
              <div style={{ fontSize: 48, marginBottom: 24 }}>{role.icon}</div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", marginBottom: 12 }}>{role.role}</h3>
              <p style={{ fontSize: 16, color: "#64748B", lineHeight: 1.6 }}>{role.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,

  "InteractiveShowcase.jsx": `import { useState } from "react";
const TABS = ["Super Admin", "School Admin", "Teacher Portal", "Parent Portal", "Student Portal"];
export default function InteractiveShowcase() {
  const [activeTab, setActiveTab] = useState(0);
  return (
    <section style={{ padding: "120px 5%", background: "#0F172A", color: "#fff", overflow: "hidden" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-1px", marginBottom: 48 }}>Experience the workflow.</h2>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 64, flexWrap: "wrap", background: "rgba(255, 255, 255, 0.05)", padding: 8, borderRadius: 999, width: "fit-content", margin: "0 auto 64px" }}>
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{ padding: "12px 24px", border: "none", borderRadius: 999, fontSize: 15, fontWeight: 600, cursor: "pointer", background: activeTab === i ? "#2563EB" : "transparent", color: activeTab === i ? "#fff" : "#94A3B8" }}>
              {tab}
            </button>
          ))}
        </div>
        <div style={{ background: "#1E293B", borderRadius: 24, padding: 12, border: "1px solid rgba(255,255,255,0.1)", height: 600, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: 8, padding: "12px 16px 20px" }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#EF4444" }} /><div style={{ width: 12, height: 12, borderRadius: "50%", background: "#F59E0B" }} /><div style={{ width: 12, height: 12, borderRadius: "50%", background: "#10B981" }} />
          </div>
          <div style={{ flex: 1, background: "#F8FAFC", borderRadius: 12, overflow: "hidden", display: "flex" }}>
            <div style={{ width: 240, background: "#fff", borderRight: "1px solid rgba(0,0,0,0.05)", padding: 24 }}>
              <div style={{ width: 140, height: 24, background: "#CBD5E1", borderRadius: 6, marginBottom: 48 }} />
              {[...Array(6)].map((_, i) => <div key={i} style={{ width: "80%", height: 16, background: "#E2E8F0", borderRadius: 4, marginBottom: 20 }} />)}
            </div>
            <div style={{ flex: 1, padding: 40, textAlign: "left" }}>
              <h3 style={{ color: "#0F172A", fontSize: 28, fontWeight: 800, marginBottom: 32 }}>{TABS[activeTab]} Dashboard</h3>
              <div style={{ display: "flex", gap: 24, marginBottom: 40 }}>
                {[...Array(3)].map((_, i) => <div key={i} style={{ flex: 1, height: 120, background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.05)", padding: 24 }}><div style={{ width: 40, height: 40, background: "#E2E8F0", borderRadius: 8, marginBottom: 16 }} /><div style={{ width: "60%", height: 12, background: "#CBD5E1", borderRadius: 4 }} /></div>)}
              </div>
              <div style={{ height: 200, background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.05)" }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,

  "WhyChooseUs.jsx": `const FEATURES = [
  { title: "Centralized Management", desc: "Control all branches from one screen.", icon: "🏢" },
  { title: "Real-Time Analytics", desc: "Instant insights on revenue and academics.", icon: "📊" },
  { title: "Mobile Apps", desc: "Native apps for teachers, parents, and students.", icon: "📱" },
  { title: "Cloud Security", desc: "Bank-level encryption and daily automated backups.", icon: "🔒" },
];
export default function WhyChooseUs() {
  return (
    <section id="features" style={{ padding: "120px 5%", background: "#F8FAFC" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 80 }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-1px", marginBottom: 16 }}>Why leading schools choose us.</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 32 }}>
          {FEATURES.map((feat, i) => (
            <div key={i} style={{ padding: 16 }}>
              <div style={{ width: 48, height: 48, background: "#DBEAFE", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 24, color: "#2563EB" }}>{feat.icon}</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>{feat.title}</h3>
              <p style={{ fontSize: 15, color: "#64748B", lineHeight: 1.6 }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,

  "WorkflowTimeline.jsx": `export default function WorkflowTimeline() {
  const steps = [
    { label: "Admission", desc: "Student applies online" },
    { label: "Attendance", desc: "Biometric or App" },
    { label: "Academics", desc: "Homework & Exams" },
    { label: "Finance", desc: "Auto Fee Collection" },
    { label: "Reports", desc: "AI Report Cards" },
  ];
  return (
    <section style={{ padding: "120px 5%", background: "#fff", borderTop: "1px solid #F1F5F9", borderBottom: "1px solid #F1F5F9" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontSize: 40, fontWeight: 800, color: "#0F172A", letterSpacing: "-1px", marginBottom: 16 }}>A seamless digital workflow.</h2>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", flexWrap: "wrap", gap: 32, marginTop: 80 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ flex: 1, minWidth: 150, position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#2563EB", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, marginBottom: 24 }}>{i + 1}</div>
              <h4 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>{step.label}</h4>
              <p style={{ fontSize: 14, color: "#64748B" }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,

  "AIFeatures.jsx": `export default function AIFeatures() {
  return (
    <section style={{ padding: "120px 5%", background: "#0F172A", color: "#fff" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 64, alignItems: "center" }}>
        <div style={{ flex: "1 1 400px" }}>
          <h2 style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-1px", marginBottom: 24, lineHeight: 1.1 }}>Work smarter.<br />Not harder.</h2>
        </div>
      </div>
    </section>
  );
}`,

  "SocialProof.jsx": `export default function SocialProof() { return <section></section>; }`,
  "Security.jsx": `export default function Security() { return <section></section>; }`,
  "Integrations.jsx": `export default function Integrations() { return <section></section>; }`,
  "MobileApps.jsx": `export default function MobileApps() { return <section></section>; }`,
  "PricingPreview.jsx": `export default function PricingPreview() { return <section></section>; }`,
  "Footer.jsx": `export default function Footer() { return <section></section>; }`
};

for (const [filename, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(targetDir, filename), content);
}

console.log("Written files to", targetDir);
