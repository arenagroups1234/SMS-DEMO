import React, { useState, useEffect } from 'react';
import { Send, History, UserCheck, Users, Mail, Clock, ShieldAlert, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { noticesApi, schoolsApi } from '../services/api';

export const SendMessage = () => {
    const [sendTo, setSendTo] = useState('All Schools');
    const [message, setMessage] = useState('');
    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('send'); // 'send' or 'history'
    const [schoolsList, setSchoolsList] = useState([]);
    const [selectedSchoolId, setSelectedSchoolId] = useState('');

    const loadNotices = async () => {
        try {
            const res = await noticesApi.getAll({ limit: 100 });
            const mapped = (res.data || []).map(n => ({
                id: n.id,
                sendTo: n.category || 'All Schools',
                message: n.description,
                date: n.createdAt ? new Date(n.createdAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }) : '',
                status: n.status === 'published' ? 'Delivered' : 'Draft'
            }));
            setHistory(mapped);
        } catch (e) {
            console.error('Could not load message history:', e);
        }
    };

    useEffect(() => {
        loadNotices();
        const loadSchools = async () => {
            try {
                const res = await schoolsApi.getAll({ limit: 500 });
                setSchoolsList(res.data || []);
            } catch (err) {
                console.error("Could not load schools:", err);
            }
        };
        loadSchools();
    }, []);

    useEffect(() => {
        const preselected = localStorage.getItem('preselected_message_school');
        if (preselected) {
            try {
                const schoolInfo = JSON.parse(preselected);
                if (schoolInfo && schoolInfo.id) {
                    setSendTo('Select School');
                    setSelectedSchoolId(schoolInfo.id);
                }
            } catch (e) {
                console.error(e);
            }
            localStorage.removeItem('preselected_message_school');
        }
    }, [schoolsList]);

    // Character counter logic
    const handleMessageChange = (e) => {
        const val = e.target.value;
        if (val.length <= 200) {
            setMessage(val);
        } else {
            toast.warning('Maximum limit of 200 characters reached!');
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const msgVal = message.trim();
        
        if (!msgVal || msgVal.length < 2) {
            toast.error('Message must be at least 2 characters long!');
            return;
        }

        if (message.length > 200) {
            toast.error('Message cannot exceed 200 characters!');
            return;
        }

        try {
            let targetSchoolId = 'ALL';
            if (sendTo === 'Select School') {
                if (!selectedSchoolId) {
                    toast.error('Please select a target school!');
                    return;
                }
                targetSchoolId = selectedSchoolId;
            }

            const payload = {
                title: `Announcement to ${sendTo}`,
                description: message.trim(),
                category: sendTo,
                schoolId: targetSchoolId,
                publishDate: new Date().toISOString(),
                status: 'published'
            };
            await noticesApi.create(payload);
            toast.success(`Message sent successfully to ${sendTo}!`);
            setMessage('');
            loadNotices();
        } catch (err) {
            toast.error(err.message || 'Failed to send message');
        }
    };

    const handleDeleteHistory = async (id) => {
        if (window.confirm('Delete this message from history?')) {
            try {
                await noticesApi.delete(id);
                toast.success('Message deleted successfully!');
                loadNotices();
            } catch (err) {
                toast.error(err.message || 'Failed to delete message');
            }
        }
    };


    const charCount = message.length;

    return (
        <div className="space-y-6 md:space-y-8 pb-20">
            {/* Header with Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1e293b]">COMMUNICATIONS</h2>
                    <p className="text-sm text-text-light max-w-2xl">Broadcast instant notifications, circulars, and messages to teachers and students.</p>
                </div>
                
                {/* Tab Switchers */}
                <div className="flex bg-gray-100 p-1.5 rounded-xl border border-border self-start md:self-center shrink-0">
                    <button
                        onClick={() => setActiveTab('send')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
                            activeTab === 'send' 
                                ? 'bg-white text-primary shadow-sm' 
                                : 'text-text-light hover:text-gray-900'
                        }`}
                    >
                        <Send size={16} />
                        Send Message
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
                            activeTab === 'history' 
                                ? 'bg-white text-primary shadow-sm' 
                                : 'text-text-light hover:text-gray-900'
                        }`}
                    >
                        <History size={16} />
                        View History
                        {history.length > 0 && (
                            <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full">
                                {history.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-4xl mx-auto">
                <AnimatePresence mode="wait">
                    {activeTab === 'send' ? (
                        <motion.div
                            key="send-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white rounded-3xl border border-border shadow-md overflow-hidden"
                        >
                            <div className="p-6 md:p-8 border-b border-border bg-gray-50/50">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Mail className="text-primary" size={20} />
                                    New Notification Broadcast
                                </h3>
                                <p className="text-xs text-text-light mt-1">Select recipients, compose your message under 200 characters, and hit send.</p>
                            </div>

                            <form onSubmit={handleSendMessage} className="p-6 md:p-8 space-y-6">
                                {/* Send To dropdown */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-text-light uppercase tracking-wider block">
                                        Send To (Recipients) *
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {[
                                            { id: 'All Schools', label: 'All Schools', icon: <Users size={16} /> },
                                            { id: 'Select School', label: 'Select School', icon: <UserCheck size={16} /> },
                                            { id: 'All Users', label: 'All Users', icon: <Users size={16} /> },
                                        ].map((option) => (
                                            <button
                                                key={option.id}
                                                type="button"
                                                onClick={() => { 
                                                    setSendTo(option.id);
                                                    if (option.id !== 'Select School') {
                                                        setSelectedSchoolId('');
                                                    }
                                                }}
                                                className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-xs md:text-sm font-bold transition-all border ${
                                                    sendTo === option.id
                                                        ? 'bg-primary/10 border-primary text-primary shadow-sm'
                                                        : 'bg-white border-border text-gray-600 hover:bg-gray-50'
                                                }`}
                                            >
                                                {option.icon}
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                    {sendTo === 'Select School' && (
                                        <div className="flex flex-col gap-2 mt-4">
                                            <label className="text-xs font-semibold text-text-color">Select Target School *</label>
                                            <select
                                                value={selectedSchoolId}
                                                onChange={(e) => setSelectedSchoolId(e.target.value)}
                                                className="border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all bg-white max-w-md"
                                            >
                                                <option value="">-- Choose a School --</option>
                                                {schoolsList.map(s => (
                                                    <option key={s.id} value={s.id}>{s.schoolName || s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {/* Message TextBox */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label htmlFor="messageText" className="text-[11px] font-black text-text-light uppercase tracking-wider">
                                            Message *
                                        </label>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                            charCount > 180 ? 'bg-danger/10 text-danger' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {charCount} / 200 characters used
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <textarea
                                            id="messageText"
                                            rows={5}
                                            maxLength={200}
                                            value={message}
                                            onChange={handleMessageChange}
                                            placeholder="Type your announcement or message here..."
                                            className="w-full border border-border rounded-2xl p-4 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none shadow-xs"
                                        />
                                    </div>
                                    <p className="text-[11px] text-text-light flex items-center gap-1">
                                        <ShieldAlert size={12} className="text-primary shrink-0" />
                                        Messages are instantly delivered to all active registered accounts.
                                    </p>
                                </div>

                                {/* Send Button */}
                                <div className="pt-4 border-t border-border flex justify-end">
                                    <button
                                        type="submit"
                                        className="bg-primary hover:bg-primary-dark text-white font-bold py-3.5 px-8 rounded-xl flex items-center justify-center gap-2 text-sm transition-all shadow-lg shadow-primary/20 w-full sm:w-auto"
                                    >
                                        <Send size={16} />
                                        Send Message
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="history-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <h3 className="text-base font-bold text-gray-900">Broadcast Log History</h3>
                                    <p className="text-xs text-text-light">Below is the complete list of notifications sent by your school administration.</p>
                                </div>
                                <span className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-border">
                                    Total Logs: {history.length}
                                </span>
                            </div>

                            <div className="space-y-4">
                                {history.map((item) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={item.id}
                                        className="bg-white p-6 rounded-2xl border border-border shadow-sm hover:border-gray-300 transition-all space-y-4"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                                                    <Mail size={18} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                            To: {item.sendTo}
                                                        </span>
                                                        <span className="bg-success/10 text-success text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                            {item.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-text-light mt-1">
                                                        <Clock size={12} />
                                                        <span>{item.date}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <button
                                                onClick={() => handleDeleteHistory(item.id)}
                                                className="w-8 h-8 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/5 flex items-center justify-center transition-colors"
                                                title="Delete Broadcast Log"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <p className="text-sm font-medium text-gray-800 bg-gray-50/50 p-4 rounded-xl border border-gray-100 leading-relaxed whitespace-pre-line">
                                            {item.message}
                                        </p>
                                    </motion.div>
                                ))}

                                {history.length === 0 && (
                                    <div className="bg-white rounded-2xl border border-border p-12 text-center text-text-light font-medium">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <History size={48} className="text-gray-300" />
                                            <h3 className="text-lg font-bold text-gray-800">No Sent History</h3>
                                            <p className="text-sm text-gray-500">You haven't dispatched any broadcasts yet.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
