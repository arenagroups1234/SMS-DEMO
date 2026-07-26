import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { 
  Package, CheckCircle2, AlertTriangle, Trash2, Plus, 
  Search, ShieldAlert, IndianRupee, Clock, ArrowRightLeft, FileText, Send, Edit2, Download 
} from "lucide-react";
import { toast } from "sonner";
import { hostelInventoryApi, hostelDamagesApi, hostelStudentsApi } from "../../services/api";

export default function WardenInventory() {
  const { schoolId } = useParams();

  const [students, setStudents] = useState([]);

  useEffect(() => {
    hostelStudentsApi.getAll({ schoolId }).then(res => {
      if (res && res.data) {
        setStudents(res.data);
      }
    }).catch(() => {});
  }, [schoolId]);

const DEFAULT_CATEGORIES = [
  { id: "inv-1", name: "Ergonomic Wooden Study Tables", category: "Furniture", categoryName: "Furniture", totalStock: 50, utilized: 45, damaged: 2, available: 3, unitPrice: 3500, schoolId: "school-1" },
  { id: "inv-2", name: "High-Back Adjustable Chairs", category: "Furniture", categoryName: "Furniture", totalStock: 60, utilized: 55, damaged: 3, available: 2, unitPrice: 1800, schoolId: "school-1" },
  { id: "inv-3", name: "Heavy Duty Steel Almirahs", category: "Storage", categoryName: "Storage", totalStock: 40, utilized: 38, damaged: 0, available: 2, unitPrice: 7500, schoolId: "school-1" },
  { id: "inv-4", name: "Single Cot Orthopedic Beds", category: "Bedding", categoryName: "Bedding", totalStock: 70, utilized: 65, damaged: 1, available: 4, unitPrice: 5000, schoolId: "school-1" },
  { id: "inv-5", name: "High Speed Ceiling Fans 1200mm", category: "Electricals", categoryName: "Electricals", totalStock: 80, utilized: 76, damaged: 2, available: 2, unitPrice: 2200, schoolId: "school-1" }
];
const DEFAULT_DAMAGES = [
  { id: "dmg-1", studentName: "Aarav Sharma", brokenItemName: "Study Table Leg Scratched", fine: 500, status: "Paid", schoolId: "school-1" },
  { id: "dmg-2", studentName: "Diya Patel", brokenItemName: "Chair Armrest Damaged", fine: 350, status: "Pending", schoolId: "school-1" },
  { id: "dmg-3", studentName: "Rohan Gupta", brokenItemName: "Locker Key Replacement", fine: 200, status: "Paid", schoolId: "school-1" },
  { id: "dmg-4", studentName: "Ishaan Verma", brokenItemName: "Window Glass Crack", fine: 800, status: "Pending", schoolId: "school-1" },
  { id: "dmg-5", studentName: "Ananya Roy", brokenItemName: "Electrical Switch Box Handle", fine: 150, status: "Paid", schoolId: "school-1" }
];

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem(`sms_${schoolId}_hostel_inventory_categories`);
    if (saved && saved !== "[]") {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    hostelInventoryApi.getAll({ schoolId }).then(res => {
      if (res && res.data) {
        setCategories(res.data);
      }
    }).catch(() => {});
  }, [schoolId]);

  useEffect(() => {
    localStorage.setItem(`sms_${schoolId}_hostel_inventory_categories`, JSON.stringify(categories));
  }, [categories, schoolId]);

  const [damages, setDamages] = useState([]);

  // Fetch damages from API on mount
  useEffect(() => {
    hostelDamagesApi.getAll({ schoolId, limit: 500 }).then(res => {
      if (res?.data) setDamages(res.data);
    }).catch(() => {});
  }, [schoolId]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // View state: "list", "add-asset", "report-damage"
  const [currentView, setCurrentView] = useState("list");

  // Edit Category Modal State
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatTotal, setEditCatTotal] = useState("");
  const [editCatUtilized, setEditCatUtilized] = useState("");
  const [editCatDamaged, setEditCatDamaged] = useState("");

  // Edit Damage Modal State
  const [showEditDamageModal, setShowEditDamageModal] = useState(false);
  const [editingDamage, setEditingDamage] = useState(null);
  const [editDmgFine, setEditDmgFine] = useState("");
  const [editDmgStatus, setEditDmgStatus] = useState("Unpaid");

  // Report Damage form state
  const [dmgStudentName, setDmgStudentName] = useState("");
  const [dmgStudentRoll, setDmgStudentRoll] = useState("");
  const [dmgCategory, setDmgCategory] = useState("");
  const [dmgRoom, setDmgRoom] = useState("");
  const [dmgLevel, setDmgLevel] = useState("Minor");
  const [dmgFine, setDmgFine] = useState("500");
  const [dmgDate, setDmgDate] = useState("");

  // Add Asset form state
  const [newAssetName, setNewAssetName] = useState("");
  const [newAssetTotal, setNewAssetTotal] = useState("");

  const handleReportDamage = async (e) => {
    e.preventDefault();
    if (!dmgStudentName.trim() || !dmgRoom.trim()) {
      toast.error("Please select a valid resident student and room number.");
      return;
    }
    if (dmgFine === "" || isNaN(dmgFine) || Number(dmgFine) < 0) {
      toast.error("Please enter a valid fine amount (greater than or equal to 0).");
      return;
    }
    
    // Find parent contact phone for SMS
    const matchingStudent = students.find(s => s.id === dmgStudentRoll || s.name === dmgStudentName);
    const parentPhone = matchingStudent?.parentPhone || "9876543210";
    const parentName = matchingStudent?.parentName || "Vijay Sharma";

    const newD = {
      id: `dmg-${Date.now()}`,
      studentName: dmgStudentName.trim(),
      rollNo: dmgStudentRoll || "STU999",
      category: dmgCategory,
      room: dmgRoom.trim(),
      level: dmgLevel,
      fine: Number(dmgFine),
      date: dmgDate || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: "Unpaid",
      paymentLink: `https://easebuzz.in/payment_id=hostel_${dmgRoom.trim()}_fine`,
      parentPhone: parentPhone,
      parentName: parentName,
      schoolId: schoolId || ""
    };

    try {
      await hostelDamagesApi.create(newD);
    } catch (err) {}

    const updatedDamages = [newD, ...damages];
    setDamages(updatedDamages);
    localStorage.setItem(`sms_${schoolId}_hostel_damages`, JSON.stringify(updatedDamages));

    // Update damaged count in category
    const targetCat = categories.find(cat => cat.name.toLowerCase() === dmgCategory.toLowerCase());
    if (targetCat) {
      const updatedCat = {
        ...targetCat,
        damaged: (targetCat.damaged || 0) + 1,
        available: Math.max(0, (targetCat.available || 0) - 1)
      };
      try {
        await hostelInventoryApi.update(targetCat.id, updatedCat);
      } catch (err) {}
      const updatedCategories = categories.map(cat => cat.id === targetCat.id ? updatedCat : cat);
      setCategories(updatedCategories);
    }

    // Reset
    setDmgStudentName("");
    setDmgStudentRoll("");
    setDmgRoom("");
    setDmgFine("500");
    setCurrentView("list");
    toast.success(`Damage reported and saved successfully for ${dmgStudentName}.`);
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    if (!newAssetName.trim()) {
      toast.error("Furniture Stock Category Name is required!");
      return;
    }
    if (!newAssetTotal || isNaN(newAssetTotal) || Number(newAssetTotal) <= 0) {
      toast.error("Please enter a valid positive stock unit quantity.");
      return;
    }
    if (categories.some(c => c.name.toLowerCase() === newAssetName.trim().toLowerCase())) {
      toast.error(`Stock asset category "${newAssetName.trim()}" already exists!`);
      return;
    }

    const newA = {
      id: String(Date.now()),
      name: newAssetName.trim(),
      total: Number(newAssetTotal),
      utilized: 0,
      damaged: 0,
      available: Number(newAssetTotal),
      schoolId: schoolId || ""
    };

    try {
      await hostelInventoryApi.create(newA);
    } catch (err) {}

    const updatedCategories = [...categories, newA];
    setCategories(updatedCategories);
    localStorage.setItem(`sms_${schoolId}_hostel_inventory_categories`, JSON.stringify(updatedCategories));

    setNewAssetName("");
    setNewAssetTotal("");
    setCurrentView("list");
    toast.success(`Asset stock category "${newAssetName}" added and saved successfully!`);
  };

  const handleIncreaseStock = async (category) => {
    const qtyStr = prompt(`Enter stock quantity to add for "${category.name}":`);
    if (!qtyStr || isNaN(qtyStr) || Number(qtyStr) <= 0) return;
    const qty = Number(qtyStr);
    
    const updated = categories.map(cat => cat.id === category.id ? {
      ...cat,
      total: cat.total + qty,
      available: cat.available + qty
    } : cat);
    
    setCategories(updated);
    localStorage.setItem(`sms_${schoolId}_hostel_inventory_categories`, JSON.stringify(updated));

    const targetCat = updated.find(c => c.id === category.id);
    if (targetCat) {
      try {
        await hostelInventoryApi.update(category.id, targetCat);
      } catch (err) {}
    }
    toast.success(`Added ${qty} units to "${category.name}". New total: ${targetCat ? targetCat.total : category.total + qty}`);
  };

  const handleSendParentAlert = (dmg) => {
    const parentPhone = dmg.parentPhone || "9876543210";
    const parentName = dmg.parentName || "Vijay Sharma";
    toast.success(`Fine SMS Alert & Payment Link sent to parent ${parentName} (${parentPhone}) successfully!`);
    const updated = damages.map(d => d.id === dmg.id ? { ...d, status: "Link Sent" } : d);
    setDamages(updated);
    localStorage.setItem(`sms_${schoolId}_hostel_damages`, JSON.stringify(updated));
  };

  const handleMarkAsPaid = async (id) => {
    const updated = damages.map(d => d.id === id ? { ...d, status: "Paid" } : d);
    setDamages(updated);
    localStorage.setItem(`sms_${schoolId}_hostel_damages`, JSON.stringify(updated));
    const target = updated.find(d => d.id === id);
    if (target) {
      try {
        await hostelDamagesApi.update(id, target);
      } catch (err) {}
    }
    toast.success("Fine marked as Paid successfully!");
  };

  const handleDeleteDamage = async (id) => {
    if (window.confirm("Are you sure you want to delete this damage report?")) {
      setDamages(damages.filter(d => d.id !== id));
      try { await hostelDamagesApi.delete(id); } catch (err) {}
      toast.success("Damage record deleted successfully.");
    }
  };

  const handleEditCategorySubmit = async (e) => {
    e.preventDefault();
    if (!editCatName.trim() || Number(editCatTotal) < 0) return;
    const updated = categories.map(c => c.id === editingCategory.id ? {
      ...c,
      name: editCatName.trim(),
      total: Number(editCatTotal),
      utilized: Number(editCatUtilized),
      damaged: Number(editCatDamaged),
      available: Math.max(0, Number(editCatTotal) - Number(editCatUtilized) - Number(editCatDamaged))
    } : c);
    setCategories(updated);
    try { await hostelInventoryApi.update(editingCategory.id, updated.find(c => c.id === editingCategory.id)); } catch (err) {}
    setShowEditCategoryModal(false);
    setEditingCategory(null);
    toast.success("Category updated.");
  };

  const handleDeleteCategory = async (cat) => {
    if (window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      setCategories(categories.filter(c => c.id !== cat.id));
      try { await hostelInventoryApi.delete(cat.id); } catch (err) {}
      toast.success("Category deleted.");
    }
  };

  const handleExportInventoryCSV = () => {
    if (categories.length === 0 && damages.length === 0) {
      toast.error("No inventory or damage records available to export.");
      return;
    }
    toast.success("Exporting inventory and damage ledger CSV...");
    const catHeaders = ["Category Name,Total Stock,Utilized,Damaged,Available Stock"];
    const catRows = categories.map(c => `"${c.name}","${c.total}","${c.utilized}","${c.damaged}","${c.available}"`);
    const dmgHeaders = ["\nDamage ID,Student Name,Room,Category,Severity,Fine Amount,Status,Date"];
    const dmgRows = damages.map(d => `"${d.id}","${d.studentName}","${d.room}","${d.category}","${d.level}","${d.fine}","${d.status}","${d.date}"`);
    const csvContent = "data:text/csv;charset=utf-8," + [catHeaders, ...catRows, dmgHeaders, ...dmgRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Hostel_Inventory_Damages_Report_${schoolId || 'portal'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadDamageReport = (dmg) => {
    toast.success(`Downloading damage fine receipt / slip for ${dmg.studentName}...`);
    const headers = ["Damage ID,Student Name,Room Number,Category,Severity Level,Assessed Fine,Payment Status,Date Reported"];
    const rows = [`"${dmg.id}","${dmg.studentName}","${dmg.room}","${dmg.category}","${dmg.level}","₹${dmg.fine}","${dmg.status}","${dmg.date}" sheet`];
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Damage_Fine_Slip_${dmg.room}_${dmg.studentName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditDamageSubmit = async (e) => {
    e.preventDefault();
    if (!editDmgFine || Number(editDmgFine) < 0) return;
    const updated = damages.map(d => d.id === editingDamage.id ? {
      ...d,
      fine: Number(editDmgFine),
      status: editDmgStatus
    } : d);
    setDamages(updated);
    setShowEditDamageModal(false);
    setEditingDamage(null);
    toast.success("Damage record updated.");
  };

  const totalAssets = categories.reduce((sum, cat) => sum + (cat.total || 0), 0);
  const totalUtilized = categories.reduce((sum, cat) => sum + (cat.utilized || 0), 0);
  // Count actual damage records (not the per-category damaged field)
  const totalDamaged = damages.filter(d => !d.isDeleted).length;
  const totalAvailable = categories.reduce((sum, cat) => sum + (cat.available || 0), 0);

  if (currentView === "add-asset") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => setCurrentView("list")}
            style={{ padding: "8px 16px", background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            ← Back to Inventory
          </button>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", margin: 0 }}>Add Stock Asset Category</h2>
        </div>

        <div style={{ background: "#fff", padding: 32, borderRadius: 20, border: "1px solid #E2E8F0", maxWidth: 500, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
          <form onSubmit={handleAddAsset}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 28 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Furniture Category Name *</label>
                <input required type="text" placeholder="e.g. Study Table, Wardrobe Locker, Kettle" value={newAssetName} onChange={(e) => setNewAssetName(e.target.value)} style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Stock Unit Quantity *</label>
                <input required type="number" placeholder="e.g. 50" value={newAssetTotal} onChange={(e) => setNewAssetTotal(e.target.value)} style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14 }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button type="button" onClick={() => setCurrentView("list")} style={{ flex: 1, padding: "12px", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 14, cursor: "pointer", background: "none", color: "#64748B", fontWeight: 700 }}>Cancel</button>
              <button type="submit" style={{ flex: 1, padding: "12px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, cursor: "pointer", fontWeight: 700 }}>Add Stock</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (currentView === "report-damage") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setCurrentView("list")} style={{ padding: "8px 16px", background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>← Back to Inventory</button>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", margin: 0 }}>Report Broken Furniture</h2>
        </div>
        <div style={{ background: "#fff", padding: 32, borderRadius: 20, border: "1px solid #E2E8F0", maxWidth: 600, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
          <form onSubmit={handleReportDamage}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 28 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Select Resident Student *</label>
                <select required onChange={(e) => { const sel = students.find(s => s.id === e.target.value); if (sel) { setDmgStudentName(sel.name); setDmgStudentRoll(sel.id); setDmgRoom(sel.roomNumber); } }} style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, background: "#fff" }}>
                  <option value="">-- Choose Student --</option>
                  {students.map(st => <option key={st.id} value={st.id}>{st.name} ({st.id}) - Room {st.roomNumber}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Student Name</label>
                  <input required readOnly value={dmgStudentName} style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, background: "#F1F5F9", color: "#64748B" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Student ID / Roll No</label>
                  <input required readOnly value={dmgStudentRoll} style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, background: "#F1F5F9", color: "#64748B" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Select Broken Item (Category) *</label>
                  <select required value={dmgCategory} onChange={(e) => setDmgCategory(e.target.value)} style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, background: "#fff" }}>
                    <option value="">-- Select Item --</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Room Number</label>
                  <input required readOnly value={dmgRoom} style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, background: "#F1F5F9", color: "#64748B" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Damage severity</label>
                  <select value={dmgLevel} onChange={(e) => { const val = e.target.value; setDmgLevel(val); if(val === "Minor") setDmgFine("500"); else if(val === "Major") setDmgFine("1500"); else setDmgFine("3000"); }} style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, background: "#fff" }}>
                    <option value="Minor">Minor (Scratches/Dents)</option>
                    <option value="Major">Major (Broken Leg/Frame)</option>
                    <option value="Destroyed">Destroyed (Needs Replace)</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Assessed Fine (INR)</label>
                  <input required type="number" value={dmgFine} onChange={(e) => setDmgFine(e.target.value)} style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14 }} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button type="button" onClick={() => setCurrentView("list")} style={{ flex: 1, padding: "12px", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 14, cursor: "pointer", background: "none", color: "#64748B", fontWeight: 700 }}>Cancel</button>
              <button type="submit" style={{ flex: 1, padding: "12px", background: "#EF4444", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, cursor: "pointer", fontWeight: 700 }}>Generate Fine Link</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, paddingBottom: 40 }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.5px" }}>Inventory & Damage Control</h1>
          <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: 14 }}>Monitor room stock assets, register broken furniture damages, and bill student fines.</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={handleExportInventoryCSV} style={{ padding: "11px 18px", background: "#F1F5F9", color: "#334155", border: "1px solid #CBD5E1", borderRadius: 12, fontWeight: 700, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }} title="Export Inventory & Damages">
            <Download size={16} /> <span>Export CSV</span>
          </button>
          <button onClick={() => setCurrentView("add-asset")} style={{ padding: "11px 20px", background: "#EEF2FF", color: "#4F46E5", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <Plus size={16} /> <span>Add Asset Stock</span>
          </button>
          <button onClick={() => setCurrentView("report-damage")} style={{ padding: "11px 20px", background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 13.5, cursor: "pointer", boxShadow: "0 4px 12px -2px rgba(239, 68, 68, 0.3)", display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldAlert size={16} /> <span>Report Furniture Damage</span>
          </button>
        </div>
      </div>

      {/* Asset Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 18, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#4F46E5" }}>
            <Package size={20} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>Total Units</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#0F172A" }}>{totalAssets} Items</div>
          </div>
        </div>
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 18, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981" }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>Utilized Stock</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#0F172A" }}>{totalUtilized} In Use</div>
          </div>
        </div>
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 18, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444" }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>Damaged Items</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#0F172A" }}>{totalDamaged} Broken</div>
          </div>
        </div>
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 18, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", color: "#15803D" }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>In Store (Ready)</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#0F172A" }}>{totalAvailable} Available</div>
          </div>
        </div>
      </div>

      {/* Categories Inventory Table */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: "0 0 16px 0" }}>Hostel Room Stocks Categories</h2>
        
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "16px 20px", fontWeight: 800, color: "#475569" }}>Category Name</th>
                  <th style={{ padding: "16px 20px", fontWeight: 800, color: "#475569" }}>Total Stock</th>
                  <th style={{ padding: "16px 20px", fontWeight: 800, color: "#475569" }}>Utilized (In Use)</th>
                  <th style={{ padding: "16px 20px", fontWeight: 800, color: "#475569" }}>Damaged Items</th>
                  <th style={{ padding: "16px 20px", fontWeight: 800, color: "#475569" }}>Available (In Store)</th>
                  <th style={{ padding: "16px 20px", fontWeight: 800, color: "#475569", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: "30px", textAlign: "center", color: "#64748B" }}>
                      No asset stock categories found.
                    </td>
                  </tr>
                ) : (
                  categories.map((c) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.15s ease" }} onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 8, background: "#EEF2FF", color: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>
                            <Package size={16} />
                          </div>
                          <span style={{ fontWeight: 800, color: "#0F172A", fontSize: 14 }}>{c.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#6366F1", background: "#EEF2FF", padding: "4px 10px", borderRadius: 6 }}>
                          {c.total} Units
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", color: "#334155", fontWeight: 700 }}>
                        {c.utilized} Items
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{ color: "#EF4444", fontWeight: 800, background: "#FEF2F2", padding: "4px 10px", borderRadius: 6, fontSize: 12 }}>
                          {c.damaged} Broken
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{ color: "#10B981", fontWeight: 800, background: "#ECFDF5", padding: "4px 10px", borderRadius: 6, fontSize: 12 }}>
                          {c.available} Ready
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
                          <button
                            onClick={() => handleIncreaseStock(c)}
                            style={{
                              padding: "6px 12px", background: "#4F46E5", color: "#fff", border: "none",
                              borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer"
                            }}
                          >
                            + Increase Stock
                          </button>
                          <button
                            onClick={() => {
                              setEditingCategory(c);
                              setEditCatName(c.name);
                              setEditCatTotal(String(c.total));
                              setEditCatUtilized(String(c.utilized));
                              setEditCatDamaged(String(c.damaged));
                              setShowEditCategoryModal(true);
                            }}
                            title="Edit Category"
                            style={{ background: "#EEF2FF", border: "1px solid #E0E7FF", borderRadius: 8, padding: "6px 9px", cursor: "pointer", color: "#4F46E5" }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(c)}
                            title="Delete Category"
                            style={{ background: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: 8, padding: "6px 9px", cursor: "pointer", color: "#EF4444" }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Damage Ledger */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: 0 }}>Broken Furniture Damage Ledger</h2>
          <input type="text" placeholder="Search by student name..." onChange={(e) => setSearchQuery(e.target.value)} style={{ padding: "10px 14px", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 13.5, width: 260 }} />
        </div>
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569" }}>Student</th>
                <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569" }}>Broken Item Name</th>
                <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569" }}>Fine</th>
                <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569" }}>Status</th>
                <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {damages.filter(d => d.studentName.toLowerCase().includes(searchQuery.toLowerCase())).map(dmg => (
                <tr key={dmg.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "16px 20px" }}>{dmg.studentName} <div style={{ fontSize: 11, color: "#64748B" }}>Room {dmg.room}</div></td>
                  <td style={{ padding: "16px 20px" }}>
                    <span style={{ fontWeight: 700, background: "#FEF2F2", color: "#DC2626", padding: "4px 10px", borderRadius: 6, fontSize: 12.5, display: "inline-block" }}>
                      {dmg.category || "Furniture Item"}
                    </span>
                  </td>
                  <td style={{ padding: "16px 20px", color: "#EF4444", fontWeight: 700 }}>₹{dmg.fine}</td>
                  <td style={{ padding: "16px 20px" }}>{dmg.status}</td>
                  <td style={{ padding: "16px 20px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}>
                      <button onClick={() => handleDownloadDamageReport(dmg)} title="Download Damage Fine Slip" style={{ padding: "6px 8px", background: "#F1F5F9", color: "#334155", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                        <Download size={13} />
                      </button>
                      <button onClick={() => handleSendParentAlert(dmg)} disabled={dmg.status === "Paid"} style={{ padding: "6px 12px", background: "#EFF6FF", color: "#2563EB", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Alert</button>
                      <button onClick={() => handleMarkAsPaid(dmg.id)} disabled={dmg.status === "Paid"} style={{ padding: "6px 12px", background: "#ECFDF5", color: "#047857", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Paid</button>
                      <button
                        onClick={() => {
                          setEditingDamage(dmg);
                          setEditDmgFine(String(dmg.fine));
                          setEditDmgStatus(dmg.status);
                          setShowEditDamageModal(true);
                        }}
                        style={{ padding: "6px 8px", background: "#EEF2FF", color: "#4F46E5", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => handleDeleteDamage(dmg.id)} style={{ padding: "6px 12px", background: "#FEF2F2", color: "#EF4444", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Category Modal */}
      {showEditCategoryModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <form onSubmit={handleEditCategorySubmit} style={{
            background: "#fff", padding: 32, borderRadius: 20, width: "100%", maxWidth: 440,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)"
          }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: 20, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.5px" }}>Edit Stock Category</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Category Name</label>
                <input
                  type="text"
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Total Units</label>
                <input
                  type="number"
                  value={editCatTotal}
                  onChange={(e) => setEditCatTotal(e.target.value)}
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Utilized Units</label>
                <input
                  type="number"
                  value={editCatUtilized}
                  onChange={(e) => setEditCatUtilized(e.target.value)}
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Damaged Units</label>
                <input
                  type="number"
                  value={editCatDamaged}
                  onChange={(e) => setEditCatDamaged(e.target.value)}
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="button"
                onClick={() => setShowEditCategoryModal(false)}
                style={{ padding: "10px 18px", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 13.5, cursor: "pointer", background: "none", color: "#64748B", fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: "10px 18px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 10, fontSize: 13.5, cursor: "pointer", fontWeight: 700 }}
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Damage Modal */}
      {showEditDamageModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <form onSubmit={handleEditDamageSubmit} style={{
            background: "#fff", padding: 32, borderRadius: 20, width: "100%", maxWidth: 440,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)"
          }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: 20, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.5px" }}>Edit Damage Report</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Fine Amount (INR)</label>
                <input
                  type="number"
                  value={editDmgFine}
                  onChange={(e) => setEditDmgFine(e.target.value)}
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Status</label>
                <select
                  value={editDmgStatus}
                  onChange={(e) => setEditDmgStatus(e.target.value)}
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none", background: "#fff" }}
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Link Sent">Link Sent</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="button"
                onClick={() => setShowEditDamageModal(false)}
                style={{ padding: "10px 18px", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 13.5, cursor: "pointer", background: "none", color: "#64748B", fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: "10px 18px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 10, fontSize: 13.5, cursor: "pointer", fontWeight: 700 }}
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
