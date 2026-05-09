// ============================================
// Follow Up Dashboard
// Save as: client/src/pages/followup/FollowUpDashboard.tsx
// ============================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./FollowUpDashboard.css";
import companyLogo from "../../assets/mainlogo.jpeg";

interface User {
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Contact {
  date: string;
  update: string;
  logged_by: string;
}

interface FollowUp {
  id: number;
  follow_up_no: string;
  company: string;
  project: string;
  person: string;
  description: string;
  contacts: Contact[]; // array of up to 5 contact attempts
  created_by: string;
  created_at: string;
}

const MAX_CONTACTS = 5;

const FollowUpDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FollowUp | null>(null);

  // Modal for user adding a contact attempt
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactTarget, setContactTarget] = useState<FollowUp | null>(null);
  const [contactForm, setContactForm] = useState({ date: "", update: "" });

  // Admin add form
  const emptyForm = {
    company: "",
    project: "",
    person: "",
    description: "",
    contact1_date: "",
    contact1_update: "",
  };
  const [addForm, setAddForm] = useState(emptyForm);

  // Admin edit state — inline per-cell
  const [editingCell, setEditingCell] = useState<{
    id: number;
    field: string;
  } | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
    fetchFollowUps();
  }, []);

  const isAdmin = user?.role === "admin";

  const fetchFollowUps = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/followups", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFollowUps(res.data.followUps || []);
    } catch (err) {
      console.error("Error fetching follow-ups:", err);
    }
  };

  // ── Admin: Add new follow-up ──────────────────────────────────────────────
  const handleAddFollowUp = async () => {
    if (!addForm.company.trim() || !addForm.person.trim()) {
      alert("Company and Person are required");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/followups", addForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowAddModal(false);
      setAddForm(emptyForm);
      fetchFollowUps();
    } catch (err) {
      console.error("Error adding follow-up:", err);
      alert("Failed to add follow-up");
    }
  };

  // ── Admin: Inline edit of main fields ────────────────────────────────────
  const startEdit = (id: number, field: string, value: string) => {
    if (!isAdmin) return;
    setEditingCell({ id, field });
    setEditValue(value);
  };

  const saveEdit = async (id: number, field: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:5000/api/followups/${id}/field`,
        {
          field,
          value: editValue,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setEditingCell(null);
      fetchFollowUps();
    } catch (err) {
      console.error("Error saving edit:", err);
      alert("Failed to save");
    }
  };

  // ── Admin: Edit a specific contact entry ─────────────────────────────────
  const saveContactEdit = async (
    id: number,
    contactIndex: number,
    field: "date" | "update",
    value: string,
  ) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:5000/api/followups/${id}/contact`,
        {
          contact_index: contactIndex,
          field,
          value,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setEditingCell(null);
      fetchFollowUps();
    } catch (err) {
      console.error("Error saving contact edit:", err);
    }
  };

  // ── User: Log a new contact attempt ──────────────────────────────────────
  const openContactModal = (fu: FollowUp) => {
    const contactCount = fu.contacts?.length || 0;
    if (contactCount >= MAX_CONTACTS) {
      alert("Maximum 5 contact attempts have already been logged.");
      return;
    }
    setContactTarget(fu);
    setContactForm({
      date: new Date().toISOString().split("T")[0],
      update: "",
    });
    setShowContactModal(true);
  };

  const handleLogContact = async () => {
    if (!contactForm.date || !contactForm.update.trim()) {
      alert("Date and update note are required");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/followups/${contactTarget?.id}/contact`,
        { date: contactForm.date, update: contactForm.update },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setShowContactModal(false);
      setContactTarget(null);
      setContactForm({ date: "", update: "" });
      fetchFollowUps();
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to log contact";
      alert(msg);
    }
  };

  // ── Admin: Delete ─────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/followups/${itemToDelete.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      fetchFollowUps();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  const filtered = followUps.filter(
    (fu) =>
      !searchTerm.trim() ||
      fu.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fu.person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fu.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fu.follow_up_no?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getContactProgress = (contacts: Contact[]) => {
    const count = contacts?.length || 0;
    return { count, pct: (count / MAX_CONTACTS) * 100 };
  };

  // ── Editable cell helper ──────────────────────────────────────────────────
  const EditableCell = ({
    id,
    field,
    value,
    multiline = false,
  }: {
    id: number;
    field: string;
    value: string;
    multiline?: boolean;
  }) => {
    const isEditing = editingCell?.id === id && editingCell?.field === field;

    if (!isAdmin) return <span>{value || "—"}</span>;

    if (isEditing) {
      return multiline ? (
        <textarea
          className="inline-edit"
          value={editValue}
          autoFocus
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => saveEdit(id, field)}
          onKeyDown={(e) => e.key === "Escape" && setEditingCell(null)}
          rows={2}
        />
      ) : (
        <input
          className="inline-edit"
          value={editValue}
          autoFocus
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => saveEdit(id, field)}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveEdit(id, field);
            if (e.key === "Escape") setEditingCell(null);
          }}
        />
      );
    }

    return (
      <span
        className="editable-cell"
        onClick={() => startEdit(id, field, value || "")}
        title="Click to edit"
      >
        {value || <span className="placeholder">—</span>}
      </span>
    );
  };

  return (
    <div className="followup-dashboard">
      {/* ── Header ── */}
      <div className="fu-header">
        <div className="header-left" onClick={() => navigate("/dashboard")}>
          <img src={companyLogo} alt="Logo" className="company-logo" />
          <h1 className="header-title">
            <span className="brand-cool">COOL</span>
            <span className="brand-man">Man</span> Refrigeration
          </h1>
        </div>
        <div className="header-right">
          <span className="user-icon">👤</span>
          <span className="username">{user?.username || "User"}</span>
        </div>
      </div>

      {/* ── Main ── */}
      <div className="fu-main">
        {/* Page header */}
        <div className="page-title-row">
          <div>
            <h2 className="page-title">Follow Up</h2>
            <p className="page-sub">Track customer follow-up contacts</p>
          </div>
          <div className="title-actions">
            <button className="btn-back" onClick={() => navigate("/dashboard")}>
              ← Dashboard
            </button>
            {isAdmin && (
              <button className="btn-add" onClick={() => setShowAddModal(true)}>
                + Add Follow Up
              </button>
            )}
          </div>
        </div>

        {/* Search + count */}
        <div className="search-row">
          <input
            type="text"
            className="search-input"
            placeholder="🔍  Search by company, person, project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="record-count">
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── Table ── */}
        <div className="fu-table-wrapper">
          <table className="fu-table">
            <thead>
              <tr>
                <th rowSpan={2} className="th-no">
                  No
                </th>
                <th rowSpan={2}>Company</th>
                <th rowSpan={2}>Project</th>
                <th rowSpan={2}>Person</th>
                <th rowSpan={2}>Description</th>
                <th rowSpan={2} className="th-progress">
                  Progress
                </th>
                {[1, 2, 3, 4, 5].map((n) => (
                  <th key={n} colSpan={2} className="th-contact-group">
                    {n === 1
                      ? "1st"
                      : n === 2
                        ? "2nd"
                        : n === 3
                          ? "3rd"
                          : `${n}th`}{" "}
                    Contact
                  </th>
                ))}
                {isAdmin && (
                  <th rowSpan={2} className="th-actions">
                    Actions
                  </th>
                )}
              </tr>
              <tr>
                {[1, 2, 3, 4, 5].map((n) => (
                  <>
                    <th key={`d${n}`} className="th-sub">
                      Date
                    </th>
                    <th key={`u${n}`} className="th-sub">
                      Update
                    </th>
                  </>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 17 : 16} className="empty-row">
                    <div className="empty-state">
                      <span className="empty-icon">📋</span>
                      <p>
                        {searchTerm
                          ? "No records match your search."
                          : "No follow-ups yet. Admin can add one."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((fu) => {
                  const { count, pct } = getContactProgress(fu.contacts);
                  const canLog = count < MAX_CONTACTS;

                  return (
                    <tr
                      key={fu.id}
                      className={count >= MAX_CONTACTS ? "row-complete" : ""}
                    >
                      <td className="td-no">
                        <span className="no-badge">{fu.follow_up_no}</span>
                      </td>
                      <td>
                        <EditableCell
                          id={fu.id}
                          field="company"
                          value={fu.company}
                        />
                      </td>
                      <td>
                        <EditableCell
                          id={fu.id}
                          field="project"
                          value={fu.project}
                        />
                      </td>
                      <td>
                        <EditableCell
                          id={fu.id}
                          field="person"
                          value={fu.person}
                        />
                      </td>
                      <td>
                        <EditableCell
                          id={fu.id}
                          field="description"
                          value={fu.description}
                          multiline
                        />
                      </td>

                      {/* Progress */}
                      <td className="td-progress">
                        <div className="progress-wrap">
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${pct}%`,
                                background: pct === 100 ? "#4CAF50" : "#1976D2",
                              }}
                            />
                          </div>
                          <span className="progress-label">
                            {count}/{MAX_CONTACTS}
                          </span>
                        </div>
                        {canLog && (
                          <button
                            className="btn-log-contact"
                            onClick={() => openContactModal(fu)}
                          >
                            + Log Contact
                          </button>
                        )}
                      </td>

                      {/* 5 contact columns */}
                      {[0, 1, 2, 3, 4].map((i) => {
                        const contact = fu.contacts?.[i];
                        return (
                          <>
                            <td key={`date-${i}`} className="td-contact">
                              {contact ? (
                                isAdmin ? (
                                  <span
                                    className="editable-cell"
                                    onClick={() =>
                                      startEdit(
                                        fu.id,
                                        `contact_${i}_date`,
                                        contact.date || "",
                                      )
                                    }
                                  >
                                    {editingCell?.id === fu.id &&
                                    editingCell?.field ===
                                      `contact_${i}_date` ? (
                                      <input
                                        type="date"
                                        className="inline-edit"
                                        defaultValue={
                                          contact.date?.split("T")[0] || ""
                                        }
                                        autoFocus
                                        onBlur={(e) =>
                                          saveContactEdit(
                                            fu.id,
                                            i,
                                            "date",
                                            e.target.value,
                                          )
                                        }
                                        onKeyDown={(e) =>
                                          e.key === "Escape" &&
                                          setEditingCell(null)
                                        }
                                      />
                                    ) : (
                                      formatDate(contact.date)
                                    )}
                                  </span>
                                ) : (
                                  <span>{formatDate(contact.date)}</span>
                                )
                              ) : (
                                <span className="empty-contact">—</span>
                              )}
                            </td>
                            <td
                              key={`upd-${i}`}
                              className="td-contact td-update"
                            >
                              {contact ? (
                                isAdmin ? (
                                  <span
                                    className="editable-cell"
                                    onClick={() =>
                                      startEdit(
                                        fu.id,
                                        `contact_${i}_update`,
                                        contact.update || "",
                                      )
                                    }
                                  >
                                    {editingCell?.id === fu.id &&
                                    editingCell?.field ===
                                      `contact_${i}_update` ? (
                                      <textarea
                                        className="inline-edit"
                                        defaultValue={contact.update || ""}
                                        autoFocus
                                        rows={2}
                                        onBlur={(e) =>
                                          saveContactEdit(
                                            fu.id,
                                            i,
                                            "update",
                                            e.target.value,
                                          )
                                        }
                                        onKeyDown={(e) =>
                                          e.key === "Escape" &&
                                          setEditingCell(null)
                                        }
                                      />
                                    ) : (
                                      <span title={contact.update}>
                                        {contact.update || "—"}
                                      </span>
                                    )}
                                  </span>
                                ) : (
                                  <span title={contact.update}>
                                    {contact.update || "—"}
                                  </span>
                                )
                              ) : (
                                <span className="empty-contact">—</span>
                              )}
                              {contact?.logged_by && (
                                <span className="logged-by">
                                  by {contact.logged_by}
                                </span>
                              )}
                            </td>
                          </>
                        );
                      })}

                      {isAdmin && (
                        <td className="td-actions">
                          <button
                            className="btn-delete-small"
                            onClick={() => {
                              setItemToDelete(fu);
                              setShowDeleteConfirm(true);
                            }}
                          >
                            🗑️
                          </button>
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

      {/* ══ ADD FOLLOW-UP MODAL (Admin) ════════════════════════════════════════ */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Follow Up</h2>
              <button
                className="close-btn"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    Company <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={addForm.company}
                    onChange={(e) =>
                      setAddForm({ ...addForm, company: e.target.value })
                    }
                    placeholder="Company name"
                  />
                </div>
                <div className="form-group">
                  <label>Project</label>
                  <input
                    type="text"
                    className="form-input"
                    value={addForm.project}
                    onChange={(e) =>
                      setAddForm({ ...addForm, project: e.target.value })
                    }
                    placeholder="Project name"
                  />
                </div>
                <div className="form-group">
                  <label>
                    Person <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={addForm.person}
                    onChange={(e) =>
                      setAddForm({ ...addForm, person: e.target.value })
                    }
                    placeholder="Contact person"
                  />
                </div>
                <div className="form-group full">
                  <label>Description</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={addForm.description}
                    onChange={(e) =>
                      setAddForm({ ...addForm, description: e.target.value })
                    }
                    placeholder="Follow-up details..."
                  />
                </div>
                <div className="form-group">
                  <label>1st Contact Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={addForm.contact1_date}
                    onChange={(e) =>
                      setAddForm({ ...addForm, contact1_date: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>1st Contact Update</label>
                  <input
                    type="text"
                    className="form-input"
                    value={addForm.contact1_update}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        contact1_update: e.target.value,
                      })
                    }
                    placeholder="Initial contact note"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <div className="footer-right">
                <button
                  className="btn-cancel"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button className="btn-save" onClick={handleAddFollowUp}>
                  Add Follow Up
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ LOG CONTACT MODAL (User) ═══════════════════════════════════════════ */}
      {showContactModal && contactTarget && (
        <div
          className="modal-overlay"
          onClick={() => setShowContactModal(false)}
        >
          <div
            className="modal-box modal-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Log Contact Attempt</h2>
              <button
                className="close-btn"
                onClick={() => setShowContactModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="contact-info-banner">
                <strong>{contactTarget.company}</strong> —{" "}
                {contactTarget.person}
                <br />
                <span className="contact-attempt-no">
                  Contact #{(contactTarget.contacts?.length || 0) + 1} of{" "}
                  {MAX_CONTACTS}
                </span>
              </div>
              <div className="form-grid" style={{ marginTop: "16px" }}>
                <div className="form-group">
                  <label>
                    Date <span className="req">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={contactForm.date}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, date: e.target.value })
                    }
                  />
                </div>
                <div className="form-group full">
                  <label>
                    Update Note <span className="req">*</span>
                  </label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={contactForm.update}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, update: e.target.value })
                    }
                    placeholder="What happened during this contact?"
                  />
                </div>
                <div className="form-group full">
                  <label>Logged By</label>
                  <input
                    type="text"
                    className="form-input"
                    value={user?.username || ""}
                    disabled
                    style={{ background: "#f5f5f5", color: "#888" }}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <p className="lock-notice">
                ⚠️ Once saved, this entry cannot be edited.
              </p>
              <div className="footer-right">
                <button
                  className="btn-cancel"
                  onClick={() => setShowContactModal(false)}
                >
                  Cancel
                </button>
                <button className="btn-save" onClick={handleLogContact}>
                  Save Contact
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM ════════════════════════════════════════════════════ */}
      {showDeleteConfirm && itemToDelete && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="modal-box modal-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Delete Follow Up</h2>
              <button
                className="close-btn"
                onClick={() => setShowDeleteConfirm(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Delete <strong>{itemToDelete.follow_up_no}</strong> —{" "}
                {itemToDelete.company}?
              </p>
              <p className="delete-warn">
                This will remove all contact history. Cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <div className="footer-right">
                <button
                  className="btn-cancel"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-save"
                  style={{ background: "#c62828" }}
                  onClick={handleDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUpDashboard;
