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

interface FlowProduct {
  id: number;
  product: string;
  item_number: string;
  quantity: string;
  order_form_no: string;
  order_notes: string;
  po_no: string;
  invoice_no: string;
  purchase_date: string;
  drivers_name: string;
  vehicle_no: string;
  received: string;
  delivery_notes: string;
  order_saved_at: string;
  order_saved_by: string;
  po_saved_at: string;
  po_saved_by: string;
  invoice_saved_at: string;
  invoice_saved_by: string;
  driver_saved_at: string;
  driver_saved_by: string;
  approved: boolean;
  approved_at: string;
  approved_by: string;
  approved_quantity: string;
}

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
// Renders qty cell — strikethrough original + show approved if admin changed it
const renderQty = (r: FlowProduct) => {
  const orig = r.quantity || "";
  const approved = r.approved_quantity || "";
  if (approved && approved !== orig) {
    return (
      <span>
        <span
          style={{
            textDecoration: "line-through",
            color: "#9ca3af",
            marginRight: "6px",
          }}
        >
          {orig || "—"}
        </span>
        <strong style={{ color: "#059669" }}>{approved}</strong>
      </span>
    );
  }
  return <span>{orig || "—"}</span>;
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

const getCompletedStep = (entry: Entry): number => {
  if (entry.drivers_name || entry.purchase_date) return 5;
  if (entry.invoice_no) return 4;
  if (entry.po_no) return 3;
  if (entry.approved) return 2;
  if (entry.order_form_no) return 1;
  return 0;
};
// ── Helper: format saved-at info ──
const fmtSavedAt = (at: string, by: string) => {
  if (!at) return null;
  return `Saved ${fmtDT(at)} by ${by || "?"}`;
};

// ── Per-row product table component (OUTSIDE StagePanel to keep input focus) ──
const ProductRowsTable = ({
  rows,
  stage,
  columns,
  isAdmin,
  isStageEditor,
  onSaveRow,
  onApproveRow,
  showApprove,
  editableQty,
}: {
  rows: FlowProduct[];
  stage: string;
  columns: { field: keyof FlowProduct; label: string; type?: string }[];
  isAdmin: boolean;
  isStageEditor: boolean;
  onSaveRow: (row: FlowProduct) => void;
  onApproveRow?: (row: FlowProduct) => void;
  showApprove?: boolean;
  editableQty?: boolean;
}) => {
  // local editable copy — keyed by row id so React preserves input focus
  const [edits, setEdits] = useState<Record<number, Partial<FlowProduct>>>({});

  // reset edits when the underlying rows change (after a save)
  useEffect(() => {
    setEdits({});
  }, [
    rows
      .map((r) => r.id + ":" + r[`${stage}_saved_at` as keyof FlowProduct])
      .join("|"),
  ]);

  const getVal = (r: FlowProduct, f: keyof FlowProduct) =>
    edits[r.id]?.[f] !== undefined
      ? (edits[r.id]![f] as string)
      : (r[f] as string) || "";

  const setCell = (id: number, field: keyof FlowProduct, value: string) =>
    setEdits((e) => ({ ...e, [id]: { ...(e[id] || {}), [field]: value } }));

  const isRowLocked = (r: FlowProduct) => {
    // Locked = this stage's saved_at is set. Admins can always edit.
    if (isAdmin) return false;
    const savedAtKey = `${stage}_saved_at` as keyof FlowProduct;
    return !!r[savedAtKey];
  };

  if (rows.length === 0) {
    return (
      <div
        style={{
          color: "#9ca3af",
          fontSize: "13px",
          fontStyle: "italic",
          padding: "12px 0",
        }}
      >
        No products yet. Save the job card's item list to generate product rows.
      </div>
    );
  }

  const thS: React.CSSProperties = {
    padding: "8px 10px",
    fontSize: "11px",
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
    textAlign: "left",
    borderBottom: "1px solid #e5e7eb",
    background: "#f9fafb",
  };
  const tdS: React.CSSProperties = {
    padding: "6px 10px",
    fontSize: "13px",
    borderBottom: "1px solid #f3f4f6",
    verticalAlign: "top",
  };

  return (
    <div
      style={{
        overflowX: "auto",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thS}>Product</th>
            <th style={thS}>Item No</th>
            <th style={thS}>Qty</th>
            {columns.map((c) => (
              <th key={String(c.field)} style={thS}>
                {c.label}
              </th>
            ))}
            <th style={thS}>Saved</th>
            <th style={thS}>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const locked = isRowLocked(r);
            const savedAt = r[
              `${stage}_saved_at` as keyof FlowProduct
            ] as string;
            const savedBy = r[
              `${stage}_saved_by` as keyof FlowProduct
            ] as string;
            return (
              <tr key={r.id}>
                <td style={{ ...tdS, fontWeight: 500 }}>{r.product || "—"}</td>
                <td style={tdS}>{r.item_number || "—"}</td>
                <td style={tdS}>
                  {editableQty && (isAdmin || isStageEditor) && !r.approved ? (
                    <input
                      type="text"
                      value={
                        edits[r.id]?.approved_quantity !== undefined
                          ? (edits[r.id]!.approved_quantity as string)
                          : r.approved_quantity || r.quantity || ""
                      }
                      onChange={(e) =>
                        setCell(r.id, "approved_quantity", e.target.value)
                      }
                      style={{
                        width: "80px",
                        padding: "5px 8px",
                        fontSize: "13px",
                        border: "1px solid #d1d5db",
                        borderRadius: "5px",
                        boxSizing: "border-box",
                      }}
                    />
                  ) : (
                    renderQty(r)
                  )}
                </td>
                {columns.map((c) => (
                  <td key={String(c.field)} style={tdS}>
                    {!isStageEditor || locked ? (
                      <span>{(r[c.field] as string) || "—"}</span>
                    ) : (
                      <input
                        type={c.type || "text"}
                        value={getVal(r, c.field)}
                        onChange={(e) => setCell(r.id, c.field, e.target.value)}
                        style={{
                          width: "100%",
                          padding: "5px 8px",
                          fontSize: "13px",
                          border: "1px solid #d1d5db",
                          borderRadius: "5px",
                          boxSizing: "border-box",
                        }}
                      />
                    )}
                  </td>
                ))}
                <td style={{ ...tdS, fontSize: "11px", color: "#6b7280" }}>
                  {savedAt ? fmtSavedAt(savedAt, savedBy) : "—"}
                </td>
                <td style={tdS}>
                  {showApprove ? (
                    r.approved ? (
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#059669",
                          fontWeight: 600,
                        }}
                      >
                        ✓ {r.approved_by}
                        <br />
                        {fmtDT(r.approved_at)}
                      </span>
                    ) : isAdmin || isStageEditor ? (
                      <button
                        onClick={() => {
                          const merged = {
                            ...r,
                            ...(edits[r.id] || {}),
                          } as FlowProduct;
                          // If admin didn't touch the qty, default approved_quantity to the original
                          if (!merged.approved_quantity) {
                            merged.approved_quantity = r.quantity;
                          }
                          onApproveRow?.(merged);
                        }}
                        style={{
                          background: "#059669",
                          color: "#fff",
                          border: "none",
                          borderRadius: "5px",
                          padding: "5px 12px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        ✓ Approve
                      </button>
                    ) : (
                      <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                        Pending
                      </span>
                    )
                  ) : isStageEditor && !locked ? (
                    <button
                      onClick={() => {
                        const merged = {
                          ...r,
                          ...(edits[r.id] || {}),
                        } as FlowProduct;
                        onSaveRow(merged);
                      }}
                      style={{
                        background: "#1f2937",
                        color: "#fff",
                        border: "none",
                        borderRadius: "5px",
                        padding: "5px 12px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      Save
                    </button>
                  ) : (
                    <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                      {locked ? "🔒 Saved" : "—"}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ── Stage Panel ───────────────────────────────────────────────────
const StagePanel = ({
  entry,
  userRole,
  onUpdate,
  inp,
  setInp,
  products,
  onSaveProductRow,
  onApproveProductRow,
}: {
  entry: Entry;
  userRole: string;
  onUpdate: (id: number, action: string, data: any) => void;
  inp: any;
  setInp: (field: string, value: string) => void;
  products: FlowProduct[];
  onSaveProductRow: (entryId: number, stage: string, row: FlowProduct) => void;
  onApproveProductRow: (entryId: number, row: FlowProduct) => void;
}) => {
  const completed = getCompletedStep(entry);
  const [selectedTab, setSelectedTab] = useState(completed);

  useEffect(() => {
    setSelectedTab(getCompletedStep(entry));
  }, [entry.id]);

  const isAdmin = userRole === "admin";
  const isOffice = ["office", "office_admin", "admin"].includes(userRole);
  const canApprove = ["admin", "office_admin"].includes(userRole);
  const isStores = ["stores", "office", "office_admin", "admin"].includes(
    userRole,
  );

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

  const renderTab = (tab: number) => {
    switch (tab) {
      case 0:
        return (
          <div>
            {/* Entry-level info */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              <ReadRow label="Requested By" value={entry.user_name} />
              <ReadRow
                label="Requested On"
                value={fmtDT(entry.user_datetime)}
              />
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
              {entry.description && (
                <div style={{ gridColumn: "span 2" }}>
                  <ReadRow label="Description" value={entry.description} />
                </div>
              )}
            </div>

            {/* Per-product requested list */}
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.4px",
                marginBottom: "8px",
              }}
            >
              Requested Items ({products.length})
            </div>
            <ProductRowsTable
              rows={products}
              stage="request"
              isAdmin={false}
              isStageEditor={false}
              columns={[]}
              onSaveRow={() => {}}
            />
          </div>
        );
      case 1:
        return (
          <ProductRowsTable
            rows={products}
            stage="order"
            isAdmin={isAdmin}
            isStageEditor={isOffice}
            columns={[
              { field: "order_form_no", label: "Order Form No" },
              { field: "order_notes", label: "Notes" },
            ]}
            onSaveRow={(row) => onSaveProductRow(entry.id, "order", row)}
          />
        );
      case 2:
        // Approval — per product (editable qty for admin/office_admin)
        return (
          <ProductRowsTable
            rows={products}
            stage="approve"
            isAdmin={isAdmin}
            isStageEditor={canApprove}
            columns={[]}
            showApprove
            editableQty
            onSaveRow={() => {}}
            onApproveRow={(row) => onApproveProductRow(entry.id, row)}
          />
        );
      case 3:
        return (
          <ProductRowsTable
            rows={products}
            stage="po"
            isAdmin={isAdmin}
            isStageEditor={isOffice}
            columns={[{ field: "po_no", label: "PO Number" }]}
            onSaveRow={(row) => onSaveProductRow(entry.id, "po", row)}
          />
        );
      case 4:
        return (
          <ProductRowsTable
            rows={products}
            stage="invoice"
            isAdmin={isAdmin}
            isStageEditor={isOffice}
            columns={[{ field: "invoice_no", label: "Invoice Number" }]}
            onSaveRow={(row) => onSaveProductRow(entry.id, "invoice", row)}
          />
        );
      case 5:
        return (
          <ProductRowsTable
            rows={products}
            stage="driver"
            isAdmin={isAdmin}
            isStageEditor={isStores}
            columns={[
              { field: "purchase_date", label: "Purchase Date", type: "date" },
              { field: "drivers_name", label: "Driver" },
              { field: "vehicle_no", label: "Vehicle" },
              { field: "received", label: "Received By" },
              { field: "delivery_notes", label: "Notes" },
            ]}
            onSaveRow={(row) => onSaveProductRow(entry.id, "driver", row)}
          />
        );
      default:
        return null;
    }
  };

  // The sidebar layout stays the same as before — copy from your existing render
  return (
    <div style={{ display: "flex", minHeight: "180px" }}>
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
            >
              <span style={{ fontSize: "14px" }}>
                {done && i < completed ? "✓" : s.icon}
              </span>
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1, padding: "18px 22px" }}>
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
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {STEPS[selectedTab].label}
          </span>
        </div>
        {renderTab(selectedTab)}
      </div>
    </div>
  );
};

// ── Progress Bar ─────────────────────────────────────────────────
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
                  ? i === 5
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

// ── Main Component ────────────────────────────────────────────────
// NOTE: ALL hooks must be inside this component — nothing outside
const PurchasingDashboard = () => {
  const navigate = useNavigate();
  const { customerId } = useParams(); // ← ONLY here, never outside
  const location = useLocation();

  const workshopCustomerId: string | undefined =
    location.state?.workshopCustomerId;
  const highlightEntryId: number | undefined = location.state?.highlightEntryId;

  const [user, setUser] = useState<User | null>(null);
  const [customerName, setCustomerName] = useState(
    location.state?.customer?.name || "",
  );
  const [entries, setEntries] = useState<Entry[]>([]);
  const [workshopCustomers, setWorkshopCustomers] = useState<
    WorkshopCustomer[]
  >([]);
  const [entryInputs, setEntryInputs] = useState<Record<number, any>>({});
  const [productsByEntry, setProductsByEntry] = useState<
    Record<number, FlowProduct[]>
  >({});
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

  // Scroll to highlighted entry once entries are rendered
  useEffect(() => {
    if (highlightEntryId && entries.length > 0) {
      const el = document.getElementById(`entry-${highlightEntryId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [entries, highlightEntryId]);

  const fetchCustomer = async () => {
    try {
      // Try workshop customers first (this is the workshop route)
      const r = await axios.get(
        `http://localhost:5000/api/workshop/customers`,
        { headers: hdr() },
      );
      const found = r.data.customers?.find(
        (c: any) => c.id === Number(customerId),
      );
      if (found) {
        setCustomerName(found.name);
        return;
      }

      // Fallback to purchasing customers
      const r2 = await axios.get(
        `http://localhost:5000/api/purchasing/customers/${customerId}`,
        { headers: hdr() },
      );
      if (r2.data.customer) setCustomerName(r2.data.customer.name);
    } catch {}
  };

  const fetchEntries = async () => {
    try {
      const url = `http://localhost:5000/api/purchasing/workshop-customers/${customerId}/entries`;
      console.log("Fetching entries from:", url);
      const r = await axios.get(url, { headers: hdr() });
      console.log("Entries response:", r.data);
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

      // Auto-expand and scroll to highlighted entry
      // Auto-expand and scroll to highlighted entry
      if (highlightEntryId) {
        setExpandedId(highlightEntryId);
        fetchProducts(highlightEntryId); // ← also fetch products
      }
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

  const fetchProducts = async (entryId: number) => {
    console.log(`[FETCH] fetchProducts called for entryId=${entryId}`);
    try {
      const r = await axios.get(
        `http://localhost:5000/api/purchasing/entries/${entryId}/products`,
        { headers: hdr() },
      );
      console.log(`[FETCH] response for entryId=${entryId}:`, r.data);
      setProductsByEntry((prev) => ({
        ...prev,
        [entryId]: r.data.products || [],
      }));
    } catch (err) {
      console.error(`[FETCH] failed for entryId=${entryId}:`, err);
    }
  };

  const handleSaveProductRow = async (
    entryId: number,
    stage: string,
    row: FlowProduct,
  ) => {
    try {
      const r = await axios.put(
        `http://localhost:5000/api/purchasing/entries/${entryId}/products`,
        { stage, products: [row] },
        { headers: hdr() },
      );
      setProductsByEntry((prev) => ({
        ...prev,
        [entryId]: r.data.products || [],
      }));
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to save row");
    }
  };

  const handleApproveProductRow = async (entryId: number, row: FlowProduct) => {
    try {
      const r = await axios.put(
        `http://localhost:5000/api/purchasing/entries/${entryId}/products`,
        {
          stage: "approve",
          products: [{ id: row.id, approved_quantity: row.approved_quantity }],
        },
        { headers: hdr() },
      );
      setProductsByEntry((prev) => ({
        ...prev,
        [entryId]: r.data.products || [],
      }));
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to approve");
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

              return (
                <div
                  key={entry.id}
                  id={`entry-${entry.id}`}
                  style={{
                    background: "#fff",
                    border: `1px solid ${
                      entry.id === highlightEntryId
                        ? "#667eea"
                        : isExpanded
                          ? "#d1d5db"
                          : "#e5e7eb"
                    }`,
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow:
                      entry.id === highlightEntryId
                        ? "0 0 0 3px #667eea30"
                        : isExpanded
                          ? "0 2px 8px rgba(0,0,0,0.08)"
                          : "0 1px 4px rgba(0,0,0,0.04)",
                    transition: "border-color 0.2s",
                  }}
                >
                  <div
                    onClick={() => {
                      const next = isExpanded ? null : entry.id;
                      console.log(
                        `[EXPAND] entry.id=${entry.id} next=${next} alreadyFetched=`,
                        productsByEntry[entry.id],
                      );
                      setExpandedId(next);
                      if (next && !productsByEntry[entry.id]) {
                        console.log(
                          `[EXPAND] calling fetchProducts(${entry.id})`,
                        );
                        fetchProducts(entry.id);
                      } else if (next) {
                        console.log(
                          `[EXPAND] skipping fetch — already have products`,
                        );
                      }
                    }}
                    style={{
                      padding: "14px 18px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      flexWrap: "wrap" as const,
                    }}
                  >
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
                        products={productsByEntry[entry.id] || []}
                        onSaveProductRow={handleSaveProductRow}
                        onApproveProductRow={handleApproveProductRow}
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
