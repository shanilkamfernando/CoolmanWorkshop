// ============================================
// SignIn Component - Works with your TypeScript backend
// Save as: client/src/pages/auth/SignIn.tsx
// ============================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Auth.css";

interface SignInForm {
  username: string;
  password: string;
}

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignInForm>({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validation
      if (!formData.username || !formData.password) {
        setError("Please enter both username and password");
        setLoading(false);
        return;
      }

      // Call backend API
      const response = await axios.post(
        "https://coolmanworkshop-production.up.railway.app/api/auth/signin",
        {
          username: formData.username,
          password: formData.password,
        },
      );

      if (response.data.token) {
        // Store user data and token
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        console.log("Login successful:", response.data.user);

        // // Redirect based on role
        // if (response.data.user.role === "admin") {
        //   navigate("/dashboard");
        // } else {
        //   navigate("/dashboard");
        // }

        //everyone goes to dashboard - admin will see user management title there
        navigate("/dashboard");
      }
    } catch (err: any) {
      console.error("Signin error:", err);
      setError(
        err.response?.data?.error ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h1>
        Welcome to
        <span className="brand-cool">COOL</span>
        <span className="brand-man">Man</span> <br /> Refrigeration
      </h1>
      <div className="auth-box">
        <div className="auth-header">
          <p className="auth-subtitle">Sign in to your account</p>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/signup")}
              className="link-button"
              disabled={loading}
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
