// ============================================
// Job Card Detail Page (Create & Edit)
// Save as: client/src/pages/customers/JobCardDetail.tsx
// ============================================

import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import "./ProjectDashboard.css";
import companyLogo from "../../assets/mainlogo.jpeg";

interface User {
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}
interface Customer {
  id: number;
  name: string;
}

const emptyItem = () => ({
  date: "",
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

const JobCardDetail = () => {
  const navigate = useNavigate();
  const { customerId, jobCardId } = useParams();
  const location = useLocation();
  const isNew = jobCardId === "new";

  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [jobCardNumber, setJobCardNumber] = useState("");

  // ── Main card fields ──
  const [main, setMain] = useState({
    date: new Date().toISOString().split("T")[0],
    time: "",
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
  const [items, setItems] = useState(Array(5).fill(null).map(emptyItem));

  // ── Labor sheet ──
  const [labor, setLabor] = useState(Array(5).fill(null).map(emptyLabor));

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

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
    if (location.state?.customer) setCustomer(location.state.customer);
    if (!isNew) fetchJobCard();
  }, [jobCardId]);

  const fetchJobCard = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/api/customers/${customerId}/jobcards/${jobCardId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const { jobcard, items: its, labor: lab, grn: g, dispatch: d } = res.data;
      setJobCardNumber(jobcard.job_card_number);
      setMain({
        date: jobcard.date?.split("T")[0] || "",
        time: jobcard.time || "",
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
          ...Array(Math.max(0, 5 - its.length))
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
          ...Array(Math.max(0, 5 - lab.length))
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
      const token = localStorage.getItem("token");
      if (isNew) {
        const res = await axios.post(
          `http://localhost:5000/api/customers/${customerId}/jobcards`,
          main,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const newId = res.data.jobcard.id;
        navigate(`/customers/${customerId}/jobcards/${newId}`, {
          state: { customer },
          replace: true,
        });
        setJobCardNumber(res.data.jobcard.job_card_number);
      } else {
        await axios.put(
          `http://localhost:5000/api/customers/${customerId}/jobcards/${jobCardId}`,
          main,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        alert("Saved!");
      }
    } catch (e) {
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
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/customers/${customerId}/jobcards/${jobCardId}/items`,
        { items: filled },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Item list saved!");
    } catch {
      alert("Failed to save items");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLabor = async () => {
    const filled = labor.filter((l) => l.person.trim() || l.job_done.trim());
    if (!filled.length) {
      alert("Add at least one labor entry");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/customers/${customerId}/jobcards/${jobCardId}/labor`,
        { labor: filled },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Labor sheet saved!");
    } catch {
      alert("Failed to save labor sheet");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGRN = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/customers/${customerId}/jobcards/${jobCardId}/grn`,
        grn,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("GRN saved!");
    } catch {
      alert("Failed to save GRN");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDispatch = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/customers/${customerId}/jobcards/${jobCardId}/dispatch`,
        dispatch,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Dispatch note saved!");
    } catch {
      alert("Failed to save dispatch note");
    } finally {
      setSaving(false);
    }
  };

  // ── Helpers ──
  const F = ({
    label,
    type = "text",
    value,
    onChange,
    placeholder = "",
    required = false,
    half = false,
  }: any) => (
    <div
      style={{
        flex: half ? "0 0 calc(50% - 8px)" : "1 1 100%",
        minWidth: "160px",
      }}
    >
      <label
        style={{
          display: "block",
          fontSize: "12px",
          fontWeight: 700,
          color: "#555",
          marginBottom: "4px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
        {required && <span style={{ color: "#e53935" }}> *</span>}
      </label>
      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{
            width: "100%",
            padding: "9px 12px",
            fontSize: "14px",
            border: "1.5px solid #ddd",
            borderRadius: "6px",
            resize: "vertical",
            boxSizing: "border-box",
            fontFamily: "inherit",
          }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: "9px 12px",
            fontSize: "14px",
            border: "1.5px solid #ddd",
            borderRadius: "6px",
            boxSizing: "border-box",
          }}
        />
      )}
    </div>
  );

  const Section = ({ title, children }: any) => (
    <div
      style={{
        marginBottom: "24px",
        border: "1.5px solid #e8ecf0",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: "#f1f4f8",
          padding: "10px 16px",
          fontWeight: 700,
          fontSize: "13px",
          color: "#334",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          borderBottom: "1.5px solid #e8ecf0",
        }}
      >
        {title}
      </div>
      <div
        style={{
          padding: "16px",
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        {children}
      </div>
    </div>
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
    for (let i = 0; i < name.length; i++)
      h = name.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  };

  if (!customer) return <div className="loading-center">Loading...</div>;
  const initials = getInitials(customer.name);
  const clr = getColor(customer.name);

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
            <span className="customer-logo-text">{customer.name}</span>
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
            </h2>
            {!isNew && (
              <div style={{ marginTop: "4px" }}>
                <select
                  value={main.status}
                  onChange={(e) =>
                    setMain((s) => ({ ...s, status: e.target.value }))
                  }
                  style={{
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
              </div>
            )}
          </div>
          <button
            className="btn-back"
            onClick={() =>
              navigate(`/customers/${customerId}/jobcards`, {
                state: { customer },
              })
            }
          >
            ← Back to Job Cards
          </button>
        </div>

        {/* Tabs — disabled for new cards until saved */}
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

        {/* ── TAB 0: Main Job Card ── */}
        {activeTab === 0 && (
          <div>
            <Section title="Basic Information">
              <F
                label="Date"
                type="date"
                value={main.date}
                onChange={(v: string) => setMain((s) => ({ ...s, date: v }))}
                required
                half
              />
              <F
                label="Time"
                type="time"
                value={main.time}
                onChange={(v: string) => setMain((s) => ({ ...s, time: v }))}
                half
              />
              <F
                label="Customer Name"
                value={main.customer_name}
                onChange={(v: string) =>
                  setMain((s) => ({ ...s, customer_name: v }))
                }
                half
              />
              <F
                label="Contact Number"
                value={main.contact_number}
                onChange={(v: string) =>
                  setMain((s) => ({ ...s, contact_number: v }))
                }
                half
              />
              <F
                label="Item"
                value={main.item}
                onChange={(v: string) => setMain((s) => ({ ...s, item: v }))}
                required
                half
              />
              <F
                label="Item Number"
                value={main.item_number}
                onChange={(v: string) =>
                  setMain((s) => ({ ...s, item_number: v }))
                }
                half
              />
              <F
                label="Vehicle Number"
                value={main.vehicle_number}
                onChange={(v: string) =>
                  setMain((s) => ({ ...s, vehicle_number: v }))
                }
                half
              />
              <F
                label="Company Reference"
                value={main.company_reference}
                onChange={(v: string) =>
                  setMain((s) => ({ ...s, company_reference: v }))
                }
                half
              />
            </Section>

            <Section title="Job Description">
              <F
                label="Job Description"
                type="textarea"
                value={main.job_description}
                onChange={(v: string) =>
                  setMain((s) => ({ ...s, job_description: v }))
                }
              />
              <F
                label="Note"
                type="textarea"
                value={main.note}
                onChange={(v: string) => setMain((s) => ({ ...s, note: v }))}
              />
            </Section>

            <Section title="Driver / Reception">
              <F
                label="Driver"
                value={main.driver}
                onChange={(v: string) => setMain((s) => ({ ...s, driver: v }))}
                half
              />
              <F
                label="Driver ID Number"
                value={main.driver_id_number}
                onChange={(v: string) =>
                  setMain((s) => ({ ...s, driver_id_number: v }))
                }
                half
              />
              <F
                label="Received By"
                value={main.received_by}
                onChange={(v: string) =>
                  setMain((s) => ({ ...s, received_by: v }))
                }
                half
              />
              <F
                label="Approved By"
                value={main.approved_by}
                onChange={(v: string) =>
                  setMain((s) => ({ ...s, approved_by: v }))
                }
                half
              />
            </Section>

            {!isNew && (
              <>
                <Section title="Workshop Received">
                  <F
                    label="Received Date"
                    type="date"
                    value={main.workshop_received_date}
                    onChange={(v: string) =>
                      setMain((s) => ({ ...s, workshop_received_date: v }))
                    }
                    half
                  />
                  <F
                    label="Received Time"
                    type="time"
                    value={main.workshop_received_time}
                    onChange={(v: string) =>
                      setMain((s) => ({ ...s, workshop_received_time: v }))
                    }
                    half
                  />
                  <F
                    label="Received By"
                    value={main.workshop_received_by}
                    onChange={(v: string) =>
                      setMain((s) => ({ ...s, workshop_received_by: v }))
                    }
                    half
                  />
                  <F
                    label="Note"
                    value={main.workshop_received_note}
                    onChange={(v: string) =>
                      setMain((s) => ({ ...s, workshop_received_note: v }))
                    }
                    half
                  />
                </Section>

                <Section title="Job Finishing">
                  <F
                    label="Finished Date"
                    type="date"
                    value={main.finished_date}
                    onChange={(v: string) =>
                      setMain((s) => ({ ...s, finished_date: v }))
                    }
                    half
                  />
                  <F
                    label="Finished Time"
                    type="time"
                    value={main.finished_time}
                    onChange={(v: string) =>
                      setMain((s) => ({ ...s, finished_time: v }))
                    }
                    half
                  />
                  <F
                    label="Checked By"
                    value={main.checked_by}
                    onChange={(v: string) =>
                      setMain((s) => ({ ...s, checked_by: v }))
                    }
                    half
                  />
                  <F
                    label="Note"
                    value={main.finished_note}
                    onChange={(v: string) =>
                      setMain((s) => ({ ...s, finished_note: v }))
                    }
                    half
                  />
                </Section>

                <Section title="Finalizing">
                  <F
                    label="Stores Received Date"
                    type="date"
                    value={main.stores_received_date}
                    onChange={(v: string) =>
                      setMain((s) => ({ ...s, stores_received_date: v }))
                    }
                    half
                  />
                  <F
                    label="Stores Received Time"
                    type="time"
                    value={main.stores_received_time}
                    onChange={(v: string) =>
                      setMain((s) => ({ ...s, stores_received_time: v }))
                    }
                    half
                  />
                  <F
                    label="Stores Person"
                    value={main.stores_person}
                    onChange={(v: string) =>
                      setMain((s) => ({ ...s, stores_person: v }))
                    }
                    half
                  />
                  <F
                    label="Office Received Date"
                    type="date"
                    value={main.office_received_date}
                    onChange={(v: string) =>
                      setMain((s) => ({ ...s, office_received_date: v }))
                    }
                    half
                  />
                  <F
                    label="Office Received Time"
                    type="time"
                    value={main.office_received_time}
                    onChange={(v: string) =>
                      setMain((s) => ({ ...s, office_received_time: v }))
                    }
                    half
                  />
                  <F
                    label="Office Person"
                    value={main.office_person}
                    onChange={(v: string) =>
                      setMain((s) => ({ ...s, office_person: v }))
                    }
                    half
                  />
                  <F
                    label="Note"
                    type="textarea"
                    value={main.finalizing_note}
                    onChange={(v: string) =>
                      setMain((s) => ({ ...s, finalizing_note: v }))
                    }
                  />
                </Section>
              </>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "8px",
              }}
            >
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

        {/* ── TAB 1: Item List ── */}
        {activeTab === 1 && (
          <div>
            <div
              style={{
                marginBottom: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>
                Job Card: <strong>{jobCardNumber}</strong> — Add items used for
                this job.
              </p>
              <button
                className="btn-add-small"
                onClick={() => setItems((i) => [...i, emptyItem()])}
              >
                + Add Row
              </button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="meetings-table" style={{ minWidth: "900px" }}>
                <thead>
                  <tr>
                    <th style={{ width: "44px" }}>No</th>
                    <th style={{ width: "110px" }}>Date</th>
                    <th style={{ width: "100px" }}>O/F No</th>
                    <th style={{ width: "110px" }}>O/F Date</th>
                    <th style={{ width: "100px" }}>I/N No</th>
                    <th>Item</th>
                    <th style={{ width: "110px" }}>Item No</th>
                    <th style={{ width: "80px" }}>Qty</th>
                    <th style={{ width: "44px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i}>
                      <td
                        style={{
                          textAlign: "center",
                          color: "#888",
                          fontWeight: 600,
                        }}
                      >
                        {i + 1}
                      </td>
                      {[
                        "date",
                        "of_number",
                        "of_date",
                        "in_number",
                        "item",
                        "item_number",
                        "quantity",
                      ].map((field) => (
                        <td key={field}>
                          <input
                            type={
                              field.includes("date")
                                ? "date"
                                : field === "quantity"
                                  ? "number"
                                  : "text"
                            }
                            value={(it as any)[field]}
                            onChange={(e) =>
                              setItems((rows) =>
                                rows.map((r, ri) =>
                                  ri === i
                                    ? { ...r, [field]: e.target.value }
                                    : r,
                                ),
                              )
                            }
                            style={{
                              width: "100%",
                              padding: "6px 8px",
                              fontSize: "13px",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              boxSizing: "border-box",
                            }}
                          />
                        </td>
                      ))}
                      <td style={{ textAlign: "center" }}>
                        {items.length > 1 && (
                          <button
                            onClick={() =>
                              setItems((rows) =>
                                rows.filter((_, ri) => ri !== i),
                              )
                            }
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "16px",
                            }}
                          >
                            🗑️
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "16px",
              }}
            >
              <button
                className="btn-save-project"
                onClick={handleSaveItems}
                disabled={saving}
              >
                {saving ? "⏳ Saving..." : "💾 Save Item List"}
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 2: Labor Sheet ── */}
        {activeTab === 2 && (
          <div>
            <div
              style={{
                marginBottom: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>
                Job Card: <strong>{jobCardNumber}</strong> — Record labor and
                time spent.
              </p>
              <button
                className="btn-add-small"
                onClick={() => setLabor((l) => [...l, emptyLabor()])}
              >
                + Add Row
              </button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="meetings-table" style={{ minWidth: "700px" }}>
                <thead>
                  <tr>
                    <th style={{ width: "44px" }}>No</th>
                    <th style={{ width: "120px" }}>Date</th>
                    <th style={{ width: "150px" }}>Person</th>
                    <th>Job Done</th>
                    <th style={{ width: "100px" }}>In Time</th>
                    <th style={{ width: "100px" }}>Out Time</th>
                    <th style={{ width: "44px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {labor.map((lb, i) => (
                    <tr key={i}>
                      <td
                        style={{
                          textAlign: "center",
                          color: "#888",
                          fontWeight: 600,
                        }}
                      >
                        {i + 1}
                      </td>
                      {[
                        "date",
                        "person",
                        "job_done",
                        "in_time",
                        "out_time",
                      ].map((field) => (
                        <td key={field}>
                          <input
                            type={
                              field === "date"
                                ? "date"
                                : field.includes("time")
                                  ? "time"
                                  : "text"
                            }
                            value={(lb as any)[field]}
                            onChange={(e) =>
                              setLabor((rows) =>
                                rows.map((r, ri) =>
                                  ri === i
                                    ? { ...r, [field]: e.target.value }
                                    : r,
                                ),
                              )
                            }
                            style={{
                              width: "100%",
                              padding: "6px 8px",
                              fontSize: "13px",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              boxSizing: "border-box",
                            }}
                          />
                        </td>
                      ))}
                      <td style={{ textAlign: "center" }}>
                        {labor.length > 1 && (
                          <button
                            onClick={() =>
                              setLabor((rows) =>
                                rows.filter((_, ri) => ri !== i),
                              )
                            }
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "16px",
                            }}
                          >
                            🗑️
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "16px",
              }}
            >
              <button
                className="btn-save-project"
                onClick={handleSaveLabor}
                disabled={saving}
              >
                {saving ? "⏳ Saving..." : "💾 Save Labor Sheet"}
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 3: GRN ── */}
        {activeTab === 3 && (
          <div>
            <Section title="Good Received Note">
              <F
                label="Date"
                type="date"
                value={grn.date}
                onChange={(v: string) => setGrn((s) => ({ ...s, date: v }))}
                half
              />
              <F
                label="Time"
                type="time"
                value={grn.time}
                onChange={(v: string) => setGrn((s) => ({ ...s, time: v }))}
                half
              />
              <F
                label="Contact Detail"
                value={grn.contact_detail}
                onChange={(v: string) =>
                  setGrn((s) => ({ ...s, contact_detail: v }))
                }
                half
              />
              <F
                label="Vehicle Number"
                value={grn.vehicle_number}
                onChange={(v: string) =>
                  setGrn((s) => ({ ...s, vehicle_number: v }))
                }
                half
              />
              <F
                label="Job Description"
                type="textarea"
                value={grn.job_description}
                onChange={(v: string) =>
                  setGrn((s) => ({ ...s, job_description: v }))
                }
              />
              <F
                label="Note"
                type="textarea"
                value={grn.note}
                onChange={(v: string) => setGrn((s) => ({ ...s, note: v }))}
              />
              <F
                label="Driver"
                value={grn.driver}
                onChange={(v: string) => setGrn((s) => ({ ...s, driver: v }))}
                half
              />
              <F
                label="Driver ID Number"
                value={grn.driver_id_number}
                onChange={(v: string) =>
                  setGrn((s) => ({ ...s, driver_id_number: v }))
                }
                half
              />
              <F
                label="Office Person"
                value={grn.office_person}
                onChange={(v: string) =>
                  setGrn((s) => ({ ...s, office_person: v }))
                }
                half
              />
            </Section>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
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

        {/* ── TAB 4: Dispatch Note ── */}
        {activeTab === 4 && (
          <div>
            <Section title="Dispatch Note">
              <F
                label="Date"
                type="date"
                value={dispatch.date}
                onChange={(v: string) =>
                  setDispatch((s) => ({ ...s, date: v }))
                }
                half
              />
              <F
                label="Time"
                type="time"
                value={dispatch.time}
                onChange={(v: string) =>
                  setDispatch((s) => ({ ...s, time: v }))
                }
                half
              />
              <F
                label="Contact Detail"
                value={dispatch.contact_detail}
                onChange={(v: string) =>
                  setDispatch((s) => ({ ...s, contact_detail: v }))
                }
                half
              />
              <F
                label="Invoice Number"
                value={dispatch.invoice_number}
                onChange={(v: string) =>
                  setDispatch((s) => ({ ...s, invoice_number: v }))
                }
                half
              />
              <F
                label="Vehicle Number"
                value={dispatch.vehicle_number}
                onChange={(v: string) =>
                  setDispatch((s) => ({ ...s, vehicle_number: v }))
                }
                half
              />
              <F
                label="Driver"
                value={dispatch.driver}
                onChange={(v: string) =>
                  setDispatch((s) => ({ ...s, driver: v }))
                }
                half
              />
              <F
                label="Driver ID Number"
                value={dispatch.driver_id_number}
                onChange={(v: string) =>
                  setDispatch((s) => ({ ...s, driver_id_number: v }))
                }
                half
              />
              <F
                label="Office Person"
                value={dispatch.office_person}
                onChange={(v: string) =>
                  setDispatch((s) => ({ ...s, office_person: v }))
                }
                half
              />
              <F
                label="Stores Person"
                value={dispatch.stores_person}
                onChange={(v: string) =>
                  setDispatch((s) => ({ ...s, stores_person: v }))
                }
                half
              />
            </Section>
            <p
              style={{
                fontSize: "13px",
                color: "#e65100",
                background: "#fff8e1",
                padding: "10px 14px",
                borderRadius: "6px",
                marginBottom: "12px",
              }}
            >
              ⚠️ Saving the Dispatch Note will automatically update the job card
              status to <strong>Dispatched</strong>.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
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

export default JobCardDetail;
