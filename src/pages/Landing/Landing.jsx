import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { contactsApi } from "../../services/api";
import { toast } from "sonner";

// Icons
import {
  GraduationCap, BookOpen, Users, UserCheck, ArrowRight,
  Check, Calendar, Activity, DollarSign, Mail, Phone, MapPin,
  ChevronLeft, ChevronRight, MessageSquare, Award, Clock,
  Sun, Moon, FileText, User, CreditCard, ShieldCheck, Truck,
  Home, Layers, Bell, Shield, MessageCircle, PhoneCall,
  Menu, X, Facebook, Instagram, Linkedin, Github
} from "lucide-react";

// Assets
import priyaImg from "../../assets/priya_sharma.png";
import rajeshImg from "../../assets/rajesh_kumar.png";
import amitImg from "../../assets/amit_singh.png";
import schoolBooks from "../../assets/school_books.jpg";
import scienceKids from "../../assets/science_kids.jpg";
import classroom from "../../assets/indian_classroom.jpg";
import teacherStaff from "../../assets/teacher_staff.jpg";
import schoolBuilding from "../../assets/school_building.jpg";
import indianSchoolCampus from "../../assets/indian_school_campus.jpg";
import indianSchoolLunch from "../../assets/indian_school_lunch.jpg";
import highSchoolCampus from "../../assets/high_school_campus.jpg";
import premiumHeroBg from "../../assets/premium_hero_bg_v2.png";
import greenValleyCampus from "../../assets/images/green_valley_campus_1783566949063.jpg";
import indianKidsBooks from "../../assets/indian_kids_books.jpg";
import scienceExhibitionPoster from "../../assets/science_exhibition_poster.jpg";
import ptmPoster from "../../assets/ptm_poster.jpg";
import sportsPoster from "../../assets/sports_poster.jpg";
import girlOnCall from "../../assets/girl_on_call.png";
import heroTeacherCutout from "../../assets/hero_teacher_cutout.png";
import heroTeacherStudent from "../../assets/hero_teacher_student.png";
import lightAbstractBg from "../../assets/light_abstract_bg_v3.png";
import loginPremiumBg from "../../assets/login_premium_bg.png";
import schoolInfoImg from "../../assets/wenr_india_school_info.jpg";
import attendanceTrackingImg from "../../assets/excel_attendance_tracking.png";
import feeBillingImg from "../../assets/fee_billing_tbn.jpg";
import examsMarksheetImg from "../../assets/exams_marksheet_tbn.jpg";
import transportGpsImg from "../../assets/transport_gps_tbn.jpg";
import inventoryAssetsImg from "../../assets/inventory_assets_tbn.jpg";
import noticeBoardImg from "../../assets/notice_board_retail.jpg";
import securityImg from "../../assets/security_tbn.jpg";

import "./Landing.css";

export default function Landing() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeProgramTab, setActiveProgramTab] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeEvent, setActiveEvent] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const [showAllNews, setShowAllNews] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeNewsSlide, setActiveNewsSlide] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const slideshowImages = [
    classroom,
    scienceKids,
    indianSchoolLunch,
    teacherStaff
  ];

  useEffect(() => {
    // Override index.css style locking scroll specifically when Landing page is loaded
    document.documentElement.style.overflow = "auto";
    document.documentElement.style.height = "auto";
    document.body.style.overflow = "auto";
    document.body.style.height = "auto";
    const rootEl = document.getElementById("root");
    if (rootEl) {
      rootEl.style.height = "auto";
      rootEl.style.overflow = "auto";
    }

    return () => {
      // Revert styles when unmounting
      document.documentElement.style.overflow = "";
      document.documentElement.style.height = "";
      document.body.style.overflow = "";
      document.body.style.height = "";
      if (rootEl) {
        rootEl.style.height = "";
        rootEl.style.overflow = "";
      }
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % slideshowImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slideshowImages.length]);

  // Form State
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    company: "",
    message: ""
  });
  const [formSent, setFormSent] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      return;
    }
    try {
      await contactsApi.create({
        name: contactForm.name,
        email: contactForm.email,
        phone: "",
        subject: contactForm.subject || "General Inquiry",
        message: contactForm.message
      });
      setFormSent(true);
      setTimeout(() => {
        setFormSent(false);
        setContactForm({ name: "", email: "", subject: "", company: "", message: "" });
      }, 3000);
    } catch (err) {
      console.error("Failed to submit contact request", err);
    }
  };

  const programs = [
    {
      badge: "Super Admin Control",
      duration: "Multi-Campus",
      image: premiumHeroBg,
      title: "Centralized SaaS Console",
      desc: "Monitor subscription plans, manage regional settings, conduct overall financial audits, and check system logs across all school branches.",
      rating: "5.0",
      reviews: "50+",
      price: "Master Admin"
    },
    {
      badge: "School Admin Portal",
      duration: "Campus Operations",
      image: schoolBuilding,
      title: "Principal & Registrar Hub",
      desc: "Register students/staff, generate automated timetables, execute digital fee collection, and track school transport with GPS.",
      rating: "4.9",
      reviews: "350+",
      price: "School Admin"
    },
    {
      badge: "Teacher Dashboard",
      duration: "Classroom Tools",
      image: classroom,
      title: "Digital Educator Console",
      desc: "Record daily attendance, upload test scores/grades, assign digital homework, and interact directly with parents via chat notes.",
      rating: "5.0",
      reviews: "1.2K+",
      price: "Faculty Staff"
    },
    {
      badge: "Parent & Student App",
      duration: "Real-Time Tracking",
      image: indianKidsBooks,
      title: "Home-to-School Portal",
      desc: "Receive instant notifications, pay tuition fees, download progress reports, check attendance graphs, and view class announcements.",
      rating: "4.8",
      reviews: "12K+",
      price: "Family Access"
    }
  ];

  const events = [
    {
      date: "16 Jul, 2026 09:00am",
      title: "Annual Science Exhibition & Robot Showcase",
      image: scienceExhibitionPoster
    },
    {
      date: "22 Jul, 2026 10:00am",
      title: "Parent-Teacher Consultations & Progress Review",
      image: ptmPoster
    },
    {
      date: "05 Aug, 2026 08:30am",
      title: "Inter-School Sports Meet & Athletic Championship",
      image: sportsPoster
    }
  ];

  const newsList = [
    {
      tag: "NEWS",
      date: "15 Jul, 2026",
      image: premiumHeroBg,
      title: "EduSphere portal launched for seamless online fee submission and attendance tracking."
    },
    {
      tag: "ANNOUNCEMENTS",
      date: "10 Jul, 2026",
      image: highSchoolCampus,
      title: "Admissions officially open for the upcoming academic session 2026-2027."
    },
    {
      tag: "NEWS",
      date: "05 Jul, 2026",
      image: classroom,
      title: "School library upgraded with 500+ new digital reference logs and study material."
    },
    {
      tag: "EVENTS",
      date: "28 Jun, 2026",
      image: scienceKids,
      title: "Annual Science and Tech Fest registrations starting from next week."
    },
    {
      tag: "TRANSPORT",
      date: "22 Jun, 2026",
      image: highSchoolCampus,
      title: "New GPS transport route mappings initialized for Jamuna Dairy and Sodala routes."
    },
    {
      tag: "ANNOUNCEMENTS",
      date: "18 Jun, 2026",
      image: teacherStaff,
      title: "Parent Teacher Meeting (PTM) scheduled for progressive review of Term 1."
    }
  ];

  const teachers = [
    { name: "Mrs. Priya Sharma", subject: "English & Literature", img: priyaImg },
    { name: "Dr. Rajesh Kumar", subject: "Physics & Science", img: rajeshImg },
    { name: "Mr. Amit Singh", subject: "Mathematics", img: amitImg }
  ];

  const testimonials = [
    {
      quote: "The dedication of teachers at this school is unparalleled. Our child has grown not just academically, but as a confident individual. The portals make tracking progress incredibly easy.",
      name: "Mrs. Meera Deshmukh",
      role: "Parent of Class 8 Student",
      img: girlOnCall
    },
    {
      quote: "The school management portal has revolutionized how we coordinate homework, fee bills, and bus tracking. Everything is just one click away. Incredible platform!",
      name: "Mr. Rajesh Goel",
      role: "Parent of Class 10 Student",
      img: amitImg
    }
  ];

  const handlePrevTestimonial = () => {
    setActiveTestimonial(prev => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNextTestimonial = () => {
    setActiveTestimonial(prev => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  // Viewport width for responsive carousels
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getVisibleNewsCount = () => {
    if (viewportWidth <= 640) return 1;
    if (viewportWidth <= 1024) return 2;
    return 3;
  };

  const visibleNewsCount = getVisibleNewsCount();
  const maxNewsIndex = Math.max(0, newsList.length - visibleNewsCount);

  const handlePrevNews = () => {
    setActiveNewsSlide(prev => Math.max(prev - 1, 0));
  };

  const handleNextNews = () => {
    setActiveNewsSlide(prev => Math.min(prev + 1, maxNewsIndex));
  };

  useEffect(() => {
    if (activeNewsSlide > maxNewsIndex) {
      setActiveNewsSlide(Math.max(0, maxNewsIndex));
    }
  }, [maxNewsIndex, activeNewsSlide]);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    toast.success(`Subscribed successfully: ${newsletterEmail}`);
    setNewsletterEmail("");
  };

  const partnerSchools = [
    { name: "Delhi Public School", code: "DPS" },
    { name: "DAV Public School", code: "DAV" },
    { name: "Kendriya Vidyalaya", code: "KV" },
    { name: "Ryan International", code: "RIS" },
    { name: "Amity International", code: "AIS" },
    { name: "Sanskriti School", code: "SS" },
    { name: "The Heritage School", code: "THS" }
  ];

  const smsModules = [
    { title: "Admission Management", desc: "Digital application portals, verification workflows, and automatic enrollment registration.", icon: <FileText size={18} />, image: schoolBuilding },
    { title: "Student Information System", desc: "Consolidated student profile database, online ID generation, and multi-campus transfers.", icon: <User size={18} />, image: schoolInfoImg },
    { title: "Attendance Tracking", desc: "RFID, Biometric integration, and automated mobile notifications to parents for absentees.", icon: <Clock size={18} />, image: attendanceTrackingImg },
    { title: "Fee & Billing Console", desc: "Automated custom invoicing, ledger logs, collection reports, and payment gateway logs.", icon: <CreditCard size={18} />, image: feeBillingImg },
    { title: "Exams & Marksheets", desc: "Digital marks entry, report card auto-generation, and scholastic progress reports.", icon: <Award size={18} />, image: examsMarksheetImg },
    { title: "HR & Staff Payroll", desc: "Employee records, attendance registers, salary slip generation, and leave approvals.", icon: <ShieldCheck size={18} />, image: teacherStaff },
    { title: "Class Timetable scheduler", desc: "Conflict-free automatic schedule generation for classes, periods, and subject educators.", icon: <Calendar size={18} />, image: heroTeacherStudent },
    { title: "Transport & GPS Roster", desc: "Vehicles records, driver details, optimized route mapping, and real-time GPS tracking.", icon: <Truck size={18} />, image: transportGpsImg },
    { title: "Library Management", desc: "Book cataloging, issue & return logs, automatic fine calculations, and digital references.", icon: <BookOpen size={18} />, image: schoolBooks },
    { title: "Hostel & Dormitory", desc: "Room inventory, student room allotments, warden details, and daily hostel registers.", icon: <Home size={18} />, image: highSchoolCampus },
    { title: "Inventory & Assets", desc: "School stock management, laboratory equipment logs, and stationery orders.", icon: <Layers size={18} />, image: inventoryAssetsImg },
    { title: "Notice & Bulletins", desc: "Instant mobile push alerts, class-wise SMS broadcasts, and digital notice board uploads.", icon: <Bell size={18} />, image: noticeBoardImg },
    { title: "Security & Visitors Log", desc: "Visitor registration, digital gate pass printing, and checkpoint security logs.", icon: <Shield size={18} />, image: securityImg }
  ];

  return (
    <div className={`landing-page landing-root ${isDark ? "dark" : ""}`}>
      
      {/* ── NAVBAR ── */}
      <header className={`navbar ${isScrolled ? "scrolled" : ""}`}>
        <div className="logo-container" onClick={() => window.scrollTo(0, 0)}>
          <div className="logo-icon-box" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <GraduationCap size={18} />
          </div>
          <span className="logo-text">EduSphere</span>
        </div>
        
        <nav className="nav-links">
          <a href="#home" className="nav-link">HOME</a>
          <a href="#about" className="nav-link">About Us</a>
          <a href="#services" className="nav-link">Services</a>
          <a href="#programs" className="nav-link">Programs</a>
          <a href="#events" className="nav-link">Events</a>
          <a href="#news" className="nav-link">News</a>
          <a href="#teachers" className="nav-link">Teachers</a>
          <a href="#contact" className="nav-link">Contact</a>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button 
            onClick={() => setIsDark(!isDark)} 
            style={{ 
              background: "none", 
              border: "none", 
              cursor: "pointer", 
              color: "var(--c-slate-700)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              padding: "8px",
              borderRadius: "50%",
              transition: "background-color 0.2s"
            }}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="theme-toggle-btn"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <button className="login-btn navbar-login-btn" onClick={() => navigate("/login")}>
            LOGIN
          </button>
          <button className="apply-btn navbar-apply-btn" onClick={() => navigate("/login")}>
            APPLY NOW
          </button>

          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* ── MOBILE MENU OVERLAY ── */}
      <div className={`mobile-menu-drawer ${isMobileMenuOpen ? "open" : ""}`}>
        <div className="mobile-menu-backdrop" onClick={() => setIsMobileMenuOpen(false)} />
        <div className="mobile-menu-content">
          <div className="mobile-menu-header">
            <div className="logo-container" onClick={() => { window.scrollTo(0, 0); setIsMobileMenuOpen(false); }}>
              <div className="logo-icon-box" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <GraduationCap size={18} />
              </div>
              <span className="logo-text">EduSphere</span>
            </div>
            <button className="mobile-menu-close" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={24} style={{ color: "var(--c-slate-900)" }} />
            </button>
          </div>
          
          <nav className="mobile-nav-links">
            <a href="#home" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>HOME</a>
            <a href="#about" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>About Us</a>
            <a href="#services" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Services</a>
            <a href="#programs" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Programs</a>
            <a href="#events" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Events</a>
            <a href="#news" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>News</a>
            <a href="#teachers" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Teachers</a>
            <a href="#contact" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Contact</a>
          </nav>

          <div className="mobile-menu-footer" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button className="login-btn" style={{ width: "100%" }} onClick={() => { navigate("/login"); setIsMobileMenuOpen(false); }}>
              LOGIN
            </button>
            <button className="apply-btn" style={{ width: "100%" }} onClick={() => { navigate("/login"); setIsMobileMenuOpen(false); }}>
              APPLY NOW
            </button>
          </div>
        </div>
      </div>

      {/* ── HERO SECTION ── */}
      <section id="home" className="hero-section">
        
        {/* Background Slideshow */}
        <div className="hero-slideshow">
          {slideshowImages.map((img, idx) => (
            <div
              key={idx}
              className={`hero-slide ${activeSlide === idx ? "active" : ""}`}
              style={{ backgroundImage: `url(${img})` }}
            />
          ))}
          <div className="hero-slideshow-overlay" />
        </div>

        <div className="section-container hero-grid">
          <div className="hero-left">
            <span className="section-label" style={{ background: "var(--c-primary-light)", color: "var(--c-primary)", padding: "6px 12px", borderRadius: "99px", display: "inline-block", fontSize: "11px", fontWeight: "800", letterSpacing: "1px", marginBottom: "16px" }}>
              MULTIPORTAL SCHOOL SAAS PLATFORM
            </span>
            <h1 className="hero-title" style={{ fontSize: "44px" }}>
              All-in-One School Management <span className="blue-text">SaaS ERP</span>
            </h1>
            <p className="hero-subtitle" style={{ fontSize: "14.5px" }}>
              EduSphere is a cloud-based SaaS platform connecting multi-campus administrators, finance managers, educators, and parents into one synchronized database.
            </p>
            <div className="hero-btn-group">
              <button className="btn-filled" onClick={() => navigate("/login")}>Get Started Free</button>
              <button className="btn-outline" onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}>See System Features</button>
            </div>
            
            <div className="hero-badges">
              <div className="hero-badge-item">
                <span className="hero-badge-dot dot-yellow"></span>
                <span>500+ Schools Onboarded</span>
              </div>
              <div className="hero-badge-item">
                <span className="hero-badge-dot dot-red"></span>
                <span>1.5L+ Active Pupils</span>
              </div>
              <div className="hero-badge-item">
                <span className="hero-badge-dot dot-green"></span>
                <span>12+ Indian States</span>
              </div>
            </div>
          </div>

          <div className="hero-right hero-graphic-container">
            <div className="hero-circle-bg">
              <div className="hero-student-img-wrapper">
                <img src={indianKidsBooks} alt="Indian students sharing books" className="hero-student-img" />
              </div>
              <div className="hero-ring landing-ring-1"></div>
              <div className="hero-ring landing-ring-2"></div>
            </div>

            {/* Floating Badges */}
            <div className="floating-badge badge-left">
              <div className="floating-badge-icon">
                <Users size={16} />
              </div>
              <div>
                <div className="floating-badge-title">Active Pupils</div>
                <div className="floating-badge-val">1.5L+</div>
              </div>
            </div>

            <div className="floating-badge badge-top-right">
              <div className="floating-badge-icon">
                <Activity size={16} />
              </div>
              <div>
                <div className="floating-badge-title">Server Uptime</div>
                <div className="floating-badge-val">99.99%</div>
              </div>
            </div>

            <div className="floating-badge badge-bottom-right">
              <div className="floating-badge-icon">
                <UserCheck size={16} />
              </div>
              <div>
                <div className="floating-badge-title">Staff Members</div>
                <div className="floating-badge-val">74</div>
              </div>
            </div>
          </div>
        </div>

        {/* Infinite Scrolling Partner Marquee */}
        <div className="logo-marquee-container">
          <div className="logo-marquee-title">TRUSTED BY LEADING SCHOOLS ACROSS INDIA</div>
          <div className="logo-marquee-track">
            {/* First Set */}
            {partnerSchools.map((school, idx) => (
              <div key={`p1-${idx}`} className="logo-marquee-item">
                <GraduationCap className="logo-marquee-icon" size={16} />
                <span>{school.name}</span>
              </div>
            ))}
            {/* Duplicate Set for Infinite Loop */}
            {partnerSchools.map((school, idx) => (
              <div key={`p2-${idx}`} className="logo-marquee-item">
                <GraduationCap className="logo-marquee-icon" size={16} />
                <span>{school.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT OUR SCHOOL ── */}
      <section id="about" className="about-section">
        <div className="section-container about-grid">
          <div className="about-left">
            <span className="section-label">LEARN ABOUT OUR HISTORY, MISSION, AND VALUES.</span>
            <h2 className="section-title">About EduSphere</h2>
            <p className="section-subtitle" style={{ marginBottom: "24px" }}>
              EduSphere integrates notice boards, student profiles, fee collections, timetables, and transport GPS systems into one unified SaaS console. We connect multi-campus school branches to one secure database.
            </p>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "32px" }}>
              <div>
                <div style={{ fontSize: "28px", fontWeight: "900", color: "var(--c-primary)", fontFamily: "var(--font-title)", lineHeight: 1.1 }}>500+</div>
                <div style={{ fontSize: "13px", color: "var(--c-slate-500)", fontWeight: "500", marginTop: 4 }}>Schools Onboarded</div>
              </div>
              <div>
                <div style={{ fontSize: "28px", fontWeight: "900", color: "var(--c-primary)", fontFamily: "var(--font-title)", lineHeight: 1.1 }}>1.5L+</div>
                <div style={{ fontSize: "13px", color: "var(--c-slate-500)", fontWeight: "500", marginTop: 4 }}>Active Students</div>
              </div>
              <div>
                <div style={{ fontSize: "28px", fontWeight: "900", color: "var(--c-primary)", fontFamily: "var(--font-title)", lineHeight: 1.1 }}>12+</div>
                <div style={{ fontSize: "13px", color: "var(--c-slate-500)", fontWeight: "500", marginTop: 4 }}>Indian States</div>
              </div>
              <div>
                <div style={{ fontSize: "28px", fontWeight: "900", color: "var(--c-primary)", fontFamily: "var(--font-title)", lineHeight: 1.1 }}>99.99%</div>
                <div style={{ fontSize: "13px", color: "var(--c-slate-500)", fontWeight: "500", marginTop: 4 }}>Platform Uptime</div>
              </div>
            </div>

            <button className="btn-filled" onClick={() => document.getElementById("programs")?.scrollIntoView({ behavior: "smooth" })}>LEARN MORE</button>
          </div>

          <div className="about-right about-images-grid">
            <div className="about-img-card about-img-1">
              <img src={schoolBuilding} alt="School building campus" className="about-img" />
            </div>
            <div className="about-img-card about-img-2" style={{ position: "relative" }}>
              <img src={rajeshImg} alt="Dr. Rajesh Kumar - Owner" className="about-img" style={{ objectPosition: "top" }} />
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: "linear-gradient(0deg, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0) 100%)",
                padding: "16px 12px 8px", color: "#FFFFFF", textAlign: "center"
              }}>
                <div style={{ fontSize: "14px", fontWeight: "700" }}>Dr. Rajesh Kumar</div>
                <div style={{ fontSize: "11px", opacity: 0.8, fontWeight: "500" }}>Founder & Director</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROGRAMS SECTION ── */}
      <section id="programs" className="programs-section">
        <div className="section-container">
          <div className="title-center">
            <span className="section-label">ONE PLATFORM FOR SUPER ADMIN, ADMINS, TEACHERS & PARENTS</span>
            <h2 className="section-title">Role-Based SaaS Dashboards</h2>
            <p className="section-subtitle">
              EduSphere is custom-built with tailored panels and access rights for each of the four core user roles, ensuring secure administration and easy collaboration.
            </p>
          </div>

          <div className="programs-slider-container">
            <div 
              className="programs-grid"
              style={{
                transform: viewportWidth <= 1024 ? `translateX(-${activeProgramTab * (100 / programs.length)}%)` : "none"
              }}
            >
              {programs.map((program, idx) => (
                <div key={idx} className="program-card">
                  <div className="program-img-wrapper">
                    <img src={program.image} alt={program.title} className="program-img" />
                    <span className="program-badge">{program.badge}</span>
                    <span className="program-duration">{program.duration}</span>
                  </div>
                  <div className="program-content">
                    <h3 className="program-card-title">{program.title}</h3>
                    <p className="program-desc">{program.desc}</p>
                    <div className="program-meta">
                      <div className="program-rating">
                        <span className="stars">★★★★★</span>
                        <span>{program.rating}</span>
                        <span className="count">({program.reviews})</span>
                      </div>
                      <div className="program-price">{program.price}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="carousel-dots">
            {programs.map((_, idx) => (
              <div
                key={idx}
                className={`carousel-dot ${activeProgramTab === idx ? "active" : ""}`}
                onClick={() => setActiveProgramTab(idx)}
              ></div>
            ))}
          </div>

          {/* Feature Access Comparison Matrix */}
          <div style={{ marginTop: "60px", background: "var(--c-slate-50)", borderRadius: "24px", padding: "40px", border: "1px solid var(--c-slate-100)", marginBottom: "48px" }} className="feature-comparison-box">
            <h3 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "8px", textAlign: "center", color: "var(--c-slate-900)" }}>Feature Access Matrix</h3>
            <p style={{ fontSize: "14px", color: "var(--c-slate-500)", marginBottom: "32px", textAlign: "center" }}>Compare platform permissions, tools and accessibility across different roles</p>
            
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "650px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--c-slate-200)" }}>
                    <th style={{ padding: "16px", color: "var(--c-slate-900)", fontWeight: "800", fontSize: "14px" }}>MODULE / FEATURE</th>
                    <th style={{ padding: "16px", color: "var(--c-primary)", fontWeight: "800", fontSize: "14px", textAlign: "center" }}>SUPER ADMIN</th>
                    <th style={{ padding: "16px", color: "var(--c-slate-900)", fontWeight: "800", fontSize: "14px", textAlign: "center" }}>SCHOOL ADMIN</th>
                    <th style={{ padding: "16px", color: "var(--c-slate-900)", fontWeight: "800", fontSize: "14px", textAlign: "center" }}>TEACHER</th>
                    <th style={{ padding: "16px", color: "var(--c-slate-900)", fontWeight: "800", fontSize: "14px", textAlign: "center" }}>PARENT & STUDENT</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Multi-Campus Control Console", super: "Full Control", admin: "Single Campus", teacher: "—", parent: "—" },
                    { name: "SaaS Subscription & Invoices", super: "Manage & Bill", admin: "View & Pay", teacher: "—", parent: "—" },
                    { name: "Principal & Staff Registration", super: "Yes", admin: "Full Access", teacher: "—", parent: "—" },
                    { name: "Timetable Auto-Generator", super: "Manage", admin: "Create / Edit", teacher: "View Only", parent: "View Only" },
                    { name: "Digital Fee Gateway", super: "Configure API", admin: "Refunds / Ledger", teacher: "—", parent: "Pay Tuition" },
                    { name: "GPS School Bus Tracker", super: "Admin Control", admin: "Route Config", teacher: "—", parent: "Live Map View" },
                    { name: "Attendance & Grading Logs", super: "System Audits", admin: "Reports Access", teacher: "Mark / Submit", parent: "Monthly Graph" },
                    { name: "Homework & Class Diaries", super: "System Audits", admin: "Overview", teacher: "Post & Grade", parent: "Download Assignments" },
                    { name: "Broadcast Notifications", super: "Global System", admin: "School Level", teacher: "Class Level", parent: "Receive Alerts" }
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--c-slate-100)", transition: "background-color 0.2s" }}>
                      <td style={{ padding: "16px", color: "var(--c-slate-900)", fontWeight: "600", fontSize: "13.5px" }}>{row.name}</td>
                      <td style={{ padding: "16px", color: "var(--c-primary)", fontSize: "13px", fontWeight: "700", textAlign: "center" }}>{row.super}</td>
                      <td style={{ padding: "16px", color: "var(--c-slate-800)", fontSize: "13px", fontWeight: "600", textAlign: "center" }}>{row.admin}</td>
                      <td style={{ padding: "16px", color: "var(--c-slate-800)", fontSize: "13px", fontWeight: "500", textAlign: "center" }}>{row.teacher}</td>
                      <td style={{ padding: "16px", color: "var(--c-slate-800)", fontSize: "13px", fontWeight: "500", textAlign: "center" }}>{row.parent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 13 Core Modules Section */}
          <div style={{ marginTop: "80px", marginBottom: "60px" }}>
            <div className="title-center" style={{ marginBottom: "40px" }}>
              <span className="section-label">COMPREHENSIVE ENTERPRISE RESOURCE PLANNING</span>
              <h3 style={{ fontSize: "28px", fontWeight: "800", color: "var(--c-slate-900)" }}>13 Core Management Modules</h3>
              <p style={{ fontSize: "14px", color: "var(--c-slate-500)", maxWidth: "600px", margin: "8px auto 0" }}>
                Our SaaS system includes all thirteen functional modules to automate and power your entire educational campus operations.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }} className="modules-explorer-grid">
              {smsModules.map((mod, idx) => (
                <div key={idx} className="module-card-hover">
                  <div className="module-img-container">
                    <img src={mod.image} alt={mod.title} className="module-img" />
                    <div className="module-icon-badge">
                      {mod.icon}
                    </div>
                  </div>
                  <div style={{ padding: "20px" }}>
                    <h4 style={{ fontSize: "14.5px", fontWeight: "700", color: "var(--c-slate-900)", marginBottom: "6px" }}>{mod.title}</h4>
                    <p style={{ fontSize: "12.5px", color: "var(--c-slate-500)", lineHeight: "1.45" }}>{mod.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="center-btn-wrapper">
            <button className="btn-filled" onClick={() => navigate("/login")}>
              Get Started Free
            </button>
          </div>
        </div>
      </section>

      {/* ── UPCOMING EVENTS ── */}
      <section id="events" className="events-section">
        <div className="section-container events-grid">
          <div className="events-left">
            <span className="section-label">DON'T MISS OUR UPCOMING EVENTS.</span>
            <h2 className="section-title">Upcoming Events</h2>
            <p className="section-subtitle" style={{ marginBottom: "32px" }}>
              Stay up-to-date with all the exciting events happening at School. From school fairs to parent-teacher meetings, there's always something happening.
            </p>
            
            <div className="events-list">
              {events.map((event, idx) => (
                <div
                  key={idx}
                  className={`event-row ${activeEvent === idx ? "active" : ""}`}
                  onClick={() => setActiveEvent(idx)}
                >
                  <div className="event-info">
                    <span className="event-date">{event.date}</span>
                    <span className="event-title">{event.title}</span>
                  </div>
                  <div className="event-arrow">
                    <ArrowRight size={20} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="events-right">
            <div className="event-image-wrapper">
              <img src={events[activeEvent].image} alt={events[activeEvent].title} className="event-image" />
            </div>
          </div>
        </div>
      </section>

      {/* ── LATEST NEWS ── */}
      <section id="news" className="news-section">
        <div className="section-container">
          <div className="news-header-actions">
            <div>
              <span className="section-label">GET THE LATEST NEWS AND UPDATES</span>
              <h2 className="section-title" style={{ marginBottom: 0 }}>Get The Latest News And Updates</h2>
              <p className="section-subtitle" style={{ marginBottom: 0, marginTop: "8px" }}>
                Keep track of the latest news and important announcements from our school. Here you'll find updates on school policies, achievements, and more.
              </p>
            </div>
            {!showAllNews && (
              <div className="news-arrows">
                <button 
                  className={`news-arrow-btn ${activeNewsSlide === 0 ? "disabled" : ""}`}
                  onClick={handlePrevNews}
                  disabled={activeNewsSlide === 0}
                  aria-label="Previous News"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  className={`news-arrow-btn ${activeNewsSlide >= maxNewsIndex ? "disabled" : ""}`}
                  onClick={handleNextNews}
                  disabled={activeNewsSlide >= maxNewsIndex}
                  aria-label="Next News"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>

          {showAllNews ? (
            <div className="news-grid-all">
              {newsList.map((news, idx) => (
                <div key={idx} className="news-card">
                  <div className="news-img-wrapper">
                    <img src={news.image} alt={news.title} className="news-img" />
                  </div>
                  <div className="news-content">
                    <div className="news-meta">
                      <span className="news-tag">{news.tag}</span>
                      <span className="news-date">{news.date}</span>
                    </div>
                    <h3 className="news-card-title">{news.title}</h3>
                    <button 
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }} 
                      onClick={(e) => { e.preventDefault(); setSelectedNews(news); }}
                      className="news-readmore"
                    >
                      Read More <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="news-slider-container">
              <div 
                className="news-slider-track"
                style={{
                  transform: `translateX(-${activeNewsSlide * (100 / newsList.length)}%)`,
                  display: "flex",
                  transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                  width: `${(newsList.length / visibleNewsCount) * 100}%`
                }}
              >
                {newsList.map((news, idx) => (
                  <div 
                    key={idx} 
                    className="news-card news-slide"
                    style={{
                      width: `${100 / newsList.length}%`,
                      flexShrink: 0
                    }}
                  >
                    <div className="news-img-wrapper">
                      <img src={news.image} alt={news.title} className="news-img" />
                    </div>
                    <div className="news-content">
                      <div className="news-meta">
                        <span className="news-tag">{news.tag}</span>
                        <span className="news-date">{news.date}</span>
                      </div>
                      <h3 className="news-card-title">{news.title}</h3>
                      <button 
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }} 
                        onClick={(e) => { e.preventDefault(); setSelectedNews(news); }}
                        className="news-readmore"
                      >
                        Read More <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="center-btn-wrapper">
            <button className="btn-outline" onClick={() => { setShowAllNews(!showAllNews); setActiveNewsSlide(0); }}>
              {showAllNews ? "Show Less" : "View All"} <ArrowRight size={14} style={{ marginLeft: 4 }} />
            </button>
          </div>
        </div>
      </section>

      {/* ── MEET OUR TEACHERS ── */}
      <section id="teachers" className="teachers-section">
        <div className="section-container">
          <div className="title-center">
            <span className="section-label">LEARN ABOUT OUR DEDICATED TEACHERS</span>
            <h2 className="section-title">Meet Our Teachers</h2>
            <p className="section-subtitle">
              Our teachers are passionate about education and committed to helping each student succeed. With a wealth of experience and expertise, they create a supportive and inspiring learning environment.
            </p>
          </div>

          <div className="teachers-grid">
            {teachers.map((teacher, idx) => (
              <div key={idx} className="teacher-card">
                <div className="teacher-img-wrapper">
                  <img src={teacher.img || teacherStaff} alt={teacher.name} className="teacher-img" />
                </div>
                <h4 className="teacher-name">{teacher.name}</h4>
                <span className="teacher-subject">{teacher.subject}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS SECTION ── */}
      <section className="testimonials-section">
        <div className="section-container">
          <div className="title-center">
            <span className="section-label">READ TESTIMONIALS FROM OUR COMMUNITY</span>
            <h2 className="section-title">What Parents And Students Say</h2>
            <p className="section-subtitle">
              Hear from those who know us best. Our parents and students share their experiences and the impact our school has had on their lives.
            </p>
          </div>

          <div className="testimonial-slider-container">
            <button className="slider-arrow" onClick={handlePrevTestimonial}>
              <ChevronLeft size={24} />
            </button>

            <div className="testimonial-bubble">
              <img
                src={testimonials[activeTestimonial].img}
                alt={testimonials[activeTestimonial].name}
                className="testimonial-avatar"
              />
              <p className="testimonial-quote">
                "{testimonials[activeTestimonial].quote}"
              </p>
              <h4 className="testimonial-author-name">
                {testimonials[activeTestimonial].name}
              </h4>
              <span className="testimonial-author-role">
                {testimonials[activeTestimonial].role}
              </span>
            </div>

            <button className="slider-arrow" onClick={handleNextTestimonial}>
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </section>

      
      {/* ── OUR SERVICES & MODULES SHOWCASE ── */}
      <section id="services" className="services-section" style={{ padding: "90px 0", background: "#FFFFFF" }}>
        <div className="section-container">
          <div className="title-center">
            <span className="section-label">COMPLETE ALL-IN-ONE EDUCATIONAL SAAS SOLUTION</span>
            <h2 className="section-title">Our Services & Management Suite</h2>
            <p className="section-subtitle">
              EduSphere integrates every administrative domain into one seamless cloud workspace. From automated student attendance to live transport tracking and hostel allocations.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "30px", marginTop: "50px" }}>
            
            {/* 1. Hostel Management */}
            <div className="module-card-hover" style={{ padding: "32px", borderRadius: "20px", background: "var(--c-slate-50)", border: "1px solid var(--c-slate-100)" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(26, 140, 255, 0.1)", color: "var(--c-primary)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                <Home size={26} />
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: "800", color: "var(--c-slate-900)", marginBottom: "10px" }}>Hostel & Dormitory Suite</h3>
              <p style={{ fontSize: "14px", color: "var(--c-slate-600)", lineHeight: "1.6", marginBottom: "16px" }}>
                Complete hostel room allocations, room inventory tracking, damage ledgers, visitor logbooks, warden desk controls, and fee payment receipts.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "6px", background: "#FFFFFF", border: "1px solid var(--c-slate-200)", color: "var(--c-slate-700)" }}>Room Allotments</span>
                <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "6px", background: "#FFFFFF", border: "1px solid var(--c-slate-200)", color: "var(--c-slate-700)" }}>Damage Ledger</span>
                <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "6px", background: "#FFFFFF", border: "1px solid var(--c-slate-200)", color: "var(--c-slate-700)" }}>Warden Portal</span>
              </div>
            </div>

            {/* 2. Digital Library */}
            <div className="module-card-hover" style={{ padding: "32px", borderRadius: "20px", background: "var(--c-slate-50)", border: "1px solid var(--c-slate-100)" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(139, 92, 246, 0.1)", color: "#8B5CF6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                <BookOpen size={26} />
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: "800", color: "var(--c-slate-900)", marginBottom: "10px" }}>Digital Library System</h3>
              <p style={{ fontSize: "14px", color: "var(--c-slate-600)", lineHeight: "1.6", marginBottom: "16px" }}>
                Smart book cataloging with ISBN search, issue & return logs, automatic overdue fine calculators, and category-wise stock analytics.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "6px", background: "#FFFFFF", border: "1px solid var(--c-slate-200)", color: "var(--c-slate-700)" }}>ISBN Catalog</span>
                <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "6px", background: "#FFFFFF", border: "1px solid var(--c-slate-200)", color: "var(--c-slate-700)" }}>Issue & Return</span>
                <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "6px", background: "#FFFFFF", border: "1px solid var(--c-slate-200)", color: "var(--c-slate-700)" }}>Fine Calculator</span>
              </div>
            </div>

            {/* 3. Biometrics & Attendance */}
            <div className="module-card-hover" style={{ padding: "32px", borderRadius: "20px", background: "var(--c-slate-50)", border: "1px solid var(--c-slate-100)" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(16, 185, 129, 0.1)", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                <UserCheck size={26} />
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: "800", color: "var(--c-slate-900)", marginBottom: "10px" }}>Biometrics & Attendance Log</h3>
              <p style={{ fontSize: "14px", color: "var(--c-slate-600)", lineHeight: "1.6", marginBottom: "16px" }}>
                Hardware integration for thumb/facial biometrics, automated daily attendance logs, teacher register, and SMS absentee notifications.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "6px", background: "#FFFFFF", border: "1px solid var(--c-slate-200)", color: "var(--c-slate-700)" }}>RFID / Thumb Sync</span>
                <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "6px", background: "#FFFFFF", border: "1px solid var(--c-slate-200)", color: "var(--c-slate-700)" }}>Absentee Alerts</span>
                <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "6px", background: "#FFFFFF", border: "1px solid var(--c-slate-200)", color: "var(--c-slate-700)" }}>Staff Logs</span>
              </div>
            </div>

            {/* 4. Live Bus GPS Tracking */}
            <div className="module-card-hover" style={{ padding: "32px", borderRadius: "20px", background: "var(--c-slate-50)", border: "1px solid var(--c-slate-100)" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(245, 158, 11, 0.1)", color: "#F59E0B", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                <Truck size={26} />
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: "800", color: "var(--c-slate-900)", marginBottom: "10px" }}>Live Bus GPS Tracking</h3>
              <p style={{ fontSize: "14px", color: "var(--c-slate-600)", lineHeight: "1.6", marginBottom: "16px" }}>
                GT06 protocol hardware gateway, driver mobile console, stop-by-stop route optimization, and real-time live map tracking on parent app.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "6px", background: "#FFFFFF", border: "1px solid var(--c-slate-200)", color: "var(--c-slate-700)" }}>GT06 Gateway</span>
                <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "6px", background: "#FFFFFF", border: "1px solid var(--c-slate-200)", color: "var(--c-slate-700)" }}>Driver App</span>
                <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "6px", background: "#FFFFFF", border: "1px solid var(--c-slate-200)", color: "var(--c-slate-700)" }}>Parent Live Map</span>
              </div>
            </div>

            {/* 5. Academic & Examinations */}
            <div className="module-card-hover" style={{ padding: "32px", borderRadius: "20px", background: "var(--c-slate-50)", border: "1px solid var(--c-slate-100)" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(239, 68, 68, 0.1)", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                <Award size={26} />
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: "800", color: "var(--c-slate-900)", marginBottom: "10px" }}>Academic & Examination Hub</h3>
              <p style={{ fontSize: "14px", color: "var(--c-slate-600)", lineHeight: "1.6", marginBottom: "16px" }}>
                Conflict-free class timetable scheduling, homework assignments submission portal, digital report cards, and automated marksheet generation.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "6px", background: "#FFFFFF", border: "1px solid var(--c-slate-200)", color: "var(--c-slate-700)" }}>Timetables</span>
                <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "6px", background: "#FFFFFF", border: "1px solid var(--c-slate-200)", color: "var(--c-slate-700)" }}>Homework Portal</span>
                <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "6px", background: "#FFFFFF", border: "1px solid var(--c-slate-200)", color: "var(--c-slate-700)" }}>Report Cards</span>
              </div>
            </div>

            {/* 6. Multi-Tenant SaaS Roles */}
            <div className="module-card-hover" style={{ padding: "32px", borderRadius: "20px", background: "var(--c-slate-50)", border: "1px solid var(--c-slate-100)" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(14, 165, 233, 0.1)", color: "#0EA5E9", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                <Layers size={26} />
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: "800", color: "var(--c-slate-900)", marginBottom: "10px" }}>6-Role Multi-Tenant SaaS</h3>
              <p style={{ fontSize: "14px", color: "var(--c-slate-600)", lineHeight: "1.6", marginBottom: "16px" }}>
                Dedicated role-based security portals for Super Admin, School Admin, Teachers, Parents/Students, Bus Drivers, and Hostel Wardens.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "6px", background: "#FFFFFF", border: "1px solid var(--c-slate-200)", color: "var(--c-slate-700)" }}>Super Admin</span>
                <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "6px", background: "#FFFFFF", border: "1px solid var(--c-slate-200)", color: "var(--c-slate-700)" }}>School Admin</span>
                <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "6px", background: "#FFFFFF", border: "1px solid var(--c-slate-200)", color: "var(--c-slate-700)" }}>Teacher & Parent</span>
              </div>
            </div>

          </div>
        </div>
      </section>


            {/* ── CONTACT & HELP SECTION ── */}
      <section id="contact" className="contact-section">
        <div className="section-container">
          <div className="title-center">
            <span className="section-label">REACH OUT TO US FOR MORE INFORMATION.</span>
            <h2 className="section-title">We're Here To Help</h2>
            <p className="section-subtitle">
              Have questions or need more information? Contact us today and we'll be happy to assist you. We look forward to hearing from you!
            </p>
          </div>

          <div className="contact-grid" style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: "40px", background: "none", boxShadow: "none", border: "none" }}>
            
            {/* Left Column: Info and Map (Swapped from Right to Left!) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div className="contact-info-block" style={{ borderRadius: "20px", padding: "40px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <h3 className="contact-info-title" style={{ fontSize: "22px", marginBottom: "20px" }}>Get in touch</h3>
                
                <div className="contact-details" style={{ gap: "20px" }}>
                  <div className="contact-detail-item">
                    <Mail className="contact-detail-icon" />
                    <div>
                      <div className="contact-detail-label">EMAIL US</div>
                      <div className="contact-detail-value">npdigitalsolutions001@gmail.com</div>
                    </div>
                  </div>

                  <div className="contact-detail-item">
                    <Phone className="contact-detail-icon" />
                    <div>
                      <div className="contact-detail-label">PHONE NUMBER</div>
                      <div className="contact-detail-value">+91 9509167614</div>
                    </div>
                  </div>

                  <div className="contact-detail-item">
                    <MapPin className="contact-detail-icon" />
                    <div>
                      <div className="contact-detail-label">ADDRESS</div>
                      <div className="contact-detail-value">1st floor Nanda building Ambay Market, Jamuna Dairy, Sodala, Jaipur, Rajasthan 302006</div>
                    </div>
                  </div>
                </div>

                <div className="contact-socials" style={{ marginTop: "24px" }}>
                  <a href="https://www.facebook.com/profile.php?id=61574331538312" target="_blank" rel="noopener noreferrer" className="social-circle" aria-label="Facebook"><Facebook size={16} /></a>
                  <a href="https://www.instagram.com/npdigitalsolutions001/" target="_blank" rel="noopener noreferrer" className="social-circle" aria-label="Instagram"><Instagram size={16} /></a>
                  <a href="https://www.linkedin.com/in/np-digital-solutions-a8b162400/" target="_blank" rel="noopener noreferrer" className="social-circle" aria-label="LinkedIn"><Linkedin size={16} /></a>
                  <a href="https://github.com/npdigitalsolutions001" target="_blank" rel="noopener noreferrer" className="social-circle" aria-label="GitHub"><Github size={16} /></a>
                </div>
              </div>

              {/* Map embed */}
              <div style={{ background: "#FFFFFF", borderRadius: "20px", overflow: "hidden", border: "1px solid var(--c-slate-100)", boxShadow: "0 20px 50px rgba(15, 23, 42, 0.04)", height: "250px" }}>
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1186.9402846792677!2d75.77138001788163!3d26.902462148173132!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396db4657e04180d%3A0xd39e8f2a5d295ffe!2sAmbey%20Market%2C%20Jamuna%20Dairy%2C%20Gayatri%20Nagar%2C%20Sodala%2C%20Jaipur%2C%20Rajasthan%20302006!5e0!3m2!1sen!2sin!4v1774947591241!5m2!1sen!2sin" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen="" 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>

            {/* Right Form Column (Swapped from Left to Right!) */}
            <div className="contact-form-block" style={{ background: "#FFFFFF", padding: "48px", borderRadius: "20px", border: "1px solid var(--c-slate-100)", boxShadow: "0 20px 50px rgba(15, 23, 42, 0.04)" }}>
              <h3 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "24px", color: "var(--c-slate-900)" }}>Send Us a Message</h3>
              {formSent ? (
                <div style={{ textAlign: "center", padding: "40px 10px" }}>
                  <div style={{
                    width: 58, height: 58, backgroundColor: "rgba(0, 204, 136, 0.1)", borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
                    color: "#00CC88"
                  }}>
                    <Check size={30} />
                  </div>
                  <h4 style={{ fontSize: 18, fontWeight: 700, color: "var(--c-slate-900)", marginBottom: 6 }}>Message Sent!</h4>
                  <p style={{ fontSize: 14, color: "var(--c-slate-500)" }}>We will get back to you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit}>
                  <div className="contact-form-grid">
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input
                        required
                        type="text"
                        className="form-input"
                        placeholder="e.g. John Doe"
                        value={contactForm.name}
                        onChange={e => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input
                        required
                        type="email"
                        className="form-input"
                        placeholder="e.g. john@example.com"
                        value={contactForm.email}
                        onChange={e => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Subjects</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Admission Enquiry"
                        value={contactForm.subject}
                        onChange={e => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">School / Institute Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Delhi Public School"
                        value={contactForm.company}
                        onChange={e => setContactForm(prev => ({ ...prev, company: e.target.value }))}
                      />
                    </div>
                    <div className="form-group-full">
                      <label className="form-label">Message</label>
                      <textarea
                        required
                        rows={4}
                        className="form-input"
                        placeholder="Write your message here..."
                        value={contactForm.message}
                        onChange={e => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-filled" style={{ width: "100%", marginTop: 8 }}>
                    Send Message
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ── ANSWER YOUR INQUIRY SECTION ── */}
      <section style={{ padding: "60px 0", background: "var(--c-primary-light)", borderTop: "1px solid var(--c-slate-100)", borderBottom: "1px solid var(--c-slate-100)" }} className="inquiry-section">
        <div className="section-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <span className="section-label" style={{ color: "var(--c-primary)", background: "rgba(26, 140, 255, 0.12)", padding: "6px 16px", borderRadius: "99px", fontWeight: "700", letterSpacing: "1px", marginBottom: "16px", fontSize: "11px" }}>GOT QUESTIONS? CONNECT INSTANTLY</span>
          <h2 style={{ fontSize: "32px", fontWeight: "800", color: "var(--c-slate-900)", marginBottom: "12px", lineHeight: "1.2" }}>Answer Your Inquiry</h2>
          <p style={{ fontSize: "14.5px", color: "var(--c-slate-500)", maxWidth: "600px", marginBottom: "32px", lineHeight: "1.6" }}>
            Our dedicated school administration support desk is available 24/7. Connect directly via WhatsApp or phone call for immediate answers to your onboarding inquiries.
          </p>

          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
            {/* WhatsApp CTA */}
            <a 
              href="https://wa.me/919509167614" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "12px", 
                backgroundColor: "#25D366", 
                color: "#FFFFFF", 
                padding: "14px 28px", 
                borderRadius: "12px", 
                fontWeight: "700", 
                fontSize: "14.5px", 
                boxShadow: "0 6px 20px rgba(37, 211, 102, 0.25)",
                transition: "transform 0.2s, box-shadow 0.2s" 
              }}
              className="inquiry-btn hover-grow"
            >
              <MessageCircle size={20} fill="#FFFFFF" />
              <span>Connect on WhatsApp</span>
            </a>

            {/* Phone Call CTA */}
            <a 
              href="tel:+919509167614" 
              style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "12px", 
                backgroundColor: "var(--c-primary)", 
                color: "#FFFFFF", 
                padding: "14px 28px", 
                borderRadius: "12px", 
                fontWeight: "700", 
                fontSize: "14.5px", 
                boxShadow: "0 6px 20px rgba(26, 140, 255, 0.25)",
                transition: "transform 0.2s, box-shadow 0.2s" 
              }}
              className="inquiry-btn hover-grow"
            >
              <PhoneCall size={20} />
              <span>Call Direct Hotline</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER BOARD ── */}
      <footer className="footer">
        <div className="section-container footer-grid">
          
          <div>
            <div className="logo-container" style={{ marginBottom: "20px" }}>
              <div className="logo-icon-box" style={{ background: "rgba(255, 255, 255, 0.15)", color: "#FFFFFF", border: "none", display: "flex", alignItems: "center", gap: "6px" }}>
                <GraduationCap size={16} />
              </div>
              <span className="logo-text" style={{ color: "#FFFFFF" }}>EduSphere</span>
            </div>
            <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.5)", marginBottom: "20px", lineHeight: "1.5" }}>
              The next-generation SaaS workspace connecting multi-campus school branches to one secure database.
            </p>
            <div className="footer-address">
              <span>Address:</span>
              <span style={{ color: "#FFFFFF" }}>Ambay Market, Sodala,<br />Jaipur, Rajasthan 302006</span>
            </div>
          </div>

          <div>
            <h5>Programs</h5>
            <div className="footer-links">
              <a href="#programs" className="footer-link">Science</a>
              <a href="#programs" className="footer-link">Arts</a>
              <a href="#programs" className="footer-link">Commerce</a>
            </div>
          </div>

          <div>
            <h5>Info</h5>
            <div className="footer-links">
              <a href="#about" className="footer-link">About us</a>
              <a href="#events" className="footer-link">Activities</a>
              <a href="#news" className="footer-link">News</a>
              <a href="#events" className="footer-link">Events</a>
              <a href="#teachers" className="footer-link">Teachers</a>
            </div>
          </div>

          <div>
            <h5>Get a consultation</h5>
            <p style={{ marginBottom: "20px", fontSize: "13px" }}>Leave your email to receive weekly campus reports, newsletters and upcoming event announcements.</p>
            <form onSubmit={handleNewsletterSubmit} style={{ display: "flex", gap: "8px" }}>
              <input 
                type="email" 
                placeholder="Email address" 
                className="form-input" 
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#FFFFFF" }} 
                value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
                required
              />
              <button type="submit" className="apply-btn" style={{ borderRadius: "6px" }} aria-label="Subscribe"><ArrowRight size={16} /></button>
            </form>
          </div>

        </div>

        <div className="section-container footer-bottom">
          <span className="footer-copyright">© 2026 EduSphere SaaS. All rights reserved.</span>
          <div className="footer-bottom-info">
            <span>+91 9509167614</span>
            <span>npdigitalsolutions001@gmail.com</span>
          </div>
        </div>
      </footer>

      {/* ── NEWS MODAL OVERLAY ── */}
      {selectedNews && (
        <div 
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999, padding: "20px"
          }}
          onClick={() => setSelectedNews(null)}
        >
          <div 
            style={{
              backgroundColor: "var(--c-slate-50)",
              border: "1px solid var(--c-slate-200)",
              borderRadius: "24px",
              width: "100%",
              maxWidth: "600px",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              animation: "modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              position: "relative"
            }}
            onClick={(e) => e.stopPropagation()}
            className="modal-content-card"
          >
            <button 
              onClick={() => setSelectedNews(null)}
              style={{
                position: "absolute", top: "16px", right: "16px",
                width: "36px", height: "36px", borderRadius: "50%",
                background: "rgba(15, 23, 42, 0.5)", border: "none",
                color: "#FFFFFF", fontSize: "20px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background-color 0.2s", zIndex: 10
              }}
              className="modal-close-btn"
            >
              ×
            </button>
            <div style={{ height: "240px", width: "100%", overflow: "hidden" }}>
              <img src={selectedNews.image} alt={selectedNews.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ padding: "32px" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
                <span className="news-tag" style={{ margin: 0 }}>{selectedNews.tag}</span>
                <span className="news-date" style={{ fontSize: "13px", color: "var(--c-slate-500)", fontWeight: "600" }}>{selectedNews.date}</span>
              </div>
              <h3 style={{ fontSize: "22px", fontWeight: "800", color: "var(--c-slate-900)", marginBottom: "16px", lineHeight: "1.3" }}>{selectedNews.title}</h3>
              <p style={{ fontSize: "14.5px", color: "var(--c-slate-600)", lineHeight: "1.6", margin: 0 }}>
                {selectedNews.tag === "NEWS" && "We are excited to share the latest enhancements deployed to the EduSphere platform. Our engineering team has successfully integrated online fee collection gateways and automatic real-time student attendance monitoring panels to provide a hassle-free administrative workspace. School branches can now register merchant accounts and track daily collections instantly. We are also building offline cash registers integration for campuses."}
                {selectedNews.tag === "ANNOUNCEMENTS" && "The official admission registrations for the upcoming academic session 2026-2027 are now open. Prospective parents can register online through our secure admissions desk portal, upload required student records, and verify documents digitally. Early-bird registration benefits and fee discount vouchers are applicable for registrations completed before the end of the month."}
                {selectedNews.tag === "EVENTS" && "Get ready for the annual science and technology exhibition where students from all grades showcase their innovative projects, robots, and science experiments. The event will host distinguished guest speakers and regional educators as judges. Registration portals are open for students starting from next week under the guidance of class teachers."}
                {selectedNews.tag === "TRANSPORT" && "To ensure maximum student safety, the transport tracking module has been upgraded with live GPS tracking features. Parents can view the real-time position of the transit vehicles directly on their parent app. The updated route configurations for Sodala and Jamuna Dairy sectors are fully active starting this week."}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
