import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Shield, CreditCard, School, MessageSquare, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

const DEFAULT_NOTIFICATIONS = [
  { id: '1', title: 'New School Registration', description: 'Greenvalley International School has completed their cloud deployment.', time: '2 hours ago', read: false, category: 'institution', icon: School, color: 'blue' },
  { id: '2', title: 'Critical System Alert', description: 'Monthly database replica backup sync completed with zero issues.', time: '5 hours ago', read: false, category: 'system', icon: Shield, color: 'emerald' },
  { id: '3', title: 'Support Ticket #1042', description: 'Admin user from Oakridge Academy requested a school domain mapping mapping update.', time: '1 day ago', read: true, category: 'support', icon: MessageSquare, color: 'amber' },
  { id: '4', title: 'Subscription Payment Processed', description: 'standard plan monthly payment of $99 received from Greenwood High School.', time: '2 days ago', read: true, category: 'billing', icon: CreditCard, color: 'indigo' },
  { id: '5', title: 'Institutional Expansion', description: 'A new user was promoted to School Admin for Sunrise High.', time: '3 days ago', read: true, category: 'institution', icon: School, color: 'blue' }
];

export const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const stored = localStorage.getItem('super_admin_notifications');
    if (stored) {
      try {
        setNotifications(JSON.parse(stored));
      } catch {
        setNotifications(DEFAULT_NOTIFICATIONS);
        localStorage.setItem('super_admin_notifications', JSON.stringify(DEFAULT_NOTIFICATIONS));
      }
    } else {
      setNotifications(DEFAULT_NOTIFICATIONS);
      localStorage.setItem('super_admin_notifications', JSON.stringify(DEFAULT_NOTIFICATIONS));
    }
  }, []);

  const saveNotifications = (newNotifs) => {
    setNotifications(newNotifs);
    localStorage.setItem('super_admin_notifications', JSON.stringify(newNotifs));
    // Trigger window event to sync with layout header icon count
    window.dispatchEvent(new Event('super_admin_notifications_update'));
  };

  const handleMarkAsRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    saveNotifications(updated);
    toast.success('Notification marked as read');
  };

  const handleToggleRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: !n.read } : n);
    saveNotifications(updated);
  };

  const handleDelete = (id) => {
    const updated = notifications.filter(n => n.id !== id);
    saveNotifications(updated);
    toast.info('Notification deleted');
  };

  const handleMarkAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
    toast.success('All notifications marked as read');
  };

  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete all notifications?')) {
      saveNotifications([]);
      toast.success('All notification logs cleared');
    }
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'system') return n.category === 'system';
    if (filter === 'institution') return n.category === 'institution';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getCategoryTheme = (category) => {
    const themes = {
      system: { bg: '#F0FDF4', text: '#15803D', iconBg: '#DCFCE7', icon: Shield },
      institution: { bg: '#F0F9FF', text: '#0284C7', iconBg: '#E0F2FE', icon: School },
      support: { bg: '#FFFBEB', text: '#D97706', iconBg: '#FEF3C7', icon: MessageSquare },
      billing: { bg: '#F5F3FF', text: '#6D28D9', iconBg: '#EDE9FE', icon: CreditCard }
    };
    return themes[category] || { bg: '#F3F4F6', text: '#4B5563', iconBg: '#E5E7EB', icon: Bell };
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#0C1B33] flex items-center gap-3">
            <Bell className="text-primary animate-bounce" size={28} /> System Notification Center
          </h2>
          <p className="text-sm text-text-light">
            Stay updated with system logs, database backups, support tickets, and institutional accounts activities.
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="bg-white border border-border text-text-color px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 hover:-translate-y-0.5 transition-all shadow-sm flex items-center gap-1.5"
            >
              <Check size={14} /> Mark all read
            </button>
            <button
              onClick={handleDeleteAll}
              className="bg-danger/10 text-danger border border-danger/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-danger hover:text-white hover:-translate-y-0.5 transition-all shadow-sm flex items-center gap-1.5"
            >
              <Trash2 size={14} /> Clear all log
            </button>
          </div>
        )}
      </div>

      {/* Toolbar filters */}
      <div className="flex items-center gap-2 border-b border-border pb-4 overflow-x-auto custom-scrollbar">
        {[
          { id: 'all', label: 'All Logs', count: notifications.length },
          { id: 'unread', label: 'Unread', count: unreadCount, highlight: true },
          { id: 'system', label: 'System Alerts' },
          { id: 'institution', label: 'Institutional' }
        ].map((tab) => {
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition-all whitespace-nowrap flex items-center gap-2
                ${isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-light hover:text-text-color hover:bg-gray-100'
                }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px]
                  ${isActive 
                    ? 'bg-white/20 text-white' 
                    : (tab.highlight && tab.count > 0 ? 'bg-danger text-white' : 'bg-gray-200 text-text-light')
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main notifications list card container */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-16 text-center flex flex-col items-center justify-center space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary-dark">
                <Sparkles size={32} className="text-primary animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#0C1B33]">All Clear!</h3>
                <p className="text-sm text-text-light max-w-sm mx-auto">
                  No active logs match your selected filter. You are completely up to date.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((item) => {
                const theme = getCategoryTheme(item.category);
                const IconComponent = theme.icon;
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`p-6 flex gap-4 transition-all relative ${!item.read ? 'bg-primary/5' : 'hover:bg-gray-50/50'}`}
                  >
                    {/* Unread indicator bar */}
                    {!item.read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md" />
                    )}

                    {/* Category Icon */}
                    <div
                      style={{ background: theme.iconBg, color: theme.text }}
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    >
                      <IconComponent size={20} />
                    </div>

                    {/* Details content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-4">
                        <h4 className={`text-sm font-bold truncate ${!item.read ? 'text-[#0c1b33]' : 'text-text-color'}`}>
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-text-light whitespace-nowrap font-medium">{item.time}</span>
                      </div>
                      <p className="text-xs text-text-light leading-relaxed pr-8">
                        {item.description}
                      </p>
                    </div>

                    {/* Actions button controls */}
                    <div className="flex items-center gap-1.5 self-center flex-shrink-0">
                      <button
                        onClick={() => handleToggleRead(item.id)}
                        className={`p-2 rounded-xl transition-all border
                          ${item.read
                            ? 'bg-gray-50 border-border text-text-light hover:bg-gray-100 hover:text-text-color'
                            : 'bg-primary/10 border-primary/20 text-primary hover:bg-primary hover:text-white'
                          }`}
                        title={item.read ? 'Mark as Unread' : 'Mark as Read'}
                      >
                        <Check size={14} className={!item.read ? 'stroke-[2.5]' : ''} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 rounded-xl bg-danger/10 border border-danger/15 text-danger hover:bg-danger hover:text-white transition-all"
                        title="Delete log"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
