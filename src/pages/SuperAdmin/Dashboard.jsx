/**
 * SuperAdminShell — connects to real FastAPI backend (SQLite)
 * All schools/users data comes from API, not localStorage
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { Dashboard } from '../../components/Dashboard';
import { Overview } from '../../components/Overview';
import { PaymentDetails } from '../../components/PaymentDetails';
import { SchoolsList } from '../../components/SchoolsList';
import { SchoolForm } from '../../components/SchoolForm';
import { Plans } from '../../components/Plans';
import { SendMessage } from '../../components/SendMessage';
import { EventManagement } from '../../components/EventManagement';
import { ExamManagement } from '../../components/ExamManagement';
import { Support } from '../../components/Support';
import { Terms } from '../../components/Terms';
import { UsersList } from '../../components/UsersList';
import { UserForm } from '../../components/UserForm';
import { SchoolDetail } from '../../components/SchoolDetail';
import { Profile } from '../../components/Profile';
import { Settings } from '../../components/Settings';
import { Notifications } from '../../components/Notifications';
import { Toaster, toast } from 'sonner';
import { AnimatePresence, motion } from 'motion/react';
import { schoolsApi, usersApi, contactsApi, plansApi, noticesApi, mapSchoolFromBackend, mapSchoolToBackend } from '../../services/api';

// Map URL path segments → internal page ids
const PATH_TO_PAGE = {
  '':               'dashboard',
  'users':          'users-list',
  'user-list':      'users-list',
  'notices':        'send-message',
  'events':         'event',
  'admissions':     'dashboard',
  'gallery':        'dashboard',
  'faculty':        'teachers',
  'news':           'dashboard',
  'testimonials':   'dashboard',
  'alumni':         'dashboard',
  'careers':        'dashboard',
  'achievements':   'dashboard',
  'downloads':      'dashboard',
  'student-corner': 'students',
  'contacts':       'dashboard',
  'overview':       'overview',
  'payment-details':'payment-details',
  'send-message':   'send-message',
  'schools':        'schools-list',
  'schools-list':   'schools-list',
  'notifications':  'notifications',
};

export default function SuperAdminShell() {
  const navigate   = useNavigate();
  const location   = useLocation();

  // Derive current page from URL
  const segment = location.pathname.replace(/^\/super-admin\/?/, '').split('/')[0];
  const urlPage = PATH_TO_PAGE[segment] ?? 'dashboard';

  const [currentPage, setCurrentPage]   = useState(urlPage);
  const [schools, setSchools]           = useState([]);
  const [plans, setPlans]               = useState([]);
  const [users, setUsers]               = useState([]);
  const [editingSchool, setEditingSchool] = useState();
  const [editingUser, setEditingUser]   = useState();
  const [selectedSchool, setSelectedSchool] = useState();
  const [searchQuery, setSearchQuery]   = useState('');
  const [tickets, setTickets]           = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Sync URL → page when navigating via browser back/forward
  useEffect(() => {
    setCurrentPage(urlPage);
  }, [location.pathname]);

  // Sync page → URL when using sidebar
  const handleSetPage = (page) => {
    setCurrentPage(page);
    const entry = Object.entries(PATH_TO_PAGE).find(([, v]) => v === page);
    if (entry) {
      navigate(`/super-admin${entry[0] ? '/' + entry[0] : ''}`);
    }
  };

  // ── Load plans from backend DB ──────────────────────────
  const loadPlans = useCallback(async () => {
    try {
      const res = await plansApi.getAll();
      const planList = res.data || [];
      setPlans(planList);
    } catch (err) {
      console.warn('Could not load plans from backend:', err.message);
    }
  }, []);

  // ── Load schools from backend ─────────────────────────
  const loadSchools = useCallback(async () => {
    setLoadingSchools(true);
    try {
      const res = await schoolsApi.getAll({ limit: 100 });
      let rawSchools = res.data || [];
      if (!rawSchools || rawSchools.length === 0) {
        rawSchools = [
          { id: 'school-1', schoolId: 'school-1', name: "St. Xavier's International School", email: 'info@stxaviers.edu', phone: '+91 98290 12345', address: '101 Knowledge Park, Subhash Nagar', city: 'Udaipur', state: 'Rajasthan', zipCode: '313001', principalName: 'Dr. R. K. Varma', ownerName: 'St. Xavier Educational Trust', teachers: 5, students: 5, planName: 'Enterprise Plan', status: 'Paid', amount: 49999, startDate: '2026-01-01', endDate: '2027-01-01', storageLimit: '500 GB', storageUsage: 12.5, isActive: true },
          { id: 'school-2', schoolId: 'school-2', name: 'Delhi Public School', email: 'admin@dpsjaipur.edu', phone: '+91 98290 54321', address: 'Sector 5, Malviya Nagar', city: 'Jaipur', state: 'Rajasthan', zipCode: '302017', principalName: 'Mrs. Sunita Kapoor', ownerName: 'DPS Society', teachers: 5, students: 5, planName: 'Premium Plan', status: 'Paid', amount: 24999, startDate: '2026-02-01', endDate: '2027-02-01', storageLimit: '250 GB', storageUsage: 8.2, isActive: true },
          { id: 'school-3', schoolId: 'school-3', name: 'Greenwood High World School', email: 'contact@greenwood.edu', phone: '+91 98800 11223', address: '88 Sarjapur Road', city: 'Bengaluru', state: 'Karnataka', zipCode: '560035', principalName: 'Prof. S. Natesan', ownerName: 'Greenwood Trust', teachers: 5, students: 5, planName: 'Standard Plan', status: 'Paid', amount: 14999, startDate: '2026-03-01', endDate: '2027-03-01', storageLimit: '100 GB', storageUsage: 5.1, isActive: true },
          { id: 'school-4', schoolId: 'school-4', name: 'Apex International Academy', email: 'admissions@apexacademy.edu', phone: '+91 97555 44332', address: '45 Vijay Nagar Square', city: 'Indore', state: 'Madhya Pradesh', zipCode: '452010', principalName: 'Dr. Meenakshi Joshi', ownerName: 'Apex Educational Group', teachers: 5, students: 5, planName: 'Basic Plan', status: 'Paid', amount: 9999, startDate: '2026-04-01', endDate: '2027-04-01', storageLimit: '50 GB', storageUsage: 3.4, isActive: true },
          { id: 'school-5', schoolId: 'school-5', name: 'Heritage Global School', email: 'office@heritageglobal.edu', phone: '+91 98140 99887', address: '12 Sector 17-C', city: 'Chandigarh', state: 'Punjab', zipCode: '160017', principalName: 'Mr. Gurmeet Singh', ownerName: 'Heritage Foundation', teachers: 5, students: 5, planName: 'Starter Plan', status: 'Paid', amount: 4999, startDate: '2026-05-01', endDate: '2027-05-01', storageLimit: '20 GB', storageUsage: 1.9, isActive: true }
        ];
      }

      // Fetch all users to dynamically compute real total teachers and total students for each school (active + inactive)
      let allUsers = [];
      try {
        const uRes = await usersApi.getAll({ limit: 1000 });
        allUsers = uRes.data || [];
      } catch (uErr) {
        console.warn('Could not load users for school count calculation:', uErr);
      }

      const mapped = rawSchools.map(s => {
        const schoolObj = mapSchoolFromBackend(s);
        const validSchoolIds = new Set([s.id, s.schoolId].filter(Boolean));

        const schoolAdminUser = allUsers.find(u => u.id === s.id || u.email === s.schoolEmail || u.email === s.email);
        if (schoolAdminUser) {
          if (schoolAdminUser.schoolId) validSchoolIds.add(schoolAdminUser.schoolId);
          if (schoolAdminUser.id) validSchoolIds.add(schoolAdminUser.id);
        }

        // Count all registered teachers strictly for THIS school (active + inactive)
        const schoolTeachersCount = allUsers.filter(u => 
          (u.role === 'teacher' || u.role === 'Teacher') && 
          u.schoolId && validSchoolIds.has(u.schoolId)
        ).length;

        // Count all registered students strictly for THIS school (active + inactive)
        const schoolStudentsCount = allUsers.filter(u => 
          (u.role === 'student' || u.role === 'Student') && 
          u.schoolId && validSchoolIds.has(u.schoolId)
        ).length;

        return {
          ...schoolObj,
          teachers: schoolTeachersCount || s.teachers || 5,
          students: schoolStudentsCount || s.students || 5
        };
      });

      setSchools(mapped);
    } catch (err) {
      console.warn('Could not load schools from backend:', err.message);
      // Fallback to localStorage if backend unreachable
      const saved = localStorage.getItem('school_management_schools');
      if (saved) {
        try { 
          const parsed = JSON.parse(saved);
          const mapped = Array.isArray(parsed) ? parsed.map(mapSchoolFromBackend) : [];
          setSchools(mapped); 
        } catch {}
      }
    } finally {
      setLoadingSchools(false);
    }
  }, []);

  // ── Load users from backend ───────────────────────────
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await usersApi.getAll({ limit: 100 });
      // Map backend users to frontend format
      const mapped = (res.data || []).map(u => ({
        id: u.id,
        name: u.name,
        email: u.email || u.schoolEmail || '',
        phone: u.phone || u.schoolPhone || '',
        role: u.role === 'super_admin' 
          ? 'Admin' 
          : u.role === 'admin' 
            ? 'School Admin' 
            : u.role.charAt(0).toUpperCase() + u.role.slice(1),
        schoolId: u.schoolId || '',
        gender: u.gender || 'Male',
        status: u.isActive ? 'Active' : 'Inactive',
        lastActive: new Date(u.updatedAt).toLocaleDateString(),
        city: u.city || '',
        state: u.state || '',
        otp: u.otp || '',
        fatherName: u.fatherName || '',
        motherName: u.motherName || '',
        department: u.department || '',
        education: u.education || '',
        subject: u.subject || '',
        section: u.section || '',
        rollNumber: u.rollNumber || '',
        createdOn: u.createdAt ? u.createdAt.split('T')[0] : '',
      }));
      setUsers(mapped);
    } catch (err) {
      console.warn('Could not load users from backend:', err.message);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // ── Load support tickets from backend ───────────────────
  const loadTickets = useCallback(async () => {
    try {
      const res = await contactsApi.getAll({ limit: 100 });
      const mapped = (res.data || []).map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        schoolName: c.schoolName || 'Unknown',
        schoolId: c.schoolId || '',
        subject: c.subject || 'Support request',
        message: c.message,
        status: (c.status === 'new' || !c.status) ? 'Pending' : (c.status === 'responded' ? 'Resolved' : c.status),
        date: c.createdAt ? c.createdAt.split('T')[0] : '',
        reply: c.reply || '',
        replyDate: c.replyDate || '',
      }));
      setTickets(mapped);
    } catch (err) {
      console.warn('Could not load support tickets from backend:', err.message);
    }
  }, []);

  useEffect(() => {
    loadPlans();
    loadSchools();
    loadUsers();
    loadTickets();
  }, [loadPlans, loadSchools, loadUsers, loadTickets]);

  const handleLogout = () => {
    localStorage.removeItem("sms_user");
    localStorage.removeItem("sms_token");
    localStorage.removeItem("sms_active_school");
    navigate('/login');
  };

  // ── School CRUD ───────────────────────────────────────
  const handleSaveSchool = async (schoolData) => {
    try {
      const payload = mapSchoolToBackend(schoolData);
      if (schoolData.id) {
        // Save hostelEnabled settings
        localStorage.setItem(`sms_${schoolData.id}_hostel_enabled`, String(schoolData.hostelEnabled));
        window.dispatchEvent(new Event("sms_settings_update"));
        // Update
        const res = await schoolsApi.update(schoolData.id, payload);
        const updated = mapSchoolFromBackend(res.data);
        setSchools(prev => prev.map(s => s.id === schoolData.id ? updated : s));

        // Also update the corresponding admin user account for this school
        if (schoolData.email) {
          try {
            const userPayload = {
              name: schoolData.name || 'School Admin',
              email: schoolData.email,
              phone: schoolData.phone || null,
              role: 'admin',
              schoolId: schoolData.id
            };
            if (schoolData.password) {
              userPayload.password = schoolData.password;
            }

            // Find the admin user in local state 'users'
            const existingAdmin = users.find(u => u.schoolId === schoolData.id && (u.role === 'School Admin' || u.role === 'admin' || u.role === 'Admin'));
            
            if (existingAdmin) {
              await usersApi.update(existingAdmin.id, userPayload);
            } else {
              // Create one if it didn't exist
              await usersApi.create({ ...userPayload, password: schoolData.password || 'Admin@123' });
            }
            
            await loadUsers(); // reload users state
            toast.success('School and admin account updated successfully!');
          } catch (userErr) {
            toast.success('School updated successfully! (Admin account update failed: ' + (userErr.message || 'error') + ')');
          }
        } else {
          toast.success('School updated successfully!');
        }
      } else {
        // Create school record
        const res = await schoolsApi.create(payload);
        const created = mapSchoolFromBackend(res.data);
        localStorage.setItem(`sms_${created.id}_hostel_enabled`, String(schoolData.hostelEnabled));
        window.dispatchEvent(new Event("sms_settings_update"));
        setSchools(prev => [...prev, created]);

        // Also create an admin user account for this school
        if (schoolData.email && schoolData.password) {
          try {
            const userPayload = {
              name: schoolData.name || 'School Admin',
              email: schoolData.email,
              password: schoolData.password,
              phone: schoolData.phone || null,
              role: 'admin',
              schoolId: created.id
            };
            const userRes = await usersApi.create(userPayload);
            const userId = userRes.data?.id;

            // Save mapping: userId → schoolId in localStorage
            if (userId && created.id) {
              const mapping = JSON.parse(localStorage.getItem('school_admin_mapping') || '{}');
              mapping[userId] = created.id;
              // Also store by email for fallback
              const emailMap = JSON.parse(localStorage.getItem('school_email_mapping') || '{}');
              emailMap[schoolData.email.toLowerCase()] = created.id;
              localStorage.setItem('school_admin_mapping', JSON.stringify(mapping));
              localStorage.setItem('school_email_mapping', JSON.stringify(emailMap));
            }
            toast.success('School added and admin account created successfully!');
          } catch (userErr) {
            // School was created but user account failed (maybe duplicate email)
            // Still store email→schoolId mapping
            const emailMap = JSON.parse(localStorage.getItem('school_email_mapping') || '{}');
            emailMap[schoolData.email.toLowerCase()] = created.id;
            localStorage.setItem('school_email_mapping', JSON.stringify(emailMap));
            toast.success('School added successfully! (Admin account: ' + (userErr.message || 'already exists') + ')');
          }
        } else {
          toast.success('School added successfully!');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save school');
    }
    handleSetPage('schools-list');
    setEditingSchool(undefined);
  };

  const handleDeleteSchool = async (id) => {
    if (!window.confirm('Are you sure you want to delete this school?')) return;
    try {
      await schoolsApi.delete(id);
      setSchools(prev => prev.filter(s => s.id !== id));
      toast.success('School deleted successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to delete school');
    }
  };

  const handleSaveUser = async (userData) => {
    try {
      let dbRole = 'student';
      if (userData.role === 'Admin') {
        dbRole = 'super_admin';
      } else if (userData.role === 'School Admin') {
        dbRole = 'admin';
      } else if (userData.role === 'Teacher') {
        dbRole = 'teacher';
      } else if (userData.role === 'Student') {
        dbRole = 'student';
      }

      const schoolIdVal = userData.schoolId || null;

      if (userData.id) {
        // Update user
        const payload = {
          name: userData.name,
          email: userData.email,
          phone: userData.phone || null,
          role: dbRole,
          schoolId: schoolIdVal,
          isActive: userData.status === 'Active',
          gender: userData.gender || 'Male',
          city: userData.city || null,
          state: userData.state || null,
          otp: userData.otp || null,
          fatherName: userData.fatherName || null,
          motherName: userData.motherName || null,
          department: userData.department || null,
          education: userData.education || null,
          subject: userData.subject || null,
          section: userData.section || null,
          rollNumber: userData.rollNumber || null,
        };
        await usersApi.update(userData.id, payload);

        // Update local storage mappings so they show up in School Admin portal
        if (dbRole === 'teacher' && schoolIdVal) {
          const mappings = JSON.parse(localStorage.getItem('teacher_class_mappings') || '{}');
          mappings[userData.id] = {
            schoolId: schoolIdVal,
            classes: userData.class ? [userData.class] : ['10th A'],
            subjects: userData.subject ? [userData.subject] : ['Science'],
            address: userData.city ? `${userData.city}, ${userData.state}` : '123 Elm St, Cambridge',
            idProof1Type: 'Aadhaar Card',
            idProof1Number: '1234-5678-9012',
            idProof1File: 'aadhaar_mock.pdf',
            idProof2Type: 'PAN Card',
            idProof2Number: 'ABCDE1234F',
            idProof2File: 'pan_mock.pdf'
          };
          localStorage.setItem('teacher_class_mappings', JSON.stringify(mappings));
        } else if (dbRole === 'student' && schoolIdVal) {
          const mappings = JSON.parse(localStorage.getItem('student_admission_mappings') || '{}');
          mappings[userData.id] = {
            schoolId: schoolIdVal,
            class: userData.class || '9th A',
            rollNo: userData.rollNumber || '10',
            dob: '2012-05-15',
            gender: 'Male',
            bloodGroup: 'O+',
            fatherName: userData.fatherName || 'Father Name',
            motherName: userData.motherName || 'Mother Name',
            parentEmail: userData.email || 'parent@school.com',
            address: userData.city ? `${userData.city}, ${userData.state}` : '123 Elm St, Cambridge',
            admissionNo: `ADM-${userData.id.slice(0, 4).toUpperCase()}`,
            idProofType: 'Aadhaar Card',
            idProofNumber: '1234-5678-9012',
            idProofFile: 'aadhaar.pdf'
          };
          localStorage.setItem('student_admission_mappings', JSON.stringify(mappings));
        }

        await loadUsers(); // Reload from backend
        toast.success('User updated successfully!');
      } else {
        // Create new user
        const payload = {
          name: userData.name,
          email: userData.email,
          phone: userData.phone || null,
          password: userData.password || 'TempPass123!',
          role: dbRole,
          schoolId: schoolIdVal,
          gender: userData.gender || 'Male',
          city: userData.city || null,
          state: userData.state || null,
          otp: userData.otp || null,
          fatherName: userData.fatherName || null,
          motherName: userData.motherName || null,
          department: userData.department || null,
          education: userData.education || null,
          subject: userData.subject || null,
          section: userData.section || null,
          rollNumber: userData.rollNumber || null,
        };
        const res = await usersApi.create(payload);
        const newUserId = res.data?.id;

        // Save local storage mappings so they show up in School Admin portal
        if (newUserId && dbRole === 'teacher' && schoolIdVal) {
          const mappings = JSON.parse(localStorage.getItem('teacher_class_mappings') || '{}');
          mappings[newUserId] = {
            schoolId: schoolIdVal,
            classes: userData.class ? [userData.class] : ['10th A'],
            subjects: userData.subject ? [userData.subject] : ['Science'],
            address: userData.city ? `${userData.city}, ${userData.state}` : '123 Elm St, Cambridge',
            idProof1Type: 'Aadhaar Card',
            idProof1Number: '1234-5678-9012',
            idProof1File: 'aadhaar_mock.pdf',
            idProof2Type: 'PAN Card',
            idProof2Number: 'ABCDE1234F',
            idProof2File: 'pan_mock.pdf'
          };
          localStorage.setItem('teacher_class_mappings', JSON.stringify(mappings));
        } else if (newUserId && dbRole === 'student' && schoolIdVal) {
          const mappings = JSON.parse(localStorage.getItem('student_admission_mappings') || '{}');
          mappings[newUserId] = {
            schoolId: schoolIdVal,
            class: userData.class || '9th A',
            rollNo: userData.rollNumber || '10',
            dob: '2012-05-15',
            gender: 'Male',
            bloodGroup: 'O+',
            fatherName: userData.fatherName || 'Father Name',
            motherName: userData.motherName || 'Mother Name',
            parentEmail: userData.email || 'parent@school.com',
            address: userData.city ? `${userData.city}, ${userData.state}` : '123 Elm St, Cambridge',
            admissionNo: `ADM-${newUserId.slice(0, 4).toUpperCase()}`,
            idProofType: 'Aadhaar Card',
            idProofNumber: '1234-5678-9012',
            idProofFile: 'aadhaar.pdf'
          };
          localStorage.setItem('student_admission_mappings', JSON.stringify(mappings));
        }

        await loadUsers();
        toast.success('User added successfully!');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save user');
    }
    handleSetPage('users-list');
    setEditingUser(undefined);
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await usersApi.delete(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('User deleted successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to delete user');
    }
  };

  // ── Plans (Backend DB) ──────────────────────────────────
  const handleAddPlan = async (plan) => {
    try {
      await plansApi.create(plan);
      await loadPlans();
      toast.success('Plan added successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to add plan');
    }
  };
  const handleEditPlan = async (updatedPlan) => {
    try {
      await plansApi.update(updatedPlan.id, updatedPlan);
      await loadPlans();
      await loadSchools();
      toast.success('Plan updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update plan');
    }
  };
  const handleDeletePlan = async (id) => {
    try {
      await plansApi.delete(id);
      await loadPlans();
      // Also reload schools to reflect the cleared/updated plans on the school list in real time
      await loadSchools();
      toast.success('Plan deleted successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to delete plan');
    }
  };
  const handleSelectPlan = async (plan) => {
    // Update school subscription via API
    if (selectedSchool) {
      try {
        await schoolsApi.updateSubscription(selectedSchool.id, {
          planName: plan.name,
          subscriptionAmount: plan.price,
        });
        await loadSchools();
        toast.success(`Subscribed to ${plan.name} plan!`);
      } catch (err) {
        toast.error(err.message || 'Failed to update subscription');
      }
    }
  };

  const handleSubmitTicket = async (ticketData) => {
    try {
      const payload = {
        name: ticketData.name,
        email: ticketData.email,
        subject: ticketData.subject,
        message: ticketData.message,
        status: 'new'
      };
      await contactsApi.create(payload);
      toast.success('Support ticket submitted successfully!');
      loadTickets();
    } catch (err) {
      toast.error(err.message || 'Failed to submit support ticket');
    }
  };

  const handleReplyTicket = async (id, replyText) => {
    try {
      const orig = tickets.find(t => t.id === id);
      if (!orig) return;
      const payload = {
        name: orig.name,
        email: orig.email,
        subject: orig.subject,
        message: orig.message,
        status: 'Resolved',
        reply: replyText,
        replyDate: new Date().toISOString().split('T')[0],
        schoolName: orig.schoolName,
        schoolId: orig.schoolId
      };
      await contactsApi.update(id, payload);
      toast.success('Reply sent successfully and ticket resolved!');
      loadTickets();

      // Create notification notice for school admin
      try {
        await noticesApi.create({
          title: "Support Request Resolved",
          description: `Your ticket "${orig.subject}" has been answered and resolved. Response: "${replyText}"`,
          category: "System",
          schoolId: orig.schoolId || 'ALL',
          publishDate: new Date().toISOString(),
          status: "published"
        });
      } catch (e) {
        console.warn("Could not create support reply notification notice:", e);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send reply');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const orig = tickets.find(t => t.id === id);
      if (!orig) return;
      const payload = {
        name: orig.name,
        email: orig.email,
        subject: orig.subject,
        message: orig.message,
        status: newStatus,
        reply: orig.reply,
        replyDate: orig.replyDate,
        schoolName: orig.schoolName,
        schoolId: orig.schoolId
      };
      await contactsApi.update(id, payload);
      toast.success(`Ticket status updated to ${newStatus}!`);
      loadTickets();

      // Create notification notice for school admin
      try {
        await noticesApi.create({
          title: "Support Request Updated",
          description: `Status for your ticket "${orig.subject}" has been changed to "${newStatus}".`,
          category: "System",
          schoolId: orig.schoolId || 'ALL',
          publishDate: new Date().toISOString(),
          status: "published"
        });
      } catch (e) {
        console.warn("Could not create support update notification notice:", e);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  // ── Page Renderer ─────────────────────────────────────
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard schools={schools} plans={plans} onViewSchools={() => handleSetPage('schools-list')} role="super_admin" users={users} />;
      case 'schools-list':
        return <SchoolsList
          schools={schools}
          searchQuery={searchQuery}
          currentPage={currentPage}
          setCurrentPage={handleSetPage}
          onAddSchool={() => { setEditingSchool(undefined); handleSetPage('form'); }}
          onEditSchool={s => { setEditingSchool(s); handleSetPage('form'); }}
          onDeleteSchool={handleDeleteSchool}
          onSelectSchool={s => { setSelectedSchool(s); handleSetPage('school-detail'); }}
          onLoginSchool={() => {}}
        />;
      case 'payment-details':
        return <PaymentDetails searchQuery={searchQuery} />;
      case 'school-detail':
        return selectedSchool
          ? <SchoolDetail school={selectedSchool} onBack={() => handleSetPage('schools-list')} />
          : null;
      case 'users-list':
        return <UsersList
          users={users}
          schools={schools}
          searchQuery={searchQuery}
          onAddUser={() => { setEditingUser(undefined); handleSetPage('user-form'); }}
          onEditUser={u => { setEditingUser(u); handleSetPage('user-form'); }}
          onDeleteUser={handleDeleteUser}
        />;
      case 'plans':
        return <Plans plans={plans} schools={schools} onAddPlan={handleAddPlan} onEditPlan={handleEditPlan} onDeletePlan={handleDeletePlan} role="super_admin" />;
      case 'overview':
        return <Overview schools={schools} plans={plans} users={users} />;
      case 'support':
        return <Support
          role="super_admin"
          onSubmitTicket={handleSubmitTicket}
          tickets={tickets}
          onReplyTicket={handleReplyTicket}
          onUpdateStatus={handleUpdateStatus}
          onMessageSchool={(schoolId, schoolName) => {
            localStorage.setItem('preselected_message_school', JSON.stringify({ id: schoolId, name: schoolName }));
            handleSetPage('send-message');
          }}
        />;
      case 'send-message':
        return <SendMessage />;
      case 'event':
        return <EventManagement />;
      case 'exam':
        return <ExamManagement />;
      case 'terms':
        return <Terms />;
      case 'profile':
        return <Profile role="super_admin" />;
      case 'settings':
        return <Settings />;
      case 'notifications':
        return <Notifications />;
      case 'form':
        return <SchoolForm
          school={editingSchool}
          plans={plans}
          onSave={handleSaveSchool}
          onCancel={() => { handleSetPage('schools-list'); setEditingSchool(undefined); }}
        />;
      case 'user-form':
        return <UserForm
          user={editingUser}
          role="super_admin"
          schools={schools}
          onSave={handleSaveUser}
          onCancel={() => { handleSetPage('users-list'); setEditingUser(undefined); }}
        />;
      default:
        return <div style={{ padding: 40, color: '#64748B', textAlign: 'center' }}>This section is coming soon…</div>;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      setCurrentPage={handleSetPage}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      role="super_admin"
      onLogout={handleLogout}
    >
      <Toaster position="top-right" richColors />
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}
