import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login   from "../pages/Auth/Login";
import Landing from "../pages/Landing/Landing";

/* Layouts */
import PublicLayout         from "../layout/PublicLayout";
import SchoolAdminLayout    from "../layout/SchoolAdminLayout";
import TeacherLayout        from "../layout/TeacherLayout";
import ParentLayout         from "../layout/ParentLayout";

/* School Admin Portal */
import SchoolPortalHome     from "../pages/SchoolAdmin/Home";
import PortalTeachers       from "../pages/SchoolAdmin/Teachers";
import PortalStudents       from "../pages/SchoolAdmin/Students";
import PortalClasses        from "../pages/SchoolAdmin/Classes";
import PortalSubjects       from "../pages/SchoolAdmin/Subjects";
import PortalAttendance     from "../pages/SchoolAdmin/Attendance";
import PortalExams          from "../pages/SchoolAdmin/Exams";
import PortalFees           from "../pages/SchoolAdmin/Fees";
import PortalEvents         from "../pages/SchoolAdmin/Events";
import PortalAnnouncements  from "../pages/SchoolAdmin/Announcements";
import PortalReports        from "../pages/SchoolAdmin/Reports";
import PortalSettings       from "../pages/SchoolAdmin/Settings";
import PortalNotifications  from "../pages/SchoolAdmin/Notifications";
import PortalSupport        from "../pages/SchoolAdmin/Support";
import PortalLibrary        from "../pages/SchoolAdmin/Library";
import PortalBiometrics     from "../pages/SchoolAdmin/Biometrics";

/* Live Bus System Portal Pages */
import PortalBusDashboard from "../pages/SchoolAdmin/BusDashboard";
import PortalBusManagement from "../pages/SchoolAdmin/BusManagement";
import PortalDriverManagement from "../pages/SchoolAdmin/DriverManagement";
import PortalStudentBusAssignment from "../pages/SchoolAdmin/StudentBusAssignment";
import PortalLiveTracking from "../pages/SchoolAdmin/LiveTracking";

/* Hostel Warden Portal */
import HostelWardenLayout from "../layout/HostelWardenLayout";
import WardenHome         from "../pages/HostelWarden/Home";
import WardenRooms        from "../pages/HostelWarden/Rooms";
import WardenAllotments   from "../pages/HostelWarden/Allotments";
import WardenStudents     from "../pages/HostelWarden/Students";
import WardenAttendance   from "../pages/HostelWarden/Attendance";
import WardenInventory    from "../pages/HostelWarden/Inventory";
import WardenPayments     from "../pages/HostelWarden/Payments";
import WardenDefaulters   from "../pages/HostelWarden/Defaulters";
import WardenMaintenance  from "../pages/HostelWarden/Maintenance";
import WardenVisitors     from "../pages/HostelWarden/Visitors";
import WardenProfile      from "../pages/HostelWarden/Profile";

/* Teacher Portal */
import TeacherPortalHome     from "../pages/Teacher/Home";
import TPortalClasses        from "../pages/Teacher/Classes";
import TPortalStudents       from "../pages/Teacher/Students";
import TPortalAttendance     from "../pages/Teacher/Attendance";
import TPortalHomework       from "../pages/Teacher/Homework";
import TPortalAssignments    from "../pages/Teacher/Assignments";
import TPortalExams          from "../pages/Teacher/Exams";
import TPortalTimetable      from "../pages/Teacher/Timetable";
import TPortalAnnouncements  from "../pages/Teacher/Announcements";
import TPortalReports        from "../pages/Teacher/Reports";
import TPortalProfile        from "../pages/Teacher/Profile";
import TPortalSettings       from "../pages/Teacher/Settings";

import ParentPortalHome      from "../pages/Parent/Home";
import PPortalAttendance     from "../pages/Parent/Attendance";
import PPortalMarks          from "../pages/Parent/Marks";
import PPortalNotifications  from "../pages/Parent/Notifications";
import PPortalProfile        from "../pages/Parent/Profile";
import PPortalHomework       from "../pages/Parent/Homework";
import ParentLiveBus        from "../pages/Parent/LiveBus";

/* Driver Portal */
import DriverHome from "../pages/Driver/Home";

/* Guards */
import ProtectedRoute from "./ProtectedRoute";
import AuthProvider   from "../context/AuthContext";
import { Toaster } from "sonner";

/* ── Super Admin shell (handles all /super-admin/* internally) ── */
import SuperAdminShell from "../pages/SuperAdmin/Dashboard";


import { useEffect } from "react";

function AppRoutes() {
    useEffect(() => {
        // Automatic localStorage quota pruner to prevent QuotaExceededError
        try {
            const keysToPrune = ["teacher_class_mappings", "student_admission_mappings", "notice_extra_mappings"];
            keysToPrune.forEach(key => {
                const raw = localStorage.getItem(key);
                if (!raw) return;
                try {
                    const parsed = JSON.parse(raw);
                    let modified = false;
                    for (const id in parsed) {
                        const item = parsed[id];
                        if (item && typeof item === 'object') {
                            for (const prop in item) {
                                if (typeof item[prop] === 'string' && item[prop].length > 500) {
                                    item[prop] = "[file_uploaded]";
                                    modified = true;
                                }
                            }
                        }
                    }
                    if (modified) {
                        localStorage.setItem(key, JSON.stringify(parsed));
                    }
                } catch (pErr) {}
            });
        } catch (err) {
            console.warn("Could not prune localStorage:", err);
        }
    }, []);

    return (
        <BrowserRouter>
            <AuthProvider>
                <Toaster position="top-right" richColors />
                <Routes>

                    {/* ── Public ─────────────────────────── */}
                    <Route element={<PublicLayout />}>
                        <Route path="/"      element={<Landing />} />
                        <Route path="/login" element={<Login />} />
                    </Route>

                    {/* ── Super Admin (all handled by SuperAdminShell) ── */}
                    <Route path="/super-admin/*" element={<SuperAdminShell />} />

                    {/* ── School Admin (new SaaS view) ── */}
                    <Route path="/school-portal/:schoolId" element={<SchoolAdminLayout />}>
                        <Route index element={<SchoolPortalHome />} />
                        <Route path="teachers"      element={<PortalTeachers />} />
                        <Route path="students"      element={<PortalStudents />} />
                        <Route path="classes"       element={<PortalClasses />} />
                        <Route path="subjects"      element={<PortalSubjects />} />
                        <Route path="biometrics"    element={<PortalBiometrics />} />
                        <Route path="attendance"    element={<PortalAttendance />} />
                        <Route path="exams"         element={<PortalExams />} />
                        <Route path="events"        element={<PortalEvents />} />
                        <Route path="library"       element={<PortalLibrary />} />
                        <Route path="announcements" element={<PortalAnnouncements />} />
                        <Route path="reports"       element={<PortalReports />} />
                        <Route path="settings"      element={<PortalSettings />} />
                        <Route path="notifications" element={<PortalNotifications />} />
                        <Route path="support"       element={<PortalSupport />} />
                        <Route path="bus-dashboard" element={<PortalBusDashboard />} />
                        <Route path="bus-management" element={<PortalBusManagement />} />
                        <Route path="driver-management" element={<PortalDriverManagement />} />
                        <Route path="student-bus-assignment" element={<PortalStudentBusAssignment />} />
                        <Route path="live-tracking" element={<PortalLiveTracking />} />
                    </Route>

                    {/* ── Hostel Warden Portal ── */}
                    <Route path="/hostel-portal/:schoolId" element={<HostelWardenLayout />}>
                        <Route index element={<WardenHome />} />
                        <Route path="rooms"      element={<WardenRooms />} />
                        <Route path="allotments" element={<WardenAllotments />} />
                        <Route path="students"      element={<WardenStudents />} />
                        <Route path="attendance"    element={<WardenAttendance />} />
                        <Route path="inventory"     element={<WardenInventory />} />
                        <Route path="payments"      element={<WardenPayments />} />
                        <Route path="maintenance"   element={<WardenMaintenance />} />
                        <Route path="visitors"      element={<WardenVisitors />} />
                        <Route path="profile"       element={<WardenProfile />} />
                    </Route>

                    {/* ── Teacher Portal ── */}
                    <Route path="/teacher-portal/:teacherId" element={<TeacherLayout />}>
                        <Route index element={<TeacherPortalHome />} />
                        <Route path="classes"       element={<TPortalClasses />} />
                        <Route path="students"      element={<TPortalStudents />} />
                        <Route path="attendance"    element={<TPortalAttendance />} />
                        <Route path="homework"      element={<TPortalHomework />} />
                        <Route path="assignments"   element={<TPortalAssignments />} />
                        <Route path="announcements" element={<TPortalAnnouncements />} />
                        <Route path="profile"       element={<TPortalProfile />} />
                        <Route path="settings"      element={<TPortalSettings />} />
                    </Route>

                    {/* ── Parent Portal ── */}
                    <Route path="/parent-portal/:studentId" element={<ParentLayout />}>
                        <Route index element={<ParentPortalHome />} />
                        <Route path="attendance"    element={<PPortalAttendance />} />
                        <Route path="homework"      element={<PPortalHomework />} />
                        <Route path="marks"         element={<PPortalMarks />} />
                        <Route path="notifications" element={<PPortalNotifications />} />
                        <Route path="profile"       element={<PPortalProfile />} />
                        <Route path="live-bus"      element={<ParentLiveBus />} />
                    </Route>

                    {/* ── Driver Portal ── */}
                    <Route path="/driver-portal/:driverId" element={<DriverHome />} />

                    {/* ── Route Redirect Helpers & Fallbacks ── */}
                    <Route path="/school" element={<Navigate to="/school-portal/school-1" replace />} />
                    <Route path="/school/" element={<Navigate to="/school-portal/school-1" replace />} />
                    <Route path="/school-portal" element={<Navigate to="/school-portal/school-1" replace />} />
                    <Route path="/school-portal/" element={<Navigate to="/school-portal/school-1" replace />} />

                    <Route path="/hostel" element={<Navigate to="/hostel-portal/school-1" replace />} />
                    <Route path="/hostel/" element={<Navigate to="/hostel-portal/school-1" replace />} />
                    <Route path="/hostel-portal" element={<Navigate to="/hostel-portal/school-1" replace />} />
                    <Route path="/hostel-portal/" element={<Navigate to="/hostel-portal/school-1" replace />} />

                    <Route path="/teacher" element={<Navigate to="/teacher-portal/teacher-1" replace />} />
                    <Route path="/teacher/" element={<Navigate to="/teacher-portal/teacher-1" replace />} />
                    <Route path="/teacher-portal" element={<Navigate to="/teacher-portal/teacher-1" replace />} />
                    <Route path="/teacher-portal/" element={<Navigate to="/teacher-portal/teacher-1" replace />} />

                    <Route path="/parent" element={<Navigate to="/parent-portal/student-1" replace />} />
                    <Route path="/parent/" element={<Navigate to="/parent-portal/student-1" replace />} />
                    <Route path="/parent-portal" element={<Navigate to="/parent-portal/student-1" replace />} />
                    <Route path="/parent-portal/" element={<Navigate to="/parent-portal/student-1" replace />} />

                    <Route path="/driver" element={<Navigate to="/driver-portal/driver-1" replace />} />
                    <Route path="/driver/" element={<Navigate to="/driver-portal/driver-1" replace />} />
                    <Route path="/driver-portal" element={<Navigate to="/driver-portal/driver-1" replace />} />
                    <Route path="/driver-portal/" element={<Navigate to="/driver-portal/driver-1" replace />} />

                    {/* Catch-all 404 redirect */}
                    <Route path="*" element={<Navigate to="/" replace />} />

                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default AppRoutes;
