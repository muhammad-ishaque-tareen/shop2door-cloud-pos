import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ForgotPassword.css";

const BASE        = "http://localhost:5000";
const emailRegex  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//  Countdown hook (same pattern as SignUp) 
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

//  Steps 
// 1 → Enter email (+ optional shop code)
// 2 → Enter & verify OTP
// 3 → Set new password
// 4 → Success screen

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step,         setStep]         = useState(1);
  const [email,        setEmail]        = useState("");
  const [shopCode,     setShopCode]     = useState("");
  const [showShopCode, setShowShopCode] = useState(false);

  // OTP
  const [otpValue,   setOtpValue]   = useState("");
  const [otpVerified, setOtpVerified] = useState(false);

  // New password
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw,       setShowNewPw]       = useState(false);
  const [showConfirmPw,   setShowConfirmPw]   = useState(false);

  // Feedback
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState("");

  const { seconds: countdown, start: startCountdown } = useCountdown(0);

  //  Step 1: Send OTP 
  const handleSendOtp = async () => {
    setError("");
    setSuccess("");

    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/api/forgot-password/send-otp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          email,
          shopCode: shopCode.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess("OTP sent! Check your inbox (and spam folder).");
        setStep(2);
        startCountdown(600); // 10 minutes
      } else {
        setError(data.message || "Failed to send OTP.");
        // If backend says a shop code is needed, reveal the field automatically
        if (data.requiresShopCode) setShowShopCode(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  //  Resend OTP 
  const handleResendOtp = async () => {
    setError("");
    setSuccess("");
    setOtpValue("");
    setOtpVerified(false);
    await handleSendOtp();
  };

  //  Step 2: Verify OTP 
  const handleVerifyOtp = async () => {
    setError("");
    setSuccess("");

    if (!otpValue || otpValue.trim().length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/api/forgot-password/verify-otp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          email,
          otp:      otpValue,
          shopCode: shopCode.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setOtpVerified(true);
        setSuccess("✓ Email verified! Now set your new password.");
        setStep(3);
      } else {
        setError(data.message || "OTP verification failed.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  //  Step 3: Reset Password 
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/api/forgot-password/reset-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          email,
          otp:         otpValue,
          newPassword,
          shopCode:    shopCode.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setStep(4);
      } else {
        setError(data.message || "Password reset failed.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  //  Password strength 
  const getStrength = (pw) => {
    if (!pw) return { label: "", color: "", width: "0%" };
    let score = 0;
    if (pw.length >= 6)                          score++;
    if (pw.length >= 10)                         score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw))   score++;
    if (/\d/.test(pw))                           score++;
    if (/[^A-Za-z0-9]/.test(pw))                score++;
    const levels = [
      { label: "Very Weak", color: "#e53935", width: "20%" },
      { label: "Weak",      color: "#fb8c00", width: "40%" },
      { label: "Fair",      color: "#fdd835", width: "60%" },
      { label: "Strong",    color: "#43a047", width: "80%" },
      { label: "Very Strong",color:"#1b5e20", width: "100%" },
    ];
    return levels[score - 1] || levels[0];
  };

  const strength = getStrength(newPassword);

  //  Render 
  return (
    <div className="fp-container">
      {/* Left Panel */}
      <div className="fp-left-section">
        <div className="fp-left-content">
          <h1 className="fp-logo">Shop2Door LOGO</h1>
          <h2 className="fp-main-heading">
            Reset your<br />password
          </h2>
          <p className="fp-description">
            Don't worry — it happens to everyone.<br />
            We'll help you get back in quickly.
          </p>

          {/* Step indicator */}
          <div className="fp-steps">
            {["Email", "Verify OTP", "New Password", "Done"].map((label, i) => (
              <div key={i} className={`fp-step ${step > i ? "fp-step--done" : ""} ${step === i + 1 ? "fp-step--active" : ""}`}>
                <div className="fp-step-circle">
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span className="fp-step-label">{label}</span>
                {i < 3 && <div className={`fp-step-line ${step > i + 1 ? "fp-step-line--done" : ""}`} />}
              </div>
            ))}
          </div>

          <div className="fp-testimonial-card">
            <div className="fp-quote-icon">❝</div>
            <p className="fp-testimonial-text">
              Security is not a product, but a process. We take yours seriously.
            </p>
            <div className="fp-testimonial-author">
              <div className="fp-author-info">
                <span className="fp-author-name">Mr. IT &amp; Altaf Mehmood</span>
                <span className="fp-author-title">A Team to Transform ideas into Solutions.</span>
              </div>
            </div>
          </div>
        </div>
        <div className="fp-dots-pattern" />
      </div>

      {/* Right Panel */}
      <div className="fp-right-section">
        <div className="fp-form-container">

          {/*  STEP 1: Email  */}
          {step === 1 && (
            <>
              <div className="fp-form-header">
                <div className="fp-title-group">
                  <h2 className="fp-title">FORGOT</h2>
                  <h3 className="fp-title2">Password</h3>
                </div>
                <p className="fp-form-subtitle">
                  Enter your registered email address to receive an OTP
                </p>
              </div>

              {error   && <div className="fp-alert fp-alert--error">{error}</div>}
              {success && <div className="fp-alert fp-alert--success">{success}</div>}

              <div className="fp-form-group">
                <label className="fp-label">Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  className="fp-input"
                  autoComplete="email"
                />
              </div>

              {/* Shop Code toggle */}
              <div className="fp-form-group">
                <button
                  type="button"
                  className="fp-toggle-link"
                  onClick={() => setShowShopCode((v) => !v)}
                >
                  {showShopCode ? "▲ Hide Shop Code" : "▼ Store Manager / Cashier? Enter Shop Code"}
                </button>

                {showShopCode && (
                  <input
                    type="text"
                    placeholder="Enter Your Shop's Secret Code (e.g. S2D-XXXXX)"
                    value={shopCode}
                    onChange={(e) => { setShopCode(e.target.value); setError(""); }}
                    className="fp-input fp-input--code"
                    autoCapitalize="characters"
                    autoComplete="off"
                  />
                )}
              </div>

              <button
                type="button"
                className="fp-button"
                onClick={handleSendOtp}
                disabled={loading || !email}
              >
                {loading ? "SENDING OTP…" : "SEND OTP"}
              </button>

              <div className="fp-back-row">
                <button type="button" className="fp-back-btn" onClick={() => navigate("/login")}>
                  ← Back to Login
                </button>
              </div>
            </>
          )}

          {/*  STEP 2: OTP Verification  */}
          {step === 2 && (
            <>
              <div className="fp-form-header">
                <h2 className="fp-title">VERIFY</h2>
                <p className="fp-form-subtitle">
                  Enter the 6-digit OTP sent to <strong>{email}</strong>
                </p>
              </div>

              {error   && <div className="fp-alert fp-alert--error">{error}</div>}
              {success && <div className="fp-alert fp-alert--success">{success}</div>}

              {countdown > 0 && (
                <div className="fp-countdown">
                  OTP expires in{" "}
                  <strong>
                    {String(Math.floor(countdown / 60)).padStart(2, "0")}:
                    {String(countdown % 60).padStart(2, "0")}
                  </strong>
                </div>
              )}

              <div className="fp-form-group">
                <label className="fp-label">One-Time Password</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otpValue}
                  onChange={(e) => {
                    setOtpValue(e.target.value.replace(/\D/g, ""));
                    setError("");
                  }}
                  className="fp-input fp-input--otp"
                />
              </div>

              <button
                type="button"
                className="fp-button"
                onClick={handleVerifyOtp}
                disabled={loading || otpValue.length !== 6}
              >
                {loading ? "VERIFYING…" : "VERIFY OTP"}
              </button>

              <div className="fp-back-row">
                <button
                  type="button"
                  className="fp-resend-btn"
                  onClick={handleResendOtp}
                  disabled={loading || countdown > 0}
                >
                  {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
                </button>
                <button type="button" className="fp-back-btn" onClick={() => { setStep(1); setError(""); setSuccess(""); }}>
                  ← Change Email
                </button>
              </div>
            </>
          )}

          {/*  STEP 3: New Password  */}
          {step === 3 && (
            <>
              <div className="fp-form-header">
                <h2 className="fp-title">RESET</h2>
                <p className="fp-form-subtitle">
                  Choose a strong new password for your account
                </p>
              </div>

              {error   && <div className="fp-alert fp-alert--error">{error}</div>}
              {success && <div className="fp-alert fp-alert--success">{success}</div>}

              <form onSubmit={handleResetPassword}>
                {/* New Password */}
                <div className="fp-form-group">
                  <label className="fp-label">New Password</label>
                  <div className="fp-pw-wrapper">
                    <input
                      type={showNewPw ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                      className="fp-input"
                      required
                    />
                    <button
                      type="button"
                      className="fp-pw-toggle"
                      onClick={() => setShowNewPw((v) => !v)}
                      aria-label={showNewPw ? "Hide password" : "Show password"}
                    >
                      {showNewPw ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>

                  {/* Strength meter */}
                  {newPassword && (
                    <div className="fp-strength">
                      <div className="fp-strength-bar">
                        <div
                          className="fp-strength-fill"
                          style={{ width: strength.width, background: strength.color }}
                        />
                      </div>
                      <span className="fp-strength-label" style={{ color: strength.color }}>
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="fp-form-group">
                  <label className="fp-label">Confirm Password</label>
                  <div className="fp-pw-wrapper">
                    <input
                      type={showConfirmPw ? "text" : "password"}
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                      className={`fp-input ${confirmPassword && confirmPassword !== newPassword ? "fp-input--error" : ""} ${confirmPassword && confirmPassword === newPassword ? "fp-input--match" : ""}`}
                      required
                    />
                    <button
                      type="button"
                      className="fp-pw-toggle"
                      onClick={() => setShowConfirmPw((v) => !v)}
                      aria-label={showConfirmPw ? "Hide password" : "Show password"}
                    >
                      {showConfirmPw ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <span className="fp-field-error">Passwords do not match.</span>
                  )}
                  {confirmPassword && confirmPassword === newPassword && (
                    <span className="fp-field-success">✓ Passwords match.</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="fp-button"
                  disabled={loading || !newPassword || !confirmPassword}
                >
                  {loading ? "RESETTING…" : "RESET PASSWORD"}
                </button>
              </form>
            </>
          )}

          {/*  STEP 4: Success  */}
          {step === 4 && (
            <div className="fp-success-screen">
              <div className="fp-success-icon">🔓</div>
              <h2 className="fp-success-heading">Password Reset!</h2>
              <p className="fp-success-text">
                Your password has been reset successfully.<br />
                You can now log in with your new password.
              </p>
              <button
                type="button"
                className="fp-button"
                onClick={() => navigate("/login")}
              >
                GO TO LOGIN
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;