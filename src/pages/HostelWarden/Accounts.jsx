import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { 
  IndianRupee, CheckCircle, AlertCircle, Clock, Plus, Search, 
  ArrowUpRight, ArrowDownRight, Users, CreditCard, Download, Send, Edit2, Trash2 
} from "lucide-react";
import { toast } from "sonner";
import { hostelAccountsApi } from "../../services/api";

export default function WardenAccounts() {
  const { schoolId } = useParams();
  const [activeTab, setActiveTab] = useState("ledger"); // ledger or vendors or schedule
  const [ledgerType, setLedgerType] = useState("Credit"); // Credit (inflow) or Debit (outflow)

  const [ledger, setLedger] = useState(() => {
    const saved = localStorage.getItem(`sms_${schoolId}_hostel_accounts_ledger`);
    if (saved && saved !== "[]") {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    hostelAccountsApi.getAll({ schoolId }).then(res => {
      if (res && res.data) {
        setLedger(res.data);
      }
    }).catch(() => {});
  }, [schoolId]);

  useEffect(() => {
    localStorage.setItem(`sms_${schoolId}_hostel_accounts_ledger`, JSON.stringify(ledger));
  }, [ledger, schoolId]);

  const [vendors, setVendors] = useState(() => {
    const saved = localStorage.getItem(`sms_${schoolId}_hostel_accounts_vendors`);
    if (saved && saved !== "[]") {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(`sms_${schoolId}_hostel_accounts_vendors`, JSON.stringify(vendors));
  }, [vendors, schoolId]);

  const [paymentSchedule, setPaymentSchedule] = useState(() => {
    const saved = localStorage.getItem(`sms_${schoolId}_hostel_accounts_schedule`);
    if (saved && saved !== "[]") {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(`sms_${schoolId}_hostel_accounts_schedule`, JSON.stringify(paymentSchedule));
  }, [paymentSchedule, schoolId]);

  // Dynamic Stats Calculation
  const collectedCredit = ledger.filter(l => l.type === "Credit").reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalExpense = ledger.filter(l => l.type === "Debit").reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalCredit = Math.max(5200000, collectedCredit + 2600000);
  const remainingCredit = Math.max(0, totalCredit - collectedCredit);
  const overdueCredit = Math.round(remainingCredit * 0.4);

  const stats = {
    totalCredit,
    collectedCredit,
    remainingCredit,
    overdueCredit,
    totalExpense
  };

  // Modals
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);

  // Form states
  const [payoutName, setPayoutName] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutCategory, setPayoutCategory] = useState("Order Payment");
  const [payoutMethod, setPayoutMethod] = useState("UPI");
  const [payoutUtr, setPayoutUtr] = useState("");
  const [payoutPhone, setPayoutPhone] = useState("");

  const [vendorName, setVendorName] = useState("");
  const [vendorGstin, setVendorGstin] = useState("");
  const [vendorAddress, setVendorAddress] = useState("");

  const handleCreatePayout = async (e) => {
    e.preventDefault();
    if (!payoutName.trim() || !payoutAmount) return;
    
    const newTx = {
      id: `tx-${Date.now()}`,
      type: "Debit",
      name: payoutName.trim(),
      room: "",
      hostel: "",
      amount: Number(payoutAmount),
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      category: payoutCategory,
      phone: payoutPhone.trim() || "+91 12345 67890",
      utr: payoutUtr.trim() || `#UTR${Math.floor(100000 + Math.random() * 900000)}`,
      method: payoutMethod,
      schoolId: schoolId || ""
    };

    try {
      await hostelAccountsApi.create(newTx);
    } catch (err) {}

    setLedger([newTx, ...ledger]);
    
    // Reset Form
    setPayoutName("");
    setPayoutAmount("");
    setShowPayoutModal(false);
    toast.success("Payout transaction logged successfully!");
  };

  // Edit Transaction Modal State
  const [showEditTxModal, setShowEditTxModal] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [editTxName, setEditTxName] = useState("");
  const [editTxPhone, setEditTxPhone] = useState("");
  const [editTxAmount, setEditTxAmount] = useState("");
  const [editTxCategory, setEditTxCategory] = useState("");
  const [editTxMethod, setEditTxMethod] = useState("");
  const [editTxUtr, setEditTxUtr] = useState("");

  const handleEditTxSubmit = async (e) => {
    e.preventDefault();
    if (!editTxName.trim() || !editTxAmount || Number(editTxAmount) <= 0) {
      toast.error("Please provide valid transaction details.");
      return;
    }
    const updated = ledger.map(l => l.id === editingTx.id ? {
      ...l,
      name: editTxName.trim(),
      phone: editTxPhone.trim(),
      amount: Number(editTxAmount),
      category: editTxCategory,
      method: editTxMethod,
      utr: editTxUtr.trim()
    } : l);
    setLedger(updated);
    try { await hostelAccountsApi.update(editingTx.id, updated.find(l => l.id === editingTx.id)); } catch (err) {}
    setShowEditTxModal(false);
    setEditingTx(null);
    toast.success("Transaction updated successfully.");
  };

  const handleDeleteTx = async (tx) => {
    if (window.confirm(`Are you sure you want to delete this ₹${tx.amount.toLocaleString()} transaction?`)) {
      setLedger(ledger.filter(l => l.id !== tx.id));
      try { await hostelAccountsApi.delete(tx.id); } catch (err) {}
      toast.success("Transaction deleted.");
    }
  };

  // Edit Vendor Modal State
  const [showEditVendorModal, setShowEditVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [editVendorName, setEditVendorName] = useState("");
  const [editVendorGstin, setEditVendorGstin] = useState("");
  const [editVendorAddress, setEditVendorAddress] = useState("");
  const [editVendorDue, setEditVendorDue] = useState("");

  const handleEditVendorSubmit = (e) => {
    e.preventDefault();
    if (!editVendorName.trim() || editVendorDue === "" || Number(editVendorDue) < 0) {
      toast.error("Please fill required vendor details properly.");
      return;
    }
    const updated = vendors.map(v => v.id === editingVendor.id ? {
      ...v,
      name: editVendorName.trim(),
      gstin: editVendorGstin.trim(),
      address: editVendorAddress.trim(),
      amountDue: Number(editVendorDue),
      status: Number(editVendorDue) === 0 ? "Paid/Delivered" : "Unpaid/Undelivered"
    } : v);
    setVendors(updated);
    setShowEditVendorModal(false);
    setEditingVendor(null);
    toast.success("Vendor details updated.");
  };

  const handleDeleteVendor = (vendor) => {
    if (window.confirm(`Are you sure you want to remove vendor ${vendor.name}?`)) {
      setVendors(vendors.filter(v => v.id !== vendor.id));
      toast.success("Vendor removed.");
    }
  };

  const handleCreateVendor = (e) => {
    e.preventDefault();
    if (!vendorName.trim()) return;

    const newV = {
      id: `v-${vendors.length + 1}`,
      name: vendorName,
      gstin: vendorGstin || "UNREGISTERED",
      address: vendorAddress || "Not Provided",
      amountDue: 0,
      orderId: `#MAN${Math.floor(100000 + Math.random() * 900000)}`,
      totalAmount: 0,
      status: "Paid/Delivered"
    };

    setVendors([...vendors, newV]);
    setVendorName("");
    setVendorGstin("");
    setVendorAddress("");
    setShowVendorModal(false);
    toast.success("Vendor added successfully!");
  };

  const handleExportData = () => {
    if (ledger.length === 0) {
      toast.error("No account transactions available to export.");
      return;
    }
    toast.success("Exporting accounts ledger CSV sheet...");
    const headers = ["Transaction ID,Type,Name/Vendor,Room,Hostel,Amount (INR),Date,Category,Phone,UTR/Reference,Payment Method"];
    const rows = ledger.map(i => `"${i.id}","${i.type}","${i.name}","${i.room || ''}","${i.hostel || ''}","${i.amount}","${i.date}","${i.category}","${i.phone || ''}","${i.utr}","${i.method}"`);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Hostel_Accounts_Ledger_${schoolId || 'portal'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadVoucher = (item) => {
    toast.success(`Downloading payment voucher / receipt for ${item.name}...`);
    const headers = ["Voucher ID,Transaction Type,Party Name,Room/Hostel,Amount,Date,Category,UTR Number,Payment Method"];
    const partyLoc = item.room ? `Room ${item.room} (${item.hostel})` : "Hostel Vendor/General";
    const rows = [`"${item.id}","${item.type}","${item.name}","${partyLoc}","₹${item.amount.toLocaleString()}","${item.date}","${item.category}","${item.utr}","${item.method}"`];
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Voucher_${item.id}_${item.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLedger = ledger.filter(item => item.type === ledgerType);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, paddingBottom: 40 }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", margin: 0, letterSpacing: "-0.5px" }}>Accounts & Expense Monitor</h1>
          <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: 14 }}>Track student collection credits, vendor debits, pay schedule EMIs, and salaries.</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleExportData}
            style={{
              padding: "11px 18px",
              background: "#F1F5F9",
              color: "#334155",
              border: "1px solid #CBD5E1",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 13.5,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
            title="Export Accounts & Transactions Ledger"
          >
            <Download size={16} /> <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowVendorModal(true)}
            style={{
              padding: "11px 20px",
              background: "#EEF2FF",
              color: "#4F46E5",
              border: "none",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 13.5,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <Plus size={16} /> <span>Add Vendor</span>
          </button>
          <button
            onClick={() => setShowPayoutModal(true)}
            style={{
              padding: "11px 20px",
              background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 13.5,
              cursor: "pointer",
              boxShadow: "0 4px 12px -2px rgba(79, 70, 229, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <IndianRupee size={16} /> <span>Make Payout (Debit)</span>
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 18, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981" }}>
            <ArrowUpRight size={20} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Total Collected (Credit)</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#10B981", marginTop: 2 }}>₹{stats.collectedCredit.toLocaleString()}</div>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 18, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FFF4E5", display: "flex", alignItems: "center", justifyContent: "center", color: "#B45309" }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Remaining Demand</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#B45309", marginTop: 2 }}>₹{stats.remainingCredit.toLocaleString()}</div>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 18, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444" }}>
            <AlertCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Overdue Fees</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#EF4444", marginTop: 2 }}>₹{stats.overdueCredit.toLocaleString()}</div>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 18, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}>
            <ArrowDownRight size={20} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Total Expenses (Debit)</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#475569", marginTop: 2 }}>₹{stats.totalExpense.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Tab Selectors */}
      <div style={{ display: "flex", gap: 12, borderBottom: "1.5px solid #E2E8F0", paddingBottom: 12 }}>
        <button
          onClick={() => setActiveTab("ledger")}
          style={{
            padding: "8px 16px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 700,
            cursor: "pointer", background: activeTab === "ledger" ? "#4F46E5" : "transparent",
            color: activeTab === "ledger" ? "#fff" : "#64748B"
          }}
        >
          Credit / Debit Ledger
        </button>
        <button
          onClick={() => setActiveTab("vendors")}
          style={{
            padding: "8px 16px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 700,
            cursor: "pointer", background: activeTab === "vendors" ? "#4F46E5" : "transparent",
            color: activeTab === "vendors" ? "#fff" : "#64748B"
          }}
        >
          Vendor Orders & Billing
        </button>
        <button
          onClick={() => setActiveTab("schedule")}
          style={{
            padding: "8px 16px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 700,
            cursor: "pointer", background: activeTab === "schedule" ? "#4F46E5" : "transparent",
            color: activeTab === "schedule" ? "#fff" : "#64748B"
          }}
        >
          Student EMI Schedule
        </button>
      </div>

      {/* Tab 1: Ledger */}
      {activeTab === "ledger" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8, background: "#F1F5F9", padding: 4, borderRadius: 8 }}>
              <button
                onClick={() => setLedgerType("Credit")}
                style={{
                  padding: "6px 14px", border: "none", borderRadius: 6, fontSize: 12.5, fontWeight: 700,
                  cursor: "pointer", background: ledgerType === "Credit" ? "#10B981" : "transparent",
                  color: ledgerType === "Credit" ? "#fff" : "#64748B"
                }}
              >
                Inflow (Credit Details)
              </button>
              <button
                onClick={() => setLedgerType("Debit")}
                style={{
                  padding: "6px 14px", border: "none", borderRadius: 6, fontSize: 12.5, fontWeight: 700,
                  cursor: "pointer", background: ledgerType === "Debit" ? "#EF4444" : "transparent",
                  color: ledgerType === "Debit" ? "#fff" : "#64748B"
                }}
              >
                Outflow (Debit History)
              </button>
            </div>

            <button
              onClick={handleExportData}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
                border: "1px solid #CBD5E1", borderRadius: 10, fontSize: 13, fontWeight: 700,
                background: "#fff", color: "#334155", cursor: "pointer"
              }}
            >
              <Download size={14} /> Export CSV Ledger
            </button>
          </div>

          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>Name</th>
                  <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>Type/Room</th>
                  <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>Amount</th>
                  <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>Date</th>
                  <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>Category / Remark</th>
                  <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>UTR / Tx ID</th>
                  <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>Method</th>
                  <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedger.map(item => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 14 }}>{item.name}</div>
                      <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>{item.phone}</div>
                    </td>
                    <td style={{ padding: "16px 20px", fontSize: 13.5, color: "#334155" }}>
                      {item.room ? `Room ${item.room} (${item.hostel})` : "N/A"}
                    </td>
                    <td style={{ padding: "16px 20px", fontSize: 14.5, fontWeight: 800, color: item.type === "Credit" ? "#10B981" : "#EF4444" }}>
                      ₹{item.amount.toLocaleString()}
                    </td>
                    <td style={{ padding: "16px 20px", fontSize: 13, color: "#64748B" }}>{item.date}</td>
                    <td style={{ padding: "16px 20px", fontSize: 13.5, color: "#475569" }}>{item.category}</td>
                    <td style={{ padding: "16px 20px", fontSize: 12.5, color: "#64748B", fontFamily: "monospace" }}>{item.utr}</td>
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{ background: "#F1F5F9", color: "#475569", padding: "4px 8px", borderRadius: 6, fontSize: 11.5, fontWeight: 700 }}>
                        {item.method}
                      </span>
                    </td>
                    <td style={{ padding: "16px 20px", display: "flex", gap: 6, alignItems: "center" }}>
                      <button
                        onClick={() => handleDownloadVoucher(item)}
                        title="Download Payment Voucher Slip"
                        style={{ background: "#F1F5F9", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#334155" }}
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingTx(item);
                          setEditTxName(item.name);
                          setEditTxPhone(item.phone || "");
                          setEditTxAmount(String(item.amount));
                          setEditTxCategory(item.category);
                          setEditTxMethod(item.method);
                          setEditTxUtr(item.utr);
                          setShowEditTxModal(true);
                        }}
                        title="Edit Transaction"
                        style={{ background: "#EEF2FF", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#4F46E5" }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteTx(item)}
                        title="Delete Transaction"
                        style={{ background: "#FEF2F2", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#EF4444" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Vendors */}
      {activeTab === "vendors" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
          {vendors.map(v => (
            <div key={v.id} style={{ background: "#fff", borderRadius: 18, border: "1px solid #E2E8F0", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", justifyBetween: "space-between", alignItems: "flex-start", width: "100%" }}>
                <span style={{ fontSize: 11, fontWeight: 800, padding: "4px 8px", borderRadius: 6, background: "#EEF2FF", color: "#4F46E5" }}>
                  ORDER ID: {v.orderId}
                </span>
                <span style={{ fontSize: 20 }}>🏭</span>
              </div>

              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: "0 0 6px 0" }}>{v.name}</h3>
                <p style={{ margin: 0, fontSize: 12, color: "#94A3B8" }}>GSTIN: {v.gstin}</p>
                <p style={{ margin: "8px 0 0 0", fontSize: 12.5, color: "#64748B", lineHeight: 1.4 }}>{v.address}</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "#F8FAFC", borderRadius: 12, padding: 14, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Grand Total:</span>
                  <strong style={{ color: "#334155" }}>₹{v.totalAmount.toLocaleString()}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Outstanding Payment:</span>
                  <strong style={{ color: "#EF4444" }}>₹{v.amountDue.toLocaleString()}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Status:</span>
                  <strong style={{ color: "#4F46E5" }}>{v.status}</strong>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                {v.amountDue > 0 && (
                  <button
                    onClick={() => {
                      toast.info("Redirecting to Bank gateway to process payout...");
                      setVendors(vendors.map(item => item.id === v.id ? { ...item, amountDue: 0, status: "Paid/Delivered" } : item));
                      const debitTx = {
                        id: `tx-${Date.now()}`,
                        type: "Debit",
                        name: v.name,
                        room: "",
                        hostel: "",
                        amount: v.amountDue,
                        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                        category: "Order Payment",
                        phone: "+91 85289 85298",
                        utr: `#PAY${Math.floor(100000 + Math.random() * 900000)}`,
                        method: "Bank Transfer",
                        schoolId: schoolId || ""
                      };
                      setLedger([debitTx, ...ledger]);
                      try { hostelAccountsApi.create(debitTx); } catch (e) {}
                    }}
                    style={{
                      flex: 1, padding: "10px", background: "#4F46E5", color: "#fff",
                      border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer"
                    }}
                  >
                    Clear Outstanding Dues
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingVendor(v);
                    setEditVendorName(v.name);
                    setEditVendorGstin(v.gstin);
                    setEditVendorAddress(v.address);
                    setEditVendorDue(String(v.amountDue));
                    setShowEditVendorModal(true);
                  }}
                  title="Edit Vendor"
                  style={{ background: "#EEF2FF", border: "none", borderRadius: 10, padding: "10px 12px", cursor: "pointer", color: "#4F46E5" }}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDeleteVendor(v)}
                  title="Delete Vendor"
                  style={{ background: "#FEF2F2", border: "none", borderRadius: 10, padding: "10px 12px", cursor: "pointer", color: "#EF4444" }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Student EMI split */}
      {activeTab === "schedule" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: 0 }}>Installment Scheme Configuration</h3>
              <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: 13 }}>Standard school hostel fees are distributed in 3 EMI splits across the academic cycle.</p>
            </div>
            <div style={{ display: "flex", gap: 8, background: "#F1F5F9", padding: 4, borderRadius: 8 }}>
              <span style={{ padding: "6px 14px", background: "#fff", borderRadius: 6, fontSize: 12.5, fontWeight: 700, color: "#0F172A", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                EMI Option Active
              </span>
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>S.No</th>
                  <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>Billing Particulars</th>
                  <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>Amount</th>
                  <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>Due Date</th>
                  <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>Status</th>
                  <th style={{ padding: "16px 20px", fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paymentSchedule.map(sch => (
                  <tr key={sch.sno} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{sch.sno}</td>
                    <td style={{ padding: "16px 20px", fontSize: 13.5, color: "#334155" }}>{sch.particulars}</td>
                    <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 800, color: "#0F172A" }}>₹{sch.amount.toLocaleString()}</td>
                    <td style={{ padding: "16px 20px", fontSize: 13, color: "#64748B" }}>{sch.dueDate}</td>
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{
                        fontSize: 10.5, fontWeight: 800, padding: "4px 8px", borderRadius: 6,
                        background: sch.status === "Paid" ? "#ECFDF5" : "#FFF4E5",
                        color: sch.status === "Paid" ? "#047857" : "#B45309"
                      }}>{sch.status.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      {sch.status === "Pending" ? (
                        <button
                          onClick={() => {
                            toast.success("Payment alert notification sent successfully!");
                          }}
                          style={{
                            background: "#EEF2FF", color: "#4F46E5", border: "none",
                            padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer"
                          }}
                        >
                          Send Reminder Alert
                        </button>
                      ) : (
                        <span style={{ color: "#94A3B8", fontSize: 13 }}>Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Make Payout Modal */}
      {showPayoutModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <form onSubmit={handleCreatePayout} style={{
            background: "#fff", padding: 32, borderRadius: 20, width: "100%", maxWidth: 440,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)"
          }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: 20, fontWeight: 900, color: "#0F172A" }}>Register Payout (Debit)</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 28 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Receiver Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramakant Sharma"
                    value={payoutName}
                    onChange={(e) => setPayoutName(e.target.value)}
                    style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Receiver Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 52345 64545"
                    value={payoutPhone}
                    onChange={(e) => setPayoutPhone(e.target.value)}
                    style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Payout Amount (INR)</label>
                  <input
                    type="number"
                    placeholder="e.g. 156000"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14 }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Category</label>
                  <select
                    value={payoutCategory}
                    onChange={(e) => setPayoutCategory(e.target.value)}
                    style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, background: "#fff" }}
                  >
                    <option value="Staff Salary">Staff Salary</option>
                    <option value="Order Payment">Order Payment</option>
                    <option value="Vendor Purchase">Vendor Purchase</option>
                    <option value="Other Utility">Other Utility Expenses</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Payment Method</label>
                  <select
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value)}
                    style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, background: "#fff" }}
                  >
                    <option value="UPI">UPI Method</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Netbanking">Netbanking</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>UTR / Transaction ID</label>
                  <input
                    type="text"
                    placeholder="e.g. #12345HGFKL..."
                    value={payoutUtr}
                    onChange={(e) => setPayoutUtr(e.target.value)}
                    style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14 }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="button"
                onClick={() => setShowPayoutModal(false)}
                style={{ padding: "10px 18px", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 13.5, cursor: "pointer", background: "none", color: "#64748B" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: "10px 18px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 10, fontSize: 13.5, cursor: "pointer", fontWeight: 700 }}
              >
                Confirm Payout
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Vendor Modal */}
      {showVendorModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <form onSubmit={handleCreateVendor} style={{
            background: "#fff", padding: 32, borderRadius: 20, width: "100%", maxWidth: 400,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)"
          }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: 20, fontWeight: 900, color: "#0F172A" }}>Register New Vendor</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 28 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Vendor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Naraymuthry Furniture Private Limited"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14 }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>GSTIN / LLP Reg No</label>
                <input
                  type="text"
                  placeholder="e.g. GSTUIN45698PORI"
                  value={vendorGstin}
                  onChange={(e) => setVendorGstin(e.target.value)}
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14 }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Address details</label>
                <textarea
                  placeholder="101-103 Chanda Tower, Opp. Marriage Garden, Gandhi Path, Jaipur..."
                  value={vendorAddress}
                  onChange={(e) => setVendorAddress(e.target.value)}
                  rows="3"
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, fontFamily: "inherit", resize: "none" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="button"
                onClick={() => setShowVendorModal(false)}
                style={{ padding: "10px 18px", border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 13.5, cursor: "pointer", background: "none", color: "#64748B" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: "10px 18px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 10, fontSize: 13.5, cursor: "pointer", fontWeight: 700 }}
              >
                Add Vendor
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {showEditTxModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <form onSubmit={handleEditTxSubmit} style={{
            background: "#fff", padding: 32, borderRadius: 20, width: "100%", maxWidth: 440,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)"
          }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: 20, fontWeight: 900, color: "#0F172A" }}>Edit Transaction ({editingTx?.type})</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Name / Party *</label>
                  <input
                    type="text"
                    required
                    value={editTxName}
                    onChange={(e) => setEditTxName(e.target.value)}
                    style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Phone</label>
                  <input
                    type="text"
                    value={editTxPhone}
                    onChange={(e) => setEditTxPhone(e.target.value)}
                    style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Amount (INR) *</label>
                  <input
                    type="number"
                    required
                    value={editTxAmount}
                    onChange={(e) => setEditTxAmount(e.target.value)}
                    style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Category</label>
                  <input
                    type="text"
                    required
                    value={editTxCategory}
                    onChange={(e) => setEditTxCategory(e.target.value)}
                    style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Method</label>
                  <select
                    value={editTxMethod}
                    onChange={(e) => setEditTxMethod(e.target.value)}
                    style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none", background: "#fff" }}
                  >
                    <option value="UPI">UPI Method</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Netbanking">Netbanking</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>UTR / Tx ID</label>
                  <input
                    type="text"
                    value={editTxUtr}
                    onChange={(e) => setEditTxUtr(e.target.value)}
                    style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none" }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="button"
                onClick={() => setShowEditTxModal(false)}
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

      {/* Edit Vendor Modal */}
      {showEditVendorModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <form onSubmit={handleEditVendorSubmit} style={{
            background: "#fff", padding: 32, borderRadius: 20, width: "100%", maxWidth: 420,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)"
          }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: 20, fontWeight: 900, color: "#0F172A" }}>Edit Vendor Details</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Vendor Name *</label>
                <input
                  type="text"
                  required
                  value={editVendorName}
                  onChange={(e) => setEditVendorName(e.target.value)}
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>GSTIN / Reg No</label>
                <input
                  type="text"
                  value={editVendorGstin}
                  onChange={(e) => setEditVendorGstin(e.target.value)}
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Address</label>
                <textarea
                  rows="2"
                  value={editVendorAddress}
                  onChange={(e) => setEditVendorAddress(e.target.value)}
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569" }}>Outstanding Dues (INR) *</label>
                <input
                  type="number"
                  required
                  value={editVendorDue}
                  onChange={(e) => setEditVendorDue(e.target.value)}
                  style={{ padding: "12px 16px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="button"
                onClick={() => setShowEditVendorModal(false)}
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
