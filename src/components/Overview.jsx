import React from 'react';
import { motion } from 'motion/react';
import { IndianRupee, Briefcase, TrendingUp, Activity, School, Users, Calendar } from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const chartData = [
    { month: 'Jan', revenue: 4500, growth: 5 },
    { month: 'Feb', revenue: 5200, growth: 8 },
    { month: 'Mar', revenue: 4800, growth: 6 },
    { month: 'Apr', revenue: 6100, growth: 12 },
    { month: 'May', revenue: 7500, growth: 15 },
    { month: 'Jun', revenue: 8900, growth: 18 },
    { month: 'Jul', revenue: 9500, growth: 22 },
];

const MetricCard = ({ label, value, icon, trend, color, delay }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay }} 
        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition-all"
    >
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl border border-slate-100 ${color}`}>
                {icon}
            </div>
            {trend && (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                    <TrendingUp size={12}/>
                    {trend}
                </span>
            )}
        </div>
        <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-3xl font-black text-[#1e293b]">{value}</p>
        </div>
    </motion.div>
);

// School Admin Specific Overview Component (Figma Style Desktop - 19 with Clean theme)
export const SchoolAdminOverview = () => {
    const savedUsers = JSON.parse(localStorage.getItem('school_management_users') || '[]');
    const studentsCount = savedUsers.filter(u => u.role === 'Student').length || 659;
    const teachersCount = savedUsers.filter(u => u.role === 'Teacher').length || 17;

    const donutData = [
        { name: 'Primary (1-5)', value: 240, color: '#ec4899' }, // pink-500
        { name: 'Middle (6-8)', value: 190, color: '#a855f7' }, // purple-500
        { name: 'Secondary (9-10)', value: 130, color: '#3b82f6' }, // blue-500
        { name: 'Sr. Secondary (11-12)', value: 99, color: '#eab308' }, // yellow-500
    ];

    const lineData = [
        { name: 'Jan', rate: 92 },
        { name: 'Feb', rate: 94 },
        { name: 'Mar', rate: 89 },
        { name: 'Apr', rate: 95 },
        { name: 'May', rate: 91 },
        { name: 'Jun', rate: 88 },
    ];

    const waveData = [
        { name: 'Unit 1', score: 74 },
        { name: 'Unit 2', score: 78 },
        { name: 'Quarterly', score: 72 },
        { name: 'Unit 3', score: 85 },
        { name: 'Half Yearly', score: 81 },
        { name: 'Unit 4', score: 89 },
        { name: 'Finals', score: 92 },
    ];

    return (
        <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Title Banner */}
            <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-black text-[#1e293b] tracking-tight uppercase">Analytics Overview</h2>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">School Performance Dashboard</p>
            </div>

            {/* Top Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard label="Total Students" value={studentsCount} icon={<Users size={22} />} color="bg-pink-50 text-pink-600" delay={0.1} />
                <MetricCard label="Teachers" value={teachersCount} icon={<Users size={22} />} color="bg-purple-50 text-purple-600" delay={0.2} />
                <MetricCard label="Attendance" value="89%" icon={<TrendingUp size={22} />} color="bg-blue-50 text-blue-600" delay={0.3} />
            </div>

            {/* Side-by-side Donut & Line charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Grade Distribution Donut Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-6">Grade Distribution</h3>
                    <div className="h-[280px] flex flex-col items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="90%">
                            <PieChart>
                                <Pie
                                    data={donutData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {donutData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Custom Legend */}
                        <div className="flex flex-wrap justify-center gap-4 text-[9px] font-bold text-slate-650 uppercase">
                            {donutData.map((d, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-sm border border-slate-200" style={{ backgroundColor: d.color }} />
                                    <span>{d.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Line Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-6">Monthly Attendance Rate (%)</h3>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" stroke="#64748b" strokeWidth={1} tick={{ fontSize: 10 }} />
                                <YAxis stroke="#64748b" strokeWidth={1} tick={{ fontSize: 10 }} domain={[80, 100]} />
                                <Tooltip />
                                <Line 
                                    type="monotone" 
                                    dataKey="rate" 
                                    stroke="#4f46e5" 
                                    strokeWidth={3} 
                                    dot={{ r: 5, stroke: '#ffffff', strokeWidth: 2, fill: '#4f46e5' }} 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Centered Academic Progress Wave Chart below */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-6">Academic Progress Wave</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={waveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="waveProgress" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" stroke="#64748b" strokeWidth={1} tick={{ fontSize: 10 }} />
                            <YAxis stroke="#64748b" strokeWidth={1} tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Area 
                                type="monotone" 
                                dataKey="score" 
                                stroke="#4f46e5" 
                                strokeWidth={3} 
                                fill="url(#waveProgress)" 
                                dot={{ r: 4, stroke: '#ffffff', strokeWidth: 1.5, fill: '#4f46e5' }} 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export const Overview = ({ schools, plans, users = [] }) => {
    const [isSuperAdmin, setIsSuperAdmin] = React.useState(true);

    React.useEffect(() => {
        const isUrlSA = window.location.pathname.includes('/super-admin');
        const hasAdminUser = Array.from(document.querySelectorAll('span')).some(
            el => el.textContent === 'Admin User' || el.textContent === 'Super Admin' || el.textContent === 'Admin Executive'
        );
        setIsSuperAdmin(isUrlSA || hasAdminUser);
    }, []);

    // Render School Admin Overview if not Super Admin
    if (!isSuperAdmin) {
        return <SchoolAdminOverview />;
    }

    // Real Super Admin overview stats derived from actual site data
    const paidSchools = schools.filter(s => s.status === 'Paid' || s.status === 'Active');
    const totalRevenue = paidSchools.reduce((sum, s) => sum + (s.amount || 0), 0);
    const activePlansCount = plans.filter(p => p.isActive !== false).length;
    const totalPlansCount = plans.length;

    // Real Growth Rate: Percentage of registered schools that are Paid/Active
    const growthRateVal = schools.length > 0 
        ? ((paidSchools.length / schools.length) * 100).toFixed(1)
        : '0.0';

    // Real System Usage: Percentage of active subscription plans configured
    const systemUsageVal = totalPlansCount > 0 
        ? Math.round((activePlansCount / totalPlansCount) * 100)
        : 0;

    const stats = {
        totalRevenue: totalRevenue,
        activePlans: activePlansCount,
        growthRate: growthRateVal,
        systemUsage: systemUsageVal,
        totalSchools: schools.length,
        totalUsers: users.length || schools.reduce((sum, s) => sum + (s.students || 0) + (s.teachers || 0), 0),
    };

    // Build real monthly cumulative revenue chart data from actual paid schools
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dynamicChartData = months.map((m, idx) => {
        // Cumulative revenue from paid schools active on or before this month
        const cumulativeRevenue = paidSchools
            .filter(s => {
                const dateStr = s.startDate || s.createdOn;
                if (!dateStr) return true; // Always include if no start date set
                const d = new Date(dateStr);
                if (isNaN(d.getTime())) return true;
                return d.getMonth() <= idx; // Included from subscription month through end of year
            })
            .reduce((sum, s) => sum + (s.amount || 0), 0);

        return {
            month: m,
            revenue: cumulativeRevenue
        };
    });

    return (
        <div className="space-y-8 pb-20">
            <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-[#1e293b]">Platform Overview</h2>
                <p className="text-sm text-text-light">Real-time performance metrics and analytics summary.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard label="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={<IndianRupee size={24}/>} trend={`${paidSchools.length} Paid`} color="bg-primary/10 text-primary" delay={0.1}/>
                <MetricCard label="Active Plans" value={stats.activePlans} icon={<Briefcase size={24}/>} color="bg-accent-blue/10 text-accent-blue" delay={0.2}/>
                <MetricCard label="Paid Conversion" value={`${stats.growthRate}%`} icon={<TrendingUp size={24}/>} trend="Real" color="bg-success/10 text-success" delay={0.3}/>
                <MetricCard label="System Usage" value={`${stats.systemUsage}%`} icon={<Activity size={24}/>} color="bg-warning/10 text-warning" delay={0.4}/>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-2 bg-white p-8 rounded-2xl border border-border shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-bold text-[#1e293b] flex items-center gap-2">
                            <Activity size={20} className="text-primary"/>
                            Revenue Analysis
                        </h3>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1 text-[10px] font-bold text-text-light uppercase">
                                <div className="w-2 h-2 rounded-full bg-primary"/>
                                Collected Revenue
                            </span>
                        </div>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dynamicChartData}>
                                <defs>
                                    <linearGradient id="ovRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0284C7" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#0284C7" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10}/>
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `₹${val}`}/>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #BAE6FD', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(val) => [`₹${val.toLocaleString()}`, 'Revenue']}/>
                                <Area type="monotone" dataKey="revenue" stroke="#0284C7" strokeWidth={3} fill="url(#ovRevenue)"/>
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="bg-white p-8 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
                    <div className="space-y-6">
                        <h3 className="font-bold text-[#1e293b]">Quick Stats</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm">
                                        <School size={20}/>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-text-light uppercase tracking-widest">Schools</p>
                                        <p className="text-lg font-bold text-text-color">{stats.totalSchools}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-success shadow-sm">
                                        <Users size={20}/>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-text-light uppercase tracking-widest">Total Users</p>
                                        <p className="text-lg font-bold text-text-color">{stats.totalUsers.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-8 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar size={16} className="text-primary"/>
                            <p className="text-xs font-bold text-primary">Paid Subscriptions</p>
                        </div>
                        <p className="text-sm text-text-color">{paidSchools.length} of {schools.length} schools active paid.</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
