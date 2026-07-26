import React, { useState } from 'react';
import { Search, Calendar, Filter, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { schoolsApi } from '../services/api';

export const PaymentDetails = ({ searchQuery: globalSearch = '' }) => {
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [localSearchQuery, setLocalSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isFiltering, setIsFiltering] = useState(false);
    const [allPayments, setAllPayments] = useState([]);
    const [displayPayments, setDisplayPayments] = useState([]);
    const [loadingPayments, setLoadingPayments] = useState(false);
    const effectiveSearch = globalSearch || localSearchQuery;

    const applyFilterLogic = (payments, search, status, from, to) => {
        return payments.filter(payment => {
            const s = (search || '').toLowerCase();
            const matchesSearch = !s ||
                (payment.schoolName || '').toLowerCase().includes(s) ||
                (payment.txnId || '').toLowerCase().includes(s) ||
                (payment.userName || '').toLowerCase().includes(s) ||
                (payment.mobileNumber || '').toLowerCase().includes(s);

            const matchesStatus = status === 'All' ||
                (status === 'Active' && payment.status === 'Paid') ||
                (status === 'Not Active' && (payment.status === 'Pending' || payment.status === 'Overdue' || payment.status === 'Unpaid'));

            // Start date check (creation or start date on or after `from`)
            const checkFromDate = payment.createdOn || payment.startDate;
            const matchesFrom = !from || (checkFromDate && checkFromDate >= from);

            // End date check (end date or due date on or before `to`)
            const checkToDate = payment.endDate || payment.dueDate || payment.createdOn;
            const matchesTo = !to || (checkToDate && checkToDate <= to);

            return matchesSearch && matchesStatus && matchesFrom && matchesTo;
        });
    };

    const fetchPayments = async () => {
        setLoadingPayments(true);
        try {
            const res = await schoolsApi.getAll();
            const schools = res.data || [];
            const mapped = schools.map((school, index) => {
                const createdOn = school.createdAt ? school.createdAt.split('T')[0] : new Date().toISOString().split('T')[0];
                const amount = school.amount !== undefined ? school.amount : 0;
                const status = school.status || 'Pending';
                const endDate = school.endDate ? school.endDate.split('T')[0] : '';
                const dueDate = school.endDate ? school.endDate.split('T')[0] : new Date(new Date(createdOn).getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const txnId = `TXN-${school.id ? school.id.substring(0, 6).toUpperCase() : (index + 1000)}`;
                return {
                    id: school.id,
                    schoolName: school.name || 'Unnamed School',
                    userName: school.ownerName || 'Admin User',
                    mobileNumber: school.phone || 'N/A',
                    createdOn: createdOn,
                    startDate: school.startDate ? school.startDate.split('T')[0] : createdOn,
                    amount: amount,
                    status: status === 'Paid' ? 'Paid' : (status === 'Pending' ? 'Pending' : 'Overdue'),
                    endDate: endDate,
                    dueDate: dueDate,
                    txnId: txnId
                };
            });
            const defaultPayments = [
                { id: "school-1", schoolName: "St. Xavier's International School", userName: "St. Xavier Educational Trust", mobileNumber: "+91 98290 12345", createdOn: "2026-01-01", startDate: "2026-01-01", amount: 49999, status: "Paid", endDate: "2027-01-01", dueDate: "2027-01-01", txnId: "TXN-STX-101" },
                { id: "school-2", schoolName: "Delhi Public School", userName: "DPS Society", mobileNumber: "+91 98290 54321", createdOn: "2026-02-01", startDate: "2026-02-01", amount: 24999, status: "Paid", endDate: "2027-02-01", dueDate: "2027-02-01", txnId: "TXN-DPS-102" },
                { id: "school-3", schoolName: "Greenwood High World School", userName: "Greenwood Trust", mobileNumber: "+91 98800 11223", createdOn: "2026-03-01", startDate: "2026-03-01", amount: 14999, status: "Paid", endDate: "2027-03-01", dueDate: "2027-03-01", txnId: "TXN-GWH-103" },
                { id: "school-4", schoolName: "Apex International Academy", userName: "Apex Educational Group", mobileNumber: "+91 97555 44332", createdOn: "2026-04-01", startDate: "2026-04-01", amount: 9999, status: "Paid", endDate: "2027-04-01", dueDate: "2027-04-01", txnId: "TXN-APX-104" },
                { id: "school-5", schoolName: "Heritage Global School", userName: "Heritage Foundation", mobileNumber: "+91 98140 99887", createdOn: "2026-05-01", startDate: "2026-05-01", amount: 4999, status: "Paid", endDate: "2027-05-01", dueDate: "2027-05-01", txnId: "TXN-HTG-105" }
            ];
            if (mapped.length === 0) mapped.push(...defaultPayments);
            setAllPayments(mapped);
            const filtered = applyFilterLogic(mapped, effectiveSearch, statusFilter, fromDate, toDate);
            setDisplayPayments(filtered);
        } catch (err) {
            console.error('Failed to fetch payments data:', err);
            // toast error suppressed for demo mode
        } finally {
            setLoadingPayments(false);
        }
    };

    React.useEffect(() => {
        fetchPayments();
    }, []);

    React.useEffect(() => {
        const filtered = applyFilterLogic(allPayments, effectiveSearch, statusFilter, fromDate, toDate);
        setDisplayPayments(filtered);
    }, [globalSearch, localSearchQuery, statusFilter, fromDate, toDate, allPayments]);
    
    const handleApplyFilters = () => {
        setIsFiltering(true);
        // Simulate API delay to show loading state
        setTimeout(() => {
            const filtered = applyFilterLogic(allPayments, effectiveSearch, statusFilter, fromDate, toDate);
            setDisplayPayments(filtered);
            setIsFiltering(false);
            toast.success(`Found ${filtered.length} transactions`);
        }, 600);
    };
    const handleDownloadCSV = () => {
        toast.promise(new Promise((resolve) => {
            setTimeout(() => {
                const headers = ['S.NO', 'SCHOOL', 'TXN ID', 'USER', 'MOBILE', 'AMOUNT', 'STATUS', 'START DATE', 'END DATE', 'DUE DATE'];
                const csvContent = [
                    headers.join(','),
                    ...displayPayments.map((payment, index) => [
                        index + 1,
                        `"${payment.schoolName}"`,
                        `"${payment.txnId}"`,
                        `"${payment.userName}"`,
                        `"${payment.mobileNumber}"`,
                        payment.amount,
                        payment.status,
                        `"${payment.startDate || payment.createdOn}"`,
                        `"${payment.endDate}"`,
                        `"${payment.dueDate}"`
                    ].join(','))
                ].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `payments_export_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                resolve();
            }, 1500);
        }), {
            loading: 'Preparing ledger export...',
            success: 'Ledger records downloaded successfully!',
            error: 'Failed to export records',
        });
    };
    return (<div className="space-y-6 md:space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1e293b] flex items-center gap-3">
            <span>SCHOOL PAYMENT INFO</span>
          </h2>
          <p className="text-sm text-text-light max-w-xl">Audit institutional transactions, subscription cycles, and financial health records.</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-6 md:p-10 rounded-[2rem] border border-border shadow-2xl shadow-black/5">
        <div className="flex flex-col xl:flex-row items-end gap-6 md:gap-8">
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <div className="flex flex-col gap-2.5">
              <label className="text-[10px] md:text-[11px] font-black text-text-light uppercase tracking-[0.2em]">Transaction Start</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light group-focus-within:text-primary transition-colors" size={16}/>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold"/>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="text-[10px] md:text-[11px] font-black text-text-light uppercase tracking-[0.2em]">Transaction End</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light group-focus-within:text-primary transition-colors" size={16}/>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold"/>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="text-[10px] md:text-[11px] font-black text-text-light uppercase tracking-[0.2em]">Entity / TXNID</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light group-focus-within:text-primary transition-colors" size={16}/>
                <input type="text" placeholder="ID, School, or User..." value={localSearchQuery} onChange={(e) => setLocalSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold"/>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="text-[10px] md:text-[11px] font-black text-text-light uppercase tracking-[0.2em]">Lifecycle Status</label>
              <div className="relative group">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light group-focus-within:text-primary transition-colors" size={16}/>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer font-bold">
                  <option value="All">All Transactions</option>
                  <option value="Active">Active / Paid</option>
                  <option value="Not Active">Not Active / Due</option>
                </select>
              </div>
            </div>
          </div>
          
          <button onClick={handleApplyFilters} disabled={isFiltering} className="w-full xl:w-auto bg-primary hover:bg-primary-dark text-white px-10 py-4 rounded-xl font-black text-xs md:text-sm flex items-center justify-center gap-3 transition-all shadow-xl shadow-primary/20 active:scale-95 uppercase tracking-widest shrink-0 disabled:opacity-50">
            <Filter size={18} className={isFiltering ? 'animate-spin' : ''}/>
            {isFiltering ? 'FILTERING...' : 'APPLY FILTERS'}
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] border border-border shadow-2xl shadow-black/5 overflow-hidden">
        <div className="px-8 md:px-10 py-6 md:py-8 border-b border-border flex flex-col sm:flex-row justify-between items-center bg-gray-50/30 gap-4">
          <h3 className="font-black text-text-color uppercase tracking-[0.2em] text-xs md:text-sm">RECORDS</h3>
          <button onClick={handleDownloadCSV} className="flex items-center gap-2 text-[10px] md:text-xs font-black text-primary hover:text-primary-dark transition-all uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-lg border border-primary/10 hover:bg-primary/10">
            <Download size={14}/>
            DOWNLOAD CSV
          </button>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50/50 border-b border-border">
                <th className="px-3 md:px-4 py-4 text-left text-[9px] font-black text-text-light uppercase tracking-widest">S.NO</th>
                <th className="px-3 md:px-4 py-4 text-left text-[9px] font-black text-text-light uppercase tracking-widest">ENTITY</th>
                <th className="px-3 md:px-4 py-4 text-left text-[9px] font-black text-text-light uppercase tracking-widest">USER</th>
                <th className="hidden xl:table-cell px-3 md:px-4 py-4 text-left text-[9px] font-black text-text-light uppercase tracking-widest">MOBILE</th>
                <th className="px-3 md:px-4 py-4 text-right text-[9px] font-black text-text-light uppercase tracking-widest">AMOUNT</th>
                <th className="px-3 md:px-4 py-4 text-left text-[9px] font-black text-text-light uppercase tracking-widest">STATUS</th>
                <th className="hidden lg:table-cell px-3 md:px-4 py-4 text-left text-[9px] font-black text-text-light uppercase tracking-widest">START DATE</th>
                <th className="hidden lg:table-cell px-3 md:px-4 py-4 text-left text-[9px] font-black text-text-light uppercase tracking-widest">END DATE</th>
                <th className="px-3 md:px-4 py-4 text-left text-[9px] font-black text-text-light uppercase tracking-widest">DUE DATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayPayments.map((payment, index) => (<motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }} key={payment.id} className="hover:bg-primary/[0.02] transition-colors group">
                  <td className="px-3 md:px-4 py-4 whitespace-nowrap text-[10px] font-black text-text-light/40">
                    {String(index + 1).padStart(2, '0')}
                  </td>
                  <td className="px-3 md:px-4 py-4 whitespace-nowrap">
                    <p className="text-xs font-black text-text-color tracking-tight group-hover:text-primary transition-colors">{payment.schoolName}</p>
                    <p className="text-[9px] text-text-light font-mono font-bold">{payment.txnId}</p>
                  </td>
                  <td className="px-3 md:px-4 py-4 whitespace-nowrap text-xs font-bold text-text-color">
                    {payment.userName}
                  </td>
                  <td className="hidden xl:table-cell px-3 md:px-4 py-4 whitespace-nowrap text-[10px] text-text-color font-mono font-bold">
                    {payment.mobileNumber}
                  </td>
                  <td className="px-3 md:px-4 py-4 whitespace-nowrap text-xs font-black text-primary text-right tabular-nums">
                    ₹{payment.amount.toLocaleString()}
                  </td>
                  <td className="px-3 md:px-4 py-4 whitespace-nowrap">
                    <span className={`
                      px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border
                      ${payment.status === 'Paid' ? 'bg-success/5 text-success border-success/10' : ''}
                      ${payment.status === 'Pending' ? 'bg-warning/5 text-warning border-warning/10' : ''}
                      ${payment.status === 'Overdue' ? 'bg-danger/5 text-danger border-danger/10' : ''}
                    `}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="hidden lg:table-cell px-3 md:px-4 py-4 whitespace-nowrap text-[10px] font-medium text-text-light">
                    {payment.startDate || payment.createdOn}
                  </td>
                  <td className="hidden lg:table-cell px-3 md:px-4 py-4 whitespace-nowrap text-[10px] font-medium text-text-light">
                    {payment.endDate}
                  </td>
                  <td className="px-3 md:px-4 py-4 whitespace-nowrap text-[10px] font-bold text-danger">
                    {payment.dueDate}
                  </td>
                </motion.tr>))}
              {loadingPayments ? (<tr>
                  <td colSpan={9} className="px-6 py-20 text-center text-sm font-bold text-text-light">
                    Loading payments records...
                  </td>
                </tr>) : displayPayments.length === 0 && (<tr>
                  <td colSpan={9} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Search size={48} className="text-gray-300" />
                      <h3 className="text-xl font-bold text-gray-800">Not Found</h3>
                      <p className="text-sm text-gray-500">No records found matching your filters.</p>
                    </div>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>);
};
