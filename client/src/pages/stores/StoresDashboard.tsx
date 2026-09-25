// ============================================
// Stores Dashboard - Inventory Management
// Save as: client/src/pages/stores/StoresDashboard.tsx
// ============================================

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./StoresDashboard.css";
import companyLogo from "../../assets/mainlogo.png";

interface User {
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface StoreItem {
  id: number;
  po: string;
  ordered_date: string;
  received_date: string;
  part_name: string;
  part_number: string;
  quantity: number;
  left_quantity: number;
  location: string;
  rack_no: string;
  used_date: string;
  borrowed_quantity: number;
  issue_note: string;
  used_by: string;
  used_purpose: string;
  note: string;
  returned: boolean;
  created_at: string;
}

const StoresDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<StoreItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchPartNumber, setSearchPartNumber] = useState("");
  const [searchPartName, setSearchPartName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<StoreItem | null>(null);

  // Usage modal state
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [usageItem, setUsageItem] = useState<StoreItem | null>(null);
  const [usageForm, setUsageForm] = useState({
    used_date: "",
    borrowed_quantity: 0,
    issue_note: "",
    used_by: "",
    used_purpose: "",
    returned: false,
  });

  const { categoryKey, brandId } = useParams();

  // Add form — stock fields only, no usage fields
  const [newItem, setNewItem] = useState({
    po: "",
    ordered_date: "",
    received_date: "",
    part_name: "",
    part_number: "",
    quantity: 0,
    location: "",
    rack_no: "",
    note: "",
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
    fetchStoreItems();
  }, [brandId]);

  useEffect(() => {
    handleSearch();
  }, [searchPartNumber, searchPartName, storeItems]);

  const isAdmin = user?.role === "admin";

  const fetchStoreItems = async () => {
    try {
      const token = localStorage.getItem("token");
      const url = brandId
        ? `https://coolmanworkshop-production.up.railway.app/api/stores/items?brandId=${brandId}`
        : "https://coolmanworkshop-production.up.railway.app/api/stores/items";
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStoreItems(response.data.items || []);
    } catch (error) {
      console.error("Error fetching store items:", error);
      setStoreItems([]);
    }
  };

  const handleSearch = () => {
    let filtered = storeItems;
    if (searchPartNumber.trim()) {
      filtered = filtered.filter((item) =>
        item.part_number.toLowerCase().includes(searchPartNumber.toLowerCase()),
      );
    }
    if (searchPartName.trim()) {
      filtered = filtered.filter((item) =>
        item.part_name.toLowerCase().includes(searchPartName.toLowerCase()),
      );
    }
    setFilteredItems(filtered);
  };

  const handleAddItem = async () => {
    if (!newItem.part_name.trim() || !newItem.part_number.trim()) {
      alert("Part name and part number are required");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "https://coolmanworkshop-production.up.railway.app/api/stores/items",
        {
          ...newItem,
          left_quantity: newItem.quantity,
          borrowed_quantity: 0,
          used_date: null,
          issue_note: null,
          used_by: null,
          used_purpose: null,
          returned: false,
          brand_id: brandId || null,
          category_key: categoryKey || null,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.data.success) {
        setShowAddModal(false);
        resetForm();
        fetchStoreItems();
      }
    } catch (error) {
      console.error("Error adding store item:", error);
      alert("Failed to add store item");
    }
  };

  const resetForm = () => {
    setNewItem({
      po: "",
      ordered_date: "",
      received_date: "",
      part_name: "",
      part_number: "",
      quantity: 0,
      location: "",
      rack_no: "",
      note: "",
    });
  };

  const handleDeleteClick = (item: StoreItem) => {
    if (!isAdmin) {
      alert("Only admins can delete items");
      return;
    }
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `https://coolmanworkshop-production.up.railway.app/api/stores/items/${itemToDelete.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      fetchStoreItems();
    } catch (error) {
      alert("Failed to delete store item");
    }
  };

  const handleUpdateItem = (id: number, field: keyof StoreItem, value: any) => {
    if (!isAdmin) {
      alert("Only admins can edit items");
      return;
    }
    setStoreItems(
      storeItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleSaveItem = async (
    id: number,
    field: keyof StoreItem,
    value: any,
  ) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `https://coolmanworkshop-production.up.railway.app/api/stores/items/${id}`,
        { [field]: value },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch {
      alert("Failed to save");
      fetchStoreItems();
    }
  };

  const handleOpenUsage = (item: StoreItem) => {
    setUsageItem(item);
    setUsageForm({
      used_date: item.used_date?.split("T")[0] || "",
      borrowed_quantity: item.borrowed_quantity || 0,
      issue_note: item.issue_note || "",
      used_by: item.used_by || "",
      used_purpose: item.used_purpose || "",
      returned: item.returned || false,
    });
    setShowUsageModal(true);
  };

  const handleSaveUsage = async () => {
    if (!usageItem) return;
    const leftQuantity = usageItem.quantity - usageForm.borrowed_quantity;
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `https://coolmanworkshop-production.up.railway.app/api/stores/items/${usageItem.id}`,
        { ...usageForm, left_quantity: leftQuantity },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setShowUsageModal(false);
      setUsageItem(null);
      fetchStoreItems();
    } catch {
      alert("Failed to save usage");
    }
  };

  const fmtDate = (d: string) => {
    if (!d) return "—";
    const date = new Date(d);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="stores-dashboard">
      {/* Header */}
      <div className="stores-header">
        <div className="header-left">
          <div
            className="logo-container"
            onClick={() => navigate("/dashboard")}
          >
            <img
              src={companyLogo}
              alt="Company Logo"
              className="company-logo"
            />
          </div>
          <h1 className="header-title" onClick={() => navigate("/dashboard")}>
            <span className="brand-cool">COOL</span>
            <span className="brand-man">Man</span> Refrigeration
          </h1>
        </div>
        <div className="header-right">
          <span className="customer-logo-text">Stores</span>
          <span className="user-icon">👤</span>
          <span className="username">{user?.username || "User"}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="stores-main-content">
        {/* Search */}
        <div className="stores-search-section">
          <div className="search-inputs">
            <div className="search-field">
              <label>Part Number</label>
              <input
                type="text"
                value={searchPartNumber}
                onChange={(e) => setSearchPartNumber(e.target.value)}
                placeholder="Search by part number"
                className="search-input"
              />
            </div>
            <div className="search-field">
              <label>Part Name</label>
              <input
                type="text"
                value={searchPartName}
                onChange={(e) => setSearchPartName(e.target.value)}
                placeholder="Search by part name"
                className="search-input"
              />
            </div>
            <button className="btn-search" onClick={handleSearch}>
              🔍 Search
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="stores-actions">
          <button
            className="btn-add-item"
            onClick={() => setShowAddModal(true)}
          >
            + Add Item
          </button>
          <button
            className="btn-search"
            onClick={() => navigate(`/stores/${categoryKey}`)}
          >
            ← Back to Brands
          </button>
        </div>

        {/* Table */}
        <div className="stores-table-container">
          <table className="stores-table">
            <thead>
              <tr>
                <th>PO</th>
                <th>Ordered Date</th>
                <th>Received Date</th>
                <th>Part Name</th>
                <th>Part Number</th>
                <th>Quantity</th>
                <th>Left Quantity</th>
                <th>Location</th>
                <th>Rack No</th>
                <th>Note</th>
                <th style={{ background: "#e8f4fd", color: "#1565c0" }}>
                  Used Date
                </th>
                <th style={{ background: "#e8f4fd", color: "#1565c0" }}>
                  Borrowed Qty
                </th>
                <th style={{ background: "#e8f4fd", color: "#1565c0" }}>
                  Issue Note
                </th>
                <th style={{ background: "#e8f4fd", color: "#1565c0" }}>
                  Used By
                </th>
                <th style={{ background: "#e8f4fd", color: "#1565c0" }}>
                  Used Purpose
                </th>
                <th style={{ background: "#e8f4fd", color: "#1565c0" }}>
                  Returned
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  {/* ── Stock fields — admin editable inline with auto-save on blur ── */}
                  <td>
                    {isAdmin ? (
                      <input
                        type="text"
                        value={item.po || ""}
                        onChange={(e) =>
                          handleUpdateItem(item.id, "po", e.target.value)
                        }
                        onBlur={(e) =>
                          handleSaveItem(item.id, "po", e.target.value)
                        }
                        className="table-input-small"
                      />
                    ) : (
                      <span>{item.po || "—"}</span>
                    )}
                  </td>
                  <td>
                    {isAdmin ? (
                      <input
                        type="date"
                        value={item.ordered_date?.split("T")[0] || ""}
                        onChange={(e) =>
                          handleUpdateItem(
                            item.id,
                            "ordered_date",
                            e.target.value,
                          )
                        }
                        onBlur={(e) =>
                          handleSaveItem(
                            item.id,
                            "ordered_date",
                            e.target.value,
                          )
                        }
                        className="table-input-small"
                      />
                    ) : (
                      <span>{fmtDate(item.ordered_date)}</span>
                    )}
                  </td>
                  <td>
                    {isAdmin ? (
                      <input
                        type="date"
                        value={item.received_date?.split("T")[0] || ""}
                        onChange={(e) =>
                          handleUpdateItem(
                            item.id,
                            "received_date",
                            e.target.value,
                          )
                        }
                        onBlur={(e) =>
                          handleSaveItem(
                            item.id,
                            "received_date",
                            e.target.value,
                          )
                        }
                        className="table-input-small"
                      />
                    ) : (
                      <span>{fmtDate(item.received_date)}</span>
                    )}
                  </td>
                  <td>
                    {isAdmin ? (
                      <input
                        type="text"
                        value={item.part_name || ""}
                        onChange={(e) =>
                          handleUpdateItem(item.id, "part_name", e.target.value)
                        }
                        onBlur={(e) =>
                          handleSaveItem(item.id, "part_name", e.target.value)
                        }
                        className="table-input"
                      />
                    ) : (
                      <span>{item.part_name}</span>
                    )}
                  </td>
                  <td>
                    {isAdmin ? (
                      <input
                        type="text"
                        value={item.part_number || ""}
                        onChange={(e) =>
                          handleUpdateItem(
                            item.id,
                            "part_number",
                            e.target.value,
                          )
                        }
                        onBlur={(e) =>
                          handleSaveItem(item.id, "part_number", e.target.value)
                        }
                        className="table-input"
                      />
                    ) : (
                      <span>{item.part_number}</span>
                    )}
                  </td>
                  <td>
                    {isAdmin ? (
                      <input
                        type="number"
                        value={item.quantity}
                        min={0}
                        onChange={(e) =>
                          handleUpdateItem(
                            item.id,
                            "quantity",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        onBlur={(e) =>
                          handleSaveItem(
                            item.id,
                            "quantity",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        className="table-input-small"
                      />
                    ) : (
                      <span>{item.quantity}</span>
                    )}
                  </td>
                  <td>
                    <span
                      title={`${item.quantity} - ${item.borrowed_quantity} = ${item.left_quantity}`}
                      style={{ cursor: "help" }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          color:
                            item.left_quantity <= 0
                              ? "#f44336"
                              : item.left_quantity <= 5
                                ? "#e65100"
                                : "#2e7d32",
                        }}
                      >
                        {item.left_quantity}
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#888",
                          marginLeft: "4px",
                        }}
                      >
                        ({item.quantity} - {item.borrowed_quantity})
                      </span>
                    </span>
                  </td>
                  <td>
                    {isAdmin ? (
                      <input
                        type="text"
                        value={item.location || ""}
                        onChange={(e) =>
                          handleUpdateItem(item.id, "location", e.target.value)
                        }
                        onBlur={(e) =>
                          handleSaveItem(item.id, "location", e.target.value)
                        }
                        className="table-input"
                      />
                    ) : (
                      <span>{item.location || "—"}</span>
                    )}
                  </td>
                  <td>
                    {isAdmin ? (
                      <input
                        type="text"
                        value={item.rack_no || ""}
                        onChange={(e) =>
                          handleUpdateItem(item.id, "rack_no", e.target.value)
                        }
                        onBlur={(e) =>
                          handleSaveItem(item.id, "rack_no", e.target.value)
                        }
                        className="table-input-small"
                      />
                    ) : (
                      <span>{item.rack_no || "—"}</span>
                    )}
                  </td>
                  <td>
                    {isAdmin ? (
                      <input
                        type="text"
                        value={item.note || ""}
                        onChange={(e) =>
                          handleUpdateItem(item.id, "note", e.target.value)
                        }
                        onBlur={(e) =>
                          handleSaveItem(item.id, "note", e.target.value)
                        }
                        className="table-input"
                      />
                    ) : (
                      <span>{item.note || "—"}</span>
                    )}
                  </td>

                  {/* ── Usage fields — always read-only, edited via 📤 Usage modal ── */}
                  <td style={{ background: "#f8fbff" }}>
                    <span
                      style={{
                        fontSize: "13px",
                        color: item.used_date ? "#333" : "#ccc",
                      }}
                    >
                      {fmtDate(item.used_date)}
                    </span>
                  </td>
                  <td style={{ background: "#f8fbff" }}>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: item.borrowed_quantity > 0 ? 600 : 400,
                        color: item.borrowed_quantity > 0 ? "#e65100" : "#ccc",
                      }}
                    >
                      {item.borrowed_quantity > 0
                        ? item.borrowed_quantity
                        : "—"}
                    </span>
                  </td>
                  <td style={{ background: "#f8fbff" }}>
                    <span
                      style={{
                        fontSize: "13px",
                        color: item.issue_note ? "#333" : "#ccc",
                      }}
                    >
                      {item.issue_note || "—"}
                    </span>
                  </td>
                  <td style={{ background: "#f8fbff" }}>
                    <span
                      style={{
                        fontSize: "13px",
                        color: item.used_by ? "#333" : "#ccc",
                      }}
                    >
                      {item.used_by || "—"}
                    </span>
                  </td>
                  <td style={{ background: "#f8fbff" }}>
                    <span
                      style={{
                        fontSize: "13px",
                        color: item.used_purpose ? "#333" : "#ccc",
                      }}
                    >
                      {item.used_purpose || "—"}
                    </span>
                  </td>
                  <td style={{ background: "#f8fbff" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontSize: "12px",
                        fontWeight: 600,
                        background: item.returned
                          ? "#e8f5e9"
                          : item.borrowed_quantity > 0
                            ? "#fff3e0"
                            : "#f5f5f5",
                        color: item.returned
                          ? "#2e7d32"
                          : item.borrowed_quantity > 0
                            ? "#e65100"
                            : "#bbb",
                      }}
                    >
                      {item.returned
                        ? "✓ Returned"
                        : item.borrowed_quantity > 0
                          ? "Pending"
                          : "—"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        alignItems: "center",
                      }}
                    >
                      <button
                        onClick={() => handleOpenUsage(item)}
                        style={{
                          padding: "3px 10px",
                          background: "#667eea",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        📤 Usage
                      </button>
                      {isAdmin && (
                        <button
                          className="btn-delete-small"
                          onClick={() => handleDeleteClick(item)}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td
                    colSpan={17}
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "#999",
                    }}
                  >
                    No items found. Click '+ Add Item' to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Item Modal — stock fields only ── */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-content-large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Add New Store Item</h2>
              <button
                className="close-button"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div
                style={{
                  fontSize: "13px",
                  color: "#555",
                  marginBottom: "16px",
                  padding: "8px 12px",
                  background: "#f8f9ff",
                  borderRadius: "6px",
                  borderLeft: "3px solid #667eea",
                }}
              >
                📦 Fill in stock details. Usage information (borrowed quantity,
                used by, etc.) can be recorded later using the{" "}
                <strong>📤 Usage</strong> button on each row.
              </div>
              <div className="form-grid-4">
                <div className="form-group">
                  <label>PO</label>
                  <input
                    type="text"
                    value={newItem.po}
                    onChange={(e) =>
                      setNewItem({ ...newItem, po: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Ordered Date</label>
                  <input
                    type="date"
                    value={newItem.ordered_date}
                    onChange={(e) =>
                      setNewItem({ ...newItem, ordered_date: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Received Date</label>
                  <input
                    type="date"
                    value={newItem.received_date}
                    onChange={(e) =>
                      setNewItem({ ...newItem, received_date: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>
                    Part Name <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={newItem.part_name}
                    onChange={(e) =>
                      setNewItem({ ...newItem, part_name: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>
                    Part Number <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={newItem.part_number}
                    onChange={(e) =>
                      setNewItem({ ...newItem, part_number: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    value={newItem.quantity}
                    min={0}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        quantity: parseInt(e.target.value) || 0,
                      })
                    }
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={newItem.location}
                    onChange={(e) =>
                      setNewItem({ ...newItem, location: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Rack No</label>
                  <input
                    type="text"
                    value={newItem.rack_no}
                    onChange={(e) =>
                      setNewItem({ ...newItem, rack_no: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Note</label>
                  <input
                    type="text"
                    value={newItem.note}
                    onChange={(e) =>
                      setNewItem({ ...newItem, note: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
              </div>
              <div
                style={{
                  marginTop: "12px",
                  padding: "10px 14px",
                  background: "#f5f5f5",
                  borderRadius: "6px",
                  fontSize: "13px",
                }}
              >
                <strong>Left Quantity will be:</strong> {newItem.quantity} (full
                stock — no usage recorded yet)
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button className="btn-save" onClick={handleAddItem}>
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Record Usage Modal ── */}
      {showUsageModal && usageItem && (
        <div className="modal-overlay" onClick={() => setShowUsageModal(false)}>
          <div
            className="modal-content-large"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "560px" }}
          >
            <div className="modal-header">
              <h2>📤 Record Usage</h2>
              <button
                className="close-button"
                onClick={() => setShowUsageModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div
                style={{
                  background: "#e3f2fd",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "13px",
                }}
              >
                <strong>{usageItem.part_name}</strong> &nbsp;·&nbsp; Part No:{" "}
                <strong>{usageItem.part_number}</strong>
                <br />
                <span style={{ marginTop: "4px", display: "block" }}>
                  Total Quantity: <strong>{usageItem.quantity}</strong>{" "}
                  &nbsp;·&nbsp; Currently Left:{" "}
                  <strong
                    style={{
                      color:
                        usageItem.left_quantity <= 0 ? "#f44336" : "#2e7d32",
                    }}
                  >
                    {usageItem.left_quantity}
                  </strong>
                </span>
              </div>
              <div
                className="form-grid-4"
                style={{ gridTemplateColumns: "1fr 1fr" }}
              >
                <div className="form-group">
                  <label>Used Date</label>
                  <input
                    type="date"
                    value={usageForm.used_date}
                    onChange={(e) =>
                      setUsageForm((f) => ({ ...f, used_date: e.target.value }))
                    }
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Borrowed Quantity</label>
                  <input
                    type="number"
                    value={usageForm.borrowed_quantity}
                    min={0}
                    max={usageItem.quantity}
                    onChange={(e) =>
                      setUsageForm((f) => ({
                        ...f,
                        borrowed_quantity: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="form-input"
                  />
                  <small
                    style={{
                      color:
                        usageItem.quantity - usageForm.borrowed_quantity < 0
                          ? "#f44336"
                          : "#888",
                      marginTop: "3px",
                      display: "block",
                    }}
                  >
                    Left after usage:{" "}
                    <strong>
                      {usageItem.quantity - usageForm.borrowed_quantity}
                    </strong>
                  </small>
                </div>
                <div className="form-group">
                  <label>Used By</label>
                  <input
                    type="text"
                    value={usageForm.used_by}
                    onChange={(e) =>
                      setUsageForm((f) => ({ ...f, used_by: e.target.value }))
                    }
                    className="form-input"
                    placeholder="Person's name"
                  />
                </div>
                <div className="form-group">
                  <label>Used Purpose</label>
                  <input
                    type="text"
                    value={usageForm.used_purpose}
                    onChange={(e) =>
                      setUsageForm((f) => ({
                        ...f,
                        used_purpose: e.target.value,
                      }))
                    }
                    className="form-input"
                    placeholder="Purpose of use"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Issue Note</label>
                  <input
                    type="text"
                    value={usageForm.issue_note}
                    onChange={(e) =>
                      setUsageForm((f) => ({
                        ...f,
                        issue_note: e.target.value,
                      }))
                    }
                    className="form-input"
                    placeholder="Any notes about this issue"
                  />
                </div>
                <div
                  className="form-group"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    paddingTop: "8px",
                  }}
                >
                  <input
                    type="checkbox"
                    id="returned-check"
                    checked={usageForm.returned}
                    onChange={(e) =>
                      setUsageForm((f) => ({
                        ...f,
                        returned: e.target.checked,
                      }))
                    }
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  <label
                    htmlFor="returned-check"
                    style={{ fontWeight: 600, cursor: "pointer", margin: 0 }}
                  >
                    Returned
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowUsageModal(false)}
              >
                Cancel
              </button>
              <button className="btn-save" onClick={handleSaveUsage}>
                💾 Save Usage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteConfirm && itemToDelete && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="modal-content-simple"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Delete Store Item</h2>
              <button
                className="close-button"
                onClick={() => setShowDeleteConfirm(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete{" "}
                <strong>{itemToDelete.part_name}</strong> (
                {itemToDelete.part_number})?
              </p>
              <p style={{ color: "#f44336", marginTop: "10px" }}>
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleConfirmDelete}
                style={{ background: "#f44336" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoresDashboard;
