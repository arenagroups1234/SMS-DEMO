import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Upload, Image as ImageIcon, Users, Trash2, Tag, Info, Edit, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export const EventManagement = () => {
    const [eventName, setEventName] = useState('');
    const [eventImage, setEventImage] = useState('');
    const [eventFor, setEventFor] = useState('All');
    const [description, setDescription] = useState('');
    const [eventsList, setEventsList] = useState([]);
    const [editingEventId, setEditingEventId] = useState(null);
    const [selectedViewEvent, setSelectedViewEvent] = useState(null);

    // Sample default events
    const defaultEvents = [
        {
            id: '1',
            name: 'Annual Sports Meet 2026',
            image: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=600',
            eventFor: 'All',
            description: 'Join us for our signature annual sporting championship featuring track events, football finals, and team championships.',
            date: 'July 15, 2026'
        },
        {
            id: '2',
            name: 'Science & Technology Exhibition',
            image: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=600',
            eventFor: 'Students',
            description: 'A platform for students to demonstrate creative prototypes and research projects. Prizes will be awarded for outstanding innovations.',
            date: 'July 28, 2026'
        }
    ];

    // Load events on mount
    useEffect(() => {
        const storedEvents = localStorage.getItem('school_admin_events');
        if (storedEvents) {
            try {
                setEventsList(JSON.parse(storedEvents));
            } catch (e) {
                console.error(e);
            }
        } else {
            setEventsList(defaultEvents);
            localStorage.setItem('school_admin_events', JSON.stringify(defaultEvents));
        }
    }, []);

    // Handle file/image uploads & convert to base64 for offline preview persistence
    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Image size must be less than 2MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setEventImage(reader.result);
                toast.success('Event banner uploaded successfully!');
            };
            reader.readAsDataURL(file);
        }
    };

    // Auto preset images for ease of testing inside iframe
    const handlePresetImage = (url) => {
        setEventImage(url);
        toast.success('Theme banner preset applied!');
    };

    const handleCreateEvent = (e) => {
        e.preventDefault();
        const nameVal = eventName.trim();
        const descVal = description.trim();

        if (!nameVal) {
            toast.error('Please enter the event name!');
            return;
        }
        if (nameVal.length < 3 || nameVal.length > 100) {
            toast.error('Event name must be between 3 and 100 characters!');
            return;
        }
        if (!descVal) {
            toast.error('Please enter the event description!');
            return;
        }
        if (descVal.length < 5 || descVal.length > 500) {
            toast.error('Event description must be between 5 and 500 characters!');
            return;
        }

        if (editingEventId) {
            // Update mode
            const updatedEvents = eventsList.map(ev => {
                if (ev.id === editingEventId) {
                    return {
                        ...ev,
                        name: eventName.trim(),
                        image: eventImage || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600',
                        eventFor,
                        description: description.trim()
                    };
                }
                return ev;
            });
            setEventsList(updatedEvents);
            localStorage.setItem('school_admin_events', JSON.stringify(updatedEvents));
            setEditingEventId(null);
            toast.success('Event updated successfully!');
        } else {
            // Create mode
            const newEvent = {
                id: Math.random().toString(36).substr(2, 9),
                name: eventName.trim(),
                image: eventImage || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600', // fallback
                eventFor,
                description: description.trim(),
                date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            };

            const updatedEvents = [newEvent, ...eventsList];
            setEventsList(updatedEvents);
            localStorage.setItem('school_admin_events', JSON.stringify(updatedEvents));
            toast.success('Event created and published successfully!');
        }

        // Reset Form
        setEventName('');
        setEventImage('');
        setEventFor('All');
        setDescription('');
    };

    const handleStartEdit = (event) => {
        setEditingEventId(event.id);
        setEventName(event.name);
        setEventImage(event.image);
        setEventFor(event.eventFor);
        setDescription(event.description);
        toast.info('Loaded event details for editing.');
    };

    const handleCancelEdit = () => {
        setEditingEventId(null);
        setEventName('');
        setEventImage('');
        setEventFor('All');
        setDescription('');
        toast.info('Cancelled editing.');
    };

    const handleDeleteEvent = (id) => {
        setEventsList(prevEvents => {
            const updatedEvents = prevEvents.filter(ev => ev.id !== id);
            localStorage.setItem('school_admin_events', JSON.stringify(updatedEvents));
            return updatedEvents;
        });
        toast.success('Event deleted successfully.');
    };

    // Preset options for testing
    const presets = [
        { name: 'Sports', url: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=600' },
        { name: 'Science', url: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=600' },
        { name: 'Art & Cultural', url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=600' },
        { name: 'Academic Seminar', url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600' }
    ];

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="space-y-1 border-b border-border pb-6">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1e293b]">EVENTS</h2>
                <p className="text-sm text-text-light max-w-2xl">Publish and schedule upcoming campus seminars, cultural festivals, and sports events.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Event Creation Form */}
                <div className="lg:col-span-5 bg-white border border-border rounded-3xl shadow-sm overflow-hidden sticky top-6">
                    <div className="p-6 border-b border-border bg-gray-50/50 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            {editingEventId ? <Edit className="text-primary" size={20} /> : <Plus className="text-primary" size={20} />}
                            {editingEventId ? 'Edit Event' : 'Create New Event'}
                        </h3>
                        {editingEventId && (
                            <button 
                                type="button" 
                                onClick={handleCancelEdit}
                                className="text-xs text-danger hover:underline font-bold"
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleCreateEvent} className="p-6 space-y-5">
                        {/* Event Name */}
                        <div className="space-y-2">
                            <label htmlFor="eventName" className="text-[11px] font-black text-text-light uppercase tracking-wider block">
                                Enter the Event Name *
                            </label>
                            <input
                                type="text"
                                id="eventName"
                                placeholder="E.g. Annual Sports Meet, Coding Fest"
                                value={eventName}
                                onChange={(e) => setEventName(e.target.value)}
                                className="w-full px-4 py-3.5 bg-gray-50/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all font-medium"
                            />
                        </div>

                        {/* Event For Dropdown */}
                        <div className="space-y-2">
                            <label htmlFor="eventFor" className="text-[11px] font-black text-text-light uppercase tracking-wider block">
                                Event For *
                            </label>
                            <select
                                id="eventFor"
                                value={eventFor}
                                onChange={(e) => setEventFor(e.target.value)}
                                className="w-full px-4 py-3.5 bg-gray-50/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all font-bold text-gray-700 cursor-pointer"
                            >
                                <option value="All">All Students & Teachers</option>
                                <option value="Students">Students Only</option>
                                <option value="Teachers">Teachers Only</option>
                                <option value="Primary Division">Primary Division (Classes 1-5)</option>
                                <option value="High School">High School (Classes 6-12)</option>
                            </select>
                        </div>

                        {/* Image Upload Option */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-text-light uppercase tracking-wider block">
                                Upload Event Banner Image
                            </label>
                            
                            <div className="relative group border-2 border-dashed border-gray-200 hover:border-primary rounded-2xl p-4 transition-all bg-gray-50/30 flex flex-col items-center justify-center text-center">
                                {eventImage ? (
                                    <div className="relative w-full h-36 rounded-xl overflow-hidden">
                                        <img src={eventImage} alt="Preview" className="w-full h-full object-cover" />
                                        <button 
                                            type="button" 
                                            onClick={() => setEventImage('')}
                                            className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-[10px] font-black hover:bg-black transition-all uppercase"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="text-gray-400 group-hover:text-primary mb-2 transition-colors" size={28} />
                                        <p className="text-xs font-bold text-gray-700">Drag & Drop or Click to Upload</p>
                                        <p className="text-[10px] text-gray-400 mt-1">PNG, JPG or JPEG (Max 2MB)</p>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        />
                                    </>
                                )}
                            </div>

                            {/* Preset Banner Options for quick testing */}
                            {!eventImage && (
                                <div className="space-y-1.5 mt-2">
                                    <span className="text-[10px] font-black text-text-light uppercase tracking-wider">Or Use a Template Banner:</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {presets.map((preset) => (
                                            <button
                                                key={preset.name}
                                                type="button"
                                                onClick={() => handlePresetImage(preset.url)}
                                                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 border border-border rounded-lg text-[10px] font-bold text-gray-700 transition-colors"
                                            >
                                                {preset.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label htmlFor="description" className="text-[11px] font-black text-text-light uppercase tracking-wider block">
                                Enter Description *
                            </label>
                            <textarea
                                id="description"
                                rows={4}
                                placeholder="Details about event schedule, guidelines, special guests, or entry guidelines..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all font-medium resize-none leading-relaxed"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary-dark text-white font-black py-4 px-6 rounded-xl flex items-center justify-center gap-2 text-sm transition-all shadow-md shadow-primary/10 hover:shadow-lg uppercase tracking-wider"
                        >
                            <Calendar size={18} />
                            {editingEventId ? 'Update Event' : 'Create Now'}
                        </button>
                    </form>
                </div>

                {/* Event Feed List / Live Previews */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <Tag className="text-primary" size={18} />
                                Published Campus Events
                            </h3>
                            <p className="text-xs text-text-light mt-0.5">Live view of circular banners and descriptions published for user portals.</p>
                        </div>
                        <span className="bg-primary/5 text-primary text-xs font-bold px-3 py-1.5 rounded-lg border border-primary/10">
                            Total: {eventsList.length}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {eventsList.map((ev) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key={ev.id}
                                className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-gray-300 transition-all flex flex-col"
                            >
                                <div className="h-44 w-full relative shrink-0">
                                    <img src={ev.image} alt={ev.name} className="w-full h-full object-cover" />
                                    <div className="absolute top-3 left-3 flex gap-1.5">
                                        <span className="bg-primary/90 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md backdrop-blur-sm shadow-sm">
                                            For: {ev.eventFor}
                                        </span>
                                    </div>
                                    <div className="absolute top-3 right-3 flex gap-1.5">
                                        <button
                                            onClick={() => handleStartEdit(ev)}
                                            className="w-8 h-8 rounded-lg bg-black/60 text-white hover:bg-primary transition-colors flex items-center justify-center shadow-md backdrop-blur-sm"
                                            title="Edit Event"
                                        >
                                            <Edit size={13} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleDeleteEvent(ev.id); }}
                                            className="w-8 h-8 rounded-lg bg-black/60 text-white hover:bg-danger transition-colors flex items-center justify-center shadow-md backdrop-blur-sm"
                                            title="Delete Event"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1 text-[11px] font-bold text-primary">
                                            <Calendar size={12} />
                                            <span>Published {ev.date}</span>
                                        </div>
                                        <h4 className="text-base font-bold text-gray-900 leading-snug line-clamp-1">{ev.name}</h4>
                                        <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">{ev.description}</p>
                                    </div>

                                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                            <Info size={11} className="text-primary" />
                                            Active circular
                                        </span>
                                        <button 
                                            onClick={() => setSelectedViewEvent(ev)}
                                            className="text-xs font-bold text-primary hover:underline"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {eventsList.length === 0 && (
                            <div className="col-span-full bg-white rounded-2xl border border-border p-12 text-center text-text-light font-medium">
                                <div className="flex flex-col items-center justify-center space-y-3">
                                    <Calendar size={48} className="text-gray-300" />
                                    <h3 className="text-lg font-bold text-gray-800">No Events Published</h3>
                                    <p className="text-sm text-gray-500">Create your very first campus announcement event banner using the generator form.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* View Event Details Modal */}
            <AnimatePresence>
                {selectedViewEvent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-xl w-full border border-border"
                        >
                            {/* Banner Image */}
                            <div className="h-56 w-full relative">
                                <img 
                                    src={selectedViewEvent.image} 
                                    alt={selectedViewEvent.name} 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-4 left-4">
                                    <span className="bg-primary text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg shadow-md">
                                        For: {selectedViewEvent.eventFor}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => setSelectedViewEvent(null)}
                                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 text-white hover:bg-black transition-colors flex items-center justify-center shadow-lg backdrop-blur-sm"
                                    title="Close"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                                    <Calendar size={13} />
                                    <span>Published on {selectedViewEvent.date}</span>
                                </div>
                                
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-gray-900 leading-tight">
                                        {selectedViewEvent.name}
                                    </h3>
                                    <div className="w-12 h-1 bg-primary rounded-full"></div>
                                </div>

                                <div className="space-y-1 bg-gray-50 p-3 rounded-xl border border-border">
                                    <span className="text-[10px] font-black text-text-light uppercase tracking-wider block">Target Audience:</span>
                                    <p className="text-xs font-bold text-gray-800">{selectedViewEvent.eventFor}</p>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-text-light uppercase tracking-wider block">Event Circular Details:</span>
                                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {selectedViewEvent.description}
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex justify-end">
                                    <button 
                                        onClick={() => setSelectedViewEvent(null)}
                                        className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-xs transition-colors"
                                    >
                                        Close Circular
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

