import React, { useState, useEffect } from 'react';
import { Send, History, UserCheck, Users, Mail, Clock, ShieldAlert, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useParams } from "react-router-dom";
import { noticesApi, classesApi } from '../../services/api';

export default function PortalAnnouncements() {
    const { schoolId } = useParams();
    const [sendTo, setSendTo] = useState('All');
    const [message, setMessage] = useState('');
    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('send'); // 'send' or 'history'
    const [loading, setLoading] = useState(false);
    const [availableClasses, setAvailableClasses] = useState([]);

    const loadNotices = async () => {
        setLoading(true);
        try {
            const res = await noticesApi.getAll({ schoolId, limit: 100 });

            const mapped = (res.data || [])
                .map(n => {
                    return {
                        id: n.id,
                        sendTo: n.category || 'All',
                        message: n.description,
                        date: n.createdAt ? new Date(n.createdAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                        }) : new Date().toLocaleString(),
                        status: 'Delivered'
                    };
                })
                .filter(Boolean);

            setHistory(mapped);
        } catch (e) {
            console.error('Could not load message history:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const cRes = await classesApi.getAll({ schoolId, limit: 100 });
                const dbClasses = (cRes.data || []).map(c => c.name).filter(Boolean);
                setAvailableClasses(Array.from(new Set(dbClasses)));
            } catch (err) {
                console.warn("Could not load dynamic classes:", err);
            }
        };
        loadNotices();
        fetchClasses();
    }, [schoolId]);

    const getWordCount = (str) => {
        const trimmed = str.trim();
        return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
    };

    const handleMessageChange = (e) => {
        const val = e.target.value;
        if (getWordCount(val) <= 180 || val.endsWith(' ') || val.length < message.length) {
            setMessage(val);
        } else {
            toast.warning('Maximum word limit of 180 words reached!');
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const msgVal = message.trim();
        
        if (!msgVal) {
            toast.error('Please enter a message to send!');
            return;
        }
        if (msgVal.length < 3) {
            toast.error('Message must be at least 3 letters long!');
            return;
        }

        const wordCount = getWordCount(msgVal);
        if (wordCount > 180) {
            toast.error('Message exceeds the 180-word limit!');
            return;
        }

        try {
            const payload = {
                title: `Broadcast to ${sendTo}`,
                description: message.trim(),
                category: sendTo,
                publishDate: new Date().toISOString(),
                status: 'published',
                schoolId: schoolId
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
                const mappings = JSON.parse(localStorage.getItem("notice_extra_mappings") || "{}");
                delete mappings[id];
                localStorage.setItem("notice_extra_mappings", JSON.stringify(mappings));

                toast.success('Message deleted successfully!');
                loadNotices();
            } catch (err) {
                toast.error(err.message || 'Failed to delete message');
            }
        }
    };

    const wordsUsed = getWordCount(message);

    return (
        <div className="space-y-6 md:space-y-8 pb-20" style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>
            {/* Header with Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
                <div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#1e293b] tracking-tight">COMMUNICATIONS</h2>
                    <p className="text-sm text-gray-500 max-w-2xl mt-1">Broadcast instant notifications, circulars, and messages to teachers, students, and specific classes.</p>
                </div>
                
                {/* Tab Switchers */}
                <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-200 self-start md:self-center shrink-0">
                    <button
                        onClick={() => setActiveTab('send')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
                            activeTab === 'send' 
                                ? 'bg-white text-sky-600 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <Send size={16} />
                        Send Message
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
                            activeTab === 'history' 
                                ? 'bg-white text-sky-600 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <History size={16} />
                        View History
                        {history.length > 0 && (
                            <span className="bg-sky-100 text-sky-600 text-[10px] px-2 py-0.5 rounded-full ml-1 font-black">
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
                            className="bg-white rounded-3xl border border-gray-200 shadow-md overflow-hidden"
                        >
                            <div className="p-6 md:p-8 border-b border-gray-200 bg-gray-50/50">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Mail className="text-sky-600" size={20} />
                                    New Notification Broadcast
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">Select recipients, compose your message under 180 words, and hit send.</p>
                            </div>

                            <form onSubmit={handleSendMessage} className="p-6 md:p-8 space-y-6">
                                {/* Send To dropdown */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">
                                        Send To (Recipients) *
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                        {[
                                            { id: 'All', label: 'All Users', icon: <Users size={16} /> },
                                            { id: 'Teachers', label: 'Teachers Only', icon: <UserCheck size={16} /> },
                                            { id: 'Students', label: 'Students Only', icon: <Users size={16} /> },
                                        ].map((option) => (
                                            <button
                                                key={option.id}
                                                type="button"
                                                onClick={() => { setSendTo(option.id); }}
                                                className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-xs md:text-sm font-bold transition-all border ${
                                                    sendTo === option.id
                                                        ? 'bg-sky-50 border-sky-600 text-sky-600 shadow-sm font-extrabold'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                            >
                                                {option.icon}
                                                {option.label}
                                            </button>
                                        ))}
                                        <select
                                            value={availableClasses.includes(sendTo) ? sendTo : ''}
                                            onChange={(e) => setSendTo(e.target.value)}
                                            className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-xs md:text-sm font-bold transition-all border bg-white ${
                                                availableClasses.includes(sendTo)
                                                    ? 'bg-sky-50 border-sky-600 text-sky-600 shadow-sm font-extrabold'
                                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            <option value="" disabled>Or Select Class...</option>
                                            {availableClasses.map(cls => (
                                                <option key={cls} value={cls}>{cls}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Message TextBox */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label htmlFor="messageText" className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
                                            Message *
                                        </label>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                            wordsUsed > 160 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {message.length} letters ({wordsUsed}/180 words)
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <textarea
                                            id="messageText"
                                            rows={6}
                                            value={message}
                                            onChange={handleMessageChange}
                                            placeholder="Type your message here... E.g., School holiday announcement, exam schedules, or emergency circulars."
                                            className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-600/10 transition-all font-medium resize-none leading-relaxed"
                                        />
                                    </div>
                                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                                        <ShieldAlert size={12} className="text-sky-600 shrink-0" />
                                        Messages are instantly delivered to all active registered accounts.
                                    </p>
                                </div>

                                {/* Send Button */}
                                <div className="pt-4 border-t border-gray-200 flex justify-end">
                                    <button
                                        type="submit"
                                        className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 px-8 rounded-xl flex items-center justify-center gap-2 text-sm transition-all shadow-lg shadow-sky-600/20 w-full sm:w-auto"
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
                            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <h3 className="text-base font-bold text-gray-900">Broadcast Log History</h3>
                                    <p className="text-xs text-gray-500">Below is the complete list of notifications sent by your school administration.</p>
                                </div>
                                <span className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200">
                                    Total Logs: {history.length}
                                </span>
                            </div>

                            <div className="space-y-4">
                                {history.map((item) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={item.id}
                                        className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:border-gray-300 transition-all space-y-4"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600 shrink-0">
                                                    <Mail size={18} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-black text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                            To: {item.sendTo}
                                                        </span>
                                                        <span className="bg-green-50 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border border-green-200">
                                                            {item.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                                                        <Clock size={12} />
                                                        <span>{item.date}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <button
                                                onClick={() => handleDeleteHistory(item.id)}
                                                className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
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
                                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500 font-medium">
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
}
