import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, Search, Filter, Download, Circle, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
export const UsersList = ({ users, schools = [], searchQuery: globalSearch = '', onAddUser, onEditUser, onDeleteUser }) => {
    const schoolMap = {};
    schools.forEach(s => { schoolMap[s.schoolId || s.id] = s.name; });

    const [localSearchQuery, setLocalSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [roleFilter, setRoleFilter] = useState('All');
    const effectiveSearch = globalSearch || localSearchQuery;
    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.name || '').toLowerCase().includes(effectiveSearch.toLowerCase()) ||
            (user.email || '').toLowerCase().includes(effectiveSearch.toLowerCase()) ||
            (user.id || '').toLowerCase().includes(effectiveSearch.toLowerCase()) ||
            (user.phone || '').toLowerCase().includes(effectiveSearch.toLowerCase());
        const matchesRole = roleFilter === 'All' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });
    const handleExport = () => {
        toast.promise(new Promise(resolve => {
            setTimeout(() => {
                const headers = ['S.NO', 'ID', 'NAME', 'EMAIL', 'ROLE', 'SCHOOL', 'CITY', 'STATE', 'MOBILE', 'OTP', 'STATUS', 'CREATED ON'];
                const csvContent = [
                    headers.join(','),
                    ...filteredUsers.map((user, index) => [
                        index + 1,
                        user.id,
                        `"${user.name}"`,
                        `"${user.email}"`,
                        user.role,
                        `"${schoolMap[user.schoolId] || 'Platform Admin'}"`,
                        `"${user.city}"`,
                        `"${user.state}"`,
                        user.phone,
                        user.otp,
                        user.status,
                        `"${user.createdOn}"`
                    ].join(','))
                ].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                resolve();
            }, 1500);
        }), {
            loading: 'Generating user data sheet...',
            success: 'User records exported successfully!',
            error: 'Failed to export records',
        });
    };
    const handlePreview = (user) => {
        toast(`Previewing details for ${user.name}`, {
            description: `Role: ${user.role} | Status: ${user.status}`,
        });
    };
    return (<div className="space-y-6 md:space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1e293b]">USERS LIST</h2>
          <p className="text-sm text-text-light max-w-2xl">Manage and monitor all platform users across different roles with advanced administrative controls.</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-border shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6 items-stretch lg:items-center">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light group-focus-within:text-primary transition-colors" size={18}/>
            <input type="text" placeholder="Search by ID, Name, Email, or Mobile..." value={localSearchQuery} onChange={(e) => setLocalSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3.5 md:py-4 bg-gray-50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"/>
          </div>
          <div className="flex items-center gap-3 md:gap-4 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
            <button onClick={() => setShowFilters(!showFilters)} className={`flex-1 lg:flex-none flex items-center justify-center gap-2.5 px-6 py-3.5 md:py-4 border rounded-xl text-sm font-black transition-all shadow-sm active:scale-95 shrink-0 ${showFilters ? 'bg-primary/5 border-primary text-primary' : 'bg-white border-border text-text-color hover:bg-gray-50'}`}>
              <Filter size={18} className={showFilters ? 'text-primary' : 'text-text-light'}/>
              <span>{showFilters ? 'CLOSE' : 'FILTER'}</span>
            </button>
            <button onClick={handleExport} className="flex-1 lg:flex-none flex items-center justify-center gap-2.5 px-6 py-3.5 md:py-4 bg-white border border-border rounded-xl text-sm font-black text-text-color hover:bg-gray-50 transition-all shadow-sm active:scale-95 shrink-0">
              <Download size={18} className="text-success"/>
              <span>EXPORT</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-text-light uppercase tracking-widest">Filter by Role</label>
                  <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full p-3 bg-gray-50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-all font-bold appearance-none cursor-pointer">
                    <option value="All">All Roles</option>
                    <option value="Admin">Admin</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Student">Student</option>
                  </select>
                </div>
              </div>
            </motion.div>)}
        </AnimatePresence>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-gray-50/50 border-b border-border">
                <th className="px-3 py-4 text-[10px] md:text-xs font-black text-text-light uppercase tracking-tighter">S.NO</th>
                <th className="px-3 py-4 text-[10px] md:text-xs font-black text-text-light uppercase tracking-tighter">ID</th>
                <th className="px-3 py-4 text-[10px] md:text-xs font-black text-text-light uppercase tracking-tighter">NAME</th>
                <th className="px-3 py-4 text-[10px] md:text-xs font-black text-text-light uppercase tracking-tighter">EMAIL</th>
                <th className="px-3 py-4 text-[10px] md:text-xs font-black text-text-light uppercase tracking-tighter">ROLE</th>
                <th className="px-3 py-4 text-[10px] md:text-xs font-black text-text-light uppercase tracking-tighter">SCHOOL</th>
                <th className="px-3 py-4 text-[10px] md:text-xs font-black text-text-light uppercase tracking-tighter">CITY</th>
                <th className="px-3 py-4 text-[10px] md:text-xs font-black text-text-light uppercase tracking-tighter">STATE</th>
                <th className="px-3 py-4 text-[10px] md:text-xs font-black text-text-light uppercase tracking-tighter">MOBILE</th>
                <th className="px-3 py-4 text-[10px] md:text-xs font-black text-text-light uppercase tracking-tighter">STATUS</th>
                <th className="px-3 py-4 text-[10px] md:text-xs font-black text-text-light uppercase tracking-tighter">CREATED ON</th>
                <th className="px-3 py-4 text-[10px] md:text-xs font-black text-text-light uppercase tracking-tighter text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user, index) => (<motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.03 }} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-3 py-3 font-bold text-text-light">
                    {index + 1}
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-[10px] font-mono font-bold bg-gray-100 text-text-color px-1.5 py-0.5 rounded">#{user.id}</span>
                  </td>
                  <td className="px-3 py-3 font-bold text-text-color max-w-[160px] truncate">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 border border-border overflow-hidden shrink-0 flex items-center justify-center">
                        {user.photo ? (
                          <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon size={12} className="text-gray-400" />
                        )}
                      </div>
                      <span className="truncate" title={user.name}>{user.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-text-light italic max-w-[140px] truncate" title={user.email}>
                    {user.email}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`
                      px-1.5 py-0.5 rounded text-[9px] font-bold uppercase
                      ${user.role === 'Admin' ? 'bg-primary/10 text-primary' : ''}
                      ${user.role === 'School Admin' ? 'bg-indigo-100 text-indigo-700' : ''}
                      ${user.role === 'Teacher' ? 'bg-accent-blue/10 text-accent-blue' : ''}
                      ${user.role === 'Student' ? 'bg-success/10 text-success' : ''}
                    `}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-text-color truncate max-w-[150px]" title={schoolMap[user.schoolId] || user.schoolId || 'N/A'}>
                    <span className="font-semibold text-text-color">{schoolMap[user.schoolId] || 'Platform Admin'}</span>
                  </td>
                  <td className="px-3 py-3 text-text-color truncate max-w-[90px]" title={user.city}>
                    {user.city}
                  </td>
                  <td className="px-3 py-3 text-text-color truncate max-w-[90px]" title={user.state}>
                    {user.state}
                  </td>
                  <td className="px-3 py-3 text-text-color font-mono text-xs">
                    {user.phone || <span className="text-text-light">—</span>}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`
                      px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 w-fit
                      ${user.status === 'Active' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}
                    `}>
                      <Circle size={6} fill="currentColor"/>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-text-light text-xs">
                    {user.createdOn}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-0.5">
                      <button onClick={() => handlePreview(user)} className="p-1 hover:bg-primary/10 text-text-light hover:text-primary rounded transition-all" title="Preview">
                        <Eye size={13}/>
                      </button>
                      <button onClick={() => onEditUser(user)} className="p-1 hover:bg-accent-blue/10 text-text-light hover:text-accent-blue rounded transition-all" title="Edit">
                        <Edit2 size={13}/>
                      </button>
                      <button onClick={() => onDeleteUser(user.id)} className="p-1 hover:bg-danger/10 text-text-light hover:text-danger rounded transition-all" title="Delete">
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </td>
                </motion.tr>))}
              {filteredUsers.length === 0 && (<tr>
                  <td colSpan={12} className="px-6 py-20 text-center text-text-light font-bold">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Search size={48} className="text-gray-300" />
                      <h3 className="text-xl font-bold text-gray-800">Not Found</h3>
                      <p className="text-sm text-gray-500">No users found matching your search.</p>
                    </div>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>);
};
