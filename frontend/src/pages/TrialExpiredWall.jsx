// pages/TrialExpiredWall.jsx
// Shown to shop_admin when their free trial has expired.
// They can upgrade from here. Account is disabled — no access to dashboard.

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/TrialExpiredWall.css";

const TrialExpiredWall = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const trialData = location.state?.trialData || {};

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleUpgrade = () => {
    navigate("/pricing");
  };

  return (
    <div className="trial-container">

      {/* ── Left Panel ── */}
      <div className="trial-left-section">
        <div className="trial-dots-pattern" />
        <div className="trial-left-content">

          <div className="trial-logo">🏪 Shop2Door</div>

          <h1 className="trial-main-heading">
            Your Trial<br />Has Ended
          </h1>

          <p className="trial-description">
            Your 7-day free trial has expired. Upgrade to a paid plan
            to keep your shop active and your data safe.
          </p>

          <div className="trial-warning-card">
            <div className="trial-warning-icon">⏰</div>
            <div className="trial-warning-content">
              <p className="trial-warning-title">Grace Period Active</p>
              <p className="trial-warning-text">
                You have a <strong>3-day grace period</strong> to upgrade before
                your account and all shop data are permanently deleted.
              </p>
            </div>
          </div>

          <div className="trial-grace-badges">
            <div className="trial-grace-badge">
              <span className="trial-grace-badge-dot" />
              Trial Expired
            </div>
            <div className="trial-grace-badge">
              <span className="trial-grace-badge-dot" />
              3 Days Remaining
            </div>
          </div>

        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="trial-right-section">
        <div className="trial-card">

          <div className="trial-icon-wrapper">
            <div className="trial-icon-circle">⏰</div>
          </div>

          <h2 className="trial-card-title">Free Trial Expired</h2>

          <p className="trial-card-subtitle">
            Thank you for trying <strong>Shop2Door</strong>. To continue
            accessing your dashboard and keep your shop data safe, please
            select a paid plan below.
          </p>

          <div className="trial-info-box">
            <div className="trial-info-row">
              <span className="trial-info-icon">📅</span>
              <div>
                <p className="trial-info-title">Trial Status</p>
                <p className="trial-info-text">Your <strong>7-day free trial</strong> has ended. Your shop is currently suspended.</p>
              </div>
            </div>
            <div className="trial-divider" />
            <div className="trial-info-row">
              <span className="trial-info-icon">🔒</span>
              <div>
                <p className="trial-info-title">Data Safety</p>
                <p className="trial-info-text">Your shop data is preserved for <strong>3 more days</strong>. Upgrade to restore access immediately.</p>
              </div>
            </div>
            <div className="trial-divider" />
            <div className="trial-info-row">
              <span className="trial-info-icon">⚡</span>
              <div>
                <p className="trial-info-title">Instant Activation</p>
                <p className="trial-info-text">Once you upgrade, your shop goes live again within minutes.</p>
              </div>
            </div>
          </div>

          <div className="trial-deletion-banner">
            <span className="trial-deletion-icon">⚠️</span>
            <p className="trial-deletion-text">
              <strong>Account Deletion Warning:</strong> If no plan is selected within 3 days
              of your trial ending, your account, shop profile, and all associated data
              will be <strong>permanently deleted</strong>.
            </p>
          </div>

          <button className="trial-upgrade-btn" onClick={handleUpgrade}>
            🚀 Upgrade Now — View Plans
          </button>

          <button className="trial-logout-btn" onClick={handleLogout}>
            Logout
          </button>

          <p className="trial-support-note">
            Need help? Contact us at{" "}
            <a href="mailto:info.shop2door@gmail.com">info.shop2door@gmail.com</a>
          </p>

        </div>
      </div>

    </div>
  );
};

export default TrialExpiredWall;