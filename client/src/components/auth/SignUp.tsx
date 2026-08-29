// ============================================
// SignUp Component - Works with your TypeScript backend
// Save as: client/src/pages/auth/SignUp.tsx
// ============================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Auth.css";
import { EyeIcon, EyeOffIcon, HexPattern, WaveAccent } from "./AuthIcons";
import mainlogo from "../../assets/images/mainlogo.png";

interface SignUpForm {
  username: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignUpForm>({
    username: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      if (
        !formData.username ||
        !formData.password ||
        !formData.firstName ||
        !formData.lastName
      ) {
        setError("Please fill in all required fields");
        setLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long");
        setLoading(false);
        return;
      }

      // Call backend API
      const response = await axios.post(
        "https://coolmanworkshop-production.up.railway.app/api/auth/signup",
        {
          username: formData.username,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        },
      );

      if (response.data.message) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/signin");
        }, 2000);
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.response?.data?.error || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const Brand = () => (
    <div className="auth-brand">
      <div className="badge-wrap">
        {/* <CMBadge size={92} /> */}
        <img src={mainlogo} alt="COOLMan Logo" width={92} height={92} />
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
  );

  if (success) {
    return (
      <div className="auth-container">
        <HexPattern className="hex-corner" />
        <HexPattern className="hex-corner right" flip />
        <Brand />
        <div className="auth-box">
          <div className="success-message">
            <h2>✅ Account Created!</h2>
            <p>Your account has been created successfully.</p>
            <p>Please wait for admin approval to activate your account.</p>
            <p>Redirecting to sign in...</p>
          </div>
        </div>
        <WaveAccent />
      </div>
    );
  }

  return (
    <div className="auth-container">
      <HexPattern className="hex-corner" />
      <HexPattern className="hex-corner right" flip />

      <Brand />

      <div className="auth-box">
        <div className="auth-header">
          <span className="portal-label">Member Portal</span>
          <div className="portal-divider" />
          <p className="auth-subtitle">Create your account</p>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">
                First Name <span className="required">*</span>
              </label>
              <div className="input-wrap">
                {/* <span className="field-icon">
                  <UserIcon />
                </span> */}
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="lastName">
                Last Name <span className="required">*</span>
              </label>
              <div className="input-wrap">
                {/* <span className="field-icon">
                  <UserIcon />
                </span> */}
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  disabled={loading}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="username">
              Username <span className="required">*</span>
            </label>
            <div className="input-wrap">
              {/* <span className="field-icon">
                <UserIcon />
              </span> */}
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="johndoe"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">
                Password <span className="required">*</span>
              </label>
              <div className="input-wrap has-toggle">
                {/* <span className="field-icon">
                  <LockIcon />
                </span> */}
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  disabled={loading}
                  required
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

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm Password <span className="required">*</span>
              </label>
              <div className="input-wrap has-toggle">
                {/* <span className="field-icon">
                  <LockIcon />
                </span> */}
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
          </div>

          <div className="info-box">
            <p>
              📌 After signing up, your account will be inactive until an
              administrator approves it and assigns portal permissions.
            </p>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <button
              onClick={() => navigate("/signin")}
              className="link-button"
              disabled={loading}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>

      <WaveAccent />
    </div>
  );
};

export default SignUp;
