import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import companyLogo from "../../assets/mainlogo.png";
import "../customers/ProjectDashboard.css";
import { API_BASE } from "../../config";
import AppHeader from "../../components/AppHeader";

interface BOQItem {
  id: number;
  item_name: string;
  specification: string;
  part_number: string;
  remaining_quantity: number;
  available_quantity: number;
  boq_quantity: number;
}
interface Entry {
  id: number;
  entry_type: string;
  product: string;
  available_quantity: number;
  required_quantity: number;
  shortage_quantity: number;
  required_date: string;
  description: string;
  requested_by: string;
  boq_item_id: number;
  specification: string;
  part_number: string;
  created_at: string;
  // ── stage fields ──
  order_form_no: string;
  order_notes: string;
  order_saved_at: string;
  order_saved_by: string;
  approved: boolean;
  approved_at: string;
  approved_by: string;
  approved_quantity: string;
  po_no: string;
  po_saved_at: string;
  po_saved_by: string;
  invoice_no: string;
  invoice_saved_at: string;
  invoice_saved_by: string;
  purchase_date: string;
  drivers_name: string;
  vehicle_no: string;
  received: string;
  delivery_notes: string;
  driver_saved_at: string;
  driver_saved_by: string;
}

const fmtDate = (d: string) => {
  if (!d) return "—";
  const [y, m, day] = d.split("T")[0].split("-");
  return `${day} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][parseInt(m) - 1]} ${y}`;
};

// Strip trailing .00 / .50 → 5, 5.5 etc. Returns "—" for null/empty.
const fmtQty = (q: any) => {
  if (q === null || q === undefined || q === "") return "—";
  const n = parseFloat(String(q));
  if (isNaN(n)) return "—";
  return String(n); // parseFloat drops trailing zeros: 5.00 → 5, 5.50 → 5.5
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

const STEPS = [
  { label: "Request", icon: "📋" },
  { label: "Order", icon: "📝" },
  { label: "Approval", icon: "✓" },
  { label: "PO", icon: "🧾" },
  { label: "Invoice", icon: "🗂️" },
  { label: "Delivered", icon: "🚚" },
];

const getEntryStep = (e: Entry): number => {
  if (e.drivers_name || e.purchase_date) return 5;
  if (e.invoice_no) return 4;
  if (e.po_no) return 3;
  if (e.approved) return 2;
  if (e.order_form_no) return 1;
  return 0;
};

// Renders qty with strikethrough when admin changed it on approval
const renderEntryQty = (e: Entry) => {
  const orig = String(e.required_quantity ?? "");
  const approved = e.approved_quantity || "";
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
          {fmtQty(orig)}
        </span>
        <strong style={{ color: "#059669" }}>{approved}</strong>
      </span>
    );
  }
  return <span>{fmtQty(orig)}</span>;
};

// ── Per-entry stage panel ──
const EntryFlowPanel = ({
  entry,
  userRole,
  onSaveStage,
  onApprove,
}: {
  entry: Entry;
  userRole: string;
  onSaveStage: (entryId: number, action: string, data: any) => void;
  onApprove: (entryId: number, approvedQty: string) => void;
}) => {
  const completed = getEntryStep(entry);
  const [selectedTab, setSelectedTab] = useState(completed);
  const [draft, setDraft] = useState<any>({});
  const [approveQty, setApproveQty] = useState<string>("");

  useEffect(() => {
    setSelectedTab(getEntryStep(entry));
    setDraft({});
    setApproveQty(
      entry.approved_quantity || String(entry.required_quantity || ""),
    );
  }, [entry.id]);

  const isAdmin = userRole === "admin";
  const isOffice = ["office", "office_admin", "admin", "data_entry"].includes(
    userRole,
  );
  const canApprove = ["admin", "office_admin"].includes(userRole);
  const isStores = ["stores", "office", "office_admin", "admin"].includes(
    userRole,
  );

  const fStyle: React.CSSProperties = {
    width: "100%",
    padding: "7px 10px",
    fontSize: "13px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    background: "#fff",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    color: "#6b7280",
    marginBottom: "4px",
    textTransform: "uppercase",
  };
  const saveBtnStyle: React.CSSProperties = {
    background: "#1f2937",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
    marginTop: "8px",
  };

  // Lock = stage has saved_at; admin can always edit
  const isStageLocked = (stageKey: string) => {
    if (isAdmin) return false;
    const key = `${stageKey}_saved_at` as keyof Entry;
    return !!entry[key];
  };

  const SavedBadge = ({ at, by }: { at: string; by: string }) =>
    at ? (
      <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "6px" }}>
        ✓ Saved {fmtDT(at)} by <strong>{by}</strong>
      </div>
    ) : null;

  const setField = (k: string, v: string) =>
    setDraft((d: any) => ({ ...d, [k]: v }));

  const renderTab = (tab: number) => {
    if (tab === 0) {
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
            gap: "14px",
          }}
        >
          <div>
            <span style={labelStyle}>Product</span>
            <span>{entry.product || "—"}</span>
          </div>
          <div>
            <span style={labelStyle}>Specification</span>
            <span>{entry.specification || "—"}</span>
          </div>
          <div>
            <span style={labelStyle}>Part No</span>
            <span>{entry.part_number || "—"}</span>
          </div>
          <div>
            <span style={labelStyle}>Quantity</span>
            {renderEntryQty(entry)}
          </div>
          <div>
            <span style={labelStyle}>Required Date</span>
            <span>
              {entry.required_date ? fmtDate(entry.required_date) : "—"}
            </span>
          </div>
          <div>
            <span style={labelStyle}>Requested By</span>
            <span>{entry.requested_by || "—"}</span>
          </div>
          {entry.description && (
            <div style={{ gridColumn: "span 2" }}>
              <span style={labelStyle}>Description</span>
              <span>{entry.description}</span>
            </div>
          )}
        </div>
      );
    }

    if (tab === 1) {
      const locked = isStageLocked("order");
      return (
        <div style={{ maxWidth: "500px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div>
              <span style={labelStyle}>Order Form No</span>
              {!isOffice || locked ? (
                <div style={{ fontSize: "13px" }}>
                  {entry.order_form_no || "—"}
                </div>
              ) : (
                <input
                  style={fStyle}
                  value={draft.order_form_no ?? entry.order_form_no ?? ""}
                  onChange={(e) => setField("order_form_no", e.target.value)}
                />
              )}
            </div>
            <div>
              <span style={labelStyle}>Notes</span>
              {!isOffice || locked ? (
                <div style={{ fontSize: "13px" }}>
                  {entry.order_notes || "—"}
                </div>
              ) : (
                <input
                  style={fStyle}
                  value={draft.order_notes ?? entry.order_notes ?? ""}
                  onChange={(e) => setField("order_notes", e.target.value)}
                />
              )}
            </div>
          </div>
          <SavedBadge at={entry.order_saved_at} by={entry.order_saved_by} />
          {isOffice && !locked && (
            <button
              style={saveBtnStyle}
              onClick={() =>
                onSaveStage(entry.id, "order", {
                  order_form_no: draft.order_form_no ?? entry.order_form_no,
                  order_notes: draft.order_notes ?? entry.order_notes,
                })
              }
            >
              Save Order
            </button>
          )}
        </div>
      );
    }

    if (tab === 2) {
      if (entry.approved) {
        return (
          <div>
            <div style={{ color: "#059669", fontWeight: 600 }}>
              ✓ Approved by {entry.approved_by} on {fmtDT(entry.approved_at)}
            </div>
            <div style={{ marginTop: "8px" }}>
              <span style={labelStyle}>Approved Qty</span>
              {renderEntryQty(entry)}
            </div>
          </div>
        );
      }
      if (canApprove) {
        return (
          <div style={{ maxWidth: "400px" }}>
            <div>
              <span style={labelStyle}>Approved Quantity</span>
              <input
                style={{ ...fStyle, width: "120px" }}
                value={approveQty}
                onChange={(e) => setApproveQty(e.target.value)}
              />
              <div
                style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}
              >
                Original: {fmtQty(entry.required_quantity)} — change here if you
                want to approve a different qty
              </div>
            </div>
            <button
              style={{ ...saveBtnStyle, background: "#059669" }}
              onClick={() => onApprove(entry.id, approveQty)}
            >
              ✓ Approve
            </button>
          </div>
        );
      }
      return (
        <div style={{ fontStyle: "italic", color: "#9ca3af" }}>
          ⏳ Waiting for approval.
        </div>
      );
    }

    if (tab === 3) {
      if (!entry.approved)
        return (
          <div style={{ fontStyle: "italic", color: "#9ca3af" }}>
            Requires approval first.
          </div>
        );
      const locked = isStageLocked("po");
      return (
        <div style={{ maxWidth: "300px" }}>
          <span style={labelStyle}>PO Number</span>
          {!isOffice || locked ? (
            <div style={{ fontSize: "13px" }}>{entry.po_no || "—"}</div>
          ) : (
            <input
              style={fStyle}
              value={draft.po_no ?? entry.po_no ?? ""}
              onChange={(e) => setField("po_no", e.target.value)}
            />
          )}
          <SavedBadge at={entry.po_saved_at} by={entry.po_saved_by} />
          {isOffice && !locked && (
            <button
              style={saveBtnStyle}
              onClick={() =>
                onSaveStage(entry.id, "po", {
                  po_no: draft.po_no ?? entry.po_no,
                })
              }
            >
              Save PO
            </button>
          )}
        </div>
      );
    }

    if (tab === 4) {
      const locked = isStageLocked("invoice");
      return (
        <div style={{ maxWidth: "300px" }}>
          <span style={labelStyle}>Invoice Number</span>
          {!isOffice || locked ? (
            <div style={{ fontSize: "13px" }}>{entry.invoice_no || "—"}</div>
          ) : (
            <input
              style={fStyle}
              value={draft.invoice_no ?? entry.invoice_no ?? ""}
              onChange={(e) => setField("invoice_no", e.target.value)}
            />
          )}
          <SavedBadge at={entry.invoice_saved_at} by={entry.invoice_saved_by} />
          {isOffice && !locked && (
            <button
              style={saveBtnStyle}
              onClick={() =>
                onSaveStage(entry.id, "invoice", {
                  invoice_no: draft.invoice_no ?? entry.invoice_no,
                })
              }
            >
              Save Invoice
            </button>
          )}
        </div>
      );
    }

    if (tab === 5) {
      const locked = isStageLocked("driver");
      return (
        <div style={{ maxWidth: "520px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            {[
              { k: "purchase_date", l: "Purchase Date", type: "date" },
              { k: "drivers_name", l: "Driver" },
              { k: "vehicle_no", l: "Vehicle" },
              { k: "received", l: "Received By" },
            ].map((f) => (
              <div key={f.k}>
                <span style={labelStyle}>{f.l}</span>
                {!isStores || locked ? (
                  <div style={{ fontSize: "13px" }}>
                    {f.k === "purchase_date" && (entry as any)[f.k]
                      ? fmtDate((entry as any)[f.k])
                      : (entry as any)[f.k] || "—"}
                  </div>
                ) : (
                  <input
                    type={f.type || "text"}
                    style={fStyle}
                    value={draft[f.k] ?? (entry as any)[f.k] ?? ""}
                    onChange={(e) => setField(f.k, e.target.value)}
                  />
                )}
              </div>
            ))}
            <div style={{ gridColumn: "span 2" }}>
              <span style={labelStyle}>Notes</span>
              {!isStores || locked ? (
                <div style={{ fontSize: "13px" }}>
                  {entry.delivery_notes || "—"}
                </div>
              ) : (
                <input
                  style={fStyle}
                  value={draft.delivery_notes ?? entry.delivery_notes ?? ""}
                  onChange={(e) => setField("delivery_notes", e.target.value)}
                />
              )}
            </div>
          </div>
          <SavedBadge at={entry.driver_saved_at} by={entry.driver_saved_by} />
          {isStores && !locked && (
            <button
              style={{ ...saveBtnStyle, background: "#16a34a" }}
              onClick={() =>
                onSaveStage(entry.id, "driver", {
                  purchase_date: draft.purchase_date ?? entry.purchase_date,
                  drivers_name: draft.drivers_name ?? entry.drivers_name,
                  vehicle_no: draft.vehicle_no ?? entry.vehicle_no,
                  received: draft.received ?? entry.received,
                  delivery_notes: draft.delivery_notes ?? entry.delivery_notes,
                })
              }
            >
              Save Delivery
            </button>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "160px",
        background: "#fafafa",
        borderTop: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minWidth: "140px",
          borderRight: "1px solid #e5e7eb",
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
                padding: "10px 14px",
                fontSize: "12px",
                fontWeight: 600,
                color: isSelected ? "#111827" : done ? "#374151" : "#9ca3af",
                background: isSelected ? "#f3f4f6" : "transparent",
                borderLeft: isSelected
                  ? "3px solid #1f2937"
                  : "3px solid transparent",
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>{done && i < completed ? "✓" : s.icon}</span>
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1, padding: "16px 20px" }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#111827",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: "12px",
          }}
        >
          {STEPS[selectedTab].icon} {STEPS[selectedTab].label}
        </div>
        {renderTab(selectedTab)}
      </div>
    </div>
  );
};

const CustomerPurchasingDashboard = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const location = useLocation();

  const [user, setUser] = useState<any>(null);
  const [customerName, setCustomerName] = useState(
    location.state?.customer?.name || "",
  );
  const [entries, setEntries] = useState<Entry[]>([]);
  const [boqItems, setBOQItems] = useState<BOQItem[]>([]);
  const [showBOQForm, setShowBOQForm] = useState(false);
  const [showNonBOQForm, setShowNonBOQForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedBOQItem, setSelectedBOQItem] = useState<BOQItem | null>(null);
  const [boqSearch, setBOQSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [expandedEntryId, setExpandedEntryId] = useState<number | null>(null);

  // Tab control: "customer" = the two customer tables, "boq" = BOQ master
  const [activeTab, setActiveTab] = useState<"customer" | "boq">("customer");

  // BOQ master management (from BOQPage)
  const [showBOQMasterForm, setShowBOQMasterForm] = useState(false);
  const [editingBOQItem, setEditingBOQItem] = useState<BOQItem | null>(null);
  const [boqMasterForm, setBOQMasterForm] = useState({
    item_name: "",
    specification: "",
    part_number: "",
    boq_quantity: "",
    available_quantity: "",
  });
  const [savingBOQMaster, setSavingBOQMaster] = useState(false);

  const [boqForm, setBOQForm] = useState({
    boq_item_id: "",
    product: "",
    specification: "",
    available_quantity: "",
    required_quantity: "",
    required_date: "",
    description: "",
  });
  const [nonBOQForm, setNonBOQForm] = useState({
    product: "",
    specification: "",
    part_number: "",
    required_quantity: "",
    required_date: "",
    description: "",
  });

  const token = () => localStorage.getItem("token");
  const hdr = () => ({ Authorization: `Bearer ${token()}` });
  const BASE = `${API_BASE}/boq/customer/${customerId}/entries`;

  const isAdmin = user?.role === "admin";
  const canAddBOQ = ["admin", "data_entry"].includes(user?.role || ""); // add new items
  const canEditBOQ = ["admin", "data_entry"].includes(user?.role || ""); // controls Actions column visibility
  const canViewBOQ = true; // all roles can view the BOQ Master tab

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
    fetchEntries();
    fetchBOQItems();
    if (!customerName) fetchCustomer();
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      const r = await axios.get(
        `${API_BASE}/purchasing/customers/${customerId}`,
        { headers: hdr() },
      );
      if (r.data.customer) setCustomerName(r.data.customer.name);
    } catch {}
  };

  const fetchEntries = async () => {
    try {
      const r = await axios.get(BASE, { headers: hdr() });
      setEntries(r.data.entries || []);
    } catch {}
  };

  // const fetchBOQItems = async () => {
  //   try {
  //     const r = await axios.get("${API_BASE}/boq", {
  //       headers: hdr(),
  //     });
  //     setBOQItems(r.data.items || []);
  //   } catch {}
  // };
  const fetchBOQItems = async () => {
    try {
      const r = await axios.get(`${API_BASE}/boq?customer_id=${customerId}`, {
        headers: hdr(),
      });
      setBOQItems(r.data.items || []);
    } catch {}
  };

  // Step 1: choose product
  const handleSelectProduct = (name: string) => {
    setSelectedProduct(name);
    setBOQSearch(name);
    setShowDropdown(false);
    setSelectedBOQItem(null);
    setBOQForm((p) => ({
      ...p,
      product: name,
      boq_item_id: "",
      available_quantity: "",
    }));
  };

  // Step 2: choose specification (resolves the exact boq_item row)
  const handleSelectSpec = (item: BOQItem) => {
    setSelectedBOQItem(item);
    setBOQForm((p) => ({
      ...p,
      boq_item_id: String(item.id),
      product: item.item_name,
      specification: item.specification || "",
      available_quantity: String(
        parseFloat(String(item.remaining_quantity)) || 0,
      ),
    }));
  };

  const handleBOQSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boqForm.product.trim()) {
      alert("Product is required");
      return;
    }
    setSaving(true);
    try {
      await axios.post(
        BASE,
        { ...boqForm, entry_type: "boq" },
        { headers: hdr() },
      );
      setBOQForm({
        boq_item_id: "",
        product: "",
        specification: "",
        available_quantity: "",
        required_quantity: "",
        required_date: "",
        description: "",
      });
      setBOQSearch("");
      setSelectedBOQItem(null);
      setShowBOQForm(false);
      fetchEntries();
      fetchBOQItems();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to add");
    } finally {
      setSaving(false);
    }
  };

  const handleNonBOQSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nonBOQForm.product.trim()) {
      alert("Product is required");
      return;
    }
    setSaving(true);
    try {
      await axios.post(
        BASE,
        { ...nonBOQForm, entry_type: "non_boq" },
        { headers: hdr() },
      );
      setNonBOQForm({
        product: "",
        specification: "",
        part_number: "",
        required_quantity: "",
        required_date: "",
        description: "",
      });
      setShowNonBOQForm(false);
      fetchEntries();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to add");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this entry?")) return;
    try {
      await axios.delete(`${BASE}/${id}`, { headers: hdr() });
      fetchEntries();
      fetchBOQItems();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete");
    }
  };

  const handleSaveStage = async (
    entryId: number,
    action: string,
    data: any,
  ) => {
    try {
      const r = await axios.put(`${BASE}/${entryId}/${action}`, data, {
        headers: hdr(),
      });
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? r.data.entry : e)),
      );
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to save");
    }
  };

  const handleApprove = async (entryId: number, approvedQty: string) => {
    try {
      const r = await axios.put(
        `${BASE}/${entryId}/approve`,
        { approved_quantity: approvedQty },
        { headers: hdr() },
      );
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? r.data.entry : e)),
      );
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to approve");
    }
  };
  // ── BOQ MASTER handlers ──
  const handleBOQMasterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBOQMaster(true);
    try {
      if (editingBOQItem) {
        await axios.put(`${API_BASE}/boq/${editingBOQItem.id}`, boqMasterForm, {
          headers: hdr(),
        });
      } else {
        await axios.post(
          `${API_BASE}/boq`,
          { ...boqMasterForm, customer_id: customerId },
          { headers: hdr() },
        );
      }
      setBOQMasterForm({
        item_name: "",
        specification: "",
        part_number: "",
        boq_quantity: "",
        available_quantity: "",
      });
      setShowBOQMasterForm(false);
      setEditingBOQItem(null);
      fetchBOQItems();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to save");
    } finally {
      setSavingBOQMaster(false);
    }
  };

  const handleBOQMasterDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await axios.delete(`${API_BASE}/boq/${id}`, {
        headers: hdr(),
      });
      fetchBOQItems();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete");
    }
  };

  const startEditBOQMaster = (item: BOQItem) => {
    setEditingBOQItem(item);
    setBOQMasterForm({
      item_name: item.item_name,
      specification: item.specification,
      part_number: item.part_number,
      boq_quantity: String(item.boq_quantity),
      available_quantity: String(item.available_quantity),
    });
    setShowBOQMasterForm(true);
  };

  const boqEntries = entries.filter((e) => e.entry_type === "boq");
  const nonBOQEntries = entries.filter((e) => e.entry_type === "non_boq");
  // distinct products for this customer (by item_name)
  const distinctProducts = Array.from(
    new Set(boqItems.map((i) => i.item_name)),
  ).filter((name) => name.toLowerCase().includes(boqSearch.toLowerCase()));

  // specifications available under the selected product
  const specsForProduct = boqItems.filter(
    (i) => i.item_name === selectedProduct,
  );
  // Block "-", "+", and "e" in number inputs so only positive numbers can be typed
  const blockNeg = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault();
  };
  // Clamp a typed value to >= 0 (handles paste / spinner)
  const posOnly = (v: string) => {
    if (v === "") return "";
    const n = parseFloat(v);
    return isNaN(n) || n < 0 ? "0" : v;
  };

  const inp: React.CSSProperties = {
    width: "100%",
    padding: "7px 10px",
    fontSize: "13px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
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
  const th: React.CSSProperties = {
    padding: "10px 14px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#374151",
    background: "#f9fafb",
    textAlign: "left" as const,
    borderBottom: "1px solid #e5e7eb",
  };
  const td = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: "10px 14px",
    fontSize: "13px",
    borderBottom: "1px solid #f3f4f6",
    ...extra,
  });

  return (
    <div className="project-dashboard">
      {/* Header */}
      {/* <div className="portal-header">
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
          <span className="user-icon">👤</span>
          <span className="username">{user?.username}</span>
        </div>
      </div> */}
      <AppHeader />

      <div className="project-main-content">
        <div className="project-header-row">
          <div>
            <h2 style={{ margin: 0 }}>{customerName}</h2>
            <p
              style={{
                color: "#6b7280",
                fontSize: "0.875rem",
                marginTop: "4px",
              }}
            >
              Purchasing Dashboard
            </p>
          </div>
          <button
            className="btn-back"
            onClick={() => navigate("/purchasing/customer-list")}
          >
            ← Back
          </button>
        </div>

        {/* ── TAB BAR ── */}
        {canViewBOQ && (
          <div
            style={{
              display: "flex",
              gap: "4px",
              marginBottom: "20px",
              borderBottom: "2px solid #e0e0e0",
            }}
          >
            <button
              onClick={() => setActiveTab("customer")}
              style={{
                padding: "10px 18px",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                borderBottom:
                  activeTab === "customer"
                    ? "3px solid #667eea"
                    : "3px solid transparent",
                background: "none",
                cursor: "pointer",
                color: activeTab === "customer" ? "#667eea" : "#555",
                marginBottom: "-2px",
              }}
            >
              📋 Customer Purchasing
            </button>
            <button
              onClick={() => setActiveTab("boq")}
              style={{
                padding: "10px 18px",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                borderBottom:
                  activeTab === "boq"
                    ? "3px solid #0891b2"
                    : "3px solid transparent",
                background: "none",
                cursor: "pointer",
                color: activeTab === "boq" ? "#0891b2" : "#555",
                marginBottom: "-2px",
              }}
            >
              📊 BOQ Master
            </button>
          </div>
        )}

        {/* ══ CUSTOMER TAB ══ */}
        {activeTab === "customer" && (
          <>
            {/* ── TABLE 1: Items in BOQ ── */}
            <div style={{ marginBottom: "32px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
                    Items in BOQ
                  </h3>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
                    {boqEntries.length} entries
                  </p>
                </div>
                {!showBOQForm && (
                  <button
                    className="btn-save-project"
                    onClick={async () => {
                      await fetchBOQItems();
                      setShowBOQForm(true);
                    }}
                  >
                    + Add Entry
                  </button>
                )}
              </div>

              {/* BOQ Add Form */}
              {showBOQForm && (
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "20px 24px",
                    marginBottom: "16px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  }}
                >
                  <form onSubmit={handleBOQSubmit}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(180px, 1fr))",
                        gap: "12px",
                        marginBottom: "16px",
                      }}
                    >
                      {/* Searchable BOQ product dropdown */}
                      {/* Step 1: Product dropdown */}
                      <div
                        style={{ position: "relative", gridColumn: "span 2" }}
                      >
                        <label style={lbl}>Product (BOQ) *</label>
                        <input
                          value={boqSearch}
                          placeholder="Search products..."
                          style={inp}
                          onChange={(e) => {
                            setBOQSearch(e.target.value);
                            setShowDropdown(true);
                            setSelectedProduct("");
                            setSelectedBOQItem(null);
                            setBOQForm((p) => ({
                              ...p,
                              boq_item_id: "",
                              product: "",
                              specification: "",
                              available_quantity: "",
                            }));
                          }}
                          onFocus={() => setShowDropdown(true)}
                        />
                        {showDropdown && distinctProducts.length > 0 && (
                          <div
                            style={{
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              right: 0,
                              background: "#fff",
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                              zIndex: 100,
                              maxHeight: "200px",
                              overflowY: "auto",
                            }}
                          >
                            {distinctProducts.map((name) => (
                              <div
                                key={name}
                                onClick={() => handleSelectProduct(name)}
                                style={{
                                  padding: "10px 14px",
                                  cursor: "pointer",
                                  borderBottom: "1px solid #f3f4f6",
                                  fontSize: "13px",
                                  fontWeight: 500,
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background = "#f9fafb")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background = "#fff")
                                }
                              >
                                {name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Step 2: Specification dropdown */}
                      <div style={{ gridColumn: "span 2" }}>
                        <label style={lbl}>Specification *</label>
                        <select
                          value={boqForm.boq_item_id}
                          style={inp}
                          disabled={!selectedProduct}
                          onChange={(e) => {
                            const item = specsForProduct.find(
                              (i) => String(i.id) === e.target.value,
                            );
                            if (item) handleSelectSpec(item);
                          }}
                        >
                          <option value="">
                            {selectedProduct
                              ? "Select specification..."
                              : "Select a product first"}
                          </option>
                          {specsForProduct.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.specification || "(no spec)"} — Remaining:{" "}
                              {fmtQty(item.remaining_quantity)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={lbl}>Available Qty</label>
                        <input
                          value={boqForm.available_quantity}
                          style={{
                            ...inp,
                            background: "#f9fafb",
                            color: "#6b7280",
                          }}
                          readOnly
                          placeholder="Auto-filled"
                        />
                      </div>
                      <div>
                        <label style={lbl}>Required Qty *</label>
                        <input
                          type="number"
                          min="0"
                          value={boqForm.required_quantity}
                          style={inp}
                          placeholder="0"
                          onKeyDown={blockNeg}
                          onChange={(e) =>
                            setBOQForm((p) => ({
                              ...p,
                              required_quantity: posOnly(e.target.value),
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label style={lbl}>Required Date</label>
                        <input
                          type="date"
                          value={boqForm.required_date}
                          style={inp}
                          onChange={(e) =>
                            setBOQForm((p) => ({
                              ...p,
                              required_date: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div style={{ gridColumn: "span 2" }}>
                        <label style={lbl}>Description</label>
                        <input
                          value={boqForm.description}
                          style={inp}
                          placeholder="Description"
                          onChange={(e) =>
                            setBOQForm((p) => ({
                              ...p,
                              description: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    {/* Show shortage warning */}
                    {selectedBOQItem &&
                      boqForm.required_quantity &&
                      parseFloat(boqForm.required_quantity) >
                        selectedBOQItem.remaining_quantity && (
                        <div
                          style={{
                            background: "#fef2f2",
                            border: "1px solid #fecaca",
                            borderRadius: "8px",
                            padding: "10px 14px",
                            marginBottom: "12px",
                            fontSize: "13px",
                            color: "#dc2626",
                          }}
                        >
                          ⚠️ Shortage: Required{" "}
                          <strong>{boqForm.required_quantity}</strong> but only{" "}
                          <strong>{selectedBOQItem.remaining_quantity}</strong>{" "}
                          available. The entry will be split —{" "}
                          <strong>{selectedBOQItem.remaining_quantity}</strong>{" "}
                          normal +{" "}
                          <strong>
                            {parseFloat(boqForm.required_quantity) -
                              selectedBOQItem.remaining_quantity}
                          </strong>{" "}
                          in red.
                        </div>
                      )}

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="submit"
                        className="btn-save-project"
                        disabled={saving || !selectedBOQItem}
                      >
                        {saving ? "Saving..." : "✓ Add Entry"}
                      </button>
                      <button
                        type="button"
                        className="btn-back"
                        onClick={() => {
                          setShowBOQForm(false);
                          setBOQSearch("");
                          setSelectedBOQItem(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* BOQ Entries Table */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  overflow: "hidden",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {/* <th style={th}>#</th> */}
                      <th style={{ ...th, width: "30px" }}></th>
                      <th style={th}>Product</th>
                      <th style={th}>Specification</th>
                      <th style={th}>Part No</th>
                      <th style={th}>Available Qty</th>
                      <th style={th}>Required Qty</th>
                      <th style={th}>Required Date</th>
                      <th style={th}>Description</th>
                      <th style={th}>Requested By</th>
                      {isAdmin && <th style={th}></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {boqEntries.length === 0 ? (
                      <tr>
                        <td
                          colSpan={11}
                          style={td({
                            textAlign: "center",
                            color: "#9ca3af",
                            padding: "40px",
                          })}
                        >
                          No BOQ entries yet.
                        </td>
                      </tr>
                    ) : (
                      boqEntries.map((entry) => {
                        const hasShortage = entry.shortage_quantity > 0;
                        return (
                          <>
                            {/* Normal row */}
                            <tr
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#f9fafb")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = "#fff")
                              }
                            >
                              <td
                                style={td({
                                  width: "30px",
                                  textAlign: "center",
                                  cursor: "pointer",
                                })}
                                onClick={() =>
                                  setExpandedEntryId(
                                    expandedEntryId === entry.id
                                      ? null
                                      : entry.id,
                                  )
                                }
                              >
                                <span
                                  style={{
                                    display: "inline-block",
                                    transition: "transform 0.2s",
                                    transform:
                                      expandedEntryId === entry.id
                                        ? "rotate(90deg)"
                                        : "none",
                                    color: "#6b7280",
                                  }}
                                >
                                  ▶
                                </span>
                              </td>
                              <td style={td({ fontWeight: 500 })}>
                                {entry.product}
                              </td>
                              <td style={td()}>{entry.specification || "—"}</td>
                              <td style={td()}>{entry.part_number || "—"}</td>
                              <td style={td()}>
                                {fmtQty(entry.available_quantity ?? "—")}
                              </td>
                              <td style={td({ fontWeight: 600 })}>
                                {hasShortage
                                  ? fmtQty(entry.available_quantity)
                                  : fmtQty(entry.required_quantity)}
                              </td>
                              <td style={td()}>
                                {entry.required_date
                                  ? fmtDate(entry.required_date)
                                  : "—"}
                              </td>
                              <td style={td({ color: "#6b7280" })}>
                                {entry.description || "—"}
                              </td>
                              <td style={td()}>{entry.requested_by || "—"}</td>
                              {isAdmin && (
                                <td style={td({ textAlign: "center" })}>
                                  <button
                                    onClick={() => handleDelete(entry.id)}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      color: "#d1d5db",
                                      fontSize: "16px",
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
                                </td>
                              )}
                            </tr>

                            {/* Shortage row in red */}
                            {hasShortage && (
                              <tr
                                key={`${entry.id}-shortage`}
                                style={{ background: "#fff5f5" }}
                              >
                                <td style={td()}></td>
                                <td
                                  style={td({
                                    color: "#dc2626",
                                    fontWeight: 500,
                                  })}
                                >
                                  {entry.product}{" "}
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      background: "#fecaca",
                                      padding: "1px 6px",
                                      borderRadius: "4px",
                                    }}
                                  >
                                    SHORTAGE
                                  </span>
                                </td>
                                <td style={td({ color: "#dc2626" })}>
                                  {entry.specification || "—"}
                                </td>
                                <td style={td({ color: "#dc2626" })}>
                                  {entry.part_number || "—"}
                                </td>
                                <td style={td({ color: "#dc2626" })}>0</td>
                                <td
                                  style={td({
                                    color: "#dc2626",
                                    fontWeight: 700,
                                  })}
                                >
                                  {fmtQty(entry.shortage_quantity)}
                                </td>
                                <td style={td({ color: "#dc2626" })}>
                                  {entry.required_date
                                    ? fmtDate(entry.required_date)
                                    : "—"}
                                </td>
                                <td style={td({ color: "#dc2626" })}>
                                  {entry.description || "—"}
                                </td>
                                <td style={td({ color: "#dc2626" })}>
                                  {entry.requested_by || "—"}
                                </td>
                                {isAdmin && <td style={td()}></td>}
                              </tr>
                            )}

                            {expandedEntryId === entry.id && (
                              <tr>
                                <td
                                  colSpan={isAdmin ? 9 : 8}
                                  style={{ padding: 0 }}
                                >
                                  <EntryFlowPanel
                                    entry={entry}
                                    userRole={user?.role || "user"}
                                    onSaveStage={handleSaveStage}
                                    onApprove={handleApprove}
                                  />
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── TABLE 2: Items NOT in BOQ ── */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
                    Items Not in BOQ
                  </h3>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
                    {nonBOQEntries.length} entries
                  </p>
                </div>
                {!showNonBOQForm && (
                  <button
                    className="btn-save-project"
                    style={{ background: "#ea580c" }}
                    onClick={() => setShowNonBOQForm(true)}
                  >
                    + Add Entry
                  </button>
                )}
              </div>

              {/* Non-BOQ Add Form */}
              {showNonBOQForm && (
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid #fed7aa",
                    borderRadius: "12px",
                    padding: "20px 24px",
                    marginBottom: "16px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  }}
                >
                  <form onSubmit={handleNonBOQSubmit}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(180px, 1fr))",
                        gap: "12px",
                        marginBottom: "16px",
                      }}
                    >
                      <div>
                        <label style={lbl}>Product *</label>
                        <input
                          value={nonBOQForm.product}
                          style={inp}
                          placeholder="Product name"
                          onChange={(e) =>
                            setNonBOQForm((p) => ({
                              ...p,
                              product: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                      <div>
                        <label style={lbl}>Specification</label>
                        <input
                          value={nonBOQForm.specification}
                          style={inp}
                          placeholder="e.g. 2HP, 220V"
                          onChange={(e) =>
                            setNonBOQForm((p) => ({
                              ...p,
                              specification: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label style={lbl}>Part Number</label>
                        <input
                          value={nonBOQForm.part_number}
                          style={inp}
                          placeholder="Part no."
                          onChange={(e) =>
                            setNonBOQForm((p) => ({
                              ...p,
                              part_number: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label style={lbl}>Quantity</label>
                        <input
                          type="number"
                          min="0"
                          value={nonBOQForm.required_quantity}
                          style={inp}
                          placeholder="0"
                          onKeyDown={blockNeg}
                          onChange={(e) =>
                            setNonBOQForm((p) => ({
                              ...p,
                              required_quantity: posOnly(e.target.value),
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label style={lbl}>Required Date</label>
                        <input
                          type="date"
                          value={nonBOQForm.required_date}
                          style={inp}
                          onChange={(e) =>
                            setNonBOQForm((p) => ({
                              ...p,
                              required_date: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div style={{ gridColumn: "span 2" }}>
                        <label style={lbl}>Description</label>
                        <input
                          value={nonBOQForm.description}
                          style={inp}
                          placeholder="Description"
                          onChange={(e) =>
                            setNonBOQForm((p) => ({
                              ...p,
                              description: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="submit"
                        className="btn-save-project"
                        style={{ background: "#ea580c" }}
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "✓ Add Entry"}
                      </button>
                      <button
                        type="button"
                        className="btn-back"
                        onClick={() => setShowNonBOQForm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Non-BOQ Table */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: "12px",
                  border: "1px solid #fed7aa",
                  overflow: "hidden",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th
                        style={{ ...th, background: "#fff7ed", width: "30px" }}
                      ></th>
                      <th style={{ ...th, background: "#fff7ed" }}>Product</th>
                      <th style={{ ...th, background: "#fff7ed" }}>
                        Specification
                      </th>
                      <th style={{ ...th, background: "#fff7ed" }}>Part No</th>
                      <th style={{ ...th, background: "#fff7ed" }}>Quantity</th>
                      <th style={{ ...th, background: "#fff7ed" }}>
                        Required Date
                      </th>
                      <th style={{ ...th, background: "#fff7ed" }}>
                        Description
                      </th>
                      <th style={{ ...th, background: "#fff7ed" }}>
                        Requested By
                      </th>
                      {isAdmin && (
                        <th style={{ ...th, background: "#fff7ed" }}></th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {nonBOQEntries.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          style={td({
                            textAlign: "center",
                            color: "#9ca3af",
                            padding: "40px",
                          })}
                        >
                          No non-BOQ entries yet.
                        </td>
                      </tr>
                    ) : (
                      nonBOQEntries.map((entry) => (
                        <React.Fragment key={entry.id}>
                          <tr
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "#fff7ed")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "#fff")
                            }
                          >
                            <td
                              style={td({
                                width: "30px",
                                textAlign: "center",
                                cursor: "pointer",
                              })}
                              onClick={() =>
                                setExpandedEntryId(
                                  expandedEntryId === entry.id
                                    ? null
                                    : entry.id,
                                )
                              }
                            >
                              <span
                                style={{
                                  display: "inline-block",
                                  transition: "transform 0.2s",
                                  transform:
                                    expandedEntryId === entry.id
                                      ? "rotate(90deg)"
                                      : "none",
                                  color: "#6b7280",
                                }}
                              >
                                ▶
                              </span>
                            </td>
                            <td
                              style={td({ fontWeight: 600, color: "#ea580c" })}
                            >
                              {entry.product}
                            </td>
                            <td style={td()}>{entry.specification || "—"}</td>
                            <td style={td()}>{entry.part_number || "—"}</td>
                            <td style={td()}>
                              {fmtQty(entry.required_quantity)}
                            </td>
                            <td style={td()}>
                              {entry.required_date
                                ? fmtDate(entry.required_date)
                                : "—"}
                            </td>
                            <td style={td({ color: "#6b7280" })}>
                              {entry.description || "—"}
                            </td>
                            <td style={td()}>{entry.requested_by || "—"}</td>
                            {isAdmin && (
                              <td style={td({ textAlign: "center" })}>
                                <button
                                  onClick={() => handleDelete(entry.id)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#d1d5db",
                                    fontSize: "16px",
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
                              </td>
                            )}
                          </tr>
                          {expandedEntryId === entry.id && (
                            <tr>
                              <td
                                colSpan={isAdmin ? 9 : 8}
                                style={{ padding: 0 }}
                              >
                                <EntryFlowPanel
                                  entry={entry}
                                  userRole={user?.role || "user"}
                                  onSaveStage={handleSaveStage}
                                  onApprove={handleApprove}
                                />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══ BOQ MASTER TAB ══ */}
        {activeTab === "boq" && canViewBOQ && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
                  BOQ Master Items
                </h3>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  {boqItems.length} items in BOQ
                </p>
              </div>
              {canAddBOQ && !showBOQMasterForm && (
                <button
                  className="btn-save-project"
                  style={{ background: "#0891b2" }}
                  onClick={() => {
                    setShowBOQMasterForm(true);
                    setEditingBOQItem(null);
                    setBOQMasterForm({
                      specification: "",
                      item_name: "",
                      part_number: "",
                      boq_quantity: "",
                      available_quantity: "",
                    });
                  }}
                >
                  + Add Item
                </button>
              )}
            </div>

            {/* BOQ Master Add/Edit Form */}
            {canAddBOQ && showBOQMasterForm && (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "20px 24px",
                  marginBottom: "16px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 16px",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                  }}
                >
                  {editingBOQItem ? "Edit BOQ Item" : "New BOQ Item"}
                </h3>
                <form onSubmit={handleBOQMasterSubmit}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(180px, 1fr))",
                      gap: "12px",
                      marginBottom: "16px",
                    }}
                  >
                    <div>
                      <label style={lbl}>Item Name *</label>
                      <input
                        value={boqMasterForm.item_name}
                        style={inp}
                        placeholder="Item name"
                        onChange={(e) =>
                          setBOQMasterForm((p) => ({
                            ...p,
                            item_name: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <label style={lbl}>Specification</label>
                      <input
                        value={boqMasterForm.specification}
                        style={inp}
                        placeholder=""
                        onChange={(e) =>
                          setBOQMasterForm((p) => ({
                            ...p,
                            specification: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label style={lbl}>Part Number</label>
                      <input
                        value={boqMasterForm.part_number}
                        style={inp}
                        placeholder="Part no."
                        onChange={(e) =>
                          setBOQMasterForm((p) => ({
                            ...p,
                            part_number: e.target.value,
                          }))
                        }
                      />
                    </div>
                    {/* <div>
                      <label style={lbl}>BOQ Quantity</label>
                      <input
                        type="number"
                        min="0"
                        value={boqMasterForm.boq_quantity}
                        style={inp}
                        placeholder="0"
                        onKeyDown={blockNeg}
                        onChange={(e) =>
                          setBOQMasterForm((p) => ({
                            ...p,
                            boq_quantity: posOnly(e.target.value),
                          }))
                        }
                      />
                    </div> */}
                    <div>
                      <label style={lbl}>Available Quantity</label>
                      <input
                        type="number"
                        min="0"
                        value={boqMasterForm.available_quantity}
                        style={inp}
                        placeholder="0"
                        onKeyDown={blockNeg}
                        onChange={(e) =>
                          setBOQMasterForm((p) => ({
                            ...p,
                            available_quantity: posOnly(e.target.value),
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="submit"
                      className="btn-save-project"
                      disabled={savingBOQMaster}
                    >
                      {savingBOQMaster
                        ? "Saving..."
                        : editingBOQItem
                          ? "✓ Update"
                          : "✓ Add Item"}
                    </button>
                    <button
                      type="button"
                      className="btn-back"
                      onClick={() => {
                        setShowBOQMasterForm(false);
                        setEditingBOQItem(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* BOQ Master Table */}
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                overflow: "hidden",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>Item Name</th>
                    <th style={th}>Specification</th>
                    <th style={th}>Part Number</th>
                    {/* <th style={th}>BOQ Qty</th> */}
                    <th style={th}>Available Qty</th>
                    <th style={th}>Remaining Qty</th>
                    {isAdmin && (
                      <th style={{ ...th, textAlign: "center" as const }}>
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {boqItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isAdmin ? 7 : 6}
                        style={td({
                          textAlign: "center",
                          color: "#9ca3af",
                          padding: "40px",
                        })}
                      >
                        {canEditBOQ
                          ? "No BOQ items yet. Click + Add Item to get started."
                          : "No BOQ items yet."}
                      </td>
                    </tr>
                  ) : (
                    boqItems.map((item) => {
                      const remaining =
                        parseFloat(String(item.remaining_quantity)) || 0;
                      const isLow =
                        remaining < parseFloat(String(item.boq_quantity)) * 0.2;
                      const isDepleted = remaining <= 0;
                      return (
                        <tr
                          key={item.id}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#f9fafb")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "#fff")
                          }
                        >
                          <td style={td({ fontWeight: 500 })}>
                            {item.item_name}
                          </td>
                          <td style={td()}>{item.specification || "—"}</td>
                          <td style={td()}>{item.part_number || "—"}</td>
                          {/* <td style={td()}>{fmtQty(item.boq_quantity)}</td> */}
                          <td style={td()}>
                            {fmtQty(item.available_quantity)}
                          </td>
                          <td style={td()}>
                            <span
                              style={{
                                fontWeight: 600,
                                color: isDepleted
                                  ? "#dc2626"
                                  : isLow
                                    ? "#d97706"
                                    : "#16a34a",
                                background: isDepleted
                                  ? "#fef2f2"
                                  : isLow
                                    ? "#fffbeb"
                                    : "#f0fdf4",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                fontSize: "12px",
                              }}
                            >
                              {remaining <= 0 ? "0 (Depleted)" : remaining}
                            </span>
                          </td>
                          {isAdmin && (
                            <td style={td({ textAlign: "center" })}>
                              <div
                                style={{
                                  display: "flex",
                                  gap: "6px",
                                  justifyContent: "center",
                                }}
                              >
                                <button
                                  onClick={() => startEditBOQMaster(item)}
                                  style={{
                                    background: "#f3f4f6",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "4px",
                                    padding: "4px 10px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                  }}
                                >
                                  ✏️ Edit
                                </button>
                                {isAdmin && (
                                  <button
                                    onClick={() =>
                                      handleBOQMasterDelete(
                                        item.id,
                                        item.item_name,
                                      )
                                    }
                                    style={{
                                      background: "#fef2f2",
                                      border: "1px solid #fecaca",
                                      borderRadius: "4px",
                                      padding: "4px 10px",
                                      cursor: "pointer",
                                      fontSize: "12px",
                                      fontWeight: 600,
                                      color: "#dc2626",
                                    }}
                                  >
                                    🗑️
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerPurchasingDashboard;
