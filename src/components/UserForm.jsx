import React, { useState, useEffect, useRef } from 'react';
import { User as UserIcon, Camera, BookOpen, GraduationCap, Users, Shield, Briefcase, Search, X } from 'lucide-react';
import { toast } from 'sonner';
const STATES_CITIES = {
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar', 'Bhilwara'],
    'Delhi': ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Central Delhi', 'Delhi'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Aurangabad', 'Solapur'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Meerut', 'Noida', 'Ghaziabad', 'Allahabad'],
    'Karnataka': ['Bangalore', 'Hubli', 'Mysore', 'Gulbarga', 'Belgaum', 'Mangalore'],
    'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Tiruchirappalli'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar'],
    'Haryana': ['Gurgaon', 'Faridabad', 'Panipat', 'Ambala', 'Hisar', 'Rohtak'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga'],
    'West Bengal': ['Kolkata', 'Asansol', 'Siliguri', 'Durgapur', 'Howrah'],
    'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam'],
};
export const UserForm = ({ user, role: loggedInRole, schools = [], onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'Teacher',
        schoolId: '',
        gender: 'Male',
        city: '',
        state: '',
        otp: '',
        status: 'Active',
        fatherName: '',
        motherName: '',
        education: '',
        subject: '',
        class: '',
        section: '',
        rollNumber: '',
        department: '',
        photo: '',
    });
    const [isOtpGenerated, setIsOtpGenerated] = useState(false);
    const [errors, setErrors] = useState({});

    const fileInputRef = useRef(null);

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, photo: reader.result }));
                toast.success('Profile photo uploaded successfully!');
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerPhotoUpload = () => {
        fileInputRef.current?.click();
    };

    const removePhoto = () => {
        setFormData(prev => ({ ...prev, photo: '' }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        toast.info('Profile photo removed');
    };

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                role: user.role || 'Teacher',
                schoolId: user.schoolId || '',
                gender: user.gender || 'Male',
                city: user.city || '',
                state: user.state || '',
                otp: user.otp || '',
                status: user.status || 'Active',
                fatherName: user.fatherName || '',
                motherName: user.motherName || '',
                education: user.education || '',
                subject: user.subject || '',
                class: user.class || '',
                section: user.section || '',
                rollNumber: user.rollNumber || '',
                department: user.department || '',
                photo: user.photo || '',
            });
            if (user.otp)
                setIsOtpGenerated(true);
        }
    }, [user]);
    const validate = () => {
        const newErrors = {};
        const nameVal = formData.name?.trim();
        const fatherVal = formData.fatherName?.trim();
        const motherVal = formData.motherName?.trim();
        const nameRegex = /^[a-zA-Z0-9\s-]+$/;

        if (!nameVal) {
            newErrors.name = 'Full name is required';
        } else if (nameVal.length < 3 || nameVal.length > 50) {
            newErrors.name = 'Full name must be between 3 and 50 characters';
        } else if (!nameRegex.test(nameVal)) {
            newErrors.name = 'Full name can only contain letters, numbers, spaces, and hyphens';
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9._%+-]+\.[a-zA-Z]{2,}$/;
        if (!formData.email?.trim()) {
            newErrors.email = 'Email is required';
        }
        else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Enter a valid email';
        }
        if (!formData.phone?.trim()) {
            newErrors.phone = 'Phone is required';
        }
        else if (formData.phone.length !== 10) {
            newErrors.phone = 'Must be 10 digits';
        }
        if (!formData.state)
            newErrors.state = 'State is required';
        if (!formData.city)
            newErrors.city = 'City is required';
        if (formData.role !== 'Admin' && !formData.schoolId)
            newErrors.schoolId = 'School selection is required';

        if (formData.role === 'Student') {
            if (!fatherVal) {
                newErrors.fatherName = "Father's name is required";
            } else if (fatherVal.length < 3 || fatherVal.length > 50) {
                newErrors.fatherName = "Father's name must be between 3 and 50 characters";
            } else if (!nameRegex.test(fatherVal)) {
                newErrors.fatherName = "Father's name can only contain letters, spaces, and hyphens";
            }

            if (!motherVal) {
                newErrors.motherName = "Mother's name is required";
            } else if (motherVal.length < 3 || motherVal.length > 50) {
                newErrors.motherName = "Mother's name must be between 3 and 50 characters";
            } else if (!nameRegex.test(motherVal)) {
                newErrors.motherName = "Mother's name can only contain letters, spaces, and hyphens";
            }
        }

        if (formData.role === 'Teacher') {
            if (!formData.education)
                newErrors.education = 'Education qualification is required';
            if (!formData.class)
                newErrors.class = 'Class assignment is required';
            if (!formData.subject)
                newErrors.subject = 'Subject is required';
        }
        else if (formData.role === 'Student') {
            if (!formData.class)
                newErrors.class = 'Class is required';
            if (!formData.section)
                newErrors.section = 'Section is required';
            if (!formData.rollNumber)
                newErrors.rollNumber = 'Roll number is required';
        }
        else if (formData.role === 'Admin') {
            if (!formData.department)
                newErrors.department = 'Department is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleGenerateOtp = () => {
        if (formData.phone.length === 10) {
            const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
            setFormData(prev => ({ ...prev, otp: randomOtp }));
            setIsOtpGenerated(true);
        }
        else {
            setErrors(prev => ({ ...prev, phone: 'Enter 10 digits first' }));
        }
    };
    const handleChange = (e) => {
        const { id, value } = e.target;
        if (id === 'state') {
            setFormData(prev => ({ ...prev, state: value, city: '' }));
        }
        else if (id === 'phone') {
            const sanitized = value.replace(/\D/g, '').slice(0, 10);
            setFormData(prev => ({ ...prev, [id]: sanitized }));
            if (sanitized.length < 10)
                setIsOtpGenerated(false);
        }
        else {
            setFormData(prev => ({ ...prev, [id]: value }));
        }
        if (errors[id]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        }
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSave({
                ...formData,
                id: user?.id,
                lastActive: user?.lastActive || 'Never',
                createdOn: user?.createdOn || new Date().toISOString().split('T')[0]
            });
        }
    };
    return (<div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1e293b] flex items-center gap-3">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner shrink-0">
              <UserIcon size={24} className="md:size-8"/>
            </div>
            <span>{user ? 'Update Profile' : 'Register New User'}</span>
          </h2>
          <p className="text-sm text-text-light max-w-xl">Provide accurate information to manage platform access and institutional records effectively.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl shadow-black/5 border border-border overflow-hidden">
        <form onSubmit={handleSubmit} noValidate className="divide-y divide-border">
          {/* Header Photo Upload */}
          <div className="bg-gray-50/50 p-5 md:p-8 flex flex-col sm:flex-row items-center gap-6 md:gap-8 border-b border-border">
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              onChange={handlePhotoChange} 
              className="hidden" 
            />
            <div className="relative group shrink-0">
              <div 
                onClick={triggerPhotoUpload}
                className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-white border-4 border-white shadow-xl flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-95 transition-opacity"
              >
                {formData.photo ? (
                  <img src={formData.photo} alt="Profile Preview" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={48} className="text-gray-200 md:size-16" />
                )}
              </div>
              <button 
                type="button" 
                onClick={triggerPhotoUpload}
                className="absolute bottom-1 right-1 bg-primary text-white p-2.5 rounded-xl shadow-lg hover:scale-110 transition-transform active:scale-95"
                title="Upload Photo"
              >
                <Camera size={16} />
              </button>
              {formData.photo && (
                <button 
                  type="button" 
                  onClick={removePhoto}
                  className="absolute -top-1 -right-1 bg-danger text-white p-1 rounded-full shadow-md hover:scale-110 transition-transform active:scale-95"
                  title="Remove Photo"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <p className="text-xs md:text-sm font-black text-text-color uppercase tracking-[0.2em]">Institutional Profile Photo</p>
              <p className="text-xs text-text-light leading-relaxed">High-resolution headshot required.<br className="hidden md:block"/> JPG, PNG or GIF. Max size 5MB.</p>
            </div>
          </div>

          <div className="p-5 md:p-8 lg:p-10 space-y-8 md:space-y-10">
            {/* Core Details Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b-2 border-primary/10 w-fit">
                <Shield size={18} className="text-primary"/>
                <h3 className="text-xs md:text-sm font-black text-text-color uppercase tracking-[0.3em]">Identity & Security</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-[10px] md:text-[11px] font-black text-text-light uppercase tracking-[0.2em]">Full Legal Name *</label>
                  <input type="text" id="name" placeholder="e.g. Rahul Sharma" value={formData.name} onChange={handleChange} className={`w-full px-4 py-3 md:py-3.5 bg-gray-50/50 border rounded-2xl text-sm focus:outline-none transition-all ${errors.name ? 'border-danger ring-4 ring-danger/10' : 'border-border focus:border-primary focus:ring-4 focus:ring-primary/10'}`}/>
                  {errors.name && <span className="text-[10px] font-bold text-danger uppercase tracking-tight">{errors.name}</span>}
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-[10px] md:text-[11px] font-black text-text-light uppercase tracking-[0.2em]">Institutional Email *</label>
                  <input type="email" id="email" placeholder="rahul.sharma@eduadmin.com" value={formData.email} onChange={handleChange} className={`w-full px-4 py-3 md:py-3.5 bg-gray-50/50 border rounded-2xl text-sm focus:outline-none transition-all ${errors.email ? 'border-danger ring-4 ring-danger/10' : 'border-border focus:border-primary focus:ring-4 focus:ring-primary/10'}`}/>
                  {errors.email && <span className="text-[10px] font-bold text-danger uppercase tracking-tight">{errors.email}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="phone" className="text-[10px] md:text-[11px] font-black text-text-light uppercase tracking-[0.2em]">Mobile Connection *</label>
                  <input type="tel" id="phone" placeholder="9988776655" maxLength={10} value={formData.phone} onChange={handleChange} className={`w-full px-4 py-3 md:py-3.5 bg-gray-50/50 border rounded-2xl text-sm focus:outline-none transition-all ${errors.phone ? 'border-danger ring-4 ring-danger/10' : 'border-border focus:border-primary focus:ring-4 focus:ring-primary/10'}`}/>
                  {errors.phone && <span className="text-[10px] font-bold text-danger uppercase tracking-tight">{errors.phone}</span>}
                </div>

                 <div className="flex flex-col gap-2">
                  <label htmlFor="role" className="text-[10px] md:text-[11px] font-black text-text-light uppercase tracking-[0.2em]">Institutional Role *</label>
                  <select 
                    id="role" 
                    value={formData.role} 
                    onChange={handleChange} 
                    disabled={loggedInRole === 'school_admin'} 
                    className={`w-full px-4 py-3 md:py-3.5 bg-gray-50/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all appearance-none font-bold ${loggedInRole === 'school_admin' ? 'cursor-not-allowed opacity-75 bg-gray-100' : 'cursor-pointer'}`}
                  >
                    <option value="Admin">System Administrator</option>
                    <option value="School Admin">School Admin</option>
                    <option value="Teacher">Academic Faculty</option>
                    <option value="Student">Enrolled Student</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="status" className="text-[10px] md:text-[11px] font-black text-text-light uppercase tracking-[0.2em]">Access Lifecycle *</label>
                  <select id="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-3 md:py-3.5 bg-gray-50/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer font-bold">
                    <option value="Active">Authorized / Active</option>
                    <option value="Inactive">Restricted / Inactive</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="gender" className="text-[10px] md:text-[11px] font-black text-text-light uppercase tracking-[0.2em]">Gender *</label>
                  <select id="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-3 md:py-3.5 bg-gray-50/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer font-bold">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {formData.role !== 'Admin' && (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="schoolId" className="text-[10px] md:text-[11px] font-black text-text-light uppercase tracking-[0.2em]">Assigned School *</label>
                    <select 
                      id="schoolId" 
                      value={formData.schoolId} 
                      onChange={handleChange} 
                      className={`w-full px-4 py-3 md:py-3.5 bg-gray-50/50 border rounded-2xl text-sm focus:outline-none transition-all appearance-none cursor-pointer font-bold ${errors.schoolId ? 'border-danger ring-4 ring-danger/10' : 'border-border focus:border-primary focus:ring-4 focus:ring-primary/10'}`}
                    >
                      <option value="">Select School</option>
                      {schools.map(s => (
                        <option key={s.schoolId || s.id} value={s.schoolId || s.id}>{s.name}</option>
                      ))}
                    </select>
                    {errors.schoolId && <span className="text-[10px] font-bold text-danger uppercase tracking-tight">{errors.schoolId}</span>}
                  </div>
                )}
              </div>
            </section>

            {/* Parent Information Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b-2 border-primary/10 w-fit">
                <Users size={18} className="text-primary"/>
                <h3 className="text-xs md:text-sm font-black text-text-color uppercase tracking-[0.3em]">Guardian Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="fatherName" className="text-[10px] md:text-[11px] font-black text-text-light uppercase tracking-[0.2em]">Father's Full Name *</label>
                  <input type="text" id="fatherName" placeholder="Enter father's name" value={formData.fatherName} onChange={handleChange} className={`w-full px-4 py-3 md:py-3.5 bg-gray-50/50 border rounded-2xl text-sm focus:outline-none transition-all ${errors.fatherName ? 'border-danger ring-4 ring-danger/10' : 'border-border focus:border-primary focus:ring-4 focus:ring-primary/10'}`}/>
                  {errors.fatherName && <span className="text-[10px] font-bold text-danger uppercase tracking-tight">{errors.fatherName}</span>}
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="motherName" className="text-[10px] md:text-[11px] font-black text-text-light uppercase tracking-[0.2em]">Mother's Full Name *</label>
                  <input type="text" id="motherName" placeholder="Enter mother's name" value={formData.motherName} onChange={handleChange} className={`w-full px-4 py-3 md:py-3.5 bg-gray-50/50 border rounded-2xl text-sm focus:outline-none transition-all ${errors.motherName ? 'border-danger ring-4 ring-danger/10' : 'border-border focus:border-primary focus:ring-4 focus:ring-primary/10'}`}/>
                  {errors.motherName && <span className="text-[10px] font-bold text-danger uppercase tracking-tight">{errors.motherName}</span>}
                </div>
              </div>
            </section>

            {/* Conditional Role-Specific Section */}
            <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              {formData.role === 'Teacher' && (<div className="space-y-6">
                  <div className="flex items-center gap-3 pb-2 border-b-2 border-primary/10 w-fit">
                    <GraduationCap size={18} className="text-primary"/>
                    <h3 className="text-xs md:text-sm font-black text-text-color uppercase tracking-[0.3em]">Academic Authority</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="education" className="text-[10px] md:text-[11px] font-black text-text-light uppercase tracking-[0.2em]">Professional Credentials *</label>
                      <input type="text" id="education" placeholder="e.g. M.Sc, B.Ed" value={formData.education} onChange={handleChange} className={`w-full px-4 py-3 md:py-3.5 bg-gray-50/50 border rounded-2xl text-sm focus:outline-none transition-all ${errors.education ? 'border-danger ring-4 ring-danger/10' : 'border-border focus:border-primary focus:ring-4 focus:ring-primary/10'}`}/>
                      {errors.education && <span className="text-[10px] font-bold text-danger uppercase tracking-tight">{errors.education}</span>}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="class" className="text-[10px] md:text-[11px] font-black text-text-light uppercase tracking-[0.2em]">Class Assignment *</label>
                      <input type="text" id="class" placeholder="e.g. 10th A" value={formData.class} onChange={handleChange} className={`w-full px-4 py-3 md:py-3.5 bg-gray-50/50 border rounded-2xl text-sm focus:outline-none transition-all ${errors.class ? 'border-danger ring-4 ring-danger/10' : 'border-border focus:border-primary focus:ring-4 focus:ring-primary/10'}`}/>
                      {errors.class && <span className="text-[10px] font-bold text-danger uppercase tracking-tight">{errors.class}</span>}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="subject" className="text-[10px] md:text-[11px] font-black text-text-light uppercase tracking-[0.2em]">Core Subject *</label>
                      <input type="text" id="subject" placeholder="e.g. Mathematics" value={formData.subject} onChange={handleChange} className={`w-full px-4 py-3 md:py-3.5 bg-gray-50/50 border rounded-2xl text-sm focus:outline-none transition-all ${errors.subject ? 'border-danger ring-4 ring-danger/10' : 'border-border focus:border-primary focus:ring-4 focus:ring-primary/10'}`}/>
                      {errors.subject && <span className="text-[10px] font-bold text-danger uppercase tracking-tight">{errors.subject}</span>}
                    </div>
                  </div>
                </div>)}

              {formData.role === 'Student' && (<div className="space-y-6">
                  <div className="flex items-center gap-3 pb-2 border-b-2 border-primary/10 w-fit">
                    <BookOpen size={18} className="text-primary"/>
                    <h3 className="text-xs md:text-sm font-black text-text-color uppercase tracking-[0.3em]">Academic Placement</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="class" className="text-[10px] md:text-[11px] font-black text-text-light uppercase tracking-[0.2em]">Institutional Grade *</label>
                      <input type="text" id="class" placeholder="e.g. Senior Year" value={formData.class} onChange={handleChange} className={`w-full px-4 py-3 md:py-3.5 bg-gray-50/50 border rounded-2xl text-sm focus:outline-none transition-all ${errors.class ? 'border-danger ring-4 ring-danger/10' : 'border-border focus:border-primary focus:ring-4 focus:ring-primary/10'}`}/>
                      {errors.class && <span className="text-[10px] font-bold text-danger uppercase tracking-tight">{errors.class}</span>}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="section" className="text-[10px] md:text-[11px] font-black text-text-light uppercase tracking-[0.2em]">Assigned Section *</label>
                      <input type="text" id="section" placeholder="e.g. Alpha-7" value={formData.section} onChange={handleChange} className={`w-full px-4 py-3 md:py-3.5 bg-gray-50/50 border rounded-2xl text-sm focus:outline-none transition-all ${errors.section ? 'border-danger ring-4 ring-danger/10' : 'border-border focus:border-primary focus:ring-4 focus:ring-primary/10'}`}/>
                      {errors.section && <span className="text-[10px] font-bold text-danger uppercase tracking-tight">{errors.section}</span>}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="rollNumber" className="text-[10px] md:text-[11px] font-black text-text-light uppercase tracking-[0.2em]">Roll Index *</label>
                      <input type="text" id="rollNumber" placeholder="e.g. SM-2024-042" value={formData.rollNumber} onChange={handleChange} className={`w-full px-4 py-3 md:py-3.5 bg-gray-50/50 border rounded-2xl text-sm focus:outline-none transition-all ${errors.rollNumber ? 'border-danger ring-4 ring-danger/10' : 'border-border focus:border-primary focus:ring-4 focus:ring-primary/10'}`}/>
                      {errors.rollNumber && <span className="text-[10px] font-bold text-danger uppercase tracking-tight">{errors.rollNumber}</span>}
                    </div>
                  </div>
                </div>)}

              {formData.role === 'Admin' && (<div className="space-y-6">
                  <div className="flex items-center gap-3 pb-2 border-b-2 border-primary/10 w-fit">
                    <Briefcase size={18} className="text-primary"/>
                    <h3 className="text-xs md:text-sm font-black text-text-color uppercase tracking-[0.3em]">Operational Oversight</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="department" className="text-[10px] md:text-[11px] font-black text-text-light uppercase tracking-[0.2em]">Management Department *</label>
                      <input type="text" id="department" placeholder="e.g. Infrastructure, Human Assets" value={formData.department} onChange={handleChange} className={`w-full px-4 py-3 md:py-3.5 bg-gray-50/50 border rounded-2xl text-sm focus:outline-none transition-all ${errors.department ? 'border-danger ring-4 ring-danger/10' : 'border-border focus:border-primary focus:ring-4 focus:ring-primary/10'}`}/>
                      {errors.department && <span className="text-[10px] font-bold text-danger uppercase tracking-tight">{errors.department}</span>}
                    </div>
                  </div>
                </div>)}
            </section>

            {/* Address and Security Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b-2 border-primary/10 w-fit">
                <Search size={18} className="text-primary"/>
                <h3 className="text-xs md:text-sm font-black text-text-color uppercase tracking-[0.3em]">Localization & Secure Sync</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="state" className="text-[10px] md:text-[11px] font-black text-text-light uppercase tracking-[0.2em]">Regional State *</label>
                  <select id="state" value={formData.state} onChange={handleChange} className={`w-full px-4 py-3 md:py-3.5 bg-gray-50/50 border rounded-2xl text-sm focus:outline-none transition-all appearance-none cursor-pointer font-bold ${errors.state ? 'border-danger ring-4 ring-danger/10' : 'border-border focus:border-primary focus:ring-4 focus:ring-primary/10'}`}>
                    <option value="">Choose State</option>
                    {Object.keys(STATES_CITIES).map(state => (<option key={state} value={state}>{state}</option>))}
                  </select>
                  {errors.state && <span className="text-[10px] font-bold text-danger uppercase tracking-tight">{errors.state}</span>}
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="city" className="text-[10px] md:text-[11px] font-black text-text-light uppercase tracking-[0.2em]">Regional City *</label>
                  <select id="city" value={formData.city} onChange={handleChange} disabled={!formData.state} className={`w-full px-4 py-3 md:py-3.5 bg-gray-50/50 border rounded-2xl text-sm focus:outline-none transition-all appearance-none cursor-pointer font-bold ${!formData.state ? 'opacity-50 cursor-not-allowed' : ''} ${errors.city ? 'border-danger ring-4 ring-danger/10' : 'border-border focus:border-primary focus:ring-4 focus:ring-primary/10'}`}>
                    <option value="">Choose City</option>
                    {formData.state && (STATES_CITIES[formData.state] || []).map(city => (<option key={city} value={city}>{city}</option>))}
                    {formData.city && formData.state && !(STATES_CITIES[formData.state] || []).includes(formData.city) && (
                      <option key={formData.city} value={formData.city}>{formData.city}</option>
                    )}
                  </select>
                  {errors.city && <span className="text-[10px] font-bold text-danger uppercase tracking-tight">{errors.city}</span>}
                </div>
              </div>
            </section>
          </div>

          {/* Action Buttons */}
          <div className="px-6 md:px-10 py-6 md:py-8 bg-gray-50/30 flex flex-col sm:flex-row items-center justify-end gap-4 md:gap-6">
            <button type="button" onClick={onCancel} className="w-full sm:w-auto order-2 sm:order-1 px-8 py-3 text-xs md:text-sm font-black text-text-light hover:text-text-color transition-all uppercase tracking-[0.2em] hover:bg-gray-100 rounded-xl">Discard Record</button>
            <button type="submit" className="w-full sm:w-auto order-1 sm:order-2 bg-primary hover:bg-primary-dark text-white font-black py-3 md:py-3.5 px-10 md:px-14 rounded-xl text-xs md:text-sm transition-all shadow-lg shadow-primary/20 active:scale-95 uppercase tracking-[0.2em]">
              {user ? 'Authorize Updates' : 'Confirm Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>);
};
