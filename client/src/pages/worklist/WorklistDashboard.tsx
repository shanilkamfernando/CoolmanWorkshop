// ============================================
// Worklist Dashboard - Year Selection
// Save as: client/src/pages/worklist/WorklistDashboard.tsx
// ============================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./WorklistDashboard.css";
import companyLogo from "../../assets/mainlogo.jpeg";

interface User {
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface WorklistYear {
  id: number;
  year: number;
  created_by: string;
  created_at: string;
}

const WorklistDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [years, setYears] = useState<WorklistYear[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newYear, setNewYear] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchYears();
  }, []);

  const isAdmin = user?.role === "admin";

  const fetchYears = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "https://coolmanworkshop-production.up.railway.app/api/jobAssigned/years",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setYears(response.data.years || []);
    } catch (error) {
      console.error("Error fetching years:", error);
      setYears([]);
    }
  };

  const handleAddYear = async () => {
    if (!newYear.trim()) {
      alert("Please enter a year");
      return;
    }

    const yearNum = parseInt(newYear);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      alert("Please enter a valid year between 2000 and 2100");
      return;
    }

    // Check if year already exists
    if (years.some((y) => y.year === yearNum)) {
      alert("This year already exists");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "https://coolmanworkshop-production.up.railway.app/api/jobAssigned/years",
        { year: yearNum },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        alert("Year added successfully!");
        setShowAddModal(false);
        setNewYear("");
        fetchYears();
      }
    } catch (error) {
      console.error("Error adding year:", error);
      alert("Failed to add year");
    }
  };

  const handleYearClick = (year: WorklistYear) => {
    navigate(`/jobAssigned/${year.year}`, {
      state: { year },
    });
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const getInitials = (yearNum: number): string => {
    return yearNum.toString().substring(2); // Last 2 digits
  };

  const getColorFromYear = (yearNum: number): string => {
    const colors = ["#2196F3"];
    return colors[yearNum % colors.length];
  };

  return (
    <div className="worklist-dashboard">
      {/* Header */}
      <div className="portal-header">
        <div className="header-left">
          <div className="logo-container" onClick={handleBackToDashboard}>
            <img
              src={companyLogo}
              alt="Company Logo"
              className="company-logo"
            />
          </div>
          <h1 className="portal-title" onClick={handleBackToDashboard}>
            <span className="brand-cool">COOL</span>
            <span className="brand-man">Man</span> Refrigeration
          </h1>
        </div>
        <div className="header-right">
          <span className="user-icon">👤</span>
          <span className="username">{user?.username || "User"}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="page-header">
          <div>
            <h2>Job Assigned</h2>
            <p className="page-subtitle">Select a year to view tasks</p>
          </div>
          <div className="header-actions">
            {isAdmin && (
              <button
                className="btn-add-year"
                onClick={() => setShowAddModal(true)}
              >
                + Add Year
              </button>
            )}
          </div>
        </div>

        {/* Years Grid */}
        {years.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No years yet</h3>
            <p>Create your first year to get started</p>
            {isAdmin && (
              <button
                className="btn-add-year"
                onClick={() => setShowAddModal(true)}
              >
                + Add Year
              </button>
            )}
          </div>
        ) : (
          <div className="years-grid">
            {years.map((year) => {
              const color = getColorFromYear(year.year);
              return (
                <div
                  key={year.id}
                  className="year-card"
                  onClick={() => handleYearClick(year)}
                  style={{ borderColor: color }}
                >
                  <div
                    className="year-icon-circle"
                    style={{ backgroundColor: color }}
                  >
                    📅
                  </div>
                  <h3 className="year-number">{year.year}</h3>
                  <p className="year-date">
                    Created: {new Date(year.created_at).toLocaleDateString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Year Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Year</h2>
              <button
                className="close-button"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>
                  Year <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="number"
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  placeholder="Enter year (e.g., 2025)"
                  className="form-input"
                  min="2000"
                  max="2100"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button className="btn-save" onClick={handleAddYear}>
                Add Year
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorklistDashboard;
