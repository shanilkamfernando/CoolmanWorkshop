// ============================================
// Purchasing Dashboard - Stepper View
// Save as: client/src/pages/purchasing/PurchasingDashboard.tsx
// ============================================

import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import companyLogo from "../../assets/mainlogo.jpeg";
import "../customers/ProjectDashboard.css";

interface User {
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Entry {
  id: number;
  customer_id: number;
  user_name: string;
  product: string;
  quantity: string;
  description: string;
  due_date: string;
  user_datetime: string;
  workshop_customer_id: number;
  job_card_id: number;
  job_card_number: string;
  office_user_1: string;
  order_form_no: string;
  notes: string;
  office_datetime_1: string;
  approved: boolean;
  approved_by: string;
  approved_at: string;
  remarks: string;
  office_user_2: string;
  po_no: string;
  office_datetime_2: string;
  office_user_3: string;
  invoice_no: string;
  office_datetime_3: string;
  purchase_date: string;
  drivers_name: string;
  vehicle_no: string;
  received: string;
  driver_description: string;
}

interface WorkshopCustomer {
  id: number;
  name: string;
}
// interface JobCard {
//   id: number;
//   job_card_number: string;
//   item: string;
//   status: string;
// }

// ── Helpers ──────────────────────────────────────────────────────
const getInitials = (name: string) => {
  const w = name.trim().split(" ");
  return w.length === 1
    ? w[0].substring(0, 2).toUpperCase()
    : (w[0][0] + w[w.length - 1][0]).toUpperCase();
};
const getColor = (name: string) => {
  const colors = [
    "#667eea",
    "#2196F3",
    "#4CAF50",
    "#FF9800",
    "#E91E63",
    "#00BCD4",
    "#9C27B0",
    "#FF5722",
    "#009688",
    "#3F51B5",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
};
const fmtDate = (d: string) => {
  if (!d) return "—";
  const [y, m, day] = d.split("T")[0].split("-");
  return `${day} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][parseInt(m) - 1]} ${y}`;
};
const fmtDT = (dt: string) => {
  if (!dt) return "";
  return new Date(dt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ── Steps ────────────────────────────────────────────────────────
const STEPS = [
  { label: "Request", icon: "📋", color: "#c4c4c4" },
  { label: "Order", icon: "📝", color: "#c4c4c4" },
  { label: "Approval", icon: "✓", color: "#c4c4c4" },
  { label: "PO", icon: "🧾", color: "#c4c4c4" },
  { label: "Invoice", icon: "🗂️", color: "#c4c4c4" },
  { label: "Delivered", icon: "🚚", color: "#16a34a" },
];

// Which step has been completed (0 = only request done, 5 = all done)
const getCompletedStep = (entry: Entry): number => {
  if (entry.drivers_name || entry.purchase_date) return 5;
  if (entry.invoice_no) return 4;
  if (entry.po_no) return 3;
  if (entry.approved) return 2;
  if (entry.order_form_no) return 1;
  return 0;
};

// ── Progress Bar (display only, not clickable) ────────────────────
const StepBar = ({ entry }: { entry: Entry }) => {
  const completed = getCompletedStep(entry);
  return (
    <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
      {STEPS.map((s, i) => {
        const done = i <= completed;
        const active = i === completed;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              flex: i < STEPS.length - 1 ? 1 : "none",
            }}
          >
            <div
              title={s.label}
              style={{
                width: active ? "28px" : "22px",
                height: active ? "28px" : "22px",
                borderRadius: "50%",
                background: done
                  ? i === 5 && done
                    ? "#16a34a"
                    : "#1f2937"
                  : "#e5e7eb",
                color: done ? "#fff" : "#9ca3af",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: active ? "12px" : "9px",
                fontWeight: 700,
                flexShrink: 0,
                boxShadow: active ? "0 0 0 3px rgba(0,0,0,0.12)" : "none",
                transition: "all 0.2s",
              }}
            >
              {done && i < completed ? "✓" : s.icon}
            </div>
            {i < STEPS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: "3px",
                  background: i < completed ? "#1f2937" : "#e5e7eb",
                  margin: "0 2px",
                  transition: "background 0.3s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Stage Panel with clickable tabs ──────────────────────────────
const StagePanel = ({
  entry,
  userRole,
  onUpdate,
  inp,
  setInp,
}: {
  entry: Entry;
  userRole: string;
  onUpdate: (id: number, action: string, data: any) => void;
  inp: any;
  setInp: (field: string, value: string) => void;
}) => {
  const completed = getCompletedStep(entry);
  const [selectedTab, setSelectedTab] = useState(completed);

  // Keep selected tab in sync when entry updates
  useEffect(() => {
    setSelectedTab(getCompletedStep(entry));
  }, [entry.id]);

  // Role flags
  const isOffice = ["office", "office_admin", "admin"].includes(userRole);
  const canApprove = ["admin", "office_admin"].includes(userRole);
  const isStores = ["stores", "office", "office_admin", "admin"].includes(
    userRole,
  );

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "7px 10px",
    fontSize: "13px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    background: "#fff",
    boxSizing: "border-box",
  };
  const saveBtn = (_bg: string): React.CSSProperties => ({
    background: "#1f2937",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "8px 20px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
    marginTop: "4px",
  });
  const lbl: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase" as const,
    letterSpacing: "0.4px",
    display: "block",
    marginBottom: "5px",
  };
  const val: React.CSSProperties = {
    fontSize: "13px",
    color: "#111827",
    fontWeight: 500,
  };
  const muted: React.CSSProperties = { fontSize: "13px", color: "#6b7280" };

  const ReadRow = ({
    label,
    value,
    highlight,
  }: {
    label: string;
    value: string;
    highlight?: boolean;
  }) => (
    <div>
      <span style={lbl}>{label}</span>
      <span style={highlight ? { ...val, color: "#059669" } : muted}>
        {value || "—"}
      </span>
    </div>
  );

  const waiting = (msg: string) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "12px 0",
        color: "#9ca3af",
      }}
    >
      <span style={{ fontSize: "20px" }}>⏳</span>
      <span style={{ fontSize: "13px", fontStyle: "italic" }}>{msg}</span>
    </div>
  );

  // ── Stage content per tab ─────────────────────────────────────
  const renderTab = (tab: number) => {
    switch (tab) {
      // ── 0: Request ──────────────────────────────────────────
      case 0:
        return (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
              gap: "16px",
            }}
          >
            <ReadRow label="Requested By" value={entry.user_name} />
            <ReadRow label="Product" value={entry.product} />
            <ReadRow label="Quantity" value={entry.quantity} />
            <ReadRow label="Requested On" value={fmtDT(entry.user_datetime)} />
            <div>
              <span style={lbl}>Due Date</span>
              <span
                style={{
                  ...val,
                  color:
                    entry.due_date &&
                    new Date(entry.due_date) < new Date() &&
                    completed < 5
                      ? "#dc2626"
                      : "#111827",
                }}
              >
                {entry.due_date ? fmtDate(entry.due_date) : "—"}
              </span>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <ReadRow label="Description" value={entry.description} />
            </div>
          </div>
        );

      // ── 1: Order Form ────────────────────────────────────────
      case 1:
        if (entry.order_form_no) {
          // Filled — everyone sees read-only
          return (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                gap: "16px",
              }}
            >
              <ReadRow label="Officer" value={entry.office_user_1} />
              <ReadRow label="Order Form No" value={entry.order_form_no} />
              <ReadRow label="Notes" value={entry.notes} />
              <ReadRow label="Date" value={fmtDT(entry.office_datetime_1)} />
            </div>
          );
        }
        if (isOffice) {
          return (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                maxWidth: "500px",
              }}
            >
              <div>
                <span style={lbl}>Order Form No *</span>
                <input
                  placeholder="Enter order form number"
                  value={inp.order_form_no || ""}
                  style={fieldStyle}
                  onChange={(e) => setInp("order_form_no", e.target.value)}
                />
              </div>
              <div>
                <span style={lbl}>Notes</span>
                <input
                  placeholder="Notes (optional)"
                  value={inp.notes || ""}
                  style={fieldStyle}
                  onChange={(e) => setInp("notes", e.target.value)}
                />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <button
                  style={saveBtn("#7c3aed")}
                  onClick={() =>
                    onUpdate(entry.id, "orderform", {
                      order_form_no: inp.order_form_no,
                      notes: inp.notes,
                    })
                  }
                >
                  Save Order Form
                </button>
              </div>
            </div>
          );
        }
        return waiting("Waiting for office to fill the order form.");

      // ── 2: Approval ──────────────────────────────────────────
      case 2:
        if (entry.approved) {
          return (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                gap: "16px",
              }}
            >
              <ReadRow
                label="Approved By"
                value={`✓ ${entry.approved_by}`}
                highlight
              />
              <ReadRow label="Approved On" value={fmtDT(entry.approved_at)} />
              {entry.remarks && (
                <div style={{ gridColumn: "span 2" }}>
                  <ReadRow label="Remarks" value={entry.remarks} />
                </div>
              )}
            </div>
          );
        }
        if (canApprove) {
          return (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                maxWidth: "400px",
              }}
            >
              <div>
                <span style={lbl}>Remarks (optional)</span>
                <textarea
                  placeholder="Add remarks before approving..."
                  value={inp.remarks || ""}
                  rows={3}
                  style={{ ...fieldStyle, resize: "none" as const }}
                  onChange={(e) => setInp("remarks", e.target.value)}
                />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  style={{ ...saveBtn(""), background: "#059669" }}
                  onClick={() =>
                    onUpdate(entry.id, "approve", { approved: true })
                  }
                >
                  ✓ Approve
                </button>
                {inp.remarks && (
                  <button
                    style={saveBtn("#6b7280")}
                    onClick={() =>
                      onUpdate(entry.id, "remarks", { remarks: inp.remarks })
                    }
                  >
                    Save Remarks Only
                  </button>
                )}
              </div>
            </div>
          );
        }
        return waiting("Waiting for approval.");

      // ── 3: Purchase Order ────────────────────────────────────
      case 3:
        if (entry.po_no) {
          return (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                gap: "16px",
              }}
            >
              <ReadRow label="Officer" value={entry.office_user_2} />
              <ReadRow label="PO Number" value={entry.po_no} />
              <ReadRow label="Date" value={fmtDT(entry.office_datetime_2)} />
            </div>
          );
        }
        if (isOffice && entry.approved) {
          return (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                maxWidth: "300px",
              }}
            >
              <div>
                <span style={lbl}>PO Number *</span>
                <input
                  placeholder="Enter PO number"
                  value={inp.po_no || ""}
                  style={fieldStyle}
                  onChange={(e) => setInp("po_no", e.target.value)}
                />
              </div>
              <button
                style={saveBtn("#0284c7")}
                onClick={() => onUpdate(entry.id, "po", { po_no: inp.po_no })}
              >
                Save PO
              </button>
            </div>
          );
        }
        return waiting(
          entry.approved
            ? "Waiting for office to enter PO."
            : "Requires approval first.",
        );

      // ── 4: Invoice ───────────────────────────────────────────
      case 4:
        if (entry.invoice_no) {
          return (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                gap: "16px",
              }}
            >
              <ReadRow label="Officer" value={entry.office_user_3} />
              <ReadRow label="Invoice Number" value={entry.invoice_no} />
              <ReadRow label="Date" value={fmtDT(entry.office_datetime_3)} />
            </div>
          );
        }
        if (isOffice && entry.po_no) {
          return (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                maxWidth: "300px",
              }}
            >
              <div>
                <span style={lbl}>Invoice Number *</span>
                <input
                  placeholder="Enter invoice number"
                  value={inp.invoice_no || ""}
                  style={fieldStyle}
                  onChange={(e) => setInp("invoice_no", e.target.value)}
                />
              </div>
              <button
                style={saveBtn("#d97706")}
                onClick={() =>
                  onUpdate(entry.id, "invoice", { invoice_no: inp.invoice_no })
                }
              >
                Save Invoice
              </button>
            </div>
          );
        }
        return waiting(
          entry.po_no ? "Waiting for invoice." : "Requires PO first.",
        );

      // ── 5: Delivery ──────────────────────────────────────────
      case 5:
        if (entry.drivers_name || entry.purchase_date) {
          return (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                gap: "16px",
              }}
            >
              <ReadRow
                label="Purchase Date"
                value={entry.purchase_date ? fmtDate(entry.purchase_date) : ""}
              />
              <ReadRow label="Driver" value={entry.drivers_name} />
              <ReadRow label="Vehicle" value={entry.vehicle_no} />
              <ReadRow label="Received By (Stores)" value={entry.received} />
              {entry.driver_description && (
                <div style={{ gridColumn: "span 2" }}>
                  <ReadRow label="Notes" value={entry.driver_description} />
                </div>
              )}
            </div>
          );
        }
        if (isStores && entry.invoice_no) {
          return (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                maxWidth: "520px",
              }}
            >
              <div>
                <span style={lbl}>Purchase Date</span>
                <input
                  type="date"
                  value={inp.purchase_date || ""}
                  style={fieldStyle}
                  onChange={(e) => setInp("purchase_date", e.target.value)}
                />
              </div>
              <div>
                <span style={lbl}>Driver Name</span>
                <input
                  placeholder="Driver name"
                  value={inp.drivers_name || ""}
                  style={fieldStyle}
                  onChange={(e) => setInp("drivers_name", e.target.value)}
                />
              </div>
              <div>
                <span style={lbl}>Vehicle No</span>
                <input
                  placeholder="Vehicle number"
                  value={inp.vehicle_no || ""}
                  style={fieldStyle}
                  onChange={(e) => setInp("vehicle_no", e.target.value)}
                />
              </div>
              <div>
                <span style={lbl}>Received By (Stores)</span>
                <input
                  placeholder="Stores person"
                  value={inp.received || ""}
                  style={fieldStyle}
                  onChange={(e) => setInp("received", e.target.value)}
                />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <span style={lbl}>Notes</span>
                <textarea
                  placeholder="Delivery notes"
                  value={inp.driver_description || ""}
                  rows={2}
                  style={{ ...fieldStyle, resize: "none" as const }}
                  onChange={(e) => setInp("driver_description", e.target.value)}
                />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <button
                  style={saveBtn("#16a34a")}
                  onClick={() =>
                    onUpdate(entry.id, "driver", {
                      purchase_date: inp.purchase_date,
                      drivers_name: inp.drivers_name,
                      vehicle_no: inp.vehicle_no,
                      received: inp.received,
                      driver_description: inp.driver_description,
                    })
                  }
                >
                  Save Delivery
                </button>
              </div>
            </div>
          );
        }
        return waiting(
          entry.invoice_no
            ? "Waiting for delivery details."
            : "Requires invoice first.",
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "180px" }}>
      {/* ── Left sidebar: clickable stage tabs ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #f3f4f6",
          minWidth: "145px",
          flexShrink: 0,
          background: "#fafafa",
        }}
      >
        {STEPS.map((s, i) => {
          const done = i <= completed;
          const isSelected = i === selectedTab;
          return (
            <button
              key={i}
              onClick={() => setSelectedTab(i)}
              style={{
                padding: "11px 14px",
                fontSize: "12px",
                fontWeight: 600,
                color: isSelected ? "#111827" : done ? "#374151" : "#9ca3af",
                background: isSelected ? "#f3f4f6" : "transparent",
                borderLeft: isSelected
                  ? "3px solid #1f2937"
                  : "3px solid transparent",
                borderRight: "none",
                borderTop: "none",
                borderBottom: "none",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                textAlign: "left" as const,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.background = "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                if (!isSelected)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ fontSize: "14px" }}>
                {done && i < completed ? "✓" : s.icon}
              </span>
              <span>{s.label}</span>
              {i === completed && (
                <span
                  style={{
                    marginLeft: "auto",
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "#1f2937",
                    flexShrink: 0,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Right: selected tab content ── */}
      <div style={{ flex: 1, padding: "18px 22px" }}>
        {/* Tab title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <span style={{ fontSize: "15px" }}>{STEPS[selectedTab].icon}</span>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#111827",
              textTransform: "uppercase" as const,
              letterSpacing: "0.5px",
            }}
          >
            {STEPS[selectedTab].label}
          </span>
          {selectedTab <= completed && selectedTab !== completed && (
            <span
              style={{
                fontSize: "11px",
                background: "#f0fdf4",
                color: "#15803d",
                border: "1px solid #bbf7d0",
                borderRadius: "12px",
                padding: "1px 8px",
                fontWeight: 600,
              }}
            >
              Completed
            </span>
          )}
          {selectedTab === completed && completed < 5 && (
            <span
              style={{
                fontSize: "11px",
                background: STEPS[selectedTab].color + "15",
                color: STEPS[selectedTab].color,
                border: `1px solid ${STEPS[selectedTab].color}33`,
                borderRadius: "12px",
                padding: "1px 8px",
                fontWeight: 600,
              }}
            >
              Active
            </span>
          )}
          {selectedTab > completed && (
            <span
              style={{
                fontSize: "11px",
                background: "#f9fafb",
                color: "#9ca3af",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "1px 8px",
                fontWeight: 600,
              }}
            >
              Pending
            </span>
          )}
        </div>

        {renderTab(selectedTab)}
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────
const PurchasingDashboard = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const location = useLocation();

  const [user, setUser] = useState<User | null>(null);
  const [customerName, setCustomerName] = useState(
    location.state?.customer?.name || "",
  );
  const [entries, setEntries] = useState<Entry[]>([]);
  const [workshopCustomers, setWorkshopCustomers] = useState<
    WorkshopCustomer[]
  >([]);
  //   const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [entryInputs, setEntryInputs] = useState<Record<number, any>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    product: "",
    quantity: "",
    description: "",
    due_date: "",
    workshop_customer_id: "",
  });

  const isAdmin = user?.role === "admin";
  const token = () => localStorage.getItem("token");
  const hdr = () => ({ Authorization: `Bearer ${token()}` });
  const BASE = `http://localhost:5000/api/purchasing/customers/${customerId}/entries`;
  const custColor = getColor(customerName || "C");
  const custInitials = getInitials(customerName || "C");

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
    if (!customerName) fetchCustomer();
    fetchEntries();
    fetchWorkshopCustomers();
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      const r = await axios.get(
        `http://localhost:5000/api/purchasing/customers/${customerId}`,
        { headers: hdr() },
      );
      if (r.data.customer) setCustomerName(r.data.customer.name);
    } catch {}
  };

  const fetchEntries = async () => {
    try {
      const r = await axios.get(BASE, { headers: hdr() });
      const data: Entry[] = r.data.entries || [];
      setEntries(data);
      const map: Record<number, any> = {};
      data.forEach((e) => {
        map[e.id] = {
          order_form_no: "",
          notes: "",
          po_no: "",
          invoice_no: "",
          remarks: "",
          purchase_date: "",
          drivers_name: "",
          vehicle_no: "",
          received: "",
          driver_description: "",
        };
      });
      setEntryInputs(map);
    } catch {}
  };

  const fetchWorkshopCustomers = async () => {
    try {
      const r = await axios.get(
        "http://localhost:5000/api/purchasing/workshop-customers",
        { headers: hdr() },
      );
      setWorkshopCustomers(r.data.customers || []);
    } catch {}
  };

  //   const fetchJobCards = async (wsId: string) => {
  //     if (!wsId) {
  //       setJobCards([]);
  //       return;
  //     }
  //     try {
  //       const r = await axios.get(
  //         `http://localhost:5000/api/purchasing/workshop-customers/${wsId}/jobcards`,
  //         { headers: hdr() },
  //       );
  //       setJobCards(r.data.jobcards || []);
  //     } catch {}
  //   };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product.trim()) {
      alert("Product is required");
      return;
    }
    setSaving(true);
    try {
      await axios.post(BASE, form, { headers: hdr() });
      setForm({
        product: "",
        quantity: "",
        description: "",
        due_date: "",
        workshop_customer_id: "",
        // job_card_id: "",
        // job_card_number: "",
      });
      setShowAddForm(false);
      fetchEntries();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to add entry");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: number, action: string, data: any) => {
    try {
      const r = await axios.put(`${BASE}/${id}/${action}`, data, {
        headers: hdr(),
      });
      setEntries((prev) => prev.map((e) => (e.id === id ? r.data.entry : e)));
      setEntryInputs((prev) => ({
        ...prev,
        [id]: {
          order_form_no: "",
          notes: "",
          po_no: "",
          invoice_no: "",
          remarks: "",
          purchase_date: "",
          drivers_name: "",
          vehicle_no: "",
          received: "",
          driver_description: "",
        },
      }));
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update");
    }
  };

  const handleDelete = async (id: number, product: string) => {
    if (!confirm(`Delete "${product}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${BASE}/${id}`, { headers: hdr() });
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete");
    }
  };

  const inp2: React.CSSProperties = {
    width: "100%",
    padding: "7px 10px",
    fontSize: "13px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    background: "#fff",
    boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    color: "#6b7280",
    marginBottom: "4px",
    textTransform: "uppercase" as const,
  };

  return (
    <div className="project-dashboard">
      {/* Header */}
      <div className="portal-header">
        <div className="header-left">
          <div
            className="logo-container"
            onClick={() => navigate("/dashboard")}
          >
            <img src={companyLogo} alt="Logo" className="company-logo" />
          </div>
          <h1 className="portal-title" onClick={() => navigate("/dashboard")}>
            <span className="brand-cool">COOL</span>
            <span className="brand-man">Man</span> Refrigeration
          </h1>
        </div>
        <div className="header-right">
          <div className="customer-logo-badge-with-icon">
            <div
              className="customer-badge-logo"
              style={{ backgroundColor: custColor }}
            >
              {custInitials}
            </div>
            <span className="customer-logo-text">{customerName}</span>
          </div>
          <span className="user-icon">👤</span>
          <span className="username">{user?.username || "User"}</span>
        </div>
      </div>

      <div className="project-main-content">
        {/* Page header */}
        <div className="project-header-row">
          <div>
            <h2 style={{ margin: 0 }}>Purchasing</h2>
            <p
              style={{
                color: "#6b7280",
                fontSize: "0.875rem",
                marginTop: "4px",
              }}
            >
              {customerName} · {entries.length} entr
              {entries.length !== 1 ? "ies" : "y"}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {!showAddForm && (
              <button
                className="btn-save-project"
                onClick={() => setShowAddForm(true)}
              >
                + New Entry
              </button>
            )}
            <button
              className="btn-back"
              onClick={() => navigate("/purchasing/workshop/customers")}
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Add Entry Form */}
        {showAddForm && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "20px 24px",
              marginBottom: "24px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <h3
              style={{
                margin: "0 0 16px",
                fontSize: "0.95rem",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              New Purchasing Entry
            </h3>
            <form onSubmit={handleAddEntry}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <label style={lbl}>Workshop Customer</label>
                  <select
                    value={form.workshop_customer_id}
                    style={inp2}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        workshop_customer_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select customer...</option>
                    {workshopCustomers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* <div>
                  <label style={lbl}>Job Card</label>
                  <select
                    value={form.job_card_id}
                    style={inp2}
                    disabled={!form.workshop_customer_id}
                    onChange={(e) => {
                      const s = jobCards.find(
                        (j) => j.id === parseInt(e.target.value),
                      );
                      setForm((p) => ({
                        ...p,
                        job_card_id: e.target.value,
                        job_card_number: s?.job_card_number || "",
                      }));
                    }}
                  >
                    <option value="">Select job card...</option>
                    {jobCards.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.job_card_number}
                        {j.item ? ` — ${j.item}` : ""}
                      </option>
                    ))}
                  </select>
                </div> */}
                <div>
                  <label style={lbl}>Product *</label>
                  <input
                    type="text"
                    value={form.product}
                    placeholder="Product name"
                    style={inp2}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, product: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label style={lbl}>Quantity</label>
                  <input
                    type="text"
                    value={form.quantity}
                    placeholder="Qty"
                    style={inp2}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, quantity: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label style={lbl}>Due Date</label>
                  <input
                    type="date"
                    value={form.due_date}
                    style={inp2}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, due_date: e.target.value }))
                    }
                  />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={lbl}>Description</label>
                  <input
                    type="text"
                    value={form.description}
                    placeholder="Description"
                    style={inp2}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, description: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="submit"
                  className="btn-save-project"
                  disabled={saving}
                >
                  {saving ? "⏳ Saving..." : "✓ Add Entry"}
                </button>
                <button
                  type="button"
                  className="btn-back"
                  onClick={() => {
                    setShowAddForm(false);
                    setForm({
                      product: "",
                      quantity: "",
                      description: "",
                      due_date: "",
                      workshop_customer_id: "",
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Info banner for regular users */}
        {user?.role === "user" && entries.length > 0 && (
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "8px",
              padding: "10px 16px",
              marginBottom: "16px",
              fontSize: "13px",
              color: "#1d4ed8",
            }}
          >
            📋 You can track the progress of your requests below. Click any card
            to see details.
          </div>
        )}

        {/* Entry Cards */}
        {entries.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 20px",
              color: "#9ca3af",
              background: "#fff",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📋</div>
            <h3
              style={{ color: "#4b5563", marginBottom: "6px", fontWeight: 600 }}
            >
              No entries yet
            </h3>
            <p style={{ fontSize: "14px" }}>
              Click <strong>+ New Entry</strong> to create the first purchasing
              request.
            </p>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {entries.map((entry) => {
              const step = getCompletedStep(entry);
              const isExpanded = expandedId === entry.id;
              const isOverdue =
                entry.due_date &&
                new Date(entry.due_date) < new Date() &&
                step < 5;
              const stepColor = STEPS[step].color;

              return (
                <div
                  key={entry.id}
                  style={{
                    background: "#fff",
                    border: `1px solid ${isExpanded ? "#d1d5db" : "#e5e7eb"}`,
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: isExpanded
                      ? "0 2px 8px rgba(0,0,0,0.08)"
                      : "0 1px 4px rgba(0,0,0,0.04)",
                    transition: "border-color 0.2s",
                  }}
                >
                  {/* Card summary — click to expand */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    style={{
                      padding: "14px 18px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      flexWrap: "wrap" as const,
                    }}
                  >
                    {/* <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#9ca3af",
                        minWidth: "24px",
                      }}
                    >
                      #{entry.id}
                    </span> */}

                    <div style={{ flex: 1, minWidth: "160px" }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "14px",
                          color: "#111827",
                        }}
                      >
                        {entry.product}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          marginTop: "2px",
                        }}
                      >
                        {entry.quantity && <span>Qty: {entry.quantity}</span>}
                        {entry.quantity && entry.due_date && (
                          <span style={{ margin: "0 6px" }}>·</span>
                        )}
                        {entry.due_date && (
                          <span
                            style={{ color: isOverdue ? "#dc2626" : "#6b7280" }}
                          >
                            {isOverdue ? "⚠️ " : ""}Due:{" "}
                            {fmtDate(entry.due_date)}
                          </span>
                        )}
                      </div>
                    </div>

                    {entry.job_card_number && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            `/workshop/customers/${entry.workshop_customer_id}/jobcards/${entry.job_card_id}`,
                          );
                        }}
                        style={{
                          background: "none",
                          border: "1px solid #c7d2fe",
                          borderRadius: "6px",
                          padding: "4px 10px",
                          cursor: "pointer",
                          color: "#4f46e5",
                          fontSize: "12px",
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        🔗 {entry.job_card_number}
                      </button>
                    )}

                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        flexShrink: 0,
                      }}
                    >
                      by{" "}
                      <strong style={{ color: "#374151" }}>
                        {entry.user_name || "—"}
                      </strong>
                    </div>

                    <div style={{ width: "230px", flexShrink: 0 }}>
                      <StepBar entry={entry} />
                    </div>

                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: step === 5 ? "#16a34a" : "#374151",
                        background: step === 5 ? "#f0fdf4" : "#f3f4f6",
                        border: `1px solid ${step === 5 ? "#bbf7d0" : "#e5e7eb"}`,
                        padding: "3px 10px",
                        borderRadius: "6px",
                        flexShrink: 0,
                      }}
                    >
                      {STEPS[step].icon} {STEPS[step].label}
                    </span>

                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(entry.id, entry.product);
                        }}
                        title="Delete entry"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#d1d5db",
                          fontSize: "16px",
                          padding: "2px 4px",
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "#ef4444")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "#d1d5db")
                        }
                      >
                        🗑️
                      </button>
                    )}

                    <span
                      style={{
                        color: "#9ca3af",
                        fontSize: "18px",
                        flexShrink: 0,
                        display: "inline-block",
                        transition: "transform 0.2s",
                        transform: isExpanded ? "rotate(180deg)" : "none",
                      }}
                    >
                      ⌄
                    </span>
                  </div>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <div style={{ borderTop: "1px solid #f3f4f6" }}>
                      <StagePanel
                        entry={entry}
                        userRole={user?.role || "user"}
                        onUpdate={handleUpdate}
                        inp={entryInputs[entry.id] || {}}
                        setInp={(field, value) =>
                          setEntryInputs((prev) => ({
                            ...prev,
                            [entry.id]: { ...prev[entry.id], [field]: value },
                          }))
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchasingDashboard;
