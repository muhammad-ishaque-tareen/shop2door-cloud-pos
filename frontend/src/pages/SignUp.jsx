import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Signup.css";

const BASE = "http://localhost:5000";

//  Validation helpers (mirror backend rules) 
const emailRegex   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const strengthRules = [
  { label: "At least 8 characters",          test: (p) => p.length >= 8 },
  { label: "One uppercase letter (A-Z)",      test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter (a-z)",      test: (p) => /[a-z]/.test(p) },
  { label: "One number (0-9)",                test: (p) => /\d/.test(p) },
  { label: "One special character (@$!%*?&)", test: (p) => /[@$!%*?&_#^-]/.test(p) },
];

const getStrengthScore = (password) =>
  strengthRules.filter((r) => r.test(password)).length;

const getStrengthLabel = (score) => {
  if (score <= 1) return { label: "Very Weak", color: "#e53935" };
  if (score === 2) return { label: "Weak",      color: "#fb8c00" };
  if (score === 3) return { label: "Fair",      color: "#fdd835" };
  if (score === 4) return { label: "Strong",    color: "#43a047" };
  return               { label: "Very Strong", color: "#1b5e20" };
};

//  OTP Countdown hook 
const useCountdown = (initial = 0) => {
  const [seconds, setSeconds] = useState(initial);
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);
  const start = useCallback((s) => setSeconds(s), []);
  return { seconds, start };
};


const Signup = () => {
  const navigate        = useNavigate();
  const location        = useLocation();
  const selectedPackage = location.state;

  // Form fields
  const [form, setForm] = useState({
    fullName: "",
    email:    "",
    phone:    "",
    password: "",
    confirm:  "",
  });

  // UI state
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // OTP state
  const [otpSent,     setOtpSent]     = useState(false);
  const [otpValue,    setOtpValue]    = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading,  setOtpLoading]  = useState(false);
  const [otpError,    setOtpError]    = useState("");
  const [otpSuccess,  setOtpSuccess]  = useState("");

  const { seconds: countdown, start: startCountdown } = useCountdown(0);

  //  Derived 
  const strengthScore = getStrengthScore(form.password);
  const strengthInfo  = getStrengthLabel(strengthScore);
  const passwordsMatch =
    form.confirm.length > 0 && form.password === form.confirm;

  //  Handlers 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setError("");

    // Reset OTP state if email changes after OTP sent
    if (name === "email") {
      setOtpSent(false);
      setOtpVerified(false);
      setOtpValue("");
      setOtpError("");
      setOtpSuccess("");
    }
  };

  const validateFields = () => {
    const errs = {};
    if (!form.fullName.trim())             errs.fullName = "Full name is required.";
    if (!emailRegex.test(form.email))      errs.email    = "Enter a valid email address.";
    if (!form.phone.trim())                errs.phone    = "Phone number is required.";
    if (getStrengthScore(form.password) < 5)
      errs.password = "Password does not meet all requirements.";
    if (form.password !== form.confirm)    errs.confirm  = "Passwords do not match.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  //  Send OTP 
  const handleSendOtp = async () => {
    setOtpError("");
    setOtpSuccess("");

    if (!emailRegex.test(form.email)) {
      setOtpError("Enter a valid email address first.");
      return;
    }

    setOtpLoading(true);
    try {
      const res  = await fetch(`${BASE}/api/signup/send-otp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: form.email }),
      });
      const data = await res.json();

      if (res.ok) {
        setOtpSent(true);
        setOtpSuccess("OTP sent! Check your inbox (and spam folder).");
        startCountdown(300); // 2-minute resend cooldown
      } else {
        setOtpError(data.message || "Failed to send OTP.");
      }
    } catch {
      setOtpError("Network error. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  //  Verify OTP 
  const handleVerifyOtp = async () => {
    setOtpError("");
    setOtpSuccess("");

    if (!otpValue || otpValue.trim().length !== 6) {
      setOtpError("Please enter the 6-digit OTP.");
      return;
    }

    setOtpLoading(true);
    try {
      const res  = await fetch(`${BASE}/api/signup/verify-otp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: form.email, otp: otpValue }),
      });
      const data = await res.json();

      if (res.ok) {
        setOtpVerified(true);
        setOtpSuccess("✓ Email verified successfully!");
        setOtpError("");
      } else {
        setOtpError(data.message || "OTP verification failed.");
      }
    } catch {
      setOtpError("Network error. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  //  Register 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!otpVerified) {
      setError("Please verify your email with OTP before signing up.");
      return;
    }
    if (!validateFields()) return;

    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/api/signup/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          fullName: form.fullName,
          email:    form.email,
          phone:    form.phone,
          password: form.password,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user",  JSON.stringify(data.user));
        navigate("/shopsetup", {
          state: {
            package_id:   selectedPackage?.package_id,
            package_name: selectedPackage?.package_name,
            price:        selectedPackage?.price,
          },
        });
      } else {
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      {/*  Left Panel  */}
      <div className="signup-left-section">
        <div className="signup-left-content">
          <h1 className="signup-logo">Shop2Door LOGO</h1>
          <h2 className="signup-main-heading">
            Start your<br />journey with us
          </h2>
          <p className="signup-description">
            Discover the best way to manage your<br />
            projects and collaborate with your team.
          </p>
          <div className="signup-testimonial-card">
            <div className="testimonial-quote-icon">❝</div>
            <p className="testimonial-text">
              This platform transformed how our team collaborates. Absolutely game-changing!
            </p>
            <div className="testimonial-author">
              <div className="author-info">
                <span className="author-name">Mr. IT &amp; Altaf Mehmood</span>
                <span className="author-title">Shop2Door Dev Team</span>
              </div>
            </div>
          </div>
        </div>
        <div className="signup-dots-pattern"></div>
      </div>

      {/*  Right Panel  */}
      <div className="signup-right-section">
        <div className="signup-form-container">
          <div className="signup-form-header">
            <h2 className="signup-title">SIGNUP</h2>
            <p className="signup-form-subtitle">
              Enter your credentials to create your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="signup-form" noValidate>

            {/* Global error */}
            {error && <div className="su-alert su-alert--error">{error}</div>}

            {/*  Full Name  */}
            <div className="signup-form-group">
              <label className="signup-label">Full Name</label>
              <input
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={form.fullName}
                onChange={handleChange}
                className={`signup-input ${fieldErrors.fullName ? "input--error" : ""}`}
                autoComplete="name"
                required
              />
              {fieldErrors.fullName && (
                <span className="field-error">{fieldErrors.fullName}</span>
              )}
            </div>

            {/*  Email + OTP send  */}
            <div className="signup-form-group">
              <label className="signup-label">
                Email
                {otpVerified && <span className="verified-badge">✓ Verified</span>}
              </label>
              <div className="email-otp-row">
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  className={`signup-input ${fieldErrors.email ? "input--error" : ""} ${otpVerified ? "input--verified" : ""}`}
                  autoComplete="email"
                  disabled={otpVerified}
                  required
                />
                {!otpVerified && (
                  <button
                    type="button"
                    className="otp-send-btn"
                    onClick={handleSendOtp}
                    disabled={otpLoading || countdown > 0 || !form.email}
                  >
                    {otpLoading
                      ? "Sending…"
                      : countdown > 0
                      ? `Resend (${countdown}s)`
                      : otpSent
                      ? "Resend OTP"
                      : "Send OTP"}
                  </button>
                )}
              </div>
              {fieldErrors.email && (
                <span className="field-error">{fieldErrors.email}</span>
              )}
            </div>

            {/*  OTP Input (shown after send)  */}
            {otpSent && !otpVerified && (
              <div className="signup-form-group otp-group">
                <label className="signup-label">Enter OTP</label>
                <div className="otp-verify-row">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit code"
                    value={otpValue}
                    onChange={(e) => {
                      setOtpValue(e.target.value.replace(/\D/g, ""));
                      setOtpError("");
                    }}
                    className="signup-input otp-input"
                  />
                  <button
                    type="button"
                    className="otp-verify-btn"
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || otpValue.length !== 6}
                  >
                    {otpLoading ? "Verifying…" : "Verify"}
                  </button>
                </div>
                {otpError   && <span className="field-error">{otpError}</span>}
                {otpSuccess  && <span className="field-success">{otpSuccess}</span>}
              </div>
            )}

            {/* Success banner when verified */}
            {otpVerified && (
              <div className="su-alert su-alert--success">{otpSuccess}</div>
            )}

            {/*  Phone  */}
            <div className="signup-form-group">
              <label className="signup-label">Phone</label>
              <input
                type="tel"
                name="phone"
                placeholder="e.g. 0300-0000000"
                value={form.phone}
                onChange={handleChange}
                className={`signup-input ${fieldErrors.phone ? "input--error" : ""}`}
                autoComplete="tel"
                required
              />
              {fieldErrors.phone && (
                <span className="field-error">{fieldErrors.phone}</span>
              )}
            </div>

            {/*  Password  */}
            <div className="signup-form-group">
              <label className="signup-label">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={handleChange}
                  className={`signup-input ${fieldErrors.password ? "input--error" : ""}`}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>

              {/* Strength bar */}
              {form.password.length > 0 && (
                <div className="strength-wrapper">
                  <div className="strength-bar">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="strength-segment"
                        style={{
                          background:
                            i <= strengthScore ? strengthInfo.color : "#e0e0e0",
                        }}
                      />
                    ))}
                  </div>
                  <span className="strength-label" style={{ color: strengthInfo.color }}>
                    {strengthInfo.label}
                  </span>
                </div>
              )}

              {/* Requirement checklist */}
              {form.password.length > 0 && (
                <ul className="password-rules">
                  {strengthRules.map((rule, i) => (
                    <li
                      key={i}
                      className={`password-rule ${rule.test(form.password) ? "rule--pass" : "rule--fail"}`}
                    >
                      <span className="rule-icon">
                        {rule.test(form.password) ? "✓" : "✗"}
                      </span>
                      {rule.label}
                    </li>
                  ))}
                </ul>
              )}
              {fieldErrors.password && (
                <span className="field-error">{fieldErrors.password}</span>
              )}
            </div>

            {/*  Confirm Password  */}
            <div className="signup-form-group">
              <label className="signup-label">Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirm"
                  placeholder="Re-enter your password"
                  value={form.confirm}
                  onChange={handleChange}
                  className={`signup-input ${
                    fieldErrors.confirm
                      ? "input--error"
                      : form.confirm.length > 0
                      ? passwordsMatch
                        ? "input--verified"
                        : "input--error"
                      : ""
                  }`}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              {form.confirm.length > 0 && !passwordsMatch && (
                <span className="field-error">Passwords do not match.</span>
              )}
              {form.confirm.length > 0 && passwordsMatch && (
                <span className="field-success">✓ Passwords match</span>
              )}
            </div>

            {/*  Submit  */}
            <button
              type="submit"
              className="signup-submit-button"
              disabled={loading || !otpVerified}
            >
              <span>{loading ? "CREATING ACCOUNT…" : "CREATE ACCOUNT"}</span>
              <span className="button-arrow">→</span>
            </button>
          </form>

          <div className="signup-bottom-login">
            <span className="bottom-login-text">Already have an account?</span>
            <button className="bottom-login-button" onClick={() => navigate("/login")}>
              LOGIN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;