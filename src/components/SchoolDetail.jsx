import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, GraduationCap, UserCheck, Layout, Plus, Trash2, UserPlus, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export const SchoolDetail = ({ school, onBack }) => {
    const [hostelEnabled, setHostelEnabled] = useState(() => {
        return localStorage.getItem(`sms_${school.id}_hostel_enabled`) === "true";
    });

    const toggleHostelModule = (val) => {
        localStorage.setItem(`sms_${school.id}_hostel_enabled`, String(val));
        setHostelEnabled(val);
        window.dispatchEvent(new Event("sms_settings_update"));
        toast.success(`Hostel Management Module ${val ? 'enabled' : 'disabled'} for ${school.name}!`);
    };
    const [activeTab, setActiveTab] = useState('overview');
    // Teachers state
    const [teachers, setTeachers] = useState(school.teachersList || [
        { id: 'T1', name: 'Ms. Sharma', subject: 'Mathematics', phone: '9876543210' },
        { id: 'T2', name: 'Mr. Gupta', subject: 'Science', phone: '9876543211' },
        { id: 'T3', name: 'Ms. Priya', subject: 'English', phone: '9876543212' },
    ]);
    // Classes state
    const [classes, setClasses] = useState(school.classes || [
        {
            className: 'Grade 1',
            sections: [
                { sectionName: 'A', studentCount: 30, teacherName: 'Ms. Sharma' },
                { sectionName: 'B', studentCount: 28, teacherName: 'Mr. Gupta' },
            ]
        },
        {
            className: 'Grade 2',
            sections: [
                { sectionName: 'A', studentCount: 32, teacherName: 'Ms. Priya' },
                { sectionName: 'B', studentCount: 30, teacherName: 'Mr. Rahul' },
            ]
        }
    ]);
    // Add Teacher
    const [showAddTeacher, setShowAddTeacher] = useState(false);
    const [newTeacher, setNewTeacher] = useState({ name: '', subject: '', phone: '' });
    const handleAddTeacher = () => {
        if (newTeacher.name && newTeacher.subject) {
            const teacher = {
                id: `T${Date.now()}`,
                ...newTeacher
            };
            setTeachers([...teachers, teacher]);
            setNewTeacher({ name: '', subject: '', phone: '' });
            setShowAddTeacher(false);
        }
    };
    const handleRemoveTeacher = (id) => {
        setTeachers(teachers.filter(t => t.id !== id));
    };
    // Add Class/Section
    const [showAddClass, setShowAddClass] = useState(false);
    const [newClass, setNewClass] = useState({ className: '', sectionName: '', studentCount: 0, teacherName: '' });
    const handleAddClass = () => {
        if (newClass.className && newClass.sectionName) {
            const existingClass = classes.find(c => c.className === newClass.className);
            if (existingClass) {
                setClasses(classes.map(c => c.className === newClass.className
                    ? { ...c, sections: [...c.sections, { sectionName: newClass.sectionName, studentCount: newClass.studentCount, teacherName: newClass.teacherName }] }
                    : c));
            }
            else {
                setClasses([...classes, {
                        className: newClass.className,
                        sections: [{ sectionName: newClass.sectionName, studentCount: newClass.studentCount, teacherName: newClass.teacherName }]
                    }]);
            }
            setShowAddClass(false);
            setNewClass({ className: '', sectionName: '', studentCount: 0, teacherName: '' });
        }
    };
    const handleRemoveSection = (className, sectionName) => {
        setClasses(classes.map(c => {
            if (c.className === className) {
                return { ...c, sections: c.sections.filter(s => s.sectionName !== sectionName) };
            }
            return c;
        }).filter(c => c.sections.length > 0));
    };
    return (<div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-text-light"/>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-color">{school.name}</h1>
            <p className="text-sm text-text-light">{school.location}, {school.state}</p>
          </div>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {['overview', 'classes', 'teachers'].map((tab) => (<button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${activeTab === tab
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-light hover:text-text-color'}`}>
              {tab}
            </button>))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (<motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <GraduationCap size={24}/>
                </div>
                <div>
                  <p className="text-xs text-text-light font-bold uppercase tracking-wider">Students</p>
                  <p className="text-2xl font-black text-text-color">{classes.reduce((acc, c) => acc + c.sections.reduce((sAcc, s) => sAcc + s.studentCount, 0), 0)}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center text-success">
                  <UserCheck size={24}/>
                </div>
                <div>
                  <p className="text-xs text-text-light font-bold uppercase tracking-wider">Teachers</p>
                  <p className="text-2xl font-black text-text-color">{teachers.length}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-accent-blue/10 rounded-xl flex items-center justify-center text-accent-blue">
                  <Layout size={24}/>
                </div>
                <div>
                  <p className="text-xs text-text-light font-bold uppercase tracking-wider">Classes</p>
                  <p className="text-2xl font-black text-text-color">{classes.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
              <h3 className="text-lg font-bold text-text-color mb-4">School Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-text-light uppercase tracking-widest">Address</label>
                    <p className="text-sm text-text-color font-medium">{school.address}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-light uppercase tracking-widest">Email</label>
                    <p className="text-sm text-text-color font-medium">{school.email}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-text-light uppercase tracking-widest">Phone</label>
                    <p className="text-sm text-text-color font-medium">{school.phone}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-light uppercase tracking-widest">Status</label>
                    <div>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${school.status === 'Paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        {school.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SaaS Features Configuration inside School Detail */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
              <h3 className="text-lg font-bold text-text-color mb-2">🧩 SaaS Module Access Control</h3>
              <p className="text-xs text-text-light mb-6">Enable or disable specific product modules licensed for this school client.</p>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                    🏢
                  </div>
                  <div>
                    <p className="font-bold text-sm text-text-color flex items-center gap-2">
                      Hostel Management Module
                      {hostelEnabled && <span className="text-[9px] bg-success/10 text-success px-2 py-0.5 rounded-full font-bold">ACTIVE</span>}
                    </p>
                    <p className="text-xs font-medium text-text-light">Allows school administrators to manage hostel rooms, mess, warden roles, and guest logging.</p>
                  </div>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={hostelEnabled}
                    onChange={(e) => toggleHostelModule(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </motion.div>)}

        {activeTab === 'teachers' && (<motion.div key="teachers" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-text-color flex items-center gap-2">
                <UserCheck className="text-primary"/>
                Manage Teachers
              </h2>
              <button onClick={() => setShowAddTeacher(true)} className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all">
                <UserPlus size={18}/>
                Add Teacher
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teachers.map((teacher) => (<div key={teacher.id} className="bg-white p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all group relative">
                  <button onClick={() => handleRemoveTeacher(teacher.id)} className="absolute top-4 right-4 p-2 text-text-light hover:text-danger opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={18}/>
                  </button>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center text-primary font-bold text-xl">
                      {teacher.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-text-color">{teacher.name}</h4>
                      <p className="text-xs text-text-light">{teacher.subject}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border/50 text-sm text-text-light">
                    <p className="flex justify-between"><span>Phone:</span> <span className="text-text-color font-medium">{teacher.phone}</span></p>
                  </div>
                </div>))}
            </div>
          </motion.div>)}

        {activeTab === 'classes' && (<motion.div key="classes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
             <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-text-color flex items-center gap-2">
                <Layout className="text-primary"/>
                Manage Classes & Sections
              </h2>
              <button onClick={() => setShowAddClass(true)} className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all">
                <Plus size={18}/>
                Add Section
              </button>
            </div>

            <div className="space-y-6">
              {classes.map((cls) => (<div key={cls.className} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                  <div className="bg-gray-50/50 px-6 py-4 border-b border-border flex justify-between items-center">
                    <h3 className="font-black text-text-color">{cls.className}</h3>
                    <span className="text-xs font-bold text-text-light bg-white px-3 py-1 rounded-full border border-border shadow-sm">
                      {cls.sections.length} Sections
                    </span>
                  </div>
                  <div className="p-0">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white">
                          <th className="px-6 py-4 text-left font-bold text-text-light uppercase tracking-widest text-[10px] border-b border-border">Section</th>
                          <th className="px-6 py-4 text-left font-bold text-text-light uppercase tracking-widest text-[10px] border-b border-border">Students</th>
                          <th className="px-6 py-4 text-left font-bold text-text-light uppercase tracking-widest text-[10px] border-b border-border">Teacher</th>
                          <th className="px-6 py-4 text-right font-bold text-text-light uppercase tracking-widest text-[10px] border-b border-border">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cls.sections.map((section, sIdx) => (<tr key={section.sectionName} className={sIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'}>
                            <td className="px-6 py-4 border-b border-border font-bold text-text-color">Section {section.sectionName}</td>
                            <td className="px-6 py-4 border-b border-border text-text-color font-medium">{section.studentCount}</td>
                            <td className="px-6 py-4 border-b border-border text-text-color font-medium">{section.teacherName}</td>
                            <td className="px-6 py-4 border-b border-border text-right">
                              <button onClick={() => handleRemoveSection(cls.className, section.sectionName)} className="text-text-light hover:text-danger p-2 transition-colors">
                                <Trash2 size={16}/>
                              </button>
                            </td>
                          </tr>))}
                      </tbody>
                    </table>
                  </div>
                </div>))}
            </div>
          </motion.div>)}
      </AnimatePresence>

      {/* Modals for Adding */}
      {showAddTeacher && (<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-border">
            <h3 className="text-xl font-bold text-text-color mb-6">Add New Teacher</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-light mb-2">FULL NAME</label>
                <input type="text" value={newTeacher.name} onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })} className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-text-light mb-2">SUBJECT</label>
                <input type="text" value={newTeacher.subject} onChange={e => setNewTeacher({ ...newTeacher, subject: e.target.value })} className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-text-light mb-2">PHONE</label>
                <input type="text" value={newTeacher.phone} onChange={e => setNewTeacher({ ...newTeacher, phone: e.target.value })} className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all"/>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setShowAddTeacher(false)} className="flex-1 px-4 py-3 border border-border rounded-xl font-bold text-text-light hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleAddTeacher} className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20">
                Add Teacher
              </button>
            </div>
          </motion.div>
        </div>)}

      {showAddClass && (<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-border">
            <h3 className="text-xl font-bold text-text-color mb-6">Add New Section</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-light mb-2">CLASS NAME (e.g. Grade 1)</label>
                <input type="text" value={newClass.className} onChange={e => setNewClass({ ...newClass, className: e.target.value })} className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-light mb-2">SECTION (A, B...)</label>
                  <input type="text" value={newClass.sectionName} onChange={e => setNewClass({ ...newClass, sectionName: e.target.value })} className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-light mb-2">STUDENTS</label>
                  <input type="number" value={newClass.studentCount} onChange={e => setNewClass({ ...newClass, studentCount: parseInt(e.target.value) || 0 })} className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-text-light mb-2">CLASS TEACHER</label>
                <input type="text" value={newClass.teacherName} onChange={e => setNewClass({ ...newClass, teacherName: e.target.value })} className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all"/>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setShowAddClass(false)} className="flex-1 px-4 py-3 border border-border rounded-xl font-bold text-text-light hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleAddClass} className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20">
                Add Section
              </button>
            </div>
          </motion.div>
        </div>)}
    </div>);
};
