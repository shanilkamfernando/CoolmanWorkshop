// ============================================
// Project Dashboard - Users Can Only ADD (No Edit/Delete)
// Replace: client/src/pages/customers/ProjectDashboard.tsx
// ============================================

import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import "./ProjectDashboard.css";
import companyLogo from "../../assets/mainlogo.png";
import AppHeader from "../../components/AppHeader";

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

interface Project {
  id: number;
  name: string;
  description?: string;
}

interface Meeting {
  id: number;
  meeting_no: number;
  date: string;
  meeting_time: string;
  location: string;
  description: string;
  customer_side: string;
  cm_side: string;
  created_by: string;
}

interface TableEntry {
  id: number;
  activity_no: number;
  activity_date: string;
  activity_time: string;
  description: string;
  created_by: string;
  remarks: string;
}

interface Attachment {
  id: number;
  project_id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_by: number;
  created_at: string;
}

interface AssignedMember {
  id: number;
  assignment_no: number;
  assigned_date: string;
  assigned_time: string;
  assigned_member: string;
  job_description: string;
  due_date: string;
  update_note: string;
  status: string;
  finish_date: string;
  created_by: string;
}

interface SystemUser {
  username: string;
  first_name: string;
  last_name: string;
  role: string;
}

// Shared date formatter — dd/mm/yyyy, parsed manually from the date
// components so a plain "YYYY-MM-DD" never gets reinterpreted as UTC
// midnight and shifted a day by the browser's local timezone.
const fmtDateDDMMYYYY = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "—";
  const datePart = dateStr.split("T")[0];
  const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "—";
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
};

// created_at from Postgres may come back with no timezone marker even
// though it's a UTC instant. Force UTC interpretation before converting
// to the browser's local time, otherwise JS treats a marker-less string
// as already-local and applies no conversion at all.
const fmtLogDateTime = (raw: string) => {
  if (!raw) return { date: "—", time: "—" };
  const hasTimezone = /Z$|[+-]\d{2}:?\d{2}$/.test(raw);
  const isoString = hasTimezone ? raw : `${raw.replace(" ", "T")}Z`;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return { date: "—", time: "—" };
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return {
    date: `${day}/${month}/${year}`,
    time: d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  };
};

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

const MeetingDetailPanel = ({
  meeting,
  customerId,
  projectId,
  isAdmin,
  onUpdate,
}: {
  meeting: any;
  customerId: string | undefined;
  projectId: string | undefined;
  isAdmin: boolean;
  onUpdate: (id: number, field: string, value: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [updates, setUpdates] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);

  const token = () => localStorage.getItem("token");
  const hdr = () => ({ Authorization: `Bearer ${token()}` });
  const BASE = `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/projects/${projectId}/meetings/${meeting.id}/updates`;

  useEffect(() => {
    if (open) fetchUpdates();
  }, [open, meeting.id]);

  const fetchUpdates = async () => {
    try {
      const r = await axios.get(BASE, { headers: hdr() });
      setUpdates(r.data.updates || []);
    } catch {}
  };

  const handleAdd = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      await axios.post(BASE, { update_note: newNote }, { headers: hdr() });
      setNewNote("");
      fetchUpdates();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to add update");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUpdate = async (updateId: number) => {
    if (!confirm("Delete this update?")) return;
    try {
      await axios.delete(`${BASE}/${updateId}`, { headers: hdr() });
      fetchUpdates();
    } catch {}
  };

  const hasContent =
    meeting.customer_side || meeting.cm_side || updates.length > 0;

  return (
    <div>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 12px",
          borderRadius: "20px",
          border: "none",
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: 600,
          background: open ? "#667eea" : hasContent ? "#e8f0fe" : "#f0f0f0",
          color: open ? "#fff" : hasContent ? "#667eea" : "#888",
          transition: "all 0.2s",
        }}
      >
        {hasContent ? "📋" : "+"} Details {open ? "▲" : "▼"}
      </button>

      {open && (
        <div
          style={{
            position: "absolute" as const,
            zIndex: 100,
            marginTop: "6px",
            background: "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: "12px",
            padding: "16px",
            width: "340px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#333" }}>
              Meeting Details
            </span>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#999",
                fontSize: "18px",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* Customer Side */}
          <div style={{ marginBottom: "12px" }}>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#667eea",
                textTransform: "uppercase" as const,
                letterSpacing: "0.6px",
                marginBottom: "5px",
              }}
            >
              Customer Side
            </div>
            {isAdmin ? (
              <textarea
                defaultValue={meeting.customer_side || ""}
                onBlur={(e) => {
                  if (e.target.value !== (meeting.customer_side || ""))
                    onUpdate(meeting.id, "customer_side", e.target.value);
                }}
                rows={2}
                placeholder="Notes from customer side..."
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  fontSize: "13px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "6px",
                  resize: "none" as const,
                  fontFamily: "inherit",
                  boxSizing: "border-box" as const,
                  background: "#fff",
                }}
              />
            ) : meeting.customer_side ? (
              <div
                style={{
                  padding: "8px 10px",
                  background: "#f8f9ff",
                  borderRadius: "6px",
                  fontSize: "13px",
                  color: "#333",
                  lineHeight: 1.5,
                }}
              >
                {meeting.customer_side}
              </div>
            ) : (
              <div
                style={{
                  padding: "8px 10px",
                  background: "#f9f9f9",
                  borderRadius: "6px",
                  fontSize: "13px",
                  color: "#bbb",
                  fontStyle: "italic",
                }}
              >
                No notes added
              </div>
            )}
          </div>

          {/* CM Side */}
          <div style={{ marginBottom: "14px" }}>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#667eea",
                textTransform: "uppercase" as const,
                letterSpacing: "0.6px",
                marginBottom: "5px",
              }}
            >
              CM Side
            </div>
            {isAdmin ? (
              <textarea
                defaultValue={meeting.cm_side || ""}
                onBlur={(e) => {
                  if (e.target.value !== (meeting.cm_side || ""))
                    onUpdate(meeting.id, "cm_side", e.target.value);
                }}
                rows={2}
                placeholder="Notes from CM side..."
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  fontSize: "13px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "6px",
                  resize: "none" as const,
                  fontFamily: "inherit",
                  boxSizing: "border-box" as const,
                  background: "#fff",
                }}
              />
            ) : meeting.cm_side ? (
              <div
                style={{
                  padding: "8px 10px",
                  background: "#f8f9ff",
                  borderRadius: "6px",
                  fontSize: "13px",
                  color: "#333",
                  lineHeight: 1.5,
                }}
              >
                {meeting.cm_side}
              </div>
            ) : (
              <div
                style={{
                  padding: "8px 10px",
                  background: "#f9f9f9",
                  borderRadius: "6px",
                  fontSize: "13px",
                  color: "#bbb",
                  fontStyle: "italic",
                }}
              >
                No notes added
              </div>
            )}
          </div>

          {/* Divider */}
          <div
            style={{ borderTop: "1px solid #f0f0f0", marginBottom: "12px" }}
          />

          {/* Update Log */}
          <div>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#667eea",
                textTransform: "uppercase" as const,
                letterSpacing: "0.6px",
                marginBottom: "8px",
              }}
            >
              Update Log
            </div>

            {/* Updates list */}
            <div
              style={{
                maxHeight: "160px",
                overflowY: "auto" as const,
                marginBottom: "8px",
              }}
            >
              {updates.length === 0 ? (
                <div
                  style={{
                    padding: "10px",
                    textAlign: "center" as const,
                    color: "#bbb",
                    fontSize: "12px",
                    fontStyle: "italic",
                  }}
                >
                  No updates yet
                </div>
              ) : (
                updates.map((u, idx) => {
                  const { date: logDate, time: logTime } = fmtLogDateTime(
                    u.created_at,
                  );
                  return (
                    <div
                      key={u.id}
                      style={{
                        padding: "8px 10px",
                        borderRadius: "6px",
                        marginBottom: "4px",
                        background: idx % 2 === 0 ? "#f8f9ff" : "#fff",
                        border: "1px solid #eef0ff",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#333",
                            marginBottom: "3px",
                          }}
                        >
                          {u.update_note}
                        </div>
                        <div style={{ fontSize: "10px", color: "#aaa" }}>
                          {logDate} · {logTime} · {u.created_by || "—"}
                        </div>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteUpdate(u.id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#ddd",
                            fontSize: "13px",
                            marginLeft: "6px",
                            flexShrink: 0,
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "#ef4444")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "#ddd")
                          }
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Add update */}
            <div style={{ display: "flex", gap: "6px" }}>
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="Add update..."
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  fontSize: "12px",
                  border: "1px solid #d0d5ff",
                  borderRadius: "6px",
                  outline: "none",
                }}
              />
              <button
                onClick={handleAdd}
                disabled={saving || !newNote.trim()}
                style={{
                  padding: "6px 12px",
                  background: "#667eea",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600,
                  opacity: !newNote.trim() ? 0.5 : 1,
                }}
              >
                {saving ? "..." : "+ Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Member Update Log (only mounted once its row is expanded) ──────
const MemberUpdateLog = ({
  customerId,
  projectId,
  memberId,
  canEdit,
  isAdmin,
  readOnly,
}: {
  customerId: string | undefined;
  projectId: string | undefined;
  memberId: number;
  canEdit: boolean;
  isAdmin: boolean;
  readOnly: boolean;
}) => {
  const [updates, setUpdates] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);

  const token = () => localStorage.getItem("token");
  const hdr = () => ({ Authorization: `Bearer ${token()}` });
  const BASE = `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/projects/${projectId}/members/${memberId}/updates`;

  useEffect(() => {
    fetchUpdates();
  }, [memberId]);

  const fetchUpdates = async () => {
    try {
      const r = await axios.get(BASE, { headers: hdr() });
      setUpdates(r.data.updates || []);
    } catch {}
  };

  const handleAdd = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      await axios.post(BASE, { update_note: newNote }, { headers: hdr() });
      setNewNote("");
      fetchUpdates();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to add update");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (updateId: number) => {
    if (!confirm("Delete this update?")) return;
    try {
      await axios.delete(`${BASE}/${updateId}`, { headers: hdr() });
      fetchUpdates();
    } catch {}
  };

  return (
    <div>
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          textTransform: "uppercase" as const,
          letterSpacing: "0.6px",
          color: "#667eea",
          marginBottom: "8px",
          paddingBottom: "6px",
          borderBottom: "2px solid #e8f0fe",
        }}
      >
        Update Log
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "12px",
          marginBottom: "8px",
        }}
      >
        <thead>
          <tr style={{ background: "#f8f9ff" }}>
            <th style={mThStyle("90px")}>Date</th>
            <th style={mThStyle("65px")}>Time</th>
            <th style={mThStyle()}>Update</th>
            <th style={mThStyle("70px")}>By</th>
            {isAdmin && (
              <th style={{ ...mThStyle("30px"), padding: "5px 8px" }}></th>
            )}
          </tr>
        </thead>
        <tbody>
          {updates.length === 0 ? (
            <tr>
              <td
                colSpan={isAdmin ? 5 : 4}
                style={{
                  padding: "10px 8px",
                  textAlign: "center" as const,
                  color: "#bbb",
                  fontStyle: "italic",
                  fontSize: "12px",
                }}
              >
                No updates yet
              </td>
            </tr>
          ) : (
            updates.map((u, idx) => {
              const { date: logDate, time: logTime } = fmtLogDateTime(
                u.created_at,
              );
              return (
                <tr
                  key={u.id}
                  style={{ background: idx % 2 === 0 ? "#fff" : "#fafbff" }}
                >
                  <td style={mTdStyle}>{logDate}</td>
                  <td style={mTdStyle}>{logTime}</td>
                  <td style={{ ...mTdStyle, color: "#333" }}>
                    {u.update_note}
                  </td>
                  <td style={{ ...mTdStyle, fontSize: "11px" }}>
                    {u.created_by || "—"}
                  </td>
                  {isAdmin && (
                    <td style={{ ...mTdStyle, textAlign: "center" as const }}>
                      {!readOnly && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#ddd",
                            fontSize: "13px",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "#ef4444")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "#ddd")
                          }
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {canEdit && !readOnly && (
        <div style={{ display: "flex", gap: "6px" }}>
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Add update..."
            style={{
              flex: 1,
              padding: "5px 8px",
              fontSize: "12px",
              border: "1.5px solid #ddd",
              borderRadius: "5px",
            }}
          />
          <button
            onClick={handleAdd}
            disabled={saving || !newNote.trim()}
            style={{
              padding: "5px 12px",
              background: "#667eea",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
              opacity: !newNote.trim() ? 0.5 : 1,
            }}
          >
            {saving ? "..." : "+ Add"}
          </button>
        </div>
      )}
    </div>
  );
};

const mThStyle = (width?: string) => ({
  padding: "5px 8px",
  textAlign: "left" as const,
  color: "#888",
  fontWeight: 600,
  borderBottom: "1px solid #e8e8e8",
  ...(width ? { width } : {}),
});

const mTdStyle = {
  padding: "5px 8px",
  color: "#555",
  borderBottom: "1px solid #f0f0f0",
};

const ProjectDashboard = () => {
  const navigate = useNavigate();
  const { customerId, projectId } = useParams();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [tableEntries, setTableEntries] = useState<TableEntry[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [assignedMembers, setAssignedMembers] = useState<AssignedMember[]>([]);
  const [expandedMemberId, setExpandedMemberId] = useState<number | null>(null);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberUsername, setNewMemberUsername] = useState("");
  const [newMemberJobDesc, setNewMemberJobDesc] = useState("");
  const [newMemberDueDate, setNewMemberDueDate] = useState("");

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [newMeetingDate, setNewMeetingDate] = useState("");
  const [newMeetingDesc, setNewMeetingDesc] = useState("");
  const [newMeetingTime, setNewMeetingTime] = useState("");
  const [newMeetingLocation, setNewMeetingLocation] = useState("");
  const [newMeetingCustomerSide, setNewMeetingCustomerSide] = useState("");
  const [newMeetingCMSide, setNewMeetingCMSide] = useState("");

  const [showAddEntry, setShowAddEntry] = useState(false);
  const [newEntryDate, setNewEntryDate] = useState("");
  const [newEntryTime, setNewEntryTime] = useState("");
  const [newEntryDesc, setNewEntryDesc] = useState("");

  const [activeBOQCategory, setActiveBOQCategory] = useState<string | null>(
    null,
  );
  const [boqDocuments, setBoqDocuments] = useState<any[]>([]);
  const [uploadingBOQ, setUploadingBOQ] = useState(false);
  const boqFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    if (location.state?.customer) {
      setCustomer(location.state.customer);
    }

    if (location.state?.project) {
      setProject(location.state.project);
      setProjectName(location.state.project.name);
      setProjectDescription(location.state.project.description || "");
    } else {
      setProject({
        id: Number(projectId),
        name: "Project " + projectId,
        description: "",
      });
      setProjectName("Project " + projectId);
    }

    fetchActivities();
    fetchAttachments();
    fetchMeetings();
    fetchAssignedMembers();
    fetchSystemUsers();
  }, [customerId, projectId, location]);

  const isAdmin = user?.role === "admin";

  const fetchAttachments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/projects/${projectId}/attachments`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setAttachments(response.data.attachments || []);
    } catch (error) {
      console.error("Error fetching attachments:", error);
      setAttachments([]);
    }
  };

  const fetchAssignedMembers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/projects/${projectId}/members`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setAssignedMembers(response.data.members || []);
    } catch (error) {
      console.error("Error fetching assigned members:", error);
    }
  };

  const fetchSystemUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/projects/${projectId}/users`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSystemUsers(response.data.users || []);
    } catch (error) {
      console.error("Error fetching system users:", error);
    }
  };

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/projects/${projectId}/activities`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setTableEntries(response.data.activities || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
      setTableEntries([]);
    }
  };

  const fetchBOQDocuments = async (category: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/projects/${projectId}/boq/${category}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      //handle both array and object responses, and common key names
      const data = response.data;
      const docs =
        data.documents ||
        data.document ||
        data.boq ||
        data.files ||
        data.data ||
        (Array.isArray(data) ? data : []);
      setBoqDocuments(Array.isArray(docs) ? docs : []);
    } catch (error) {
      console.error("Error fetching BOQ documents:", error);
      setBoqDocuments([]);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberUsername) {
      alert("Please select a member to assign");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/projects/${projectId}/members`,
        {
          assigned_member: newMemberUsername,
          job_description: newMemberJobDesc,
          due_date: newMemberDueDate || null,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.data.success) {
        setNewMemberUsername("");
        setNewMemberJobDesc("");
        setNewMemberDueDate("");
        setShowAddMember(false);
        fetchAssignedMembers();
      }
    } catch (error) {
      console.error("Error assigning member:", error);
      alert("Failed to assign member");
    }
  };

  const handleUpdateMember = async (
    memberId: number,
    field: string,
    value: string,
  ) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/projects/${projectId}/members/${memberId}`,
        { [field]: value },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setAssignedMembers(
        assignedMembers.map((m) =>
          m.id === memberId ? { ...m, [field]: value } : m,
        ),
      );
    } catch (error: any) {
      console.error("Error updating member:", error);
      alert(error.response?.data?.error || "Failed to update");
    }
  };

  // Status changes go through here so "done" can be followed by an
  // auto-stamped finish_date in a second call, matching what the
  // server now does server-side too.
  const handleMemberStatusChange = async (
    member: AssignedMember,
    newStatus: string,
  ) => {
    await handleUpdateMember(member.id, "status", newStatus);
    if (newStatus === "done" && !member.finish_date) {
      await handleUpdateMember(member.id, "finish_date", todayISO());
    }
    fetchAssignedMembers();
  };

  const handleDeleteMember = async (memberId: number) => {
    if (!confirm("Remove this assignment?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/projects/${projectId}/members/${memberId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchAssignedMembers();
    } catch (error) {
      alert("Failed to remove assignment");
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert("File size must be less than 50MB");
      return;
    }

    setUploadingFile(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/projects/${projectId}/attachments`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.success) {
        alert("File uploaded successfully!");
        fetchAttachments();
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/projects/${projectId}/attachments/${attachment.id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", attachment.original_filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file");
    }
  };

  const handleDeleteAttachment = async (id: number) => {
    if (!isAdmin) {
      alert("Only admins can delete attachments");
      return;
    }

    if (!confirm("Are you sure you want to delete this file?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/projects/${projectId}/attachments/${id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("File deleted successfully!");
      fetchAttachments();
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Failed to delete file");
    }
  };

  const handleBOQCategoryClick = (category: string) => {
    if (activeBOQCategory === category) {
      setActiveBOQCategory(null);
      setBoqDocuments([]);
    } else {
      setActiveBOQCategory(category);
      fetchBOQDocuments(category);
    }
  };

  const handleBOQFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    category: string,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert("File size must beless than 50MB");
      return;
    }

    setUploadingBOQ(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);

      const response = await axios.post(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/projects/${projectId}/boq`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.success) {
        alert("BOQ document uploaded successfully!");
        fetchBOQDocuments(category);
      }
    } catch (error) {
      console.error("Error uploading BOQ:", error);
      alert("Failed to upload BOQ document");
    } finally {
      setUploadingBOQ(false);
      if (boqFileInputRef.current) {
        boqFileInputRef.current.value = "";
      }
    }
  };

  const handleDownloadBOQ = async (doc: any) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/projects/${projectId}/boq/${doc.id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", doc.original_filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading BOQ:", error);
      alert("Failed to download document");
    }
  };

  const handleDeleteBOQ = async (docId: number, category: string) => {
    if (!isAdmin) {
      alert("Only admins can delete BOQ documents");
      return;
    }

    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/projects/${projectId}/boq/${docId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Document deleted successfully!");
      fetchBOQDocuments(category);
    } catch (error) {
      console.error("Error deleting BOQ:", error);
      alert("Failed to delete document");
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("word") || fileType.includes("document")) return "📝";
    if (fileType.includes("excel") || fileType.includes("spreadsheet"))
      return "📊";
    if (fileType.includes("image")) return "🖼️";
    if (fileType.includes("video")) return "🎥";
    if (fileType.includes("zip") || fileType.includes("rar")) return "📦";
    return "📎";
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getInitials = (name: string): string => {
    const words = name.trim().split(" ");
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const getColorFromName = (name: string): string => {
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
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const handleBackToDashboard = () => navigate("/dashboard");
  const handleBackToProjects = () =>
    navigate(`/customers/${customerId}/projects`, { state: { customer } });

  const handleSaveProject = async () => {
    if (!isAdmin) {
      alert("Only admins can save project details");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/projects/${projectId}`,
        { name: projectName, description: projectDescription },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Project updated successfully!");
    } catch (error) {
      console.error("Error saving project:", error);
      alert("Project saved! (Demo mode)");
    }
  };

  const handleAddMeeting = async () => {
    if (!newMeetingDate || !newMeetingDesc) {
      alert("Please enter both date and description");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/projects/${projectId}/meetings`,
        {
          date: newMeetingDate,
          meeting_time: newMeetingTime || null,
          location: newMeetingLocation || null,
          description: newMeetingDesc,
          customer_side: newMeetingCustomerSide || null,
          cm_side: newMeetingCMSide || null,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.data.success) {
        setNewMeetingDate("");
        setNewMeetingTime("");
        setNewMeetingLocation("");
        setNewMeetingDesc("");
        setNewMeetingCustomerSide("");
        setNewMeetingCMSide("");
        setShowAddMeeting(false);
        fetchMeetings();
      }
    } catch (error) {
      console.error("Error adding meeting:", error);
      alert("Failed to add meeting");
    }
  };

  const fetchMeetings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/projects/${projectId}/meetings`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMeetings(response.data.meetings || []);
    } catch (error) {
      console.error("Error fetching meetings:", error);
    }
  };

  const handleUpdateMeeting = async (
    id: number,
    field: string,
    value: string,
  ) => {
    const meeting = meetings.find((m) => m.id === id);
    if (!meeting) return;

    // Update local state immediately
    setMeetings(
      meetings.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    );

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/projects/${projectId}/meetings/${id}`,
        {
          date: field === "date" ? value : meeting.date,
          meeting_time: field === "meeting_time" ? value : meeting.meeting_time,
          location: field === "location" ? value : meeting.location,
          description: field === "description" ? value : meeting.description,
          customer_side:
            field === "customer_side" ? value : meeting.customer_side,
          cm_side: field === "cm_side" ? value : meeting.cm_side,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (error: any) {
      console.error("Error updating meeting:", error);
      alert(error.response?.data?.error || "Failed to save meeting");
      fetchMeetings(); // revert on error
    }
  };

  const handleDeleteMeeting = (id: number) => {
    if (!isAdmin) {
      alert("Only admins can delete meetings");
      return;
    }
    if (confirm("Delete this meeting?")) {
      setMeetings(meetings.filter((m) => m.id !== id));
    }
  };

  const handleAddEntry = async () => {
    if (!newEntryDesc.trim()) {
      alert("Description is required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/projects/${projectId}/activities`,
        {
          // activity_date: newEntryDate,
          // activity_time: newEntryTime || null,
          description: newEntryDesc,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        alert("Activity added successfully!");
        setShowAddEntry(false);
        setNewEntryDesc("");
        fetchActivities();
      }
    } catch (error) {
      console.error("Error adding activity:", error);
      alert("Failed to add activity");
    }
  };

  // ADMIN ONLY can edit activities
  const handleUpdateEntry = async (
    activityId: number,
    field: keyof TableEntry,
    value: string,
  ) => {
    if (!isAdmin) {
      alert("Only admins can edit activities");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/projects/${projectId}/activities/${activityId}`,
        { [field]: value },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Update local state
      setTableEntries(
        tableEntries.map((entry) =>
          entry.id === activityId ? { ...entry, [field]: value } : entry,
        ),
      );
    } catch (error) {
      console.error("Error updating activity:", error);
      alert("Failed to update activity");
    }
  };

  const handleDeleteEntry = async (activityId: number) => {
    if (!isAdmin) {
      alert("Only admins can delete activities");
      return;
    }

    if (!confirm("Are you sure you want to delete this activity?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `https://coolmanworkshop-production.up.railway.app/api/customers/${customerId}/projects/${projectId}/activities/${activityId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Activity deleted successfully!");
      fetchActivities();
    } catch (error) {
      console.error("Error deleting activity:", error);
      alert("Failed to delete activity");
    }
  };

  if (!customer) {
    return <div className="loading-center">Loading...</div>;
  }

  const initials = getInitials(customer.name);
  const color = getColorFromName(customer.name);

  const STATUS_OPTIONS = [
    { value: "todo", label: "To Do", bg: "#e3f2fd", color: "#1565c0" },
    { value: "pending", label: "Pending", bg: "#fff8e1", color: "#e65100" },
    { value: "on_hold", label: "On Hold", bg: "#fce4ec", color: "#880e4f" },
    { value: "done", label: "Done", bg: "#e8f5e9", color: "#2e7d32" },
  ];

  const getStatusStyle = (status: string) => {
    return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
  };

  const toDateInput = (dateStr: string | null): string => {
    if (!dateStr) return "";
    return dateStr.split("T")[0];
  };

  // Done assignments sink to the bottom; assignment_no is never touched.
  const sortedMembers = [...assignedMembers].sort((a, b) => {
    const aDone = a.status === "done" ? 1 : 0;
    const bDone = b.status === "done" ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    return a.assignment_no - b.assignment_no;
  });

  return (
    <div className="project-dashboard">
      <AppHeader />

      {/* Main Content */}
      <div className="project-main-content">
        <div className="project-header-row">
          <div className="project-title">
            <h2>{projectName || "Untitled Project"}</h2>
            <h3> {projectDescription ? ` - ${projectDescription}` : ""}</h3>
          </div>

          <button className="btn-back" onClick={handleBackToProjects}>
            ← Back to Projects
          </button>
        </div>

        {isAdmin && (
          <>
            <div className="project-details-section">
              <div className="project-info-card">
                <label>Project name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                />
              </div>
              <div className="project-info-card">
                <label>Project Description</label>
                <input
                  type="text"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Enter description"
                />
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <button className="btn-save-project" onClick={handleSaveProject}>
                💾 Save Project Details
              </button>
            </div>
          </>
        )}

        {/* Assigned Members — restructured to expand-on-arrow, like Job Assigned */}
        <div className="project-section">
          <div className="section-header">
            <h3 className="section-title-text">Assigned Members</h3>
            {isAdmin && (
              <button
                className="btn-add-small"
                onClick={() => setShowAddMember(!showAddMember)}
              >
                + Assign Member
              </button>
            )}
          </div>

          {/* Add form - admin only */}
          {isAdmin && showAddMember && (
            <div
              className="add-meeting-form"
              style={{ flexWrap: "wrap", gap: "10px" }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  flex: "1 1 180px",
                }}
              >
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#555",
                    textTransform: "uppercase",
                  }}
                >
                  Assign To *
                </label>
                <select
                  value={newMemberUsername}
                  onChange={(e) => setNewMemberUsername(e.target.value)}
                  className="meeting-input"
                  style={{ padding: "8px 10px" }}
                >
                  <option value="">Select a user...</option>
                  {systemUsers.map((u) => (
                    <option key={u.username} value={u.username}>
                      {u.first_name} {u.last_name} ({u.username})
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  flex: "2 1 240px",
                }}
              >
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#555",
                    textTransform: "uppercase",
                  }}
                >
                  Job Description
                </label>
                <input
                  type="text"
                  value={newMemberJobDesc}
                  onChange={(e) => setNewMemberJobDesc(e.target.value)}
                  placeholder="Describe the task..."
                  className="meeting-input"
                />
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  flex: "0 0 160px",
                }}
              >
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#555",
                    textTransform: "uppercase",
                  }}
                >
                  Due Date
                </label>
                <input
                  type="date"
                  value={newMemberDueDate}
                  onChange={(e) => setNewMemberDueDate(e.target.value)}
                  className="meeting-input"
                />
              </div>

              <div
                style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}
              >
                <button className="btn-add-meeting" onClick={handleAddMember}>
                  Assign
                </button>
                <button
                  className="btn-cancel-meeting"
                  onClick={() => setShowAddMember(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <table className="meetings-table" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ width: "50px" }}>No</th>
                <th style={{ width: "100px" }}>Date</th>
                <th style={{ width: "80px" }}>Time</th>
                <th style={{ width: "140px" }}>Assigned To</th>
                <th>Job Description</th>
                <th style={{ width: "100px" }}>Due Date</th>
                <th style={{ width: "100px" }}>Status</th>
                <th style={{ width: "36px" }}></th>
              </tr>
            </thead>
            <tbody>
              {sortedMembers.map((member) => {
                const isAssignedToMe =
                  member.assigned_member === user?.username;
                const isDone = member.status === "done";
                const canEditUpdate = !isDone && (isAdmin || isAssignedToMe);
                const st = getStatusStyle(member.status);
                const isExpanded = expandedMemberId === member.id;

                return (
                  <>
                    <tr
                      key={member.id}
                      style={{
                        cursor: "pointer",
                        background: isExpanded ? "#f8f9ff" : "",
                        opacity: isDone ? 0.55 : 1,
                      }}
                      onClick={() =>
                        setExpandedMemberId(isExpanded ? null : member.id)
                      }
                    >
                      {/* No */}
                      <td
                        style={{
                          textAlign: "center",
                          fontWeight: 600,
                          color: "#666",
                          fontSize: "15px",
                        }}
                      >
                        {member.assignment_no}
                      </td>

                      {/* Date */}
                      <td>
                        <span style={{ fontSize: "14px" }}>
                          {fmtDateDDMMYYYY(member.assigned_date)}
                        </span>
                      </td>

                      {/* Time */}
                      <td>
                        <span style={{ fontSize: "14px" }}>
                          {member.assigned_time
                            ? member.assigned_time.substring(0, 5)
                            : "—"}
                        </span>
                      </td>

                      {/* Assigned Member */}
                      <td>
                        {isAdmin && !isDone ? (
                          <select
                            value={member.assigned_member}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleUpdateMember(
                                member.id,
                                "assigned_member",
                                e.target.value,
                              );
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="table-input"
                            style={{ fontSize: "14px" }}
                          >
                            {systemUsers.map((u) => (
                              <option key={u.username} value={u.username}>
                                {u.username}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: isAssignedToMe ? 700 : 400,
                              color: isAssignedToMe ? "#667eea" : "#333",
                            }}
                          >
                            {member.assigned_member}
                            {isAssignedToMe && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  marginLeft: "4px",
                                  color: "#888",
                                }}
                              >
                                (you)
                              </span>
                            )}
                          </span>
                        )}
                      </td>

                      {/* Job Description — truncated preview, edited in expanded panel */}
                      <td
                        style={{
                          fontSize: "14px",
                          color: "#555",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "0",
                        }}
                      >
                        {member.job_description || "—"}
                      </td>

                      {/* Due Date */}
                      <td>
                        <span
                          style={{
                            fontSize: "14px",
                            color:
                              member.due_date &&
                              new Date(member.due_date) < new Date() &&
                              member.status !== "done"
                                ? "#f44336"
                                : "#333",
                          }}
                        >
                          {fmtDateDDMMYYYY(member.due_date)}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background: st.bg,
                            color: st.color,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {st.label}
                        </span>
                      </td>

                      {/* Expand toggle */}
                      <td style={{ textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            color: "#999",
                            fontSize: "12px",
                            transition: "transform 0.2s",
                            transform: isExpanded
                              ? "rotate(90deg)"
                              : "rotate(0deg)",
                          }}
                        >
                          ▶
                        </span>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr key={`${member.id}-detail`}>
                        <td
                          colSpan={8}
                          style={{ padding: 0, background: "#fafbff" }}
                        >
                          <div
                            style={{
                              padding: "20px 24px",
                              borderTop: "2px solid #667eea20",
                              borderBottom: "1px solid #e8e8e8",
                            }}
                          >
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "280px 1fr",
                                gap: "24px",
                              }}
                            >
                              {/* Left: Job Description edit, Due Date edit, Finish Date, Status */}
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "16px",
                                }}
                              >
                                {isAdmin && (
                                  <div>
                                    <div style={detailLabelStyle}>
                                      Job Description
                                    </div>
                                    {isDone ? (
                                      <span style={{ fontSize: "14px" }}>
                                        {member.job_description || "—"}
                                      </span>
                                    ) : (
                                      <textarea
                                        defaultValue={
                                          member.job_description || ""
                                        }
                                        onBlur={(e) => {
                                          if (
                                            e.target.value !==
                                            (member.job_description || "")
                                          )
                                            handleUpdateMember(
                                              member.id,
                                              "job_description",
                                              e.target.value,
                                            );
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        rows={2}
                                        placeholder="Job description..."
                                        style={detailTextareaStyle}
                                      />
                                    )}
                                  </div>
                                )}

                                {isAdmin && (
                                  <div>
                                    <div style={detailLabelStyle}>Due Date</div>
                                    {isDone ? (
                                      <span style={{ fontSize: "14px" }}>
                                        {fmtDateDDMMYYYY(member.due_date)}
                                      </span>
                                    ) : (
                                      <input
                                        type="date"
                                        value={toDateInput(member.due_date)}
                                        onChange={(e) =>
                                          handleUpdateMember(
                                            member.id,
                                            "due_date",
                                            e.target.value,
                                          )
                                        }
                                        onClick={(e) => e.stopPropagation()}
                                        style={detailInputStyle}
                                      />
                                    )}
                                  </div>
                                )}

                                <div>
                                  <div style={detailLabelStyle}>
                                    Finish Date
                                  </div>
                                  <span style={{ fontSize: "14px" }}>
                                    {fmtDateDDMMYYYY(member.finish_date)}
                                  </span>
                                </div>

                                <div>
                                  <div style={detailLabelStyle}>Status</div>
                                  {isDone ? (
                                    <span
                                      style={{
                                        padding: "3px 10px",
                                        borderRadius: "10px",
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        background: st.bg,
                                        color: st.color,
                                      }}
                                    >
                                      {st.label}
                                    </span>
                                  ) : (
                                    <select
                                      value={member.status}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        handleMemberStatusChange(
                                          member,
                                          e.target.value,
                                        );
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      style={{
                                        width: "100%",
                                        padding: "7px 10px",
                                        fontSize: "13px",
                                        border: "1.5px solid #ddd",
                                        borderRadius: "6px",
                                        background: st.bg,
                                        color: st.color,
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        boxSizing: "border-box" as const,
                                      }}
                                    >
                                      {STATUS_OPTIONS.map((s) => (
                                        <option key={s.value} value={s.value}>
                                          {s.label}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              </div>

                              {/* Right: Update Log */}
                              <div>
                                <MemberUpdateLog
                                  customerId={customerId}
                                  projectId={projectId}
                                  memberId={member.id}
                                  canEdit={canEditUpdate}
                                  isAdmin={isAdmin}
                                  readOnly={isDone}
                                />
                              </div>
                            </div>

                            {isAdmin && (
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                  marginTop: "16px",
                                  paddingTop: "14px",
                                  borderTop: "1px solid #f0f0f0",
                                }}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMember(member.id);
                                  }}
                                  style={{
                                    padding: "6px 14px",
                                    background: "#fff",
                                    color: "#c62828",
                                    border: "1px solid #ef9a9a",
                                    borderRadius: "7px",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                  }}
                                >
                                  🗑️ Remove Assignment
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}

              {assignedMembers.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: "center",
                      color: "#999",
                      padding: "40px",
                    }}
                  >
                    No members assigned yet.
                    {isAdmin && ' Click "+ Assign Member" to add one.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Project Activities - EVERYONE CAN ADD, ADMIN ONLY EDIT/DELETE */}
        <div className="project-section">
          <div className="section-header">
            <h3 className="section-title-text">Project Activities / Remarks</h3>
            <button
              className="btn-add-small"
              onClick={() => setShowAddEntry(!showAddEntry)}
            >
              + Add
            </button>
          </div>

          {showAddEntry && (
            <div className="add-meeting-form">
              <input
                type="text"
                value={newEntryDesc}
                onChange={(e) => setNewEntryDesc(e.target.value)}
                placeholder="Description"
                className="meeting-input"
                style={{ flex: 2 }}
                onKeyDown={(e) => e.key === "Enter" && handleAddEntry()}
              />
              <button className="btn-add-meeting" onClick={handleAddEntry}>
                Add
              </button>
              <button
                className="btn-cancel-meeting"
                onClick={() => setShowAddEntry(false)}
              >
                Cancel
              </button>
            </div>
          )}
          <table className="meetings-table">
            <thead>
              <tr>
                <th style={{ width: "60px" }}>No</th>
                <th style={{ width: "120px" }}>Date</th>
                <th style={{ width: "100px" }}>Time</th>
                <th style={{ width: "120px" }}>User</th>
                <th>Description</th>
                <th>Remarks (ADMIN only)</th>
                {isAdmin && <th style={{ width: "80px" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {tableEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <p style={{ fontSize: "16px" }}>{entry.activity_no}</p>
                  </td>
                  <td>
                    {isAdmin ? (
                      <input
                        type="date"
                        value={toDateInput(entry.activity_date)}
                        onChange={(e) =>
                          handleUpdateEntry(
                            entry.id,
                            "activity_date",
                            e.target.value,
                          )
                        }
                        className="table-input"
                      />
                    ) : (
                      <p style={{ fontSize: "16px" }}>
                        {fmtDateDDMMYYYY(entry.activity_date)}
                      </p>
                    )}
                  </td>
                  <td>
                    {isAdmin ? (
                      <input
                        type="time"
                        value={entry.activity_time || ""}
                        onChange={(e) =>
                          handleUpdateEntry(
                            entry.id,
                            "activity_time",
                            e.target.value,
                          )
                        }
                        className="table-input"
                      />
                    ) : (
                      <p style={{ fontSize: "16px" }}>
                        {entry.activity_time
                          ? entry.activity_time.substring(0, 5)
                          : "—"}
                      </p>
                    )}
                  </td>
                  <td>
                    <p style={{ fontSize: "16px" }}>
                      {entry.created_by || "Unknown"}
                    </p>
                  </td>
                  <td>
                    {isAdmin ? (
                      <textarea
                        defaultValue={entry.description}
                        onBlur={(e) => {
                          if (e.target.value !== entry.description) {
                            handleUpdateEntry(
                              entry.id,
                              "description",
                              e.target.value,
                            );
                          }
                        }}
                        className="table-textarea"
                        rows={2}
                      />
                    ) : (
                      <p style={{ fontSize: "16px" }}>{entry.description}</p>
                    )}
                  </td>

                  <td>
                    {isAdmin ? (
                      <textarea
                        defaultValue={entry.remarks || ""}
                        onBlur={(e) => {
                          if (e.target.value !== (entry.remarks || "")) {
                            handleUpdateEntry(
                              entry.id,
                              "remarks",
                              e.target.value,
                            );
                          }
                        }}
                        className="table-textarea"
                        rows={2}
                        placeholder="Add remarks then click away to save..."
                      />
                    ) : (
                      <p
                        style={{
                          fontSize: "16px",
                          color: "#666",
                          fontStyle: entry.remarks ? "normal" : "italic",
                        }}
                      >
                        {entry.remarks || "—"}
                      </p>
                    )}
                  </td>

                  {isAdmin && (
                    <td>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteEntry(entry.id)}
                      >
                        🗑️
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {tableEntries.length === 0 && (
                <tr>
                  <td
                    colSpan={isAdmin ? 6 : 5}
                    style={{
                      textAlign: "center",
                      color: "#999",
                      padding: "40px",
                    }}
                  >
                    No activities yet. Click "+ Add" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* BOQ Section */}
        <div className="project-section">
          <h3 className="section-title-text">BOQ (Bill of Quantities)</h3>

          {/* Hidden file input */}
          <input
            type="file"
            ref={boqFileInputRef}
            onChange={(e) =>
              activeBOQCategory && handleBOQFileUpload(e, activeBOQCategory)
            }
            style={{ display: "none" }}
            accept=".pdf,.doc,.docx,.xls,.xlsx"
          />

          {/* Category Buttons */}
          <div className="boq-buttons">
            <button
              className={`boq-btn ${activeBOQCategory === "electrical" ? "active" : ""}`}
              onClick={() => handleBOQCategoryClick("electrical")}
            >
              BOQ
              {activeBOQCategory === "electrical" && (
                <span className="btn-indicator"> ▼</span>
              )}
            </button>
            <button
              className={`boq-btn ${activeBOQCategory === "invoice" ? "active" : ""}`}
              onClick={() => handleBOQCategoryClick("invoice")}
            >
              Invoice
              {activeBOQCategory === "invoice" && (
                <span className="btn-indicator"> ▼</span>
              )}
            </button>
            <button
              className={`boq-btn ${activeBOQCategory === "quotation" ? "active" : ""}`}
              onClick={() => handleBOQCategoryClick("quotation")}
            >
              Quotation
              {activeBOQCategory === "quotation" && (
                <span className="btn-indicator"> ▼</span>
              )}
            </button>
          </div>

          {/* Documents List for Active Category */}
          {activeBOQCategory && (
            <div className="boq-documents-section">
              <div className="boq-section-header">
                <h4>
                  {activeBOQCategory === "electrical" &&
                    "Electrical BOQ Documents"}
                  {activeBOQCategory === "invoice" && "Invoice BOQ Documents"}
                  {activeBOQCategory === "quotation" && "Quotation Documents"}
                </h4>
                <button
                  className="btn-upload-boq"
                  onClick={() => boqFileInputRef.current?.click()}
                  disabled={uploadingBOQ}
                >
                  {uploadingBOQ ? "Uploading..." : "📤 Upload Document"}
                </button>
              </div>

              {boqDocuments.length === 0 ? (
                <div className="empty-boq">
                  <p>No documents uploaded yet</p>
                  <button
                    className="btn-upload-boq-empty"
                    onClick={() => boqFileInputRef.current?.click()}
                  >
                    📤 Upload First Document
                  </button>
                </div>
              ) : (
                <table className="boq-documents-table">
                  <thead>
                    <tr>
                      <th style={{ width: "50px" }}>Type</th>
                      <th>File Name</th>
                      <th style={{ width: "120px" }}>Size</th>
                      <th style={{ width: "140px" }}>Uploaded</th>
                      <th style={{ width: "100px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boqDocuments.map((doc) => (
                      <tr key={doc.id}>
                        <td style={{ fontSize: "1rem", textAlign: "center" }}>
                          {getFileIcon(doc.file_type)}
                        </td>
                        <td>
                          <div style={{ fontWeight: 500, fontSize: "16px" }}>
                            {doc.original_filename}
                          </div>
                        </td>
                        <td style={{ fontSize: "16px" }}>
                          {formatFileSize(doc.file_size)}
                        </td>
                        <td style={{ fontSize: "16px" }}>
                          {fmtDateDDMMYYYY(doc.created_at)}
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              justifyContent: "center",
                            }}
                          >
                            <button
                              className="btn-download-small"
                              onClick={() => handleDownloadBOQ(doc)}
                              title="Download"
                            >
                              ⬇️
                            </button>
                            {isAdmin && (
                              <button
                                className="btn-delete-small"
                                onClick={() =>
                                  handleDeleteBOQ(doc.id, activeBOQCategory)
                                }
                                title="Delete (Admin only)"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Attachments - EVERYONE CAN UPLOAD, ADMIN ONLY DELETE */}
        <div className="project-section">
          <div className="section-header">
            <h3 className="section-title-text">Attachments</h3>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {uploadingFile && (
                <span style={{ color: "#666", fontSize: "0.9rem" }}>
                  Uploading...
                </span>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                style={{ display: "none" }}
                accept="*/*"
              />
              <button
                className="btn-add-small"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
              >
                📎 Upload File
              </button>
            </div>
          </div>

          {attachments.length === 0 ? (
            <div className="empty-attachments">
              <p>No attachments yet</p>
              <p style={{ fontSize: "0.9rem", color: "#999" }}>
                Click "Upload File" to add documents, images, or any files
              </p>
            </div>
          ) : (
            <table className="meetings-table attachments-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th style={{ width: "120px" }}>Size</th>
                  <th style={{ width: "140px" }}>Date</th>
                  <th style={{ width: "120px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attachments.map((attachment) => (
                  <tr key={attachment.id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: "16px" }}>
                        {attachment.original_filename}
                      </div>
                    </td>
                    <td style={{ fontSize: "16px" }}>
                      {formatFileSize(attachment.file_size)}
                    </td>
                    <td style={{ fontSize: "16px" }}>
                      {fmtDateDDMMYYYY(attachment.created_at)}
                    </td>
                    <td style={{ fontSize: "16px" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          justifyContent: "center",
                        }}
                      >
                        <button
                          className="btn-download-small"
                          onClick={() => handleDownload(attachment)}
                          title="Download file"
                        >
                          ⬇️
                        </button>
                        {isAdmin && (
                          <button
                            className="btn-delete-small"
                            onClick={() =>
                              handleDeleteAttachment(attachment.id)
                            }
                            title="Delete file (Admin only)"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Meetings - EVERYONE CAN ADD, ADMIN ONLY EDIT/DELETE */}
        <div className="project-section">
          <div className="section-header">
            <h3 className="section-title-text">Meetings</h3>
            <button
              className="btn-add-small"
              onClick={() => setShowAddMeeting(!showAddMeeting)}
            >
              + Add
            </button>
          </div>

          {showAddMeeting && (
            <div
              style={{
                background: "#f8f9ff",
                border: "1px solid #e0e0e0",
                borderRadius: "10px",
                padding: "16px 20px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#555",
                      marginBottom: "4px",
                      textTransform: "uppercase" as const,
                    }}
                  >
                    Date *
                  </label>
                  <input
                    type="date"
                    value={newMeetingDate}
                    onChange={(e) => setNewMeetingDate(e.target.value)}
                    className="meeting-input"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#555",
                      marginBottom: "4px",
                      textTransform: "uppercase" as const,
                    }}
                  >
                    Time
                  </label>
                  <input
                    type="time"
                    value={newMeetingTime}
                    onChange={(e) => setNewMeetingTime(e.target.value)}
                    className="meeting-input"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#555",
                      marginBottom: "4px",
                      textTransform: "uppercase" as const,
                    }}
                  >
                    Location
                  </label>
                  <input
                    type="text"
                    value={newMeetingLocation}
                    onChange={(e) => setNewMeetingLocation(e.target.value)}
                    placeholder="Location (optional)"
                    className="meeting-input"
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#555",
                      marginBottom: "4px",
                      textTransform: "uppercase" as const,
                    }}
                  >
                    Description *
                  </label>
                  <input
                    type="text"
                    value={newMeetingDesc}
                    onChange={(e) => setNewMeetingDesc(e.target.value)}
                    placeholder="Meeting description"
                    className="meeting-input"
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#555",
                      marginBottom: "4px",
                      textTransform: "uppercase" as const,
                    }}
                  >
                    Customer Side
                  </label>
                  <input
                    value={newMeetingCustomerSide}
                    onChange={(e) => setNewMeetingCustomerSide(e.target.value)}
                    placeholder="Customer Side..."
                    className="meeting-input"
                    style={{ width: "100%", resize: "vertical" as const }}
                  />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#555",
                      marginBottom: "4px",
                      textTransform: "uppercase" as const,
                    }}
                  >
                    CM Side
                  </label>
                  <input
                    value={newMeetingCMSide}
                    onChange={(e) => setNewMeetingCMSide(e.target.value)}
                    placeholder=" CM Side"
                    className="meeting-input"
                    style={{ width: "100%", resize: "vertical" as const }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn-add-meeting" onClick={handleAddMeeting}>
                  Add Meeting
                </button>
                <button
                  className="btn-cancel-meeting"
                  onClick={() => {
                    setShowAddMeeting(false);
                    setNewMeetingDate("");
                    setNewMeetingTime("");
                    setNewMeetingLocation("");
                    setNewMeetingDesc("");
                    setNewMeetingCustomerSide("");
                    setNewMeetingCMSide("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <table className="meetings-table">
            <thead>
              <tr>
                <th style={{ width: "120px" }}>Date</th>
                <th style={{ width: "100px" }}>Time</th>
                <th style={{ width: "140px" }}>Location</th>
                <th style={{ width: "120px" }}>User</th>
                <th>Description</th>
                <th style={{ width: "120px" }}>Details</th>
                {isAdmin && <th style={{ width: "60px" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {meetings.map((meeting) => (
                <tr key={meeting.id}>
                  {/* Date */}
                  <td>
                    {isAdmin ? (
                      <input
                        type="date"
                        value={toDateInput(meeting.date)}
                        onChange={(e) =>
                          handleUpdateMeeting(
                            meeting.id,
                            "date",
                            e.target.value,
                          )
                        }
                        className="table-input"
                      />
                    ) : (
                      <span style={{ fontSize: "16px" }}>
                        {fmtDateDDMMYYYY(meeting.date)}
                      </span>
                    )}
                  </td>

                  {/* Time */}
                  <td>
                    {isAdmin ? (
                      <input
                        type="time"
                        value={meeting.meeting_time || ""}
                        onChange={(e) =>
                          handleUpdateMeeting(
                            meeting.id,
                            "meeting_time",
                            e.target.value,
                          )
                        }
                        className="table-input"
                      />
                    ) : (
                      <span style={{ fontSize: "16px" }}>
                        {meeting.meeting_time || "—"}
                      </span>
                    )}
                  </td>

                  {/* Location */}
                  <td>
                    {isAdmin ? (
                      <input
                        type="text"
                        value={meeting.location || ""}
                        onChange={(e) =>
                          handleUpdateMeeting(
                            meeting.id,
                            "location",
                            e.target.value,
                          )
                        }
                        className="table-input"
                        placeholder="Location"
                      />
                    ) : (
                      <span style={{ fontSize: "16px" }}>
                        {meeting.location || "—"}
                      </span>
                    )}
                  </td>

                  {/* User */}
                  <td>
                    <span style={{ fontSize: "16px" }}>
                      {meeting.created_by || "—"}
                    </span>
                  </td>

                  {/* Description */}
                  <td>
                    {isAdmin ? (
                      <input
                        type="text"
                        value={meeting.description}
                        onChange={(e) =>
                          handleUpdateMeeting(
                            meeting.id,
                            "description",
                            e.target.value,
                          )
                        }
                        className="table-input"
                      />
                    ) : (
                      <span style={{ fontSize: "16px" }}>
                        {meeting.description}
                      </span>
                    )}
                  </td>

                  <td style={{ padding: "8px", position: "relative" as const }}>
                    <MeetingDetailPanel
                      meeting={meeting}
                      customerId={customerId}
                      projectId={projectId}
                      isAdmin={isAdmin}
                      onUpdate={handleUpdateMeeting}
                    />
                  </td>

                  {isAdmin && (
                    <td>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteMeeting(meeting.id)}
                      >
                        🗑️
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {meetings.length === 0 && (
                <tr>
                  <td
                    colSpan={isAdmin ? 7 : 6}
                    style={{ textAlign: "center", color: "#999" }}
                  >
                    No meetings yet. Click "+ Add" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const detailLabelStyle = {
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.6px",
  color: "#667eea",
  marginBottom: "8px",
  paddingBottom: "6px",
  borderBottom: "2px solid #e8f0fe",
};

const detailTextareaStyle = {
  width: "100%",
  padding: "7px 10px",
  fontSize: "13px",
  border: "1.5px solid #ddd",
  borderRadius: "6px",
  resize: "vertical" as const,
  fontFamily: "inherit",
  boxSizing: "border-box" as const,
};

const detailInputStyle = {
  width: "100%",
  padding: "7px 10px",
  fontSize: "13px",
  border: "1.5px solid #ddd",
  borderRadius: "6px",
  boxSizing: "border-box" as const,
};

export default ProjectDashboard;
