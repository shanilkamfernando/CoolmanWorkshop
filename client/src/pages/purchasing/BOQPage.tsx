import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import companyLogo from "../../assets/mainlogo.jpeg";
import "../customers/ProjectDashboard.css";

interface BOQItem {
  id: number;
  specification: string;
  item_name: string;
  part_number: string;
  boq_quantity: number;
  available_quantity: number;
  remaining_quantity: number;
}

const BOQPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<BOQItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<BOQItem | null>(null);
  const [form, setForm] = useState({
    item_name: "",
    specification: "",
    part_number: "",
    boq_quantity: "",
    available_quantity: "",
  });
  const [saving, setSaving] = useState(false);

  const token = () => localStorage.getItem("token");
  const hdr = () => ({ Authorization: `Bearer ${token()}` });
  const isAdmin = user?.role === "admin";
  const canEdit = ["admin", "data_entry"].includes(user?.role || "");

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const r = await axios.get("http://localhost:5000/api/boq", {
        headers: hdr(),
      });
      setItems(r.data.items || []);
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItem) {
        await axios.put(
          `http://localhost:5000/api/boq/${editingItem.id}`,
          form,
          { headers: hdr() },
        );
      } else {
        await axios.post("http://localhost:5000/api/boq", form, {
          headers: hdr(),
        });
      }
      setForm({
        item_name: "",
        specification: "",
        part_number: "",
        boq_quantity: "",
        available_quantity: "",
      });
      setShowForm(false);
      setEditingItem(null);
      fetchItems();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/boq/${id}`, {
        headers: hdr(),
      });
      fetchItems();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete");
    }
  };

  const startEdit = (item: BOQItem) => {
    setEditingItem(item);
    setForm({
      item_name: item.item_name,
      specification: item.specification,
      part_number: item.part_number,
      boq_quantity: String(item.boq_quantity),
      available_quantity: String(item.available_quantity),
    });
    setShowForm(true);
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
  const td: React.CSSProperties = {
    padding: "10px 14px",
    fontSize: "13px",
    borderBottom: "1px solid #f3f4f6",
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
          <span className="user-icon">👤</span>
          <span className="username">{user?.username}</span>
        </div>
      </div>

      <div className="project-main-content">
        <div className="project-header-row">
          <div>
            <h2 style={{ margin: 0 }}>BOQ Items</h2>
            <p
              style={{
                color: "#6b7280",
                fontSize: "0.875rem",
                marginTop: "4px",
              }}
            >
              {items.length} items in BOQ
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {canEdit && !showForm && (
              <button
                className="btn-save-project"
                onClick={() => {
                  setShowForm(true);
                  setEditingItem(null);
                  setForm({
                    item_name: "",
                    specification: "",
                    part_number: "",
                    boq_quantity: "",
                    available_quantity: "",
                  });
                }}
              >
                + Add Item
              </button>
            )}
            <button
              className="btn-back"
              onClick={() => navigate("/purchasing")}
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && canEdit && (
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
              {editingItem ? "Edit BOQ Item" : "New BOQ Item"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <label style={lbl}>Item Name *</label>
                  <input
                    value={form.item_name}
                    style={inp}
                    placeholder="Item name"
                    onChange={(e) =>
                      setForm((p) => ({ ...p, item_name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label style={lbl}>Specification</label>
                  <input
                    value={form.specification}
                    style={inp}
                    placeholder="e.g. 001"
                    onChange={(e) =>
                      setForm((p) => ({ ...p, specification: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label style={lbl}>Part Number</label>
                  <input
                    value={form.part_number}
                    style={inp}
                    placeholder="Part no."
                    onChange={(e) =>
                      setForm((p) => ({ ...p, part_number: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label style={lbl}>BOQ Quantity</label>
                  <input
                    type="number"
                    value={form.boq_quantity}
                    style={inp}
                    placeholder="0"
                    onChange={(e) =>
                      setForm((p) => ({ ...p, boq_quantity: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label style={lbl}>Available Quantity</label>
                  <input
                    type="number"
                    value={form.available_quantity}
                    style={inp}
                    placeholder="0"
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        available_quantity: e.target.value,
                      }))
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
                  {saving
                    ? "Saving..."
                    : editingItem
                      ? "✓ Update"
                      : "✓ Add Item"}
                </button>
                <button
                  type="button"
                  className="btn-back"
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* BOQ Table */}
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
                <th style={th}>Item No</th>
                <th style={th}>Item Name</th>
                <th style={th}>Part Number</th>
                <th style={th}>BOQ Qty</th>
                <th style={th}>Available Qty</th>
                <th style={th}>Remaining Qty</th>
                {canEdit && (
                  <th style={{ ...th, textAlign: "center" as const }}>
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      ...td,
                      textAlign: "center",
                      color: "#9ca3af",
                      padding: "40px",
                    }}
                  >
                    No BOQ items yet. Click + Add Item to get started.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
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
                      <td style={td}>{item.specification || "—"}</td>
                      <td style={{ ...td, fontWeight: 500 }}>
                        {item.item_name}
                        {!item.specification &&
                          !item.part_number &&
                          item.boq_quantity == 0 && (
                            <span
                              style={{
                                marginLeft: "8px",
                                fontSize: "10px",
                                fontWeight: 700,
                                background: "#fff7ed",
                                color: "#ea580c",
                                border: "1px solid #fed7aa",
                                borderRadius: "4px",
                                padding: "1px 6px",
                              }}
                            >
                              ⚠️ Needs details
                            </span>
                          )}
                      </td>
                      <td style={td}>{item.part_number || "—"}</td>
                      <td style={td}>{item.boq_quantity}</td>
                      <td style={td}>{item.available_quantity}</td>
                      <td style={td}>
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
                      {canEdit && (
                        <td style={{ ...td, textAlign: "center" as const }}>
                          <div
                            style={{
                              display: "flex",
                              gap: "6px",
                              justifyContent: "center",
                            }}
                          >
                            <button
                              onClick={() => startEdit(item)}
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
                                  handleDelete(item.id, item.item_name)
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
    </div>
  );
};

export default BOQPage;
