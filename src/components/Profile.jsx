import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Camera, Save, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
export const Profile = ({ role, activeSchool }) => {
    const isSchoolAdmin = role === 'school_admin';
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState({
        name: isSchoolAdmin ? 'School Admin' : 'Admin Name',
        email: isSchoolAdmin 
            ? `admin@${activeSchool?.name?.toLowerCase().replace(/\s+/g, '') || 'school'}.edu` 
            : 'admin@eduadmin.com',
        phone: '+91 9876543210',
        role: isSchoolAdmin ? 'School Admin' : 'Super Admin',
        location: activeSchool ? `${activeSchool.location}, ${activeSchool.state}` : 'Mumbai, India',
        about: isSchoolAdmin 
            ? `Administrator responsible for managing educational activities, teacher scheduling, student tracking, and operations at ${activeSchool?.name || 'the school'}.`
            : 'System Administrator with over 10 years of experience managing educational platforms and driving digital transformation in schools.'
    });
    const handleSave = () => {
        setIsEditing(false);
        toast.success('Profile updated successfully!');
    };
    return (<div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-text-color tracking-tight">My Profile</h1>
          <p className="text-sm font-medium text-text-light mt-1">Manage your personal information and preferences.</p>
        </div>
        <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${isEditing
            ? 'bg-primary text-white hover:bg-primary/90'
            : 'bg-white border border-border text-text-color hover:bg-gray-50'}`}>
          {isEditing ? (<><Save size={16}/> Save Changes</>) : (<><User size={16}/> Edit Profile</>)}
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/80 to-primary relative">
          <div className="absolute -bottom-12 left-8">
            <div className="relative group">
              <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg">
                <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center border border-border overflow-hidden">
                  <User size={40} className="text-gray-400"/>
                </div>
              </div>
              {isEditing && (<button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md border border-border flex items-center justify-center text-text-color hover:text-primary transition-colors">
                  <Camera size={14}/>
                </button>)}
            </div>
          </div>
        </div>

        <div className="pt-16 pb-8 px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-text-light uppercase tracking-widest mb-2">Full Name</label>
                {isEditing ? (<input type="text" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"/>) : (<div className="flex items-center gap-3 text-text-color font-bold">
                    <User size={18} className="text-text-light"/>
                    {profile.name}
                  </div>)}
              </div>

              <div>
                <label className="block text-xs font-bold text-text-light uppercase tracking-widest mb-2">Email Address</label>
                {isEditing ? (<input type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"/>) : (<div className="flex items-center gap-3 text-text-color font-bold">
                    <Mail size={18} className="text-text-light"/>
                    {profile.email}
                  </div>)}
              </div>

              <div>
                <label className="block text-xs font-bold text-text-light uppercase tracking-widest mb-2">Phone Number</label>
                {isEditing ? (<input type="text" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"/>) : (<div className="flex items-center gap-3 text-text-color font-bold">
                    <Phone size={18} className="text-text-light"/>
                    {profile.phone}
                  </div>)}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-text-light uppercase tracking-widest mb-2">Role</label>
                <div className="flex items-center gap-3 text-text-color font-bold bg-primary/5 text-primary w-fit px-3 py-1.5 rounded-lg border border-primary/20">
                  <Shield size={16}/>
                  {profile.role}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-light uppercase tracking-widest mb-2">Location</label>
                {isEditing ? (<input type="text" value={profile.location} onChange={e => setProfile({ ...profile, location: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"/>) : (<div className="flex items-center gap-3 text-text-color font-bold">
                    <MapPin size={18} className="text-text-light"/>
                    {profile.location}
                  </div>)}
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-text-light uppercase tracking-widest mb-2">About</label>
              {isEditing ? (<textarea value={profile.about} onChange={e => setProfile({ ...profile, about: e.target.value })} rows={4} className="w-full px-4 py-3 bg-gray-50 border border-border rounded-xl text-sm font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none"/>) : (<p className="text-sm font-medium text-text-color/80 leading-relaxed max-w-3xl">
                  {profile.about}
                </p>)}
            </div>
          </div>
        </div>
      </motion.div>
    </div>);
};
