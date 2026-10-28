// ============================================
// Workshop Job Card Detail
// Flow: GRN -> Item List -> Labor Sheet -> Dispatch Note
// Save as: client/src/pages/workshop/WorkshopJobCardDetail.tsx
// ============================================

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import companyLogo from "../../assets/mainlogo.png";
import "../customers/ProjectDashboard.css";

const API = "https://coolmanworkshop-production.up.railway.app/api";

interface User {
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

// ─── Local date / time helpers (browser local time, NOT UTC) ─────
const pad = (n: number) => String(n).padStart(2, "0");
const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const localTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const dateOnly = (v: any) => (v ? String(v).split("T")[0] : "");
const hhmm = (v: any) => (v ? String(v).slice(0, 5) : "");
const esc = (v: any) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] as string,
  );

// ─── Empty row / form factories ──────────────────────────────────
const emptyItem = () => ({
  date: "",
  time: "",
  due_date: "",
  item: "",
  item_number: "",
  quantity: "",
  remarks: "",
  order_form_no: "",
  po_no: "",
});
const emptyLabor = () => ({
  date: "",
  person: "",
  job_done: "",
  in_time: "",
  out_time: "",
});
type ItemRow = ReturnType<typeof emptyItem>;
type LaborRow = ReturnType<typeof emptyLabor>;

// Full job card record (kept complete so the PUT never blanks hidden columns)
const emptyMain = () => ({
  date: "",
  time: "",
  job_card_name: "",
  customer_name: "",
  contact_number: "",
  item: "",
  item_number: "",
  vehicle_number: "",
  company_reference: "",
  job_description: "",
  note: "",
  driver: "",
  driver_id_number: "",
  received_by: "",
  approved_by: "",
  workshop_received_date: "",
  workshop_received_time: "",
  workshop_received_note: "",
  workshop_received_by: "",
  finished_date: "",
  finished_time: "",
  finished_note: "",
  checked_by: "",
  stores_received_date: "",
  stores_received_time: "",
  stores_person: "",
  office_received_date: "",
  office_received_time: "",
  office_person: "",
  finalizing_note: "",
  status: "open",
});
const DATE_FIELDS = [
  "date",
  "workshop_received_date",
  "finished_date",
  "stores_received_date",
  "office_received_date",
];

const emptyGrn = () => ({
  date: "",
  time: "",
  vehicle_number: "",
  job_description: "",
  note: "",
  driver: "",
  driver_id_number: "",
  office_person: "",
});
const emptyDispatch = () => ({
  date: "",
  time: "",
  contact_detail: "",
  invoice_number: "",
  vehicle_number: "",
  driver: "",
  driver_id_number: "",
  office_person: "",
  stores_person: "",
});

const mapItems = (rows: any[]): ItemRow[] => [
  ...rows.map((i) => ({
    date: dateOnly(i.date),
    time: hhmm(i.time),
    due_date: dateOnly(i.due_date),
    item: i.item || "",
    item_number: i.item_number || "",
    quantity: i.quantity != null ? String(i.quantity) : "",
    remarks: i.remarks || "",
    order_form_no: i.order_form_no || "",
    po_no: i.po_no || "",
  })),
  ...Array.from({ length: Math.max(0, 10 - rows.length) }, emptyItem),
];
const mapLabor = (rows: any[]): LaborRow[] => [
  ...rows.map((l) => ({
    date: dateOnly(l.date),
    person: l.person || "",
    job_done: l.job_done || "",
    in_time: hhmm(l.in_time),
    out_time: hhmm(l.out_time),
  })),
  ...Array.from({ length: Math.max(0, 10 - rows.length) }, emptyLabor),
];

const TABS = ["GRN", "Item List", "Labor Sheet", "Dispatch Note"];
const TAB_ICONS = ["📥", "📋", "👷", "🚚"];

// ─── Shared styles ───────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "5px 8px",
  fontSize: "14px",
  border: "none",
  borderBottom: "1px solid #333",
  outline: "none",
  background: "transparent",
  boxSizing: "border-box",
  fontFamily: "inherit",
};
const cellStyle: React.CSSProperties = {
  border: "1px solid #333",
  padding: "4px 8px",
  verticalAlign: "middle",
  fontSize: "13px",
};
const labelStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: "12px",
  color: "#333",
  whiteSpace: "nowrap",
  padding: "4px 8px",
  border: "1px solid #333",
  background: "#f5f5f5",
  verticalAlign: "middle",
};
const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginBottom: "12px",
  fontSize: "13px",
};
const sigStyle: React.CSSProperties = {
  ...cellStyle,
  color: "#999",
  fontSize: "11px",
  fontStyle: "italic",
};

// ─── Small components (defined OUTSIDE the page to keep input focus) ─
const L = ({ children, w }: { children: React.ReactNode; w?: number }) => (
  <td style={{ ...labelStyle, width: w }}>{children}</td>
);
const C = ({
  children,
  span,
  style,
}: {
  children: React.ReactNode;
  span?: number;
  style?: React.CSSProperties;
}) => (
  <td colSpan={span} style={{ ...cellStyle, ...style }}>
    {children}
  </td>
);
const Inp = ({
  value,
  onChange,
  type = "text",
  placeholder,
  readOnly,
}: {
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
}) => (
  <input
    type={type}
    value={value}
    readOnly={readOnly}
    placeholder={placeholder}
    onChange={(e) => onChange?.(e.target.value)}
    style={{
      ...inputStyle,
      ...(readOnly ? { color: "#555", background: "#f9fafb" } : {}),
    }}
  />
);
const Area = ({
  value,
  onChange,
  height,
}: {
  value: string;
  onChange: (v: string) => void;
  height: string;
}) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    style={{ ...inputStyle, height, resize: "vertical", display: "block" }}
  />
);

const CompanyHeader = ({ subtitle }: { subtitle: string }) => (
  <div
    style={{
      textAlign: "center",
      marginBottom: "16px",
      paddingBottom: "12px",
      borderBottom: "2px solid #1a1a2e",
    }}
  >
    <div
      style={{
        fontSize: "18px",
        fontWeight: 900,
        color: "#1a1a2e",
        letterSpacing: "1px",
      }}
    >
      COOLMan Refrigeration (Pvt) Ltd
    </div>
    <div
      style={{
        fontSize: "15px",
        fontWeight: 700,
        color: "#333",
        marginTop: "4px",
      }}
    >
      {subtitle}
    </div>
  </div>
);

const DownloadBtn = ({
  section,
  label,
  onDownload,
}: {
  section: string;
  label: string;
  onDownload: (section: string) => void;
}) => (
  <button
    onClick={() => onDownload(section)}
    style={{
      padding: "6px 14px",
      background: "#fff",
      border: "1.5px solid #667eea",
      color: "#667eea",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: 600,
    }}
  >
    🖨️ Print / PDF {label}
  </button>
);

// Editable table cell
const TI = ({
  value,
  onChange,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) => (
  <td style={{ border: "1px solid #ccc", padding: "2px" }}>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "4px 6px",
        fontSize: "13px",
        border: "none",
        outline: "none",
        background: "transparent",
        fontFamily: "inherit",
        boxSizing: "border-box",
      }}
    />
  </td>
);
// Read-only (auto) table cell
const RO = ({ value }: { value: string }) => (
  <td
    style={{
      border: "1px solid #ccc",
      padding: "4px 8px",
      fontSize: "13px",
      background: "#f9fafb",
      color: "#555",
      whiteSpace: "nowrap",
    }}
  >
    {value || "—"}
  </td>
);

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

// ═════════════════════════════════════════════════════════════════
const WorkshopJobCardDetail = () => {
  const navigate = useNavigate();
  const { customerId, jobCardId } = useParams();
  const isNew = jobCardId === "new";

  const [user, setUser] = useState<User | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [jobCardNumber, setJobCardNumber] = useState("");
  const [purchasingEntryId, setPurchasingEntryId] = useState<number | null>(
    null,
  );
  const [purchasingCustId, setPurchasingCustId] = useState<number | null>(null);

  const [main, setMain] = useState(emptyMain);
  const [grn, setGrn] = useState(() => ({
    ...emptyGrn(),
    date: localDate(),
    time: localTime(),
  }));
  const [items, setItems] = useState<ItemRow[]>(() =>
    Array.from({ length: 10 }, emptyItem),
  );
  const [labor, setLabor] = useState<LaborRow[]>(() =>
    Array.from({ length: 10 }, emptyLabor),
  );
  const [dispatch, setDispatch] = useState(emptyDispatch);
  const [dispatchSaved, setDispatchSaved] = useState(false);

  const BASE = `${API}/workshop/customers/${customerId}/jobcards`;
  const headers = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const setM = (k: string, v: string) => setMain((s) => ({ ...s, [k]: v }));
  const setG = (k: string, v: string) => setGrn((s) => ({ ...s, [k]: v }));
  const setD = (k: string, v: string) => setDispatch((s) => ({ ...s, [k]: v }));

  // ── Load ───────────────────────────────────────────────────────
  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
    loadCustomer();
    if (isNew) {
      loadNextNumber();
    } else {
      fetchJobCard();
    }
  }, [jobCardId, customerId]);

  // Dispatch note auto-fills from the GRN until it has been saved
  useEffect(() => {
    if (activeTab === 3 && !dispatchSaved) {
      setDispatch((d) => ({
        ...d,
        date: localDate(),
        time: localTime(),
        contact_detail: main.contact_number,
        vehicle_number: grn.vehicle_number,
        driver: grn.driver,
        driver_id_number: grn.driver_id_number,
        office_person: grn.office_person,
      }));
    }
  }, [activeTab]);

  const loadCustomer = async () => {
    try {
      const res = await axios.get(`${API}/workshop/customers`, {
        headers: headers(),
      });
      const found = res.data.customers?.find(
        (c: any) => c.id === Number(customerId),
      );
      if (found) {
        setCustomerName(found.name);
        if (isNew) {
          setMain((s) => ({
            ...s,
            customer_name: found.name,
            contact_number: found.contact_number || "",
          }));
        }
      }
    } catch {}
  };

  const loadNextNumber = async () => {
    try {
      const r = await axios.get(`${API}/workshop/jobcards/next-number`, {
        headers: headers(),
      });
      setJobCardNumber(r.data.job_card_number || "");
    } catch {}
  };

  const fetchJobCard = async () => {
    try {
      const res = await axios.get(`${BASE}/${jobCardId}`, {
        headers: headers(),
      });
      const { jobcard, items: its, labor: lab, grn: g, dispatch: d } = res.data;
      setJobCardNumber(jobcard.job_card_number);
      setPurchasingEntryId(jobcard.purchasing_entry_id || null);
      setPurchasingCustId(jobcard.purchasing_customer_id || null);

      const m: any = emptyMain();
      Object.keys(m).forEach((k) => {
        const v = jobcard[k];
        if (v == null) return;
        m[k] = DATE_FIELDS.includes(k) ? dateOnly(v) : v;
      });
      setMain(m);

      setItems(mapItems(its || []));
      setLabor(mapLabor(lab || []));

      if (g) {
        setGrn({
          date: dateOnly(g.date),
          time: hhmm(g.time),
          vehicle_number: g.vehicle_number || "",
          job_description: g.job_description || "",
          note: g.note || "",
          driver: g.driver || "",
          driver_id_number: g.driver_id_number || "",
          office_person: g.office_person || "",
        });
      } else {
        // Older job cards: build the GRN from the job card record
        setGrn({
          date: m.date,
          time: hhmm(m.time),
          vehicle_number: m.vehicle_number,
          job_description: m.job_description,
          note: m.note,
          driver: m.driver,
          driver_id_number: m.driver_id_number,
          office_person: m.received_by,
        });
      }

      if (d) {
        setDispatchSaved(true);
        setDispatch({
          date: dateOnly(d.date),
          time: hhmm(d.time),
          contact_detail: d.contact_detail || "",
          invoice_number: d.invoice_number || "",
          vehicle_number: d.vehicle_number || "",
          driver: d.driver || "",
          driver_id_number: d.driver_id_number || "",
          office_person: d.office_person || "",
          stores_person: d.stores_person || "",
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ── Row helpers (auto date / time stamps) ──────────────────────
  const updateItem = (i: number, patch: Partial<ItemRow>) =>
    setItems((rows) =>
      rows.map((r, ri) => {
        if (ri !== i) return r;
        const next = { ...r, ...patch };
        if (!next.date && next.item.trim()) {
          next.date = localDate();
          next.time = localTime();
        }
        return next;
      }),
    );

  const updateLabor = (i: number, patch: Partial<LaborRow>) =>
    setLabor((rows) =>
      rows.map((r, ri) => {
        if (ri !== i) return r;
        const next = { ...r, ...patch };
        if (!next.date && (next.person.trim() || next.job_done.trim())) {
          next.date = localDate();
          if (!next.in_time) next.in_time = localTime();
        }
        return next;
      }),
    );

  // ── Save: GRN (creates the job card the first time) ────────────
  const handleSaveGRN = async () => {
    if (!main.job_card_name.trim() || !main.item.trim()) {
      alert("Job Card Name and Item are required");
      return;
    }
    setSaving(true);
    try {
      const date = isNew ? localDate() : grn.date || localDate();
      const time = isNew ? localTime() : grn.time || localTime();
      const mainPayload = {
        ...main,
        date,
        time,
        vehicle_number: grn.vehicle_number,
        job_description: grn.job_description,
        note: grn.note,
        driver: grn.driver,
        driver_id_number: grn.driver_id_number,
        received_by: grn.office_person,
      };
      const grnPayload = {
        ...grn,
        date,
        time,
        contact_detail: main.contact_number,
      };

      if (isNew) {
        const res = await axios.post(BASE, mainPayload, {
          headers: headers(),
        });
        const created = res.data.jobcard;
        await axios.post(`${BASE}/${created.id}/grn`, grnPayload, {
          headers: headers(),
        });
        navigate(`/workshop/customers/${customerId}/jobcards/${created.id}`, {
          replace: true,
        });
      } else {
        await axios.put(`${BASE}/${jobCardId}`, mainPayload, {
          headers: headers(),
        });
        await axios.post(`${BASE}/${jobCardId}/grn`, grnPayload, {
          headers: headers(),
        });
        alert("GRN saved!");
      }
    } catch {
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    setMain((s) => ({ ...s, status }));
    try {
      await axios.put(
        `${BASE}/${jobCardId}`,
        { ...main, status },
        { headers: headers() },
      );
    } catch {
      alert("Failed to update status");
    }
  };

  const handleSaveItems = async () => {
    const filled = items.filter((i) => i.item.trim());
    if (!filled.length) {
      alert("Add at least one item");
      return;
    }
    const missing = items
      .map((it, idx) =>
        it.item.trim() && !it.item_number.trim() ? idx + 1 : 0,
      )
      .filter(Boolean);
    if (missing.length) {
      alert(`Item No is required for row(s): ${missing.join(", ")}`);
      return;
    }
    const payload = filled.map((i) => ({
      ...i,
      date: i.date || localDate(),
      time: i.time || localTime(),
    }));
    setSaving(true);
    try {
      const res = await axios.post(
        `${BASE}/${jobCardId}/items`,
        { items: payload },
        { headers: headers() },
      );
      setItems(mapItems(res.data.items || []));
      alert("Item list saved!");
    } catch {
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLabor = async () => {
    const filled = labor.filter((l) => l.person.trim() || l.job_done.trim());
    if (!filled.length) {
      alert("Add at least one entry");
      return;
    }
    const payload = filled.map((l) => ({
      ...l,
      date: l.date || localDate(),
      in_time: l.in_time || localTime(),
    }));
    setSaving(true);
    try {
      await axios.post(
        `${BASE}/${jobCardId}/labor`,
        { labor: payload },
        { headers: headers() },
      );
      alert("Labor sheet saved!");
    } catch {
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDispatch = async () => {
    setSaving(true);
    try {
      await axios.post(
        `${BASE}/${jobCardId}/dispatch`,
        {
          ...dispatch,
          date: dispatch.date || localDate(),
          time: dispatch.time || localTime(),
        },
        { headers: headers() },
      );
      setDispatchSaved(true);
      setMain((s) => ({ ...s, status: "dispatched" }));
      alert("Dispatch note saved!");
    } catch {
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // ── Print / PDF ────────────────────────────────────────────────
  const handleDownload = (section: string) => {
    const top = `<table>
      <tr><td class="label">Job Card No</td><td><strong>${esc(jobCardNumber)}</strong></td><td class="label">Job Card Name</td><td><strong>${esc(main.job_card_name)}</strong></td></tr>
    </table>`;
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>${esc(jobCardNumber)}_${section}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #000; }
    h1 { text-align: center; font-size: 15px; margin-bottom: 2px; }
    h2 { text-align: center; font-size: 13px; margin-bottom: 10px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    td, th { border: 1px solid #000; padding: 4px 7px; font-size: 10px; vertical-align: middle; }
    th { background: #e0e0e0; font-weight: bold; text-align: left; }
    .label { font-weight: bold; background: #f0f0f0; white-space: nowrap; width: 1%; }
    @page { size: A4; margin: 12mm; }
    @media print { .no-print { display: none !important; } }
  </style></head><body>
  <div class="no-print" style="text-align:center;padding:12px;background:#667eea;color:#fff;font-size:13px;font-weight:600;margin-bottom:16px;">
    🖨️ Press Ctrl+P and choose "Save as PDF" to download
  </div>
  <h1>COOLMan Refrigeration (Pvt) Ltd</h1>`;

    if (section === "grn") {
      html += `<h2>Goods Received Note (GRN)</h2>${top}
    <table>
      <tr><td class="label">Date</td><td>${esc(grn.date)}</td><td class="label">Time</td><td>${esc(grn.time)}</td></tr>
      <tr><td class="label">Customer</td><td>${esc(main.customer_name)}</td><td class="label">Contact</td><td>${esc(main.contact_number)}</td></tr>
      <tr><td class="label">Item</td><td>${esc(main.item)}</td><td class="label">Item Number</td><td>${esc(main.item_number)}</td></tr>
      <tr><td class="label">Vehicle Number</td><td colspan="3">${esc(grn.vehicle_number)}</td></tr>
      <tr><td class="label">Job Description</td><td colspan="3">${esc(grn.job_description)}</td></tr>
      <tr><td class="label">Note</td><td colspan="3">${esc(grn.note)}</td></tr>
      <tr><td class="label">Driver</td><td>${esc(grn.driver)}</td><td class="label">ID Number</td><td>${esc(grn.driver_id_number)}</td></tr>
      <tr><td class="label">Office</td><td colspan="2">${esc(grn.office_person)}</td><td class="label">Signature: ________</td></tr>
    </table>`;
    } else if (section === "items") {
      html += `<h2>Workshop Item List</h2>${top}
    <table>
      <tr><th>No</th><th>Requested Date</th><th>Time</th><th>Due Date</th><th>Item</th><th>Item No</th><th>Qty</th><th>Remarks</th><th>Order Form No</th><th>PO No</th></tr>
      ${items
        .map(
          (it, i) =>
            `<tr><td>${i + 1}</td><td>${esc(it.date)}</td><td>${esc(it.time)}</td><td>${esc(it.due_date)}</td><td>${esc(it.item)}</td><td>${esc(it.item_number)}</td><td>${esc(it.quantity)}</td><td>${esc(it.remarks)}</td><td>${esc(it.order_form_no)}</td><td>${esc(it.po_no)}</td></tr>`,
        )
        .join("")}
    </table>`;
    } else if (section === "labor") {
      html += `<h2>Workshop Labor Sheet</h2>${top}
    <table>
      <tr><th>No</th><th>Date</th><th>Person</th><th>Job Done</th><th>In Time</th><th>Out Time</th></tr>
      ${labor
        .map(
          (l, i) =>
            `<tr><td>${i + 1}</td><td>${esc(l.date)}</td><td>${esc(l.person)}</td><td>${esc(l.job_done)}</td><td>${esc(l.in_time)}</td><td>${esc(l.out_time)}</td></tr>`,
        )
        .join("")}
    </table>`;
    } else if (section === "dispatch") {
      html += `<h2>Dispatch Note</h2>${top}
    <table>
      <tr><td class="label">Date</td><td>${esc(dispatch.date)}</td><td class="label">Time</td><td>${esc(dispatch.time)}</td></tr>
      <tr><td class="label">Customer</td><td>${esc(main.customer_name)}</td><td class="label">Contact</td><td>${esc(dispatch.contact_detail)}</td></tr>
      <tr><td class="label">Item</td><td>${esc(main.item)}</td><td class="label">Item Number</td><td>${esc(main.item_number)}</td></tr>
      <tr><td class="label">Invoice Number</td><td colspan="3">${esc(dispatch.invoice_number)}</td></tr>
      <tr><td class="label">Vehicle Number</td><td colspan="3">${esc(dispatch.vehicle_number)}</td></tr>
      <tr><td class="label">Driver</td><td>${esc(dispatch.driver)}</td><td class="label">ID Number</td><td>${esc(dispatch.driver_id_number)}</td></tr>
      <tr><td class="label">Office</td><td colspan="2">${esc(dispatch.office_person)}</td><td class="label">Signature: ________</td></tr>
      <tr><td class="label">Stores</td><td colspan="2">${esc(dispatch.stores_person)}</td><td class="label">Signature: ________</td></tr>
    </table>`;
    }

    html += `<script>window.onload = function () { window.print(); };</script></body></html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  };

  const clr = customerName ? getColor(customerName) : "#667eea";
  const initials = customerName ? getInitials(customerName) : "WS";

  // ═══════════════════════════ RENDER ═══════════════════════════
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
              style={{ backgroundColor: clr }}
            >
              {initials}
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
            <h2 style={{ margin: 0 }}>
              {isNew ? "🆕 New Job Card" : `🗂️ ${jobCardNumber}`}
              {main.job_card_name && (
                <span
                  style={{
                    marginLeft: "12px",
                    fontSize: "0.9em",
                    color: "#4f46e5",
                    fontWeight: 500,
                  }}
                >
                  — {main.job_card_name}
                </span>
              )}
            </h2>
            {!isNew && (
              <select
                value={main.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                style={{
                  marginTop: "6px",
                  padding: "4px 10px",
                  fontSize: "13px",
                  border: "1.5px solid #ddd",
                  borderRadius: "20px",
                  background: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="dispatched">Dispatched</option>
              </select>
            )}
          </div>
          <button
            className="btn-back"
            onClick={() =>
              navigate(`/workshop/customers/${customerId}/jobcards`)
            }
          >
            ← Back to Job Cards
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            marginBottom: "20px",
            borderBottom: "2px solid #e0e0e0",
            flexWrap: "wrap",
          }}
        >
          {TABS.map((tab, i) => (
            <button
              key={i}
              disabled={isNew && i > 0}
              onClick={() => setActiveTab(i)}
              style={{
                padding: "10px 18px",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                borderBottom:
                  activeTab === i
                    ? "3px solid #667eea"
                    : "3px solid transparent",
                background: "none",
                cursor: isNew && i > 0 ? "not-allowed" : "pointer",
                color:
                  activeTab === i
                    ? "#667eea"
                    : isNew && i > 0
                      ? "#bbb"
                      : "#555",
                transition: "all 0.2s",
                marginBottom: "-2px",
              }}
            >
              {TAB_ICONS[i]} {tab}
            </button>
          ))}
        </div>

        {/* Job card number chip + purchasing link */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            marginBottom: "16px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              padding: "8px 14px",
              background: "#f0f4ff",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#667eea",
              border: "1.5px solid #c7d7ff",
            }}
          >
            🗂️ Job Card: {jobCardNumber || "..."}
          </div>
          {isNew && (
            <span style={{ fontSize: "12px", color: "#888" }}>
              This number is confirmed when you save the GRN.
            </span>
          )}
          {!isNew && purchasingEntryId && purchasingCustId && (
            <button
              onClick={() =>
                navigate(
                  `/purchasing/workshop/customers/${customerId}/dashboard`,
                  {
                    state: {
                      customer: { id: Number(customerId), name: customerName },
                      highlightEntryId: purchasingEntryId,
                    },
                  },
                )
              }
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                background: "#667eea",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              🛒 View Purchasing Entry
            </button>
          )}
        </div>

        {/* ═══ TAB 0 — GRN ═══ */}
        {activeTab === 0 && (
          <div style={{ maxWidth: "800px" }}>
            <CompanyHeader subtitle="Goods Received Note (GRN)" />
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <L w={120}>Job Card No</L>
                  <C>
                    <strong>{jobCardNumber || "..."}</strong>
                  </C>
                  <L w={120}>Job Card Name *</L>
                  <C>
                    <Inp
                      value={main.job_card_name}
                      onChange={(v) => setM("job_card_name", v)}
                      placeholder="e.g. AC Compressor Repair"
                    />
                  </C>
                </tr>
                <tr>
                  <L>Date</L>
                  <C>
                    <Inp value={grn.date} type="date" readOnly />
                  </C>
                  <L>Time</L>
                  <C>
                    <Inp value={grn.time} type="time" readOnly />
                  </C>
                </tr>
                <tr>
                  <L>Customer</L>
                  <C>
                    <Inp value={main.customer_name} readOnly />
                  </C>
                  <L>Contact Detail</L>
                  <C>
                    <Inp
                      value={main.contact_number}
                      onChange={(v) => setM("contact_number", v)}
                    />
                  </C>
                </tr>
                <tr>
                  <L>Item *</L>
                  <C>
                    <Inp
                      value={main.item}
                      onChange={(v) => setM("item", v)}
                      placeholder="Item description"
                    />
                  </C>
                  <L>Item Number</L>
                  <C>
                    <Inp
                      value={main.item_number}
                      onChange={(v) => setM("item_number", v)}
                    />
                  </C>
                </tr>
                <tr>
                  <L>Vehicle Number</L>
                  <C span={3}>
                    <Inp
                      value={grn.vehicle_number}
                      onChange={(v) => setG("vehicle_number", v)}
                    />
                  </C>
                </tr>
                <tr>
                  <L>Job Description</L>
                  <C span={3} style={{ height: "60px" }}>
                    <Area
                      value={grn.job_description}
                      onChange={(v) => setG("job_description", v)}
                      height="55px"
                    />
                  </C>
                </tr>
                <tr>
                  <L>Note</L>
                  <C span={3} style={{ height: "50px" }}>
                    <Area
                      value={grn.note}
                      onChange={(v) => setG("note", v)}
                      height="45px"
                    />
                  </C>
                </tr>
                <tr>
                  <L>Driver</L>
                  <C>
                    <Inp
                      value={grn.driver}
                      onChange={(v) => setG("driver", v)}
                    />
                  </C>
                  <L>ID Number</L>
                  <C>
                    <Inp
                      value={grn.driver_id_number}
                      onChange={(v) => setG("driver_id_number", v)}
                    />
                  </C>
                </tr>
                <tr>
                  <L>Office</L>
                  <C span={2}>
                    <Inp
                      value={grn.office_person}
                      onChange={(v) => setG("office_person", v)}
                    />
                  </C>
                  <td style={sigStyle}>Signature: ___________</td>
                </tr>
              </tbody>
            </table>
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
                marginTop: "12px",
                flexWrap: "wrap",
              }}
            >
              {!isNew && (
                <DownloadBtn
                  section="grn"
                  label="GRN"
                  onDownload={handleDownload}
                />
              )}
              <button
                className="btn-save-project"
                onClick={handleSaveGRN}
                disabled={saving}
              >
                {saving
                  ? "⏳ Saving..."
                  : isNew
                    ? "💾 Create Job Card (Save GRN)"
                    : "💾 Save GRN"}
              </button>
            </div>
          </div>
        )}

        {/* ═══ TAB 1 — ITEM LIST ═══ */}
        {activeTab === 1 && (
          <div style={{ maxWidth: "1150px" }}>
            <CompanyHeader subtitle="Workshop Item List" />
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <L w={120}>Job Card No</L>
                  <C>
                    <strong>{jobCardNumber}</strong>
                  </C>
                  <L w={120}>Job Card Name</L>
                  <C>
                    <strong>{main.job_card_name}</strong>
                  </C>
                </tr>
              </tbody>
            </table>
            <div style={{ overflowX: "auto" }}>
              <table style={{ ...tableStyle, minWidth: "1000px" }}>
                <thead>
                  <tr>
                    {[
                      "No",
                      "Requested Date",
                      "Time",
                      "Due Date",
                      "Item *",
                      "Item No *",
                      "Quantity",
                      "Remarks",
                      "Order Form No",
                      "PO No",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{ ...labelStyle, textAlign: "center" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i}>
                      <td
                        style={{
                          ...cellStyle,
                          textAlign: "center",
                          fontWeight: 600,
                          width: "36px",
                          background: "#f5f5f5",
                        }}
                      >
                        {i + 1}
                      </td>
                      <RO value={it.date} />
                      <RO value={it.time} />
                      <TI
                        value={it.due_date}
                        type="date"
                        onChange={(v) => updateItem(i, { due_date: v })}
                      />
                      <TI
                        value={it.item}
                        onChange={(v) => updateItem(i, { item: v })}
                      />
                      <TI
                        value={it.item_number}
                        onChange={(v) => updateItem(i, { item_number: v })}
                      />
                      <TI
                        value={it.quantity}
                        type="number"
                        onChange={(v) => updateItem(i, { quantity: v })}
                      />
                      <TI
                        value={it.remarks}
                        onChange={(v) => updateItem(i, { remarks: v })}
                      />
                      <RO value={it.order_form_no} />
                      <RO value={it.po_no} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: "12px", color: "#888", margin: "0 0 8px" }}>
              Requested date / time and Order Form No are generated
              automatically. PO No fills in once it is entered in Purchasing.
            </p>
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "space-between",
                marginTop: "12px",
                flexWrap: "wrap",
              }}
            >
              <button
                className="btn-add-small"
                onClick={() => setItems((r) => [...r, emptyItem()])}
              >
                + Add Row
              </button>
              <div style={{ display: "flex", gap: "10px" }}>
                <DownloadBtn
                  section="items"
                  label="Item List"
                  onDownload={handleDownload}
                />
                <button
                  className="btn-save-project"
                  onClick={handleSaveItems}
                  disabled={saving}
                >
                  {saving ? "⏳ Saving..." : "💾 Save Item List"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB 2 — LABOR SHEET ═══ */}
        {activeTab === 2 && (
          <div style={{ maxWidth: "900px" }}>
            <CompanyHeader subtitle="Workshop Labor Sheet" />
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <L w={120}>Job Card No</L>
                  <C>
                    <strong>{jobCardNumber}</strong>
                  </C>
                  <L w={120}>Job Card Name</L>
                  <C>
                    <strong>{main.job_card_name}</strong>
                  </C>
                </tr>
              </tbody>
            </table>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {[
                    "No",
                    "Date",
                    "Person",
                    "Job Done",
                    "In Time",
                    "Out Time",
                  ].map((h) => (
                    <th key={h} style={{ ...labelStyle, textAlign: "center" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {labor.map((lb, i) => (
                  <tr key={i}>
                    <td
                      style={{
                        ...cellStyle,
                        textAlign: "center",
                        fontWeight: 600,
                        width: "36px",
                        background: "#f5f5f5",
                      }}
                    >
                      {i + 1}
                    </td>
                    <RO value={lb.date} />
                    <TI
                      value={lb.person}
                      onChange={(v) => updateLabor(i, { person: v })}
                    />
                    <TI
                      value={lb.job_done}
                      onChange={(v) => updateLabor(i, { job_done: v })}
                    />
                    <TI
                      value={lb.in_time}
                      type="time"
                      onChange={(v) => updateLabor(i, { in_time: v })}
                    />
                    <TI
                      value={lb.out_time}
                      type="time"
                      onChange={(v) => updateLabor(i, { out_time: v })}
                    />
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: "12px", color: "#888", margin: "0 0 8px" }}>
              Date and In Time are filled automatically when you start a row (In
              Time can still be edited). Enter Out Time when the work is done.
            </p>
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "space-between",
                marginTop: "12px",
                flexWrap: "wrap",
              }}
            >
              <button
                className="btn-add-small"
                onClick={() => setLabor((l) => [...l, emptyLabor()])}
              >
                + Add Row
              </button>
              <div style={{ display: "flex", gap: "10px" }}>
                <DownloadBtn
                  section="labor"
                  label="Labor Sheet"
                  onDownload={handleDownload}
                />
                <button
                  className="btn-save-project"
                  onClick={handleSaveLabor}
                  disabled={saving}
                >
                  {saving ? "⏳ Saving..." : "💾 Save Labor Sheet"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB 3 — DISPATCH NOTE ═══ */}
        {activeTab === 3 && (
          <div style={{ maxWidth: "800px" }}>
            <CompanyHeader subtitle="Dispatch Note" />
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <L w={120}>Job Card No</L>
                  <C>
                    <strong>{jobCardNumber}</strong>
                  </C>
                  <L w={120}>Job Card Name</L>
                  <C>
                    <strong>{main.job_card_name}</strong>
                  </C>
                </tr>
                <tr>
                  <L>Date</L>
                  <C>
                    <Inp value={dispatch.date} type="date" readOnly />
                  </C>
                  <L>Time</L>
                  <C>
                    <Inp value={dispatch.time} type="time" readOnly />
                  </C>
                </tr>
                <tr>
                  <L>Customer</L>
                  <C>{main.customer_name}</C>
                  <L>Contact Detail</L>
                  <C>
                    <Inp
                      value={dispatch.contact_detail}
                      onChange={(v) => setD("contact_detail", v)}
                    />
                  </C>
                </tr>
                <tr>
                  <L>Item</L>
                  <C>{main.item}</C>
                  <L>Item Number</L>
                  <C>{main.item_number}</C>
                </tr>
                <tr>
                  <L>Invoice Number</L>
                  <C span={3}>
                    <Inp
                      value={dispatch.invoice_number}
                      onChange={(v) => setD("invoice_number", v)}
                    />
                  </C>
                </tr>
                <tr>
                  <L>Vehicle Number</L>
                  <C span={3}>
                    <Inp
                      value={dispatch.vehicle_number}
                      onChange={(v) => setD("vehicle_number", v)}
                    />
                  </C>
                </tr>
                <tr>
                  <L>Driver</L>
                  <C>
                    <Inp
                      value={dispatch.driver}
                      onChange={(v) => setD("driver", v)}
                    />
                  </C>
                  <L>ID Number</L>
                  <C>
                    <Inp
                      value={dispatch.driver_id_number}
                      onChange={(v) => setD("driver_id_number", v)}
                    />
                  </C>
                </tr>
                <tr>
                  <L>Office</L>
                  <C span={2}>
                    <Inp
                      value={dispatch.office_person}
                      onChange={(v) => setD("office_person", v)}
                    />
                  </C>
                  <td style={sigStyle}>Signature: ___________</td>
                </tr>
                <tr>
                  <L>Stores</L>
                  <C span={2}>
                    <Inp
                      value={dispatch.stores_person}
                      onChange={(v) => setD("stores_person", v)}
                    />
                  </C>
                  <td style={sigStyle}>Signature: ___________</td>
                </tr>
              </tbody>
            </table>
            <p
              style={{
                fontSize: "12px",
                color: "#e65100",
                background: "#fff8e1",
                padding: "8px 12px",
                borderRadius: "6px",
                marginBottom: "12px",
              }}
            >
              ⚠️ Saving the Dispatch Note will update job card status to{" "}
              <strong>Dispatched</strong>.
            </p>
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <DownloadBtn
                section="dispatch"
                label="Dispatch Note"
                onDownload={handleDownload}
              />
              <button
                className="btn-save-project"
                onClick={handleSaveDispatch}
                disabled={saving}
              >
                {saving ? "⏳ Saving..." : "💾 Save Dispatch Note"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkshopJobCardDetail;
