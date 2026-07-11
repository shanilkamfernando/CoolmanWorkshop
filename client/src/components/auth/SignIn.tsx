// // ============================================
// // SignIn Component - Works with your TypeScript backend
// // Save as: client/src/pages/auth/SignIn.tsx
// // ============================================

// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import "./Auth.css";

// interface SignInForm {
//   username: string;
//   password: string;
// }

// const SignIn = () => {
//   const navigate = useNavigate();
//   const [formData, setFormData] = useState<SignInForm>({
//     username: "",
//     password: "",
//   });
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//     if (error) setError("");
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       // Validation
//       if (!formData.username || !formData.password) {
//         setError("Please enter both username and password");
//         setLoading(false);
//         return;
//       }

//       // Call backend API
//       const response = await axios.post(
//         "https://coolmanworkshop-production.up.railway.app/api/auth/signin",
//         {
//           username: formData.username,
//           password: formData.password,
//         },
//       );

//       if (response.data.token) {
//         // Store user data and token
//         localStorage.setItem("token", response.data.token);
//         localStorage.setItem("user", JSON.stringify(response.data.user));

//         console.log("Login successful:", response.data.user);

//         // // Redirect based on role
//         // if (response.data.user.role === "admin") {
//         //   navigate("/dashboard");
//         // } else {
//         //   navigate("/dashboard");
//         // }

//         //everyone goes to dashboard - admin will see user management title there
//         navigate("/dashboard");
//       }
//     } catch (err: any) {
//       console.error("Signin error:", err);
//       setError(
//         err.response?.data?.error ||
//           "Login failed. Please check your credentials.",
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="auth-container">
//       {/* <div>
//         <div>Welcome to</div>
//         <br />
//         <span className="brand-cool">COOL</span>
//         <span className="brand-man">Man</span> <br />
//         <div>Refrigeration</div>
//       </div> */}
//       <div style={{ textAlign: "center", fontFamily: "Arial, sans-serif" }}>
//         <div
//           style={{
//             fontSize: "40px",
//             fontWeight: 400,
//             color: "#000",
//             marginBottom: "20px",
//           }}
//         >
//           Welcome to
//         </div>
//         <div
//           style={{
//             fontSize: "72px",
//             fontWeight: 700,
//             lineHeight: 1,
//             marginBottom: "10px",
//           }}
//         >
//           <span style={{ color: "#4a90d9" }}>COOL</span>
//           <span style={{ color: "#1e5faa" }}>Man</span>
//         </div>
//         <div style={{ fontSize: "48px", fontWeight: 600, color: "#000" }}>
//           Refrigeration
//         </div>
//       </div>
//       <div className="auth-box">
//         <div className="auth-header">
//           <p className="auth-subtitle">Sign in to your account</p>
//         </div>

//         {error && (
//           <div className="error-message">
//             <span>⚠️ {error}</span>
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="auth-form">
//           <div className="form-group">
//             <label htmlFor="username">Username</label>
//             <input
//               type="text"
//               id="username"
//               name="username"
//               value={formData.username}
//               onChange={handleChange}
//               placeholder="Enter your username"
//               autoComplete="username"
//               disabled={loading}
//             />
//           </div>

//           <div className="form-group" style={{ paddingTop: "1rem" }}>
//             <label htmlFor="password">Password</label>
//             <input
//               type="password"
//               id="password"
//               name="password"
//               value={formData.password}
//               onChange={handleChange}
//               placeholder="Enter your password"
//               autoComplete="current-password"
//               disabled={loading}
//             />
//           </div>

//           <button type="submit" className="btn-primary" disabled={loading}>
//             {loading ? "Signing In..." : "Sign In"}
//           </button>
//         </form>

//         <div className="auth-footer">
//           <p>
//             Don't have an account?{" "}
//             <button
//               onClick={() => navigate("/signup")}
//               className="link-button"
//               disabled={loading}
//             >
//               Sign Up
//             </button>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SignIn;

// ============================================
// Sign In Page - Redesigned to match brand
// ============================================

import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
// Place your images in client/src/assets/:
import bgImage from "../../assets/bgImage.jpg"; // your ocean/water background image
import cmLogo from "../../assets/mainlogo.jpeg"; // optional CM logo top-right

const SignIn = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    return () => {
      document.body.style.margin = "";
      document.body.style.padding = "";
    };
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (error) setError("");
    },
    [error],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setLoading(true);
      try {
        const response = await axios.post(
          "https://coolmanworkshop-production.up.railway.app/api/auth/signin",
          formData,
        );
        if (response.data.success) {
          localStorage.setItem("token", response.data.token);
          localStorage.setItem("user", JSON.stringify(response.data.user));
          navigate("/dashboard");
        } else {
          setError(response.data.message || "Login failed");
        }
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            "Login failed. Please check your credentials.",
        );
      } finally {
        setLoading(false);
      }
    },
    [formData, navigate],
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: `url(${bgImage}) no-repeat center center / cover`,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Optional CM Logo top-right — uncomment when you have the logo */}

      <div style={{ position: "absolute", top: "30px", right: "40px" }}>
        <img src={cmLogo} alt="CM" style={{ width: "80px", height: "80px" }} />
      </div>

      {/* Centered Title */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          paddingTop: "60px",
        }}
      >
        <div
          style={{
            fontSize: "36px",
            fontWeight: 400,
            color: "#111",
            marginBottom: "20px",
            textShadow: "0 2px 8px rgba(255,255,255,0.6)",
          }}
        >
          Welcome to
        </div>
        <div
          style={{
            fontSize: "84px",
            fontWeight: 500,
            lineHeight: 1,
            marginBottom: "20px",
            textShadow: "0 2px 12px rgba(255,255,255,0.7)",
          }}
        >
          <span style={{ color: "#4a90d9" }}>COOL</span>
          <span style={{ color: "#1e5faa" }}>Man</span>
        </div>
        <div
          style={{
            fontSize: "56px",
            fontWeight: 400,
            color: "#111",
            textShadow: "0 2px 10px rgba(255,255,255,0.6)",
          }}
        >
          Refrigeration
        </div>
      </div>

      {/* Sign In Form (bottom center) */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          paddingBottom: "60px",
          paddingLeft: "20px",
          paddingRight: "20px",
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            background: "rgba(255,255,255,0.95)",
            padding: "30px 40px",
            borderRadius: "12px",
            boxShadow: "0 15px 40px rgba(0,0,0,0.2)",
            width: "100%",
            maxWidth: "380px",
            backdropFilter: "blur(6px)",
          }}
        >
          {error && (
            <div
              style={{
                background: "#fee2e2",
                color: "#b91c1c",
                padding: "10px 12px",
                borderRadius: "6px",
                fontSize: "13px",
                marginBottom: "15px",
                border: "1px solid #fca5a5",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "#374151",
                marginBottom: "6px",
              }}
            >
              User Name
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: "14px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "#374151",
                marginBottom: "6px",
              }}
            >
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: "14px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: loading ? "#94a3b8" : "#1e5faa",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div
            style={{
              textAlign: "center",
              marginTop: "15px",
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/signup")}
              style={{
                color: "#1e5faa",
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "none",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.textDecoration = "underline")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.textDecoration = "none")
              }
            >
              Sign Up
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
