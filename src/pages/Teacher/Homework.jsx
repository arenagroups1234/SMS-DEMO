import { useState, useEffect } from "react";
import { BookOpen, Calendar, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { homeworkApi, usersApi, subjectsApi, noticesApi } from "../../services/api";
import { useParams } from "react-router-dom";

export default function TPortalHomework() {
  const { teacherId } = useParams();
  const [homeworks, setHomeworks] = useState([]);
  const [formSubject, setFormSubject] = useState("");
  const [formClass, setFormClass] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formContent, setFormContent] = useState("");

  const [teacherClasses, setTeacherClasses] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);

  const loadHomeworks = async () => {
    try {
      const storedUser = (() => { try { return JSON.parse(localStorage.getItem("sms_user") || "{}"); } catch { return {}; } })();
      const schoolId = storedUser.schoolId || "";
      const myTeacherId = teacherId || storedUser.id || "";
      const myRole = storedUser.role || "";

      let myClasses = [];
      try {
        const tRes = await usersApi.getById(myTeacherId);
        const tData = tRes.data || {};
        if (Array.isArray(tData.classes)) myClasses = tData.classes;
        else if (typeof tData.classes === "string") myClasses = tData.classes.split(",").map(c => c.trim()).filter(Boolean);
        else if (tData.class) myClasses = [tData.class];
      } catch (e) {}

      try {
        const { classesApi } = await import("../../services/api");
        const cRes = await classesApi.getAll({ schoolId, limit: 100 });
        const allClasses = cRes.data || [];
        allClasses.forEach(c => {
          if (c.teacherId === myTeacherId && c.name) {
            if (!myClasses.includes(c.name)) myClasses.push(c.name);
          }
        });
      } catch (e) {}

      const res = await homeworkApi.getAll({ schoolId, limit: 100 });
      const backendHomeworks = res.data || [];

      let filtered = backendHomeworks.filter(h => {
        const creatorId = h.teacherId || h.createdBy;
        return Boolean(creatorId && String(creatorId) === String(myTeacherId));
      });
      if (filtered.length === 0) {
        filtered = backendHomeworks;
      }

      const mapped = filtered.map(h => ({
        ...h,
        className: h.class || h.className
      }));
      setHomeworks(mapped);
    } catch (err) {
      toast.error("Failed to load homework task logs");
    }
  };

  useEffect(() => {
    loadHomeworks();
  }, []);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const storedUser = (() => { try { return JSON.parse(localStorage.getItem("sms_user") || "{}"); } catch { return {}; } })();
        
        let teacher = {};
        try {
          const tRes = await usersApi.getById(teacherId);
          if (tRes.data) {
            teacher = tRes.data;
          }
        } catch (tErr) {
          console.warn("Could not load teacher profile from DB:", tErr);
          teacher = storedUser;
        }

        const schoolId = teacher.schoolId || "";

        let classesList = [];
        if (Array.isArray(teacher.classes) && teacher.classes.length > 0) {
          classesList = teacher.classes;
        } else if (typeof teacher.classes === "string" && teacher.classes) {
          classesList = teacher.classes.split(",").map(c => c.trim()).filter(Boolean);
        } else if (typeof teacher.className === "string" && teacher.className) {
          classesList = teacher.className.split(",").map(c => c.trim()).filter(Boolean);
        } else if (teacher.class) {
          classesList = [teacher.class];
        }
        if (!classesList || classesList.length === 0) {
          classesList = ["9th A", "9th B", "10th A", "10th B", "11th Science"];
        }
        setTeacherClasses(classesList);

        const subRes = await subjectsApi.getAll({ schoolId, limit: 1000 });
        setAllSubjects(subRes.data || []);
      } catch (err) {
        console.warn("Failed to load metadata", err);
      }
    };
    loadMetadata();
  }, [teacherId]);

  useEffect(() => {
    if (!formClass) {
      setFilteredSubjects([]);
      setFormSubject("");
      return;
    }
    const filtered = allSubjects.filter(sub => {
      const subClass = sub.className || sub.class || "";
      const targetClass = formClass.trim().toLowerCase();
      if (!subClass || !targetClass) return false;

      const assignedClasses = subClass.split(",").map(c => c.trim().toLowerCase());
      return assignedClasses.includes(targetClass) || 
             assignedClasses.some(ac => ac.includes(targetClass) || targetClass.includes(ac));
    });
    setFilteredSubjects(filtered);
    
    if (filtered.length > 0) {
      const exists = filtered.find(s => s.name === formSubject);
      if (!exists) {
        setFormSubject(filtered[0].name);
      }
    } else {
      setFormSubject("");
    }
  }, [formClass, allSubjects]);

  const handlePostHomework = async (e) => {
    e.preventDefault();
    if (!formContent.trim()) {
      toast.error("Homework description is required!");
      return;
    }

    const storedUser = (() => { try { return JSON.parse(localStorage.getItem("sms_user") || "{}"); } catch { return {}; } })();
    const schoolId = storedUser.schoolId || "";

    try {
      await homeworkApi.create({
        subject: formSubject,
        class: formClass,
        content: formContent.trim(),
        date: formDate,
        teacherId: teacherId || storedUser.id || "",
        createdBy: teacherId || storedUser.id || "",
        schoolId: schoolId
      });
      
      // Create notification notice for parents/students
      try {
        await noticesApi.create({
          title: `New Homework: ${formSubject} (${formClass})`,
          description: `A new homework task has been assigned: "${formContent.trim()}". Please submit by ${formDate}.`,
          category: "All",
          schoolId: schoolId,
          publishDate: new Date().toISOString(),
          status: "published"
        });
      } catch (noticeErr) {
        console.warn("Could not create homework notice notification:", noticeErr);
      }

      setFormContent("");
      toast.success("Homework assignment published successfully!");
      loadHomeworks();
    } catch (err) {
      toast.error("Failed to publish homework: " + (err.message || err));
    }
  };

  const handleDeleteHomework = async (id) => {
    if (!window.confirm("Are you sure you want to delete this homework log?")) return;
    try {
      await homeworkApi.delete(id);
      toast.success("Homework deleted successfully!");
      loadHomeworks();
    } catch (err) {
      toast.error("Failed to delete homework: " + (err.message || err));
    }
  };

  // Calculations for registry filters
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("All");

  const filteredHomeworks = homeworks.filter(h => {
    const matchesSearch = h.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          h.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === "All" || h.className === classFilter;
    return matchesSearch && matchesClass;
  });

  const getDaysRemaining = (dueDateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: "Overdue", color: "bg-red-50 text-red-700 border-red-100" };
    if (diffDays === 0) return { text: "Due Today", color: "bg-amber-50 text-amber-700 border-amber-100" };
    if (diffDays === 1) return { text: "Due Tomorrow", color: "bg-blue-50 text-blue-700 border-blue-100" };
    return { text: `Due in ${diffDays} days`, color: "bg-emerald-50 text-emerald-700 border-emerald-100" };
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header and Quick Stats */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight uppercase">Homework Hub</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Publish and Manage Daily Tasks</p>
        </div>

        {/* Stats Row */}
        <div className="flex gap-4">
          <div className="bg-slate-50 border border-slate-100 px-5 py-3 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <BookOpen size={16} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Tasks</p>
              <p className="text-lg font-black text-slate-800">{homeworks.length}</p>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-100 px-5 py-3 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100">
              <Calendar size={16} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Active Classes</p>
              <p className="text-lg font-black text-slate-800">
                {new Set(homeworks.map(h => h.className)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Create / Publish Homework form - Taller and Wider */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <BookOpen size={18} />
            </div>
            <h3 className="text-base font-black text-slate-850 uppercase tracking-wider">New Assignment</h3>
          </div>
          
          <form onSubmit={handlePostHomework} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Target Class</label>
                <select
                  value={formClass} onChange={e => setFormClass(e.target.value)} required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5] transition-all"
                >
                  <option value="">Choose Class...</option>
                  {teacherClasses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Subject</label>
                <select
                  value={formSubject} onChange={e => setFormSubject(e.target.value)} required
                  disabled={!formClass}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5] transition-all"
                >
                  {!formClass ? (
                    <option value="">Choose Class First...</option>
                  ) : filteredSubjects.length === 0 ? (
                    <option value="">No subjects assigned</option>
                  ) : (
                    <>
                      <option value="">Choose Subject...</option>
                      {filteredSubjects.map(sub => (
                        <option key={sub.id || sub.name} value={sub.name}>{sub.name}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Submission Due Date</label>
              <input
                type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Instructions & Tasks</label>
              <textarea
                rows="6" placeholder="List reading chapters, questions to solve, or assignment links..."
                value={formContent} onChange={e => setFormContent(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5] transition-all placeholder:text-slate-400 resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm uppercase tracking-wider transition-all shadow-xs active:translate-y-[1px]"
            >
              <Save size={16} /> Publish Task
            </button>
          </form>
        </div>

        {/* Right Side: Log Registry */}
        <div className="lg:col-span-6 space-y-6">
          {/* Filters Registry Panel */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="w-full sm:w-2/3">
              <input 
                type="text"
                placeholder="Search history by content or subject..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5] transition-all placeholder:text-slate-400"
              />
            </div>
            
            <div className="w-full sm:w-1/3">
              <select
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-850 focus:bg-white focus:outline-none focus:border-[#4f46e5] transition-all"
              >
                <option value="All">All Classes</option>
                {teacherClasses.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* List of Tasks */}
          <div className="flex flex-col gap-4">
            {filteredHomeworks.map(h => {
              const status = getDaysRemaining(h.date);
              return (
                <div key={h.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs transition-all hover:shadow-sm flex justify-between items-start gap-4 hover:-translate-y-0.5">
                  <div className="flex flex-col gap-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg">
                        {h.subject}
                      </span>
                      <span className="bg-slate-50 text-slate-650 border border-slate-200 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg">
                        Class {h.className}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg border ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                    <p className="text-sm text-slate-850 font-bold leading-relaxed">{h.content}</p>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Calendar size={12} className="text-slate-400" /> Due Date: {h.date}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteHomework(h.id)}
                    className="w-7 h-7 rounded-lg border border-red-100 bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-all shadow-xs shrink-0 cursor-pointer"
                    title="Delete Assignment"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
            {filteredHomeworks.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 font-bold uppercase tracking-wider text-xs shadow-xs">
                No matching homework logs found.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
