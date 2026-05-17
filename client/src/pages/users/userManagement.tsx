import { useState, useEffect } from "react";
import axios from "axios";
import "./UserManagement.css";

type PortalId =
  | "customers"
  | "purchasing"
  | "stores"
  | "workshop"
  | "documents"
  | "jobAssigned"
  | "meetings"
  | "followup"
  | "staff";

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: "admin" | "user" | "office" | "office_admin" | "stores" | "data_entry";
  permissions: {
    portals: PortalId[];
    canManageUsers?: boolean;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface Portal {
  id: PortalId;
  label: string;
  icon: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPortals, setSelectedPortals] = useState<PortalId[]>([]);
  const [isUserActive, setIsUserActive] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("user");

  const portals: Portal[] = [
    { id: "customers", label: "Customers", icon: "👥" },
    { id: "purchasing", label: "Purchasing", icon: "🚚" },
    { id: "stores", label: "Stores", icon: "🏪" },
    { id: "workshop", label: "Workshop", icon: "🔧" },
    { id: "documents", label: "Documents", icon: "📄" },
    { id: "jobAssigned", label: "jobAssigned", icon: "⏱️" },
    { id: "meetings", label: "Meetings", icon: "👨‍💼" },
    { id: "followup", label: "Follow Up", icon: "🔄" },
    { id: "staff", label: "Staff", icon: "👤" },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.get("http://localhost:5000/api/auth/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.users) {
        setUsers(response.data.users);
      }
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(err.response?.data?.error || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setSelectedPortals(user.permissions.portals || []);
    setIsUserActive(user.isActive);
    setSelectedRole(user.role);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setSelectedPortals([]);
    setIsUserActive(false);
    setShowModal(false);
  };

  const togglePortal = (portalId: PortalId) => {
    setSelectedPortals((prev) =>
      prev.includes(portalId)
        ? prev.filter((p) => p !== portalId)
        : [...prev, portalId],
    );
  };

  const selectAllPortals = () => {
    setSelectedPortals(
      selectedPortals.length === portals.length ? [] : portals.map((p) => p.id),
    );
  };

  const savePermissions = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `http://localhost:5000/api/auth/users/${selectedUser.id}/permissions`,
        {
          permissions: { portals: selectedPortals },
          isActive: isUserActive,
          role: selectedRole,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      alert("User permissions updated successfully!");
      fetchUsers();
      closeModal();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update permissions");
    }
  };

  const deleteUser = async (userId: number, username: string) => {
    if (!confirm(`Delete user "${username}"?`)) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/auth/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("User deleted successfully!");
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete user");
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="page-header">
        <h1>User Management</h1>
        <p>Manage users and their portal access permissions</p>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Portal Access</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="user-info">
                    {user.role === "admin" && (
                      <span className="admin-badge">👑</span>
                    )}
                    <strong>{user.username}</strong>
                  </div>
                </td>
                <td>
                  {user.firstName} {user.lastName}
                </td>
                <td>
                  <span className={`role-badge ${user.role}`}>{user.role}</span>
                </td>
                <td>
                  <span
                    className={`status-badge ${user.isActive ? "active" : "inactive"}`}
                  >
                    {user.isActive ? "✓ Active" : "✗ Inactive"}
                  </span>
                </td>
                <td>
                  <span className="access-count">
                    {user.permissions.portals?.length || 0} / {portals.length}{" "}
                    portals
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => openEditModal(user)}
                      className="btn-edit"
                    >
                      ⚙️ Edit
                    </button>
                    {user.role !== "admin" && (
                      <button
                        onClick={() => deleteUser(user.id, user.username)}
                        className="btn-delete"
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="empty-state">
            <p>No users found</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showModal && selectedUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit User Permissions</h2>
              <button className="close-button" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="user-details">
                <p>
                  <strong>User:</strong> {selectedUser.username}
                </p>
                <p>
                  <strong>Name:</strong> {selectedUser.firstName}{" "}
                  {selectedUser.lastName}
                </p>
              </div>

              <div className="status-section">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isUserActive}
                    onChange={(e) => setIsUserActive(e.target.checked)}
                  />
                  <span>Account Active</span>
                </label>
              </div>

              {/* Role Section */}
              <div className="status-section" style={{ marginTop: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#555",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                  }}
                >
                  User Role
                </label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {[
                    {
                      value: "user",
                      label: "User",
                      desc: "Creates requests",
                      color: "#1976D2",
                    },
                    {
                      value: "office",
                      label: "Office",
                      desc: "Order Form, PO, Invoice, Delivery",
                      color: "#C2185B",
                    },
                    {
                      value: "office_admin",
                      label: "Office Admin",
                      desc: "Office + Can Approve",
                      color: "#E65100",
                    },
                    {
                      value: "stores",
                      label: "Stores",
                      desc: "Delivery section only",
                      color: "#7B1FA2",
                    },
                    {
                      value: "admin",
                      label: "Admin",
                      desc: "Full access",
                      color: "#2E7D32",
                    },
                    {
                      value: "data_entry",
                      label: "Data Entry",
                      desc: "BOQ data entry only",
                      color: "#0891b2",
                    },
                  ].map((r) => (
                    <div
                      key={r.value}
                      onClick={() => setSelectedRole(r.value as any)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        border: "2px solid",
                        borderColor:
                          selectedRole === r.value ? r.color : "#e0e0e0",
                        background:
                          selectedRole === r.value ? r.color + "15" : "#fff",
                        transition: "all 0.2s",
                        minWidth: "120px",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "13px",
                          color: selectedRole === r.value ? r.color : "#333",
                        }}
                      >
                        {r.label}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#888",
                          marginTop: "2px",
                        }}
                      >
                        {r.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="portal-access-header">
                <h3>Portal Permissions</h3>
                <button onClick={selectAllPortals} className="btn-secondary">
                  {selectedPortals.length === portals.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>

              <div className="portal-grid">
                {portals.map((portal) => (
                  <div
                    key={portal.id}
                    className={`portal-card ${selectedPortals.includes(portal.id) ? "active" : ""}`}
                    onClick={() => togglePortal(portal.id)}
                  >
                    <div className="portal-icon">{portal.icon}</div>
                    <div className="portal-label">{portal.label}</div>
                    <div className="portal-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedPortals.includes(portal.id)}
                        readOnly
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={closeModal} className="btn-cancel">
                Cancel
              </button>
              <button onClick={savePermissions} className="btn-save">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
