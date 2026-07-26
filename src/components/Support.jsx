import React, { useState, useEffect } from 'react';
import { Send, LifeBuoy, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
export const Support = ({ role = 'super_admin', onSubmitTicket, tickets = [], activeSchool, onReplyTicket, currentUser, onMessageSchool, onUpdateStatus }) => {
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState({});
    const [replyingTicketId, setReplyingTicketId] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [formData, setFormData] = useState({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        issueType: 'Software Issue',
        subject: '',
        message: ''
    });

    useEffect(() => {
        if (currentUser) {
            setFormData(prev => ({
                ...prev,
                name: currentUser.name || '',
                email: currentUser.email || ''
            }));
        }
    }, [currentUser]);

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }
        else if (formData.name.trim().length < 3) {
            newErrors.name = 'Name must be at least 3 characters';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        if (!formData.subject.trim()) {
            newErrors.subject = 'Subject is required';
        }
        else if (formData.subject.trim().length < 5) {
            newErrors.subject = 'Subject must be at least 5 characters';
        }
        if (!formData.message.trim()) {
            newErrors.message = 'Message is required';
        }
        else if (formData.message.trim().length < 10) {
            newErrors.message = 'Message must be at least 10 characters';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate())
            return;
        if (onSubmitTicket) {
            onSubmitTicket(formData);
        }
        setSubmitted(true);
        setErrors({});
        setTimeout(() => setSubmitted(false), 5000);
        setFormData({
            name: currentUser?.name || '',
            email: currentUser?.email || '',
            issueType: 'Software Issue',
            subject: '',
            message: ''
        });
    };
    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
        // Clear error when user starts typing
        if (errors[id]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        }
    };

    const handleSendReply = (ticketId) => {
        if (!replyText.trim()) return;
        if (onReplyTicket) {
            onReplyTicket(ticketId, replyText);
        }
        setReplyingTicketId(null);
        setReplyText('');
    };

    if (submitted) {
        return (<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center">
          <CheckCircle size={48}/>
        </div>
        <h2 className="text-2xl font-bold text-text-color">Ticket Submitted Successfully!</h2>
        <p className="text-text-light max-w-md">
          Thank you for reaching out. Our support team will review your request and get back to you shortly via email.
        </p>
        <button onClick={() => setSubmitted(false)} className="text-primary font-semibold hover:underline">
          Submit another ticket
        </button>
      </motion.div>);
    }

    // Filter tickets:
    // If super_admin, show all.
    // If school_admin, show tickets for activeSchool.name.
    // If teacher or student, show tickets where email matches currentUser.email.
    const filteredTickets = tickets.filter(ticket => {
        if (role === 'super_admin') return true;
        if (role === 'school_admin') return ticket.schoolName === activeSchool?.name;
        if (role === 'teacher' || role === 'student') {
            return ticket.email?.toLowerCase() === currentUser?.email?.toLowerCase();
        }
        return false;
    });

    const showAdminTicketsTable = role === 'super_admin' || role === 'school_admin';

    const adminTicketsTable = showAdminTicketsTable && (
        <div className={`space-y-4 ${role !== 'super_admin' ? 'pt-8 mt-8 border-t border-border' : ''}`}>
            <div className="space-y-2">
                <h2 className="text-xl font-bold text-[#1e293b] flex items-center gap-2">
                    <LifeBuoy className="text-primary" size={24}/>
                    {role === 'school_admin' ? `${activeSchool?.name || 'School'} Support Tickets` : 'All Support Tickets'}
                </h2>
                <p className="text-sm text-text-light">
                    {role === 'school_admin' 
                      ? 'View and reply to support requests from your teachers and students.' 
                      : 'View and manage support requests from schools.'}
                </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead className="bg-gradient-to-r from-light-gray to-[#f1f5f9] border-b-2 border-border">
                            <tr>
                                <th className="px-6 py-4 text-left text-[11px] md:text-[13px] font-bold text-text-color uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-[11px] md:text-[13px] font-bold text-text-color uppercase tracking-wider">School</th>
                                <th className="px-6 py-4 text-left text-[11px] md:text-[13px] font-bold text-text-color uppercase tracking-wider">Reporter</th>
                                <th className="px-6 py-4 text-left text-[11px] md:text-[13px] font-bold text-text-color uppercase tracking-wider">Subject & Details</th>
                                <th className="px-6 py-4 text-left text-[11px] md:text-[13px] font-bold text-text-color uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredTickets.length > 0 ? (filteredTickets.map((ticket, i) => (
                                <React.Fragment key={ticket.id || i}>
                                    <motion.tr initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="hover:bg-light-gray transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light">{ticket.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap font-bold text-text-color">{ticket.schoolName || 'Unknown'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-color">{ticket.name} <br/><span className="text-xs text-text-light">{ticket.email}</span></td>
                                        <td className="px-6 py-4 text-sm text-text-color">
                                            <div className="font-semibold text-text-color">{ticket.subject}</div>
                                            <div className="text-xs text-text-light mt-1 whitespace-pre-wrap max-w-md">{ticket.message}</div>
                                            {ticket.reply && (
                                                <div className="mt-2 p-2.5 bg-success/5 border border-success/10 rounded-lg text-xs">
                                                    <span className="font-bold text-success">Reply:</span> {ticket.reply}
                                                    {ticket.replyDate && <span className="text-text-light block mt-0.5 text-[10px]">{ticket.replyDate}</span>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                             <div className="flex flex-col gap-2 items-start">
                                                 {role === 'super_admin' ? (
                                                     <select
                                                         value={ticket.status || 'Pending'}
                                                         onChange={(e) => {
                                                             if (onUpdateStatus) {
                                                                 onUpdateStatus(ticket.id, e.target.value);
                                                             }
                                                         }}
                                                         className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-border cursor-pointer focus:outline-none ${
                                                             ticket.status === 'Resolved' 
                                                                 ? 'bg-success/10 text-success' 
                                                                 : ticket.status === 'Processing'
                                                                     ? 'bg-warning/10 text-warning'
                                                                     : 'bg-danger/10 text-danger'
                                                         }`}
                                                     >
                                                         <option value="Pending">Pending</option>
                                                         <option value="Processing">Processing</option>
                                                         <option value="Resolved">Resolved</option>
                                                     </select>
                                                 ) : (
                                                     <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                         ticket.status === 'Resolved' 
                                                             ? 'bg-success/10 text-success' 
                                                             : ticket.status === 'Processing'
                                                                 ? 'bg-warning/10 text-warning'
                                                                 : 'bg-danger/10 text-danger'
                                                     }`}>{ticket.status || 'Pending'}</span>
                                                 )}
                                                 {!ticket.reply && (
                                                     <button onClick={() => {
                                                         setReplyingTicketId(replyingTicketId === ticket.id ? null : ticket.id);
                                                         setReplyText('');
                                                     }} className="text-xs text-primary font-bold hover:underline">
                                                         {replyingTicketId === ticket.id ? 'Cancel' : 'Resolve with Reply'}
                                                     </button>
                                                 )}
                                                 {role === 'super_admin' && (
                                                     <button 
                                                         onClick={() => {
                                                             if (onMessageSchool) {
                                                                 onMessageSchool(ticket.schoolId, ticket.schoolName);
                                                             }
                                                         }} 
                                                         className="text-xs text-primary font-bold hover:underline mt-1 flex items-center gap-1"
                                                     >
                                                         Message School
                                                     </button>
                                                 )}
                                             </div>
                                         </td>
                                    </motion.tr>
                                    {replyingTicketId === ticket.id && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-4 bg-gray-50/50 border-t border-b border-border">
                                                <div className="flex flex-col gap-2 max-w-xl">
                                                    <label className="text-xs font-bold text-text-color">Write Support Reply</label>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="text" 
                                                            placeholder="Type your response here..." 
                                                            value={replyText} 
                                                            onChange={(e) => setReplyText(e.target.value)} 
                                                            className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                                                        />
                                                        <button 
                                                            onClick={() => handleSendReply(ticket.id)} 
                                                            className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-dark transition-colors"
                                                        >
                                                            Resolve & Send
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-text-light">No support tickets found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const userTicketsSection = (role === 'teacher' || role === 'student') && (
        <div className="space-y-4 pt-8 mt-8 border-t border-border">
            <div className="space-y-2">
                <h3 className="text-xl font-bold text-[#1e293b]">My Submitted Tickets</h3>
                <p className="text-sm text-text-light">Track the status and replies for your support requests.</p>
            </div>
            <div className="space-y-4">
                {filteredTickets.length > 0 ? (filteredTickets.map((ticket, i) => (
                    <div key={ticket.id || i} className="p-5 bg-white rounded-xl border border-border shadow-sm space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs text-text-light font-medium">{ticket.date}</span>
                                <h4 className="font-bold text-text-color text-base">{ticket.subject}</h4>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${ticket.status === 'Resolved' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                {ticket.status}
                            </span>
                        </div>
                        <p className="text-sm text-text-color whitespace-pre-wrap">{ticket.message}</p>
                        {ticket.reply ? (
                            <div className="mt-3 p-3 bg-success/5 border border-success/10 rounded-lg">
                                <p className="text-xs font-bold text-success mb-1">Reply from Support/Admin ({ticket.replyDate}):</p>
                                <p className="text-xs text-text-color font-medium">{ticket.reply}</p>
                            </div>
                        ) : (
                            <p className="text-xs text-text-light italic mt-1">Waiting for reply...</p>
                        )}
                    </div>
                ))) : (
                    <div className="bg-white rounded-xl border border-border p-8 text-center text-text-light">
                        You have not submitted any support tickets yet.
                    </div>
                )}
            </div>
        </div>
    );

    return (<div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1e293b] flex items-center gap-3">
          <LifeBuoy className="text-primary"/>
          {role === 'super_admin' ? 'Help & Support Reports' : 'Help & Support'}
        </h2>
        <p className="text-sm text-text-light">
          {role === 'super_admin' 
            ? 'Manage and respond to support tickets/reports submitted by schools.' 
            : "Have a question or facing an issue? We're here to help."}
        </p>
      </div>

      {role !== 'super_admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-border p-6 md:p-8">
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="name" className="text-sm font-semibold text-text-color">Your Name</label>
                    <input type="text" id="name" value={formData.name} onChange={handleChange} placeholder="Enter your full name" className={`border rounded-lg px-4 py-3 text-sm focus:outline-none transition-all ${errors.name
              ? 'border-danger focus:ring-3 focus:ring-danger/10'
              : 'border-border focus:border-primary focus:ring-3 focus:ring-primary/10'}`}/>
                    {errors.name && <span className="text-xs font-bold text-danger">{errors.name}</span>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="text-sm font-semibold text-text-color">Email Address</label>
                    <input type="email" id="email" value={formData.email} onChange={handleChange} placeholder="example@school.com" className={`border rounded-lg px-4 py-3 text-sm focus:outline-none transition-all ${errors.email
              ? 'border-danger focus:ring-3 focus:ring-danger/10'
              : 'border-border focus:border-primary focus:ring-3 focus:ring-primary/10'}`}/>
                    {errors.email && <span className="text-xs font-bold text-danger">{errors.email}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="issueType" className="text-sm font-semibold text-text-color">Issue Type</label>
                    <select id="issueType" value={formData.issueType} onChange={handleChange} className="border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all bg-white">
                      <option value="Software Issue">Software Issue</option>
                      <option value="Billing Issue">Billing Issue</option>
                      <option value="Account Issue">Account Issue</option>
                      <option value="Feature Request">Feature Request</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="subject" className="text-sm font-semibold text-text-color">Subject</label>
                    <input type="text" id="subject" value={formData.subject} onChange={handleChange} placeholder="Briefly describe the issue" className={`border rounded-lg px-4 py-3 text-sm focus:outline-none transition-all ${errors.subject
              ? 'border-danger focus:ring-3 focus:ring-danger/10'
              : 'border-border focus:border-primary focus:ring-3 focus:ring-primary/10'}`}/>
                    {errors.subject && <span className="text-xs font-bold text-danger">{errors.subject}</span>}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="message" className="text-sm font-semibold text-text-color">Message Details</label>
                  <textarea id="message" rows={5} value={formData.message} onChange={handleChange} placeholder="Tell us more about your issue..." className={`border rounded-lg px-4 py-3 text-sm focus:outline-none transition-all resize-none ${errors.message
              ? 'border-danger focus:ring-3 focus:ring-danger/10'
              : 'border-border focus:border-primary focus:ring-3 focus:ring-primary/10'}`}/>
                  {errors.message && <span className="text-xs font-bold text-danger">{errors.message}</span>}
                </div>

                <button type="submit" className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary-dark transition-all shadow-md flex items-center justify-center gap-2">
                  <Send size={18}/>
                  Send Ticket
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-border p-6 space-y-4">
              <h3 className="font-bold text-text-color">Quick Contact</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-text-light">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Send size={14}/>
                  </div>
                  support@schoolmanager.com
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-primary to-primary-dark rounded-xl shadow-sm p-6 text-white space-y-3">
              <h3 className="font-bold">24/7 Support</h3>
              <p className="text-xs opacity-80">
                Our technical team is available around the clock to ensure your school management system runs smoothly.
              </p>
            </div>
          </div>
        </div>
      )}
      {adminTicketsTable}
      {userTicketsSection}
    </div>);
};
