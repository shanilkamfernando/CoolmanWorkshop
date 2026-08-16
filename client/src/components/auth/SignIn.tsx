// ============================================
// SignIn Component - Works with your TypeScript backend
// Save as: client/src/pages/auth/SignIn.tsx
// ============================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Auth.css";
import {
  CMBadge,
  UserIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  ShieldIcon,
  GearIcon,
  SnowflakeIcon,
  UsersIcon,
  HexPattern,
  WaveAccent,
} from "./AuthIcons";

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
  const [showPassword, setShowPassword] = useState(false);

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
      <HexPattern className="hex-corner" />
      <HexPattern className="hex-corner right" flip />

      <div className="auth-brand">
        <div className="badge-wrap">
          <CMBadge size={92} />
        </div>
        <div className="wordmark">
          <span className="cool">COOL</span>
          <span className="man">Man</span>
          <span className="wordmark-sub">REFRIGERATION</span>
        </div>
        {/* <p className="tagline">
          <strong>Powered by experience.</strong> Driven by innovation.
        </p> */}
      </div>

      <div className="auth-box">
        <div className="auth-header">
          <span className="portal-label">Member Portal</span>
          <div className="portal-divider" />
          <p className="auth-subtitle">Sign in to continue</p>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <div className="input-wrap">
              <span className="field-icon">
                <UserIcon />
              </span>
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
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrap has-toggle">
              <span className="field-icon">
                <LockIcon />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Signing In..." : "Login"}
          </button>

          <button type="button" className="forgot-link">
            Forgot Password?
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

      <WaveAccent />
    </div>
  );
};

export default SignIn;
