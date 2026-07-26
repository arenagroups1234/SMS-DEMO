import React, { useState } from 'react';
import { Bell, Lock, Shield, Eye, Smartphone, Mail, Key } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
export const Settings = () => {
    const [notifications, setNotifications] = useState({
        email: true,
        push: false,
        updates: true,
        marketing: false
    });
    const [security, setSecurity] = useState({
        twoFactor: false,
        loginAlerts: true
    });
    const handleSave = () => {
        toast.success('Settings updated successfully!');
    };
    return (<div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-text-color tracking-tight">Account Settings</h1>
          <p className="text-sm font-medium text-text-light mt-1">Manage your account preferences and security.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Bell size={20}/>
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-color">Notifications</h2>
                <p className="text-xs font-bold text-text-light uppercase tracking-widest">Manage Alerts</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-text-light"/>
                  <div>
                    <p className="font-bold text-sm text-text-color">Email Notifications</p>
                    <p className="text-xs font-medium text-text-light">Receive daily summaries and critical alerts</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={notifications.email} onChange={() => setNotifications({ ...notifications, email: !notifications.email })}/>
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <Smartphone size={18} className="text-text-light"/>
                  <div>
                    <p className="font-bold text-sm text-text-color">Push Notifications</p>
                    <p className="text-xs font-medium text-text-light">Get alerts directly on your device</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={notifications.push} onChange={() => setNotifications({ ...notifications, push: !notifications.push })}/>
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                <Shield size={20}/>
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-color">Security</h2>
                <p className="text-xs font-bold text-text-light uppercase tracking-widest">Protect Your Account</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <Lock size={18} className="text-text-light"/>
                  <div>
                    <p className="font-bold text-sm text-text-color">Two-Factor Authentication</p>
                    <p className="text-xs font-medium text-text-light">Add an extra layer of security</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={security.twoFactor} onChange={() => setSecurity({ ...security, twoFactor: !security.twoFactor })}/>
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <Eye size={18} className="text-text-light"/>
                  <div>
                    <p className="font-bold text-sm text-text-color">Login Alerts</p>
                    <p className="text-xs font-medium text-text-light">Notify me of new sign-ins</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={security.loginAlerts} onChange={() => setSecurity({ ...security, loginAlerts: !security.loginAlerts })}/>
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-border">
               <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm bg-white border border-border text-text-color hover:bg-gray-50">
                  <Key size={16}/> Change Password
               </button>
            </div>
          </motion.div>
        </div>

        <div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gray-50 rounded-2xl border border-border overflow-hidden p-6 sticky top-6">
            <h3 className="font-bold text-text-color mb-2">Need help?</h3>
            <p className="text-sm font-medium text-text-light mb-6">If you're having trouble with your account settings, our support team is here to help.</p>
            <button onClick={handleSave} className="w-full bg-primary text-white px-5 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-primary/90 transition-all active:scale-95">
              Save All Changes
            </button>
          </motion.div>
        </div>
      </div>
    </div>);
};
