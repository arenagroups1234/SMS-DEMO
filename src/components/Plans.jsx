import React, { useState } from 'react';
import { Plus, Check, Trash2, Briefcase, Activity, PowerOff, X, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Plans = ({ plans = [], schools = [], onAddPlan, onEditPlan, onDeletePlan, role, activeSchool, onSelectPlan }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [errors, setErrors] = useState({});
    const [selectedPlanDetails, setSelectedPlanDetails] = useState(null);
    const [editingPlan, setEditingPlan] = useState(null);
    const [newPlan, setNewPlan] = useState({
        name: '',
        price: 0,
        features: [''],
        billingCycle: 'Monthly',
        isActive: true,
        teacherLimit: '',
        classLimit: '',
        storageLimit: '',
        studentLimit: ''
    });

    const isLimitValid = (val) => {
        if (!val || !val.trim()) return false;
        const v = val.trim().toLowerCase();
        return v === 'unlimited' || /^\d+$/.test(v);
    };

    const validate = () => {
        const newErrors = {};
        
        // Plan Name validations
        if (!newPlan.name.trim()) {
            newErrors.name = 'Plan name is required';
        } else if (newPlan.name.length > 30) {
            newErrors.name = 'Plan name must be 30 characters or less';
        }

        // Price validations
        if (newPlan.price === undefined || newPlan.price === null || newPlan.price < 0) {
            newErrors.price = 'Price must be 0 or greater';
        } else if (String(newPlan.price).length > 15) {
            newErrors.price = 'Price must be 15 digits or less';
        }

        // Teacher limit validations
        if (!newPlan.teacherLimit.trim()) {
            newErrors.teacherLimit = 'Teacher limit is required';
        } else if (!isLimitValid(newPlan.teacherLimit)) {
            newErrors.teacherLimit = 'Enter a valid number or "Unlimited"';
        }

        // Class limit validations
        if (!newPlan.classLimit.trim()) {
            newErrors.classLimit = 'Class limit is required';
        } else if (!isLimitValid(newPlan.classLimit)) {
            newErrors.classLimit = 'Enter a valid number or "Unlimited"';
        }

        // Storage quota validations
        if (!newPlan.storageLimit.trim()) {
            newErrors.storageLimit = 'Storage limit is required';
        } else if (newPlan.storageLimit.length > 20) {
            newErrors.storageLimit = 'Storage limit must be 20 characters or less';
        }

        // Student limit validations
        if (!newPlan.studentLimit.trim()) {
            newErrors.studentLimit = 'Student capacity is required';
        } else if (!isLimitValid(newPlan.studentLimit)) {
            newErrors.studentLimit = 'Enter a valid number or "Unlimited"';
        }

        // Features validations
        const validFeatures = newPlan.features.filter(f => f.trim() !== '');
        if (validFeatures.length === 0) {
            newErrors.features = 'At least one feature is required';
        } else {
            const hasTooLongFeature = validFeatures.some(f => f.length > 50);
            if (hasTooLongFeature) {
                newErrors.features = 'Each feature must be 50 characters or less';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const activeCount = plans.filter(p => p.isActive !== false).length;
    const inactiveCount = plans.filter(p => p.isActive === false).length;
    const calculatedUsage = plans.length > 0
        ? Math.round((activeCount / plans.length) * 100)
        : 0;

    const stats = {
        active: activeCount,
        inactive: inactiveCount,
        systemUsage: calculatedUsage
    };

    const handleAddFeature = () => {
        setNewPlan(prev => ({ ...prev, features: [...prev.features, ''] }));
    };

    const handleFeatureChange = (index, value) => {
        // features: 30 latter max
        const updatedFeatures = [...newPlan.features];
        updatedFeatures[index] = value.slice(0, 30);
        setNewPlan(prev => ({ ...prev, features: updatedFeatures }));
        if (errors.features) {
            setErrors(prev => {
                const next = { ...prev };
                delete next.features;
                return next;
            });
        }
    };

    const handleRemoveFeature = (index) => {
        setNewPlan(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
    };

    const handleOpenAdd = () => {
        setEditingPlan(null);
        setNewPlan({
            name: '',
            price: 0,
            features: [''],
            billingCycle: 'Monthly',
            isActive: true,
            teacherLimit: '',
            classLimit: '',
            storageLimit: '',
            studentLimit: ''
        });
        setErrors({});
        setIsAdding(true);
    };

    const handleOpenEdit = (plan) => {
        setEditingPlan(plan);
        setNewPlan({
            id: plan.id,
            name: plan.name,
            price: plan.price,
            features: plan.features.length > 0 ? plan.features : [''],
            billingCycle: plan.billingCycle || 'Monthly',
            isActive: plan.isActive !== false,
            teacherLimit: String(plan.teacherLimit || ''),
            classLimit: String(plan.classLimit || ''),
            storageLimit: String(plan.storageLimit || ''),
            studentLimit: String(plan.studentLimit || '')
        });
        setErrors({});
        setIsAdding(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            if (editingPlan) {
                onEditPlan && onEditPlan({
                    ...newPlan,
                    features: newPlan.features.filter(f => f.trim() !== '')
                });
            } else {
                onAddPlan({
                    ...newPlan,
                    features: newPlan.features.filter(f => f.trim() !== '')
                });
            }
            setIsAdding(false);
            setEditingPlan(null);
            setErrors({});
        }
    };

    const handleDeleteClick = (id, name) => {
        if (window.confirm(`Are you sure you want to delete the plan "${name}"?`)) {
            onDeletePlan && onDeletePlan(id);
        }
    };

    // Form field handlers to enforce typing rules reactively
    const handleNameChange = (e) => {
        const val = e.target.value.replace(/[0-9]/g, '').slice(0, 20);
        setNewPlan(prev => ({ ...prev, name: val }));
        if (errors.name) {
            setErrors(prev => {
                const next = { ...prev };
                delete next.name;
                return next;
            });
        }
    };

    const handlePriceChange = (e) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 15);
        setNewPlan(prev => ({ ...prev, price: val ? Number(val) : 0 }));
        if (errors.price) {
            setErrors(prev => {
                const next = { ...prev };
                delete next.price;
                return next;
            });
        }
    };

    const handleTeacherLimitChange = (e) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
        setNewPlan(prev => ({ ...prev, teacherLimit: val }));
        if (errors.teacherLimit) {
            setErrors(prev => {
                const next = { ...prev };
                delete next.teacherLimit;
                return next;
            });
        }
    };

    const handleClassLimitChange = (e) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
        setNewPlan(prev => ({ ...prev, classLimit: val }));
        if (errors.classLimit) {
            setErrors(prev => {
                const next = { ...prev };
                delete next.classLimit;
                return next;
            });
        }
    };

    const handleStorageLimitChange = (e) => {
        const val = e.target.value.slice(0, 20);
        setNewPlan(prev => ({ ...prev, storageLimit: val }));
        if (errors.storageLimit) {
            setErrors(prev => {
                const next = { ...prev };
                delete next.storageLimit;
                return next;
            });
        }
    };

    const handleStudentLimitChange = (e) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 15);
        setNewPlan(prev => ({ ...prev, studentLimit: val }));
        if (errors.studentLimit) {
            setErrors(prev => {
                const next = { ...prev };
                delete next.studentLimit;
                return next;
            });
        }
    };

    return (
        <div className="space-y-10 pb-20">
            {/* Header section */}
            <div className="flex justify-between items-end">
                <div className="space-y-2">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#1e293b]">Subscription Plans</h2>
                    <p className="text-sm text-text-light">
                        {role === 'school_admin' 
                            ? 'View and select subscription plans configured by the Super Admin.' 
                            : 'Create and manage school subscription plans and tiers.'}
                    </p>
                </div>
                {role !== 'school_admin' && (
                    <button onClick={handleOpenAdd} className="bg-primary text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-primary/30 hover:-translate-y-0.5 transition-all active:scale-95">
                        <Plus size={18}/> Add Plan
                    </button>
                )}
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center text-success">
                        <Briefcase size={24}/>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-text-light uppercase tracking-widest mb-1">Active Plans</p>
                        <p className="text-2xl font-black text-text-color">{stats.active}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-danger/10 rounded-xl flex items-center justify-center text-danger">
                        <PowerOff size={24}/>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-text-light uppercase tracking-widest mb-1">Inactive Plans</p>
                        <p className="text-2xl font-black text-text-color">{stats.inactive}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center text-warning">
                        <Activity size={24}/>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-text-light uppercase tracking-widest mb-1">System Usage</p>
                        <p className="text-2xl font-black text-text-color">{stats.systemUsage}%</p>
                    </div>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {plans.map((plan, idx) => (
                    <motion.div key={plan.id || idx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }} className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col hover:shadow-xl transition-all hover:-translate-y-1 relative group">
                        <div className="p-8 text-center border-b border-border space-y-4 relative">
                            <div className={`absolute top-4 left-4 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${plan.isActive !== false ? 'bg-success/15 text-success border-success/30' : 'bg-danger/15 text-danger border-danger/30'}`}>
                                {plan.isActive !== false ? 'Active' : 'Inactive'}
                            </div>
                            <h3 className="text-xl font-bold text-text-color">{plan.name}</h3>
                            <div className="flex items-end justify-center gap-1">
                                <span className="text-4xl font-black text-primary">₹{plan.price}</span>
                                <span className="text-sm text-text-light mb-1">/{plan.billingCycle === 'Monthly' ? 'mo' : 'yr'}</span>
                            </div>
                        </div>
                        <div className="p-8 flex-1 space-y-4">
                            <ul className="space-y-3">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-text-color">
                                        <Check size={16} className="text-success mt-0.5 shrink-0"/>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Plan Limits Section */}
                        <div className="px-8 pb-8 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-gray-50 rounded-xl border border-border flex flex-col items-center text-center">
                                    <p className="text-[10px] font-bold text-text-light uppercase tracking-widest mb-1">Teacher Limit</p>
                                    <p className="text-sm font-black text-primary">{plan.teacherLimit || 'Unlimited'}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl border border-border flex flex-col items-center text-center">
                                    <p className="text-[10px] font-bold text-text-light uppercase tracking-widest mb-1">Class Limit</p>
                                    <p className="text-sm font-black text-primary">{plan.classLimit || 'Unlimited'}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl border border-border flex flex-col items-center text-center">
                                    <p className="text-[10px] font-bold text-text-light uppercase tracking-widest mb-1">Storage Limit</p>
                                    <p className="text-sm font-black text-primary">{plan.storageLimit || 'Unlimited'}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl border border-border flex flex-col items-center text-center">
                                    <p className="text-[10px] font-bold text-text-light uppercase tracking-widest mb-1">Student Limit</p>
                                    <p className="text-sm font-black text-primary">{plan.studentLimit || 'Unlimited'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="p-8 pt-0 flex gap-2">
                            {role === 'school_admin' && activeSchool && (activeSchool.planName === plan.name || (!activeSchool.planName && plan.name === 'Premium Plan' && activeSchool.id === '1')) ? (
                                <button disabled className="w-full py-3 bg-success/10 text-success border-2 border-success/20 font-bold rounded-xl cursor-not-allowed">
                                    Current Plan
                                </button>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => {
                                            if (role === 'school_admin') {
                                                onSelectPlan && onSelectPlan(plan);
                                            } else {
                                                setSelectedPlanDetails(plan);
                                            }
                                        }} 
                                        className="flex-1 py-3 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all text-xs"
                                    >
                                        {role === 'school_admin' ? 'Select Plan' : 'View Details'}
                                    </button>

                                    {role !== 'school_admin' && (
                                        <>
                                            <button 
                                                onClick={() => onEditPlan && onEditPlan({ ...plan, isActive: !plan.isActive })}
                                                className={`p-3 border rounded-xl transition-all flex items-center justify-center ${plan.isActive !== false ? 'border-success/30 text-success hover:bg-success/10' : 'border-border text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}
                                                title={plan.isActive !== false ? 'Deactivate Plan' : 'Activate Plan'}
                                            >
                                                <PowerOff size={15}/>
                                            </button>
                                            <button 
                                                onClick={() => handleOpenEdit(plan)}
                                                className="p-3 border border-border text-primary rounded-xl hover:bg-primary/5 hover:border-primary transition-all flex items-center justify-center"
                                                title="Edit Plan"
                                            >
                                                <Edit2 size={15}/>
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteClick(plan.id, plan.name)}
                                                className="p-3 border border-border text-danger rounded-xl hover:bg-danger/5 hover:border-danger transition-all flex items-center justify-center"
                                                title="Delete Plan"
                                            >
                                                <Trash2 size={15}/>
                                            </button>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Centered Modal Overlay for adding/editing a plan */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
                        onClick={() => setIsAdding(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 30 }} 
                            animate={{ scale: 1, y: 0 }} 
                            exit={{ scale: 0.95, y: 30 }} 
                            className="bg-white rounded-2xl border border-border max-w-4xl w-full overflow-hidden shadow-2xl relative my-8 text-text-color"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-6 bg-gradient-to-r from-primary to-primary-dark text-white relative">
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-all"
                                >
                                    <X size={18} />
                                </button>
                                <div className="space-y-1 text-left">
                                    <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">
                                        Administration Control
                                    </span>
                                    <h3 className="text-2xl font-black">
                                        {editingPlan ? 'Edit Subscription Plan' : 'Configure New Plan'}
                                    </h3>
                                    <p className="text-xs text-white/80">
                                        {editingPlan 
                                            ? 'Modify pricing, billing cycle, resource thresholds, and custom features.' 
                                            : 'Configure pricing, billing cycle, resource thresholds, and custom features.'}
                                    </p>
                                </div>
                            </div>

                            {/* Modal Form */}
                            <form onSubmit={handleSubmit} noValidate className="p-6 md:p-8 space-y-6 text-left max-h-[70vh] overflow-y-auto custom-scrollbar">
                                
                                {/* Section 1: Basic specifications */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest border-b border-border pb-1">Basic Settings</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold">Plan Name *</label>
                                            <input type="text" placeholder="e.g. Basic or Enterprise" value={newPlan.name} onChange={handleNameChange} className={`border rounded-lg px-3 py-2 text-sm focus:outline-none transition-all ${errors.name
                                                    ? 'border-danger focus:ring-3 focus:ring-danger/10'
                                                    : 'border-border focus:border-primary focus:ring-3 focus:ring-primary/10'}`}/>
                                            {errors.name && <span className="text-[9px] font-bold text-danger uppercase">{errors.name}</span>}
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold">Price (INR ₹) *</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light font-bold text-xs">₹</span>
                                                <input type="number" placeholder="0" min="0" value={newPlan.price || ''} onChange={handlePriceChange} className={`border rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none transition-all w-full ${errors.price
                                                        ? 'border-danger focus:ring-3 focus:ring-danger/10'
                                                        : 'border-border focus:border-primary focus:ring-3 focus:ring-primary/10'}`}/>
                                            </div>
                                            {errors.price && <span className="text-[9px] font-bold text-danger uppercase">{errors.price}</span>}
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold">Billing Cycle</label>
                                            <select value={newPlan.billingCycle} onChange={e => setNewPlan(prev => ({ ...prev, billingCycle: e.target.value }))} className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all bg-white">
                                                <option value="Monthly">Monthly</option>
                                                <option value="Yearly">Yearly</option>
                                            </select>
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold">Plan Status</label>
                                            <select value={newPlan.isActive ? 'active' : 'inactive'} onChange={e => setNewPlan(prev => ({ ...prev, isActive: e.target.value === 'active' }))} className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all bg-white font-semibold">
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Quotas configuration */}
                                <div className="space-y-4 pt-2">
                                    <h4 className="text-xs font-black uppercase tracking-widest border-b border-border pb-1">Threshold Limitations</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold">Teacher Seats * (max 4 digits)</label>
                                            <input type="text" placeholder="e.g. 50" value={newPlan.teacherLimit} onChange={handleTeacherLimitChange} className={`border rounded-lg px-3 py-2 text-sm focus:outline-none transition-all ${errors.teacherLimit
                                                    ? 'border-danger focus:ring-3 focus:ring-danger/10'
                                                    : 'border-border focus:border-primary focus:ring-3 focus:ring-primary/10'}`}/>
                                            {errors.teacherLimit && <span className="text-[9px] font-bold text-danger uppercase">{errors.teacherLimit}</span>}
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold">Classrooms Limit * (max 4 digits)</label>
                                            <input type="text" placeholder="e.g. 20" value={newPlan.classLimit} onChange={handleClassLimitChange} className={`border rounded-lg px-3 py-2 text-sm focus:outline-none transition-all ${errors.classLimit
                                                    ? 'border-danger focus:ring-3 focus:ring-danger/10'
                                                    : 'border-border focus:border-primary focus:ring-3 focus:ring-primary/10'}`}/>
                                            {errors.classLimit && <span className="text-[9px] font-bold text-danger uppercase">{errors.classLimit}</span>}
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold">Storage Quota * (max 20 chars)</label>
                                            <input type="text" placeholder="e.g. 100GB" value={newPlan.storageLimit} onChange={handleStorageLimitChange} className={`border rounded-lg px-3 py-2 text-sm focus:outline-none transition-all ${errors.storageLimit
                                                    ? 'border-danger focus:ring-3 focus:ring-danger/10'
                                                    : 'border-border focus:border-primary focus:ring-3 focus:ring-primary/10'}`}/>
                                            {errors.storageLimit && <span className="text-[9px] font-bold text-danger uppercase">{errors.storageLimit}</span>}
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold">Student Capacity * (max 15 digits)</label>
                                            <input type="text" placeholder="e.g. 1000" value={newPlan.studentLimit} onChange={handleStudentLimitChange} className={`border rounded-lg px-3 py-2 text-sm focus:outline-none transition-all ${errors.studentLimit
                                                    ? 'border-danger focus:ring-3 focus:ring-danger/10'
                                                    : 'border-border focus:border-primary focus:ring-3 focus:ring-primary/10'}`}/>
                                            {errors.studentLimit && <span className="text-[9px] font-bold text-danger uppercase">{errors.studentLimit}</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Custom features list */}
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between border-b border-border pb-1">
                                        <h4 className="text-xs font-black uppercase tracking-widest">Included Features</h4>
                                        {errors.features && <span className="text-[9px] font-bold text-danger uppercase">{errors.features}</span>}
                                    </div>
                                    
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {newPlan.features.map((feature, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <input type="text" placeholder="Enter feature (max 30 chars)..." value={feature} onChange={e => handleFeatureChange(idx, e.target.value)} className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/5 transition-all"/>
                                                {newPlan.features.length > 1 && (
                                                    <button type="button" onClick={() => handleRemoveFeature(idx)} className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors">
                                                        <Trash2 size={16}/>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <button type="button" onClick={handleAddFeature} className="text-primary text-xs font-bold flex items-center gap-1 hover:underline">
                                        <Plus size={14}/> Add Custom Feature
                                    </button>
                                </div>

                                {/* Modal footer controls */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border mt-4 justify-end">
                                    <button type="button" onClick={() => setIsAdding(false)} className="bg-medium-gray hover:bg-border text-text-color px-6 py-2.5 rounded-lg text-xs font-bold transition-all">
                                        Cancel
                                    </button>
                                    <button type="submit" className="bg-gradient-to-r from-success to-[#059669] text-white px-8 py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm">
                                        {editingPlan ? 'Save Changes' : 'Save New Plan'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal for viewing plan details */}
            <AnimatePresence>
                {selectedPlanDetails && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-text-color"
                        onClick={() => setSelectedPlanDetails(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl border border-border max-w-2xl w-full overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal header */}
                            <div className="p-6 bg-gradient-to-r from-primary to-primary-dark text-white relative">
                                <button
                                    onClick={() => setSelectedPlanDetails(null)}
                                    className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-all"
                                >
                                    <X size={18} />
                                </button>
                                <div className="space-y-1 text-left">
                                    <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">
                                        Plan Specifications
                                    </span>
                                    <h3 className="text-2xl font-black">{selectedPlanDetails.name}</h3>
                                </div>
                            </div>

                            {/* Modal body */}
                            <div className="p-6 md:p-8 space-y-6 text-left">
                                {/* Cost summary card */}
                                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-between">
                                    <span className="text-sm font-bold">Subscription Cost</span>
                                    <span className="text-2xl font-black text-primary">
                                        ₹{selectedPlanDetails.price}
                                        <span className="text-xs text-text-light font-bold">/{selectedPlanDetails.billingCycle === 'Monthly' ? 'mo' : 'yr'}</span>
                                    </span>
                                </div>

                                {/* Quotas grid */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-black uppercase tracking-widest">Resource Thresholds</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-gray-50 border border-border rounded-xl">
                                            <p className="text-[10px] text-text-light font-bold uppercase tracking-wider">Teacher Seats</p>
                                            <p className="text-base font-black mt-0.5">{selectedPlanDetails.teacherLimit || 'Unlimited'}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 border border-border rounded-xl">
                                            <p className="text-[10px] text-text-light font-bold uppercase tracking-wider">Classrooms Limit</p>
                                            <p className="text-base font-black mt-0.5">{selectedPlanDetails.classLimit || 'Unlimited'}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 border border-border rounded-xl">
                                            <p className="text-[10px] text-text-light font-bold uppercase tracking-wider">Storage Capacity</p>
                                            <p className="text-base font-black mt-0.5">{selectedPlanDetails.storageLimit || 'Unlimited'}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 border border-border rounded-xl">
                                            <p className="text-[10px] text-text-light font-bold uppercase tracking-wider">Student Enrolments</p>
                                            <p className="text-base font-black mt-0.5">{selectedPlanDetails.studentLimit || 'Unlimited'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Included features list */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-black uppercase tracking-widest">Included Core Features</h4>
                                    <ul className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                        {selectedPlanDetails.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2.5 text-xs">
                                                <Check size={14} className="text-success mt-0.5 shrink-0" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Modal footer */}
                            <div className="px-6 py-4 bg-gray-50 border-t border-border flex justify-end">
                                <button
                                    onClick={() => setSelectedPlanDetails(null)}
                                    className="bg-[#7BADC8] hover:bg-border text-text-color px-6 py-2 rounded-xl text-xs font-bold transition-all"
                                >
                                    Dismiss Details
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
