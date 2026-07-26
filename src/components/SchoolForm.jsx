import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
export const SchoolForm = ({ school, plans = [], onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        ownerName: '',
        address: '',
        state: '',
        zipCode: '',
        location: '',
        email: '',
        phone: '',
        password: '',
        planName: '',
        startDate: '',
        endDate: '',
        students: 0,
        teachers: 0,
        amount: 0,
        status: 'Pending',
        hostelEnabled: false,
    });
    const [errors, setErrors] = useState({});
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [otpValue, setOtpValue] = useState('');
    const [isVerified, setIsVerified] = useState(true);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const getPasswordStrength = (password) => {
        if (!password)
            return { label: '', color: 'bg-border', width: '0%', score: 0 };
        let score = 0;
        if (password.length >= 8)
            score++;
        if (/[A-Z]/.test(password))
            score++;
        if (/[0-9]/.test(password))
            score++;
        if (/[^A-Za-z0-9]/.test(password))
            score++;
        if (score <= 1)
            return { label: 'Weak', color: 'bg-danger', width: '25%', score };
        if (score <= 2)
            return { label: 'Medium', color: 'bg-warning', width: '50%', score };
        if (score <= 3)
            return { label: 'Strong', color: 'bg-success', width: '75%', score };
        return { label: 'Very Strong', color: 'bg-primary', width: '100%', score };
    };
    const formatIsoDate = (val) => {
        if (!val) return '';
        return String(val).trim().split('T')[0].split(' ')[0];
    };
    useEffect(() => {
        if (school) {
            setFormData({
                name: school.name || '',
                ownerName: school.ownerName || '',
                address: school.address || '',
                state: school.state || '',
                zipCode: school.zipCode || '',
                location: school.location || '',
                email: school.email || '',
                phone: school.phone || '',
                password: school.password || '',
                planName: school.planName || '',
                startDate: formatIsoDate(school.startDate || school.subscriptionStart),
                endDate: formatIsoDate(school.endDate || school.subscriptionEnd),
                students: school.students !== undefined && school.students !== null ? school.students : 0,
                teachers: school.teachers !== undefined && school.teachers !== null ? school.teachers : 0,
                amount: school.amount !== undefined && school.amount !== null ? school.amount : 0,
                status: school.status || 'Pending',
                hostelEnabled: localStorage.getItem(`sms_${school.id}_hostel_enabled`) === 'true',
            });
            // If editing an existing school, assume the phone is verified
            setIsVerified(true);
        }
    }, [school, plans]);
    const handleChange = (e) => {
        const { id, value } = e.target;
        
        // School Name: max 25 characters. ONLY alphabets and spaces allowed (non-alphabet characters cannot be inserted).
        if (id === 'name') {
            const sanitized = value.replace(/[^a-zA-Z\s]/g, '').slice(0, 25);
            setFormData(prev => ({ ...prev, [id]: sanitized }));
            if (errors.name) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.name;
                    return newErrors;
                });
            }
            return;
        }

        // Plan Subscription: update planName only (do not auto-fill registration amount)
        if (id === 'planName') {
            const selectedPlan = plans.find(p => p.name === value);
            setFormData(prev => {
                let updated = { ...prev, planName: value };
                if (selectedPlan) {
                    updated.amount = selectedPlan.price || 0;
                    
                    const parseLimit = (lim) => {
                        if (!lim) return 0;
                        const parsed = parseInt(lim);
                        return isNaN(parsed) ? 99999 : parsed;
                    };
                    updated.teachers = parseLimit(selectedPlan.teacherLimit);
                    updated.students = parseLimit(selectedPlan.studentLimit);
                    
                    const start = updated.startDate ? new Date(updated.startDate) : new Date();
                    if (!updated.startDate) {
                        updated.startDate = start.toISOString().split('T')[0];
                    }
                    const cycle = (selectedPlan.billingCycle || 'Monthly').toLowerCase();
                    const end = new Date(start);
                    if (cycle.includes('yearly')) {
                        end.setFullYear(end.getFullYear() + 1);
                    } else if (cycle.includes('quarterly')) {
                        end.setMonth(end.getMonth() + 3);
                    } else if (cycle.includes('half-yearly')) {
                        end.setMonth(end.getMonth() + 6);
                    } else {
                        end.setMonth(end.getMonth() + 1);
                    }
                    updated.endDate = end.toISOString().split('T')[0];
                }
                return updated;
            });
            if (errors.planName) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.planName;
                    return newErrors;
                });
            }
            return;
        }

        // Owner Name: max 30 characters. ONLY alphabets and spaces allowed.
        if (id === 'ownerName') {
            const sanitized = value.replace(/[^a-zA-Z\s]/g, '').slice(0, 30);
            setFormData(prev => ({ ...prev, [id]: sanitized }));
            if (errors.ownerName) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.ownerName;
                    return newErrors;
                });
            }
            return;
        }

        // Detailed Address: max 150 characters.
        if (id === 'address') {
            const sanitized = value.slice(0, 150);
            setFormData(prev => ({ ...prev, [id]: sanitized }));
            if (errors.address) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.address;
                    return newErrors;
                });
            }
            return;
        }

        // State: max 25 characters. Allow letters, spaces, hyphens, dots.
        if (id === 'state') {
            const sanitized = value.replace(/[^a-zA-Z\s.-]/g, '').slice(0, 25);
            setFormData(prev => ({ ...prev, [id]: sanitized }));
            if (errors.state) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.state;
                    return newErrors;
                });
            }
            return;
        }

        // City/Location: max 25 characters. Allow letters, spaces, hyphens, dots.
        if (id === 'location') {
            const sanitized = value.replace(/[^a-zA-Z\s.-]/g, '').slice(0, 25);
            setFormData(prev => ({ ...prev, [id]: sanitized }));
            if (errors.location) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.location;
                    return newErrors;
                });
            }
            return;
        }

        // Email: max 30 characters.
        if (id === 'email') {
            const sanitized = value.slice(0, 30);
            setFormData(prev => ({ ...prev, [id]: sanitized }));
            if (errors.email) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.email;
                    return newErrors;
                });
            }
            return;
        }

        // Password: max 50 characters.
        if (id === 'password') {
            const sanitized = value.slice(0, 50);
            setFormData(prev => ({ ...prev, [id]: sanitized }));
            if (errors.password) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.password;
                    return newErrors;
                });
            }
            return;
        }

        // Custom phone validation (only numbers and max 10 digits)
        if (id === 'phone') {
            const sanitized = value.replace(/\D/g, '').slice(0, 10);
            setFormData(prev => ({ ...prev, [id]: sanitized }));
            if (errors.phone) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.phone;
                    return newErrors;
                });
            }
            return;
        }
        // Custom zip code validation (only numbers and max 6 digits)
        if (id === 'zipCode') {
            const sanitized = value.replace(/\D/g, '').slice(0, 6);
            setFormData(prev => ({ ...prev, [id]: sanitized }));
            if (errors.zipCode) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.zipCode;
                    return newErrors;
                });
            }
            return;
        }
        // Custom number validations (only positive integers and max length)
        if (id === 'teachers') {
            const sanitized = value.replace(/\D/g, '').slice(0, 4);
            const numericVal = sanitized ? Number(sanitized) : '';
            setFormData(prev => ({ ...prev, [id]: numericVal }));
            if (errors[id]) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[id];
                    return newErrors;
                });
            }
            return;
        }
        if (id === 'students') {
            const sanitized = value.replace(/\D/g, '').slice(0, 6);
            const numericVal = sanitized ? Number(sanitized) : '';
            setFormData(prev => ({ ...prev, [id]: numericVal }));
            if (errors[id]) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[id];
                    return newErrors;
                });
            }
            return;
        }
        if (id === 'amount') {
            const sanitized = value.replace(/\D/g, '').slice(0, 8);
            const numericVal = sanitized ? Number(sanitized) : '';
            setFormData(prev => ({ ...prev, [id]: numericVal }));
            if (errors[id]) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[id];
                    return newErrors;
                });
            }
            return;
        }
        const val = value;
        setFormData(prev => {
            let updated = { ...prev, [id]: val };
            if (id === 'startDate') {
                const selectedPlan = plans.find(p => p.name === prev.planName);
                if (selectedPlan && val) {
                    const start = new Date(val);
                    const cycle = (selectedPlan.billingCycle || 'Monthly').toLowerCase();
                    const end = new Date(start);
                    if (cycle.includes('yearly')) {
                        end.setFullYear(end.getFullYear() + 1);
                    } else if (cycle.includes('quarterly')) {
                        end.setMonth(end.getMonth() + 3);
                    } else if (cycle.includes('half-yearly')) {
                        end.setMonth(end.getMonth() + 6);
                    } else {
                        end.setMonth(end.getMonth() + 1);
                    }
                    updated.endDate = end.toISOString().split('T')[0];
                }
            }
            return updated;
        });
        if (errors[id]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[id];
                return newErrors;
            });
        }
    };
    const handleSendOtp = () => {
        if (!formData.phone || formData.phone.length !== 10) {
            setErrors(prev => ({ ...prev, phone: 'Enter a valid 10-digit mobile number' }));
            return;
        }
        setIsSendingOtp(true);
        // Simulate API call
        setTimeout(() => {
            setIsSendingOtp(false);
            setIsOtpSent(true);
            toast.success('OTP sent successfully to ' + formData.phone);
        }, 1500);
    };
    const handleVerifyOtp = () => {
        if (otpValue.length !== 6) {
            toast.error('Please enter a 6-digit OTP');
            return;
        }
        setIsVerifying(true);
        // Simulate verification
        setTimeout(() => {
            setIsVerifying(false);
            if (otpValue === '123456') { // Mock verification code
                setIsVerified(true);
                setIsOtpSent(false);
                toast.success('Mobile number verified successfully!');
            }
            else {
                toast.error('Invalid OTP. Please try again.');
            }
        }, 1200);
    };
    const validate = () => {
        const newErrors = {};
        if (!formData.name) {
            newErrors.name = 'School name is required';
        } else if (formData.name.trim().length < 3 || formData.name.trim().length > 25) {
            newErrors.name = 'School name must be between 3 and 25 characters';
        }
        if (!formData.ownerName) {
            newErrors.ownerName = 'School owner name is required';
        } else if (formData.ownerName.trim().length < 3 || formData.ownerName.trim().length > 30) {
            newErrors.ownerName = 'School owner name must be between 3 and 30 characters';
        }
        if (!formData.address) {
            newErrors.address = 'Detailed address is required';
        }
        else if (formData.address.length < 10 || formData.address.length > 150) {
            newErrors.address = 'Address must be between 10 and 150 characters';
        }
        if (!formData.state) {
            newErrors.state = 'State is required';
        } else if (formData.state.trim().length < 3 || formData.state.trim().length > 25) {
            newErrors.state = 'State name must be between 3 and 25 characters';
        }
        if (!formData.zipCode) {
            newErrors.zipCode = 'Zip code is required';
        }
        else if (!/^\d{6}$/.test(formData.zipCode)) {
            newErrors.zipCode = 'Invalid zip code (6 digits)';
        }
        if (!formData.location) {
            newErrors.location = 'City/Location is required';
        } else if (formData.location.trim().length < 3 || formData.location.trim().length > 25) {
            newErrors.location = 'City name must be between 3 and 25 characters';
        }
        // Strict Email validation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!formData.email) {
            newErrors.email = 'Email is required';
        }
        else if (!emailRegex.test(formData.email) || formData.email.length > 30) {
            newErrors.email = 'Enter a valid email address (max 30 characters)';
        }
        // Phone validation
        if (!formData.phone) {
            newErrors.phone = 'Phone number is required';
        }
        else if (formData.phone.length !== 10) {
            newErrors.phone = 'Mobile number must be exactly 10 digits';
        }
        // Strict Password validation
        if (!school && !formData.password) {
            newErrors.password = 'Password is required';
        }
        else if (formData.password) {
            const strength = getPasswordStrength(formData.password);
            if (formData.password.length < 8) {
                newErrors.password = 'Minimum 8 characters required';
            }
            else if (formData.password.length > 50) {
                newErrors.password = 'Maximum 50 characters allowed';
            }
            else if (strength.score < 3) {
                newErrors.password = 'Password too weak. Use numbers and special characters.';
            }
        }

        if (!formData.planName) {
            newErrors.planName = 'Please select a plan subscription';
        }

        if (formData.startDate && formData.endDate) {
            if (new Date(formData.endDate) < new Date(formData.startDate)) {
                newErrors.endDate = 'End date cannot be earlier than start date';
            }
        }

        if (!formData.teachers || formData.teachers <= 0) {
            newErrors.teachers = 'Number of teachers is required';
        } else if (formData.teachers > 9999) {
            newErrors.teachers = 'Number of teachers must be 9999 or less';
        }
        if (!formData.students || formData.students <= 0) {
            newErrors.students = 'Number of students is required';
        } else if (formData.students > 999999) {
            newErrors.students = 'Number of students must be 999,999 or less';
        }
        if (!formData.amount || formData.amount <= 0) {
            newErrors.amount = 'Registration amount is required';
        } else if (formData.amount > 99999999) {
            newErrors.amount = 'Registration amount must be 99,999,999 or less';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSave({ ...formData, id: school?.id });
        }
    };
    return (<div className="space-y-8">
      <div className="page-header">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1e293b]">
          {school ? 'Edit School' : 'Add New School'}
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border p-6 md:p-8">
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-sm font-semibold text-text-color">School Name (Max 25 chars, Alphabets only) *</label>
                <input type="text" id="name" placeholder="Full School Name" maxLength={25} required value={formData.name} onChange={handleChange} className={`border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all ${errors.name ? 'border-danger ring-danger/10' : ''}`}/>
                {errors.name && <span className="text-[10px] text-danger">{errors.name}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="ownerName" className="text-sm font-semibold text-text-color">School Owner Name (Max 30 chars, Alphabets only) *</label>
                <input type="text" id="ownerName" placeholder="Full Owner Name" maxLength={30} required value={formData.ownerName} onChange={handleChange} className={`border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all ${errors.ownerName ? 'border-danger ring-danger/10' : ''}`}/>
                {errors.ownerName && <span className="text-[10px] text-danger">{errors.ownerName}</span>}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="address" className="text-sm font-semibold text-text-color">Detailed Address *</label>
              <input type="text" id="address" placeholder="Enter detailed street address (min 10 chars)" required value={formData.address} onChange={handleChange} className={`border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all ${errors.address ? 'border-danger ring-danger/10' : ''}`}/>
              {errors.address && <span className="text-[10px] text-danger">{errors.address}</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="state" className="text-sm font-semibold text-text-color">State (Max 25 chars) *</label>
                <input type="text" id="state" placeholder="State Name" maxLength={25} required value={formData.state} onChange={handleChange} className={`border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all ${errors.state ? 'border-danger ring-danger/10' : ''}`}/>
                {errors.state && <span className="text-[10px] text-danger">{errors.state}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="location" className="text-sm font-semibold text-text-color">City (Max 25 chars) *</label>
                <input type="text" id="location" placeholder="City Name" maxLength={25} required value={formData.location} onChange={handleChange} className={`border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all ${errors.location ? 'border-danger ring-danger/10' : ''}`}/>
                {errors.location && <span className="text-[10px] text-danger">{errors.location}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="zipCode" className="text-sm font-semibold text-text-color">Zip Code *</label>
                <input type="text" id="zipCode" placeholder="6 Digit Zip" required maxLength={6} value={formData.zipCode} onChange={handleChange} className={`border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all ${errors.zipCode ? 'border-danger ring-danger/10' : ''}`}/>
                {errors.zipCode && <span className="text-[10px] text-danger">{errors.zipCode}</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-semibold text-text-color">Admin Email Address (Max 30 chars) *</label>
              <input type="email" id="email" placeholder="admin@school.com" maxLength={30} required value={formData.email} onChange={handleChange} className={`border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all ${errors.email ? 'border-danger ring-danger/10' : ''}`}/>
              {errors.email && <span className="text-[10px] text-danger">{errors.email}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="phone" className="text-sm font-semibold text-text-color">Mobile Number (10 Digits) *</label>
              <input type="tel" id="phone" placeholder="9876543210" required maxLength={10} value={formData.phone} onChange={handleChange} className={`w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all ${errors.phone ? 'border-danger ring-danger/10' : ''}`}/>
              {errors.phone && <span className="text-[10px] text-danger">{errors.phone}</span>}
            </div>
          </div>

          {/* Subscription & Dates Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="planName" className="text-sm font-semibold text-text-color">Plan Subscription *</label>
              <select
                id="planName"
                required
                value={formData.planName}
                onChange={handleChange}
                className={`border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all bg-white ${errors.planName ? 'border-danger ring-danger/10' : ''}`}
              >
                <option value="" disabled>-- Select Plan Subscription --</option>
                {plans
                  .filter(p => p.isActive !== false || p.name === formData.planName)
                  .map(p => (
                    <option key={p.id || p.name} value={p.name}>
                      {p.name} - ₹{p.price} ({p.billingCycle || 'Monthly'})
                    </option>
                  ))}
              </select>
              {errors.planName && <span className="text-[10px] text-danger">{errors.planName}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="startDate" className="text-sm font-semibold text-text-color">Start Date</label>
              <input
                type="date"
                id="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className={`border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all ${errors.startDate ? 'border-danger ring-danger/10' : ''}`}
              />
              {errors.startDate && <span className="text-[10px] text-danger">{errors.startDate}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="endDate" className="text-sm font-semibold text-text-color">End Date</label>
              <input
                type="date"
                id="endDate"
                disabled
                value={formData.endDate}
                onChange={handleChange}
                className={`border border-border rounded-lg px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all ${errors.endDate ? 'border-danger ring-danger/10' : ''}`}
              />
              {errors.endDate && <span className="text-[10px] text-danger">{errors.endDate}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-semibold text-text-color">
                {school ? 'Change Password (Optional)' : 'Admin Password *'}
              </label>
              <input type="password" id="password" placeholder="Minimum 8 characters" required={!school} value={formData.password} onChange={handleChange} className={`border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all ${errors.password ? 'border-danger ring-danger/10' : ''}`}/>
              {formData.password && (<div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-text-light">Strength: {getPasswordStrength(formData.password).label}</span>
                  </div>
                  <div className="h-1 w-full bg-border rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${getPasswordStrength(formData.password).color}`} style={{ width: getPasswordStrength(formData.password).width }}></div>
                  </div>
                </div>)}
              {errors.password && <span className="text-[10px] text-danger">{errors.password}</span>}
              <p className="text-[10px] text-text-light">Hard password: 8+ chars, Uppercase, Numbers & Symbols.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="status" className="text-sm font-semibold text-text-color">Registration Status *</label>
              <select id="status" required value={formData.status} onChange={handleChange} className="border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all bg-white">
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-text-color">Hostel Module Access</label>
              <div className="flex items-center h-full pt-1">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="hostelEnabled"
                    className="sr-only peer"
                    checked={formData.hostelEnabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, hostelEnabled: e.target.checked }))}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  <span className="ml-3 text-xs font-semibold text-text-light">
                    {formData.hostelEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>
            </div>
          </div>



          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="teachers" className="text-sm font-semibold text-text-color">Number of Teachers *</label>
              <input type="number" id="teachers" placeholder="e.g. 30" required min="0" disabled value={formData.teachers || ''} onChange={handleChange} className={`border border-border rounded-lg px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all ${errors.teachers ? 'border-danger ring-danger/10' : ''}`}/>
              {errors.teachers && <span className="text-[10px] text-danger">{errors.teachers}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="students" className="text-sm font-semibold text-text-color">Number of Students *</label>
              <input type="number" id="students" placeholder="e.g. 500" required min="0" disabled value={formData.students || ''} onChange={handleChange} className={`border border-border rounded-lg px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all ${errors.students ? 'border-danger ring-danger/10' : ''}`}/>
              {errors.students && <span className="text-[10px] text-danger">{errors.students}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="amount" className="text-sm font-semibold text-text-color">Registration Amount (₹) *</label>
              <input type="number" id="amount" placeholder="10000" required min="0" step="100" disabled value={formData.amount || ''} onChange={handleChange} className={`border border-border rounded-lg px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all ${errors.amount ? 'border-danger ring-danger/10' : ''}`}/>
              {errors.amount && <span className="text-[10px] text-danger">{errors.amount}</span>}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
            <button type="submit" className="bg-gradient-to-r from-success to-[#059669] text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-success/30 hover:-translate-y-0.5 transition-all active:scale-95">
              <Check size={18}/>
              Save School
            </button>
            <button type="button" onClick={onCancel} className="bg-medium-gray text-text-color px-8 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-border transition-all active:scale-95">
              <X size={18}/>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>);
};
