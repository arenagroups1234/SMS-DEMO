import React, { useState } from 'react';
import { Plus, Edit2, Trash2, CreditCard, School, LogIn, ExternalLink, Download, Search, X, MapPin, Phone, Mail, Calendar, Users, DollarSign, ShieldCheck, Hotel } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
export const SchoolsList = ({ schools, onAddSchool, onEditSchool, onDeleteSchool, onSelectSchool, onLoginSchool, searchQuery, currentPage, setCurrentPage }) => {
    const navigate = useNavigate();
    const [nameSearch, setNameSearch] = useState('');
    const [idSearch, setIdSearch] = useState('');
    const [citySearch, setCitySearch] = useState('');
    const [previewSchool, setPreviewSchool] = useState(null);
    const activeTab = currentPage === 'schools' || currentPage === 'schools-list' ? 'schools' : 'payments';

    const [hostelStatuses, setHostelStatuses] = useState({});

    React.useEffect(() => {
        const statuses = {};
        schools.forEach(s => {
            statuses[s.id] = localStorage.getItem(`sms_${s.id}_hostel_enabled`) === 'true';
        });
        setHostelStatuses(statuses);
    }, [schools]);

    const handleToggleHostelDirect = (schoolId, schoolName) => {
        const currentVal = !!hostelStatuses[schoolId];
        const newVal = !currentVal;
        localStorage.setItem(`sms_${schoolId}_hostel_enabled`, String(newVal));
        setHostelStatuses(prev => ({ ...prev, [schoolId]: newVal }));
        window.dispatchEvent(new Event("sms_settings_update"));
        toast.success(`Hostel Module ${newVal ? 'enabled' : 'disabled'} for ${schoolName}!`);
    };
    const filteredSchools = schools.filter(s => {
        const matchesGlobal = searchQuery === '' ||
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.state.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesName = nameSearch === '' || s.name.toLowerCase().includes(nameSearch.toLowerCase());
        const matchesId = idSearch === '' || s.id.toLowerCase().includes(idSearch.toLowerCase());
        const matchesCity = citySearch === '' || s.location.toLowerCase().includes(citySearch.toLowerCase());
        return matchesGlobal && matchesName && matchesId && matchesCity;
    });
    const handleExport = () => {
        toast.promise(new Promise(res => setTimeout(res, 1500)), {
            loading: 'Exporting institutional directory...',
            success: 'School records exported successfully!',
            error: 'Export failed',
        });
        // Original CSV download logic
        const csvContent = "data:text/csv;charset=utf-8,"
            + ["ID,Name,Teachers,Students,State,City,Plan,Status,Amount"].concat(filteredSchools.map(s => `${s.id},"${s.name}",${s.teachers},${s.students},"${s.state}","${s.location}","${s.planName || '-'}",${s.status},${s.amount}`)).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "schools_list.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const handleLogin = (school) => {
        toast.success(`Logging in as Admin for ${school.name}...`);
        // Store school info for the portal
        localStorage.setItem('sms_active_school', JSON.stringify(school));
        // Navigate directly to the school admin portal
        setTimeout(() => {
            navigate(`/school-portal/${school.id}`);
        }, 400);
        if (onLoginSchool) {
            onLoginSchool(school);
        }
    };
    const handlePreview = (school) => {
        setPreviewSchool(school);
    };
    // Mock data for Subscriptions
    const mockSubscriptions = [
        { id: '1', schoolId: '1', planName: 'Premium Plan', expiryDate: '2027-01-01', amount: 150000, status: 'Active' },
        { id: '2', schoolId: '2', planName: 'Standard Plan', expiryDate: '2026-08-15', amount: 225000, status: 'Expiring' },
        { id: '3', schoolId: '3', planName: 'Basic Plan', expiryDate: '2026-03-10', amount: 250000, status: 'Expired' },
    ];
    const tabs = [
        { id: 'schools', label: 'School List', icon: School },
        { id: 'payments', label: 'Payment Details', icon: CreditCard },
    ];
    return (<div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1e293b]">Manage Schools</h2>
        <p className="text-sm text-text-light">View and manage schools, users, and subscriptions.</p>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-8">
        <div className="flex items-center p-1.5 bg-gray-100 rounded-2xl w-full md:w-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (<button key={tab.id} onClick={() => setCurrentPage(tab.id === 'payments' ? 'payment-details' : 'schools-list')} className={`
                  flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all
                  ${isActive
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-text-light hover:text-text-color hover:bg-white/50'}
                `}>
                <Icon size={18}/>
                {tab.label}
              </button>);
        })}
        </div>

        <div className="flex items-center gap-4 ml-auto w-full md:w-auto">
          <button onClick={handleExport} className="bg-white border border-border text-text-color px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 shadow-sm hover:bg-gray-50 hover:-translate-y-0.5 transition-all active:scale-95 shrink-0">
            <Download size={18}/>
            Export
          </button>

          <button onClick={onAddSchool} className="bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-primary/30 hover:-translate-y-0.5 transition-all active:scale-95 shrink-0">
            <Plus size={18}/>
            Add New School
          </button>
        </div>
      </div>

      {/* Advanced Search Inputs */}
      {activeTab === 'schools' && (<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light group-focus-within:text-primary transition-colors" size={18}/>
            <input type="text" placeholder="Search by Name..." value={nameSearch} onChange={(e) => setNameSearch(e.target.value)} className="w-full bg-white border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"/>
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light group-focus-within:text-primary transition-colors" size={18}/>
            <input type="text" placeholder="Search by ID..." value={idSearch} onChange={(e) => setIdSearch(e.target.value)} className="w-full bg-white border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"/>
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light group-focus-within:text-primary transition-colors" size={18}/>
            <input type="text" placeholder="Search by City..." value={citySearch} onChange={(e) => setCitySearch(e.target.value)} className="w-full bg-white border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"/>
          </div>
        </div>)}

      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'schools' && (<table className="w-full border-collapse">
              <thead className="bg-gradient-to-r from-light-gray to-[#f1f5f9] border-b-2 border-border">
                <tr>
                  <th className="px-3 py-3 md:px-4 md:py-3.5 text-left text-[11px] md:text-xs font-bold text-text-color uppercase tracking-wider">Id</th>
                  <th className="px-3 py-3 md:px-4 md:py-3.5 text-left text-[11px] md:text-xs font-bold text-text-color uppercase tracking-wider">Name</th>
                  <th className="px-3 py-3 md:px-4 md:py-3.5 text-left text-[11px] md:text-xs font-bold text-text-color uppercase tracking-wider">Teachers</th>
                  <th className="px-3 py-3 md:px-4 md:py-3.5 text-left text-[11px] md:text-xs font-bold text-text-color uppercase tracking-wider">Students</th>
                  <th className="px-3 py-3 md:px-4 md:py-3.5 text-left text-[11px] md:text-xs font-bold text-text-color uppercase tracking-wider">State</th>
                  <th className="px-3 py-3 md:px-4 md:py-3.5 text-left text-[11px] md:text-xs font-bold text-text-color uppercase tracking-wider">City</th>
                  <th className="px-3 py-3 md:px-4 md:py-3.5 text-left text-[11px] md:text-xs font-bold text-text-color uppercase tracking-wider">Plan</th>
                  <th className="px-3 py-3 md:px-4 md:py-3.5 text-left text-[11px] md:text-xs font-bold text-text-color uppercase tracking-wider">Status</th>
                  <th className="px-3 py-3 md:px-4 md:py-3.5 text-left text-[11px] md:text-xs font-bold text-text-color uppercase tracking-wider">Amount</th>
                  <th className="px-3 py-3 md:px-4 md:py-3.5 text-left text-[11px] md:text-xs font-bold text-text-color uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs md:text-sm">
                {filteredSchools.length > 0 ? (filteredSchools.map((school, index) => (<motion.tr initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} key={school.id} className="hover:bg-light-gray transition-colors">
                      <td className="px-3 py-3 md:px-4 md:py-3.5 whitespace-nowrap font-mono text-text-light text-xs">
                        #{school.id.slice(0, 4)}
                      </td>
                      <td className="px-3 py-3 md:px-4 md:py-3.5 font-bold text-text-color max-w-[150px] truncate">
                        <button onClick={() => onSelectSchool(school)} className="hover:text-primary transition-colors text-left truncate w-full" title={school.name}>
                          {school.name}
                        </button>
                      </td>
                      <td className="px-3 py-3 md:px-4 md:py-3.5 whitespace-nowrap text-text-color">
                        {(school.teachers ?? 0).toLocaleString('en-US')}
                      </td>
                      <td className="px-3 py-3 md:px-4 md:py-3.5 whitespace-nowrap text-text-color">
                        {(school.students ?? 0).toLocaleString('en-US')}
                      </td>
                      <td className="px-3 py-3 md:px-4 md:py-3.5 text-text-color truncate max-w-[100px]" title={school.state}>
                        {school.state}
                      </td>
                      <td className="px-3 py-3 md:px-4 md:py-3.5 text-text-color truncate max-w-[100px]" title={school.location}>
                        {school.location}
                      </td>
                      <td className="px-3 py-3 md:px-4 md:py-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                          {school.planName || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3 md:px-4 md:py-3.5 whitespace-nowrap">
                        <span className={`
                          status-badge text-[10px] px-2 py-0.5
                          ${school.status === 'Paid' ? 'status-badge-paid' : ''}
                          ${school.status === 'Pending' ? 'status-badge-pending' : ''}
                          ${school.status === 'Unpaid' ? 'status-badge-unpaid' : ''}
                        `}>
                          {school.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 md:px-4 md:py-3.5 whitespace-nowrap text-text-color font-semibold">
                        ₹{school.amount.toLocaleString('en-US')}
                      </td>
                      <td className="px-3 py-3 md:px-4 md:py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleLogin(school)} className="p-1 rounded bg-success/15 text-success hover:bg-success hover:text-white transition-all" title="Login">
                            <LogIn size={13}/>
                          </button>
                          <button 
                            onClick={() => handleToggleHostelDirect(school.id, school.name)} 
                            className={`p-1 rounded transition-all ${hostelStatuses[school.id] ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-600 hover:text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`} 
                            title={hostelStatuses[school.id] ? "Hostel: Enabled (Click to Disable)" : "Hostel: Disabled (Click to Enable)"}
                          >
                            <Hotel size={13}/>
                          </button>
                          <button onClick={() => handlePreview(school)} className="p-1 rounded bg-primary/10 text-primary-dark hover:bg-primary-dark hover:text-white transition-all" title="Preview">
                            <ExternalLink size={13}/>
                          </button>
                          <button onClick={() => onEditSchool(school)} className="p-1 rounded bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all" title="Edit">
                            <Edit2 size={13}/>
                          </button>
                          <button onClick={() => onDeleteSchool(school.id)} className="p-1 rounded bg-danger/10 text-danger hover:bg-danger hover:text-white transition-all" title="Delete">
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </td>
                    </motion.tr>))) : (<tr>
                    <td colSpan={10} className="px-3 py-8 text-center text-text-light">
                      {searchQuery || nameSearch || idSearch || citySearch ? (
                        <div className="flex flex-col items-center justify-center space-y-3 py-6">
                          <Search size={48} className="text-gray-300" />
                          <h3 className="text-xl font-bold text-gray-800">Not Found</h3>
                          <p className="text-sm text-gray-500">No schools match your search query.</p>
                        </div>
                      ) : (<div>
                          <p className="mb-4">No schools found.</p>
                          <button onClick={onAddSchool} className="text-primary font-semibold underline hover:text-primary-dark">
                            Add one now!
                          </button>
                        </div>)}
                    </td>
                  </tr>)}
              </tbody>
            </table>)}

          {activeTab === 'payments' && (<table className="w-full border-collapse">
              <thead className="bg-gradient-to-r from-light-gray to-[#f1f5f9] border-b-2 border-border">
                <tr>
                  <th className="px-3 py-3 md:px-4 md:py-3.5 text-left text-[11px] md:text-xs font-bold text-text-color uppercase tracking-wider">Plan Name</th>
                  <th className="px-3 py-3 md:px-4 md:py-3.5 text-left text-[11px] md:text-xs font-bold text-text-color uppercase tracking-wider">Expiry Date</th>
                  <th className="px-3 py-3 md:px-4 md:py-3.5 text-left text-[11px] md:text-xs font-bold text-text-color uppercase tracking-wider">Amount</th>
                  <th className="px-3 py-3 md:px-4 md:py-3.5 text-left text-[11px] md:text-xs font-bold text-text-color uppercase tracking-wider">Status</th>
                  <th className="px-3 py-3 md:px-4 md:py-3.5 text-left text-[11px] md:text-xs font-bold text-text-color uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs md:text-sm">
                {mockSubscriptions.map((sub, index) => (<motion.tr initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} key={sub.id} className="hover:bg-light-gray transition-colors">
                    <td className="px-3 py-3 md:px-4 md:py-3.5 font-medium text-text-color">{sub.planName}</td>
                    <td className="px-3 py-3 md:px-4 md:py-3.5 text-text-color">{sub.expiryDate}</td>
                    <td className="px-3 py-3 md:px-4 md:py-3.5 text-text-color font-semibold">₹{sub.amount.toLocaleString('en-US')}</td>
                    <td className="px-3 py-3 md:px-4 md:py-3.5 whitespace-nowrap">
                      <span className={`
                        status-badge text-[10px] px-2 py-0.5
                        ${sub.status === 'Active' ? 'status-badge-paid' : ''}
                        ${sub.status === 'Expiring' ? 'status-badge-pending' : ''}
                        ${sub.status === 'Expired' ? 'status-badge-unpaid' : ''}
                      `}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 md:px-4 md:py-3.5 whitespace-nowrap">
                      <div className="flex gap-1.5">
                        <button className="p-1 rounded bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"><Edit2 size={13}/></button>
                        <button className="p-1 rounded bg-danger/10 text-danger hover:bg-danger hover:text-white transition-all"><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </motion.tr>))}
              </tbody>
            </table>)}
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewSchool && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary to-primary-dark p-6 text-white relative shrink-0">
                <button 
                  onClick={() => setPreviewSchool(null)}
                  className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-inner">
                    <School size={32} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{previewSchool.name}</h2>
                    <p className="text-white/80 font-medium tracking-wide">ID: {previewSchool.id}</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Contact Info */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Contact Information</h3>
                      <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                          <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-gray-900">{previewSchool.address}</p>
                            <p className="text-sm text-gray-500">{previewSchool.location}, {previewSchool.state} {previewSchool.zipCode}</p>
                          </div>
                        </li>
                        <li className="flex items-center gap-3">
                          <Phone size={18} className="text-primary shrink-0" />
                          <p className="text-sm font-bold text-gray-900">{previewSchool.phone}</p>
                        </li>
                        <li className="flex items-center gap-3">
                          <Mail size={18} className="text-primary shrink-0" />
                          <p className="text-sm font-bold text-gray-900">{previewSchool.email}</p>
                        </li>
                        <li className="flex items-center gap-3">
                          <Users size={18} className="text-primary shrink-0" />
                          <p className="text-sm font-bold text-gray-900">Owner: {previewSchool.ownerName || 'N/A'}</p>
                        </li>
                      </ul>
                    </div>

                    <div>
                       <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Statistics</h3>
                       <div className="flex gap-4">
                         <div className="bg-light-gray p-4 rounded-xl flex-1 border border-border">
                           <div className="flex items-center gap-2 text-primary mb-1">
                             <Users size={16} />
                             <span className="text-xs font-bold uppercase">Students</span>
                           </div>
                           <p className="text-2xl font-black text-gray-900">{previewSchool.students?.toLocaleString()}</p>
                         </div>
                         <div className="bg-light-gray p-4 rounded-xl flex-1 border border-border">
                           <div className="flex items-center gap-2 text-secondary mb-1">
                             <Users size={16} />
                             <span className="text-xs font-bold uppercase">Teachers</span>
                           </div>
                           <p className="text-2xl font-black text-gray-900">{previewSchool.teachers?.toLocaleString()}</p>
                         </div>
                       </div>
                    </div>
                  </div>

                  {/* Subscription Info */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Subscription Details</h3>
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={20} className={previewSchool.status === 'Paid' ? 'text-success' : 'text-warning'} />
                            <span className="text-sm font-bold text-gray-700">Status</span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            previewSchool.status === 'Paid' ? 'bg-success/10 text-success' : 
                            previewSchool.status === 'Pending' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'
                          }`}>
                            {previewSchool.status}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                           <div className="flex items-center gap-2">
                             <span className="text-gray-500 font-bold text-lg leading-none w-[18px] text-center inline-block">₹</span>
                             <span className="text-sm font-medium text-gray-600">Amount Paid</span>
                           </div>
                           <span className="text-lg font-black text-gray-900">₹{previewSchool.amount?.toLocaleString()}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Calendar size={18} className="text-gray-500" />
                            <span className="text-sm font-medium text-gray-600">Validity</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-gray-900 block">{previewSchool.startDate}</span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest block">To</span>
                            <span className="text-xs font-bold text-gray-900 block">{previewSchool.endDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border bg-gray-50 flex justify-end gap-3 shrink-0">
                <button 
                  onClick={() => setPreviewSchool(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    handleLogin(previewSchool);
                    setPreviewSchool(null);
                  }}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary-dark transition-colors flex items-center gap-2 shadow-sm"
                >
                  <LogIn size={16} />
                  Login as Admin
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>);
};
