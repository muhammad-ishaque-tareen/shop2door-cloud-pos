import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/SignUp.css";

const BASE = "http://localhost:5000";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  // Form fields — no password fields
  const [form, setForm] = useState({
    fullName: "",
    email:    "",
    phone:    "",
  });

  // UI state
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setError("");

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
    if (!form.fullName.trim())        errs.fullName = "Full name is required.";
    if (!emailRegex.test(form.email)) errs.email    = "Enter a valid email address.";
    if (!form.phone.trim())           errs.phone    = "Phone number is required.";
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
        startCountdown(300);
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

  //  Register — no password sent
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
              Enter your details to create your account
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
                className={`signup-input${fieldErrors.fullName ? " input--error" : ""}`}
                autoComplete="name"
                required
              />
              {fieldErrors.fullName && (
                <span className="field-error">{fieldErrors.fullName}</span>
              )}
            </div>

            {/*  Email + Send OTP button  */}
            <div className="signup-form-group">
              <label className="signup-label">
                Email
                {otpVerified && <span className="verified-badge">✓ Verified</span>}
              </label>
              <div className="input-action-row">
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  className={`signup-input${fieldErrors.email ? " input--error" : ""}${otpVerified ? " input--verified" : ""}`}
                  autoComplete="email"
                  disabled={otpVerified}
                  required
                />
                {!otpVerified && (
                  <button
                    type="button"
                    className="input-action-btn"
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

            {/*  OTP Input (shown after send, before verify)  */}
            {otpSent && !otpVerified && (
              <div className="signup-form-group">
                <label className="signup-label">Enter OTP</label>
                <div className="input-action-row">
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
                    className="input-action-btn input-action-btn--verify"
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
                className={`signup-input${fieldErrors.phone ? " input--error" : ""}`}
                autoComplete="tel"
                required
              />
              {fieldErrors.phone && (
                <span className="field-error">{fieldErrors.phone}</span>
              )}
            </div>

            {/*  Info note replacing password fields  */}
            <div className="signup-info-note">
              <span className="info-note-icon">🔐</span>
              <span>
                Your login password will be sent to your email once your shop
                request is approved by our team.
              </span>
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