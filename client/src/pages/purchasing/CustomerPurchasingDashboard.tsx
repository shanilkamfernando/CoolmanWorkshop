import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import companyLogo from "../../assets/mainlogo.jpeg";
import "../customers/ProjectDashboard.css";

interface BOQItem {
  id: number;
  item_name: string;
  item_no: string;
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
  item_no: string;
  part_number: string;
  created_at: string;
}

const fmtDate = (d: string) => {
  if (!d) return "—";
  const [y, m, day] = d.split("T")[0].split("-");
  return `${day} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][parseInt(m) - 1]} ${y}`;
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

  const [boqForm, setBOQForm] = useState({
    boq_item_id: "",
    product: "",
    available_quantity: "",
    required_quantity: "",
    required_date: "",
    description: "",
  });
  const [nonBOQForm, setNonBOQForm] = useState({
    product: "",
    required_quantity: "",
    required_date: "",
    description: "",
  });

  const token = () => localStorage.getItem("token");
  const hdr = () => ({ Authorization: `Bearer ${token()}` });
  const BASE = `http://localhost:5000/api/boq/customer/${customerId}/entries`;
  const isAdmin = user?.role === "admin";

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
        `http://localhost:5000/api/purchasing/customers/${customerId}`,
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

  const fetchBOQItems = async () => {
    try {
      const r = await axios.get("http://localhost:5000/api/boq", {
        headers: hdr(),
      });
      setBOQItems(r.data.items || []);
    } catch {}
  };

  const handleSelectBOQItem = (item: BOQItem) => {
    setSelectedBOQItem(item);
    setBOQSearch(item.item_name);
    setShowDropdown(false);
    setBOQForm((p) => ({
      ...p,
      boq_item_id: String(item.id),
      product: item.item_name,
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

  const boqEntries = entries.filter((e) => e.entry_type === "boq");
  const nonBOQEntries = entries.filter((e) => e.entry_type === "non_boq");
  const filteredBOQ = boqItems.filter((i) =>
    i.item_name.toLowerCase().includes(boqSearch.toLowerCase()),
  );

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
          <span className="user-icon">👤</span>
          <span className="username">{user?.username}</span>
        </div>
      </div>

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
                  <div style={{ position: "relative", gridColumn: "span 2" }}>
                    <label style={lbl}>Product (BOQ) *</label>
                    <input
                      value={boqSearch}
                      placeholder="Search BOQ items..."
                      style={inp}
                      onChange={(e) => {
                        setBOQSearch(e.target.value);
                        setShowDropdown(true);
                        setSelectedBOQItem(null);
                        setBOQForm((p) => ({
                          ...p,
                          boq_item_id: "",
                          product: "",
                          available_quantity: "",
                        }));
                      }}
                      onFocus={() => setShowDropdown(true)}
                    />
                    {showDropdown && filteredBOQ.length > 0 && (
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
                        {filteredBOQ.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleSelectBOQItem(item)}
                            style={{
                              padding: "10px 14px",
                              cursor: "pointer",
                              borderBottom: "1px solid #f3f4f6",
                              fontSize: "13px",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "#f9fafb")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "#fff")
                            }
                          >
                            <div style={{ fontWeight: 500 }}>
                              {item.item_name}
                            </div>
                            <div style={{ fontSize: "11px", color: "#6b7280" }}>
                              {item.item_no && `#${item.item_no} · `}
                              Remaining:{" "}
                              <strong
                                style={{
                                  color:
                                    item.remaining_quantity <= 0
                                      ? "#dc2626"
                                      : "#16a34a",
                                }}
                              >
                                {item.remaining_quantity}
                              </strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
                      value={boqForm.required_quantity}
                      style={inp}
                      placeholder="0"
                      onChange={(e) =>
                        setBOQForm((p) => ({
                          ...p,
                          required_quantity: e.target.value,
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
                  <th style={th}>Product</th>
                  <th style={th}>Item No</th>
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
                      colSpan={10}
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
                          key={`${entry.id}-normal`}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#f9fafb")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "#fff")
                          }
                        >
                          {/* <td style={td()}>{entry.id}</td> */}
                          <td style={td({ fontWeight: 500 })}>
                            {entry.product}
                          </td>
                          <td style={td()}>{entry.item_no || "—"}</td>
                          <td style={td()}>{entry.part_number || "—"}</td>
                          <td style={td()}>
                            {entry.available_quantity ?? "—"}
                          </td>
                          <td style={td({ fontWeight: 600 })}>
                            {hasShortage
                              ? entry.available_quantity
                              : entry.required_quantity}
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
                            <td style={td({ color: "#dc2626" })}></td>
                            <td
                              style={td({ color: "#dc2626", fontWeight: 500 })}
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
                              {entry.item_no || "—"}
                            </td>
                            <td style={td({ color: "#dc2626" })}>
                              {entry.part_number || "—"}
                            </td>
                            <td style={td({ color: "#dc2626" })}>0</td>
                            <td
                              style={td({ color: "#dc2626", fontWeight: 700 })}
                            >
                              {entry.shortage_quantity}
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
                    <label style={lbl}>Quantity</label>
                    <input
                      type="number"
                      value={nonBOQForm.required_quantity}
                      style={inp}
                      placeholder="0"
                      onChange={(e) =>
                        setNonBOQForm((p) => ({
                          ...p,
                          required_quantity: e.target.value,
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
                  {/* <th style={{ ...th, background: "#fff7ed" }}>#</th> */}
                  <th style={{ ...th, background: "#fff7ed" }}>Product</th>
                  <th style={{ ...th, background: "#fff7ed" }}>Quantity</th>
                  <th style={{ ...th, background: "#fff7ed" }}>
                    Required Date
                  </th>
                  <th style={{ ...th, background: "#fff7ed" }}>Description</th>
                  <th style={{ ...th, background: "#fff7ed" }}>Requested By</th>
                  {isAdmin && (
                    <th style={{ ...th, background: "#fff7ed" }}></th>
                  )}
                </tr>
              </thead>
              <tbody>
                {nonBOQEntries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
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
                    <tr
                      key={entry.id}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#fff7ed")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "#fff")
                      }
                    >
                      {/* <td style={td()}>{entry.id}</td> */}
                      <td style={td({ fontWeight: 600, color: "#ea580c" })}>
                        {entry.product}
                      </td>
                      <td style={td()}>{entry.required_quantity || "—"}</td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerPurchasingDashboard;
