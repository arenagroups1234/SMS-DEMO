import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, School, FileText, Box, LifeBuoy, Settings, Menu, Bell, User, Users, CreditCard, Search, ChevronDown, FileCheck, LogOut, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export const Layout = ({ children, currentPage, setCurrentPage, searchQuery, setSearchQuery, role = 'super_admin', activeSchool, onLogout }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSchoolsExpanded, setIsSchoolsExpanded] = useState(true);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const [saUnreadCount, setSaUnreadCount] = useState(0);

    const updateUnreadCount = () => {
        if (role === 'super_admin') {
            try {
                const stored = localStorage.getItem('super_admin_notifications');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setSaUnreadCount(parsed.filter(n => !n.read).length);
                } else {
                    setSaUnreadCount(2); // default unread count
                }
            } catch {
                setSaUnreadCount(0);
            }
        }
    };

    useEffect(() => {
        updateUnreadCount();
        window.addEventListener('super_admin_notifications_update', updateUnreadCount);
        return () => window.removeEventListener('super_admin_notifications_update', updateUnreadCount);
    }, [role]);

    const handleNotificationClick = () => {
        if (role === 'super_admin') {
            setCurrentPage('notifications');
        } else {
            toast.info('Recent Activities', {
                description: 'You have 3 new school registrations and 2 pending support tickets.',
                action: {
                    label: 'View All',
                    onClick: () => setCurrentPage('dashboard')
                }
            });
        }
    };

    const handleLogoutClick = () => {
        toast.promise(new Promise(res => setTimeout(res, 1000)), {
            loading: 'Signing out...',
            success: 'Logged out successfully!',
            error: 'Logout failed'
        });
        if (onLogout) {
            onLogout();
        }
    };

    const superAdminNavItems = [
        { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
        {
            id: 'schools',
            label: 'SCHOOLS LIST',
            icon: School,
            subItems: [
                { id: 'schools-list', label: 'School List', icon: School },
                { id: 'users-list', label: 'User List', icon: Users },
                { id: 'payment-details', label: 'Payment Details', icon: CreditCard },
            ]
        },
        { id: 'plans', label: 'PLANS', icon: FileText },
        { id: 'overview', label: 'OVERVIEW', icon: Box },
        { id: 'support', label: 'SUPPORT', icon: LifeBuoy },
        { id: 'send-message', label: 'SEND MESSAGE', icon: FileText },
        { id: 'terms', label: 'TERMS & CONDITIONS', icon: FileCheck },
    ];
    
    const schoolAdminNavItems = [
        { id: 'dashboard', label: 'HOME', icon: LayoutDashboard },
        { id: 'teachers', label: 'TEACHERS', icon: Users },
        { id: 'students', label: 'STUDENTS', icon: Users },
        { id: 'overview', label: 'OVERVIEW', icon: Box },
        { id: 'plans', label: 'PLAN', icon: FileText },
        { id: 'support', label: 'SUPPORT', icon: LifeBuoy },
        { id: 'send-message', label: 'SEND MESSAGE', icon: FileText },
        { id: 'event', label: 'EVENT', icon: FileText },
        { id: 'exam', label: 'EXAM', icon: FileText },
    ];

    const teacherNavItems = [
        { id: 'dashboard', label: 'HOME', icon: LayoutDashboard },
        { id: 'students', label: 'MY STUDENTS', icon: Users },
        { id: 'exam', label: 'EXAMS & MARKS', icon: FileCheck },
        { id: 'event', label: 'SCHOOL EVENTS', icon: FileText },
        { id: 'support', label: 'HELP DESK', icon: LifeBuoy },
    ];

    const studentNavItems = [
        { id: 'dashboard', label: 'HOME', icon: LayoutDashboard },
        { id: 'exam', label: 'EXAM RESULTS', icon: FileCheck },
        { id: 'event', label: 'EVENTS DIARY', icon: FileText },
        { id: 'support', label: 'SUPPORT DESK', icon: LifeBuoy },
    ];
    
    let navItems = superAdminNavItems;
    if (role === 'school_admin') {
        navItems = schoolAdminNavItems;
    } else if (role === 'teacher') {
        navItems = teacherNavItems;
    } else if (role === 'student') {
        navItems = studentNavItems;
    }


    return (
        <div className="fixed inset-0 flex flex-col bg-light-gray overflow-hidden font-sans">
            
            {/* ─── HEADER (Oxford Navy & Gold Bottom Accent) ─── */}
            <header className="bg-primary border-b-2 border-accent-gold/30 flex justify-between items-center px-6 h-16 shrink-0 sticky top-0 z-50 shadow-md">
                
                {/* Brand Logo & Mobile Menu Drawer trigger */}
                <div className="flex items-center gap-3 w-auto lg:w-64 shrink-0">
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                        className="lg:hidden text-white bg-white/10 p-2 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all active:scale-95"
                    >
                        <Menu size={20}/>
                    </button>

                    
                    <div className="flex items-center gap-2.5 text-white font-bold text-lg tracking-tight cursor-pointer">
                        <div className="bg-white/10 p-1.5 rounded-lg border border-white/20 flex items-center justify-center">
                            <School size={18} className="text-secondary" />
                        </div>
                        <span className="hidden xs:inline font-serif tracking-tight">
                            EduSphere<span className="text-accent-gold font-sans font-bold text-xs uppercase tracking-[0.2em] ml-2 block sm:inline">Admin</span>
                        </span>
                    </div>
                </div>


                {/* Central Block: Search Bar / Active School Name */}
                <div className="hidden lg:flex items-center flex-1 max-w-xl px-8">
                    {(role === 'school_admin' || role === 'teacher' || role === 'student') && activeSchool ? (
                        <div className="flex-1 text-center">
                            <h1 className="text-white font-serif font-bold text-md tracking-tight bg-white/10 px-5 py-1.5 rounded-xl inline-block border border-white/20">
                                {activeSchool.name}
                            </h1>
                        </div>
                    ) : (
                        <div className="flex items-center bg-white/10 border border-white/15 rounded-xl px-4 py-2 gap-3 w-full transition-all focus-within:bg-white/15 focus-within:border-white/30 focus-within:ring-2 focus-within:ring-accent-gold/20 group">
                            <Search size={14} className="text-white/60 group-focus-within:text-white transition-colors shrink-0"/>
                            <input 
                                type="text" 
                                placeholder="Search registries, credentials..." 
                                className="bg-transparent border-none outline-none text-white text-xs w-full placeholder:text-white/40 font-medium" 
                                value={searchQuery} 
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    if (e.target.value && !['schools-list', 'schools', 'users-list', 'payment-details'].includes(currentPage)) {
                                        setCurrentPage('schools-list');
                                    }
                                }}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="text-white/40 hover:text-white shrink-0">
                                    <X size={12}/>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Block: Notification Bell & Profile Controls */}
                <div className="flex items-center gap-4 shrink-0">
                    <button 
                        onClick={handleNotificationClick} 
                        className="flex items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all relative group"
                    >
                        <Bell size={18} className="group-hover:rotate-12 transition-transform duration-200"/>
                        <span className="absolute top-1 right-1 w-2 h-2 bg-danger border border-primary rounded-full" />
                    </button>
                    
                    <div className="h-6 w-px bg-white/20 hidden sm:block"></div>

                    <div 
                        className="flex items-center gap-3 relative cursor-pointer" 
                        ref={menuRef} 
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    >
                        <div className="hidden sm:flex flex-col items-end justify-center">
                            <span className="text-xs font-bold text-white leading-none">
                                {role === 'super_admin' && 'Admin Executive'}
                                {role === 'school_admin' && (activeSchool?.name || 'School Admin')}
                                {role === 'teacher' && (activeSchool?.name ? `Faculty member` : 'Faculty')}
                                {role === 'student' && (activeSchool?.name ? `Student` : 'Student')}
                            </span>
                            <span className="text-[9px] font-bold tracking-wider text-accent-gold uppercase mt-1">
                                {role === 'super_admin' && 'Super Admin'}
                                {role === 'school_admin' && 'School Admin'}
                                {role === 'teacher' && 'Teacher'}
                                {role === 'student' && 'Student'}
                            </span>
                        </div>
                        
                        <button className={`w-9 h-9 rounded-xl bg-white text-primary font-bold shadow-sm border border-white/20 hover:border-white transition-all flex items-center justify-center overflow-hidden ${isUserMenuOpen ? 'ring-2 ring-accent-gold/40' : ''}`}>
                            <User size={16} className="text-primary-dark shrink-0" />
                        </button>

                        <AnimatePresence>
                            {isUserMenuOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 8, scale: 0.95 }} 
                                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                                    exit={{ opacity: 0, y: 8, scale: 0.95 }} 
                                    className="absolute right-0 top-[120%] mt-2 w-52 bg-white rounded-xl shadow-lg border border-border overflow-hidden py-1 z-50 text-text-color cursor-default" 
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="px-4 py-2 border-b border-border/60 mb-1">
                                        <p className="text-[9px] font-bold text-accent-gold uppercase tracking-wider">
                                            {role === 'super_admin' && 'Super Admin Panel'}
                                            {role === 'school_admin' && 'School Session'}
                                            {role === 'teacher' && 'Teacher Portal'}
                                            {role === 'student' && 'Student Portal'}
                                        </p>
                                    </div>
                                    <button onClick={() => { setCurrentPage('profile'); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-primary hover:bg-secondary/40 transition-colors">
                                        <User size={14}/> My Profile
                                    </button>
                                    <button onClick={() => { setCurrentPage('settings'); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-primary hover:bg-secondary/40 transition-colors">
                                        <Settings size={14}/> Account Settings
                                    </button>
                                    {role === 'super_admin' && (
                                        <button onClick={() => { setCurrentPage('payment-details'); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-primary hover:bg-secondary/40 transition-colors">
                                            <CreditCard size={14}/> Billing History
                                        </button>
                                    )}
                                    <div className="h-px bg-border/60 my-1 mx-2"></div>
                                    <button onClick={() => { handleLogoutClick(); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-danger hover:bg-danger/5 transition-colors">
                                        <LogOut size={14}/> Sign Out
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            {/* ─── BODY (Sidebar & Main Workspace Content) ─── */}
            <div className="flex flex-1 relative overflow-hidden min-h-0">
                
                {/* Sidebar Navigation */}
                <aside className={`
                    fixed lg:static top-16 bottom-0 lg:h-full w-64 shrink-0 bg-white border-r border-border py-4 z-40 transition-transform duration-300 shadow-sm lg:shadow-none overflow-y-auto custom-scrollbar
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}>
                    <nav className="flex flex-col gap-1 px-3">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const hasSubItems = !!item.subItems;
                            const isActive = currentPage === item.id || (item.id === 'schools' && (currentPage === 'form' || currentPage.startsWith('schools-') || currentPage === 'users-list' || currentPage === 'payment-details'));
                            return (
                                <div key={item.id} className="flex flex-col gap-1">
                                    <button 
                                        onClick={() => {
                                            if (hasSubItems) {
                                                setIsSchoolsExpanded(!isSchoolsExpanded);
                                                if (!isActive)
                                                    setCurrentPage('schools-list');
                                            } else {
                                                setCurrentPage(item.id);
                                                setIsSidebarOpen(false);
                                            }
                                        }} 
                                        className={`
                                            flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all group border-l-2 w-full
                                            ${isActive
                                                ? 'bg-primary/5 text-primary border-accent-gold font-bold shadow-sm'
                                                : 'text-text-light hover:bg-slate-100 hover:text-primary border-transparent'}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon size={16} className={isActive ? 'text-primary' : 'text-text-light group-hover:text-primary transition-colors'}/>
                                            {item.label}
                                        </div>
                                        {hasSubItems && (
                                            <ChevronDown size={14} className={`transition-transform duration-200 ${isSchoolsExpanded ? 'rotate-180' : ''}`}/>
                                        )}
                                    </button>

                                    {/* Sub-menu items */}
                                    <AnimatePresence>
                                        {hasSubItems && isSchoolsExpanded && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }} 
                                                animate={{ height: 'auto', opacity: 1 }} 
                                                exit={{ height: 0, opacity: 0 }} 
                                                transition={{ duration: 0.2, ease: 'easeInOut' }} 
                                                className="overflow-hidden flex flex-col gap-1 pl-6 mt-0.5"
                                            >
                                                {item.subItems?.map((subItem) => {
                                                    const SubIcon = subItem.icon;
                                                    const isSubActive = currentPage === subItem.id || (subItem.id === 'schools-list' && currentPage === 'schools');
                                                    return (
                                                        <button 
                                                            key={subItem.id} 
                                                            onClick={() => {
                                                                setCurrentPage(subItem.id);
                                                                setIsSidebarOpen(false);
                                                            }} 
                                                            className={`
                                                                flex items-center gap-2.5 px-4 py-2 rounded-lg text-[11px] font-bold transition-colors group
                                                                ${isSubActive
                                                                    ? 'text-primary bg-primary/5'
                                                                    : 'text-text-light hover:text-primary hover:bg-slate-100'}
                                                            `}
                                                        >
                                                            <SubIcon size={12}/>
                                                            {subItem.label}
                                                        </button>
                                                    );
                                                })}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </nav>
                </aside>

                {/* Backdrop drawer for mobile layout */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setIsSidebarOpen(false)} 
                            className="fixed inset-0 bg-primary-dark/40 backdrop-blur-sm z-30 lg:hidden"
                        />
                    )}
                </AnimatePresence>

                {/* Main Workspace Frame */}
                <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden custom-scrollbar bg-light-gray/30">
                    <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-3 duration-300">
                        {children}
                    </div>
                </main>
            </div>

        </div>
    );
};
