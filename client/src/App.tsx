import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import SignIn from "./components/auth/SignIn";
import SignUp from "./components/auth/SignUp";
import Dashboard from "./components/dashboard/Dashboard";
import UserManagement from "./pages/users/userManagement";

//customer portal
import CustomerList from "./pages/customers/CustomerList";
import CustomerPortal from "./pages/customers/CustomerPortal";

//customer - project portal
import ProjectPortal from "./pages/customers/ProjectPortal";
import ProjectDashboard from "./pages/customers/ProjectDashboard";

//customer - compressor service
import CompressorServicePortal from "./pages/customers/CompressorServicePortal";
import CompressorServiceDashboard from "./pages/customers/CompressorServiceDashboard";

//customer - compressor repair
import CompressorRepairPortal from "./pages/customers/CompressorRepairPortal";
import CompressorRepairDashboard from "./pages/customers/CompressorRepairDashboard";

//customer - system repair
import SystemRepairDashboard from "./pages/customers/SystemRepairDashboard";

//customer - system inspection
import SystemInspectionDashboard from "./pages/customers/SystemInspectionDashboard";

//customer - customer documents
import DocumentsDashboard from "./pages/customers/DocumentsDashboard";

//customer - job cards
import JobCardsList from "./pages/customers/JobCardsList";
import JobCardDetail from "./pages/customers/JobCardDetail";

//purchasing portal
import PurchasingPortal from "./pages/purchasing/PurchasingPortal";
import PurchasingCustomerList from "./pages/purchasing/PurchasingCustomerList";
import BOQPage from "./pages/purchasing/BOQPage";
import CustomerPurchasingDashboard from "./pages/purchasing/CustomerPurchasingDashboard";

//purchasing - Workshop portal
import WorkshopPortal from "./pages/purchasing/WorkshopPortal";
import PurchasingCustomerPortal from "./pages/purchasing/PurchasingCustomerPortal";
import PurchasingDashboard from "./pages/purchasing/PurchasingDashboard";

//stores - dashboard
import StoresDashboard from "./pages/stores/StoresDashboard";
import StoresLanding from "./pages/stores/StoresLanding";
import StoreBrands from "./pages/stores/StoreBrands";

//documents - dashboard
import Documents from "./pages/documents/Documents";

//worklist - worklist years
import WorklistDashboard from "./pages/worklist/WorklistDashboard";
import WorklistTasksDashboard from "./pages/worklist/WorklistTaskDashboard";

//meetings
import MeetingsDashboard from "./pages/meetings/MeetingsDashboard";

//followups
import FollowUpDashboard from "./pages/followup/FollowUpDashboard";

import WorkshopPage from "./pages/workshop/WorkshopPage";
import WorkshopJobCardsList from "./pages/workshop/WorkshopJobCardsList";
import WorkshopJobCardDetail from "./pages/workshop/WorkshopJobCardDetail";

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requiredPortal?: string;
}

const ProtectedRoute = ({
  children,
  requireAdmin = false,
  requiredPortal,
}: ProtectedRouteProps) => {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  if (userStr) {
    const user = JSON.parse(userStr);

    // Check admin requirement
    if (requireAdmin && user.role !== "admin") {
      return <Navigate to="/dashboard" replace />;
    }

    // Check portal access requirement
    if (requiredPortal && user.role !== "admin") {
      const hasAccess = user.permissions?.portals?.includes(requiredPortal);
      if (!hasAccess) {
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "100vh",
              textAlign: "center",
              padding: "20px",
            }}
          >
            <h1 style={{ fontSize: "3rem", marginBottom: "20px" }}>🔒</h1>
            <h2>Access Denied</h2>
            <p>You don't have permission to access this portal.</p>
            <p>Please contact your administrator.</p>
            <a
              href="/dashboard"
              style={{
                marginTop: "20px",
                padding: "10px 20px",
                background: "#667eea",
                color: "white",
                textDecoration: "none",
                borderRadius: "6px",
              }}
            >
              Go to Dashboard
            </a>
          </div>
        );
      }
    }
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Only Routes */}
        <Route
          path="/users"
          element={
            <ProtectedRoute requireAdmin={true}>
              <UserManagement />
            </ProtectedRoute>
          }
        />

        {/* customer portal routes */}
        <Route
          path="/customers"
          element={
            <ProtectedRoute requiredPortal="customers">
              <CustomerList />
            </ProtectedRoute>
          }
        />

        <Route path="/customers/:customerId" element={<CustomerPortal />} />

        <Route
          path="/customers/:customerId/projects"
          element={
            <ProtectedRoute requiredPortal="customers">
              <ProjectPortal />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customers/:customerId/compressor-service"
          element={
            <ProtectedRoute requiredPortal="customers">
              <CompressorServicePortal />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customers/:customerId/compressor-service/:companyId"
          element={
            <ProtectedRoute requiredPortal="customers">
              <CompressorServiceDashboard />
            </ProtectedRoute>
          }
        />

        {/* Placeholder routes for customer operations */}
        <Route
          path="/customers/:customerId/projects/:projectId"
          element={
            <ProtectedRoute requiredPortal="customers">
              <ProjectDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customers/:customerId/compressor-repair"
          element={
            <ProtectedRoute requiredPortal="customers">
              <CompressorRepairPortal />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customers/:customerId/compressor-repair/:companyId"
          element={
            <ProtectedRoute requiredPortal="customers">
              <CompressorRepairDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customers/:customerId/system-repair"
          element={<SystemRepairDashboard />}
        />

        <Route
          path="/customers/:customerId/system-inspection"
          element={<SystemInspectionDashboard />}
        />

        <Route
          path="/customers/:customerId/documents"
          element={<DocumentsDashboard />}
        />

        <Route
          path="/customers/:customerId/jobcards"
          element={<JobCardsList />}
        />
        <Route
          path="/customers/:customerId/jobcards/:jobCardId"
          element={<JobCardDetail />}
        />

        <Route path="/purchasing" element={<PurchasingPortal />} />

        <Route path="/purchasing/workshop" element={<WorkshopPortal />} />
        <Route
          path="/purchasing/workshop/customers"
          element={
            <ProtectedRoute>
              <PurchasingCustomerPortal />
            </ProtectedRoute>
          }
        />

        <Route
          path="/purchasing/workshop/customers/:customerId/dashboard"
          element={
            <ProtectedRoute>
              <PurchasingDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/purchasing/customer-list"
          element={
            <ProtectedRoute>
              <PurchasingCustomerList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/purchasing/customers/:customerId/dashboard"
          element={
            <ProtectedRoute>
              <CustomerPurchasingDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/purchasing/boq"
          element={
            <ProtectedRoute>
              <BOQPage />
            </ProtectedRoute>
          }
        />
        {/* 
        <Route
          path="/purchasing/workshop/project"
          element={
            <ProtectedRoute>
              <WorkshopProjectPortal />
            </ProtectedRoute>
          }
        />

        <Route
          path="/purchasing/workshop/repair"
          element={
            <ProtectedRoute>
              <WorkshopRepairPortal />
            </ProtectedRoute>
          }
        /> */}

        <Route
          path="/stores"
          element={
            <ProtectedRoute>
              <StoresLanding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stores/:categoryKey"
          element={
            <ProtectedRoute>
              <StoreBrands />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stores/:categoryKey/:brandId"
          element={
            <ProtectedRoute>
              <StoresDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/workshop"
          element={
            <ProtectedRoute>
              <WorkshopPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workshop/customers/:customerId/jobcards"
          element={
            <ProtectedRoute>
              <WorkshopJobCardsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workshop/customers/:customerId/jobcards/:jobCardId"
          element={
            <ProtectedRoute>
              <WorkshopJobCardDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <Documents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/jobAssigned"
          element={
            <ProtectedRoute>
              <WorklistDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/jobAssigned/:year"
          element={
            <ProtectedRoute>
              <WorklistTasksDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/meetings" element={<MeetingsDashboard />} />

        {/* for now this is commented */}
        {/* <Route path="/followup" element={<FollowUpDashboard />} /> */}

        {/* Default Route */}
        <Route
          path="/"
          element={
            localStorage.getItem("token") ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                textAlign: "center",
              }}
            >
              <h1 style={{ fontSize: "4rem" }}>404</h1>
              <p>Page not found</p>
              <a
                href="/dashboard"
                style={{ marginTop: "20px", color: "#667eea" }}
              >
                Go to Dashboard
              </a>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
