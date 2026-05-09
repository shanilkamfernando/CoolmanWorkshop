// ============================================
// Customer Portal - Fixed Customer Name Handling
// Replace: client/src/pages/customers/CustomerPortal.tsx
// ============================================

import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import "./Customers.css";

// Import logo
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

const CustomerPortal = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Try to get customer from navigation state first
    if (location.state?.customer) {
      setCustomer(location.state.customer);
      setLoading(false);
    } else {
      // If no state, fetch from API or localStorage
      fetchCustomer();
    }
  }, [customerId, location]);

  const fetchCustomer = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/customers/${customerId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.customer) {
        setCustomer(response.data.customer);
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
      // Fallback: Try to find customer in localStorage or demo data
      const demoCustomers = [
        { id: 1, name: "ABC Refrigeration Ltd" },
        { id: 2, name: "XYZ Cold Storage" },
        { id: 3, name: "Cool Systems Inc" },
      ];

      const found = demoCustomers.find((c) => c.id === Number(customerId));
      if (found) {
        setCustomer(found);
      } else {
        setCustomer({
          id: Number(customerId),
          name: "Customer " + customerId,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate initials from customer name
  const getInitials = (name: string): string => {
    const words = name.trim().split(" ");
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  // Generate color from name
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

  const handleBackToList = () => {
    navigate("/customers");
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const handleOperationClick = (path: string) => {
    // IMPORTANT: Always pass customer data when navigating
    navigate(path, { state: { customer } });
  };

  const operations = [
    {
      id: "projects",
      name: "Projects",
      icon: "👥",
      description: "View and manage customer projects",
      path: `/customers/${customerId}/projects`,
    },
    {
      id: "compressor-service",
      name: "Compressor Service",
      icon: "🔧",
      description: "Compressor maintenance services",
      path: `/customers/${customerId}/compressor-service`,
    },
    {
      id: "compressor-repair",
      name: "Compressor Repair",
      icon: "⚙️",
      description: "Compressor repair operations",
      path: `/customers/${customerId}/compressor-repair`,
    },
    {
      id: "system-repair",
      name: "System Repair",
      icon: "💻",
      description: "System repair services",
      path: `/customers/${customerId}/system-repair`,
    },
    {
      id: "system-inspection",
      name: "System Inspection",
      icon: "🔍",
      description: "Regular system inspections",
      path: `/customers/${customerId}/system-inspection`,
    },
    {
      id: "spare-parts",
      name: "Spare Parts",
      icon: "🔩",
      description: "Spare parts management",
      path: `/customers/${customerId}/spare-parts`,
    },
    {
      id: "documents",
      name: "Documents",
      icon: "📄",
      description: "Customer documents and files",
      path: `/customers/${customerId}/documents`,
    },
    {
      id: "jobcards",
      name: "Job Cards",
      icon: "📄",
      description: "Job cards",
      path: `/customers/${customerId}/jobcards`,
    },
  ];

  if (loading) {
    return <div className="loading-center">Loading customer...</div>;
  }

  if (!customer) {
    return <div className="loading-center">Customer not found</div>;
  }

  const initials = getInitials(customer.name);
  const color = getColorFromName(customer.name);

  return (
    <div className="customer-portal">
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
          {/* Customer Logo Badge with Generated Initials */}
          <div className="customer-logo-badge-with-icon">
            <div
              className="customer-badge-logo"
              style={{ backgroundColor: color }}
            >
              {initials}
            </div>
            <span className="customer-logo-text">{customer.name}</span>
          </div>
          <span className="user-icon">👤</span>
          <span className="username">{user?.username || "User"}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content-full">
        <div className="page-header-row">
          <div>
            <h2>{customer.name}</h2>
          </div>
          <button className="btn-back" onClick={handleBackToList}>
            ← Back to Customer List
          </button>
        </div>

        <div className="section-title">
          <h3>Select an Operation</h3>
          <p>Choose a service or operation for this customer</p>
        </div>

        {/* Operations Grid */}
        <div className="operations-grid">
          {operations.map((operation) => (
            <div
              key={operation.id}
              className="operation-card"
              onClick={() => handleOperationClick(operation.path)}
            >
              <div className="operation-icon">{operation.icon}</div>
              <h4 className="operation-name">{operation.name}</h4>
              <p className="operation-description">{operation.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerPortal;
