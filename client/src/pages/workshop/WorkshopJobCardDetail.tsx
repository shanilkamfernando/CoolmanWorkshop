// ============================================
// Workshop Job Card Detail - Word Document Style Forms
// Save as: client/src/pages/workshop/WorkshopJobCardDetail.tsx
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

const emptyItem = () => ({
  date: new Date().toISOString().split("T")[0],
  of_number: "",
  of_date: "",
  in_number: "",
  item: "",
  item_number: "",
  quantity: "",
});
const emptyLabor = () => ({
  date: "",
  person: "",
  job_done: "",
  in_time: "",
  out_time: "",
});

const TABS = ["Job Card", "Item List", "Labor Sheet", "GRN", "Dispatch Note"];

// ─── Shared form field styles ───────────────────────────────────
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

// ─── Form Field Component ────────────────────────────────────────
const FF = ({
  label,
  value,
  onChange,
  type = "text",
  readOnly = false,
  width,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  readOnly?: boolean;
  width?: string;
}) => (
  <td style={{ ...cellStyle, width }}>
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <span
        style={{
          fontSize: "10px",
          fontWeight: 700,
          color: "#555",
          textTransform: "uppercase",
          letterSpacing: "0.3px",
        }}
      >
        {label}
      </span>
      {readOnly ? (
        <span style={{ fontSize: "13px", minHeight: "20px", color: "#333" }}>
          {value || "—"}
        </span>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          style={inputStyle}
        />
      )}
    </div>
  </td>
);

// ─── Section Header ──────────────────────────────────────────────
const SectionHeader = ({ title }: { title: string }) => (
  <div
    style={{
      background: "#1a1a2e",
      color: "white",
      padding: "6px 12px",
      fontWeight: 700,
      fontSize: "12px",
      textTransform: "uppercase",
      letterSpacing: "1px",
      marginBottom: "8px",
      marginTop: "16px",
      borderRadius: "4px",
    }}
  >
    {title}
  </div>
);

// ─── Company Header ──────────────────────────────────────────────
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

// ── Download button ──────────────────────────────────────────────
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

// ── Table input cell ─────────────────────────────────────────────
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

  // ── Main card ──
  const [main, setMain] = useState({
    date: new Date().toISOString().split("T")[0],
    time: new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }),
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
    // Workshop received
    workshop_received_date: "",
    workshop_received_time: "",
    workshop_received_note: "",
    workshop_received_by: "",
    // Finishing
    finished_date: "",
    finished_time: "",
    finished_note: "",
    checked_by: "",
    // Finalizing
    stores_received_date: "",
    stores_received_time: "",
    stores_person: "",
    office_received_date: "",
    office_received_time: "",
    office_person: "",
    finalizing_note: "",
    status: "open",
  });

  // ── Item list ──
  const [items, setItems] = useState(() =>
    Array.from({ length: 10 }, emptyItem),
  );

  // ── Labor sheet ──
  const [labor, setLabor] = useState(() =>
    Array.from({ length: 10 }, emptyLabor),
  );

  // ── GRN ──
  const [grn, setGrn] = useState({
    date: "",
    time: "",
    contact_detail: "",
    vehicle_number: "",
    job_description: "",
    note: "",
    driver: "",
    driver_id_number: "",
    office_person: "",
  });

  // ── Dispatch ──
  const [dispatch, setDispatch] = useState({
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

  const BASE = `http://localhost:5000/api/workshop/customers/${customerId}/jobcards`;
  const headers = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const location = useLocation();

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
    fetchCustomerName();
    if (!isNew) {
      fetchJobCard();
    } else if (location.state?.jobCardNumber) {
      setJobCardNumber(location.state.jobCardNumber);
    }
  }, [jobCardId, isNew]);

  const fetchCustomerName = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/workshop/customers",
        { headers: headers() },
      );
      const found = res.data.customers?.find(
        (c: any) => c.id === Number(customerId),
      );
      if (found) setCustomerName(found.name);
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
      setMain({
        date: jobcard.date?.split("T")[0] || "",
        time: jobcard.time || "",
        job_card_name: jobcard.job_card_name || "",
        customer_name: jobcard.customer_name || "",
        contact_number: jobcard.contact_number || "",
        item: jobcard.item || "",
        item_number: jobcard.item_number || "",
        vehicle_number: jobcard.vehicle_number || "",
        company_reference: jobcard.company_reference || "",
        job_description: jobcard.job_description || "",
        note: jobcard.note || "",
        driver: jobcard.driver || "",
        driver_id_number: jobcard.driver_id_number || "",
        received_by: jobcard.received_by || "",
        approved_by: jobcard.approved_by || "",
        workshop_received_date:
          jobcard.workshop_received_date?.split("T")[0] || "",
        workshop_received_time: jobcard.workshop_received_time || "",
        workshop_received_note: jobcard.workshop_received_note || "",
        workshop_received_by: jobcard.workshop_received_by || "",
        finished_date: jobcard.finished_date?.split("T")[0] || "",
        finished_time: jobcard.finished_time || "",
        finished_note: jobcard.finished_note || "",
        checked_by: jobcard.checked_by || "",
        stores_received_date: jobcard.stores_received_date?.split("T")[0] || "",
        stores_received_time: jobcard.stores_received_time || "",
        stores_person: jobcard.stores_person || "",
        office_received_date: jobcard.office_received_date?.split("T")[0] || "",
        office_received_time: jobcard.office_received_time || "",
        office_person: jobcard.office_person || "",
        finalizing_note: jobcard.finalizing_note || "",
        status: jobcard.status || "open",
      });
      if (its?.length)
        setItems([
          ...its.map((i: any) => ({
            date: i.date?.split("T")[0] || "",
            of_number: i.of_number || "",
            of_date: i.of_date?.split("T")[0] || "",
            in_number: i.in_number || "",
            item: i.item || "",
            item_number: i.item_number || "",
            quantity: i.quantity || "",
          })),
          ...Array(Math.max(0, 10 - its.length))
            .fill(null)
            .map(emptyItem),
        ]);
      if (lab?.length)
        setLabor([
          ...lab.map((l: any) => ({
            date: l.date?.split("T")[0] || "",
            person: l.person || "",
            job_done: l.job_done || "",
            in_time: l.in_time || "",
            out_time: l.out_time || "",
          })),
          ...Array(Math.max(0, 10 - lab.length))
            .fill(null)
            .map(emptyLabor),
        ]);
      if (g)
        setGrn({
          date: g.date?.split("T")[0] || "",
          time: g.time || "",
          contact_detail: g.contact_detail || "",
          vehicle_number: g.vehicle_number || "",
          job_description: g.job_description || "",
          note: g.note || "",
          driver: g.driver || "",
          driver_id_number: g.driver_id_number || "",
          office_person: g.office_person || "",
        });
      if (d)
        setDispatch({
          date: d.date?.split("T")[0] || "",
          time: d.time || "",
          contact_detail: d.contact_detail || "",
          invoice_number: d.invoice_number || "",
          vehicle_number: d.vehicle_number || "",
          driver: d.driver || "",
          driver_id_number: d.driver_id_number || "",
          office_person: d.office_person || "",
          stores_person: d.stores_person || "",
        });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveMain = async () => {
    if (!main.item || !main.date) {
      alert("Date and Item are required");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const res = await axios.post(BASE, main, { headers: headers() });
        const newId = res.data.jobcard.id;
        const newJobCardNumber = res.data.jobcard.job_card_number;

        setJobCardNumber(res.data.jobcard.job_card_number);

        setJobCardNumber(newJobCardNumber);

        navigate(`/workshop/customers/${customerId}/jobcards/${newId}`, {
          replace: true,
          state: { jobCardNumber: newJobCardNumber },
        });
      } else {
        await axios.put(`${BASE}/${jobCardId}`, main, { headers: headers() });
        alert("Saved!");
      }
    } catch {
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveItems = async () => {
    const filled = items.filter((i) => i.item.trim());
    if (!filled.length) {
      alert("Add at least one item");
      return;
    }
    setSaving(true);
    try {
      await axios.post(
        `${BASE}/${jobCardId}/items`,
        { items: filled },
        { headers: headers() },
      );
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
    setSaving(true);
    try {
      await axios.post(
        `${BASE}/${jobCardId}/labor`,
        { labor: filled },
        { headers: headers() },
      );
      alert("Labor sheet saved!");
    } catch {
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGRN = async () => {
    setSaving(true);
    try {
      await axios.post(`${BASE}/${jobCardId}/grn`, grn, { headers: headers() });
      alert("GRN saved!");
    } catch {
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDispatch = async () => {
    setSaving(true);
    try {
      await axios.post(`${BASE}/${jobCardId}/dispatch`, dispatch, {
        headers: headers(),
      });
      alert("Dispatch note saved!");
    } catch {
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // ── Download as HTML (print-friendly) ───────────────────────────
  const handleDownload = (section: string) => {
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>${jobCardNumber}_${section}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #000; }
    h1 { text-align: center; font-size: 15px; margin-bottom: 2px; }
    h2 { text-align: center; font-size: 13px; margin-bottom: 10px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    td, th { border: 1px solid #000; padding: 4px 7px; font-size: 10px; vertical-align: middle; }
    th { background: #e0e0e0; font-weight: bold; text-align: left; }
    .label { font-weight: bold; background: #f0f0f0; white-space: nowrap; width: 1%; }
    .section-title {
      background: #333; color: white; font-weight: bold;
      padding: 4px 8px; margin: 8px 0 4px;
      font-size: 10px; text-transform: uppercase;
    }
    .signature-line { min-width: 80px; }
    .divider { border-top: 2px solid #000; margin: 8px 0; }
    @page { size: A4; margin: 12mm; }
    @media print {
      body { font-size: 10px; }
      .no-print { display: none !important; }
    }
  </style>
  </head><body>
  <div class="no-print" style="text-align:center; padding: 12px; background: #667eea; color: white; font-family: Arial; font-size: 13px; font-weight: 600; margin-bottom: 16px;">
    🖨️ Click your browser's Print button (Ctrl+P / Cmd+P) — select "Save as PDF" to download as PDF
  </div>
  <h1>COOLMan Refrigeration (Pvt) Ltd</h1>`;

    if (section === "jobcard") {
      html += `<h2>Workshop Job Card</h2>
    <table>
      <tr><td class="label">Job Card No</td><td colspan="3"><strong>${jobCardNumber}</strong></td><td class="label">Date</td><td>${main.date}</td><td class="label">Time</td><td>${main.time || ""}</td></tr>
      <tr><td class="label">Job Card Name</td><td colspan="7"><strong>${main.job_card_name || ""}</strong></td></tr>
      <tr><td class="label">Customer</td><td colspan="3">${main.customer_name || ""}</td><td class="label">Contact No</td><td colspan="3">${main.contact_number || ""}</td></tr>
      <tr><td class="label">Item</td><td colspan="3">${main.item || ""}</td><td class="label">Item Number</td><td colspan="3">${main.item_number || ""}</td></tr>
      <tr><td class="label">Vehicle Number</td><td colspan="7">${main.vehicle_number || ""}</td></tr>
      <tr><td class="label">Company Reference</td><td colspan="7">${main.company_reference || ""}</td></tr>
      <tr><td class="label">Job Description</td><td colspan="7" style="min-height:36px">${main.job_description || ""}</td></tr>
      <tr><td class="label">Note</td><td colspan="7" style="min-height:30px">${main.note || ""}</td></tr>
      <tr><td class="label">Driver</td><td>${main.driver || ""}</td><td class="label">ID Number</td><td>${main.driver_id_number || ""}</td><td class="label">Signature</td><td colspan="3" class="signature-line">&nbsp;</td></tr>
      <tr><td class="label">Received By</td><td colspan="3">${main.received_by || ""}</td><td class="label">Signature</td><td colspan="3" class="signature-line">&nbsp;</td></tr>
      <tr><td class="label">Approved By</td><td colspan="3">${main.approved_by || ""}</td><td class="label">Signature</td><td colspan="3" class="signature-line">&nbsp;</td></tr>
    </table>
    <div class="section-title">Office Use — Workshop Received</div>
    <table>
      <tr><td class="label">Received Date</td><td>${main.workshop_received_date || ""}</td><td class="label">Time</td><td>${main.workshop_received_time || ""}</td></tr>
      <tr><td class="label">Note</td><td colspan="3">${main.workshop_received_note || ""}</td></tr>
      <tr><td class="label">Received By</td><td>${main.workshop_received_by || ""}</td><td class="label">Signature</td><td class="signature-line">&nbsp;</td></tr>
    </table>
    <div class="section-title">Job Finishing</div>
    <table>
      <tr><td class="label">Finished Date</td><td>${main.finished_date || ""}</td><td class="label">Time</td><td>${main.finished_time || ""}</td></tr>
      <tr><td class="label">Note</td><td colspan="3">${main.finished_note || ""}</td></tr>
      <tr><td class="label">Checked By</td><td>${main.checked_by || ""}</td><td class="label">Signature</td><td class="signature-line">&nbsp;</td></tr>
    </table>
    <div class="section-title">Finalizing</div>
    <table>
      <tr><th></th><th>Received Date</th><th>Time</th><th>Person</th><th>Signature</th></tr>
      <tr><td class="label">Stores</td><td>${main.stores_received_date || ""}</td><td>${main.stores_received_time || ""}</td><td>${main.stores_person || ""}</td><td class="signature-line">&nbsp;</td></tr>
      <tr><td class="label">Office</td><td>${main.office_received_date || ""}</td><td>${main.office_received_time || ""}</td><td>${main.office_person || ""}</td><td class="signature-line">&nbsp;</td></tr>
      <tr><td class="label">Note</td><td colspan="4">${main.finalizing_note || ""}</td></tr>
    </table>`;
    } else if (section === "items") {
      html += `<h2>Workshop Item List</h2>
    <table><tr><td class="label">Job Card Number</td><td colspan="4"><strong>${jobCardNumber}</strong></td></tr></table>
    <table>
      <tr><th style="width:30px">No</th><th>Date</th><th>Item</th><th>Item Number</th><th style="width:60px">Quantity</th></tr>
      ${items.map((it, i) => `<tr><td style="text-align:center">${i + 1}</td><td>${it.date || ""}</td><td>${it.item || ""}</td><td>${it.item_number || ""}</td><td style="text-align:center">${it.quantity || ""}</td></tr>`).join("")}
    </table>`;
    } else if (section === "labor") {
      html += `<h2>Workshop Labor Sheet</h2>
    <table><tr><td class="label">Job Card Number</td><td colspan="5"><strong>${jobCardNumber}</strong></td></tr></table>
    <table>
      <tr><th style="width:30px">No</th><th>Date</th><th>Person</th><th>Job Done</th><th style="width:70px">In Time</th><th style="width:70px">Out Time</th></tr>
      ${labor.map((l, i) => `<tr><td style="text-align:center">${i + 1}</td><td>${l.date || ""}</td><td>${l.person || ""}</td><td>${l.job_done || ""}</td><td>${l.in_time || ""}</td><td>${l.out_time || ""}</td></tr>`).join("")}
    </table>`;
    } else if (section === "grn") {
      html += `<h2>Good Received Note</h2>
    <table>
      <tr><td class="label">Date</td><td>${grn.date || ""}</td><td class="label">Time</td><td>${grn.time || ""}</td></tr>
      <tr><td class="label">Customer</td><td>${main.customer_name || ""}</td><td class="label">Contact Detail</td><td>${grn.contact_detail || ""}</td></tr>
      <tr><td class="label">Item</td><td>${main.item || ""}</td><td class="label">Item Number</td><td>${main.item_number || ""}</td></tr>
      <tr><td class="label">Vehicle Number</td><td colspan="3">${grn.vehicle_number || ""}</td></tr>
      <tr><td class="label">Job Card Number</td><td colspan="3"><strong>${jobCardNumber}</strong></td></tr>
      <tr><td class="label">Job Description</td><td colspan="3" style="min-height:36px">${grn.job_description || ""}</td></tr>
      <tr><td class="label">Note</td><td colspan="3" style="min-height:30px">${grn.note || ""}</td></tr>
      <tr><td class="label">Driver</td><td>${grn.driver || ""}</td><td class="label">ID Number</td><td>${grn.driver_id_number || ""}</td></tr>
      <tr><td class="label">Office</td><td colspan="2">${grn.office_person || ""}</td><td class="label">Signature: ________</td></tr>
    </table>`;
    } else if (section === "dispatch") {
      html += `<h2>Dispatch Note</h2>
    <table>
      <tr><td class="label">Date</td><td>${dispatch.date || ""}</td><td class="label">Time</td><td>${dispatch.time || ""}</td></tr>
      <tr><td class="label">Customer</td><td>${main.customer_name || ""}</td><td class="label">Contact Detail</td><td>${dispatch.contact_detail || ""}</td></tr>
      <tr><td class="label">Item</td><td>${main.item || ""}</td><td class="label">Item Number</td><td>${main.item_number || ""}</td></tr>
      <tr><td class="label">Job Card Number</td><td colspan="3"><strong>${jobCardNumber}</strong></td></tr>
      <tr><td class="label">Invoice Number</td><td colspan="3">${dispatch.invoice_number || ""}</td></tr>
      <tr><td class="label">Vehicle Number</td><td colspan="3">${dispatch.vehicle_number || ""}</td></tr>
      <tr><td class="label">Driver</td><td>${dispatch.driver || ""}</td><td class="label">ID Number</td><td>${dispatch.driver_id_number || ""}</td></tr>
      <tr><td class="label">Office</td><td colspan="2">${dispatch.office_person || ""}</td><td class="label">Signature: ________</td></tr>
      <tr><td class="label">Stores</td><td colspan="2">${dispatch.stores_person || ""}</td><td class="label">Signature: ________</td></tr>
    </table>`;
    }

    html += `
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
  </body></html>`;

    // Open in new window — browser print dialog opens automatically
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

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
    for (let i = 0; i < name.length; i++)
      h = name.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  };
  const clr = customerName ? getColor(customerName) : "#667eea";
  const initials = customerName ? getInitials(customerName) : "WS";

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
              {isNew ? (
                "🆕 New Job Card"
              ) : (
                <>
                  🗂️ {jobCardNumber}
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
                </>
              )}
            </h2>
            {!isNew && (
              <select
                value={main.status}
                onChange={(e) =>
                  setMain((s) => ({ ...s, status: e.target.value }))
                }
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
              {["🗒️", "📋", "👷", "📥", "🚚"][i]} {tab}
            </button>
          ))}
        </div>

        {!isNew && (
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
                display: "inline-block",
              }}
            >
              🗂️ Job Card: {jobCardNumber}
            </div>
            {purchasingEntryId && purchasingCustId && (
              <button
                onClick={() =>
                  navigate(
                    `/purchasing/workshop/customers/${customerId}/dashboard`,
                    {
                      state: {
                        customer: {
                          id: Number(customerId),
                          name: customerName,
                        },
                        highlightEntryId: purchasingEntryId,
                      },
                    },
                  )
                }
                // onClick={() =>
                //   navigate(
                //     `/purchasing/customers/${purchasingCustId}/entries`,
                //     {
                //       state: {
                //         customer: { id: purchasingCustId, name: customerName },
                //         highlightEntryId: purchasingEntryId,
                //       },
                //     },
                //   )
                // }
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
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* TAB 0 — MAIN JOB CARD (Word document form layout)     */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 0 && (
          <div style={{ maxWidth: "900px" }}>
            <CompanyHeader subtitle="Workshop Job Card" />

            {/* Row 1: Date + Time */}
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <td style={labelStyle} width="120">
                    Job Card Name
                  </td>
                  <td colSpan={3} style={cellStyle}>
                    <input
                      type="text"
                      value={main.job_card_name}
                      onChange={(e) =>
                        setMain((s) => ({
                          ...s,
                          job_card_name: e.target.value,
                        }))
                      }
                      style={inputStyle}
                      placeholder="Give this job card a name (e.g. 'AC Compressor Repair')"
                    />
                  </td>
                </tr>
                <tr>
                  <td style={labelStyle} width="120">
                    Date
                  </td>
                  <td style={cellStyle}>
                    <input
                      type="date"
                      value={main.date}
                      onChange={(e) =>
                        setMain((s) => ({ ...s, date: e.target.value }))
                      }
                      style={inputStyle}
                    />
                  </td>
                  <td style={labelStyle} width="80">
                    Time
                  </td>
                  <td style={cellStyle}>
                    <input
                      type="time"
                      value={main.time}
                      onChange={(e) =>
                        setMain((s) => ({ ...s, time: e.target.value }))
                      }
                      style={inputStyle}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={labelStyle}>Customer</td>
                  <td style={cellStyle}>
                    <input
                      type="text"
                      value={main.customer_name}
                      onChange={(e) =>
                        setMain((s) => ({
                          ...s,
                          customer_name: e.target.value,
                        }))
                      }
                      style={inputStyle}
                      placeholder="Customer name"
                    />
                  </td>
                  <td style={labelStyle}>Contact No</td>
                  <td style={cellStyle}>
                    <input
                      type="text"
                      value={main.contact_number}
                      onChange={(e) =>
                        setMain((s) => ({
                          ...s,
                          contact_number: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={labelStyle}>Item</td>
                  <td style={cellStyle}>
                    <input
                      type="text"
                      value={main.item}
                      onChange={(e) =>
                        setMain((s) => ({ ...s, item: e.target.value }))
                      }
                      style={inputStyle}
                      placeholder="Item description *"
                    />
                  </td>
                  <td style={labelStyle}>Item Number</td>
                  <td style={cellStyle}>
                    <input
                      type="text"
                      value={main.item_number}
                      onChange={(e) =>
                        setMain((s) => ({ ...s, item_number: e.target.value }))
                      }
                      style={inputStyle}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={labelStyle}>Vehicle Number</td>
                  <td colSpan={3} style={cellStyle}>
                    <input
                      type="text"
                      value={main.vehicle_number}
                      onChange={(e) =>
                        setMain((s) => ({
                          ...s,
                          vehicle_number: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={labelStyle}>Company Reference</td>
                  <td colSpan={3} style={cellStyle}>
                    <input
                      type="text"
                      value={main.company_reference}
                      onChange={(e) =>
                        setMain((s) => ({
                          ...s,
                          company_reference: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={labelStyle}>Job Description</td>
                  <td colSpan={3} style={{ ...cellStyle, height: "60px" }}>
                    <textarea
                      value={main.job_description}
                      onChange={(e) =>
                        setMain((s) => ({
                          ...s,
                          job_description: e.target.value,
                        }))
                      }
                      style={{
                        ...inputStyle,
                        height: "55px",
                        resize: "vertical",
                        display: "block",
                      }}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={labelStyle}>Note</td>
                  <td colSpan={3} style={{ ...cellStyle, height: "50px" }}>
                    <textarea
                      value={main.note}
                      onChange={(e) =>
                        setMain((s) => ({ ...s, note: e.target.value }))
                      }
                      style={{
                        ...inputStyle,
                        height: "45px",
                        resize: "vertical",
                        display: "block",
                      }}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={labelStyle}>Driver</td>
                  <td style={cellStyle}>
                    <input
                      type="text"
                      value={main.driver}
                      onChange={(e) =>
                        setMain((s) => ({ ...s, driver: e.target.value }))
                      }
                      style={inputStyle}
                    />
                  </td>
                  <td style={labelStyle}>ID Number</td>
                  <td style={cellStyle}>
                    <input
                      type="text"
                      value={main.driver_id_number}
                      onChange={(e) =>
                        setMain((s) => ({
                          ...s,
                          driver_id_number: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={labelStyle}>Received By</td>
                  <td colSpan={2} style={cellStyle}>
                    <input
                      type="text"
                      value={main.received_by}
                      onChange={(e) =>
                        setMain((s) => ({ ...s, received_by: e.target.value }))
                      }
                      style={inputStyle}
                    />
                  </td>
                  <td
                    style={{
                      ...cellStyle,
                      color: "#999",
                      fontSize: "11px",
                      fontStyle: "italic",
                    }}
                  >
                    Signature: ___________
                  </td>
                </tr>
                <tr>
                  <td style={labelStyle}>Approved By</td>
                  <td colSpan={2} style={cellStyle}>
                    <input
                      type="text"
                      value={main.approved_by}
                      onChange={(e) =>
                        setMain((s) => ({ ...s, approved_by: e.target.value }))
                      }
                      style={inputStyle}
                    />
                  </td>
                  <td
                    style={{
                      ...cellStyle,
                      color: "#999",
                      fontSize: "11px",
                      fontStyle: "italic",
                    }}
                  >
                    Signature: ___________
                  </td>
                </tr>
              </tbody>
            </table>

            {!isNew && (
              <>
                <SectionHeader title="Office Use — Workshop Received" />
                <table style={tableStyle}>
                  <tbody>
                    <tr>
                      <td style={labelStyle} width="140">
                        Received Date
                      </td>
                      <td style={cellStyle}>
                        <input
                          type="date"
                          value={main.workshop_received_date}
                          onChange={(e) =>
                            setMain((s) => ({
                              ...s,
                              workshop_received_date: e.target.value,
                            }))
                          }
                          style={inputStyle}
                        />
                      </td>
                      <td style={labelStyle} width="60">
                        Time
                      </td>
                      <td style={cellStyle}>
                        <input
                          type="time"
                          value={main.workshop_received_time}
                          onChange={(e) =>
                            setMain((s) => ({
                              ...s,
                              workshop_received_time: e.target.value,
                            }))
                          }
                          style={inputStyle}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td style={labelStyle}>Note</td>
                      <td colSpan={3} style={cellStyle}>
                        <input
                          type="text"
                          value={main.workshop_received_note}
                          onChange={(e) =>
                            setMain((s) => ({
                              ...s,
                              workshop_received_note: e.target.value,
                            }))
                          }
                          style={inputStyle}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td style={labelStyle}>Received By</td>
                      <td colSpan={2} style={cellStyle}>
                        <input
                          type="text"
                          value={main.workshop_received_by}
                          onChange={(e) =>
                            setMain((s) => ({
                              ...s,
                              workshop_received_by: e.target.value,
                            }))
                          }
                          style={inputStyle}
                        />
                      </td>
                      <td
                        style={{
                          ...cellStyle,
                          color: "#999",
                          fontSize: "11px",
                          fontStyle: "italic",
                        }}
                      >
                        Signature: ___________
                      </td>
                    </tr>
                  </tbody>
                </table>

                <SectionHeader title="Job Finishing" />
                <table style={tableStyle}>
                  <tbody>
                    <tr>
                      <td style={labelStyle} width="140">
                        Finished Date
                      </td>
                      <td style={cellStyle}>
                        <input
                          type="date"
                          value={main.finished_date}
                          onChange={(e) =>
                            setMain((s) => ({
                              ...s,
                              finished_date: e.target.value,
                            }))
                          }
                          style={inputStyle}
                        />
                      </td>
                      <td style={labelStyle} width="60">
                        Time
                      </td>
                      <td style={cellStyle}>
                        <input
                          type="time"
                          value={main.finished_time}
                          onChange={(e) =>
                            setMain((s) => ({
                              ...s,
                              finished_time: e.target.value,
                            }))
                          }
                          style={inputStyle}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td style={labelStyle}>Note</td>
                      <td colSpan={3} style={cellStyle}>
                        <input
                          type="text"
                          value={main.finished_note}
                          onChange={(e) =>
                            setMain((s) => ({
                              ...s,
                              finished_note: e.target.value,
                            }))
                          }
                          style={inputStyle}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td style={labelStyle}>Checked By</td>
                      <td colSpan={2} style={cellStyle}>
                        <input
                          type="text"
                          value={main.checked_by}
                          onChange={(e) =>
                            setMain((s) => ({
                              ...s,
                              checked_by: e.target.value,
                            }))
                          }
                          style={inputStyle}
                        />
                      </td>
                      <td
                        style={{
                          ...cellStyle,
                          color: "#999",
                          fontSize: "11px",
                          fontStyle: "italic",
                        }}
                      >
                        Signature: ___________
                      </td>
                    </tr>
                  </tbody>
                </table>

                <SectionHeader title="Finalizing" />
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={{ ...labelStyle, width: "80px" }}></th>
                      <th style={labelStyle}>Received Date</th>
                      <th style={labelStyle}>Time</th>
                      <th style={labelStyle}>Person</th>
                      <th style={{ ...labelStyle, width: "140px" }}>
                        Signature
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={labelStyle}>Stores</td>
                      <td style={cellStyle}>
                        <input
                          type="date"
                          value={main.stores_received_date}
                          onChange={(e) =>
                            setMain((s) => ({
                              ...s,
                              stores_received_date: e.target.value,
                            }))
                          }
                          style={inputStyle}
                        />
                      </td>
                      <td style={cellStyle}>
                        <input
                          type="time"
                          value={main.stores_received_time}
                          onChange={(e) =>
                            setMain((s) => ({
                              ...s,
                              stores_received_time: e.target.value,
                            }))
                          }
                          style={inputStyle}
                        />
                      </td>
                      <td style={cellStyle}>
                        <input
                          type="text"
                          value={main.stores_person}
                          onChange={(e) =>
                            setMain((s) => ({
                              ...s,
                              stores_person: e.target.value,
                            }))
                          }
                          style={inputStyle}
                        />
                      </td>
                      <td
                        style={{
                          ...cellStyle,
                          color: "#999",
                          fontSize: "11px",
                          fontStyle: "italic",
                        }}
                      >
                        ___________
                      </td>
                    </tr>
                    <tr>
                      <td style={labelStyle}>Office</td>
                      <td style={cellStyle}>
                        <input
                          type="date"
                          value={main.office_received_date}
                          onChange={(e) =>
                            setMain((s) => ({
                              ...s,
                              office_received_date: e.target.value,
                            }))
                          }
                          style={inputStyle}
                        />
                      </td>
                      <td style={cellStyle}>
                        <input
                          type="time"
                          value={main.office_received_time}
                          onChange={(e) =>
                            setMain((s) => ({
                              ...s,
                              office_received_time: e.target.value,
                            }))
                          }
                          style={inputStyle}
                        />
                      </td>
                      <td style={cellStyle}>
                        <input
                          type="text"
                          value={main.office_person}
                          onChange={(e) =>
                            setMain((s) => ({
                              ...s,
                              office_person: e.target.value,
                            }))
                          }
                          style={inputStyle}
                        />
                      </td>
                      <td
                        style={{
                          ...cellStyle,
                          color: "#999",
                          fontSize: "11px",
                          fontStyle: "italic",
                        }}
                      >
                        ___________
                      </td>
                    </tr>
                    <tr>
                      <td style={labelStyle}>Note</td>
                      <td colSpan={4} style={cellStyle}>
                        <input
                          type="text"
                          value={main.finalizing_note}
                          onChange={(e) =>
                            setMain((s) => ({
                              ...s,
                              finalizing_note: e.target.value,
                            }))
                          }
                          style={inputStyle}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
                marginTop: "16px",
                flexWrap: "wrap",
              }}
            >
              {!isNew && (
                <DownloadBtn
                  section="jobcard"
                  label="Job Card"
                  onDownload={handleDownload}
                />
              )}
              <button
                className="btn-save-project"
                onClick={handleSaveMain}
                disabled={saving}
              >
                {saving
                  ? "⏳ Saving..."
                  : isNew
                    ? "💾 Create Job Card"
                    : "💾 Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* TAB 1 — ITEM LIST                                      */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 1 && (
          <div style={{ maxWidth: "700px" }}>
            <CompanyHeader subtitle="Workshop Item List" />
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <td style={labelStyle} width="140">
                    Job Card Number
                  </td>
                  <td style={cellStyle} colSpan={4}>
                    {jobCardNumber}
                  </td>
                </tr>
              </tbody>
            </table>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {["No", "Date", "Item", "Item Number", "Quantity"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          ...labelStyle,
                          textAlign: "center",
                          border: "1px solid #333",
                        }}
                      >
                        {h}
                      </th>
                    ),
                  )}
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
                    <TI
                      value={it.date}
                      onChange={(v) =>
                        setItems((r) =>
                          r.map((x, ri) => (ri === i ? { ...x, date: v } : x)),
                        )
                      }
                      type="date"
                    />
                    <TI
                      value={it.item}
                      onChange={(v) =>
                        setItems((r) =>
                          r.map((x, ri) => (ri === i ? { ...x, item: v } : x)),
                        )
                      }
                    />
                    <TI
                      value={it.item_number}
                      onChange={(v) =>
                        setItems((r) =>
                          r.map((x, ri) =>
                            ri === i ? { ...x, item_number: v } : x,
                          ),
                        )
                      }
                    />
                    <TI
                      value={it.quantity}
                      onChange={(v) =>
                        setItems((r) =>
                          r.map((x, ri) =>
                            ri === i ? { ...x, quantity: v } : x,
                          ),
                        )
                      }
                      type="number"
                    />
                  </tr>
                ))}
              </tbody>
            </table>
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
                onClick={() => setItems((i) => [...i, emptyItem()])}
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

        {/* ══════════════════════════════════════════════════════ */}
        {/* TAB 2 — LABOR SHEET                                    */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 2 && (
          <div style={{ maxWidth: "900px" }}>
            <CompanyHeader subtitle="Workshop Labor Sheet" />
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <td style={labelStyle} width="140">
                    Job Card Number
                  </td>
                  <td style={cellStyle} colSpan={5}>
                    {jobCardNumber}
                  </td>
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
                    <th
                      key={h}
                      style={{
                        ...labelStyle,
                        textAlign: "center",
                        border: "1px solid #333",
                      }}
                    >
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
                    <TI
                      value={lb.date}
                      onChange={(v) =>
                        setLabor((r) =>
                          r.map((x, ri) => (ri === i ? { ...x, date: v } : x)),
                        )
                      }
                      type="date"
                    />
                    <TI
                      value={lb.person}
                      onChange={(v) =>
                        setLabor((r) =>
                          r.map((x, ri) =>
                            ri === i ? { ...x, person: v } : x,
                          ),
                        )
                      }
                    />
                    <TI
                      value={lb.job_done}
                      onChange={(v) =>
                        setLabor((r) =>
                          r.map((x, ri) =>
                            ri === i ? { ...x, job_done: v } : x,
                          ),
                        )
                      }
                    />
                    <TI
                      value={lb.in_time}
                      onChange={(v) =>
                        setLabor((r) =>
                          r.map((x, ri) =>
                            ri === i ? { ...x, in_time: v } : x,
                          ),
                        )
                      }
                      type="time"
                    />
                    <TI
                      value={lb.out_time}
                      onChange={(v) =>
                        setLabor((r) =>
                          r.map((x, ri) =>
                            ri === i ? { ...x, out_time: v } : x,
                          ),
                        )
                      }
                      type="time"
                    />
                  </tr>
                ))}
              </tbody>
            </table>
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

        {/* ══════════════════════════════════════════════════════ */}
        {/* TAB 3 — GOOD RECEIVED NOTE                            */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 3 && (
          <div style={{ maxWidth: "800px" }}>
            <CompanyHeader subtitle="Good Received Note" />
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <td style={labelStyle} width="140">
                    Date
                  </td>
                  <td style={cellStyle}>
                    <input
                      type="date"
                      value={grn.date}
                      onChange={(e) =>
                        setGrn((s) => ({ ...s, date: e.target.value }))
                      }
                      style={inputStyle}
                    />
                  </td>
                  <td style={labelStyle} width="60">
                    Time
                  </td>
                  <td style={cellStyle}>
                    <input
                      type="time"
                      value={grn.time}
                      onChange={(e) =>
                        setGrn((s) => ({ ...s, time: e.target.value }))
                      }
                      style={inputStyle}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={labelStyle}>Customer</td>
                  <td style={cellStyle}>{main.customer_name}</td>
                  <td style={labelStyle}>Contact Detail</td>
                  <td style={cellStyle}>
                    <input
                      type="text"
                      value={grn.contact_detail}
                      onChange={(e) =>
                        setGrn((s) => ({
                          ...s,
                          contact_detail: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={labelStyle}>Item</td>
                  <td style={cellStyle}>{main.item}</td>
                  <td style={labelStyle}>Item Number</td>
                  <td style={cellStyle}>{main.item_number}</td>
                </tr>
                <tr>
                  <td style={labelStyle}>Vehicle Number</td>
                  <td colSpan={3} style={cellStyle}>
                    <input
                      type="text"
                      value={grn.vehicle_number}
                      onChange={(e) =>
                        setGrn((s) => ({
                          ...s,
                          vehicle_number: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={labelStyle}>Job Card Number</td>
                  <td colSpan={3} style={cellStyle}>
                    {jobCardNumber}
                  </td>
                </tr>
                <tr>
                  <td style={labelStyle}>Job Description</td>
                  <td colSpan={3} style={{ ...cellStyle, height: "60px" }}>
                    <textarea
                      value={grn.job_description}
                      onChange={(e) =>
                        setGrn((s) => ({
                          ...s,
                          job_description: e.target.value,
                        }))
                      }
                      style={{
                        ...inputStyle,
                        height: "55px",
                        resize: "vertical",
                        display: "block",
                      }}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={labelStyle}>Note</td>
                  <td colSpan={3} style={{ ...cellStyle, height: "50px" }}>
                    <textarea
                      value={grn.note}
                      onChange={(e) =>
                        setGrn((s) => ({ ...s, note: e.target.value }))
                      }
                      style={{
                        ...inputStyle,
                        height: "45px",
                        resize: "vertical",
                        display: "block",
                      }}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={labelStyle}>Driver</td>
                  <td style={cellStyle}>
                    <input
                      type="text"
                      value={grn.driver}
                      onChange={(e) =>
                        setGrn((s) => ({ ...s, driver: e.target.value }))
                      }
                      style={inputStyle}
                    />
                  </td>
                  <td style={labelStyle}>ID Number</td>
                  <td style={cellStyle}>
                    <input
                      type="text"
                      value={grn.driver_id_number}
                      onChange={(e) =>
                        setGrn((s) => ({
                          ...s,
                          driver_id_number: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={labelStyle}>Office</td>
                  <td colSpan={2} style={cellStyle}>
                    <input
                      type="text"
                      value={grn.office_person}
                      onChange={(e) =>
                        setGrn((s) => ({ ...s, office_person: e.target.value }))
                      }
                      style={inputStyle}
                    />
                  </td>
                  <td
                    style={{
                      ...cellStyle,
                      color: "#999",
                      fontSize: "11px",
                      fontStyle: "italic",
                    }}
                  >
                    Signature: ___________
                  </td>
                </tr>
              </tbody>
            </table>
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
                marginTop: "12px",
              }}
            >
              <DownloadBtn
                section="grn"
                label="GRN"
                onDownload={handleDownload}
              />
              <button
                className="btn-save-project"
                onClick={handleSaveGRN}
                disabled={saving}
              >
                {saving ? "⏳ Saving..." : "💾 Save GRN"}
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* TAB 4 — DISPATCH NOTE                                  */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 4 && (
          <div style={{ maxWidth: "800px" }}>
            <CompanyHeader subtitle="Dispatch Note" />
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <td style={labelStyle} width="140">
                    Date
                  </td>
                  <td style={cellStyle}>
                    <input
                      type="date"
                      value={dispatch.date}
                      onChange={(e) =>
                        setDispatch((s) => ({ ...s, date: e.target.value }))
                      }
                      style={inputStyle}
                    />
                  </td>
                  <td style={labelStyle} width="60">
                    Time
                  </td>
                  <td style={cellStyle}>
                    <input
                      type="time"
                      value={dispatch.time}
                      onChange={(e) =>
                        setDispatch((s) => ({ ...s, time: e.target.value }))
                      }
                      style={inputStyle}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={labelStyle}>Customer</td>
                  <td style={cellStyle}>{main.customer_name}</td>
                  <td style={labelStyle}>Contact Detail</td>
                  <td style={cellStyle}>
                    <input
                      type="text"
                      value={dispatch.contact_detail}
                      onChange={(e) =>
                        setDispatch((s) => ({
                          ...s,
                          contact_detail: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={labelStyle}>Item</td>
                  <td style={cellStyle}>{main.item}</td>
                  <td style={labelStyle}>Item Number</td>
                  <td style={cellStyle}>{main.item_number}</td>
                </tr>
                <tr>
                  <td style={labelStyle}>Job Card Number</td>
                  <td colSpan={3} style={cellStyle}>
                    {jobCardNumber}
                  </td>
                </tr>
                <tr>
                  <td style={labelStyle}>Invoice Number</td>
                  <td colSpan={3} style={cellStyle}>
                    <input
                      type="text"
                      value={dispatch.invoice_number}
                      onChange={(e) =>
                        setDispatch((s) => ({
                          ...s,
                          invoice_number: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={labelStyle}>Vehicle Number</td>
                  <td colSpan={3} style={cellStyle}>
                    <input
                      type="text"
                      value={dispatch.vehicle_number}
                      onChange={(e) =>
                        setDispatch((s) => ({
                          ...s,
                          vehicle_number: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={labelStyle}>Driver</td>
                  <td style={cellStyle}>
                    <input
                      type="text"
                      value={dispatch.driver}
                      onChange={(e) =>
                        setDispatch((s) => ({ ...s, driver: e.target.value }))
                      }
                      style={inputStyle}
                    />
                  </td>
                  <td style={labelStyle}>ID Number</td>
                  <td style={cellStyle}>
                    <input
                      type="text"
                      value={dispatch.driver_id_number}
                      onChange={(e) =>
                        setDispatch((s) => ({
                          ...s,
                          driver_id_number: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={labelStyle}>Office</td>
                  <td colSpan={2} style={cellStyle}>
                    <input
                      type="text"
                      value={dispatch.office_person}
                      onChange={(e) =>
                        setDispatch((s) => ({
                          ...s,
                          office_person: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
                  </td>
                  <td
                    style={{
                      ...cellStyle,
                      color: "#999",
                      fontSize: "11px",
                      fontStyle: "italic",
                    }}
                  >
                    Signature: ___________
                  </td>
                </tr>
                <tr>
                  <td style={labelStyle}>Stores</td>
                  <td colSpan={2} style={cellStyle}>
                    <input
                      type="text"
                      value={dispatch.stores_person}
                      onChange={(e) =>
                        setDispatch((s) => ({
                          ...s,
                          stores_person: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
                  </td>
                  <td
                    style={{
                      ...cellStyle,
                      color: "#999",
                      fontSize: "11px",
                      fontStyle: "italic",
                    }}
                  >
                    Signature: ___________
                  </td>
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
